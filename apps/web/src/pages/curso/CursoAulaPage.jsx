import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Loader2, AlertCircle, ArrowLeft, ArrowRight, Download, FileText, Presentation,
    RefreshCw, BookOpen, Clock, User, ListChecks, Lock, FileX, Video,
    Image as ImageIcon, ClipboardCheck, CheckCircle2, PenLine, CalendarDays,
} from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';
import pb from '@/lib/pocketbaseClient';
import { getAulas, getPdfAula, concluirAula, getProgresso, verificarMatriculaApi, cancelarMatricula } from '@/services/cursosService';
import { capturarTokenDaUrl } from '@/services/cursosAuthService';

// Configura o worker do pdf.js (já instalado no projeto). Usamos o build
// minificado via import `?url` para que o Vite o sirva como asset estático.
// O workerSrc DEVE ser string — se o bundler devolver um módulo/objeto,
// o pdf.js 6.x pode falhar com erros de tipo ao inicializar o worker.
import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line import/no-unresolved
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
{
    const workerSrc = typeof pdfjsWorker === 'string'
        ? pdfjsWorker
        : (typeof pdfjsWorker?.default === 'string'
            ? pdfjsWorker.default
            : (typeof pdfjsWorker?.href === 'string' ? pdfjsWorker.href : ''));
    if (workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    }
}

// Normaliza um curso da API pública para o formato de exibição. NÃO busca PDF
// aqui — o PDF vem das aulas (aulas.material_pdf_url).
function normalizarCurso(c) {
    if (!c) return null;
    const carga = Number(c.carga_horaria);
    return {
        id: c.id,
        imagem: c.imagem_url || c.img || '',
        titulo: c.titulo || c.title || '',
        categoria: c.categoria || c.category || '',
        area: c.subcategoria || c.area || '',
        mentor: c.mentor_nome || c.instrutor || c.autor || c.mentor || '',
        descricao: c.descricao || c.description || '',
        cargaHoraria: Number.isFinite(carga) && carga > 0 ? `${carga}h` : '',
        cargaHorariaHoras: Number.isFinite(carga) && carga > 0 ? carga : null,
        objetivos: c.objetivos || c.objetivo || c.goals || '',
        publicoAlvo: c.publico_alvo || c.publicoAlvo || c.publico || '',
        prerequisitos: c.pre_requisitos || c.preRequisitos || c.prerequisites || '',
        matrizCurricular: c.matriz_curricular || '',
        dataCriacao: c.created_at || c.criado_em || c.data_criacao || '',
    };
}

// Formata uma data ISO (created_at) para DD/MM/YYYY (Brasília).
function formatarDataBR(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch (_) {
        return '';
    }
}

// Extrai uma URL válida a partir de valores heterogêneos da VPS.
// Aceita: string direta; objeto com url/secure_url/href/src/path/link;
// número convertido; null/undefined/inválido → "".
// NUNCA retorna não-string — evita "url.startsWith is not a function"
// (pdf.js e âncoras de download chamam métodos de string na URL).
function extrairUrlSegura(valor, profundidade = 0) {
    if (valor == null || profundidade > 3) return '';
    if (typeof valor === 'string') {
        const t = valor.trim();
        if (!t || t === 'null' || t === 'undefined' || t === '[object Object]') return '';
        return t;
    }
    if (typeof valor === 'number' && Number.isFinite(valor)) {
        return String(valor);
    }
    if (typeof valor === 'object') {
        // URL nativa do browser
        if (typeof URL !== 'undefined' && valor instanceof URL) {
            return valor.href || '';
        }
        // Arrays: primeiro elemento útil
        if (Array.isArray(valor)) {
            for (let i = 0; i < valor.length; i += 1) {
                const found = extrairUrlSegura(valor[i], profundidade + 1);
                if (found) return found;
            }
            return '';
        }
        // Objetos Cloudinary / API: tenta chaves comuns
        const chaves = [
            'url', 'secure_url', 'secureUrl', 'href', 'src', 'path',
            'link', 'download_url', 'downloadUrl', 'file_url', 'fileUrl',
            'conteudo_url', 'conteudoUrl', 'pdf_url', 'pdfUrl',
            'material_pdf_url', 'materialPdfUrl', 'video_url', 'videoUrl',
            'imagem_url', 'imagemUrl', 'public_url', 'publicUrl',
        ];
        for (let i = 0; i < chaves.length; i += 1) {
            if (Object.prototype.hasOwnProperty.call(valor, chaves[i])) {
                const found = extrairUrlSegura(valor[chaves[i]], profundidade + 1);
                if (found) return found;
            }
        }
        // Último recurso: se o objeto tem toString customizado útil
        if (typeof valor.toString === 'function') {
            const s = valor.toString();
            if (s && s !== '[object Object]' && /^https?:\/\//i.test(s)) {
                return s.trim();
            }
        }
    }
    return '';
}

// Valida se uma URL (já normalizada para string) é uma URL HTTP(S) absoluta
// utilizável para fetch/download. Retorna true apenas para strings que
// começam com http:// ou https://.
function ehUrlHttpValida(url) {
    if (typeof url !== 'string') return false;
    const t = url.trim();
    if (!t) return false;
    return /^https?:\/\//i.test(t);
}

// Carrega um PDF no pdf.js a partir de BYTES (Uint8Array/ArrayBuffer).
// Preferimos este caminho em vez de getDocument({ url }) porque o pdf.js 6.x
// converte a string em URL object (getUrlProp) e trechos internos podem
// chamar `.startsWith` sobre esse objeto → "url.startsWith is not a function".
// Com `{ data }` o worker recebe só os bytes — sem path de URL.
async function carregarPdfDeBytes(data) {
    if (!data) {
        throw new Error('Material de slides indisponível para esta aula.');
    }
    let bytes;
    if (data instanceof Uint8Array) {
        // Garante buffer próprio (byteOffset 0) — pdf.js exige isso em alguns casos.
        bytes = data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
            ? data
            : new Uint8Array(data);
    } else if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
    } else if (ArrayBuffer.isView(data)) {
        bytes = new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    } else {
        throw new Error('Material de slides indisponível para esta aula.');
    }
    if (bytes.byteLength < 5) {
        throw new Error('O arquivo de slides está vazio ou corrompido.');
    }
    return pdfjsLib.getDocument({ data: bytes }).promise;
}

// Baixa uma URL HTTP(S) pública (ex.: Cloudinary raw/upload com CORS *) e
// devolve o PDF via getDocument({ data }). Nunca passa a URL ao pdf.js.
async function carregarPdfDeUrlHttp(url) {
    const urlSegura = extrairUrlSegura(url);
    if (!ehUrlHttpValida(urlSegura)) {
        throw new Error('Material de slides indisponível para esta aula.');
    }
    let res;
    try {
        res = await fetch(urlSegura, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            redirect: 'follow',
            cache: 'force-cache',
        });
    } catch (e) {
        const msg = String(e?.message || e || '');
        if (/Failed to fetch|NetworkError|CORS|cross-origin/i.test(msg)) {
            throw new Error('Não foi possível carregar os slides agora. Tente novamente em instantes.');
        }
        throw new Error(msg || 'Não foi possível carregar os slides agora. Tente novamente em instantes.');
    }
    if (!res.ok) {
        if (res.status === 404) {
            throw new Error('Material de slides indisponível para esta aula.');
        }
        throw new Error('Não foi possível carregar os slides agora. Tente novamente em instantes.');
    }
    const buf = await res.arrayBuffer();
    return carregarPdfDeBytes(buf);
}

