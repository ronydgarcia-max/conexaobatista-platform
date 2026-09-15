import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, LogIn, RefreshCw, AlertCircle, PlayCircle, Clock, User, BarChart2, ArrowRight, FileText, Trash2, Loader2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { getMeusCursos, cancelarMatricula, getProgresso } from '@/services/cursosService';
import { capturarTokenDaUrl } from '@/services/cursosAuthService';

// Normaliza um curso retornado pela API externa para um objeto de exibição,
// aceitando variações comuns de nomes de campos (PT/EN).
function normalizarCurso(c) {
  if (!c) return null;
  const id = c.id ?? c.curso_id ?? c._id ?? c.cursoId ?? null;
  const titulo = c.titulo || c.title || c.nome || 'Curso';
  const descricao = c.descricao || c.description || c.resumo || '';
  const instrutor = c.instrutor || c.instructor || c.professor || c.autor || '';
  const img = c.img || c.imagem || c.imagem_url || c.thumbnail || c.cover || '';
  const duracao = c.duracao || c.carga_horaria || c.duration || '';
  const nivel = c.nivel || c.level || '';
  const categoria = c.categoria || c.category || '';
  const progresso = typeof c.progresso === 'number'
    ? c.progresso
    : typeof c.progress === 'number'
      ? c.progress
      : (typeof c.percentual === 'number' ? c.percentual : null);
  return { id, titulo, descricao, instrutor, img, duracao, nivel, categoria, progresso, raw: c };
}

