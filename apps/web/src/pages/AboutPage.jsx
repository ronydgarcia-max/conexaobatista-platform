import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { HeartHandshake, Users, Briefcase, HandHelping, BookOpen, ArrowRight, Church } from 'lucide-react';

const moveNos = [
    { icon: HeartHandshake, t: 'Relacionamentos verdadeiros', d: 'Mais do que uma rede de contatos, somos uma família de fé. Construímos amizades que vão além do domingo, conexões que resistem ao tempo e à distância.' },
    { icon: Users, t: 'Comunhão autêntica', d: 'Incentivamos o apoio mútuo, o discipulado e o cuidado genuíno entre irmãos.' },
    { icon: Briefcase, t: 'Oportunidades reais', d: 'Negócios, empregos e serviços que circulam entre pessoas que compartilham os mesmos valores.' },
    { icon: HandHelping, t: 'Apoio espiritual', d: 'Uma rede de oração ativa, onde ninguém carrega sozinho suas lutas.' },
    { icon: BookOpen, t: 'Crescimento conjunto', d: 'Cursos, eventos e conteúdos que edificam a vida espiritual e profissional.' },
];

const biblia = [
    { ref: 'Atos 2:42', texto: 'E perseveravam na doutrina dos apóstolos e na comunhão, no partir do pão e nas orações.' },
    { ref: 'Gálatas 6:2', texto: 'Levai as cargas uns dos outros e, assim, cumprireis a lei de Cristo.' },
    { ref: 'Hebreus 10:24-25', texto: 'E consideremo-nos uns aos outros para nos incentivarmos ao amor e às boas obras, não deixando de congregar-nos, como é costume de alguns, mas encorajando-nos uns aos outros.' },
];

export default function AboutPage() {
    return (
        <div className="page-centered">
            <Helmet>
                <title>O que é o Conexão Batista | Rede de irmãos para irmãos</title>
                <meta name="description" content="O Conexão Batista é uma plataforma digital exclusiva para membros de igrejas batistas no Brasil. Conheça nossa missão: unir fé e oportunidade em uma rede de comunhão, serviço e apoio mútuo." />
            </Helmet>

            {/* Hero */}
            <section className="relative flex min-h-[60dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/60" />
                <div className="relative mx-auto w-full max-w-[80rem] px-5 py-24 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        O que é
                    </p>
                    <h1 className="mt-5 mx-auto max-w-3xl font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
                        Uma rede de irmãos para <span className="marker-underline">irmãos</span>
                    </h1>
                    <p className="mt-6 mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/85">
                        O Conexão Batista é uma plataforma digital exclusiva para membros de igrejas batistas no Brasil. Nascemos do desejo de fortalecer os laços de comunhão, serviço e apoio mútuo entre irmãos de fé.
                    </p>
                </div>
            </section>

            {/* Introdução */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                    <div className="space-y-5 text-base leading-relaxed text-foreground">
                        <p>
                            Em um mundo cada vez mais conectado digitalmente, percebemos que faltava um espaço seguro e confiável onde batistas pudessem se encontrar, fazer negócios, encontrar oportunidades de emprego, pedir oração e crescer juntos, não apenas no domingo, mas em todos os dias da semana.
                        </p>
                        <p>
                            Nossa missão é simples: criar uma rede onde a fé se encontra com a oportunidade, e onde o mandamento de <strong className="text-primary">“levar as cargas uns dos outros”</strong> (Gálatas 6:2) se torna realidade prática no dia a dia.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-border bg-muted/40 p-8">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Nossa missão</p>
                        <p className="mt-4 font-display text-2xl font-bold leading-snug text-primary">
                            Onde a fé se encontra com a oportunidade.
                        </p>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            Levar as cargas uns dos outros como realidade prática, 24 horas por dia, 7 dias por semana, de norte a sul do Brasil.
                        </p>
                    </div>
                </div>
            </section>

            {/* O que nos move */}
            <section className="bg-muted/60 py-20">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <div className="mx-auto mb-12 max-w-2xl">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">O que nos move</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Cinco valores que guiam a rede</h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {moveNos.map((m) => (
                            <div key={m.t} className="rounded-2xl border border-border bg-white p-7 shadow-sm shadow-primary/5">
                                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary">
                                    <m.icon size={22} strokeWidth={1.8} />
                                </span>
                                <h3 className="mt-5 font-display text-lg font-bold text-primary">{m.t}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* O que NÃO somos */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <div className="rounded-3xl bg-primary p-9 text-primary-foreground">
                        <Church size={34} className="text-accent" />
                        <h2 className="mt-5 font-display text-2xl font-extrabold sm:text-3xl">O que NÃO somos</h2>
                        <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85">
                            É importante deixar claro: o Conexão Batista não é uma igreja, não é uma denominação e não substitui sua congregação local. Somos uma ferramenta de serviço às igrejas batistas, um meio para fortalecer o que já existe: a comunhão dos santos.
                        </p>
                    </div>
                    <div className="space-y-5 text-base leading-relaxed text-foreground">
                        <p>
                            Sua igreja local continua sendo seu lugar de culto, discipulado e serviço. Nós somos apenas mais uma forma de viver a fé em comunidade, 24 horas por dia, 7 dias por semana, de norte a sul do Brasil.
                        </p>
                        <Link to="/como-participar" className="inline-flex items-center gap-2 font-display font-bold text-primary hover:gap-3 transition-all">
                            Saiba como participar <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Fundamentação bíblica */}
            <section className="bg-muted/60 py-20">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <div className="mx-auto mb-12 max-w-2xl">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Fundamentação bíblica</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">A Palavra que nos guia</h2>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {biblia.map((b) => (
                            <figure key={b.ref} className="rounded-2xl border-l-4 border-accent bg-white p-7 shadow-sm">
                                <blockquote className="font-display text-base font-semibold italic leading-relaxed text-primary">“{b.texto}”</blockquote>
                                <figcaption className="mt-4 text-sm font-bold text-accent">— {b.ref}</figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-[80rem] px-5 pb-8 lg:px-10">
                <div className="overflow-hidden rounded-3xl bg-primary px-7 py-14 text-center text-primary-foreground sm:px-14">
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold sm:text-4xl">
                        Faça parte da rede de irmãos
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                        Cadastre-se gratuitamente e comece a viver a comunhão, o serviço e a oportunidade com irmãos de fé.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link to="/como-participar" className="rounded-lg bg-accent px-7 py-4 font-display font-bold text-accent-foreground">Quero participar</Link>
                        <Link to="/funcionalidades" className="rounded-lg border border-white/35 px-7 py-4 font-display font-bold">Ver funcionalidades</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
