import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useOutletContext } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, Users, ArrowRight, Loader2, Church, PauseCircle, StopCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';
import { getIgrejaId } from '@/components/igreja/IgrejaLayout.jsx';

const STATUS_CARDS = [
  { key: 'pendente', label: 'Pendentes', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
  { key: 'ativo', label: 'Ativos', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
  { key: 'recusado', label: 'Recusados', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  { key: 'suspenso', label: 'Suspensos', icon: PauseCircle, className: 'bg-amber-100 text-amber-700 border-amber-300' },
];

function firstId(raw) {
  return Array.isArray(raw) ? raw[0] || '' : raw || '';
}

export default function PainelPage() {
  const { currentUser } = useSubscriptionAuth();
  const { igrejaId: ctxIgrejaId } = useOutletContext() || {};
  // Mesma fonte de verdade da página de aprovação: o `igreja_id` do registro
  // do pastor (`@request.auth.igreja_id` na regra de acesso) como primária,
  // com fallback para a igreja do vínculo ativo vinda do layout. Ver nota em
  // AprovacaoMembrosPage e migração 1787094511_sync_pastor_igreja_id_to_vinculo.
  const igrejaId = getIgrejaId(currentUser) || ctxIgrejaId;
  const [counts, setCounts] = useState({ pendente: 0, ativo: 0, recusado: 0, suspenso: 0, encerrado: 0 });
  const [recentes, setRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    // CORREÇÃO DEFINITIVA: o escopo por igreja é feito PELA REGRA DE ACESSO
    // do PocketBase (listRule filtra por `igreja_id = @request.auth.igreja_id`
    // para pastor/secretário/presidente/admin). Não adicionamos `igreja_id`
    // ao filtro da query para evitar divergência entre o valor defasado do
    // authStore (cache de login) e o valor fresco do banco usado pela regra
    // — divergência que zerava a lista silenciosamente (HTTP 200, sem erro).
    setLoading(true);
    setErro('');
    try {
      const all = await pb.collection('vinculos_usuario_igreja').getFullList({
        filter: pb.filter('papel = "membro"'),
        expand: 'usuario_id',
        sort: '-created',
      });
      const c = { pendente: 0, ativo: 0, recusado: 0, suspenso: 0, encerrado: 0 };
      for (const v of all) {
        const st = v.status || 'pendente';
        if (c[st] !== undefined) c[st] += 1;
      }
      setCounts(c);
      setRecentes(all.slice(0, 6));
    } catch (err) {
      if (err?.isAbort || err?.status === 0) return;
      setErro('Não foi possível carregar os dados do painel.');
    } finally {
      setLoading(false);
    }
  }, [igrejaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const total = counts.pendente + counts.ativo + counts.recusado + counts.suspenso + counts.encerrado;

  return (
    <>
      <Helmet>
        <title>Painel da Igreja | Conexão Batista</title>
        <meta name="description" content="Painel administrativo da igreja para aprovação de membros." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Fluxo 3 · Painel da Igreja</p>
          <h1 className="font-display text-3xl font-bold text-primary">Solicitações de membros — visão geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} vínculo(s) de membros para a sua igreja.
          </p>
        </div>

        {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.key} className={`rounded-2xl border p-5 ${card.className}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wide">{card.label}</span>
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <p className="mt-3 font-display text-4xl font-bold">{loading ? '—' : counts[card.key]}</p>
              </div>
            );
          })}
        </div>

        {/* Recent requests */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold text-primary">Solicitações recentes</h2>
            <Link
              to="/igreja/aprovacao-membros"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5"
            >
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" /> Carregando…
            </div>
          ) : recentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Church size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhuma solicitação recebida ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentes.map((v) => {
                const u = v.expand?.usuario_id;
                const user = Array.isArray(u) ? u[0] : u;
                const labels = {
                  pendente: { label: 'Pendente', className: 'bg-accent/15 text-accent' },
                  ativo: { label: 'Ativo', className: 'bg-green-100 text-green-700' },
                  recusado: { label: 'Recusado', className: 'bg-destructive/10 text-destructive' },
                  suspenso: { label: 'Suspenso', className: 'bg-amber-100 text-amber-700' },
                  encerrado: { label: 'Encerrado', className: 'bg-muted text-muted-foreground' },
                };
                const info = labels[v.status] || labels.pendente;
                return (
                  <div key={v.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{user?.name || '—'}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email || '—'}</p>
                    </div>
                    <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${info.className}`}>
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
