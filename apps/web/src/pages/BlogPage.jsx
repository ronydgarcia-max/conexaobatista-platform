import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { BookOpen, Briefcase, Users, Church, Megaphone, Globe, Lightbulb, PenLine, ArrowRight, CalendarDays } from 'lucide-react';

const categorias = [
    { icon: BookOpen, t: 'Estudos bíblicos', d: 'Análises claras, fiéis às Escrituras.' },
    { icon: Briefcase, t: 'Fé e trabalho', d: 'Viver a fé no ambiente profissional.' },
    { icon: Users, t: 'Família e relacionamentos', d: 'Casamento, filhos, namoro cristão.' },
    { icon: Church, t: 'Teologia e doutrina', d: 'Conhecimento de Deus com profundidade.' },
    { icon: Megaphone, t: 'Testemunhos', d: 'Histórias reais da fidelidade de Deus.' },
    { icon: Globe, t: 'Missões e evangelismo', d: 'Relatos e reflexões do campo missionário.' },
    { icon: Lightbulb, t: 'Opinião e análise', d: 'Temas da sociedade à luz cristã batista.' },
];

const autores = [
    'Pastores e líderes de igrejas batistas',
    'Teólogos e professores',
    'Profissionais cristãos',
    'Missionários',
    'Membros da comunidade, membros validados podem enviar artigos',
];

const posts = [
    { cat: 'Estudos bíblicos', titulo: 'A comunhão dos santos em Atos 2', resumo: 'Como a primeira igreja vivia o mandamento de perseverar na doutrina e na comunhão, e o que isso significa para nós hoje.', data: '5 ago 2026', img: 'https://images.hostinger.com/10e7a8d0-6b16-4aa1-8a35-a897a2d79083.png' },
    { cat: 'Fé e trabalho', titulo: 'Trabalho como adoração ao Senhor', resumo: 'Cada e-mail respondido e cada cliente atendido pode ser um ato de adoração quando feito com excelência e integridade.', data: '2 ago 2026', img: 'https://images.hostinger.com/25ce0804-ab4b-4c8e-86f3-2f9a5560de27.png' },
    { cat: 'Testemunhos', titulo: 'Mudei de cidade e encontrei uma família', resumo: 'Como uma arquiteta encontrou irmãos, uma igreja e novos clientes no mesmo mês através da rede.', data: '28 jul 2026', img: 'https://images.hostinger.com/9e90387f-2467-4ad2-9d80-904e7df1ea62.png' },
];

export default function BlogPage() {
    return (
        <div className="page-centered">
            <Helmet>
                <title>Blog | Conteúdo que edifica no Conexão Batista</title>
                <meta name="description" content="O Blog do Conexão Batista reúne estudos bíblicos, fé e trabalho, família, teologia, testemunhos e missões, conteúdo produzido por pastores, teólogos e irmãos maduros na fé." />
            </Helmet>

            {/* Hero */}
            <section className="relative flex min-h-[55dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/60" />
                <div className="relative mx-auto w-full max-w-[80rem] px-5 py-24 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        Blog
                    </p>
                    <h1 className="mt-5 mx-auto max-w-3xl font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
                        Conteúdo que <span className="marker-underline">edifica</span>, inspira e transforma
                    </h1>
                    <p className="mt-6 mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/85">
                        Um espaço de reflexão, aprendizado e compartilhamento, produzido por pastores, teólogos, líderes e irmãos maduros na fé.
                    </p>
                </div>
            </section>

            {/* Introdução */}
            <section className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10">
                <p className="mx-auto max-w-3xl text-base leading-relaxed text-foreground">
                    Aqui, reunimos conteúdos produzidos por pastores, teólogos, líderes e irmãos maduros na fé, pessoas que vivem o evangelho no dia a dia e têm algo valioso para contribuir. Seja para fortalecer sua caminhada com Cristo, entender melhor as Escrituras, crescer profissionalmente com propósito ou se inspirar com testemunhos reais, você encontrará aqui conteúdo relevante e com profundidade.
                </p>
            </section>

            {/* Posts em destaque */}
            <section className="mx-auto max-w-[80rem] px-5 pb-16 lg:px-10">
                <p className="mb-8 font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Em destaque</p>
                <div className="grid gap-7 lg:grid-cols-3">
                    {posts.map((p) => (
                        <article key={p.titulo} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-transform hover:-translate-y-1">
                            <div className="relative overflow-hidden">
                                <img src={p.img} alt={p.titulo} className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">{p.cat}</span>
                            </div>
                            <div className="flex flex-1 flex-col p-6">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarDays size={12} /> <span>{p.data}</span>
                                </div>
                                <h3 className="mt-3 font-display text-lg font-bold text-primary">{p.titulo}</h3>
                                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.resumo}</p>
                                <button className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
                                    Ler artigo <ArrowRight size={15} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* Categorias */}
            <section className="bg-muted/60 py-20">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <div className="mx-auto mb-12 max-w-2xl">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">O que você encontra</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Categorias do Blog</h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {categorias.map((c) => (
                            <div key={c.t} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                                <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                                    <c.icon size={20} strokeWidth={1.8} />
                                </span>
                                <h3 className="mt-4 font-display text-base font-bold text-primary">{c.t}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quem escreve + frequência */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-2">
                    <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Quem escreve</p>
                        <ul className="mt-6 space-y-3">
                            {autores.map((a) => (
                                <li key={a} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                                    <PenLine size={18} className="mt-0.5 shrink-0 text-accent" />
                                    <span>{a}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex flex-col justify-center rounded-3xl bg-primary p-8 text-primary-foreground">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Frequência</p>
                        <p className="mt-4 font-display text-2xl font-bold leading-snug">
                            Novos conteúdos publicados semanalmente.
                        </p>
                        <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85">
                            Quer contribuir? Se você é membro validado, entre em contato. Toda contribuição passa por análise pastoral e editorial.
                        </p>
                        <Link to="/contato" className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-6 py-3.5 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]">
                            Quero escrever para o blog <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
