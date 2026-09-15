import React from 'react';
import { BookOpen, Target, Users, ClipboardList } from 'lucide-react';

// Bloco "Sobre o curso": descrição completa, objetivos, público-alvo e
// pré-requisitos. Cada bloco só é exibido quando o dado existe; quando
// faltam objetivos/público/pré-requisitos, um placeholder discreto mantém
// o layout profissional sem inventar conteúdo.
function Bloco({ icon: Icon, titulo, children, vazio }) {
    return (
        <div className="rounded-xl border border-border bg-muted/20 p-5">
            <h4 className="flex items-center gap-2 font-display text-base font-bold text-primary">
                <Icon size={18} className="text-accent" /> {titulo}
            </h4>
            <div className="mt-3 text-sm leading-relaxed text-foreground/90">
                {children || (
                    <p className="italic text-muted-foreground">{vazio}</p>
                )}
            </div>
        </div>
    );
}

export default function CourseAbout({ descricao, objetivos, publicoAlvo, prerequisitos }) {
    return (
        <div className="space-y-6">
            <Bloco icon={BookOpen} titulo="Descrição completa" vazio="A descrição detalhada deste curso será disponibilizada em breve.">
                {descricao && <p className="whitespace-pre-line">{descricao}</p>}
            </Bloco>

            <div className="grid gap-6 sm:grid-cols-2">
                <Bloco icon={Target} titulo="Objetivos do curso" vazio="Os objetivos serão detalhados em breve.">
                    {objetivos && <p className="whitespace-pre-line">{objetivos}</p>}
                </Bloco>
                <Bloco icon={Users} titulo="Público-alvo" vazio="O público-alvo será detalhado em breve.">
                    {publicoAlvo && <p className="whitespace-pre-line">{publicoAlvo}</p>}
                </Bloco>
            </div>

            <Bloco icon={ClipboardList} titulo="Pré-requisitos" vazio="Não há pré-requisitos informados para este curso.">
                {prerequisitos && <p className="whitespace-pre-line">{prerequisitos}</p>}
            </Bloco>
        </div>
    );
}
