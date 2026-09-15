import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Church, LogOut, Users, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';
import pb from '@/lib/pocketbaseClient';

function getField(user, field) {
  if (!user) return undefined;
  if (typeof user.get === 'function') return user.get(field);
  return user[field];
}

export function isChurchRep(user) {
  const papel = getField(user, 'papel');
  return papel === 'pastor' || papel === 'secretario';
}

export function getIgrejaId(user) {
  const raw = getField(user, 'igreja_id');
  return Array.isArray(raw) ? raw[0] || '' : raw || '';
}

// Verifica se o usuário tem vínculo ativo com permissão de aprovação em alguma igreja.
// Retorna { autorizado, igrejaId } com base no vínculo ativo de pastor/secretário.
//
// FALLBACK DE LEGADO: a lógica real de aprovação de membros (hook PocketBase
// users_cadastro.pb.js) permite que um pastor/secretário aprovado aprove
// membros mesmo SEM um vínculo qualificado em vinculos_usuario_igreja —
// basta ter papel='pastor'|'secretario' e status_aprovacao='aprovado' no
// registro do usuário (caminho legado, anterior à criação da coleção de
// vínculos). O acesso ao painel deve seguir a MESMA regra, seno pastores
// que conseguem aprovar membros pela API ficam bloqueados no painel com
// "Acesso restrito" (ex.: ronydgarcia@gmail.com). Por isso, quando não há
// vínculo ativo com permissão, fazemos o fallback pelo papel + status do
// usuário, usando o igreja_id do próprio registro como igreja ativa.
// `signal` é OPCIONAL: quando fornecido pelo chamador (componente com seu
// próprio AbortController), desativa a auto-cancelamento do SDK PocketBase
// (requestKey: null) e repassa o sinal para o fetch, permitindo cancelar a
// requisição ao desmontar/trocar dependências. Quando ausente (ex.: chamadas
// pontuais sem controle de ciclo de vida), mantém o comportamento legado.
// Cancelamentos esperados (abort) são propagados para o chamador tratar;
// erros reais (auth/rede/banco) caem no fallback legado como antes.
function ehCancelamentoEsperado(err, signal) {
  return (
    !!signal?.aborted ||
    !!err?.isAbort ||
    err?.name === 'AbortError' ||
    err?.status === 0
  );
}

export async function verificarAcessoPainel(userId, signal) {
  if (!userId) return { autorizado: false, igrejaId: '' };
  const opts = signal ? { requestKey: null, signal } : {};

  // 1) Caminho principal: vínculo ativo com permissão de aprovação.
  try {
    const vinculos = await pb.collection('vinculos_usuario_igreja').getFullList({
      filter: pb.filter('usuario_id = {:uid}', { uid: userId }),
      ...opts,
    });
    const ativoComPermissao = vinculos.find(
      (v) =>
        v.status === 'ativo' &&
        v.pode_aprovar_membros === true &&
        (v.papel === 'pastor' || v.papel === 'secretario'),
    );
    if (ativoComPermissao) {
      const ig = Array.isArray(ativoComPermissao.igreja_id)
        ? ativoComPermissao.igreja_id[0]
        : ativoComPermissao.igreja_id;
      return { autorizado: true, igrejaId: ig || '' };
    }
  } catch (err) {
    // Cancelamento esperado (desmontagem/troca de dependência): propaga para
    // o chamador abortar o fluxo sem registrar erro nem alterar estado.
    if (ehCancelamentoEsperado(err, signal)) throw err;
    // Erro real: segue para o fallback legado.
  }

  // 2) Fallback legado: pastor/secretário aprovado sem vínculo qualificado.
  //    Espelha exatamente o fallback do hook users_cadastro.pb.js para que
  //    o painel não seja mais restritivo que a própria aprovação de membros.
  try {
    const user = await pb.collection('users').getOne(userId, opts);
    const papel = getField(user, 'papel');
    const statusAprovacao = getField(user, 'status_aprovacao');
    if (
      (papel === 'pastor' || papel === 'secretario') &&
      statusAprovacao === 'aprovado'
    ) {
      const ig = getIgrejaId(user);
      return { autorizado: true, igrejaId: ig || '' };
    }
  } catch (err) {
    if (ehCancelamentoEsperado(err, signal)) throw err;
    // usuário não encontrado ou sem permissão de leitura
  }

  return { autorizado: false, igrejaId: '' };
}

