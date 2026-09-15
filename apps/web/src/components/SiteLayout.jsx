import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Instagram, Mail, MessageCircle, ChevronDown } from 'lucide-react';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';
import { verificarAcessoPainel } from '@/components/igreja/IgrejaLayout.jsx';
import { useInstitutionalLogo } from '@/contexts/InstitutionalLogoContext.jsx';
import pb from '@/lib/pocketbaseClient';

// Navegação pública principal (prioridade solicitada)
const primaryNav = [
    { to: '/o-que-e', label: 'O que é' },
    { to: '/funcionalidades', label: 'Funcionalidades' },
    { to: '/curso', label: 'Cursos' },
    { to: '/devocional', label: 'Devocional' },
    { to: '/blog', label: 'Blog' },
];

// Links institucionais/secundários agrupados em "Mais"
const maisNav = [
    { to: '/como-participar', label: 'Como participar' },
    { to: '/para-empresas', label: 'Para empresas' },
    { to: '/relacionamentos', label: 'Corações Conectados' },
    { to: '/historias', label: 'Histórias que inspiram' },
    { to: '/plans', label: 'Planos' },
];

// Lista completa usada no rodapé
const allNav = [...primaryNav, ...maisNav];

// Emblema circular padrão com formas interligadas brancas e amarelas.
// Exibido quando nenhum logo personalizado está configurado (coleção
// config_logo). Quando há logo personalizado, a Brand renderiza a <img>.
export function LogoMark({ className = 'h-9 w-9' }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true" role="img">
            <circle cx="24" cy="24" r="23" fill="#1E3A8A" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
            <circle cx="18.5" cy="24" r="9" fill="none" stroke="#ffffff" strokeWidth="3.4" />
            <circle cx="29.5" cy="24" r="9" fill="none" stroke="#F59E0B" strokeWidth="3.4" />
            <circle cx="24" cy="24" r="2.7" fill="#F59E0B" />
        </svg>
    );
}

// Logo institucional: usa a imagem personalizada (config_logo) quando houver,
// com tamanho responsivo (desktop/celular), proporção preservada (object-
// contain + w-auto) e sem distorção; caso contrário exibe o emblema padrão.
// A transparência de PNG/SVG é preservada (o PocketBase serve o arquivo
// original e o <img> não impõe fundo), integrando-se ao fundo azul do site.
export function InstitutionalLogo({ className = '' }) {
    const { logoUrl } = useInstitutionalLogo();
    if (logoUrl) {
        return (
            <img
                src={logoUrl}
                alt="Conexão Batista"
                className={`h-7 w-auto max-w-[220px] shrink-0 object-contain sm:h-8 ${className}`}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        );
    }
    return <LogoMark className="h-8 shrink-0 sm:h-9" />;
}

// Marca do site. Quando há logo institucional personalizado, ele é o ÚNICO
// elemento de marca (o texto "ConexãoBatista" é removido para evitar
// duplicação — o logo já contém a identidade visual). Quando não há logo
// personalizado, mantém o fallback padrão atual (emblema + texto).
export function Brand({ onDark = true, compact = false }) {
    const { logoUrl } = useInstitutionalLogo();
    if (logoUrl) {
        // Logo personalizado: único elemento de marca, sem texto duplicado.
        // Altura visual equivalente à escrita anterior (text-lg ≈ 18px) com
        // folga para legibilidade (h-7 sm:h-8 = 28/32px), proporção preservada
        // (w-auto + object-contain), sem distorção, desktop e celular.
        return <InstitutionalLogo />;
    }
    // Fallback: logo padrão atual (emblema + texto "ConexãoBatista").
    return (
        <span className="flex items-center gap-2.5">
            <LogoMark className="h-8 shrink-0 sm:h-9" />
            <span
                className={`font-display font-bold leading-none ${compact ? 'text-base' : 'text-lg'} ${
                    onDark ? 'text-white' : 'text-primary'
                }`}
            >
                Conexão<span className="text-accent">Batista</span>
            </span>
        </span>
    );
}

