import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Clock, Tag, ArrowRight, BookOpen, Briefcase, Users, HandHelping, GraduationCap, Laptop, Check, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiServerClient from '@/lib/apiServerClient';

const precos = ['Todos', 'Gratuito', 'Pago'];

// Formata o preço (string numérica vinda da VPS, ex.: "0.00", "79.90").
function formatarPreco(preco) {
    const valor = Number(preco);
    if (!Number.isFinite(valor) || valor === 0) return { label: 'Gratuito', gratuito: true };
    const texto = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return { label: `R$ ${texto}`, gratuito: false };
}

export default function CursosPage() {
    const [categorias, setCategorias] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroCarga, setErroCarga] = useState('');
    const [catFiltro, setCatFiltro] = useState(''); // '' = Todas as categorias
    const [precoFiltro, setPrecoFiltro] = useState('Todos');

    useEffect(() => {
        let cancelado = false;
        async function carregar() {
            setCarregando(true);
            setErroCarga('');
            try {
                const [resCat, resCursos] = await Promise.all([
                    apiServerClient.fetch('/categorias'),
                    apiServerClient.fetch('/cursos-publicados'),
                ]);
                if (!resCat.ok || !resCursos.ok) {
                    throw new Error('Falha ao carregar cursos e categorias.');
                }
                const dataCat = await resCat.json();
                const dataCursos = await resCursos.json();
                if (cancelado) return;
                setCategorias(dataCat.categorias || []);
                setCursos(dataCursos.cursos || []);
            } catch (e) {
                if (!cancelado) {
                    setErroCarga(e?.message || 'Não foi possível carregar os cursos no momento.');
                }
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }
        carregar();
        return () => { cancelado = true; };
    }, []);

    const filtrados = useMemo(() => {
        return cursos.filter((c) => {
            const catOk = !catFiltro || c.categoria === catFiltro;
            const { gratuito } = formatarPreco(c.preco);
            const precoOk =
                precoFiltro === 'Todos' ||
                (precoFiltro === 'Gratuito' && gratuito) ||
                (precoFiltro === 'Pago' && !gratuito);
            return catOk && precoOk;
        });
    }, [cursos, catFiltro, precoFiltro]);

    return (
        <div className="page-centered">
            <Helmet>
                <title>Cursos e Capacitação | Conexão Batista</title>
                <meta name="description" content="Desenvolva suas habilidades em fé e profissão com cursos de liderança cristã, empreendedorismo bíblico, finanças pessoais e muito mais." />
            </Helmet>

            {/* Hero */}
            <section className="relative flex min-h-[50dvh] items-center overflow-hidden bg-primary text-primary-foreground">
                <img
                    src="https://images.hostinger.com/b94be402-145f-4813-b749-2d12a2671520.png"
                    alt="Curso de liderança cristã"
                    className="absolute inset-0 h-full w-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/60" />
                <div className="relative mx-auto w-full max-w-[80rem] px-5 py-24 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                        Cursos e Capacitação
                    </p>
                    <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                        Capacitação com <span className="marker-underline">propósito</span>
                    </h1>
                    <p className="mt-5 mx-auto max-w-2xl text-lg text-primary-foreground/85">
                        O Conexão Batista acredita que o crescimento integral do cristão envolve fé, conhecimento e habilidades práticas. Aqui você encontra cursos gratuitos e pagos, ministrados por irmãos especializados, tudo com excelência e fundamentação bíblica.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link
                            to="/cadastro-cursos"
                            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 font-display text-sm font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]"
                        >
                            <UserPlus size={18} /> Criar conta de aluno
                        </Link>
                        <a
                            href="https://cursos.conexaobatista.com.br"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3.5 font-display text-sm font-bold text-white transition-colors hover:bg-white/20"
                        >
                            Acessar a plataforma <ArrowRight size={16} />
                        </a>
                    </div>
                </div>
            </section>

            {/* Filtros */}
            <section className="sticky top-[60px] z-30 border-b border-border bg-white/95 backdrop-blur shadow-sm">
                <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-center gap-4 px-5 py-4 lg:px-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</span>
                        <select
                            value={catFiltro}
                            onChange={(e) => setCatFiltro(e.target.value)}
                            className="max-w-[16rem] rounded-full border border-border bg-white px-3 py-1 text-sm font-medium text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none"
                        >
                            <option value="">Todas as categorias</option>
                            {categorias.map((cat) => (
                                <option key={cat.slug} value={cat.nome}>
                                    {cat.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preço</span>
                        {precos.map((p) => (
                            <button
                                key={p}
                                onClick={() => setPrecoFiltro(p)}
                                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${precoFiltro === p ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:border-accent hover:text-accent'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10">
                {carregando ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
                        <Loader2 size={40} className="animate-spin text-primary" />
                        <p className="font-display font-semibold">Carregando cursos…</p>
                    </div>
                ) : erroCarga ? (
                    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center text-muted-foreground">
                        <AlertCircle size={40} className="text-destructive" />
                        <p className="font-display font-semibold text-foreground">{erroCarga}</p>
                        <p className="text-sm">Tente novamente em instantes.</p>
                    </div>
                ) : filtrados.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-display font-semibold">Nenhum curso encontrado com esses filtros.</p>
                    </div>
                ) : (
                    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                        {filtrados.map((c) => {
                            const { label: precoLabel, gratuito } = formatarPreco(c.preco);
                            const carga = Number(c.carga_horaria);
                            return (
                                <article key={c.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-transform hover:-translate-y-1">
                                    <div className="relative overflow-hidden">
                                        {c.imagem_url ? (
                                            <img
                                                src={c.imagem_url}
                                                alt={c.titulo}
                                                className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
                                                <GraduationCap size={48} className="text-primary/40" />
                                            </div>
                                        )}
                                        {gratuito && (
                                            <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
                                                Gratuito
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col p-6">
                                        {c.categoria && (
                                            <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                <Tag size={11} /> {c.categoria}
                                            </span>
                                        )}
                                        <h3 className="font-display text-xl font-bold text-primary">{c.titulo}</h3>
                                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">{c.descricao}</p>
                                        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            {Number.isFinite(carga) && carga > 0 && (
                                                <span className="flex items-center gap-1"><Clock size={13} /> {carga}h de carga</span>
                                            )}
                                        </div>
                                        <div className="mt-5 flex items-center justify-center gap-3">
                                            <p className="font-display text-xl font-extrabold text-primary">
                                                {precoLabel}
                                            </p>
                                            <a
                                                href="https://cursos.conexaobatista.com.br"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:gap-2.5 active:scale-[0.98]"
                                            >
                                                {gratuito ? 'Inscrever-se' : 'Saiba mais'} <ArrowRight size={15} />
                                            </a>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Áreas de cursos */}
            <section className="bg-muted/60 py-20">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <div className="mx-auto mb-12 max-w-2xl">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Áreas de cursos</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Cresça em todas as áreas da vida</h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            { icon: BookOpen, t: 'Teologia e Bíblia', d: 'Estudos bíblicos, hermenêutica, história da Igreja, doutrinas, apologética.' },
                            { icon: Briefcase, t: 'Negócios e Carreira', d: 'Finanças bíblicas, empreendedorismo cristão, liderança, marketing com propósito.' },
                            { icon: Users, t: 'Família e Relacionamentos', d: 'Preparação para o casamento, educação de filhos, restauração familiar.' },
                            { icon: HandHelping, t: 'Vida Espiritual', d: 'Oração, jejum, discipulado, evangelismo pessoal, vida devocional.' },
                            { icon: GraduationCap, t: 'Ministério e Liderança', d: 'Formação de líderes, pastoreio, pregação, louvor, jovens, crianças, missões.' },
                            { icon: Laptop, t: 'Tecnologia e Habilidades Digitais', d: 'Programação, design, comunicação digital, redes sociais, Inteligência Artificial.' },
                        ].map((a) => (
                            <div key={a.t} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                                <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                                    <a.icon size={20} strokeWidth={1.8} />
                                </span>
                                <h3 className="mt-4 font-display text-base font-bold text-primary">{a.t}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Como funciona + Instrutores */}
            <section className="mx-auto max-w-[80rem] px-5 py-20 lg:px-10 text-left">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Como funciona</p>
                        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Estude no seu ritmo</h2>
                        <ol className="mt-8 space-y-5">
                            {[
                                { n: '1', t: 'Navegue pelo catálogo', d: 'Cursos organizados por categoria.' },
                                { n: '2', t: 'Escolha seu curso', d: 'Gratuitos e pagos, com valores acessíveis.' },
                                { n: '3', t: 'Estude no seu ritmo', d: 'Videoaulas, materiais de apoio, atividades práticas.' },
                            ].map((s) => (
                                <li key={s.n} className="flex gap-5">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground">{s.n}</span>
                                    <div>
                                        <p className="font-display text-base font-bold text-primary">{s.t}</p>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
                        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Nossos instrutores</p>
                        <ul className="mt-6 space-y-4">
                            {[
                                'Pastores e teólogos, formação acadêmica e experiência ministerial',
                                'Profissionais cristãos, especialistas no mercado',
                                'Líderes capacitados, trajetória comprovada no ministério',
                            ].map((i) => (
                                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                                    <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                                    <span>{i}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA banner */}
            <section className="mx-auto max-w-[80rem] px-5 pb-16 lg:px-10">
                <div className="overflow-hidden rounded-3xl bg-primary px-7 py-14 text-center text-primary-foreground">
                    <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold sm:text-4xl">
                        Você tem conhecimento para ensinar?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                        Seja um mentor na comunidade Conexão Batista e impacte vidas com sua experiência.
                    </p>
                    <a
                        href="/contato"
                        className="mt-8 inline-block rounded-lg bg-accent px-7 py-4 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]"
                    >
                        Quero ser mentor
                    </a>
                </div>
            </section>
        </div>
    );
}