// Força o download em vez de abrir no navegador/plugin do Adobe.
// Cloudinary: "fl_attachment" faz o servidor responder com
// "Content-Disposition: attachment", forçando o download do PDF.
function urlParaDownload(url) {
    const u = extrairUrlSegura(url);
    if (!u) return '';
    if (u.includes('res.cloudinary.com') && !u.includes('fl_attachment')) {
        return u.replace(/\/(image|raw|video)\/upload\//, '/$1/upload/fl_attachment/');
    }
    return u;
}

// Converte mensagens técnicas de erro (ex.: "url.startsWith is not a
// function", "Invalid PDF url data", erros de rede internos do pdf.js) em
// mensagens amigáveis em PT-BR, preservando mensagens já amigáveis.
function mensagemAmigavelErro(msg) {
    const m = String(msg || '').trim();
    if (!m) return 'Material indisponível para esta aula.';
    if (/startsWith is not a function/i.test(m)) {
        return 'A URL dos slides não pôde ser carregada. Contate o mentor para corrigir o material.';
    }
    if (/Invalid PDF url data/i.test(m)) {
        return 'A URL dos slides é inválida. Contate o mentor para corrigir o material.';
    }
    if (/Failed to fetch|NetworkError|CORS|cross-origin/i.test(m)) {
        return 'Não foi possível carregar os slides agora. Tente novamente em instantes.';
    }
    return m;
}

// Extrai o campo OFICIAL do PDF de uma aula: `material_pdf_url`.
function materialPdfDaAula(aula) {
    if (!aula) return '';
    return extrairUrlSegura(aula.material_pdf_url);
}

function videoUrlDaAula(aula) {
    if (!aula) return '';
    return extrairUrlSegura(aula.video_url);
}

// Campo `youtube_id` da VPS — pode conter um ID puro (11 caracteres) ou uma
// URL completa do YouTube (watch, youtu.be, embed, shorts, com parâmetros).
function youtubeIdDaAula(aula) {
    if (!aula) return '';
    return extrairUrlSegura(aula.youtube_id);
}

function imagemUrlDaAula(aula) {
    if (!aula) return '';
    return extrairUrlSegura(aula.imagem_url) || extrairUrlSegura(aula.imagem);
}

// Extrai o ID (11 caracteres) de um vídeo do YouTube a partir de vários
// formatos: ID puro, URL watch (?v=…), youtu.be/…, /embed/…, /shorts/…,
// inclusive URLs com parâmetros adicionais (&t=, &feature=, ?si=, etc.).
// Retorna "" quando não há um ID válido (valor ausente/inválido).
function extrairYoutubeId(valor) {
    if (!valor || typeof valor !== 'string') return '';
    const v = valor.trim();
    if (!v) return '';
    // ID puro (exatamente 11 caracteres: letras, números, - e _).
    if (/^[\w-]{11}$/.test(v)) return v;
    // youtu.be/<id>
    let m = v.match(/youtu\.be\/([\w-]{11})/);
    if (m) return m[1];
    // youtube.com/watch?v=<id> (ou qualquer ?v=/&v= com params extras)
    m = v.match(/[?&]v=([\w-]{11})/);
    if (m) return m[1];
    // youtube.com/embed/<id>
    m = v.match(/youtube\.com\/embed\/([\w-]{11})/);
    if (m) return m[1];
    // youtube.com/shorts/<id>
    m = v.match(/youtube\.com\/shorts\/([\w-]{11})/);
    if (m) return m[1];
    return '';
}

// Monta a URL de embed do YouTube a partir de um ID puro ou de uma URL
// completa. Retorna "" quando não é possível extrair um ID válido.
function youtubeEmbedUrl(valor) {
    const id = extrairYoutubeId(valor);
    return id ? `https://www.youtube.com/embed/${id}` : '';
}

// Extrai a prova associada a uma aula (etapa). Associação DINÂMICA prova↔etapa.
// Fonte primária: mapa `provas_por_aula` construído pelo backend a partir dos
// campos de prova que a VPS devolver em cada aula. Fallback: detectar campos
// de prova diretamente no objeto da aula (future-proof).
// Retorna null quando a aula NÃO tem prova (nenhum dado é simulado).
function extrairProvaDaAula(a, provasPorAula) {
    if (!a) return null;
    const aulaId = String(a.id ?? a.aula_id ?? '');
    if (provasPorAula && provasPorAula[aulaId]) {
        return provasPorAula[aulaId];
    }
    const provaObj = a.prova && typeof a.prova === 'object' ? a.prova : null;
    const provaId = provaObj?.id ?? a.prova_id ?? null;
    const temProva = Boolean(provaObj)
        || Boolean(a.prova_id)
        || a.tem_prova === true
        || (Array.isArray(a.provas) && a.provas.length > 0);
    if (!temProva) return null;
    const status = provaObj?.status ?? a.prova_status ?? 'pendente';
    return {
        aula_id: aulaId,
        prova_id: provaId,
        titulo: provaObj?.titulo ?? provaObj?.titulo_prova ?? null,
        status,
        prova: provaObj,
    };
}

// Campo `conteudo_url` da VPS — URL do conteúdo principal da aula:
// deck de slides (PDF) para tipo=slide, arquivo de vídeo (mp4) para
// tipo=video+upload, ou imagem para tipo=imagem.
// Pode vir como string, objeto (Cloudinary/API) ou nulo — sempre normaliza.
function conteudoUrlDaAula(aula) {
    if (!aula) return '';
    return extrairUrlSegura(aula.conteudo_url)
        || extrairUrlSegura(aula.conteudoUrl)
        || extrairUrlSegura(aula.url);
}

// Normaliza uma aula da VPS para exibição. A seleção da mídia é ORIENTADA
// PELO TIPO (campo `tipo` da aula: slide | video | imagem | pdf), usando o
// subtipo `video_type` (youtube | upload) apenas quando tipo=video. A
// presença isolada de youtube_id, video_url ou video_type NÃO classifica a
// aula como vídeo do YouTube — isso evita exibir "Vídeo indisponível" em
// aulas de slide/imagem que por acaso tenham video_type=youtube herdado.
// Genérico: funciona para qualquer curso, independente da quantidade,
// ordem ou combinação de slides, vídeos YouTube, vídeos enviados, imagens
// e PDFs. Fallback conservador apenas quando `tipo` está ausente.
function normalizarAula(a, idx, provasPorAula) {
    if (!a) return null;
    const tipo = String(a.tipo || '').toLowerCase().trim();
    const videoType = String(a.video_type || '').toLowerCase().trim();
    const conteudoUrl = conteudoUrlDaAula(a);
    const pdfUrl = materialPdfDaAula(a);        // material_pdf_url (apoio)
    const legacyVideoUrl = videoUrlDaAula(a);   // video_url (legado)
    const legacyImagemUrl = imagemUrlDaAula(a); // imagem_url/imagem (legado)
    const youtubeIdRaw = youtubeIdDaAula(a);
    const ytId = extrairYoutubeId(youtubeIdRaw) || extrairYoutubeId(legacyVideoUrl);
    const youtubeEmbed = ytId ? `https://www.youtube.com/embed/${ytId}` : '';
    const numSlides = Number.isFinite(Number(a.num_slides)) ? Number(a.num_slides) : null;

    let tipoMidia = 'nenhum';
    let slideUrl = '';
    let videoUrl = '';
    let imagemUrl = '';

    if (tipo === 'slide') {
        // Apresentação — deck de slides em PDF (`conteudo_url`).
        // Mantém tipoMidia=slide mesmo sem URL (mensagem clara, sem quebrar).
        slideUrl = conteudoUrl || pdfUrl;
        tipoMidia = 'slide';
    } else if (tipo === 'video') {
        if (videoType === 'youtube') {
            // Vídeo do YouTube — exige youtube_id válido (ID puro ou URL).
            tipoMidia = youtubeEmbed ? 'youtube' : 'youtube_invalido';
        } else if (videoType === 'upload') {
            // Vídeo enviado (Cloudinary) — arquivo em `conteudo_url`.
            videoUrl = conteudoUrl || legacyVideoUrl;
            tipoMidia = videoUrl ? 'video' : 'video_invalido';
        } else {
            // Subtipo desconhecido: tenta YouTube, depois arquivo enviado.
            if (youtubeEmbed) {
                tipoMidia = 'youtube';
            } else if ((conteudoUrl || legacyVideoUrl)) {
                videoUrl = conteudoUrl || legacyVideoUrl;
                tipoMidia = 'video';
            } else {
                tipoMidia = 'video_invalido';
            }
        }
    } else if (tipo === 'imagem') {
        imagemUrl = conteudoUrl || legacyImagemUrl;
        tipoMidia = imagemUrl ? 'imagem' : 'imagem_invalida';
    } else if (tipo === 'pdf') {
        tipoMidia = pdfUrl ? 'pdf' : 'nenhum';
    } else {
        // `tipo` ausente/desconhecido — fallback conservador por campos,
        // sem classificar como YouTube apenas por video_url/youtube_id.
        if (pdfUrl) {
            tipoMidia = 'pdf';
        } else if (legacyImagemUrl) {
            imagemUrl = legacyImagemUrl;
            tipoMidia = 'imagem';
        } else if (legacyVideoUrl) {
            videoUrl = legacyVideoUrl;
            tipoMidia = 'video';
        } else if (conteudoUrl) {
            if (/\.pdf(\?|$)/i.test(conteudoUrl)) {
                slideUrl = conteudoUrl;
                tipoMidia = 'slide';
            } else if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(conteudoUrl)) {
                videoUrl = conteudoUrl;
                tipoMidia = 'video';
            } else {
                imagemUrl = conteudoUrl;
                tipoMidia = 'imagem';
            }
        }
    }

    const prova = extrairProvaDaAula(a, provasPorAula);
    // Conclusão real da aula (campos `concluida` e `concluida_em` devolvidos
    // pela VPS a partir de 02/09/2026 — sistema de progresso confirmado).
    const concluida = a.concluida === true || a.concluida === 'true' || a.concluida === 1;
    const concluidaEm = a.concluida_em || a.concluidaEm || null;
    return {
        id: a.id ?? a.aula_id ?? String(idx + 1),
        titulo: a.titulo || a.nome || `Aula ${idx + 1}`,
        ordem: a.ordem ?? a.numero ?? idx + 1,
        tipo,
        pdfUrl,
        slideUrl,
        videoUrl,
        imagemUrl,
        youtubeId: ytId,
        youtubeEmbed,
        numSlides,
        temPdf: Boolean(pdfUrl),
        temSlide: Boolean(slideUrl),
        temVideo: Boolean(videoUrl) || Boolean(youtubeEmbed),
        temImagem: Boolean(imagemUrl),
        tipoMidia,
        prova,
        temProva: Boolean(prova),
        provaId: prova?.prova_id || '',
        provaConcluida: prova?.status === 'concluida',
        concluida,
        concluidaEm,
    };
}

