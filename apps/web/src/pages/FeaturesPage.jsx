import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
    Users, Store, Briefcase, HandHelping, Tag, CalendarDays,
    MessageSquare, BookOpen, GraduationCap, Heart, ArrowRight,
} from 'lucide-react';

const funcionalidades = [
    { icon: Users, t: 'Diretório de Membros', d: 'Encontre irmãos de fé em todo o Brasil. Filtre por cidade, profissão, habilidades ou igreja. Conecte-se com quem compartilha seus valores e princípios.' },
    { icon: Store, t: 'Marketplace de Serviços', d: 'Precisa de um advogado, contador, designer, mecânico ou qualquer outro profissional? Encontre aqui serviços oferecidos por irmãos de confiança. Apoie quem compartilha da sua fé e fortaleça a economia entre nós.' },
    { icon: Briefcase, t: 'Banco de Vagas de Emprego', d: 'Empresas de membros batistas divulgando vagas exclusivas para membros da rede. Se você está buscando emprego ou quer indicar uma oportunidade, este é o lugar. Aqui, a confiança já começa na indicação, você sabe que está sendo contratado por alguém que compartilha da sua fé.' },
    { icon: HandHelping, t: 'Rede de Oração', d: 'Peça oração ou ore por alguém. Nossa rede de oração funciona 24 horas por dia. Quando um irmão sofre, todos sofrem com ele. Quando um irmão é honrado, todos se alegram com ele (1 Coríntios 12:26).' },
    { icon: Tag, t: 'Clube de Vantagens', d: 'Empresas da rede oferecem descontos exclusivos para membros do Conexão Batista. Economize fazendo negócios com irmãos.' },
    { icon: CalendarDays, t: 'Eventos e Encontros', d: 'Participe de eventos presenciais e online: congressos, retiros, encontros de networking, webinars e muito mais. A comunhão também acontece face a face.' },
    { icon: MessageSquare, t: 'Fórum da Comunidade', d: 'Tire dúvidas, compartilhe experiências, debata temas relevantes. Um espaço seguro para dialogar com outros irmãos sobre fé, trabalho, família e vida cristã.' },
    { icon: BookOpen, t: 'Conteúdo Devocional', d: 'Artigos, reflexões, estudos bíblicos e testemunhos para edificar sua vida espiritual. Conteúdo produzido por pastores, teólogos e irmãos maduros na fé.' },
    { icon: GraduationCap, t: 'Cursos e Capacitação', d: 'Aprenda novas habilidades, desenvolva sua carreira, cresça espiritualmente. Cursos oferecidos por irmãos especializados em diversas áreas, com opções gratuitas e pagas.' },
    { icon: Heart, t: 'Corações Conectados', d: 'Espaço seguro para irmãos solteiros, viúvos e divorciados que desejam um relacionamento sério com vistas ao casamento. Conversas criptografadas de ponta a ponta e protegidas por IA que garante o respeito e a integridade em todas as interações.' },
];

export default function FeaturesPage() {
    return (
        <div className="page-centered">
            <Helmet>
                <title>Funcionalidades | Tudo o que você precisa no Conexão Batista</title>
                <meta name="description" content="Conheça todas as funcionalidades do Conexão Batista: diretório de membros, marketplace de serviços, banco de vagas, rede de oração, clube de vantagens, eventos, fórum, devocional, cursos e Corações Conectados." />
            </Helmet>

            {/* Hero */}
            <section className="relative flex min-h-[55dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/60" />
                <div className="relative mx-auto w-full max-w-[80rem] px-5 py-24 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        Funcionalidades
                    </p>
                    <h1 className="mt-5 mx-auto max-w-3xl font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
                        Tudo o que você precisa em <span className="marker-underline">um só lugar</span>
                    </h1>
                    <p className="mt-6 mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/85">
                        O Conexão Batista foi pensado para ser uma plataforma completa, onde cada funcionalidade serve a um propósito específico: fortalecer a comunhão, gerar oportunidades e edificar vidas.
                    </p>
                </div>
            </section>

            {/* Intro */}
            <section className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10">
                <p className="mx-auto max-w-3xl text-base leading-relaxed text-foreground">
                    Conheça o que você encontra ao fazer parte da nossa rede, dez funcionalidades pensadas para conectar, servir e edificar irmãos de fé em todo o Brasil.
                </p>
            </section>

            {/* Grid de funcionalidades */}
            <section className="mx-auto max-w-[80rem] px-5 pb-20 lg:px-10">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {funcionalidades.map((f, i) => (
                        <article key={f.t} className="group flex flex-col rounded-2xl border border-border bg-white p-7 shadow-sm shadow-primary/5 transition-transform hover:-translate-y-1">
                            <div className="flex items-center justify-center gap-4">
                                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                                    <f.icon size={22} strokeWidth={1.8} />
                                </span>
                                <span className="font-display text-3xl font-extrabold text-accent/30">{String(i + 1).padStart(2, '0')}</span>
                            </div>
                            <h3 className="mt-5 font-display text-lg font-bold text-primary">{f.t}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
                        </article>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-[80rem] px-5 pb-8 lg:px-10">
                <div className="overflow-hidden rounded-3xl bg-primary px-7 py-14 text-center text-primary-foreground sm:px-14">
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold sm:text-4xl">
                        Comece a usar todas as funcionalidades
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                        O cadastro é gratuito. Valide sua membresia e acesse a rede completa.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link to="/como-participar" className="rounded-lg bg-accent px-7 py-4 font-display font-bold text-accent-foreground">Quero participar</Link>
                        <Link to="/o-que-e" className="inline-flex items-center gap-2 rounded-lg border border-white/35 px-7 py-4 font-display font-bold">
                            O que é o Conexão Batista <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
