import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, BookOpen, GraduationCap } from 'lucide-react';

// Banner principal do curso com imagem (ou gradiente coerente quando ausente),
// overlay azul e breadcrumb discreto no topo. Preserva a paleta Conexão Batista.
export default function CourseBanner({ imagem, titulo, categoria }) {
    const img = imagem || '';

    return (
        <section className="relative flex min-h-[42dvh] items-end overflow-hidden bg-primary">
            {img ? (
                <img
                    src={img}
                    alt={titulo || 'Curso'}
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/70" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-primary/30" />

            <div className="relative mx-auto w-full max-w-[80rem] px-5 py-10 lg:px-10 lg:py-14">
                {/* Breadcrumb discreto alinhado ao topo */}
                <nav
                    aria-label="Trilha de navegação"
                    className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-medium text-primary-foreground/80"
                >
                    <Link to="/curso" className="inline-flex items-center gap-1 transition-colors hover:text-accent">
                        <Home size={13} /> Home
                    </Link>
                    <ChevronRight size={13} className="opacity-60" />
                    <Link to="/curso/cursos" className="inline-flex items-center gap-1 transition-colors hover:text-accent">
                        <BookOpen size={13} /> Cursos
                    </Link>
                    <ChevronRight size={13} className="opacity-60" />
                    <span className="inline-flex max-w-[14rem] items-center gap-1 truncate text-accent sm:max-w-xs">
                        {titulo || 'Curso'}
                    </span>
                </nav>

                {/* Categoria em destaque */}
                {categoria && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                        <GraduationCap size={13} /> {categoria}
                    </span>
                )}

                {/* Título do curso em grande destaque */}
                <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold leading-[1.1] text-white sm:text-4xl lg:text-5xl">
                    {titulo || 'Curso'}
                </h1>
            </div>
        </section>
    );
}
