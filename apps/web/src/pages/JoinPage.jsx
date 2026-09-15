import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { UserCheck, ShieldCheck, Rocket, Building2, Check, ChevronDown, BadgeCheck, UserPlus } from 'lucide-react';

const passos = [
    {
        icon: UserCheck, n: '01', t: 'Faça seu cadastro pessoal',
        d: 'Preencha o formulário com seus dados básicos: nome, e-mail, WhatsApp, data de nascimento e cidade. Conte um pouco sobre você: profissão, habilidades e como pode servir a outros irmãos. Importante: o cadastro é sempre feito como pessoa física. Cada membro precisa ter seu perfil individual validado.',
    },
    {
        icon: ShieldCheck, n: '02', t: 'Valide sua membresia',
        d: 'Para garantir a segurança e a confiança da rede, confirme sua ligação com uma igreja batista escolhendo uma das duas opções de validação:',
        opcoes: [
            { letra: '1', t: 'Validação pela igreja', d: 'Informe sua igreja batista durante o cadastro. Sua membresia será confirmada por um representante autorizado pela própria igreja, como pastor, secretário(a), presidente ou outro responsável oficialmente indicado.', d2: 'Após a confirmação, seu perfil será validado e você terá acesso à rede.' },
            { letra: '2', t: 'Apadrinhamento', d: 'Se você já conhece alguém que faz parte da rede, essa pessoa poderá apadrinhar e validar seu cadastro, desde que tenha pelo menos seis meses de cadastro ativo no Conexão Batista.' },
        ],
    },
    {
        icon: Rocket, n: '03', t: 'Comece a usar a rede',
        d: 'Após a validação, você terá acesso completo a todas as funcionalidades: diretório, marketplace, banco de vagas, rede de oração, fórum, cursos e muito mais.',
    },
];

const empresaPassos = [
    'Acesse sua área de membro',
    'Clique em “Cadastrar minha empresa”',
    'Preencha os dados do negócio (CNPJ, ramo de atuação, descrição, produtos/serviços)',
    'Escolha o plano ideal para sua empresa (gratuito, Destaque ou Premium)',
    'Pronto! Sua empresa estará visível para toda a comunidade',
];

const niveis = [
    { cor: 'bg-emerald-500', t: 'Nível 1, Validação pastoral', d: 'Membresia confirmada por um pastor. Acesso completo + selo “Membro Validado”.' },
    { cor: 'bg-amber-500', t: 'Nível 2, Apadrinhamento', d: 'Membro antigo da rede (mínimo 6 meses) garante por você. Acesso completo + selo “Membro Apadrinhado”.' },
];

const faqs = [
    { q: 'Preciso pagar para participar?', a: 'Não. O acesso ao Conexão Batista é gratuito para pessoas físicas. Isso inclui: cadastro validado, diretório de membros, acesso a empresas, banco de vagas, rede de oração, fórum, Corações Conectados, blog e alguns cursos gratuitos. O que pode ter custo: cursos premium (opcionais) e planos para empresas (Destaque ou Premium). Resumindo: você pode usar toda a rede sem pagar nada.' },
    { q: 'Quem pode participar?', a: 'Qualquer pessoa que seja membro de uma igreja batista no Brasil, independentemente da convenção (CBB, CBN, IBI, Independente, etc.).' },
    { q: 'Minha igreja precisa autorizar?', a: 'Não. Apenas precisa comprovar que é membro.' },
    { q: 'Posso cadastrar minha empresa?', a: 'Sim! Veja a página “Para Empresas”.' },
];

