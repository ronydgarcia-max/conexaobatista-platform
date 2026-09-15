import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Check, Building2, Briefcase, Star, Crown, Users, ShieldCheck, TrendingUp, Tag, Target, ArrowRight } from 'lucide-react';

const porQue = [
    'Público qualificado, membros de igrejas batistas de todo o Brasil',
    'Confiança elevada, todos os membros são validados',
    'Segmentação natural, público que valoriza ética, integridade e princípios cristãos',
    'Custo-benefício, planos acessíveis para empresas de todos os portes',
    'Visibilidade direcionada, sua mensagem chega a quem realmente importa',
];

const planos = [
    {
        icon: Briefcase, nome: 'Profissional (Autônomo)', custo: 'Grátis', destaque: false,
        desc: 'Para autônomos e profissionais liberais. Vinculado ao cadastro de pessoa física.',
        itens: [
            'Perfil com descrição de serviços',
            'Até 3 habilidades listadas',
            'Anúncio de vagas de trabalho',
            '1 publicação mensal no Instagram no nosso perfil (@cbconexaobatista). A criação da arte é de responsabilidade do profissional/empresa anunciante. Caso necessite de apoio, podemos indicar um designer parceiro, mediante contratação e pagamento separado.',
        ],
    },
    {
        icon: Star, nome: 'Destaque', custo: 'R$ 19,90/mês', destaque: true,
        desc: 'Para pequenas empresas que querem visibilidade.',
        itens: [
            'Tudo do plano gratuito',
            'Perfil empresarial completo',
            'Logo e descrição detalhada',
            'Até 10 produtos/serviços listados',
            'Selo "Empresa Verificada"',
            '1 publicação semanal no Instagram no nosso perfil (@cbconexaobatista). A criação da arte é de responsabilidade do profissional/empresa anunciante. Caso necessite de apoio, podemos indicar um designer parceiro, mediante contratação e pagamento separado.',
        ],
    },
    {
        icon: Crown, nome: 'Premium', custo: 'R$ 119,90/mês', destaque: false,
        desc: 'Para empresas que querem máxima exposição.',
        itens: [
            'Tudo do plano Destaque',
            'Posição privilegiada nas buscas',
            'Banner rotativo na página inicial',
            'Publicação de artigos no blog',
            'Acesso prioritário a eventos',
            'Relatórios de desempenho',
            'Suporte prioritário',
            '1 publicação semanal no Instagram no nosso perfil (@cbconexaobatista). A criação da arte é de responsabilidade do profissional/empresa anunciante. Caso necessite de apoio, podemos indicar um designer parceiro, mediante contratação e pagamento separado.',
            'Acesso à plataforma de delivery (site em cbdelivery.com.br/seu-negocio): cardápio digital, checkout, painel de atendimento, controle de conteúdo, impressão de comandas, jogos promocionais, SMS, notificações, integrações com pagamento, comunicação em tempo real, telefonia, voz e assistentes com IA.',
        ],
        obs: 'Não está incluído o Setup (criação da loja, customização com logomarca e cores, cadastro do cardápio).',
    },
];

const vagas = [
    'Até 20 vagas por empresa',
    'Publicação por 30 dias',
    'Destaque no banco de vagas',
    'Notificação por e-mail para candidatos',
    'Acesso aos currículos',
];

const beneficios = [
    { icon: Users, t: 'Negócios entre irmãos' },
    { icon: ShieldCheck, t: 'Confiança mútua' },
    { icon: TrendingUp, t: 'Crescimento conjunto' },
    { icon: Tag, t: 'Clube de vantagens' },
    { icon: Target, t: 'Eventos e networking' },
];