function parseMatriz(texto) {
    if (!texto || typeof texto !== 'string') return [];
    return texto
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .filter((l) => !/^matriz\s+curricular$/i.test(l));
}

// Página de aula com leitor de PDF integrado, cabeçalho compacto e prova
// integrada como etapa final do curso.
//
// MELHORIA (31/08/2026 — experiência da tela de aulas):
//   1. Cabeçalho compacto: nome do curso + duração discreta (sem faixa azul
//      grande, sem espaço desperdiçado).
//   2. Informações do curso em seção menor (categoria, área, autor, data de
//      criação) exibidas de forma discreta abaixo do título.
//   3. Leitor PDF maximizado: canvas ocupa praticamente toda a área central
//      disponível (ajustado à largura/altura úteis, proporção preservada,
//      rolagem quando necessário).
//   4. Prova integrada: consulta a VPS (GET /cursos/:id/prova); se existir,
//      exibe a prova como item adicional na sidebar (Pendente/Concluída) e
//      substitui o botão "Próxima" por "Fazer prova" na última aula.
//   5. Renderização condicional de mídia mantida (vídeo → imagem → PDF →
//      "Material indisponível").
//
// Mantém intactos: matrícula, SSO, autenticação, permissões e backend VPS.
export default function CursoAulaPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [curso, setCurso] = useState(null);
    const [carregandoCurso, setCarregandoCurso] = useState(true);
    const [erroCurso, setErroCurso] = useState('');

    const [aulas, setAulas] = useState([]);
    const [carregandoAulas, setCarregandoAulas] = useState(true);
    const [erroAulas, setErroAulas] = useState('');
    // Estado real de matrícula consultado à API quando o carregamento das
    // aulas falha (401/403). Distingue "não matriculado" (mostra inscrição)
    // de "sessão expirada" (mostra renovar acesso). Não reutiliza cache.
    const [naoMatriculado, setNaoMatriculado] = useState(false);
    const [aulaSelecionada, setAulaSelecionada] = useState(null);
    // Conclusão de aula (avanço real via POST /cursos/:id/aulas/:aulaId/concluir).
    const [concluindoAula, setConcluindoAula] = useState(false);
    const [erroConclusao, setErroConclusao] = useState('');

    // Curso concluído (última aula + eventual prova da última etapa).
    const [cursoConcluido, setCursoConcluido] = useState(false);

    const [pdfDoc, setPdfDoc] = useState(null);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [renderizando, setRenderizando] = useState(false);
    const [erroPdf, setErroPdf] = useState('');
    const [carregandoPdf, setCarregandoPdf] = useState(false);

    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);

    // Reset IMEDIATO (durante o render) do estado do PDF quando a aula
    // selecionada OU a URL ativa (slide/PDF) muda. Sem isto, um `erroPdf`
    // STALE de uma aula/URL anterior (ex.: aula de slide com URL inválida)
    // aparece como "Material de slides indisponível" na nova aula durante
    // o único render que ocorre antes do useEffect de carregamento rodar e
    // limpar o estado. Padrão React recomendado ("adjusting state when props
    // change"): o setState em render descarta o render atual e re-renderiza
    // sem commit. A chave composta (aula + tipo de mídia + URL ativa) garante
    // o reset também quando a URL muda sem trocar de aula — geral para todos
    // os cursos, sem regras especiais por curso ou bloco.
    const [prevPdfKey, setPrevPdfKey] = useState('');
    const pdfKeyAtual = `${aulaSelecionada?.id || ''}|${aulaSelecionada?.tipoMidia || 'nenhum'}|${extrairUrlSegura(aulaSelecionada?.slideUrl)}|${extrairUrlSegura(aulaSelecionada?.pdfUrl)}`;
    if (pdfKeyAtual !== prevPdfKey) {
        setPrevPdfKey(pdfKeyAtual);
        setPdfDoc(null);
        setTotalPaginas(0);
        setPaginaAtual(1);
        setErroPdf('');
        // Mantém "carregando" quando a nova mídia é slide/PDF — evita um
        // frame com mensagem de erro/indisponível antes do useEffect rodar.
        const midiaPdf = aulaSelecionada?.tipoMidia === 'slide'
            || aulaSelecionada?.tipoMidia === 'pdf';
        setCarregandoPdf(Boolean(midiaPdf && aulaSelecionada?.id));
    }

    // Captura o token SSO recebido na URL (após o SSO) para a sessão atual e
    // remove-o da barra de endereço. O token é guardado em sessionStorage
    // (não localStorage) pelo cursosAuthService e enviado em todas as
    // requisições reais a /aluno/cursos/:id/aulas via o header x-cursos-token
    // (o backend o repassa como Authorization: Bearer para a VPS).
    // Sem token na URL (navegação interna) → nada faz.
    useEffect(() => {
        capturarTokenDaUrl();
        if (searchParams.has('token')) {
            const clean = new URLSearchParams(searchParams);
            clean.delete('token');
            navigate(
                { search: clean.toString() ? `?${clean.toString()}` : '' },
                { replace: true },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Carrega os detalhes do curso (proxy público) — cabeçalho e sidebar.
    useEffect(() => {
        let cancelado = false;
        async function carregar() {
            setCarregandoCurso(true);
            setErroCurso('');
            try {
                const res = await apiServerClient.fetch(
                    `/cursos-publicados/${encodeURIComponent(id)}`,
                );
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Curso não encontrado ou não publicado.');
                    throw new Error('Falha ao carregar o curso.');
                }
                const data = await res.json();
                if (cancelado) return;
                const encontrado = data.curso ? normalizarCurso(data.curso) : null;
                if (!encontrado) {
                    setErroCurso('Curso não encontrado ou não publicado.');
                } else {
                    setCurso(encontrado);
                }
            } catch (e) {
                if (!cancelado) setErroCurso(e?.message || 'Não foi possível carregar este curso.');
            } finally {
                if (!cancelado) setCarregandoCurso(false);
            }
        }
        carregar();
        return () => { cancelado = true; };
    }, [id]);

    // Carrega as aulas do curso (proxy autenticado → VPS).
    useEffect(() => {
        let cancelado = false;
        async function carregarAulas() {
            setCarregandoAulas(true);
            setErroAulas('');
            setNaoMatriculado(false);
            try {
                // ===== CONSULTA DE MATRÍCULA REAL NA VPS (antes de carregar aulas) =====
                // Antes de chamar getAulas (que dispara a renovação do bridge-login
                // e o loop "renovar e tentar de novo"), consulta a fonte oficial de
                // matrículas da VPS (GET /cursos/meus). Se a VPS confirmar que o
                // aluno NÃO está matriculado (matrícula excluída no painel
                // administrativo da VPS), mostra "Você ainda não está matriculado",
                // remove o registro local stale do PocketBase (cache) e NÃO chama
                // getAulas — portanto NÃO tenta renovar o bridge-login nem exibe
                // "Sua sessão na plataforma expirou". Se a consulta não puder ser
                // concluída (disponivel=false, VPS indisponível/rede), preserva o
                // curso e segue para getAulas (fallback seguro).
                if (pb.authStore.isValid) {
                    try {
                        const chk = await verificarMatriculaApi(id);
                        if (cancelado) return;
                        if (chk.disponivel && !chk.matriculado) {
                            // VPS confirmou: aluno não está matriculado.
                            // Remove o registro local stale (cache PocketBase)
                            // para que não reapareça em "Meus Cursos".
                            try { await cancelarMatricula(id); } catch (_) {}
                            if (cancelado) return;
                            setNaoMatriculado(true);
                            setErroAulas('');
                            return;
                        }
                    } catch (_) {
                        // Consulta de matrícula indisponível — segue para getAulas
                        // (não bloqueia o acesso por falha transitória).
                    }
                }

                const data = await getAulas(id);
                if (cancelado) return;
                const lista = Array.isArray(data?.aulas) ? data.aulas : [];
                const provasPorAula = data?.provas_por_aula || {};
                const normalizadas = lista.map((a, i) => normalizarAula(a, i, provasPorAula)).filter(Boolean);
                // Ordena por `ordem` (1, 2, 3, 4…) para a navegação sequencial
                // Anterior/Próxima funcionar independentemente da ordem de chegada.
                normalizadas.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
                setAulas(normalizadas);
                const primeiraComMidia = normalizadas.find((a) => a.tipoMidia !== 'nenhum');
                // Honra ?aula=<id> (ex.: retorno da prova → próxima etapa).
                const aulaParam = searchParams.get('aula');
                const alvo = aulaParam
                    ? normalizadas.find((a) => String(a.id) === String(aulaParam))
                    : null;
                setAulaSelecionada(alvo || primeiraComMidia || normalizadas[0] || null);

                // ===== INICIALIZAÇÃO DE NOVA MATRÍCULA =====
                // Após cancelar e re-inscrever, a VPS pode devolver registros
                // antigos de progresso_aulas (campos `concluida`/`concluida_em`
                // em cada aula) da matrícula anterior — eles persistem na VPS
                // mesmo após o cancelamento. Consulta o progresso REAL
                // (GET /cursos/:id/progresso → { total_aulas, aulas_concluidas,
                // percentual }) e, se for 0% (ou sem registros), LIMPA o
                // estado antigo de conclusão (aulas concluídas + curso
                // concluído) para NÃO exibir o curso como concluído em uma
                // matrícula nova. Se o progresso real for 100%, marca o curso
                // como concluído. NÃO exclui dados da VPS — apenas descarta o
                // estado local stale exibido.
                try {
                    const prog = await getProgresso(id);
                    if (cancelado) return;
                    const percentual = Number(prog?.percentual) || 0;
                    const aulasConcluidas = Number(prog?.aulas_concluidas) || 0;
                    if (percentual === 0 && aulasConcluidas === 0) {
                        // Nova matrícula sem progresso — descarta conclusão
                        // stale devolvida pela VPS para a aula.
                        setAulas((prev) => prev.map((a) => ({
                            ...a,
                            concluida: false,
                            concluidaEm: null,
                        })));
                        setCursoConcluido(false);
                    } else if (percentual >= 100) {
                        setCursoConcluido(true);
                    }
                } catch (_) {
                    // Progresso indisponível — não assume conclusão em
                    // matrícula nova e não descarta o estado da VPS (pode ser
                    // real). Mantém cursoConcluido=false (default inicial).
                    if (!cancelado) setCursoConcluido(false);
                }
            } catch (e) {
                if (cancelado) return;
                const msgErr = String(e?.message || '');
                // Só redireciona para /login quando a sessão PocketBase
                // (base do SSO) está realmente inválida. 401/403 da VPS
                // (sessão de cursos expirada ou falta de matrícula) NÃO
                // redirecionam para /login — exibem mensagem + tentar de novo.
                if (e?.status === 401 && !pb.authStore.isValid) {
                    navigate(`/login?redirect=${encodeURIComponent(`/curso/${id}/aula`)}`, { replace: true });
                    return;
                }
                // 401/403 com sessão PocketBase válida: consulta o estado REAL
                // de matrícula na API da VPS (fonte oficial) para distinguir
                // "não matriculado" de "sessão de cursos expirada". O proxy da
                // VPS pode mascarar 403 (não matriculado) como 401, então a
                // verificação real da VPS é a fonte da verdade — sem reutilizar
                // o cache PocketBase (que mantém registros stale após exclusão
                // no painel administrativo da VPS).
                if ((e?.status === 401 || e?.status === 403) && pb.authStore.isValid) {
                    try {
                        const chk = await verificarMatriculaApi(id);
                        if (cancelado) return;
                        if (chk.disponivel && !chk.matriculado) {
                            // VPS confirmou: aluno não está matriculado.
                            // Remove o registro local stale (cache PocketBase)
                            // e mostra a opção de inscrição — NÃO exibe a
                            // mensagem de sessão expirada.
                            try { await cancelarMatricula(id); } catch (_) {}
                            if (cancelado) return;
                            setNaoMatriculado(true);
                            setErroAulas('');
                            return;
                        }
                    } catch (_) {
                        if (cancelado) return;
                        // Não foi possível confirmar matrícula — segue para a
                        // mensagem de sessão expirada (fallback seguro).
                    }
                }
                let msg = msgErr || 'Não foi possível carregar as aulas deste curso.';
                if (e?.status === 401) {
                    msg = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
                } else if (e?.status === 403) {
                    msg = 'Você não tem permissão para acessar este conteúdo. Confirme sua matrícula.';
                }
                setErroAulas(msg);
            } finally {
                if (!cancelado) setCarregandoAulas(false);
            }
        }
        carregarAulas();
        return () => { cancelado = true; };
    }, [id]);

    // Mídia ativa = campos canônicos da aula selecionada (sempre string).
    const pdfUrl = extrairUrlSegura(aulaSelecionada?.pdfUrl);
    const slideUrl = extrairUrlSegura(aulaSelecionada?.slideUrl);
    const slideUrlValida = ehUrlHttpValida(slideUrl);
    const pdfUrlValida = ehUrlHttpValida(pdfUrl);
    const videoUrl = extrairUrlSegura(aulaSelecionada?.videoUrl);
    const imagemUrl = extrairUrlSegura(aulaSelecionada?.imagemUrl);
    const embedUrl = extrairUrlSegura(aulaSelecionada?.youtubeEmbed);
    const tipoMidia = aulaSelecionada?.tipoMidia || 'nenhum';
    const aulaId = aulaSelecionada?.id || '';

    // Carrega o documento PDF (pdf.js).
    //   - tipo=slide: baixa `conteudo_url` (Cloudinary, CORS *) via fetch e
    //     passa BYTES ao pdf.js — NUNCA getDocument({ url }), que no pdf.js
    //     6.x converte a string em URL object e pode estourar
    //     "url.startsWith is not a function". Se conteudo_url falhar e houver
    //     material_pdf_url, tenta o proxy autenticado como fallback.
    //   - tipo=pdf: proxy autenticado (`material_pdf_url`) → bytes → pdf.js.
    useEffect(() => {
        setPdfDoc(null);
        setTotalPaginas(0);
        setPaginaAtual(1);
        setErroPdf('');
        if ((tipoMidia !== 'pdf' && tipoMidia !== 'slide') || !aulaId) return undefined;

        let cancelado = false;
        setCarregandoPdf(true);
        (async () => {
            try {
                let doc;
                const slideUrlSegura = extrairUrlSegura(slideUrl);
                const slideOk = ehUrlHttpValida(slideUrlSegura);

                if (tipoMidia === 'slide') {
                    if (slideOk) {
                        // Caminho principal: fetch → bytes → getDocument({ data }).
                        try {
                            doc = await carregarPdfDeUrlHttp(slideUrlSegura);
                        } catch (errSlide) {
                            // Fallback: material de apoio via proxy autenticado
                            // (mesma origem, sem CORS) quando a URL pública falha.
                            try {
                                const arrayBuffer = await getPdfAula(id, aulaId);
                                doc = await carregarPdfDeBytes(arrayBuffer);
                            } catch (_) {
                                // Prioriza a mensagem do carregamento da URL real.
                                throw errSlide;
                            }
                        }
                    } else {
                        // Sem conteudo_url válida — tenta material_pdf_url via proxy.
                        try {
                            const arrayBuffer = await getPdfAula(id, aulaId);
                            doc = await carregarPdfDeBytes(arrayBuffer);
                        } catch (_) {
                            throw new Error('Material de slides indisponível para esta aula.');
                        }
                    }
                } else {
                    // PDF de apoio (`material_pdf_url`) via proxy autenticado.
                    const arrayBuffer = await getPdfAula(id, aulaId);
                    doc = await carregarPdfDeBytes(arrayBuffer);
                }
                if (cancelado) return;
                setPdfDoc(doc);
                setTotalPaginas(doc.numPages);
                setPaginaAtual(1);
                // Limpa qualquer `erroPdf` STALE ao confirmar o carregamento
                // — a mensagem de erro nunca aparece junto com o PDF visível.
                setErroPdf('');
            } catch (e) {
                if (cancelado) return;
                const msgErr = String(e?.message || '');
                if (e?.status === 401 && !pb.authStore.isValid) {
                    navigate(`/login?redirect=${encodeURIComponent(`/curso/${id}/aula`)}`, { replace: true });
                    return;
                }
                setErroPdf(mensagemAmigavelErro(msgErr || 'Erro ao carregar o PDF. Tente novamente em instantes.'));
            } finally {
                if (!cancelado) setCarregandoPdf(false);
            }
        })();
        return () => { cancelado = true; };
    }, [aulaId, tipoMidia, id, navigate, slideUrl]);

    // Renderiza a página atual no canvas — maximizado (ajusta à largura útil
    // e a uma altura generosa, preservando a proporção do PDF).
    const renderPagina = useCallback(async (numero) => {
        if (!pdfDoc || !canvasRef.current) return;
        setRenderizando(true);
        setErroPdf('');
        try {
            if (renderTaskRef.current) {
                try { renderTaskRef.current.cancel(); } catch (_) {}
            }
            const page = await pdfDoc.getPage(numero);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const container = canvas.parentElement;
            const larguraDesejada = container ? container.clientWidth : 900;
            const viewportBase = page.getViewport({ scale: 1 });
            // Ajusta à largura útil do container (PDF maximizado horizontalmente).
            const escala = Math.max(0.5, larguraDesejada / viewportBase.width);
            const dpr = window.devicePixelRatio || 1;
            const viewport = page.getViewport({ scale: escala * dpr });

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            // Canvas ocupa 100% da largura útil do container (sem espaço vazio
            // nas laterais); a altura segue a proporção nativa do PDF (auto),
            // preservando a proporção do documento em qualquer largura.
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
            canvas.style.display = 'block';

            const task = page.render({ canvasContext: ctx, viewport });
            renderTaskRef.current = task;
            await task.promise;
        } catch (e) {
            if (e?.name !== 'RenderingCancelledException') {
                setErroPdf('Erro ao renderizar a página. Tente novamente.');
            }
        } finally {
            setRenderizando(false);
        }
    }, [pdfDoc]);

    useEffect(() => {
        if (pdfDoc && totalPaginas > 0) {
            renderPagina(paginaAtual);
        }
    }, [pdfDoc, paginaAtual, totalPaginas, renderPagina]);

    // Re-renderiza ao redimensionar a janela (responsivo).
    useEffect(() => {
        if (!pdfDoc) return undefined;
        let timer;
        const onResize = () => {
            clearTimeout(timer);
            timer = setTimeout(() => renderPagina(paginaAtual), 200);
        };
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            clearTimeout(timer);
        };
    }, [pdfDoc, paginaAtual, renderPagina]);

    // ===== Navegação unificada (botão "Próxima") =====
    // A lista de aulas vem ordenada por `ordem` (1, 2, 3, 4…). O botão
    // "Próxima" é a ÚNICA ação de navegação de avanço:
    //   - Avança entre as PÁGINAS da aula atual (PDF).
    //   - Na última página da aula (ou aula sem páginas): marca a aula como
    //     concluída na VPS (POST /aluno/cursos/:id/aulas/:aulaId/concluir),
    //     verifica se há uma PROVA configurada para a etapa (vínculo real
    //     prova.etapa_id === aula.id, vindo de provas_por_aula) e:
    //       * se houver prova → abre a prova (/curso/:id/prova/:provaId);
    //       * se não houver prova e houver próxima aula → avança para a
    //         primeira aula da próxima etapa;
    //       * se for a última aula e sem prova → marca o curso como concluído.
    // O botão "Anterior" volta páginas (PDF) ou, na primeira página, volta
    // para a aula anterior. Genérico para qualquer curso (sem IDs/nomes
    // fixos). Preserva "Página X de Y", status "Concluída" e o progresso.
    const indiceAtual = aulaSelecionada
        ? aulas.findIndex((a) => a.id === aulaSelecionada.id)
        : -1;
    const isUltimaAula = indiceAtual >= 0 && indiceAtual === aulas.length - 1;
    const aulaAnterior = indiceAtual > 0 ? aulas[indiceAtual - 1] : null;
    const proximaAulaObj = !isUltimaAula && indiceAtual >= 0 ? aulas[indiceAtual + 1] : null;
    const temPaginas = (tipoMidia === 'pdf' || tipoMidia === 'slide') && totalPaginas > 0;
    const naUltimaPagina = !temPaginas || paginaAtual >= totalPaginas;

    const anterior = () => {
        if (temPaginas && paginaAtual > 1) {
            setPaginaAtual((p) => p - 1);
            return;
        }
        if (aulaAnterior) {
            setErroConclusao('');
            setAulaSelecionada(aulaAnterior);
        }
    };

    const avancarEtapaOProva = async () => {
        if (!aulaSelecionada || concluindoAula) return;
        setErroConclusao('');
        setConcluindoAula(true);
        try {
            // Marca a aula atual como concluída na VPS (progresso real).
            await concluirAula(id, aulaSelecionada.id);
            setAulas((prev) => prev.map((a) => (
                a.id === aulaSelecionada.id
                    ? { ...a, concluida: true, concluidaEm: new Date().toISOString() }
                    : a
            )));
            // Regra de prova/avanço (genérica, por etapa/aula):
            //   prova configurada para esta aula → abre a prova.
            if (aulaSelecionada.temProva && aulaSelecionada.provaId) {
                navigate(`/curso/${encodeURIComponent(id)}/prova/${encodeURIComponent(aulaSelecionada.provaId)}`);
                return;
            }
            //   sem prova e há próxima aula → primeira aula da próxima etapa.
            if (proximaAulaObj) {
                setAulaSelecionada(proximaAulaObj);
                return;
            }
            //   última aula, sem prova → verifica o progresso REAL da VPS
            //   antes de marcar o curso como concluído. Só marca concluído se
            //   o percentual retornado for 100%; caso contrário, NÃO exibe
            //   conclusão (matrícula nova com progresso incompleto ou
            //   progresso indisponível).
            try {
                const prog = await getProgresso(id);
                const percentual = Number(prog?.percentual) || 0;
                // CONFIRMAÇÃO DA API QUE DISPARA A NAVEGAÇÃO:
                // getProgresso(id) → GET /cursos/:id/progresso (proxy → VPS
                // GET /aluno/cursos/:id/progresso) devolve { total_aulas,
                // aulas_concluidas, percentual }. Quando `percentual >= 100`,
                // a API confirma que TODAS as aulas foram concluídas.
                //
                // Nesse caso: preserva o registro de conclusão
                // (setCursoConcluido(true) mantém o estado e a mensagem de
                // sucesso já existente visível), e navega AUTOMATICAMENTE
                // para a página principal do Painel do Aluno
                // (/curso/meus-cursos) após um breve intervalo, para que o
                // aluno veja a confirmação antes de ser redirecionado.
                const concluido = percentual >= 100;
                setCursoConcluido(concluido);
                if (concluido) {
                    setTimeout(() => {
                        navigate('/curso/meus-cursos', { replace: true });
                    }, 2000);
                }
            } catch (_) {
                // Progresso indisponível — não assume conclusão (matrícula
                // nova). Evita exibir o curso como concluído sem confirmação.
                setCursoConcluido(false);
            }
        } catch (e) {
            const msgErr = String(e?.message || '');
            if (e?.status === 401 && !pb.authStore.isValid) {
                navigate(`/login?redirect=${encodeURIComponent(`/curso/${id}/aula`)}`, { replace: true });
                return;
            }
            setErroConclusao(msgErr || 'Não foi possível concluir esta aula. Tente novamente.');
        } finally {
            setConcluindoAula(false);
        }
    };

    const proxima = () => {
        if (temPaginas && paginaAtual < totalPaginas) {
            setPaginaAtual((p) => p + 1);
            return;
        }
        // Última página (ou aula sem páginas) → regra de prova/avanço.
        avancarEtapaOProva();
    };

    const matriz = parseMatriz(curso?.matrizCurricular);

    if (carregandoCurso) {
        return (
            <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 size={40} className="animate-spin text-primary" />
                <p className="font-display font-semibold">Carregando curso…</p>
            </div>
        );
    }

    if (erroCurso || !curso) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-24 text-center">
                <AlertCircle size={44} className="text-destructive" />
                <p className="font-display text-lg font-bold text-foreground">{erroCurso || 'Curso não encontrado.'}</p>
                <Link to="/curso/meus-cursos" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-display font-bold text-primary-foreground hover:bg-primary/90">
                    <ArrowLeft size={16} /> Voltar aos meus cursos
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-muted/30">
            <Helmet>
                <title>{curso.titulo} — Aula | Conexão Cursos</title>
                <meta name="description" content={`Aula do curso ${curso.titulo} na plataforma Conexão Cursos.`} />
            </Helmet>

            {/* Cabeçalho compacto real — nome do curso + duração (altura mínima, sem espaço desperdiçado) */}
            <header className="border-b border-border bg-white">
                <div className="mx-auto max-w-[96rem] px-4 py-1.5 lg:px-6">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <Link to="/curso/meus-cursos" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary">
                            <ArrowLeft size={12} /> Meus cursos
                        </Link>
                        <h1 className="font-display text-lg font-bold leading-tight text-foreground sm:text-xl">
                            {curso.titulo}
                        </h1>
                        {curso.cargaHoraria && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                <Clock size={12} /> Duração: {curso.cargaHorariaHoras ? `${curso.cargaHorariaHoras}h` : curso.cargaHoraria}
                            </span>
                        )}
                    </div>

                    {/* Informações do curso — linha única e discreta */}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0 text-[11px] text-muted-foreground">
                        {curso.categoria && (
                            <span><span className="font-semibold text-foreground/70">Categoria:</span> {curso.categoria}</span>
                        )}
                        {curso.area && (
                            <span><span className="font-semibold text-foreground/70">Área:</span> {curso.area}</span>
                        )}
                        {curso.mentor && (
                            <span className="inline-flex items-center gap-0.5"><User size={10} /> <span className="font-semibold text-foreground/70">Autor:</span> {curso.mentor}</span>
                        )}
                        {curso.dataCriacao && (
                            <span className="inline-flex items-center gap-0.5"><CalendarDays size={10} /> <span className="font-semibold text-foreground/70">Criado em:</span> {formatarDataBR(curso.dataCriacao)}</span>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[96rem] px-4 py-6 lg:px-6 lg:py-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
                    {/* Coluna esquerda — leitor PDF maximizado */}
                    <div className="lg:order-1">
                        <div className="overflow-hidden rounded-2xl border border-border bg-white pb-2 shadow-sm sm:pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 sm:px-3 sm:pt-3">
                                <div className="flex items-center gap-2.5">
                                    <FileText size={22} className="text-primary" />
                                    <h2 className="font-display text-lg font-bold text-primary sm:text-xl">
                                        {aulaSelecionada ? aulaSelecionada.titulo : 'Material do curso'}
                                    </h2>
                                </div>
                                {aulaSelecionada && (
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${tipoMidia === 'nenhum' || tipoMidia === 'youtube_invalido' || tipoMidia === 'video_invalido' || tipoMidia === 'imagem_invalida' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                        {tipoMidia === 'youtube' ? 'Vídeo YouTube' : tipoMidia === 'youtube_invalido' ? 'Vídeo indisponível' : tipoMidia === 'video' ? 'Vídeo' : tipoMidia === 'video_invalido' ? 'Vídeo indisponível' : tipoMidia === 'imagem' ? 'Imagem' : tipoMidia === 'imagem_invalida' ? 'Imagem indisponível' : tipoMidia === 'slide' ? 'Apresentação' : tipoMidia === 'pdf' ? 'PDF disponível' : 'Sem material'}
                                    </span>
                                )}
                            </div>

                            {/* Erro ao carregar aulas (auth/permissão) */}
                            {carregandoAulas ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                                    <Loader2 size={32} className="animate-spin text-primary" />
                                    <p className="text-sm">Carregando as aulas do curso…</p>
                                </div>
                            ) : naoMatriculado ? (
                                /* API confirmou que o aluno NÃO está matriculado:
                                   mostra a opção de inscrição normalmente e NÃO
                                   exibe a mensagem de sessão expirada. */
                                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
                                    <BookOpen size={40} className="text-primary/40" />
                                    <p className="font-display text-base font-bold text-foreground">Você não está matriculado neste curso</p>
                                    <p className="max-w-sm text-sm text-muted-foreground">
                                        Para acessar as aulas, faça sua inscrição no curso e volte para esta página.
                                    </p>
                                    <Link
                                        to={`/curso/${encodeURIComponent(id)}`}
                                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]"
                                    >
                                        <BookOpen size={16} /> Inscrever-se no curso
                                    </Link>
                                    <Link to="/curso/meus-cursos" className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary">
                                        <ArrowLeft size={14} /> Voltar aos meus cursos
                                    </Link>
                                </div>
                            ) : erroAulas ? (
                                <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
                                    <Lock size={36} className="text-destructive" />
                                    <p className="font-display text-sm font-bold text-destructive">{erroAulas}</p>
                                    <Link to="/curso/meus-cursos" className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                                        <ArrowLeft size={16} /> Voltar aos meus cursos
                                    </Link>
                                </div>
                            ) : aulas.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
                                    <BookOpen size={40} className="text-primary/40" />
                                    <p className="font-display text-base font-bold text-foreground">Nenhuma aula cadastrada</p>
                                    <p className="max-w-sm text-sm text-muted-foreground">
                                        Este curso ainda não possui aulas publicadas. Continue acompanhando pela área do aluno.
                                    </p>
                                    <Link to={`/curso/${encodeURIComponent(curso.id)}/acessar`} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                                        Abrir painel do curso <ArrowRight size={16} />
                                    </Link>
                                </div>
                            ) : !aulaSelecionada ? null : tipoMidia === 'slide' ? (
                                /* Apresentação (slide deck) — PDF do deck em
                                   `conteudo_url` (Cloudinary). Baixado via fetch e
                                   renderizado com pdf.js a partir de BYTES (nunca
                                   getDocument({ url })). material_pdf_url vira
                                   botão secundário de download quando existir.
                                   Ordem: pdfDoc visível > carregando > erro. */
                                pdfDoc ? (
                                    <>
                                        <div className="max-h-[52vh] overflow-auto sm:max-h-[58vh] lg:max-h-[62vh]">
                                            <canvas ref={canvasRef} className="block h-auto w-full" />
                                        </div>

                                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                            {slideUrlValida && (
                                                <a href={urlParaDownload(slideUrl)} download rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-lg bg-accent px-6 py-3.5 text-base font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]">
                                                    <Download size={20} /> Baixar slides
                                                </a>
                                            )}

                                            {pdfUrlValida && (
                                                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-lg border-2 border-primary px-6 py-3.5 text-base font-display font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:scale-[0.98]">
                                                    <Download size={20} /> Material de apoio
                                                </a>
                                            )}
                                        </div>
                                    </>
                                ) : carregandoPdf ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                                        <Loader2 size={32} className="animate-spin text-primary" />
                                        <p className="text-sm">Carregando apresentação…</p>
                                    </div>
                                ) : !slideUrlValida ? (
                                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
                                        <Presentation size={40} className="text-primary/40" />
                                        <p className="font-display text-base font-bold text-foreground">Material de slides indisponível</p>
                                        <p className="max-w-sm text-sm text-muted-foreground">
                                            Esta aula é uma apresentação, mas a URL dos slides não está disponível ou é inválida. Contate o mentor para corrigir o material.
                                        </p>
                                    </div>
                                ) : erroPdf ? (
                                    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
                                        <AlertCircle size={36} className="text-destructive" />
                                        <p className="font-display text-base font-bold text-foreground">Material de slides indisponível</p>
                                        <p className="max-w-sm text-sm text-muted-foreground">{erroPdf}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                                        <Loader2 size={32} className="animate-spin text-primary" />
                                        <p className="text-sm">Carregando apresentação…</p>
                                    </div>
                                )
                            ) : tipoMidia === 'youtube' ? (
                                /* Vídeo do YouTube (embed) — player responsivo 16:9
                                   ocupando a área central da aula em desktop e mobile. */
                                <div className="overflow-hidden rounded-xl border border-border bg-black">
                                    <div className="relative min-h-[360px] w-full sm:min-h-[480px] lg:min-h-[640px]" style={{ paddingBottom: '56.25%' }}>
                                        <iframe
                                            src={embedUrl}
                                            title={aulaSelecionada.titulo}
                                            className="absolute inset-0 h-full w-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            ) : tipoMidia === 'youtube_invalido' ? (
                                /* YouTube declarado (video_type=youtube / tipo=video), mas
                                   youtube_id inválido ou ausente — fallback claro em vez
                                   de quebrar a página. */
                                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
                                    <Video size={40} className="text-primary/40" />
                                    <p className="font-display text-base font-bold text-foreground">Vídeo indisponível</p>
                                    <p className="max-w-sm text-sm text-muted-foreground">
                                        Esta aula possui um vídeo do YouTube cadastrado, mas o link não pôde ser carregado. Contate o mentor para corrigir o endereço do vídeo.
                                    </p>
                                </div>
                            ) : tipoMidia === 'video' ? (
                                /* Vídeo hospedado diretamente (não YouTube) — player
                                   nativo HTML5, responsivo, preserva a renderização
                                   existente para arquivos de vídeo próprios. */
                                <div className="overflow-hidden rounded-xl border border-border bg-black">
                                    <video
                                        src={videoUrl}
                                        title={aulaSelecionada.titulo}
                                        controls
                                        className="block h-auto w-full"
                                    />
                                </div>
                            ) : tipoMidia === 'video_invalido' ? (
                                /* Vídeo (tipo=video, subtipo=upload) declarado, mas
                                   sem arquivo enviado — fallback claro. */
                                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
                                    <Video size={40} className="text-primary/40" />
                                    <p className="font-display text-base font-bold text-foreground">Vídeo indisponível</p>
                                    <p className="max-w-sm text-sm text-muted-foreground">
                                        Esta aula possui um vídeo cadastrado, mas o arquivo não pôde ser carregado. Contate o mentor para corrigir o conteúdo.
                                    </p>
                                </div>
                            ) : tipoMidia === 'imagem' ? (
                                /* Imagem — espaço principal de mídia */
                                <div className="overflow-auto rounded-xl border border-border bg-muted/40 p-2 sm:p-4">
                                    <div className="flex min-h-[360px] items-center justify-center sm:min-h-[480px] lg:min-h-[640px]">
                                        <img
                                            src={imagemUrl}
                                            alt={aulaSelecionada.titulo}
                                            className="max-w-full rounded-lg shadow-md"
                                        />
                                    </div>
                                </div>
                            ) : tipoMidia === 'imagem_invalida' ? (
                                /* Imagem (tipo=imagem) declarada, mas sem arquivo — fallback. */
                                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
                                    <ImageIcon size={40} className="text-primary/40" />
                                    <p className="font-display text-base font-bold text-foreground">Imagem indisponível</p>
                                    <p className="max-w-sm text-sm text-muted-foreground">
                                        Esta aula possui uma imagem cadastrada, mas o arquivo não pôde ser carregado. Contate o mentor para corrigir o conteúdo.
                                    </p>
                                </div>
                            ) : tipoMidia === 'pdf' ? (
                                carregandoPdf ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                                        <Loader2 size={32} className="animate-spin text-primary" />
                                        <p className="text-sm">Carregando o PDF…</p>
                                    </div>
                                ) : erroPdf && !pdfDoc ? (
                                    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
                                        <AlertCircle size={36} className="text-destructive" />
                                        <p className="font-display text-sm font-bold text-destructive">{erroPdf}</p>
                                        <a
                                            href={pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:brightness-105"
                                        >
                                            <Download size={16} /> Baixar PDF
                                        </a>
                                    </div>
                                ) : (
                                    <>
                                        {/* Leitor PDF — canvas ocupa 100% da largura útil do
                                            container (sem padding/margem/borda que deixem
                                            espaço vazio). Proporção preservada (height:auto);
                                            rolagem interna quando a página é mais alta que o
                                            espaço disponível, sem empurrar os controles. */}
                                        <div className="max-h-[52vh] overflow-auto sm:max-h-[58vh] lg:max-h-[62vh]">
                                            <canvas ref={canvasRef} className="block h-auto w-full" />
                                        </div>

                                        {/* Botão Baixar PDF — separado do leitor, abre em nova aba */}
                                        <a
                                            id="download-pdf-btn"
                                            href={pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-accent px-6 py-3.5 text-base font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]"
                                        >
                                            <Download size={20} /> Baixar PDF
                                        </a>

                                        {/* A prova associada a esta aula é exibida como CTA unificado
                                            após a área de mídia (ver bloco abaixo do condicional). */}
                                    </>
                                )
                            ) : (
                                /* Nenhum material — mensagem oficial + CTA prova na última aula */
                                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
                                    <FileX size={40} className="text-primary/40" />
                                    <p className="font-display text-base font-bold text-foreground">Material indisponível para esta aula</p>
                                    <p className="max-w-sm text-sm text-muted-foreground">
                                        Esta aula não possui vídeo, imagem ou material em PDF. O mentor precisa publicar o conteúdo no painel do mentor.
                                    </p>
                                    {/* A prova associada a esta aula é exibida como CTA unificado
                                        após a área de mídia (ver bloco abaixo do condicional). */}
                                </div>
                            )}

                            {/* Navegação unificada — o botão "Próxima" é a ÚNICA ação de avanço.
                                Avança páginas da aula (PDF) e, na última página, executa a regra
                                de prova/avanço: prova configurada → abre a prova; sem prova e
                                há próxima aula → primeira aula da próxima etapa; última aula sem
                                prova → curso concluído. Preserva "Página X de Y" (PDF) /
                                "Aula X de N", botões Anterior e Próxima, status "Concluída" e o
                                salvamento do progresso. Genérico para qualquer curso. */}
                            {aulas.length > 0 && aulaSelecionada && (
                                <div className="mt-4 rounded-xl border border-border bg-muted/40 px-3 py-3 sm:px-4">
                                    {cursoConcluido && (
                                        <div className="mb-3 flex flex-col items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-center sm:flex-row sm:justify-center">
                                            <CheckCircle2 size={20} className="text-green-600" />
                                            <span className="font-display text-sm font-bold text-green-700">Curso concluído! Você finalizou todas as aulas.</span>
                                            <Link to="/curso/meus-cursos" className="ml-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 sm:ml-2">
                                                Meus cursos <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    )}

                                    <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5">
                                            <BookOpen size={14} /> Aula {indiceAtual + 1} de {aulas.length}
                                        </span>
                                        {aulaSelecionada.concluida && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                                                <CheckCircle2 size={12} /> Concluída
                                            </span>
                                        )}
                                    </div>

                                    {erroConclusao && (
                                        <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                                            <AlertCircle size={14} /> {erroConclusao}
                                        </p>
                                    )}

                                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <button
                                            type="button"
                                            onClick={anterior}
                                            disabled={(!temPaginas || paginaAtual <= 1) && !aulaAnterior}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary px-5 py-3 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                                        >
                                            <ArrowLeft size={18} /> Anterior
                                        </button>

                                        <div className="flex items-center justify-center gap-2 text-base font-bold text-foreground">
                                            {concluindoAula && <Loader2 size={15} className="animate-spin text-primary" />}
                                            <span>{temPaginas ? `Página ${paginaAtual} de ${totalPaginas}` : `Aula ${indiceAtual + 1} de ${aulas.length}`}</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={proxima}
                                            disabled={concluindoAula || (temPaginas && renderizando)}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                        >
                                            {concluindoAula
                                                ? (<><Loader2 size={18} className="animate-spin" /> Concluindo…</>)
                                                : (naUltimaPagina && aulaSelecionada.temProva
                                                    ? (<><ClipboardCheck size={18} /> Fazer prova <ArrowRight size={18} /></>)
                                                    : (naUltimaPagina && isUltimaAula
                                                        ? (<><CheckCircle2 size={18} /> Concluir curso <ArrowRight size={18} /></>)
                                                        : (<>{naUltimaPagina ? 'Próxima aula' : 'Próxima'} <ArrowRight size={18} /></>)))}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coluna direita — lista de aulas + prova + informações do curso */}
                    <div className="lg:order-2">
                        <div className="space-y-4 lg:sticky lg:top-20">
                            {/* Lista de aulas + prova (seleção) */}
                            {aulas.length > 0 && (
                                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                                    <h2 className="font-display text-base font-bold text-primary">Aulas do curso</h2>
                                    <ul className="mt-3 space-y-1.5">
                                        {aulas.map((a) => {
                                            const ativa = aulaSelecionada?.id === a.id;
                                            return (
                                                <li key={a.id} className="space-y-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAulaSelecionada(a)}
                                                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${ativa ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
                                                    >
                                                        <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${ativa ? 'bg-white/20 text-primary-foreground' : a.concluida ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                                            {a.concluida ? <CheckCircle2 size={14} /> : a.ordem}
                                                        </span>
                                                        <span className="flex-1 font-semibold leading-tight">{a.titulo}</span>
                                                        {a.tipoMidia === 'slide' ? (
                                                            <Presentation size={15} className={ativa ? 'text-primary-foreground/80' : 'text-primary/60'} />
                                                        ) : a.tipoMidia === 'youtube' || a.tipoMidia === 'youtube_invalido' || a.tipoMidia === 'video' || a.tipoMidia === 'video_invalido' ? (
                                                            <Video size={15} className={ativa ? 'text-primary-foreground/80' : 'text-primary/60'} />
                                                        ) : a.tipoMidia === 'imagem' || a.tipoMidia === 'imagem_invalida' ? (
                                                            <ImageIcon size={15} className={ativa ? 'text-primary-foreground/80' : 'text-primary/60'} />
                                                        ) : a.tipoMidia === 'pdf' ? (
                                                            <FileText size={15} className={ativa ? 'text-primary-foreground/80' : 'text-primary/60'} />
                                                        ) : (
                                                            <FileX size={15} className={ativa ? 'text-primary-foreground/50' : 'text-muted-foreground/60'} />
                                                        )}
                                                    </button>
                                                    {/* Prova associada a ESTA aula — exibida imediatamente
                                                        após a etapa correspondente (associação dinâmica).
                                                        Só aparece quando a VPS devolver prova para a aula. */}
                                                    {a.temProva && a.provaId && (
                                                        <Link
                                                            to={`/curso/${encodeURIComponent(curso.id)}/prova/${encodeURIComponent(a.provaId)}`}
                                                            className={`flex w-full items-center gap-2.5 rounded-lg border border-dashed px-3 py-2 text-left text-xs transition-colors ${a.provaConcluida ? 'border-green-300 bg-green-50 hover:bg-green-100' : 'border-accent/40 bg-accent/5 hover:bg-accent/10'}`}
                                                            style={{ marginLeft: '0.75rem' }}
                                                        >
                                                            <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${a.provaConcluida ? 'bg-green-100 text-green-700' : 'bg-accent/20 text-accent'}`}>
                                                                {a.provaConcluida ? <CheckCircle2 size={13} /> : <PenLine size={13} />}
                                                            </span>
                                                            <span className="flex-1 font-semibold leading-tight text-foreground">
                                                                {a.prova?.titulo || `Prova — ${a.titulo}`}
                                                            </span>
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.provaConcluida ? 'bg-green-100 text-green-700' : 'bg-accent/20 text-accent'}`}>
                                                                {a.provaConcluida ? 'Concluída' : 'Pendente'}
                                                            </span>
                                                        </Link>
                                                    )}
                                                </li>
                                            );
                                        })}

                                    </ul>
                                </div>
                            )}

                            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                                <h2 className="font-display text-base font-bold text-primary">Sobre o curso</h2>
                                {curso.descricao ? (
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{curso.descricao}</p>
                                ) : (
                                    <p className="mt-2 text-sm italic text-muted-foreground">Sem descrição disponível.</p>
                                )}
                            </div>

                            {curso.objetivos && (
                                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                                    <h3 className="flex items-center gap-2 font-display text-sm font-bold text-primary"><ListChecks size={15} /> Objetivos</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{curso.objetivos}</p>
                                </div>
                            )}

                            {curso.publicoAlvo && (
                                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                                    <h3 className="font-display text-sm font-bold text-primary">Público-alvo</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{curso.publicoAlvo}</p>
                                </div>
                            )}

                            {curso.prerequisitos && (
                                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                                    <h3 className="font-display text-sm font-bold text-primary">Pré-requisitos</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{curso.prerequisitos}</p>
                                </div>
                            )}

                            {matriz.length > 0 && (
                                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                                    <h3 className="font-display text-sm font-bold text-primary">Matriz curricular</h3>
                                    <ul className="mt-3 space-y-1.5">
                                        {matriz.map((item, idx) => (
                                            <li key={idx} className="rounded-lg border-l-4 border-primary bg-muted/50 px-3 py-2 text-sm text-foreground">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <Link
                                to={`/curso/${encodeURIComponent(curso.id)}/acessar`}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                            >
                                <RefreshCw size={16} /> Abrir painel do curso
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
