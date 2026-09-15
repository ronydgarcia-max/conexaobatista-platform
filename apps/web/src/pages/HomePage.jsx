import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Users, Briefcase, HeartHandshake, Store, ArrowRight, Quote } from 'lucide-react';

const pilares = [
    { icon: Users, title: 'Comunhão', text: 'Encontre irmãos perto de você, participe de grupos e fortaleça vínculos além do culto de domingo.' },
    { icon: Store, title: 'Negócios', text: 'Contrate e seja contratado por empresas de irmãos, com confiança e indicação real.' },
    { icon: Briefcase, title: 'Empregos', text: 'Banco de vagas exclusivo, publicado por empresas e membros da rede batista.' },
    { icon: HeartHandshake, title: 'Oração', text: 'Compartilhe pedidos e intercede por quem precisa. Ninguém carrega o peso sozinho.' },
];

const passos = [
    { n: '01', t: 'Faça seu cadastro', d: 'Poucos minutos: dados básicos, sua igreja local e sua área de atuação.' },
    { n: '02', t: 'Valide sua membresia', d: 'Declaração da igreja, indicação pastoral ou convite de um membro já validado.' },
    { n: '03', t: 'Comece a usar a rede', d: 'Acesse o diretório, o marketplace, as vagas, a rede de oração e o clube de vantagens.' },
];

const depoimentos = [
    { nome: 'Marcos Andrade', papel: 'Dentista, PIB Campinas (SP)', foto: 'https://images.hostinger.com/2b929a67-6080-4513-820f-3f5ddb96f034.png', texto: 'Em duas semanas atendi seis famílias da rede. É trabalho, mas antes de tudo é comunhão.' },
    { nome: 'Priscila Nunes', papel: 'Arquiteta, IB Fortaleza (CE)', foto: 'https://images.hostinger.com/9e90387f-2467-4ad2-9d80-904e7df1ea62.png', texto: 'Mudei de cidade e encontrei irmãos, uma igreja e dois clientes no mesmo mês.' },
    { nome: 'Tiago Bezerra', papel: 'Desenvolvedor, IB Água Branca (SP)', foto: 'https://images.hostinger.com/65ea707c-62f9-4356-a7b3-cf5208e2d40d.png', texto: 'Consegui minha vaga atual pelo banco de vagas. Fui indicado por um irmão que nunca tinha visto.' },
];

