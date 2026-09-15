import React from 'react';
import { Helmet } from 'react-helmet';
import { Heart, Quote, Mail, Check, BookOpen, PenLine, MapPin, Users, Sparkles } from 'lucide-react';

const criterios = [
    'História real e verificável',
    'Mostra fé em ação (obra social, missão, serviço, amor ao próximo)',
    'Respeita a privacidade das pessoas envolvidas',
    'Está alinhada com valores cristãos batistas',
    'Inspira outros a fazerem o mesmo',
];

const passos = [
    'Escreva sua história (entre 300 e 800 palavras)',
    'Envie uma foto (pode ser do trabalho, das pessoas envolvidas, do local)',
    'Inclua seu nome, cidade e igreja que frequenta',
    'Envie para: historias@conexaobatista.com.br',
];

const versiculos = [
    { ref: 'Mateus 5:16', texto: 'Assim brilhe a luz de vocês diante dos homens, para que vejam as suas boas obras e glorifiquem ao Pai de vocês, que está nos céus.' },
    { ref: 'Tiago 1:27', texto: 'Religião pura e sem mácula, para com o nosso Deus e Pai, é esta: visitar os órfãos e as viúvas nas suas aflições, e guardar-se isento da corrupção do mundo.' },
    { ref: 'Mateus 25:40', texto: 'Em verdade vos digo que, sempre que o fizestes a um destes meus irmãos, mesmo dos mais pequeninos, a mim o fizestes.' },
    { ref: 'Efésios 2:10', texto: 'Porque somos feitura sua, criados em Cristo Jesus para as boas obras, as quais Deus antes preparou para que andássemos nelas.' },
];

