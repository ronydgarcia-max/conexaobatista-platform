import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, BookOpen, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
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

// Listagem de cursos com categorias canônicas dinâmicas, busca e paginação.
export default function CursoCursosPage() {
    const [categorias, setCategorias] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroCarga, setErroCarga] = useState('');
    const [catFiltro, setCatFiltro] = useState('Todos');
    const [busca, setBusca] = useState('');
    const [pagina, setPagina] = useState(1);

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
                setCursos((dataCursos.cursos || []).map(normalizarCursoPublico));
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
        const q = busca.trim().toLowerCase();
        return cursos.filter((c) => {
            const catOk = catFiltro === 'Todos' || c.categoria === catFiltro;
            const buscaOk =
                q === '' ||
                c.titulo.toLowerCase().includes(q) ||
                (c.instrutor && c.instrutor.toLowerCase().includes(q));
            return catOk && buscaOk;
        });
    }, [cursos, catFiltro, busca]);

    // Reset página ao mudar filtros
    useEffect(() => {
        setPagina(1);
    }, [catFiltro, busca]);

    const porPagina = 6;
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    const paginaSegura = Math.min(pagina, totalPaginas);
    const inicio = (paginaSegura - 1) * porPagina;
    const visiveis = filtrados.slice(inicio, inicio + porPagina);

    return (
        <div className="page-centered">
            <Helmet>
                <title>Cursos | Conexão Cursos</title>
                <meta name="description" content="Catálogo de cursos da Conexão Batista com categorias canônicas e fundamentação bíblica." />
            </Helmet>

            {/* Cabeçalho da listagem */}
            <section className="bg-primary py-14 text-primary-foreground">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Catálogo</p>
                    <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Todos os cursos</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">
                        Encontre o curso ideal para o seu momento de fé e carreira.
                    </p>
                </div>
            </section>

            {/* Filtros e busca — categorias canônicas; SEM filtro Nível */}
            <section className="sticky top-[57px] z-30 border-b border-border bg-white/95 backdrop-blur shadow-sm">
                <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-center gap-4 px-5 py-4 lg:px-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</span>
                        <button
                            type="button"
                            onClick={() => setCatFiltro('Todos')}
                            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${catFiltro === 'Todos' ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
                        >
                            Todos
                        </button>
                        <select
                            value={catFiltro === 'Todos' ? 'Todos' : catFiltro}
                            onChange={(e) => setCatFiltro(e.target.value)}
                            className="max-w-[18rem] rounded-full border border-border bg-white px-3 py-1 text-sm font-medium text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none"
                            aria-label="Filtrar por categoria"
                        >
                            <option value="Todos">Todas as categorias</option>
                            {categorias.map((cat) => (
                                <option key={cat.slug || cat.nome} value={cat.nome}>
                                    {cat.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar por título ou instrutor"
                            className="w-full rounded-lg border border-input bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                    </div>
                </div>
            </section>

            {/* Grid de cursos */}
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
                ) : visiveis.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-display font-semibold">Nenhum curso encontrado com esses filtros.</p>
                    </div>
                ) : (
                    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                        {visiveis.map((c) => (
                            <CourseCard key={c.id} curso={c} />
                        ))}
                    </div>
                )}

                {/* Paginação */}
                {!carregando && !erroCarga && totalPaginas > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPagina((p) => Math.max(1, p - 1))}
                            disabled={paginaSegura === 1}
                            className="grid h-10 w-10 place-items-center rounded-lg border border-border text-primary disabled:opacity-40"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: totalPaginas }).map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setPagina(i + 1)}
                                className={`h-10 w-10 rounded-lg border text-sm font-semibold transition-colors ${paginaSegura === i + 1 ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                            disabled={paginaSegura === totalPaginas}
                            className="grid h-10 w-10 place-items-center rounded-lg border border-border text-primary disabled:opacity-40"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
