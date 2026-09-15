import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BookOpen,
  Mail,
  Tag,
  DollarSign,
  Calendar,
  X,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import useCursosAPI, {
  formatarPreco,
  formatarData,
} from '@/hooks/useCursosAPI';

/**
 * Página de Moderação de Cursos (painel administrativo).
 * Acesso restrito a administradores (AdminLayout já protege a rota /adm/*).
 *
 * Lista os cursos aguardando moderação (status=em_analise) consumindo o
 * proxy Express /cursos-moderacao/* (que injeta o x-bridge-secret no
 * backend). Permite aprovar e reprovar (com motivo) cursos.
 */
export default function ModeracaoCursosPage() {
  const { admin } = useAdminAuth();
  const {
    listarCursosEmAnalise,
    aprovarCurso,
    reprovarCurso,
  } = useCursosAPI();

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Feedback global (sucesso/erro após uma ação)
  const [feedback, setFeedback] = useState(null); // { tipo: 'ok'|'erro', texto: string }

  // Estado da ação em andamento (aprovar/reprovar) por id do curso
  const [acaoPendente, setAcaoPendente] = useState(null); // { id, tipo: 'aprovar'|'reprovar' }

  // Modal de reprovação
  const [modalAberto, setModalAberto] = useState(false);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [erroMotivo, setErroMotivo] = useState('');

  const carregarCursos = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const lista = await listarCursosEmAnalise();
      setCursos(lista);
    } catch (err) {
      setErro(err?.message || 'Não foi possível carregar os cursos em análise.');
    } finally {
      setLoading(false);
    }
  }, [listarCursosEmAnalise]);

  useEffect(() => {
    carregarCursos();
  }, [carregarCursos]);

  const fecharFeedback = useCallback(() => setFeedback(null), []);

  const handleAprovar = useCallback(
    async (id) => {
      setAcaoPendente({ id, tipo: 'aprovar' });
      setFeedback(null);
      try {
        await aprovarCurso(id);
        setFeedback({ tipo: 'ok', texto: 'Curso aprovado com sucesso.' });
        // Recarrega a lista — o curso aprovado sai da lista de em_analise.
        await carregarCursos();
      } catch (err) {
        setFeedback({
          tipo: 'erro',
          texto: err?.message || 'Erro ao aprovar curso. Tente novamente.',
        });
      } finally {
        setAcaoPendente(null);
      }
    },
    [aprovarCurso, carregarCursos],
  );

  const abrirModalReprovacao = useCallback((curso) => {
    setCursoSelecionado(curso);
    setMotivo('');
    setErroMotivo('');
    setModalAberto(true);
    setFeedback(null);
  }, []);

  const fecharModalReprovacao = useCallback(() => {
    setModalAberto(false);
    setCursoSelecionado(null);
    setMotivo('');
    setErroMotivo('');
  }, []);

  const handleReprovar = useCallback(async () => {
    if (!cursoSelecionado) return;
    const motivoTrim = motivo.trim();
    if (!motivoTrim) {
      setErroMotivo('Informe o motivo da reprovação.');
      return;
    }

    setAcaoPendente({ id: cursoSelecionado.id, tipo: 'reprovar' });
    setErroMotivo('');
    try {
      await reprovarCurso(cursoSelecionado.id, motivoTrim);
      setFeedback({ tipo: 'ok', texto: 'Curso reprovado com sucesso.' });
      fecharModalReprovacao();
      await carregarCursos();
    } catch (err) {
      // Erro de rede/API: mantém o modal aberto e mostra o erro dentro dele.
      setErroMotivo(
        err?.message || 'Erro ao reprovar curso. Tente novamente.',
      );
    } finally {
      setAcaoPendente(null);
    }
  }, [cursoSelecionado, motivo, reprovarCurso, fecharModalReprovacao, carregarCursos]);

  const totalCursos = cursos.length;

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <Helmet>
        <title>Moderação de Cursos | Administração | Conexão Batista</title>
        <meta
          name="description"
          content="Aprove e reprovar cursos enviados pelos mentores na plataforma Conexão Cursos."
        />
      </Helmet>

      <section className="border-b border-border/70 bg-white">
        <div className="mx-auto max-w-[90rem] px-5 py-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap size={26} />
              </span>
              <div>
                <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl">
                  Moderação de Cursos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Aprove ou reprovar cursos enviados pelos mentores.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={carregarCursos}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {/* Contador no topo */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 px-5 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/20 text-accent">
              <BookOpen size={20} />
            </span>
            <p className="font-display text-lg font-bold text-foreground">
              {loading ? (
                <span className="text-muted-foreground">Carregando…</span>
              ) : (
                <>
                  {totalCursos}{' '}
                  {totalCursos === 1
                    ? 'curso aguardando moderação'
                    : 'cursos aguardando moderação'}
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        {/* Feedback global */}
        {feedback && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
              feedback.tipo === 'ok'
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {feedback.tipo === 'ok' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <span className="flex-1">{feedback.texto}</span>
            <button
              type="button"
              onClick={fecharFeedback}
              className="ml-auto rounded p-0.5 text-current/70 hover:text-current"
              aria-label="Fechar mensagem"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Loading inicial */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="mt-4 text-sm">Carregando cursos em análise…</p>
          </div>
        )}

        {/* Erro de carregamento */}
        {!loading && erro && (
          <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertCircle size={40} className="mx-auto mb-3 text-destructive" />
            <p className="font-display text-base font-bold text-destructive">{erro}</p>
            <button
              type="button"
              onClick={carregarCursos}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        )}

        {/* Lista vazia */}
        {!loading && !erro && totalCursos === 0 && (
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
            <p className="font-display text-lg font-bold text-primary">
              Nenhum curso aguardando moderação
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Todos os cursos enviados foram revisados. Novos cursos aparecerão
              aqui automaticamente.
            </p>
          </div>
        )}

        {/* Lista de cursos em análise */}
        {!loading && !erro && totalCursos > 0 && (
          <div className="grid gap-5">
            {cursos.map((curso) => {
              const isAprovando =
                acaoPendente?.id === curso.id && acaoPendente.tipo === 'aprovar';
              const isReprovando =
                acaoPendente?.id === curso.id && acaoPendente.tipo === 'reprovar';
              const isProcessando = isAprovando || isReprovando;

              return (
                <article
                  key={curso.id}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-5 p-5 sm:flex-row">
                    {/* Thumbnail */}
                    <div className="shrink-0">
                      {curso.imagem_url ? (
                        <img
                          src={curso.imagem_url}
                          alt={curso.titulo}
                          className="h-32 w-full rounded-xl object-cover sm:h-28 sm:w-44"
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center rounded-xl bg-primary/10 sm:h-28 sm:w-44">
                          <BookOpen size={32} className="text-primary/40" />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex flex-1 flex-col">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="font-display text-lg font-bold text-foreground">
                            {curso.titulo}
                          </h2>
                          {curso.descricao && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {curso.descricao}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          <AlertCircle size={13} /> Em análise
                        </span>
                      </div>

                      {/* Metadados */}
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap size={15} className="text-primary/60" />
                          <span className="truncate">{curso.mentor_nome || '—'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail size={15} className="text-primary/60" />
                          <span className="truncate">{curso.mentor_email || '—'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Tag size={15} className="text-primary/60" />
                          {curso.categoria || '—'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <DollarSign size={15} className="text-primary/60" />
                          {formatarPreco(curso.preco)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar size={15} className="text-primary/60" />
                        Enviado em {formatarData(curso.created_at)}
                      </div>

                      {/* Avaliação automática da IA (moderação Groq) —
                          renderizada somente quando há dados de IA. */}
                      {(() => {
                        const temIa =
                          curso.ia_score !== null &&
                          curso.ia_score !== undefined &&
                          String(curso.ia_score) !== '';
                        if (!temIa && !curso.parecer_ia && !curso.motivo_reprovacao) return null;

                        const aprovado = curso.ia_veredito === 'aprovado';
                        const scoreNum =
                          typeof curso.ia_score === 'number'
                            ? curso.ia_score
                            : parseFloat(curso.ia_score);

                        return (
                          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
                                style={{ backgroundColor: aprovado ? '#10b981' : '#ef4444' }}
                              >
                                {aprovado ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                IA: {aprovado ? 'Aprovado' : 'Reprovado'}
                              </span>
                              {!Number.isNaN(scoreNum) && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-bold text-foreground">
                                  Nota da IA: {scoreNum}/100
                                </span>
                              )}
                            </div>

                            {curso.parecer_ia && (
                              <div className="mt-3 rounded-lg border border-border bg-white px-3 py-2.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Parecer da IA
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-foreground">
                                  {curso.parecer_ia}
                                </p>
                              </div>
                            )}

                            {curso.motivo_reprovacao && (
                              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                                  Motivo
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-red-800">
                                  {curso.motivo_reprovacao}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Ações */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleAprovar(curso.id)}
                          disabled={isProcessando}
                          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ backgroundColor: '#10b981' }}
                        >
                          {isAprovando ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Processando…
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              Aprovar
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirModalReprovacao(curso)}
                          disabled={isProcessando}
                          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ backgroundColor: '#ef4444' }}
                        >
                          {isReprovando ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Processando…
                            </>
                          ) : (
                            <>
                              <XCircle size={16} />
                              Reprovar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de reprovação */}
      {modalAberto && cursoSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-reprovacao-titulo"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <XCircle size={20} style={{ color: '#ef4444' }} />
                <h3
                  id="modal-reprovacao-titulo"
                  className="font-display text-lg font-bold text-foreground"
                >
                  Reprovar curso
                </h3>
              </div>
              <button
                type="button"
                onClick={fecharModalReprovacao}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-sm text-muted-foreground">
                Você está prestes a reprovar o curso{' '}
                <strong className="text-foreground">{cursoSelecionado.titulo}</strong>.
                Informe o motivo da reprovação — ele será exibido ao mentor.
              </p>

              <label
                htmlFor="motivo-reprovacao"
                className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Motivo da reprovação
              </label>
              <textarea
                id="motivo-reprovacao"
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  if (erroMotivo) setErroMotivo('');
                }}
                rows={4}
                placeholder="Ex.: Conteúdo não atende aos critérios da plataforma…"
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={!!acaoPendente}
              />
              {erroMotivo && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <AlertCircle size={14} /> {erroMotivo}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharModalReprovacao}
                disabled={!!acaoPendente}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReprovar}
                disabled={!!acaoPendente}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: '#ef4444' }}
              >
                {acaoPendente?.tipo === 'reprovar' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processando…
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    Confirmar reprovação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referência ao admin logado (evita lint de variável não usada) */}
      <span className="sr-only">{admin?.name || admin?.username || ''}</span>
    </div>
  );
}