export default function HistoriasPage() {
    return (
        <div className="page-centered">
            <Helmet>
                <title>Histórias que inspiram | Conexão Batista</title>
                <meta name="description" content="Histórias reais de irmãos batistas vivendo a fé em ação. Testemunhos de serviço, missão e amor ao próximo que inspiram a ser instrumento de Deus." />
            </Helmet>

            {/* Hero */}
            <section className="relative flex min-h-[52dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/55" />
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
                <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
                <div className="relative mx-auto w-full max-w-[80rem] px-5 py-24 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        <Sparkles size={14} /> Fé em ação
                    </p>
                    <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                        Histórias que <span className="marker-underline">inspiram</span>
                    </h1>
                    <p className="mt-5 mx-auto max-w-2xl text-lg text-primary-foreground/85">
                        Histórias reais de irmãos servindo. Pessoas comuns que disseram "sim" ao chamado de Deus e se tornaram as mãos de Cristo onde estavam.
                    </p>
                    <blockquote className="mt-7 mx-auto max-w-xl rounded-2xl border border-white/15 bg-white/8 px-6 py-4 font-display text-base font-semibold italic text-primary-foreground/90">
                        "A fé, se não tiver obras, é morta em si mesma." — Tiago 2:26
                    </blockquote>
                </div>
            </section>

            {/* Introdução */}
            <section className="mx-auto max-w-[64rem] px-5 py-20 lg:px-10">
                <div className="space-y-5 text-base leading-relaxed text-foreground">
                    <p>
                        No Conexão Batista, cremos que o evangelho se vive na prática, amando o próximo, servindo os necessitados e sendo as mãos de Cristo onde estivermos. Aqui, irmãos compartilham histórias reais de como estão vivendo a fé além dos muros da igreja.
                    </p>
                    <p>
                        Essas não são histórias de super-heróis. São histórias de pessoas comuns, cheias de falhas e limitações, mas que decidiram dizer "sim" ao chamado de Deus para servir. São testemunhos de que o Espírito Santo continua trabalhando através de nós, transformando vidas e restaurando esperança.
                    </p>
                    <p className="font-display text-lg font-bold text-primary">
                        Que cada história aqui te inspire a também ser instrumento de Deus onde você está.
                    </p>
                </div>
            </section>

            {/* História em destaque */}
            <section className="bg-muted/60 py-20">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <p className="mb-8 font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">História em destaque</p>
                    <article className="overflow-hidden rounded-3xl border border-border bg-white shadow-md shadow-primary/5 lg:grid lg:grid-cols-[1fr_1.3fr]">
                        <div className="relative min-h-[18rem] bg-gradient-to-br from-primary to-primary/70 lg:min-h-full">
                            <img
                                src="https://images.hostinger.com/10e7a8d0-6b16-4aa1-8a35-a897a2d79083.png"
                                alt="Trabalho de resgate na reciclagem em Pindamonhangaba"
                                className="absolute inset-0 h-full w-full object-cover opacity-40"
                            />
                            <div className="relative flex h-full flex-col justify-end p-8 text-primary-foreground">
                                <Quote size={32} className="mb-3 text-accent" />
                                <p className="font-display text-sm font-semibold uppercase tracking-wider text-accent">Testemunho</p>
                            </div>
                        </div>
                        <div className="p-8 text-left lg:p-10">
                            <h2 className="font-display text-3xl font-extrabold text-primary sm:text-4xl">
                                Resgate na reciclagem
                            </h2>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Users size={14} /> João e Maria</span>
                                <span className="flex items-center gap-1.5"><MapPin size={14} /> Pindamonhangaba/SP</span>
                            </div>

                            <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground">
                                <p>
                                    Há dois anos, começamos um trabalho simples num local de reciclagem num bairro humilde da nossa cidade. A ideia era reunir as pessoas que trabalhavam ali, muitas em situação vulnerável, para compartilhar o amor de Cristo.
                                </p>
                                <p>
                                    No penúltimo sábado de cada mês, montávamos um encontro com louvor, uma mensagem curta e, depois, uma confraternização com comida. Era simples, mas era nosso, um espaço de acolhimento, escuta e esperança.
                                </p>
                                <p>
                                    Foi nesse contexto que conhecemos o Carlos*. Ele estava mergulhado nas drogas e no álcool, sem perspectiva de futuro. Começamos a conversar, a orar por ele, a acompanhá-lo. Depois de muito esforço, conseguimos interná-lo numa clínica de recuperação.
                                </p>
                                <p>
                                    Hoje, Carlos está fora da clínica. Conseguiu um lugar para morar, um emprego e está reconstruindo os laços com a família. Não é mais a mesma pessoa. É um novo homem em Cristo.
                                </p>
                            </div>

                            <blockquote className="mt-6 rounded-xl border-l-4 border-accent bg-accent/8 px-5 py-4 font-display text-base font-semibold italic text-primary">
                                "Tudo posso naquele que me fortalece." — Filipenses 4:13
                            </blockquote>
                            <p className="mt-4 text-xs text-muted-foreground">
                                *Nome fictício para proteger a privacidade.
                            </p>
                        </div>
                    </article>
                </div>
            </section>

            {/* Sua história também pode inspirar */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <div className="mx-auto max-w-2xl">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Sua história também pode inspirar</p>
                    <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Compartilhe o que Deus está fazendo</h2>
                    <p className="mt-5 text-base leading-relaxed text-foreground">
                        Você está vivendo algo assim? Está envolvido em algum trabalho social, missão ou ação de amor ao próximo? Quer compartilhar como Deus está usando sua vida para transformar realidades?
                    </p>
                    <p className="mt-4 text-base leading-relaxed text-foreground">
                        Envie sua história para nós. Ela pode inspirar outros irmãos a também serem instrumentos de Deus.
                    </p>
                </div>

                <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12 text-left">
                    {/* Como enviar */}
                    <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Como enviar</p>
                        <ol className="mt-6 space-y-5">
                            {passos.map((p, i) => (
                                <li key={i} className="flex gap-4">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">{i + 1}</span>
                                    <p className="pt-1.5 text-sm leading-relaxed text-foreground">{p}</p>
                                </li>
                            ))}
                        </ol>
                        <a
                            href="mailto:historias@conexaobatista.com.br"
                            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:gap-3 active:scale-[0.98]"
                        >
                            <Mail size={15} /> historias@conexaobatista.com.br
                        </a>
                    </div>

                    {/* Critérios */}
                    <div className="rounded-3xl bg-primary p-8 text-primary-foreground">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Critérios para publicação</p>
                        <ul className="mt-6 space-y-4">
                            {criterios.map((c) => (
                                <li key={c} className="flex items-start gap-3 text-sm leading-relaxed text-primary-foreground/90">
                                    <Check size={18} className="mt-0.5 shrink-0 text-accent" />
                                    <span>{c}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-7 border-t border-white/15 pt-5 text-xs leading-relaxed text-primary-foreground/70">
                            Toda contribuição passa por análise pastoral e editorial antes da publicação.
                        </p>
                    </div>
                </div>
            </section>

            {/* Fundamentação bíblica */}
            <section className="bg-muted/60 py-20">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <div className="mx-auto max-w-2xl">
                        <BookOpen size={32} className="mx-auto mb-4 text-accent" />
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Fundamentação bíblica</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Criados para as boas obras</h2>
                    </div>
                    <div className="mt-12 grid gap-5 sm:grid-cols-2">
                        {versiculos.map((v) => (
                            <blockquote key={v.ref} className="rounded-2xl border border-border bg-white p-7 text-left shadow-sm">
                                <Quote size={22} className="mb-3 text-accent" />
                                <p className="font-display text-base font-semibold italic leading-relaxed text-primary">
                                    "{v.texto}"
                                </p>
                                <footer className="mt-4 flex items-center gap-2 text-sm font-bold text-accent">
                                    <PenLine size={15} /> {v.ref}
                                </footer>
                            </blockquote>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA final */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-7 py-14 text-center text-primary-foreground">
                    <Heart size={36} className="mx-auto mb-4 text-accent" />
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold">
                        Seja as mãos de Cristo onde você está
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
                        Que a sua história também seja um testemunho do amor de Deus em ação. Comece a servir hoje, onde estiver.
                    </p>
                    <a
                        href="mailto:historias@conexaobatista.com.br"
                        className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-all hover:gap-3 active:scale-[0.98]"
                    >
                        <Mail size={16} /> Envie sua história
                    </a>
                </div>
            </section>
        </div>
    );
}
