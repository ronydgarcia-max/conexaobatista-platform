import React, { useState } from 'react';
import { BookOpen, ListTree } from 'lucide-react';

// Abas principais do curso: "Sobre o curso" e "Matriz curricular".
// Responsivo: as abas rolam horizontalmente quando necessário e o conteúdo
// se ajusta a uma coluna no mobile.
export default function CourseTabs({ sobre, matrizCurricular }) {
    const [aba, setAba] = useState('sobre');

    const abas = [
        { id: 'sobre', label: 'Sobre o curso', icon: BookOpen },
        { id: 'matriz', label: 'Matriz curricular', icon: ListTree },
    ];

    return (
        <div className="mt-8">
            {/* Navegação por abas (scroll horizontal no mobile) */}
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {abas.map((a) => {
                    const ativa = aba === a.id;
                    return (
                        <button
                            key={a.id}
                            type="button"
                            onClick={() => setAba(a.id)}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                                ativa
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'border border-border bg-white text-muted-foreground hover:border-primary hover:text-primary'
                            }`}
                        >
                            <a.icon size={16} /> {a.label}
                        </button>
                    );
                })}
            </div>

            {/* Conteúdo da aba ativa */}
            <div className="mt-6">
                {aba === 'sobre' ? sobre : matrizCurricular}
            </div>
        </div>
    );
}
