import React, { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldCheck, Users, LogOut, Briefcase, FolderTree, Lightbulb, Wrench, Church, Building2, UserCheck, FileText, Crown, GraduationCap, ShieldAlert, ScrollText, ImagePlus, ClipboardCheck, Image as ImageIcon } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import pb from '@/lib/pocketbaseClient';

// Contexto único para os contadores de pendentes. Antes, cada <PendingBadge>
// (renderizado DUAS vezes — menu desktop + menu mobile) disparava sua própria
// `getList(1, 1, ...)` para a MESMA coleção com o MESMO filtro. O SDK do
// PocketBase cancela automaticamente requisições duplicadas em voo (mesmo
// METHOD + path), abortando a primeira com "signal is aborted without reason"
// (visível no session_journal). Agora a busca é feita UMA ÚNICA vez no nível
// do layout e compartilhada com todos os NavItems via contexto — eliminando a
// duplicação e o auto-cancelamento.
const PendingBadgesContext = createContext({ representantes: 0, tutores: 0 });

const navItems = [
  { to: '/adm/membros', label: 'Membros', icon: Users },
  { to: '/adm/aprovacao-representantes', label: 'Aprovação de Representantes', icon: Crown, badge: 'representantes' },
  { to: '/adm/aprovacao-tutores', label: 'Aprovação de Tutores', icon: GraduationCap, badge: 'tutores' },
  { to: '/adm/moderacao-cursos', label: 'Moderação de Cursos', icon: ClipboardCheck },
  { to: '/adm/aprovacao-vinculos', label: 'Aprovação de Vínculos', icon: UserCheck },
  { to: '/adm/promover-administrador', label: 'Promover Administrador', icon: ShieldAlert },
  { to: '/adm/curriculos', label: 'Banco de Empregos', icon: Briefcase },
  { to: '/adm/servicos-profissionais', label: 'Serviços Profissionais', icon: Wrench },
  { to: '/adm/igrejas', label: 'Igrejas', icon: Church },
  { to: '/adm/empresas', label: 'Empresas', icon: Building2 },
  { to: '/adm/categorias-profissoes', label: 'Categorias e Profissões', icon: FolderTree },
  { to: '/adm/sugestoes-profissoes', label: 'Sugestões', icon: Lightbulb },
  { to: '/adm/texto-legal-mentor', label: 'Texto Legal Mentor', icon: FileText },
  { to: '/adm/mentor-boas-vindas-imagem', label: 'Imagem Boas-Vindas Mentor', icon: ImagePlus },
  { to: '/adm/logo-institucional', label: 'Logo Institucional', icon: ImageIcon },
  { to: '/adm/relatorio-alteracoes', label: 'Relatório de Alterações', icon: ScrollText },
];

function NavItem({ item, mobile }) {
  const Icon = item.icon;
  return (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-primary-foreground/80 hover:text-white'}`
      }
    >
      <Icon size={16} /> <span className="flex-1">{item.label}</span>
      {item.badge && <PendingBadge type={item.badge} mobile={mobile} />}
    </NavLink>
  );
}

function PendingBadge({ type, mobile }) {
  // Lê o contador do contexto único do layout — nenhuma requisição própria,
  // então não há mais duplicação nem auto-cancelamento do SDK.
  const { representantes, tutores } = useContext(PendingBadgesContext);
  const pendentes = type === 'tutores' ? tutores : representantes;

  if (!pendentes) return null;
  return (
    <span
      className={`ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-accent-foreground ${mobile ? 'ml-1' : ''}`}
    >
      {pendentes}
    </span>
  );
}

/**
 * Busca os contadores de pendentes UMA ÚNICA vez no nível do layout e
 * atualiza via realtime. Compartilha o resultado com todos os <PendingBadge/>
 * via contexto, eliminando as requisições duplicadas (desktop + mobile) que
 * o SDK do PocketBase auto-cancelava com "signal is aborted without reason".
 */
function PendingBadgesProvider({ children }) {
  const [counts, setCounts] = useState({ representantes: 0, tutores: 0 });

  useEffect(() => {
    let active = true;

    const fetchTutores = async () => {
      try {
        const result = await pb.collection('users').getList(1, 1, {
          filter: 'mentor_solicitado = true && mentor_status = "pendente"',
          requestKey: 'pending-tutores-count',
        });
        if (active) setCounts((c) => ({ ...c, tutores: result.totalItems }));
      } catch (err) {
        // Auto-cancelamento (status 0) é esperado e silencioso.
        if (active && err?.status !== 0 && !err?.isAbort) {
          setCounts((c) => ({ ...c, tutores: 0 }));
        }
      }
    };

    const fetchRepresentantes = async () => {
      try {
        const result = await pb.collection('vinculos_usuario_igreja').getList(1, 1, {
          filter: '(papel = "pastor" || papel = "secretario" || papel = "presidente") && status = "pendente"',
          requestKey: 'pending-representantes-count',
        });
        if (active) setCounts((c) => ({ ...c, representantes: result.totalItems }));
      } catch (err) {
        if (active && err?.status !== 0 && !err?.isAbort) {
          setCounts((c) => ({ ...c, representantes: 0 }));
        }
      }
    };

    const refresh = () => { fetchTutores(); fetchRepresentantes(); };
    refresh();

    // Realtime: atualiza os contadores quando registros mudam.
    const unsubTutores = pb.collection('users').subscribe('*', refresh).catch(() => {});
    const unsubReps = pb.collection('vinculos_usuario_igreja').subscribe('*', refresh).catch(() => {});

    return () => {
      active = false;
      unsubTutores.then((u) => u && u()).catch(() => {});
      unsubReps.then((u) => u && u()).catch(() => {});
    };
  }, []);

  return (
    <PendingBadgesContext.Provider value={counts}>
      {children}
    </PendingBadgesContext.Provider>
  );
}

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();

  if (!admin) {
    return <Navigate to="/adm/login" replace state={{ from: location.pathname }} />;
  }

  const mustChange = typeof admin.get === 'function' ? admin.get('must_change_password') : admin.must_change_password;
  if (mustChange) {
    return <Navigate to="/adm/alterar-senha" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <PendingBadgesProvider>
    <div className="flex min-h-screen flex-col bg-muted/40 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[90rem] items-center gap-6 px-5 py-3 lg:px-10">
          <Link to="/adm/membros" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 font-display text-sm font-bold">CB</span>
            <span className="font-display text-lg font-bold leading-none">
              Conexão<span className="text-accent">Batista</span>
            </span>
            <span className="ml-2 hidden rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider sm:inline">
              Administração
            </span>
          </Link>

          <nav className="ml-auto hidden max-w-[54rem] flex-1 grid-cols-3 gap-1 md:grid lg:grid-cols-5">
            {navItems.map((n) => (
              <NavItem key={n.to} item={n} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <span className="hidden items-center gap-2 text-sm font-semibold text-primary-foreground/90 sm:flex">
              <ShieldCheck size={16} /> {admin.name || admin.username}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/25"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* menu mobile com duas opções por linha, sem rolagem horizontal */}
        <div className="border-t border-white/10 px-5 py-2 md:hidden">
          <div className="grid grid-cols-2 gap-1">
            {navItems.map((n) => (
              <NavItem key={n.to} item={n} mobile />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
    </PendingBadgesProvider>
  );
}
