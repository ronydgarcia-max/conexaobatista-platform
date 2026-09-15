import React from 'react';
import { Layers, PlayCircle, Clock, BookMarked } from 'lucide-react';

// Matriz curricular: lista de módulos/aulas com tópicos e duração (quando
// disponíveis). Formato escaneável e claro. Quando não há módulos no banco,
// exibe um placeholder discreto mantendo o layout profissional — sem inventar
// conteúdo.
export default function CurriculumMatrix({ modulos }) {
    const lista = Array.isArray(modulos) ? modulos : [];

    if (lista.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
                <BookMarked size={40} className="mx-auto mb-4 text-primary/30" />
                <p className="font-display text-base font-bold text-primary">
                    Matriz curricular em breve
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    A estrutura detalhada de módulos e aulas deste curso será
                    publicada assim que estiver disponível. Acompanhe as
                    atualizações na plataforma.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {lista.map((m, i) => {
                const titulo = m.titulo || m.nome || `Módulo ${i + 1}`;
                const duracao = m.duracao || m.carga_horaria || '';
                const aulas = Array.isArray(m.aulas) ? m.aulas : Array.isArray(m.topicos) ? m.topicos : [];

                return (
                    <div key={m.id || i} className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-5 py-4">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1 text-left">
                                <h4 className="font-display text-base font-bold text-primary">{titulo}</h4>
                                {duracao && (
                                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock size={12} /> {duracao}
                                    </p>
                                )}
                            </div>
                            <Layers size={18} className="text-primary/40" />
                        </div>

                        {aulas.length > 0 && (
                            <ul className="divide-y divide-border">
                                {aulas.map((a, j) => {
                                    const nome = typeof a === 'string' ? a : (a.titulo || a.nome || a.topico || `Aula ${j + 1}`);
                                    const aDur = typeof a === 'object' ? (a.duracao || a.carga_horaria || '') : '';
                                    return (
                                        <li key={j} className="flex items-center gap-3 px-5 py-3 text-sm">
                                            <PlayCircle size={16} className="shrink-0 text-accent" />
                                            <span className="flex-1 text-left text-foreground/90">{nome}</span>
                                            {aDur && <span className="text-xs text-muted-foreground">{aDur}</span>}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
