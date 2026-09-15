import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import {
    GraduationCap, BookOpen, BarChart3, Users, Plus, TrendingUp,
    RefreshCw, AlertCircle, ArrowLeft, ShieldCheck, ExternalLink, Lock, Info,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { getMentorAcesso } from '@/services/cursosService';
import { mentorCursos, mentorEstatisticas, mentorAlunosRecentes } from '@/data/cursoMock';

// Área do mentor — autenticação real via PocketBase + SSO para o ambiente real.
//
// Fluxo:
//   1. Usuário não logado → redireciona para /login?redirect=/curso/mentor
//   2. Usuário logado mas não aprovado → exibe mensagem de erro
//   3. Usuário logado e aprovado:
//      - MENTOR_ENV=production + MENTOR_REAL_URL configurada → redireciona para o
//        painel do mentor via GET com o JWT na query string (?token=)
//      - MENTOR_ENV=demo ou URL ausente → painel demonstrativo (fallback)
export default function CursoMentorPage() {
    const navigate = useNavigate();
    const [aba, setAba] = useState('cursos');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [acesso, setAcesso] = useState(null); // { env, url, redirectUrl, token, role, expiresAt, configured }

    const authed = pb.authStore.isValid;
    const usuario = pb.authStore.record || null;
    const nomeUsuario = usuario?.name || usuario?.username || 'Mentor';
    const iniciais = (nomeUsuario).split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'ME';

    useEffect(() => {
        if (!authed) {
            // Não logado → redireciona para o login com retorno à área do mentor.
            navigate('/login?redirect=/curso/mentor', { replace: true });
            return;
        }
        let cancelado = false;
        (async () => {
            setCarregando(true);
            setErro('');
            try {
                const res = await getMentorAcesso();
                if (!cancelado) setAcesso(res);
            } catch (err) {
                if (!cancelado) setErro(err?.message || 'Não foi possível acessar a área do mentor.');
            } finally {
                if (!cancelado) setCarregando(false);
            }
        })();
        return () => { cancelado = true; };
    }, [authed, navigate]);

    // Redireciona automaticamente para o painel do mentor via GET com o token
    // na query string (https://api.conexaobatista.com.br/painel?token=<JWT>)
    // assim que a credencial estiver disponível no ambiente de produção.
    useEffect(() => {
        if (acesso?.env === 'production' && acesso?.redirectUrl) {
            const t = setTimeout(() => {
                window.location.href = acesso.redirectUrl;
            }, 400);
            return () => clearTimeout(t);
        }
    }, [acesso]);

    const abas = [
        { id: 'cursos', label: 'Meus cursos', icon: BookOpen },
        { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3 },
        { id: 'alunos', label: 'Alunos', icon: Users },
    ];

    // ----- Estado: não logado (breve, antes do redirect) -----
    if (!authed) {
        return (
            <div className="page-centered">
                <Helmet>
                    <title>Área do mentor | Conexão Cursos</title>
                    <meta name="description" content="Painel do mentor da plataforma de cursos Conexão Batista." />
                </Helmet>
                <section className="mx-auto max-w-md px-5 py-24 text-center">
                    <RefreshCw size={32} className="mx-auto animate-spin text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">Redirecionando para o login…</p>
                </section>
            </div>
        );
    }

    return (
        <div className="page-centered">
            <Helmet>
                <title>Área do mentor | Conexão Cursos</title>
                <meta name="description" content="Painel do mentor da plataforma de cursos Conexão Batista." />
            </Helmet>

            <section className="bg-primary py-14 text-primary-foreground">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Painel</p>
                    <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Área do mentor</h1>
                </div>
            </section>

            <section className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10 text-left">
                {/* ----- Carregando ----- */}
                {carregando && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <RefreshCw size={32} className="animate-spin text-primary" />
                        <p className="mt-4 text-sm">Verificando seu acesso à área do mentor…</p>
                    </div>
                )}

                {/* ----- Erro (ex.: conta não aprovada) ----- */}
                {!carregando && erro && (
                    <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                        <AlertCircle size={40} className="mx-auto mb-3 text-destructive" />
                        <p className="font-display text-base font-bold text-destructive">{erro}</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link to="/curso" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                                <ArrowLeft size={16} /> Voltar
                            </Link>
                            <Link to="/minha-conta" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary">
                                Minha conta
                            </Link>
                        </div>
                    </div>
                )}

                {/* ----- Ambiente real (production) ----- */}
                {!carregando && !erro && acesso?.env === 'production' && (
                    <div className="mx-auto max-w-lg space-y-6">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                            <ShieldCheck size={44} className="mx-auto mb-3 text-emerald-600" />
                            <h2 className="font-display text-xl font-bold text-emerald-800">Acesso liberado</h2>
                            <p className="mt-2 text-sm text-emerald-800/80">
                                Olá, <strong>{nomeUsuario}</strong>! Sua credencial de mentor foi gerada com segurança.
                                Você será redirecionado automaticamente para o painel do mentor.
                            </p>

                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => { if (acesso?.redirectUrl) window.location.href = acesso.redirectUrl; }}
                                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]"
                                >
                                    <ExternalLink size={18} /> Abrir painel do mentor
                                </button>
                                <Link to="/curso" className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:border-primary">
                                    <ArrowLeft size={16} /> Voltar
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-4 text-left text-xs text-muted-foreground">
                            <Lock size={14} className="mt-0.5 shrink-0 text-primary" />
                            <p>
                                A credencial é assinada (JWT HS256), válida por {Math.round((acesso.ttl || 600) / 60)} minutos e enviada na URL
                                (GET, criptografado por HTTPS) no formato <code className="rounded bg-muted px-1">/painel?token=…</code>.
                                O painel do mentor valida a credencial no servidor — não é necessário informar senha novamente.
                            </p>
                        </div>
                    </div>
                )}

                {/* ----- Ambiente demonstrativo (demo / fallback) ----- */}
                {!carregando && !erro && acesso?.env === 'demo' && (
                    <>
                        {!acesso?.configured && (
                            <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
                                <div className="flex items-start gap-2">
                                    <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
                                    <p className="text-sm text-amber-800">
                                        <strong>Ambiente demonstrativo.</strong> O ambiente real do mentor ainda não foi configurado
                                        (variável <code className="rounded bg-amber-100 px-1">MENTOR_REAL_URL</code> ausente).
                                        Assim que for configurado, o acesso será redirecionado automaticamente para o ambiente real com autenticação.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Cabeçalho do painel */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <span className="grid h-14 w-14 place-items-center rounded-full bg-accent/15 font-display text-lg font-bold text-accent">{iniciais}</span>
                                <div>
                                    <p className="font-display text-lg font-bold text-primary">{nomeUsuario}</p>
                                    <p className="text-sm text-muted-foreground">Mentor • Ambiente demonstrativo</p>
                                </div>
                            </div>
                            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]">
                                <Plus size={18} /> Novo curso
                            </button>
                        </div>

                        {/* Abas */}
                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {abas.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => setAba(a.id)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${aba === a.id ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
                                >
                                    <a.icon size={16} /> {a.label}
                                </button>
                            ))}
                        </div>

                        {/* Conteúdo das abas */}
                        <div className="mt-8">
                            {aba === 'cursos' && (
                                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                                            <tr>
                                                <th className="px-5 py-3">Curso</th>
                                                <th className="px-5 py-3">Alunos</th>
                                                <th className="px-5 py-3">Avaliação</th>
                                                <th className="px-5 py-3">Receita</th>
                                                <th className="px-5 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {mentorCursos.map((c) => (
                                                <tr key={c.id}>
                                                    <td className="px-5 py-4 font-semibold text-foreground">{c.titulo}</td>
                                                    <td className="px-5 py-4 text-muted-foreground">{c.alunos}</td>
                                                    <td className="px-5 py-4 text-muted-foreground">{c.avaliacao > 0 ? c.avaliacao.toFixed(1) : '—'}</td>
                                                    <td className="px-5 py-4 text-muted-foreground">{c.receita > 0 ? `R$ ${c.receita.toLocaleString('pt-BR')}` : '—'}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.status === 'Publicado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {aba === 'estatisticas' && (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {mentorEstatisticas.map((e) => (
                                        <div key={e.rotulo} className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
                                            <TrendingUp size={22} className="mx-auto text-accent" />
                                            <p className="mt-3 font-display text-3xl font-extrabold text-primary">{e.valor}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{e.rotulo}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {aba === 'alunos' && (
                                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                                            <tr>
                                                <th className="px-5 py-3">Aluno</th>
                                                <th className="px-5 py-3">Curso</th>
                                                <th className="px-5 py-3">Progresso</th>
                                                <th className="px-5 py-3">Inscrição</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {mentorAlunosRecentes.map((a, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-5 py-4 font-semibold text-foreground">{a.nome}</td>
                                                    <td className="px-5 py-4 text-muted-foreground">{a.curso}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                                                <div className="h-full rounded-full bg-accent" style={{ width: `${a.progresso}%` }} />
                                                            </div>
                                                            <span className="text-xs font-semibold text-primary">{a.progresso}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-muted-foreground">{a.data}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ----- Estado inesperado ----- */}
                {!carregando && !erro && !acesso && (
                    <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
                        <AlertCircle size={36} className="mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Não foi possível carregar a área do mentor.</p>
                        <Link to="/curso" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                            <ArrowLeft size={16} /> Voltar
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