export function Header() {
    const [open, setOpen] = useState(false);
    const [maisOpen, setMaisOpen] = useState(false);
    const { isAuthenticated, currentUser } = useSubscriptionAuth();
    const [podeAcessarPainel, setPodeAcessarPainel] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !currentUser) {
            setPodeAcessarPainel(false);
            return;
        }
        const collectionName =
            currentUser.collectionName ||
            (typeof currentUser.get === 'function' ? currentUser.get('collectionName') : undefined);
        if (collectionName === 'admins') {
            setPodeAcessarPainel(false);
            return;
        }
        let cancelled = false;
        (async () => {
            const { autorizado } = await verificarAcessoPainel(currentUser.id);
            if (!cancelled) setPodeAcessarPainel(autorizado);
        })();
        return () => { cancelled = true; };
    }, [isAuthenticated, currentUser]);

    const isChurchRep = podeAcessarPainel;
    const contaTo = isAuthenticated ? '/minha-conta' : '/login';
    const contaLabel = isAuthenticated ? 'Minha conta' : 'Entrar';

    const linkClass = ({ isActive }) =>
        `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
            isActive ? 'text-white' : 'text-white/70 hover:text-white'
        }`;

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-primary backdrop-blur">
            <div className="mx-auto flex max-w-[90rem] items-center gap-6 px-5 py-3 lg:px-10">
                <Link to="/" className="flex items-center gap-2.5" aria-label="Conexão Batista — início">
                    <Brand />
                </Link>

                {/* Navegação pública principal — desktop */}
                <nav className="ml-auto hidden items-center gap-1 xl:flex">
                    {primaryNav.map((n) => (
                        <NavLink key={n.to} to={n.to} className={linkClass}>
                            {n.label}
                        </NavLink>
                    ))}
                    <NavLink to={contaTo} className={linkClass}>
                        {contaLabel}
                    </NavLink>

                    {/* "Mais" — dropdown de links institucionais/secundários */}
                    <div
                        className="relative"
                        onMouseEnter={() => setMaisOpen(true)}
                        onMouseLeave={() => setMaisOpen(false)}
                    >
                        <button
                            type="button"
                            className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
                            onClick={() => setMaisOpen((v) => !v)}
                            aria-expanded={maisOpen}
                        >
                            Mais
                            <ChevronDown size={15} className={`transition-transform ${maisOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {maisOpen && (
                            <div className="absolute right-0 top-full w-56 rounded-xl border border-white/10 bg-primary p-1.5 shadow-xl shadow-black/30">
                                {maisNav.map((n) => (
                                    <NavLink
                                        key={n.to}
                                        to={n.to}
                                        className={({ isActive }) =>
                                            `block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                                isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
                                            }`
                                        }
                                    >
                                        {n.label}
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>

                    {isChurchRep && (
                        <NavLink to="/igreja/painel" className={linkClass}>
                            Painel da Igreja
                        </NavLink>
                    )}
                </nav>

                <div className="ml-auto flex items-center gap-2 xl:ml-0">
                    <Link
                        to="/como-participar"
                        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-transform hover:bg-accent/90 active:scale-[0.98]"
                    >
                        Quero participar
                    </Link>
                    <button
                        type="button"
                        aria-label="Abrir menu"
                        onClick={() => setOpen((v) => !v)}
                        className="grid h-11 w-11 place-items-center rounded-lg border border-white/20 text-white xl:hidden"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Menu mobile */}
            {open && (
                <div className="border-t border-white/10 bg-primary px-5 py-3 xl:hidden">
                    {primaryNav.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            onClick={() => setOpen(false)}
                            className="block rounded-md px-2 py-3 text-base font-semibold text-white"
                        >
                            {n.label}
                        </NavLink>
                    ))}
                    <NavLink
                        to={contaTo}
                        onClick={() => setOpen(false)}
                        className="block rounded-md px-2 py-3 text-base font-semibold text-white"
                    >
                        {contaLabel}
                    </NavLink>

                    <p className="px-2 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-accent">Mais</p>
                    {maisNav.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            onClick={() => setOpen(false)}
                            className="block rounded-md px-2 py-3 text-base font-semibold text-white/80"
                        >
                            {n.label}
                        </NavLink>
                    ))}

                    {isChurchRep && (
                        <NavLink
                            to="/igreja/painel"
                            onClick={() => setOpen(false)}
                            className="block rounded-md px-2 py-3 text-base font-semibold text-white"
                        >
                            Painel da Igreja
                        </NavLink>
                    )}
                </div>
            )}
        </header>
    );
}

export function Footer() {
    const { isAuthenticated } = useSubscriptionAuth();
    return (
        <footer className="mt-24 bg-primary text-primary-foreground">
            <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-14 lg:grid-cols-4 lg:px-10">
                <div>
                    <Brand />
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-primary-foreground/75">
                        Uma rede de irmãos para irmãos. Comunhão, serviço e oportunidade entre membros de igrejas batistas no Brasil.
                    </p>
                    <p className="mt-4 text-sm font-semibold text-accent">Levai as cargas uns dos outros — Gálatas 6:2</p>
                </div>
                <div>
                    <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">Navegar</p>
                    <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
                        {allNav.map((n) => (
                            <li key={n.to}>
                                <Link to={n.to} className="hover:text-white">{n.label}</Link>
                            </li>
                        ))}
                        <li><Link to={isAuthenticated ? '/minha-conta' : '/login'} className="hover:text-white">{isAuthenticated ? 'Minha conta' : 'Entrar'}</Link></li>
                    </ul>
                </div>
                <div>
                    <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">Legal</p>
                    <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
                        <li><Link to="/consentimento-uso-dados" className="hover:text-white">Consentimento para uso dos dados</Link></li>
                        <li><Link to="/termos-uso-privacidade" className="hover:text-white">Termos de Uso e Política de Privacidade</Link></li>
                        <li><Link to="/declaracao-membro-igreja" className="hover:text-white">Declaração de membro da igreja</Link></li>
                    </ul>
                </div>
                <div>
                    <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">Contato</p>
                    <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
                        <li className="flex items-center gap-2"><Mail size={16} /> contato@conexaobatista.com.br</li>
                        <li>
                            <a href="https://instagram.com/conexaobatista" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                                <Instagram size={16} /> @conexaobatista
                            </a>
                        </li>
                        <li>
                            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                                <MessageCircle size={16} /> WhatsApp
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/15 px-5 py-6 text-center text-xs text-primary-foreground/60 lg:px-10">
                © {new Date().getFullYear()} Conexão Batista — www.conexaobatista.com.br. O Conexão Batista não é uma igreja nem uma denominação.
            </div>
        </footer>
    );
}

export function WhatsAppButton() {
    return (
        <a
            href="https://wa.me/5511999999999?text=Paz%20do%20Senhor!%20Quero%20saber%20mais%20sobre%20o%20Conex%C3%A3o%20Batista."
            target="_blank"
            rel="noreferrer"
            aria-label="Falar no WhatsApp"
            className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 active:scale-95"
        >
            <MessageCircle size={26} />
        </a>
    );
}

export default function SiteLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            <WhatsAppButton />
        </div>
    );
}

export function useIsAuthed() {
    return pb.authStore.isValid;
}
