import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  LogIn,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  X,
  Loader2,
  Tag,
  DollarSign,
  Calendar,
  GraduationCap,
  ArrowLeft,
  ClipboardCheck,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import useCursosAPI, {
  formatarPreco,
  formatarData,
} from '@/hooks/useCursosAPI';

// Mapa de status da moderação → badge (cor + rótulo).
function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  let cls = 'bg-muted text-muted-foreground border-border';
  let Icon = Clock;
  let label = 'Em análise';

  if (s === 'ativo' || s === 'aprovado' || s === 'publicado') {
    cls = 'border-green-300 bg-green-100 text-green-700';
    Icon = CheckCircle2;
    label = 'Aprovado';
  } else if (s === 'reprovado' || s === 'nao_aprovado' || s === 'reprovada') {
    cls = 'border-red-300 bg-red-100 text-red-700';
    Icon = XCircle;
    label = 'Reprovado';
  } else if (s === 'em_analise' || s === 'pendente' || s === 'analise' || s === '') {
    cls = 'border-amber-300 bg-amber-100 text-amber-700';
    Icon = Clock;
    label = 'Em análise';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cls}`}
    >
      <Icon size={13} /> {label}
    </span>
  );
}

/**
 * Página do mentor: lista os cursos criados pelo mentor logado com o status
 * de moderação (Em análise / Aprovado / Reprovado) e o motivo da reprovação
 * quando aplicável. Mantém o botão de excluir curso.
 *
 * Os dados vêm do proxy Express /cursos-mentor-status (que filtra pelo
 * e-mail do mentor e mantém o x-bridge-secret no backend).
 */
export default function CursoMentorCursosPage() {
  const { listarCursosMentor, excluirCursoMentor } = useCursosAPI();

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Confirmação de exclusão
  const [cursoExcluir, setCursoExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const authed = pb.authStore.isValid;

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const lista = await listarCursosMentor();
      setCursos(lista);
    } catch (err) {
      setErro(err?.message || 'Não foi possível carregar seus cursos.');
    } finally {
      setLoading(false);
    }
  }, [listarCursosMentor]);

  useEffect(() => {
    if (!authed) {
      setLoading(false);
      return;
    }
    carregar();
  }, [authed, carregar]);

  const abrirConfirmacaoExclusao = useCallback((curso) => {
    setCursoExcluir(curso);
    setFeedback(null);
  }, []);

  const fecharConfirmacaoExclusao = useCallback(() => {
    setCursoExcluir(null);
  }, []);

  const handleExcluir = useCallback(async () => {
    if (!cursoExcluir) return;
    setExcluindo(true);
    try {
      await excluirCursoMentor(cursoExcluir.id);
      setFeedback({ tipo: 'ok', texto: 'Curso excluído com sucesso.' });
      fecharConfirmacaoExclusao();
      await carregar();
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err?.message || 'Erro ao excluir o curso. Tente novamente.',
      });
      fecharConfirmacaoExclusao();
    } finally {
      setExcluindo(false);
    }
  }, [cursoExcluir, excluirCursoMentor, fecharConfirmacaoExclusao, carregar]);

  return (
    <div className="page-centered">
      <Helmet>
        <title>Meus Cursos (Mentor) | Conexão Cursos</title>
        <meta
          name="description"
          content="Acompanhe o status de moderação dos cursos que você criou na plataforma Conexão Cursos."
        />
      </Helmet>

      <section className="bg-primary py-14 text-primary-foreground">
        <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">
            Painel do mentor
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
            Meus Cursos
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">
            Acompanhe o status de moderação dos cursos que você criou.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10 text-left">
        {!authed ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
            <LogIn size={48} className="mx-auto mb-4 text-primary/40" />
            <p className="font-display text-lg font-bold text-primary">
              Faça login para ver seus cursos
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre com sua conta Conexão Batista para acompanhar o status dos
              seus cursos.
            </p>
            <Link
              to="/login?redirect=/curso/mentor-cursos"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
            >
              <LogIn size={18} /> Entrar
            </Link>
          </div>
        ) : (
          <>
            {/* Cabeçalho com botão atualizar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/curso"
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
              >
                <ArrowLeft size={16} /> Voltar
              </Link>
              <button
                type="button"
                onClick={carregar}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>

            {/* Feedback */}
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
                  onClick={() => setFeedback(null)}
                  className="ml-auto rounded p-0.5 text-current/70 hover:text-current"
                  aria-label="Fechar mensagem"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="mt-4 text-sm">Carregando seus cursos…</p>
              </div>
            ) : erro ? (
              <div className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                <AlertCircle size={40} className="mx-auto mb-3 text-destructive" />
                <p className="font-display text-base font-bold text-destructive">{erro}</p>
                <button
                  type="button"
                  onClick={carregar}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <RefreshCw size={16} /> Tentar novamente
                </button>
              </div>
            ) : cursos.length === 0 ? (
              <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
                <BookOpen size={48} className="mx-auto mb-4 text-primary/40" />
                <p className="font-display text-lg font-bold text-primary">
                  Você ainda não criou cursos
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Os cursos que você criar aparecerão aqui com o status de
                  moderação.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {cursos.map((curso) => (
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
                            {/* Motivo da reprovação logo abaixo do título */}
                            {curso.motivo_reprovacao && (
                              <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                <span>
                                  <strong>Motivo:</strong> {curso.motivo_reprovacao}
                                </span>
                              </p>
                            )}
                            {curso.descricao && !curso.motivo_reprovacao && (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {curso.descricao}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={curso.status} />
                        </div>

                        {/* Metadados */}
                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                          <span className="flex items-center gap-1.5">
                            <Tag size={15} className="text-primary/60" />
                            {curso.categoria || '—'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <DollarSign size={15} className="text-primary/60" />
                            {formatarPreco(curso.preco)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={15} className="text-primary/60" />
                            {formatarData(curso.created_at)}
                          </span>
                        </div>

                        {/* Ações */}
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            to={`/curso/${encodeURIComponent(curso.id)}/prova/curso`}
                            className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 px-5 py-2.5 text-sm font-bold text-accent transition-colors hover:bg-accent/10"
                            title="Abrir a prova real cadastrada para este curso"
                          >
                            <ClipboardCheck size={16} /> Prova
                          </Link>
                          <button
                            type="button"
                            onClick={() => abrirConfirmacaoExclusao(curso)}
                            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-white px-5 py-2.5 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} /> Excluir curso
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal de confirmação de exclusão */}
      {cursoExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-exclusao-titulo"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Trash2 size={20} className="text-destructive" />
                <h3
                  id="modal-exclusao-titulo"
                  className="font-display text-lg font-bold text-foreground"
                >
                  Excluir curso
                </h3>
              </div>
              <button
                type="button"
                onClick={fecharConfirmacaoExclusao}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir o curso{' '}
                <strong className="text-foreground">{cursoExcluir.titulo}</strong>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharConfirmacaoExclusao}
                disabled={excluindo}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluir}
                disabled={excluindo}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-bold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindo ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Excluindo…
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Confirmar exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ícone GraduationCap referenciado para evitar import não usado */}
      <span className="sr-only">
        <GraduationCap />
      </span>
    </div>
  );
}
