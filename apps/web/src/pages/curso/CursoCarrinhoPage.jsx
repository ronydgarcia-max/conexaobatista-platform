import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowRight, GraduationCap } from 'lucide-react';
import {
    obterCarrinho,
    removerDoCarrinho,
    limparCarrinho,
    totalCarrinho,
    EVENTO,
} from '@/lib/cursoCarrinho';

// Formata um número de preço no padrão pt-BR (R$ x.xxx,xx).
function formatarPreco(valor) {
    const n = Number(valor);
    if (!Number.isFinite(n) || n === 0) return 'Gratuito';
    return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// URL da plataforma de cursos onde o pagamento/checkout é concluído.
const PLATAFORMA_CURSOS_URL = 'https://cursos.conexaobatista.com.br';

// Carrinho de compras — itens reais adicionados pelo usuário (localStorage),
// com preços vindos da API. Sem cursos fictícios e sem valores hardcoded.
export default function CursoCarrinhoPage() {
    const [itens, setItens] = useState([]);

    useEffect(() => {
        const atualizar = () => setItens(obterCarrinho());
        atualizar();
        window.addEventListener(EVENTO, atualizar);
        return () => window.removeEventListener(EVENTO, atualizar);
    }, []);

    const subtotal = itens.reduce((acc, i) => acc + (Number(i.preco) || 0), 0);
    const total = subtotal;

    const remover = (id) => {
        removerDoCarrinho(id);
        setItens(obterCarrinho());
    };

    const esvaziar = () => {
        limparCarrinho();
        setItens([]);
    };

    const finalizar = () => {
        // O checkout é concluído na plataforma de cursos (VPS), onde o
        // pagamento e a matrícula são processados de fato.
        window.location.href = PLATAFORMA_CURSOS_URL;
    };

    return (
        <div className="page-centered">
            <Helmet>
                <title>Carrinho | Conexão Cursos</title>
                <meta name="description" content="Carrinho de compras da plataforma de cursos Conexão Batista." />
            </Helmet>

            <section className="bg-primary py-14 text-primary-foreground">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Carrinho</p>
                    <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Seu carrinho</h1>
                </div>
            </section>

            <section className="mx-auto max-w-[80rem] px-5 py-16 lg:px-10 text-left">
                {itens.length === 0 ? (
                    <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
                        <ShoppingCart size={48} className="mx-auto mb-4 text-muted-foreground/40" />
                        <p className="font-display text-lg font-bold text-primary">Seu carrinho está vazio</p>
                        <p className="mt-2 text-sm text-muted-foreground">Explore o catálogo e adicione cursos para continuar.</p>
                        <Link to="/curso/cursos" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]">
                            Ver cursos <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
                        {/* Lista de itens reais */}
                        <div className="divide-y divide-border rounded-2xl border border-border bg-white shadow-sm">
                            {itens.map((i) => (
                                <div key={i.id} className="flex items-center gap-4 p-5">
                                    {i.imagem ? (
                                        <img src={i.imagem} alt={i.titulo} className="h-20 w-28 rounded-lg object-cover" />
                                    ) : (
                                        <div className="grid h-20 w-28 place-items-center rounded-lg bg-primary/10">
                                            <GraduationCap size={28} className="text-primary/40" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-display text-base font-bold text-primary">{i.titulo}</h3>
                                        {i.instrutor && <p className="mt-0.5 text-sm text-muted-foreground">Instrutor: {i.instrutor}</p>}
                                        <p className="mt-1 font-display text-lg font-extrabold text-primary">{formatarPreco(i.preco)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remover(i.id)}
                                        aria-label={`Remover ${i.titulo}`}
                                        className="grid h-10 w-10 place-items-center rounded-lg border border-border text-destructive transition-colors hover:bg-destructive/10"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <div className="p-4 text-right">
                                <button
                                    type="button"
                                    onClick={esvaziar}
                                    className="text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
                                >
                                    Esvaziar carrinho
                                </button>
                            </div>
                        </div>

                        {/* Resumo de preços reais */}
                        <aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm">
                            <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">Resumo</p>
                            <dl className="mt-5 space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <dt className="text-muted-foreground">Subtotal</dt>
                                    <dd className="font-semibold text-foreground">{formatarPreco(subtotal)}</dd>
                                </div>
                                <div className="border-t border-border pt-3" />
                                <div className="flex items-center justify-between">
                                    <dt className="font-display font-bold text-primary">Total</dt>
                                    <dd className="font-display text-xl font-extrabold text-primary">{formatarPreco(total)}</dd>
                                </div>
                            </dl>
                            <button
                                type="button"
                                onClick={finalizar}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3.5 font-display font-bold text-accent-foreground transition-transform hover:brightness-105 active:scale-[0.98]"
                            >
                                Finalizar na plataforma <ArrowRight size={18} />
                            </button>
                            <p className="mt-3 text-center text-xs text-muted-foreground">
                                O pagamento e a matrícula são concluídos na plataforma de cursos.
                            </p>
                            <Link to="/curso/cursos" className="mt-4 block text-center text-sm font-semibold text-primary hover:underline">
                                Continuar comprando
                            </Link>
                        </aside>
                    </div>
                )}
            </section>
        </div>
    );
}