export default function IgrejaLayout() {
  const { currentUser, isAuthenticated } = useSubscriptionAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [igrejaNome, setIgrejaNome] = useState('');
  const [autorizado, setAutorizado] = useState(null); // null = carregando, true/false
  const [igrejaIdVinculo, setIgrejaIdVinculo] = useState('');

  const repName = getField(currentUser, 'name') || '';
  const papel = getField(currentUser, 'papel');
  const papelLabel = papel === 'pastor' ? 'Pastor' : papel === 'secretario' ? 'Secretário' : '';

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setAutorizado(false);
      return;
    }
    // AbortController PRÓPRIO deste efeito (não compartilhado com outros
    // componentes). requestKey: null dentro de verificarAcessoPainel desativa
    // o auto-cancelamento do SDK, evitando que requisições simultâneas de
    // MeusVinculosSection/PainelIgrejaCard se cancelem entre si.
    const controller = new AbortController();
    const { signal } = controller;
    (async () => {
      try {
        const { autorizado: ok, igrejaId } = await verificarAcessoPainel(currentUser.id, signal);
        if (signal.aborted) return;
        setAutorizado(ok);
        setIgrejaIdVinculo(igrejaId);
        if (ok && igrejaId) {
          try {
            const rec = await pb.collection('empresas').getOne(igrejaId, { requestKey: null, signal });
            if (!signal.aborted) setIgrejaNome(rec.razao_social || rec.nome_fantasia || '');
          } catch (err) {
            if (ehCancelamentoEsperado(err, signal)) return;
            console.error('IgrejaLayout: erro ao carregar nome da igreja', err);
            if (!signal.aborted) setIgrejaNome('');
          }
        }
      } catch (err) {
        if (ehCancelamentoEsperado(err, signal)) return;
        console.error('IgrejaLayout: erro ao verificar acesso ao painel', err);
        if (!signal.aborted) setAutorizado(false);
      }
    })();
    return () => { controller.abort(); };
  }, [isAuthenticated, currentUser]);

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (autorizado === null) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40">
        <p className="text-sm text-muted-foreground">Carregando painel da igreja…</p>
      </div>
    );
  }

  if (autorizado === false) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 px-4">
        <div className="max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldCheck size={28} strokeWidth={1.8} />
          </span>
          <h1 className="mt-5 font-display text-xl font-bold text-primary">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é exclusiva para Pastores e Secretários com vínculo ativo e permissão para aprovar membros.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground hover:bg-primary/90">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: '/igreja/painel', label: 'Painel', icon: LayoutDashboard },
    { to: '/igreja/aprovacao-membros', label: 'Solicitações de membros', icon: Users },
  ];

  const handleLogout = () => {
    pb.authStore.clear();
    navigate('/', { replace: true });
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[90rem] items-center gap-6 px-5 py-3 lg:px-10">
          <Link to="/igreja/painel" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
              <Church size={18} />
            </span>
            <div className="leading-none">
              <span className="font-display text-lg font-bold">
                Conexão<span className="text-accent">Batista</span>
              </span>
              <p className="mt-0.5 hidden text-xs text-primary-foreground/70 sm:block">{igrejaNome || 'Painel da Igreja'}</p>
            </div>
            <span className="ml-2 hidden rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider sm:inline">
              Painel da Igreja
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-primary-foreground/80 hover:text-white'}`
                }
              >
                <n.icon size={16} /> {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <span className="hidden items-center gap-2 text-sm font-semibold text-primary-foreground/90 sm:flex">
              <ShieldCheck size={16} /> {papelLabel} {repName}
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

        <div className="border-t border-white/10 px-5 py-2 md:hidden">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-white/15 text-white' : 'text-primary-foreground/80'}`
                }
              >
                <n.icon size={16} /> {n.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet context={{ igrejaId: igrejaIdVinculo }} />
      </main>
    </div>
  );
}