function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-border">
            <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                <span className="font-display text-base font-bold text-primary">{q}</span>
                <ChevronDown size={20} className={`shrink-0 text-accent transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>}
        </div>
    );
}

export default function JoinPage() {
    return (
        <div className="page-centered">
            <Helmet>
                <title>Como participar | Conexão Batista</title>
                <meta name="description" content="Participe do Conexão Batista em três passos: cadastro pessoal, validação da membresia e acesso à rede. Cadastro gratuito para membros de igrejas batistas no Brasil." />
            </Helmet>

            {/* Hero */}
            <section className="relative flex min-h-[55dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/60" />
                <div className="relative mx-auto w-full max-w-[80rem] px-5 py-24 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        Como participar
                    </p>
                    <h1 className="mt-5 mx-auto max-w-3xl font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
                        Três passos para fazer parte da <span className="marker-underline">rede</span>
                    </h1>
                    <p className="mt-6 mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/85">
                        Participar do Conexão Batista é simples, rápido e gratuito. O cadastro é feito como pessoa física, todo membro precisa ter seu perfil pessoal validado.
                    </p>
                </div>
            </section>

            {/* Intro */}
            <section className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10">
                <p className="mx-auto max-w-3xl text-base leading-relaxed text-foreground">
                    Em poucos minutos, você estará conectado a milhares de irmãos de fé em todo o Brasil. E se você tem uma empresa, não se preocupe: após o cadastro pessoal, você poderá vincular seu negócio à sua conta e oferecer seus produtos ou serviços para toda a comunidade. Uma empresa, vários irmãos atendendo.
                </p>
            </section>

            {/* Passos */}
            <section className="mx-auto max-w-[80rem] px-5 pb-20 lg:px-10">
                <div className="space-y-6">
                    {passos.map((s) => (
                        <div key={s.n} className="rounded-3xl border border-border bg-white p-8 shadow-sm shadow-primary/5 lg:p-10">
                            <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
                                <div className="flex items-center justify-center gap-4 lg:w-64 lg:shrink-0">
                                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
                                        <s.icon size={26} strokeWidth={1.8} />
                                    </span>
                                    <div>
                                        <p className="font-display text-3xl font-extrabold text-accent">{s.n}</p>
                                        <p className="font-display text-lg font-bold text-primary">{s.t}</p>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-base leading-relaxed text-foreground">{s.d}</p>
                                    {s.opcoes && (
                                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                            {s.opcoes.map((o) => (
                                                <div key={o.letra} className="rounded-2xl border border-border bg-muted/40 p-5">
                                                    <p className="font-display text-sm font-bold text-accent">Opção {o.letra}</p>
                                                    <p className="mt-1 font-display text-sm font-bold text-primary">{o.t}</p>
                                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{o.d}</p>
                                                    {o.d2 && (
                                                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{o.d2}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Empresa */}
            <section className="bg-muted/60 py-20 text-left">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
                        <div>
                            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
                                <Building2 size={22} strokeWidth={1.8} />
                            </span>
                            <h2 className="mt-5 font-display text-3xl font-bold text-primary sm:text-4xl">Tem uma empresa? Cadastre também!</h2>
                            <p className="mt-4 text-base leading-relaxed text-foreground">
                                Se você é empresário e quer oferecer seus produtos, serviços e empregos na plataforma, basta vincular sua empresa ao seu cadastro pessoal. É simples:
                            </p>
                            <ul className="mt-6 space-y-3">
                                {empresaPassos.map((p) => (
                                    <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                                        <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                                        <span>{p}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                                Importante: para cadastrar uma empresa, é obrigatório que o responsável já tenha cadastro pessoal validado como membro da rede.
                            </p>
                            <Link to="/para-empresas" className="mt-6 inline-flex items-center gap-2 font-display font-bold text-primary hover:gap-3 transition-all">
                                Ver planos para empresas <Building2 size={18} />
                            </Link>
                        </div>
                        <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
                            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Níveis de validação</p>
                            <div className="mt-6 space-y-5">
                                {niveis.map((n) => (
                                    <div key={n.t} className="flex items-start gap-4 rounded-2xl border border-border p-5">
                                        <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${n.cor}`} />
                                        <div>
                                            <p className="font-display text-base font-bold text-primary">{n.t}</p>
                                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{n.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-primary/5 p-5">
                                <BadgeCheck className="shrink-0 text-primary" size={22} />
                                <p className="text-sm font-semibold text-primary">Não é possível participar do Conexão Batista sem validação.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Perguntas frequentes</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Tire suas dúvidas</h2>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            Não encontrou o que procurava? Fale com a gente pela página de contato.
                        </p>
                    </div>
                    <div className="border-t border-border">
                        {faqs.map((f) => (
                            <FaqItem key={f.q} {...f} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-[80rem] px-5 pb-8 lg:px-10">
                <div className="overflow-hidden rounded-3xl bg-primary px-7 py-14 text-center text-primary-foreground sm:px-14">
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold sm:text-4xl">
                        Pronto para fazer parte?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                        O cadastro é gratuito e leva poucos minutos. Valide sua membresia e entre na rede.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link to="/cadastro" className="inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-4 font-display font-bold text-accent-foreground">
                            <UserPlus size={18} /> Criar minha conta
                        </Link>
                        <Link to="/funcionalidades" className="rounded-lg border border-white/35 px-7 py-4 font-display font-bold">Ver funcionalidades</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
