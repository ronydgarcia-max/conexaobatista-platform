// Utilitário de importação de currículo exportado pelo LinkedIn (PDF ou DOCX).
// Extrai o texto do arquivo e aplica heurísticas para preencher os campos
// do formulário. O resultado é sempre editável antes de salvar.

import * as pdfjsLib from 'pdfjs-dist';
// O worker é resolvido pelo Vite como URL estático.
// eslint-disable-next-line import/no-unresolved
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extrai o texto bruto de um arquivo PDF ou DOCX.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractTextFromPdf(file);
  }
  if (
    name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractTextFromDocx(file);
  }
  // Tenta como texto puro (TXT/RTF simples) como fallback amigável.
  if (name.endsWith('.txt') || file.type === 'text/plain') {
    return file.text();
  }
  throw new Error(
    'Formato não suportado. Exporte seu currículo do LinkedIn em PDF ou DOCX.',
  );
}

async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const parts = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Reconstrói linhas preservando quebras aproximadas por eixo Y.
    const lines = {};
    content.items.forEach((item) => {
      const y = Math.round(item.transform[5]);
      const key = `${y}`;
      if (!lines[key]) lines[key] = { text: item.str };
      else lines[key].text += item.str;
    });
    // Ordena por Y decrescente (topo primeiro) — PDF do LinkedIn costuma
    // ter o conteúdo de cima para baixo.
    const byY = Object.entries(lines)
      .map(([y, v]) => ({ y: Number(y), text: v.text.trim() }))
      .filter((v) => v.text.length > 0)
      .sort((a, b) => b.y - a.y);
    byY.forEach((v) => parts.push(v.text));
    parts.push('');
  }
  return parts.join('\n').trim();
}

async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const mammothModule = await import('mammoth/mammoth.browser');
  const mammoth = mammothModule.default || mammothModule;
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result?.value || '').trim();
}

// ---------------------------------------------------------------------------
// Heurísticas de parsing do formato de exportação do LinkedIn.
// ---------------------------------------------------------------------------

const SECTION_HEADERS = [
  'Resumo',
  'Summary',
  'Experiência',
  'Experience',
  'Formação acadêmica',
  'Education',
  'Habilidades',
  'Skills',
  'Idiomas',
  'Languages',
  'Licenças e certificações',
  'Licenses & certifications',
  'Certifications',
  'Contato',
  'Contact',
];

function normalize(text) {
  return (text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function findEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : '';
}

function findPhone(lines) {
  const phoneRe = /(\+?\d[\d\s().-]{7,}\d)/;
  for (const l of lines) {
    const m = l.match(phoneRe);
    if (m && l.replace(/\D/g, '').length >= 8) return m[1].trim();
  }
  return '';
}

function findUrl(lines, domain) {
  const re = new RegExp(`https?://([a-zA-Z0-9.-]*${domain}[a-zA-Z0-9./_-]*)`, 'i');
  for (const l of lines) {
    const m = l.match(re);
    if (m) return m[0];
  }
  // Também aceita o handle sem protocolo.
  const handleRe = new RegExp(`(${domain}/[a-zA-Z0-9._-]+)`, 'i');
  for (const l of lines) {
    const m = l.match(handleRe);
    if (m) return `https://${m[1]}`;
  }
  return '';
}

function splitSections(lines) {
  const sections = {};
  let current = 'topo';
  sections[current] = [];
  for (const l of lines) {
    const matched = SECTION_HEADERS.find(
      (h) => l.toLowerCase() === h.toLowerCase(),
    );
    if (matched) {
      current = matched.toLowerCase();
      sections[current] = [];
    } else {
      sections[current].push(l);
    }
  }
  return sections;
}

function parseDateRange(line) {
  // Formatos comuns: "jan de 2020 – Presente", "Jan 2020 - Present",
  // "2020 - 2022", "01/2020 – 03/2022".
  const range = line.match(
    /(.*?)\s*(?:–|-|—|a|to)\s*(.*)/,
  );
  if (!range) return { inicio: '', fim: '' };
  return { inicio: cleanDate(range[1]), fim: cleanDate(range[2]) };
}

function cleanDate(s) {
  if (!s) return '';
  const t = s.trim();
  if (/presente|present|atual|current/i.test(t)) return '';
  // Tenta converter "jan de 2020" -> "2020-01"
  const months = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
    january: '01', february: '02', march: '03', april: '04', may: '05',
    june: '06', july: '07', august: '08', september: '09', october: '10',
    november: '11', december: '12',
  };
  const m = t.match(/([a-zç]{3,9})\b.*?(\d{4})/i);
  if (m) {
    const mon = months[m[1].toLowerCase().slice(0, 3)] || months[m[1].toLowerCase()];
    if (mon) return `${m[2]}-${mon}`;
  }
  const yearOnly = t.match(/(\d{4})/);
  if (yearOnly) return yearOnly[1];
  const br = t.match(/(\d{2})\/(\d{4})/);
  if (br) return `${br[2]}-${br[1]}`;
  return t;
}

function parseExperiences(lines) {
  // Agrupa blocos: cada experiência costuma ter cargo, empresa, período e
  // descrição. Heurística: uma linha com período (contém ano de 4 dígitos ou
  // "presente") inicia/separa um bloco.
  const blocks = [];
  let cur = null;
  for (const l of lines) {
    const hasDate = /\d{4}|presente|present|atual/i.test(l);
    if (hasDate && l.length < 60) {
      if (cur) blocks.push(cur);
      cur = { cargo: '', empresa: '', data_inicio: '', data_fim: '', emprego_atual: /presente|present|atual/i.test(l), descricao: '', modalidade: '' };
      const { inicio, fim } = parseDateRange(l);
      cur.data_inicio = inicio;
      cur.data_fim = fim;
    } else if (cur) {
      if (!cur.cargo) cur.cargo = l;
      else if (!cur.empresa) cur.empresa = l;
      else cur.descricao += (cur.descricao ? '\n' : '') + l;
    } else {
      // Linha antes do primeiro período: pode ser cargo/empresa.
      cur = { cargo: l, empresa: '', data_inicio: '', data_fim: '', emprego_atual: false, descricao: '', modalidade: '' };
    }
  }
  if (cur) blocks.push(cur);
  return blocks.filter((b) => b.cargo || b.empresa);
}