export default function BusinessPage() {
    return (
        <div className="page-centered">
            <Helmet>
                <title>Para Empresas | Conexão Batista</title>
                <meta name="description" content="Sua empresa conectada à comunidade batista. Planos Profissional (grátis), Destaque (R$ 19,90/mês) e Premium (R$ 119,90/mês) para alcançar membros validados de igrejas batistas em todo o Brasil." />
            </Helmet>

            {/* Hero */}
            <section className="relative flex min-h-[55dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/60" />
                <div className="relative mx-auto w-full max-w-[80rem] px-5 py-24 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        Para empresas
                    </p>
                    <h1 className="mt-5 mx-auto max-w-3xl font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
                        Sua empresa conectada à <span className="marker-underline">comunidade batista</span>
                    </h1>
                    <p className="mt-6 mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/85">
                        Encontre clientes fiéis, colaboradores confiáveis e uma rede de apoio que faz negócios com confiança.
                    </p>
                </div>
            </section>

            {/* Introdução + Por que anunciar */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                    <div className="text-left">
                        <p className="text-base leading-relaxed text-foreground">
                            Se você é empresário e quer alcançar um público que compartilha dos mesmos valores que você, o Conexão Batista é o lugar certo. Aqui, você encontra clientes fiéis, colaboradores confiáveis e uma rede de apoio que faz negócios com confiança.
                        </p>
                        <h2 className="mt-8 font-display text-2xl font-bold text-primary">Por que anunciar no Conexão Batista?</h2>
                        <ul className="mt-6 space-y-3">
                            {porQue.map((p) => (
                                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                                    <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                                    <span>{p}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-3xl bg-primary p-9 text-primary-foreground">
                        <Building2 size={34} className="text-accent" />
                        <p className="mt-5 font-display text-2xl font-bold leading-snug">
                            Uma empresa, vários irmãos atendendo.
                        </p>
                        <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85">
                            Após o cadastro pessoal validado, vincule seu negócio à sua conta e ofereça produtos, serviços e empregos para toda a comunidade.
                        </p>
                        <Link to="/como-participar" className="mt-6 inline-flex items-center gap-2 font-display font-bold text-accent hover:gap-3 transition-all">
                            Como cadastrar minha empresa <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Planos */}
            <section className="bg-muted/60 py-20">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <div className="mx-auto mb-12 max-w-2xl">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Planos para empresas</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Escolha o plano ideal</h2>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
                        {planos.map((p) => (
                            <div
                                key={p.nome}
                                className={`flex flex-col rounded-3xl border bg-white p-8 shadow-sm ${p.destaque ? 'border-accent ring-2 ring-accent/30 lg:-translate-y-2' : 'border-border'}`}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <span className={`grid h-12 w-12 place-items-center rounded-xl ${p.destaque ? 'bg-accent text-accent-foreground' : 'bg-primary/8 text-primary'}`}>
                                        <p.icon size={22} strokeWidth={1.8} />
                                    </span>
                                    {p.destaque && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">Mais popular</span>}
                                </div>
                                <h3 className="mt-5 font-display text-xl font-bold text-primary">{p.nome}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                                <p className="mt-5 font-display text-3xl font-extrabold text-primary">{p.custo}</p>
                                <ul className="mt-6 flex-1 space-y-3 text-left">
                                    {p.itens.map((it) => (
                                        <li key={it} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
                                            <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                                            <span>{it}</span>
                                        </li>
                                    ))}
                                </ul>
                                {p.obs && (
                                    <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-left text-xs font-semibold text-amber-800">
                                        OBS.: {p.obs}
                                    </p>
                                )}
                                <Link
                                    to="/plans"
                                    className={`mt-7 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-display font-bold transition-transform active:scale-[0.98] ${p.destaque ? 'bg-accent text-accent-foreground hover:brightness-105' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                                >
                                    Assinar plano <ArrowRight size={16} />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Vagas */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
                    <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary">
                            <Briefcase size={22} strokeWidth={1.8} />
                        </span>
                        <h2 className="mt-5 font-display text-2xl font-bold text-primary">Precisa contratar? Divulgue sua vaga</h2>
                        <ul className="mt-6 space-y-3">
                            {vagas.map((v) => (
                                <li key={v} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                                    <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                                    <span>{v}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-6 font-display text-2xl font-extrabold text-accent">Custo: Grátis</p>
                    </div>
                    <div>
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Benefícios exclusivos</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Mais do que anúncios</h2>
                        <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            {beneficios.map((b) => (
                                <div key={b.t} className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-muted/40 p-5">
                                    <b.icon size={22} className="shrink-0 text-primary" strokeWidth={1.8} />
                                    <p className="font-display text-sm font-bold text-primary">{b.t}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-[80rem] px-5 pb-8 lg:px-10">
                <div className="overflow-hidden rounded-3xl bg-primary px-7 py-14 text-center text-primary-foreground sm:px-14">
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold sm:text-4xl">
                        Coloque sua empresa diante da rede
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                        Comece pelo cadastro pessoal gratuito e vincule seu negócio em minutos.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link to="/plans" className="rounded-lg bg-accent px-7 py-4 font-display font-bold text-accent-foreground">Ver planos e assinar</Link>
                        <Link to="/como-participar" className="rounded-lg border border-white/35 px-7 py-4 font-display font-bold">Como participar</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
