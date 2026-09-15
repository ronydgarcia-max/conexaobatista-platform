import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertCircle,
  Youtube,
  Link2,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

// Listas de fallback caso as coleções catálogo estejam vazias/indisponíveis.
const AREAS_FALLBACK = [
  'Teologia',
  'Liderança',
  'Discipulado',
  'Missões',
  'Educação Cristã',
  'Aconselhamento',
  'Administração Eclesiástica',
  'Música/Louvor',
  'Comunicação',
  'Evangelismo',
  'Desenvolvimento Pessoal',
  'Finanças Pessoais',
  'Saúde Mental',
  'Relacionamentos',
  'Empreendedorismo',
  'Tecnologia',
  'Outros',
];

const PLATAFORMAS_FALLBACK = [
  { nome: 'Alura', categoria: 'Brasileiras', url_base: 'alura.com.br' },
  { nome: 'Hotmart', categoria: 'Brasileiras', url_base: 'hotmart.com' },
  { nome: 'Kiwify', categoria: 'Brasileiras', url_base: 'kiwify.com' },
  { nome: 'Rocketseat', categoria: 'Brasileiras', url_base: 'rocketseat.com.br' },
  { nome: 'EBAC', categoria: 'Brasileiras', url_base: 'ebaconline.com.br' },
  { nome: 'Descomplica', categoria: 'Brasileiras', url_base: 'descomplica.com.br' },
  { nome: 'Curso em Vídeo (Guanabara)', categoria: 'Brasileiras', url_base: 'cursoemvideo.com' },
  { nome: 'FGV Online', categoria: 'Brasileiras', url_base: 'fgv.br' },
  { nome: 'Fundação Bradesco (Escola Virtual)', categoria: 'Brasileiras', url_base: 'ev.org.br' },
  { nome: 'Veduca', categoria: 'Brasileiras', url_base: 'veduca.org' },
  { nome: 'Cursos Livres SENAI/EAD', categoria: 'Brasileiras', url_base: 'ead.senai.br' },
  { nome: 'Hashtag Treinamentos', categoria: 'Brasileiras', url_base: 'hashtagtreinamentos.com' },
  { nome: 'Tera', categoria: 'Brasileiras', url_base: 'tera.com.br' },
];

const MAX_BIO = 500;