export default function CursoMeusCursosPage() {
    const [cursos, setCursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState('');
    // Estado de cancelamento de matrícula — limpeza imediata da interface.
    const [cancelandoId, setCancelandoId] = useState(null);
    const [erroCancelamento, setErroCancelamento] = useState({});
    const authed = pb.authStore.isValid;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Captura o token SSO recebido na URL (após o SSO) para a sessão atual e
    // remove-o da barra de endereço. Token em sessionStorage (não localStorage).
    // Sem token na URL → nada faz.
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

    const carregar = useCallback(async () => {
        setLoading(true);
        setErro('');
        try {
            const lista = await getMeusCursos();
            setCursos(lista.map(normalizarCurso).filter(Boolean));
        } catch (err) {
            setErro(err?.message || 'Não foi possível carregar seus cursos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authed) {
            setLoading(false);
            return;
        }
        carregar();
    }, [authed, carregar]);

    // Cancela (exclui) a matrícula do curso e LIMPA IMEDIATAMENTE a interface:
    // remove o curso da lista de cursos matriculados (setCursos) e zera qualquer
    // indicador de "já matriculado" associado, sem aguardar re-fetch. O estado
    // local é descartado no ato da exclusão — ao voltar para a tela de inscrição
    // ou abrir o curso, o estado real é consultado novamente via verificarMatricula.
    const cancelar = useCallback(async (cursoId) => {
        if (!cursoId || cancelandoId) return;
        setCancelandoId(String(cursoId));
        setErroCancelamento((prev) => ({ ...prev, [String(cursoId)]: '' }));
        try {
            // Impede cancelar uma matrícula com progresso > 0 — protege o
            // progresso real do aluno na VPS. Consulta o progresso real
            // (GET /cursos/:id/progresso) antes de excluir o registro local.
            // Se houver qualquer aula concluída (percentual > 0 ou
            // aulas_concluidas > 0), bloqueia o cancelamento com mensagem.
            try {
                const prog = await getProgresso(cursoId);
                const percentual = Number(prog?.percentual) || 0;
                const aulasConcluidas = Number(prog?.aulas_concluidas) || 0;
                if (percentual > 0 || aulasConcluidas > 0) {
                    setErroCancelamento((prev) => ({
                        ...prev,
                        [String(cursoId)]:
                            'Não é possível cancelar uma matrícula com progresso iniciado. Continue ou conclua o curso para preservar seu avanço.',
                    }));
                    return;
                }
            } catch (_) {
                // Progresso indisponível — segue com o cancelamento (não
                // bloqueia por falha de consulta; o registro local é apenas
                // backup e a matrícula na VPS não é alterada por esta ação).
            }
            await cancelarMatricula(cursoId);
            // Limpeza imediata: remove o curso da lista exibida.
            setCursos((prev) => prev.filter((c) => String(c.id) !== String(cursoId)));
        } catch (e) {
            setErroCancelamento((prev) => ({
                ...prev,
                [String(cursoId)]: e?.message || 'Não foi possível cancelar sua matrícula.',
            }));
        } finally {
            setCancelandoId(null);
        }
    }, [cancelandoId]);

    return (
        <div className="page-centered">
            <Helmet>
                <title>Meus Cursos | Conexão Cursos</title>
                <meta name="description" content="Lista de cursos em que você está matriculado na plataforma Conexão Cursos." />
            </Helmet>

            <section className="bg-primary py-14 text-primary-foreground">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Painel do aluno</p>
                    <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Meus Cursos</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">
                        Acompanhe os cursos em que você está matriculado e continue de onde parou.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10 text-left">
                {!authed ? (
                    <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
                        <LogIn size={48} className="mx-auto mb-4 text-primary/40" />
                        <p className="font-display text-lg font-bold text-primary">Faça login para ver seus cursos</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Entre com sua conta Conexão Batista para acessar a plataforma de cursos.
                        </p>
                        <Link
                            to="/login?redirect=/curso/meus-cursos"
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
                        >
                            <LogIn size={18} /> Entrar
                        </Link>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <RefreshCw size={32} className="animate-spin text-primary" />
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
                        <p className="font-display text-lg font-bold text-primary">Você ainda não está matriculado</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Explore o catálogo e comece a aprender hoje mesmo.
                        </p>
                        <Link
                            to="/curso/cursos"
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]"
                        >
                            Explorar cursos <ArrowRight size={18} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                        {cursos.map((c) => (
                            <article key={c.id || c.titulo} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-transform hover:-translate-y-1">
                                <div className="relative overflow-hidden">
                                    {c.img ? (
                                        <img src={c.img} alt={c.titulo} className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-44 w-full items-center justify-center bg-primary/10">
                                            <BookOpen size={40} className="text-primary/40" />
                                        </div>
                                    )}
                                    {c.nivel && (
                                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                            {c.nivel}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col p-6">
                                    {c.categoria && (
                                        <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                            {c.categoria}
                                        </span>
                                    )}
                                    <h3 className="font-display text-xl font-bold text-primary">{c.titulo}</h3>
                                    {c.descricao && (
                                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{c.descricao}</p>
                                    )}

                                    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        {c.instrutor && <span className="flex items-center gap-1"><User size={13} /> {c.instrutor}</span>}
                                        {c.duracao && <span className="flex items-center gap-1"><Clock size={13} /> {c.duracao}</span>}
                                    </div>

                                    {typeof c.progresso === 'number' && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><BarChart2 size={13} /> Progresso</span>
                                                <span className="font-semibold text-primary">{c.progresso}%</span>
                                            </div>
                                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                                                <div className={`h-full rounded-full ${c.progresso === 100 ? 'bg-emerald-500' : 'bg-accent'}`} style={{ width: `${c.progresso}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-5 flex flex-col gap-2">
                                        <Link
                                            to={c.id ? `/curso/${encodeURIComponent(c.id)}/aula` : '/curso/cursos'}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:gap-2.5 active:scale-[0.98]"
                                        >
                                            <PlayCircle size={16} /> {typeof c.progresso === 'number' && c.progresso > 0 ? 'Continuar' : 'Acessar curso'}
                                        </Link>
                                        {c.id && (
                                            <Link
                                                to={`/curso/${encodeURIComponent(c.id)}/aula`}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
                                            >
                                                <FileText size={16} /> Abrir aula (PDF)
                                            </Link>
                                        )}
                                        {c.id && (
                                            <button
                                                type="button"
                                                onClick={() => cancelar(c.id)}
                                                disabled={cancelandoId === String(c.id)}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-white px-4 py-2 text-xs font-semibold text-destructive transition-all hover:border-destructive hover:bg-destructive/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {cancelandoId === String(c.id) ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Cancelando…</>
                                                ) : (
                                                    <><Trash2 size={14} /> Cancelar matrícula</>
                                                )}
                                            </button>
                                        )}
                                        {erroCancelamento[String(c.id)] && (
                                            <p className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                                                <AlertCircle size={13} /> {erroCancelamento[String(c.id)]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
