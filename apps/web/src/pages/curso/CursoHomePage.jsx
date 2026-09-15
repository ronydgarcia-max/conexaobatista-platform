import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Users, Award, PlayCircle, Loader2, AlertCircle } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';
import CourseCard from '@/components/curso/CourseCard';

// Formata preço vindo da VPS (string/number, ex.: "0.00", 79.9).
function formatarPrecoNumero(preco) {
    const valor = Number(preco);
    if (!Number.isFinite(valor) || valor === 0) return 0;
    return valor;
}

// Normaliza curso da API pública para o formato do CourseCard.
function normalizarCursoPublico(c) {
    const preco = formatarPrecoNumero(c.preco);
    const carga = Number(c.carga_horaria);
    return {
        id: c.id,
        img: c.imagem_url || c.img || '',
        titulo: c.titulo || '',
        descricao: c.descricao || '',
        instrutor: c.instrutor || c.mentor_nome || c.autor || '',
        duracao: Number.isFinite(carga) && carga > 0 ? `${carga}h` : (c.duracao || ''),
        categoria: c.categoria || '',
        preco,
        avaliacao: c.avaliacao != null ? Number(c.avaliacao) : null,
        alunos: c.alunos != null ? Number(c.alunos) : null,
    };
}

// Home da plataforma de cursos — apresentação, banner e cursos em destaque
export default function CursoHomePage() {
    const [destaques, setDestaques] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroCarga, setErroCarga] = useState('');

    useEffect(() => {
        let cancelado = false;
        async function carregar() {
            setCarregando(true);
            setErroCarga('');
            try {
                const res = await apiServerClient.fetch('/cursos-publicados');
                if (!res.ok) throw new Error('Falha ao carregar cursos em destaque.');
                const data = await res.json();
                if (cancelado) return;
                setDestaques((data.cursos || []).map(normalizarCursoPublico).slice(0, 6));
            } catch (e) {
                if (!cancelado) {
                    setErroCarga(e?.message || 'Não foi possível carregar os cursos em destaque no momento.');
                }
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }
        carregar();
        return () => { cancelado = true; };
    }, []);

    return (
        <div className="page-centered">
            <Helmet>
                <title>Conexão Cursos | Plataforma de capacitação da Conexão Batista</title>
                <meta name="description" content="Plataforma de cursos da Conexão Batista: capacitação com propósito em fé, negócios e carreira, ministrada por irmãos especializados." />
            </Helmet>

            {/* Banner de destaque */}
            <section className="relative flex min-h-[60dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <img
                    src="https://images.hostinger.com/b94be402-145f-4813-b749-2d12a2671520.png"
                    alt="Estudantes da plataforma de cursos Conexão Batista"
                    className="absolute inset-0 h-full w-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/55" />
                <div className="relative mx-auto w-full max-w-[80rem] px-5 py-24 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        Plataforma de Cursos
                    </p>
                    <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
                        Capacitação com <span className="marker-underline">propósito</span> para irmãos
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/85">
                        Cursos gratuitos e pagos em fé, negócios e carreira, ministrados por irmãos especializados. Cresça no conhecimento e sirva melhor o Reino.
                    </p>
                    <div className="mt-9 flex flex-wrap justify-center gap-3">
                        <Link to="/curso/cursos" className="inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-4 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]">
                            Explorar cursos <ArrowRight size={18} />
                        </Link>
                        <Link to="/curso/aluno" className="inline-flex items-center gap-2 rounded-lg border border-white/35 px-7 py-4 font-display font-bold text-white transition-colors hover:bg-white/10">
                            <PlayCircle size={18} /> Área do aluno
                        </Link>
                    </div>
                </div>
            </section>

            {/* Diferenciais */}
            <section className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { icon: BookOpen, t: 'Conteúdo bíblico', d: 'Cursos fundamentados na Palavra e em valores cristãos.' },
                        { icon: GraduationCap, t: 'Instrutores qualificados', d: 'Pastores, teólogos e profissionais com experiência.' },
                        { icon: Users, t: 'Comunidade ativa', d: 'Aprenda junto com irmãos de todo o Brasil.' },
                        { icon: Award, t: 'Certificados', d: 'Conclua seus cursos e receba certificados de conclusão.' },
                    ].map((d) => (
                        <div key={d.t} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                                <d.icon size={20} strokeWidth={1.8} />
                            </span>
                            <h3 className="mt-4 font-display text-base font-bold text-primary">{d.t}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.d}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Cursos em destaque (mantém apresentação inferior como antes) */}
            <section className="bg-muted/60 py-20">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <div className="mx-auto mb-12 max-w-2xl">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Cursos em destaque</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Comece a aprender hoje</h2>
                    </div>
                    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                        {carregando ? (
                            <div className="col-span-full flex flex-col items-center gap-3 py-16 text-muted-foreground">
                                <Loader2 size={36} className="animate-spin text-primary" />
                                <p className="font-display font-semibold">Carregando cursos em destaque…</p>
                            </div>
                        ) : erroCarga ? (
                            <div className="col-span-full mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <AlertCircle size={36} className="text-destructive" />
                                <p className="font-display font-semibold text-foreground">{erroCarga}</p>
                                <p className="text-sm">Tente novamente em instantes.</p>
                            </div>
                        ) : destaques.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-muted-foreground">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-display font-semibold">Nenhum curso disponível no momento.</p>
                            </div>
                        ) : (
                            destaques.map((c) => (
                                <CourseCard key={c.id} curso={c} />
                            ))
                        )}
                    </div>
                    <div className="mt-12">
                        <Link to="/curso/cursos" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-display font-bold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]">
                            Ver todos os cursos <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA mentor */}
            <section className="mx-auto max-w-[80rem] px-5 pb-4 lg:px-10">
                <div className="overflow-hidden rounded-3xl bg-primary px-7 py-14 text-center text-primary-foreground sm:px-14">
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold sm:text-4xl">
                        Você tem conhecimento para ensinar?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                        Seja um mentor na plataforma e impacte vidas com sua experiência.
                    </p>
                    <Link to="/curso/boas-vindas" className="mt-8 inline-block rounded-lg bg-accent px-7 py-4 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]">
                        Conhecer a área do mentor
                    </Link>
                </div>
            </section>
        </div>
    );
}