const HomePage = () => {
    return (
        <div className="page-centered">
            <Helmet>
                <title>Conexão Batista | Rede exclusiva para membros de igrejas batistas</title>
                <meta name="description" content="Conectando batistas em fé, serviço e oportunidade. Diretório de membros, marketplace de serviços, vagas de emprego e rede de oração para membros de igrejas batistas no Brasil." />
            </Helmet>

            <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <img
                    src="https://images.hostinger.com/5b0b3a4b-cc29-468b-a998-1e77739c61e9.png"
                    alt="Irmãos se cumprimentando após o culto em uma igreja batista"
                    className="absolute inset-0 h-full w-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/50" />
                <div className="relative mx-auto grid w-full max-w-[80rem] gap-10 px-5 py-24 lg:px-10">
                    <div className="mx-auto max-w-3xl reveal">
                        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                            Rede exclusiva de membros
                        </p>
                        <h1 className="font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
                            Conectando batistas em <span className="marker-underline">fé, serviço e oportunidade</span>
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/85">
                            Uma rede exclusiva para membros de igrejas batistas no Brasil. Onde a comunhão se encontra com a oportunidade.
                        </p>
                        <div className="mt-9 flex flex-wrap justify-center gap-3">
                            <Link to="/como-participar" className="rounded-lg bg-accent px-7 py-4 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]">
                                Quero participar
                            </Link>
                            <Link to="/o-que-e" className="rounded-lg border border-white/35 px-7 py-4 font-display font-bold text-white transition-colors hover:bg-white/10">
                                Saiba mais
                            </Link>
                        </div>
                        <p className="mt-10 text-sm font-semibold text-primary-foreground/70">
                            “Levai as cargas uns dos outros e assim cumprireis a lei de Cristo.” — Gálatas 6:2
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <div className="mx-auto mb-12 max-w-2xl">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Os quatro pilares</p>
                    <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Uma rede de irmãos para irmãos</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {pilares.map((p) => (
                        <div key={p.title} className="group rounded-2xl border border-border bg-white p-7 shadow-sm shadow-primary/5 transition-transform hover:-translate-y-1">
                            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary">
                                <p.icon size={22} strokeWidth={1.8} />
                            </span>
                            <h3 className="mt-5 font-display text-xl font-bold text-primary">{p.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-muted/60 py-20">
                <div className="mx-auto grid max-w-[80rem] items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
                    <div>
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Como funciona</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Três passos e você está dentro</h2>
                        <ol className="mt-9 divide-y divide-border border-y border-border">
                            {passos.map((s) => (
                                <li key={s.n} className="flex gap-6 py-6">
                                    <span className="font-display text-2xl font-extrabold text-accent">{s.n}</span>
                                    <div>
                                        <p className="font-display text-lg font-bold text-primary">{s.t}</p>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <Link to="/como-participar" className="mt-8 inline-flex items-center gap-2 font-display font-bold text-primary hover:gap-3 transition-all">
                            Ver detalhes da validação <ArrowRight size={18} />
                        </Link>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <img src="https://images.hostinger.com/25ce0804-ab4b-4c8e-86f3-2f9a5560de27.png" alt="Profissionais reunidos trabalhando juntos" className="h-56 w-full rounded-2xl object-cover sm:h-72" />
                        <img src="https://images.hostinger.com/d00a155d-590e-4de7-81b9-c18fe869c7d8.png" alt="Grupo de irmãos orando juntos" className="h-56 w-full rounded-2xl object-cover sm:mt-10 sm:h-72" />
                        <img src="https://images.hostinger.com/077a5c23-3f44-48f9-bf19-2a3bc6d8f754.png" alt="Empreendedora em sua padaria" className="h-56 w-full rounded-2xl object-cover sm:h-64" />
                        <img src="https://images.hostinger.com/7339f601-4dcc-4465-b4cf-194d016deeaa.png" alt="Voluntários entregando cestas de alimentos" className="h-56 w-full rounded-2xl object-cover sm:h-64" />
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-primary sm:text-4xl">Irmãos que já vivem a rede</h2>
                <div className="mt-10 grid gap-6 lg:grid-cols-3">
                    {depoimentos.map((d) => (
                        <figure key={d.nome} className="rounded-2xl border border-border bg-white p-7">
                            <Quote className="text-accent" size={26} />
                            <blockquote className="mt-4 text-base leading-relaxed text-foreground">“{d.texto}”</blockquote>
                            <figcaption className="mt-6 flex items-center gap-3">
                                <img src={d.foto} alt={d.nome} className="h-11 w-11 rounded-full object-cover" />
                                <div>
                                    <p className="font-display text-sm font-bold text-primary">{d.nome}</p>
                                    <p className="text-xs text-muted-foreground">{d.papel}</p>
                                </div>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-[80rem] px-5 pb-8 lg:px-10">
                <div className="overflow-hidden rounded-3xl bg-primary px-7 py-14 text-center text-primary-foreground sm:px-14">
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold sm:text-4xl">
                        Sua próxima oportunidade pode estar no banco ao lado
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                        Cadastre-se gratuitamente, valide sua membresia e comece a servir e ser servido.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link to="/como-participar" className="rounded-lg bg-accent px-7 py-4 font-display font-bold text-accent-foreground">Quero participar</Link>
                        <Link to="/para-empresas" className="rounded-lg border border-white/35 px-7 py-4 font-display font-bold">Sou empresa</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
