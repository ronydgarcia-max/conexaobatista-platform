import React from 'react';
import { Clock, Tag, BarChart3, CheckCircle2, Sparkles } from 'lucide-react';

// Formata preço: 0 ou ausente → "Gratuito"; otherwise "R$ x.xxx,xx".
function formatarPrecoLabel(preco) {
    const valor = Number(preco);
    if (!Number.isFinite(valor) || valor === 0) return 'Gratuito';
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Card de resumo rápido (sidebar no desktop, acima do conteúdo no mobile).
// Exibe carga horária, investimento, nível (se existir) e status de inscrição.
// Não inventa dados — campos ausentes são omitidos discretamente.
export default function CourseSummary({ cargaHoraria, preco, nivel, status, onInscrever, inscrito }) {
    const gratuito = !Number.isFinite(Number(preco)) || Number(preco) === 0;
    const linhas = [
        cargaHoraria && { icon: Clock, label: 'Carga horária', value: cargaHoraria },
        { icon: Tag, label: 'Investimento', value: formatarPrecoLabel(preco) },
        nivel && { icon: BarChart3, label: 'Nível', value: nivel },
    ].filter(Boolean);

    const publicado = !status || status === 'publicado';

    return (
        <aside className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-accent">Resumo rápido</p>

            <dl className="mt-5 space-y-4">
                {linhas.map((l) => (
                    <div key={l.label} className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-3 last:border-0 last:pb-0">
                        <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                            <l.icon size={16} className="text-primary" /> {l.label}
                        </dt>
                        <dd className="text-sm font-bold text-foreground">{l.value}</dd>
                    </div>
                ))}
            </dl>

            <div className="mt-5 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                {publicado ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                        <CheckCircle2 size={14} /> Inscrições abertas
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
                        <Sparkles size={14} /> Curso disponível
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={onInscrever}
                disabled={inscrito}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3.5 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {inscrito ? 'Inscrito ✓' : gratuito ? 'Inscrever-se' : 'Adicionar ao carrinho'}
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
                Acesso ao conteúdo após a confirmação da matrícula.
            </p>
        </aside>
    );
}