function parseEducation(lines) {
  const blocks = [];
  let cur = null;
  for (const l of lines) {
    const hasDate = /\d{4}|presente|present|cursando/i.test(l);
    if (hasDate && l.length < 60) {
      if (cur) blocks.push(cur);
      cur = { instituicao: '', curso: '', grau: '', data_inicio: '', data_conclusao: '', status: '' };
      const { inicio, fim } = parseDateRange(l);
      cur.data_inicio = inicio;
      cur.data_conclusao = fim;
      cur.status = /cursando|presente|present/i.test(l) ? 'cursando' : 'concluido';
    } else if (cur) {
      if (!cur.instituicao) cur.instituicao = l;
      else if (!cur.curso) cur.curso = l;
    } else {
      cur = { instituicao: l, curso: '', grau: '', data_inicio: '', data_conclusao: '', status: '' };
    }
  }
  if (cur) blocks.push(cur);
  return blocks.filter((b) => b.instituicao || b.curso);
}

function parseSkills(lines) {
  return lines
    .filter((l) => l.length > 1 && l.length < 60 && !/^\d+$/.test(l))
    .slice(0, 30)
    .map((nome) => ({ nome, nivel: 'intermediario' }));
}

function parseLanguages(lines) {
  const result = [];
  for (const l of lines) {
    const m = l.match(/^(.+?)\s*[-–—:]\s*(.+)$/);
    if (m) {
      result.push({ idioma: m[1].trim(), nivel: mapLangLevel(m[2].trim()) });
    } else if (l.length < 40) {
      result.push({ idioma: l, nivel: 'intermediario' });
    }
  }
  return result.slice(0, 10);
}

function mapLangLevel(s) {
  const t = s.toLowerCase();
  if (/nativo|native/.test(t)) return 'nativo';
  if (/fluente|fluent|bilingual/.test(t)) return 'fluente';
  if (/avanç|advanc/.test(t)) return 'avancado';
  if (/básic|basic|beginn/.test(t)) return 'basico';
  return 'intermediario';
}

function parseCertifications(lines) {
  const blocks = [];
  let cur = null;
  for (const l of lines) {
    const hasDate = /\d{4}|emitido|issued/i.test(l);
    if (hasDate && l.length < 60) {
      if (cur) blocks.push(cur);
      const year = l.match(/(\d{4})/);
      cur = { curso: '', instituicao: '', data_conclusao: year ? year[1] : '', url: '' };
    } else if (cur) {
      if (!cur.curso) cur.curso = l;
      else if (!cur.instituicao) cur.instituicao = l;
    } else {
      cur = { curso: l, instituicao: '', data_conclusao: '', url: '' };
    }
  }
  if (cur) blocks.push(cur);
  return blocks.filter((b) => b.curso);
}

/**
 * Converte o texto extraído em um objeto de dados do currículo.
 * @param {string} rawText
 * @returns {object}
 */
export function parseLinkedInText(rawText) {
  const lines = normalize(rawText);
  const sections = splitSections(lines);
  const topo = sections.topo || [];

  const nome = topo[0] || '';
  const headline = topo[1] || '';
  const email = findEmail(rawText);
  const telefone = findPhone(lines);
  const linkedin = findUrl(lines, 'linkedin');
  const portfolio = findUrl(lines, 'github') || findUrl(lines, 'behance') || findUrl(lines, 'portifolio') || findUrl(lines, 'portfolio');

  const resumo = (sections['resumo'] || sections['summary'] || []).join('\n');

  const experiencias = parseExperiences(
    sections['experiência'] || sections['experience'] || [],
  );
  const formacoes = parseEducation(
    sections['formação acadêmica'] || sections['education'] || [],
  );
  const habilidades = parseSkills(
    sections['habilidades'] || sections['skills'] || [],
  );
  const idiomas = parseLanguages(
    sections['idiomas'] || sections['languages'] || [],
  );
  const certificacoes = parseCertifications(
    sections['licenças e certificações'] ||
      sections['licenses & certifications'] ||
      sections['certifications'] ||
      [],
  );

  return {
    curriculo: {
      nome_completo: nome,
      email,
      telefone,
      linkedin_url: linkedin,
      portfolio_url: portfolio,
      resumo_profissional: resumo,
      objetivo: headline,
      fonte_origem: 'linkedin',
    },
    experiencias,
    formacoes,
    habilidades,
    idiomas,
    certificacoes,
  };
}

export const EMPTY_CURRICULO = {
  curriculo: {
    nome_completo: '',
    cpf: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    linkedin_url: '',
    portfolio_url: '',
    cep: '',
    logradouro: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    resumo_profissional: '',
    objetivo: '',
    pretensao_salarial: '',
    tipo_contrato: '',
    disponibilidade_viagem: false,
    disponibilidade_mudanca: false,
    regime_trabalho: '',
    arquivo_curriculo_url: '',
    lgpd_consentimento: false,
    visibilidade_perfil: 'membros',
    fonte_origem: 'manual',
    status: 'rascunho',
  },
  experiencias: [],
  formacoes: [],
  habilidades: [],
  idiomas: [],
  certificacoes: [],
};
