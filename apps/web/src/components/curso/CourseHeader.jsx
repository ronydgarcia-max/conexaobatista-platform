import React from 'react';
import { Tag, User } from 'lucide-react';

// Cabeçalho do curso: título destacado, categoria em badge e mentor/instrutor
// (quando disponível). Não inventa dados — apenas exibe o que existe.
export default function CourseHeader({ titulo, categoria, mentor, descricaoCurta }) {
    return (
        <header className="border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-3">
                {categoria && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        <Tag size={12} /> {categoria}
                    </span>
                )}
            </div>

            <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight text-primary sm:text-3xl">
                {titulo || 'Curso'}
            </h2>

            {descricaoCurta && (
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                    {descricaoCurta}
                </p>
            )}

            {mentor && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                        <User size={15} />
                    </span>
                    <span>
                        <span className="text-muted-foreground">Mentor: </span>
                        <span className="font-semibold text-primary">{mentor}</span>
                    </span>
                </p>
            )}
        </header>
    );
}
