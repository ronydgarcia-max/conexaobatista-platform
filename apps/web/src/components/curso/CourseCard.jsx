import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, Star, Tag, ArrowRight, GraduationCap } from 'lucide-react';

// Card reutilizável de curso para a listagem e destaques.
// Não exibe "nível" — a coluna não existe no banco de cursos.
function formatarPrecoLabel(preco) {
    const valor = Number(preco);
    if (!Number.isFinite(valor) || valor === 0) return 'Gratuito';
    const texto = valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `R$ ${texto}`;
}

// Card clicável: todo o card leva à página de detalhes do curso
// (/curso/:id). O indicador visual "Ver detalhes →" deixa claro que é
// clicável, com cursor pointer e hover effect (sombra + elevação).
export default function CourseCard({ curso }) {
    const navigate = useNavigate();
    const precoNum = Number(curso.preco);
    const gratuito = !Number.isFinite(precoNum) || precoNum === 0;
    const img = curso.img || curso.imagem_url || '';

    const irParaDetalhe = () => navigate(`/curso/${curso.id}`);

    return (
        <article
            role="link"
            tabIndex={0}
            onClick={irParaDetalhe}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    irParaDetalhe();
                }
            }}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(30,58,138,0.18)] focus-visible:ring-2 focus-visible:ring-primary"
        >
            <div className="relative block overflow-hidden">
                {img ? (
                    <img
                        src={img}
                        alt={curso.titulo}
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
                {/* Indicador visual de clicável — aparece no hover */}
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-primary opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
                    Ver detalhes <ArrowRight size={12} />
                </span>
            </div>

            <div className="flex flex-1 flex-col p-6">
                {curso.categoria && (
                    <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        <Tag size={11} /> {curso.categoria}
                    </span>
                )}
                <h3 className="font-display text-xl font-bold text-primary transition-colors group-hover:text-accent">{curso.titulo}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">{curso.descricao}</p>

                {curso.avaliacao != null && Number.isFinite(Number(curso.avaliacao)) && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-accent">
                        <Star size={13} className="fill-accent" />
                        <span className="font-semibold">{Number(curso.avaliacao).toFixed(1)}</span>
                        {curso.alunos != null && (
                            <span className="text-muted-foreground">({curso.alunos} alunos)</span>
                        )}
                    </div>
                )}

                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {curso.instrutor && (
                        <span className="flex items-center gap-1"><User size={13} /> {curso.instrutor}</span>
                    )}
                    {curso.duracao && (
                        <span className="flex items-center gap-1"><Clock size={13} /> {curso.duracao}</span>
                    )}
                </div>

                <div className="mt-5 flex items-center justify-center gap-3">
                    <p className="font-display text-xl font-extrabold text-primary">
                        {formatarPrecoLabel(curso.preco)}
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all group-hover:gap-2.5">
                        Saiba mais <ArrowRight size={15} />
                    </span>
                </div>
            </div>
        </article>
    );
}
