import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';

/**
 * Proteção GLOBAL contra erro 404 para administradores.
 *
 * Quando um administrador está autenticado (coleção `admins`), qualquer
 * componente que tente buscar na coleção `users` usando o id do admin
 * recebe HTTP 404 — o id do admin não existe em `users`. Antes da correção
 * isso era tratado ponto a ponto (Header, MinhaContaPage, etc.), mas o
 * problema reaparecia em qualquer nova rota que consultasse `users`.
 *
 * Esta guarda resolve o problema em UM ÚNICO ponto de controle: se o
 * usuário autenticado pertence à coleção `admins` e a rota atual NÃO é da
 * área administrativa (/adm/*), ele é redirecionado para /adm. Assim,
 * nenhum componente de rota pública/igreja/curso chega a montar e disparar
 * buscas inválidas em `users`.
 *
 * Ponto de aplicação: <AdminRouteGuard /> montado uma única vez dentro do
 * <Router> em App.jsx — protege TODAS as rotas de uma vez.
 */

function computeIsAdmin() {
  const model = pb.authStore.record || pb.authStore.model;
  if (!model) return false;
  const collectionName =
    model.collectionName ||
    (typeof model.get === 'function' ? model.get('collectionName') : undefined);
  return collectionName === 'admins';
}

/**
 * Hook reativo que retorna `true` quando o usuário autenticado é um admin
 * (coleção `admins`). Reage a login/logout via pb.authStore.onChange.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(() => computeIsAdmin());

  useEffect(() => {
    const update = () => setIsAdmin(computeIsAdmin());
    update();
    const unsubscribe = pb.authStore.onChange(update);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return isAdmin;
}

/**
 * Guarda de rota global. Deve envolver o conteúdo do <Router> uma única vez.
 * Quando o admin está em uma rota que não é /adm/*, renderiza apenas o
 * redirecionamento — os filhos (providers + Routes) NÃO montam, então nenhum
 * componente dispara buscas inválidas em `users`. Em rotas /adm/* (ou para
 * usuários comuns) renderiza os filhos normalmente.
 */
export default function AdminRouteGuard({ children }) {
  const isAdmin = useIsAdmin();
  const location = useLocation();

  if (isAdmin && !location.pathname.startsWith('/adm')) {
    return <Navigate to="/adm" replace />;
  }

  return children;
}
