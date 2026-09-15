import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Home, BookOpen, ShoppingCart, User, GraduationCap, ArrowLeft, Library } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

// Navegação específica da plataforma de cursos (isolada do site principal).
//
// O item "Meus Cursos (Mentor)" foi REMOVIDO completamente do menu e das
// rotas do frontend — o Painel do Mentor já funciona separadamente na VPS
// (acessível pelo link "Área do mentor", que faz SSO para a VPS). Não há
// recriação do painel nem alteração da URL da VPS.
//
// Itens marcados com `mentorOnly: true` (atualmente apenas "Área do mentor")
// levam ao Painel do Mentor hospedado na VPS via SSO. Eles só devem aparecer
// para usuários autenticados cuja função seja mentor aprovado
// (users.mentor_status === 'aprovado'). Para alunos (qualquer usuário que NÃO
// seja mentor aprovado), esses links são ocultados do menu e do rodapé —
// permanece somente a navegação do Painel do Aluno.
const navItems = [
    { to: '/curso', label: 'Home', icon: Home, end: true },
    { to: '/curso/cursos', label: 'Cursos', icon: BookOpen },
    { to: '/curso/meus-cursos', label: 'Meus Cursos', icon: Library },
    { to: '/curso/carrinho', label: 'Carrinho', icon: ShoppingCart },
    { to: '/curso/aluno', label: 'Área do aluno', icon: User },
    { to: '/curso/boas-vindas', label: 'Área do mentor', icon: GraduationCap, mentorOnly: true },
];

/**
 * Determina se o usuário autenticado atual é um mentor aprovado.
 * Um usuário só é considerado mentor quando users.mentor_status === 'aprovado'.
 * Qualquer outro estado (pendente, rejeitado, vazio) ou usuário não autenticado
 * é tratado como aluno — sem acesso aos links do Painel do Mentor.
 */
function useIsMentorAprovado() {
    const [isMentor, setIsMentor] = useState(() => {
        const record = pb.authStore.record || pb.authStore.model;
        return Boolean(record && record.mentor_status === 'aprovado');
    });

    useEffect(() => {
        const avaliar = () => {
            const record = pb.authStore.record || pb.authStore.model;
            setIsMentor(Boolean(record && record.mentor_status === 'aprovado'));
        };
        avaliar();
        const unsubscribe = pb.authStore.onChange(avaliar);
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    return isMentor;
}

// Cabeçalho próprio da plataforma de cursos
function CursoHeader() {
    const [open, setOpen] = useState(false);
    const isMentor = useIsMentorAprovado();

    // Alunos (não mentores aprovados) veem somente a navegação do Painel do
    // Aluno — os links do Painel do Mentor são removidos (não exibidos nem
    // abertos).
    const itensVisiveis = navItems.filter((n) => !n.mentorOnly || isMentor);

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-primary text-primary-foreground shadow-sm">
            <div className="mx-auto flex max-w-[90rem] items-center gap-4 px-5 py-3 lg:px-10">
                <Link to="/curso" className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-sm font-bold text-accent-foreground">CB</span>
                    <span className="font-display text-lg font-bold leading-none">
                        Conexão<span className="text-accent">Cursos</span>
                    </span>
                </Link>

                <nav className="ml-auto hidden items-center gap-1 lg:flex">
                    {itensVisiveis.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            className={({ isActive }) =>
                                `inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-primary-foreground/80 hover:bg-white/10 hover:text-white'}`
                            }
                        >
                            <n.icon size={16} /> {n.label}
                        </NavLink>
                    ))}
                </nav>

                <button
                    type="button"
                    aria-label="Abrir menu"
                    onClick={() => setOpen((v) => !v)}
                    className="ml-auto grid h-11 w-11 place-items-center rounded-lg border border-white/25 text-white lg:hidden"
                >
                    {open ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {open && (
                <div className="border-t border-white/10 px-5 py-2 lg:hidden">
                    {itensVisiveis.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-2 rounded-md px-2 py-3 text-base font-semibold ${isActive ? 'bg-white/15 text-white' : 'text-primary-foreground/85'}`
                            }
                        >
                            <n.icon size={18} /> {n.label}
                        </NavLink>
                    ))}
                </div>
            )}
        </header>
    );
}

// Rodapé próprio da plataforma de cursos
function CursoFooter() {
    const isMentor = useIsMentorAprovado();
    const itensVisiveis = navItems.filter((n) => !n.mentorOnly || isMentor);

    return (
        <footer className="mt-20 bg-primary text-primary-foreground">
            <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-12 lg:grid-cols-3 lg:px-10">
                <div>
                    <p className="font-display text-xl font-bold">Conexão<span className="text-accent">Cursos</span></p>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-primary-foreground/75">
                        Capacitação com propósito para membros da rede Conexão Batista. Fé, conhecimento e habilidades práticas com excelência.
                    </p>
                </div>
                <div>
                    <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">Plataforma</p>
                    <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
                        {itensVisiveis.map((n) => (
                            <li key={n.to}>
                                <Link to={n.to} className="hover:text-white">{n.label}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">Site principal</p>
                    <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
                        <li><Link to="/" className="inline-flex items-center gap-1.5 hover:text-white"><ArrowLeft size={14} /> Voltar ao Conexão Batista</Link></li>
                        <li><Link to="/como-participar" className="hover:text-white">Como participar</Link></li>
                        <li><Link to="/termos-uso-privacidade" className="hover:text-white">Termos e Privacidade</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/15 px-5 py-6 text-center text-xs text-primary-foreground/60 lg:px-10">
                © {new Date().getFullYear()} Conexão Batista — Plataforma de Cursos. Ambiente demonstrativo.
            </div>
        </footer>
    );
}

// Layout isolado da plataforma de cursos
export default function CursoLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <CursoHeader />
            <main className="flex-1">
                <Outlet />
            </main>
            <CursoFooter />
        </div>
    );
}
