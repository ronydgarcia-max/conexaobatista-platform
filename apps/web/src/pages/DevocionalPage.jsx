import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { CalendarDays, BookOpen, User, ArrowRight, Mail, Check, HandHelping, Share2, PenLine } from 'lucide-react';
const devocionais = [{
  id: 1,
  data: '2026-08-05',
  dataFmt: '5 de agosto de 2026',
  titulo: 'A Força do Silêncio',
  versiculo: '"Sede quietos e sabei que eu sou Deus." — Salmos 46:10',
  reflexao: 'Em um mundo de ruídos constantes, Deus nos convida ao silêncio não como fuga, mas como encontro. É no quieto que a voz d\'Ele se torna mais clara e nossa fé mais profunda.',
  autor: 'Pr. Elias Moreira',
  destaque: true
}, {
  id: 2,
  data: '2026-08-04',
  dataFmt: '4 de agosto de 2026',
  titulo: 'Generosidade que Transborda',
  versiculo: '"Dêem e lhes será dado." — Lucas 6:38',
  reflexao: 'A generosidade bíblica não é cálculo; é resposta ao que já recebemos. Quando damos sem conta, descobrimos que a provisão de Deus sempre supera nossa necessidade.',
  autor: 'Dra. Ana Paula Lima',
  destaque: false
}, {
  id: 3,
  data: '2026-08-03',
  dataFmt: '3 de agosto de 2026',
  titulo: 'Caminha com Sábios',
  versiculo: '"Quem anda com os sábios torna-se sábio." — Provérbios 13:20',
  reflexao: 'As comunidades que escolhemos moldam quem nos tornamos. A rede de irmãos batistas é mais do que utilidade; é sabedoria compartilhada e caráter formado juntos.',
  autor: 'Pr. João Ferreira',
  destaque: false
}, {
  id: 4,
  data: '2026-08-02',
  dataFmt: '2 de agosto de 2026',
  titulo: 'Trabalho como Adoração',
  versiculo: '"E tudo o que fizerdes, fazei de todo o coração, como ao Senhor." — Colossenses 3:23',
  reflexao: 'Cada e-mail respondido, cada cliente atendido, cada projeto entregue pode ser um ato de adoração. Quando trabalhamos com excelência e integridade, glorificamos ao Senhor.',
  autor: 'Roberto Cunha',
  destaque: false
}, {
  id: 5,
  data: '2026-08-01',
  dataFmt: '1 de agosto de 2026',
  titulo: 'Fé que Move',
  versiculo: '"A fé é o fundamento das coisas que se esperam." — Hebreus 11:1',
  reflexao: 'A fé bíblica não é passividade; é ação baseada em quem Deus é. Quando agimos com base no caráter d\'Ele, mesmo sem ver o resultado, movemos montanhas.',
  autor: 'Pr. Elias Moreira',
  destaque: false
}, {
  id: 6,
  data: '2026-07-31',
  dataFmt: '31 de julho de 2026',
  titulo: 'Levando as Cargas',
  versiculo: '"Levai as cargas uns dos outros." — Gálatas 6:2',
  reflexao: 'Ninguém foi projetado para carregar tudo sozinho. A comunidade não é opcional no plano de Deus; é o próprio método dele para nos sustentar e nos transformar.',
  autor: 'Dra. Ana Paula Lima',
  destaque: false
}, {
  id: 7,
  data: '2026-07-30',
  dataFmt: '30 de julho de 2026',
  titulo: 'Raízes Profundas',
  versiculo: '"Lançai raízes para baixo e dai frutos para cima." — 2 Reis 19:30',
  reflexao: 'Frutos visíveis só existem por causa de raízes invisíveis. A disciplina espiritual (oração, Palavra, comunhão) é o que sustenta tudo o que construímos acima do solo.',
  autor: 'Pr. João Ferreira',
  destaque: false
}];
const destaque = devocionais.find(d => d.destaque);
const anteriores = devocionais.filter(d => !d.destaque);
export default function DevocionalPage() {
  const [email, setEmail] = useState('');
  const [inscrito, setInscrito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const handleInscricao = e => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setInscrito(true);
      setLoading(false);
    }, 900);
  };
  return <div className="page-centered">
            <Helmet>
                <title>Devocional Diário | Conexão Batista</title>
                <meta name="description" content="Devocional diário para membros da comunidade batista. Fortaleça sua fé com reflexões bíblicas profundas escritas por mentores e pastores." />
            </Helmet>

            {/* Hero */}
            <section className="relative flex min-h-[50dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <img src="https://images.hostinger.com/10e7a8d0-6b16-4aa1-8a35-a897a2d79083.png" alt="Bíblia aberta com luz da manhã" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/60" />
                <div className="relative mx-auto w-full max-w-[80rem] px-5 py-24 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        Devocional Diário
                    </p>
                    <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                        Um momento diário com <span className="marker-underline">Deus</span>
                    </h1>
                    <p className="mt-5 mx-auto max-w-2xl text-lg text-primary-foreground/85">
                        Em meio à correria do dia a dia, o Devocional Diário do Conexão Batista é um convite para pausar, respirar e encontrar-se com o Senhor todos os dias. Reflexões bíblicas curtas, mas profundas, escritas por pastores, teólogos e irmãos maduros na fé.
                    </p>
                </div>
            </section>

            {/* Por que + Como funciona */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10 text-left">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Por que um devocional diário?</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Uma palavra a cada dia</h2>
                        <ul className="mt-8 space-y-4">
                            {[{
              icon: HandHelping,
              t: 'Fortalecimento espiritual',
              d: 'Cada dia, uma palavra de Deus para sua vida.'
            }, {
              icon: BookOpen,
              t: 'Conhecimento das Escrituras',
              d: 'Mergulhe mais fundo na Palavra.'
            }, {
              icon: Check,
              t: 'Encorajamento',
              d: 'Quando você está fraco, Deus fala.'
            }, {
              icon: User,
              t: 'Comunidade',
              d: 'Milhares de irmãos lendo a mesma reflexão, orando juntos.'
            }].map(p => <li key={p.t} className="flex items-start gap-4">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                                        <p.icon size={18} strokeWidth={1.8} />
                                    </span>
                                    <div>
                                        <p className="font-display text-base font-bold text-primary">{p.t}</p>
                                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
                                    </div>
                                </li>)}
                        </ul>
                    </div>
                    <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Como funciona</p>
                        <ol className="mt-6 space-y-5">
                            {[{
              n: '1',
              t: 'Leia o devocional do dia',
              d: 'Reflexão breve, versículo, aplicação prática.'
            }, {
              n: '2',
              t: 'Medite',
              d: 'Reserve um tempo para oração e reflexão pessoal.'
            }, {
              n: '3',
              t: 'Compartilhe',
              d: 'Divida com amigos e família.'
            }, {
              n: '4',
              t: 'Receba por e-mail',
              d: 'Inscreva-se e receba o devocional na sua caixa de entrada.'
            }].map(s => <li key={s.n} className="flex gap-4">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">{s.n}</span>
                                    <div>
                                        <p className="font-display text-sm font-bold text-primary">{s.t}</p>
                                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                                    </div>
                                </li>)}
                        </ol>
                    </div>
                </div>
            </section>

            {/* Nossos autores + Frequência */}
            <section className="bg-muted/60 py-20">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                        <div>
                            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Nossos autores</p>
                            <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Vozes maduras na fé</h2>
                            <ul className="mt-8 space-y-4">
                                {['Pastores e líderes de igrejas batistas', 'Teólogos e professores de Bíblia', 'Missionários e evangelistas', 'Cristãos maduros com experiência de vida'].map(a => <li key={a} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                                        <PenLine size={18} className="mt-0.5 shrink-0 text-accent" />
                                        <span>{a}</span>
                                    </li>)}
                            </ul>
                        </div>
                        <div className="flex flex-col justify-center rounded-3xl bg-primary p-8 text-primary-foreground">
                            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Frequência</p>
                            <p className="mt-4 font-display text-2xl font-bold leading-snug">
                                Um novo devocional publicado todos os dias, 365 dias por ano.
                            </p>
                            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85">
                                Quer contribuir? Se você é membro validado e tem uma reflexão bíblica para compartilhar, entre em contato. Toda contribuição passa por análise pastoral.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10">
                {/* Destaque do dia */}
                {destaque && <section className="mb-16">
                        <p className="mb-6 font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Devocional de hoje</p>
                        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-md shadow-primary/5 lg:grid lg:grid-cols-[1fr_1.2fr]">
                            <img src="https://horizons-cdn.hostinger.com/3511c081-b89b-40cb-afcd-860bbc439db4/devocional-cXeds.png" alt="Devocional do dia" className="h-64 w-full object-cover lg:h-full" />
                            <div className="p-8 lg:p-10">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarDays size={13} />
                                    <span>{destaque.dataFmt}</span>
                                </div>
                                <h2 className="mt-4 font-display text-3xl font-extrabold text-primary sm:text-4xl">
                                    {destaque.titulo}
                                </h2>
                                <blockquote className="mt-5 rounded-xl border-l-4 border-accent bg-accent/8 px-5 py-4 font-display text-base font-semibold italic text-primary">
                                    {destaque.versiculo}
                                </blockquote>
                                <p className="mt-5 text-base leading-relaxed text-foreground">{destaque.reflexao}</p>
                                <div className="mt-6 flex items-center justify-center gap-3">
                                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <User size={14} /> {destaque.autor}
                                    </span>
                                    <button className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:gap-2.5 active:scale-[0.98]">
                                        Ler completo <ArrowRight size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>}

                {/* Devocional subscription */}
                <section className="mb-14 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 border border-border px-7 py-10">
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-sm">
                            <p className="font-display text-lg font-bold text-primary">Receba o devocional no seu e-mail</p>
                            <p className="mt-1 text-sm text-muted-foreground">Toda manhã, uma reflexão para começar o dia com Deus.</p>
                        </div>
                        {inscrito ? <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-3 font-semibold text-emerald-700">
                                <Check size={18} /> Inscrito com sucesso!
                            </div> : <form onSubmit={handleInscricao} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                                <input type="email" required placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
                                    <Mail size={15} /> {loading ? 'Inscrevendo...' : 'Inscrever'}
                                </button>
                            </form>}
                    </div>
                </section>

                {/* Últimos devocionals */}
                <section>
                    <p className="mb-8 font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Últimos dias</p>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {anteriores.map(d => <article key={d.id} className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-transform hover:-translate-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarDays size={12} />
                                    <span>{d.dataFmt}</span>
                                </div>
                                <h3 className="mt-3 font-display text-lg font-bold text-primary">{d.titulo}</h3>
                                <p className="mt-2 rounded-lg border-l-2 border-accent bg-accent/6 px-3 py-2 text-xs font-semibold italic text-primary/80">
                                    {d.versiculo}
                                </p>
                                <p className={`mt-3 flex-1 text-sm leading-relaxed text-muted-foreground transition-all ${expandido === d.id ? '' : 'line-clamp-3'}`}>
                                    {d.reflexao}
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-3">
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <User size={12} /> {d.autor}
                                    </span>
                                    <button onClick={() => setExpandido(expandido === d.id ? null : d.id)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:gap-2 transition-all">
                                        {expandido === d.id ? 'Ver menos' : 'Ler completo'} <ArrowRight size={13} />
                                    </button>
                                </div>
                            </article>)}
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="mt-16 overflow-hidden rounded-3xl bg-primary px-7 py-14 text-center text-primary-foreground">
                    <BookOpen size={36} className="mx-auto mb-4 text-accent" />
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold">
                        A Palavra de Deus para cada dia
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                        Junte-se a milhares de batistas que começam o dia com o devocional Conexão Batista.
                    </p>
                </section>
            </div>
        </div>;
}