// Valida se uma string é uma URL http(s) válida.
function isUrlValida(url) {
  if (!url) return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Valida link do YouTube (youtube.com ou youtu.be).
function isYoutubeValido(url) {
  if (!isUrlValida(url)) return false;
  const host = new URL(url.trim()).hostname.toLowerCase();
  return host.includes('youtube.com') || host.includes('youtu.be');
}

// Valida link de outra plataforma (deve conter o domínio base da plataforma).
function isPlataformaValida(url, urlBase) {
  if (!isUrlValida(url)) return false;
  if (!urlBase) return true; // sem domínio base conhecido, aceita qualquer URL válida
  const host = new URL(url.trim()).hostname.toLowerCase();
  return host.includes(urlBase.toLowerCase());
}

// Cria um registro de curso em branco.
function novoCurso() {
  return {
    tipo: 'youtube',
    plataforma: '',
    titulo: '',
    link: '',
    descricao: '',
  };
}

/**
 * Formulário complementar de perfil de mentor.
 * Exibido após o aceite do termo de responsabilidade e antes da conclusão
 * do cadastro. Possui 3 etapas: Áreas → Cursos → Mini-biografia.
 *
 * Props:
 *  - onEnviar(dadosMentor): chamado ao enviar o formulário válido.
 *      dadosMentor = { areas, cursos, biografia }
 *  - onPular(): chamado quando o usuário opta por pular o formulário.
 *  - onVoltar(): chamado quando o usuário volta ao termo de responsabilidade.
 *  - loading: estado de carregamento do cadastro (desabilita botões).
 */
export default function MentorProfileForm({ onEnviar, onPular, onVoltar, loading }) {
  const [etapa, setEtapa] = useState(1); // 1=Áreas, 2=Cursos, 3=Bio
  const [areas, setAreas] = useState([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [plataformas, setPlataformas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [editandoCursoIdx, setEditandoCursoIdx] = useState(null);
  const [cursoForm, setCursoForm] = useState(novoCurso());
  const [cursoErro, setCursoErro] = useState('');
  const [bio, setBio] = useState('');
  const [erro, setErro] = useState('');

  // Carrega catálogos do PocketBase (com fallback).
  useEffect(() => {
    pb.collection('areas_mentor')
      .getFullList({ filter: 'ativo = true', sort: 'nome' })
      .then((res) => {
        if (res.length > 0) setAreas(res.map((r) => r.nome));
        else setAreas(AREAS_FALLBACK);
      })
      .catch(() => setAreas(AREAS_FALLBACK));

    pb.collection('plataformas_cursos')
      .getFullList({ filter: 'ativo = true', sort: 'categoria,nome' })
      .then((res) => {
        if (res.length > 0) setPlataformas(res.map((r) => ({ nome: r.nome, categoria: r.categoria, url_base: r.url_base || '' })));
        else setPlataformas(PLATAFORMAS_FALLBACK);
      })
      .catch(() => setPlataformas(PLATAFORMAS_FALLBACK));
  }, []);

  // Plataformas agrupadas por categoria (para optgroups no dropdown).
  const plataformasPorCategoria = useMemo(() => {
    const grupos = {};
    plataformas.forEach((p) => {
      const cat = p.categoria || 'Outras';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(p);
    });
    return grupos;
  }, [plataformas]);

  const toggleArea = (nome) => {
    setAreasSelecionadas((prev) =>
      prev.includes(nome) ? prev.filter((a) => a !== nome) : [...prev, nome],
    );
  };

  const proximaEtapa = () => {
    setErro('');
    if (etapa === 1) {
      if (areasSelecionadas.length === 0) {
        setErro('Selecione ao menos uma área de competência.');
        return;
      }
      setEtapa(2);
    } else if (etapa === 2) {
      // Antes de avançar, se houver um curso em edição incompleto, bloqueia.
      if (editandoCursoIdx !== null) {
        setErro('Termine de salvar ou cancelar o curso em edição antes de continuar.');
        return;
      }
      setEtapa(3);
    }
  };

  const etapaAnterior = () => {
    setErro('');
    if (etapa === 1) {
      onVoltar();
    } else {
      setEtapa(etapa - 1);
    }
  };

  // --- Manipulação de cursos ---
  const iniciarAdicaoCurso = () => {
    setEditandoCursoIdx('novo');
    setCursoForm(novoCurso());
    setCursoErro('');
  };

  const iniciarEdicaoCurso = (idx) => {
    setEditandoCursoIdx(idx);
    setCursoForm({ ...cursos[idx] });
    setCursoErro('');
  };

  const cancelarEdicaoCurso = () => {
    setEditandoCursoIdx(null);
    setCursoForm(novoCurso());
    setCursoErro('');
  };

  const salvarCurso = () => {
    setCursoErro('');
    const c = cursoForm;

    if (!c.titulo.trim()) {
      setCursoErro('O título do curso é obrigatório.');
      return;
    }
    if (!c.link.trim()) {
      setCursoErro('O link do curso é obrigatório.');
      return;
    }
    if (c.tipo === 'youtube') {
      if (!isYoutubeValido(c.link)) {
        setCursoErro('O link deve ser do YouTube (youtube.com ou youtu.be).');
        return;
      }
    } else {
      if (!c.plataforma) {
        setCursoErro('Selecione a plataforma do curso.');
        return;
      }
      const plat = plataformas.find((p) => p.nome === c.plataforma);
      if (!isPlataformaValida(c.link, plat?.url_base)) {
        setCursoErro(
          plat?.url_base
            ? `O link deve ser uma URL válida do domínio ${plat.url_base}.`
            : 'O link deve ser uma URL válida (http:// ou https://).',
        );
        return;
      }
    }

    const cursoFinal = {
      tipo: c.tipo,
      plataforma: c.tipo === 'youtube' ? 'YouTube (público)' : c.plataforma,
      titulo: c.titulo.trim(),
      link: c.link.trim(),
      descricao: c.descricao.trim(),
    };

    if (editandoCursoIdx === 'novo') {
      setCursos((prev) => [...prev, cursoFinal]);
    } else {
      setCursos((prev) => prev.map((cur, i) => (i === editandoCursoIdx ? cursoFinal : cur)));
    }
    cancelarEdicaoCurso();
  };

  const removerCurso = (idx) => {
    setCursos((prev) => prev.filter((_, i) => i !== idx));
    if (editandoCursoIdx === idx) cancelarEdicaoCurso();
  };

  const handleSubmit = () => {
    setErro('');
    if (!bio.trim()) {
      setErro('A mini-biografia é obrigatória.');
      return;
    }
    if (bio.length > MAX_BIO) {
      setErro(`A mini-biografia deve ter no máximo ${MAX_BIO} caracteres.`);
      return;
    }
    if (areasSelecionadas.length === 0) {
      setErro('Selecione ao menos uma área de competência.');
      setEtapa(1);
      return;
    }
    onEnviar({
      areas: areasSelecionadas,
      cursos,
      biografia: bio.trim(),
    });
  };

  const STEP_LABELS = ['Áreas de competência', 'Cursos publicados', 'Mini-biografia'];

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-primary/55 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Perfil de mentor">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-5 sm:px-8">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"><Sparkles size={22} strokeWidth={1.8} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Programa de mentores</p>
            <h2 className="font-display text-lg font-bold text-primary sm:text-xl">Perfil de mentor</h2>
          </div>
          <span className="shrink-0 rounded-full bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
            Passo {etapa} de 3
          </span>
        </div>

        {/* Indicador de progresso */}
        <div className="flex gap-1.5 px-6 pt-4 sm:px-8">
          {STEP_LABELS.map((label, i) => {
            const idx = i + 1;
            const ativa = idx === etapa;
            const concluida = idx < etapa;
            return (
              <div key={label} className="flex-1">
                <div className={`h-1.5 rounded-full ${ativa ? 'bg-accent' : concluida ? 'bg-primary' : 'bg-muted'}`} />
                <p className={`mt-1.5 text-[11px] font-semibold leading-tight ${ativa ? 'text-primary' : concluida ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</p>
              </div>
            );
          })}
        </div>

        {/* Corpo rolável */}
        <div className="max-h-[58dvh] overflow-y-auto px-6 py-5 sm:px-8">
          {/* Etapa 1 — Áreas de competência */}
          {etapa === 1 && (
            <div>
              <p className="text-sm font-bold text-primary">Áreas de competência/temas *</p>
              <p className="mt-1 text-xs text-muted-foreground">Selecione uma ou mais áreas em que você pode atuar como mentor.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {areas.map((nome) => {
                  const sel = areasSelecionadas.includes(nome);
                  return (
                    <label key={nome} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${sel ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => toggleArea(nome)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                      />
                      <span className="font-semibold text-foreground">{nome}</span>
                    </label>
                  );
                })}
              </div>
              {areasSelecionadas.length > 0 && (
                <p className="mt-3 text-xs font-semibold text-green-600">{areasSelecionadas.length} área(s) selecionada(s).</p>
              )}
            </div>
          )}

          {/* Etapa 2 — Cursos publicados */}
          {etapa === 2 && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-primary">Cursos já publicados</p>
                  <p className="mt-1 text-xs text-muted-foreground">Campo opcional. Adicione 0 ou mais cursos.</p>
                </div>
                {editandoCursoIdx === null && (
                  <button type="button" onClick={iniciarAdicaoCurso} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90">
                    <Plus size={15} /> Adicionar curso
                  </button>
                )}
              </div>

              {/* Formulário de adição/edição de curso */}
              {editandoCursoIdx !== null && (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">{editandoCursoIdx === 'novo' ? 'Novo curso' : 'Editar curso'}</p>

                  {/* Tipo de curso */}
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">Tipo de curso *</label>
                    <div className="flex flex-wrap gap-3">
                      <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${cursoForm.tipo === 'youtube' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <input type="radio" name="tipo-curso" value="youtube" checked={cursoForm.tipo === 'youtube'} onChange={() => { setCursoForm({ ...cursoForm, tipo: 'youtube', plataforma: '' }); setCursoErro(''); }} className="h-4 w-4 text-primary focus:ring-primary/30" />
                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Youtube size={15} /> YouTube (público)</span>
                      </label>
                      <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${cursoForm.tipo === 'outra' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <input type="radio" name="tipo-curso" value="outra" checked={cursoForm.tipo === 'outra'} onChange={() => { setCursoForm({ ...cursoForm, tipo: 'outra' }); setCursoErro(''); }} className="h-4 w-4 text-primary focus:ring-primary/30" />
                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Link2 size={15} /> Outra plataforma</span>
                      </label>
                    </div>
                  </div>

                  {/* Plataforma (apenas para "Outra plataforma") */}
                  {cursoForm.tipo === 'outra' && (
                    <div className="mt-3">
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">Plataforma *</label>
                      <select
                        value={cursoForm.plataforma}
                        onChange={(e) => setCursoForm({ ...cursoForm, plataforma: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Selecione a plataforma…</option>
                        {Object.entries(plataformasPorCategoria).map(([cat, lista]) => (
                          <optgroup key={cat} label={cat}>
                            {lista.map((p) => (
                              <option key={p.nome} value={p.nome}>{p.nome}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Link */}
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      {cursoForm.tipo === 'youtube' ? 'Link do YouTube *' : 'Link do curso *'}
                    </label>
                    <input
                      type="url"
                      value={cursoForm.link}
                      onChange={(e) => setCursoForm({ ...cursoForm, link: e.target.value })}
                      placeholder={cursoForm.tipo === 'youtube' ? 'https://www.youtube.com/…' : 'https://…'}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Título */}
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">Título do curso *</label>
                    <input
                      type="text"
                      value={cursoForm.titulo}
                      onChange={(e) => setCursoForm({ ...cursoForm, titulo: e.target.value })}
                      placeholder="Ex.: Introdução à Teologia Sistemática"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">Descrição breve (opcional)</label>
                    <textarea
                      value={cursoForm.descricao}
                      onChange={(e) => setCursoForm({ ...cursoForm, descricao: e.target.value })}
                      rows={2}
                      maxLength={300}
                      placeholder="Uma breve descrição do curso…"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {cursoErro && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" /> {cursoErro}
                    </p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={salvarCurso} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90">
                      {editandoCursoIdx === 'novo' ? 'Adicionar' : 'Salvar'}
                    </button>
                    <button type="button" onClick={cancelarEdicaoCurso} className="rounded-lg border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de cursos adicionados */}
              {cursos.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {cursos.map((c, idx) => (
                    <li key={idx} className="rounded-lg border border-border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">{c.titulo}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            <span className="font-semibold text-primary">{c.plataforma}</span>
                          </p>
                          <a href={c.link} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-xs text-secondary underline">
                            {c.link}
                          </a>
                          {c.descricao && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.descricao}</p>}
                        </div>
                        {editandoCursoIdx === null && (
                          <div className="flex shrink-0 gap-1.5">
                            <button type="button" onClick={() => iniciarEdicaoCurso(idx)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-primary" aria-label="Editar curso">
                              <Pencil size={14} />
                            </button>
                            <button type="button" onClick={() => removerCurso(idx)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remover curso">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                editandoCursoIdx === null && (
                  <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
                    Nenhum curso adicionado. Você pode pular esta etapa se preferir.
                  </p>
                )
              )}
            </div>
          )}

          {/* Etapa 3 — Mini-biografia */}
          {etapa === 3 && (
            <div>
              <p className="text-sm font-bold text-primary">Mini-biografia do mentor *</p>
              <p className="mt-1 text-xs text-muted-foreground">Conte brevemente sobre sua trajetória, experiência e como você pode ajudar outros irmãos.</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
                rows={6}
                maxLength={MAX_BIO}
                placeholder="Escreva sua mini-biografia…"
                className="mt-3 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className={`mt-1 text-right text-xs font-semibold ${bio.length >= MAX_BIO ? 'text-destructive' : 'text-muted-foreground'}`}>
                {bio.length}/{MAX_BIO} caracteres
              </p>

              {/* Resumo antes de enviar */}
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Resumo da solicitação</p>
                <dl className="mt-2 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-muted-foreground">Áreas:</dt>
                    <dd className="text-foreground">{areasSelecionadas.join(', ') || '—'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-muted-foreground">Cursos:</dt>
                    <dd className="text-foreground">{cursos.length} curso(s)</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {erro && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {erro}
            </p>
          )}
        </div>

        {/* Rodapé / navegação */}
        <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={etapaAnterior}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50"
          >
            <ArrowLeft size={16} /> {etapa === 1 ? 'Voltar ao termo' : 'Anterior'}
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onPular}
              disabled={loading}
              className="text-center text-xs font-semibold text-muted-foreground underline hover:text-primary disabled:opacity-50"
            >
              Pular formulário e concluir
            </button>

            {etapa < 3 ? (
              <button
                type="button"
                onClick={proximaEtapa}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Próximo <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {loading ? 'Enviando…' : <>Enviar solicitação <Send size={16} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
