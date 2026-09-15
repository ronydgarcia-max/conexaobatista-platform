import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { User, Search, ShieldOff, Flag, Heart, ArrowRight } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import RelacionamentosGuard from '@/components/relacionamentos/RelacionamentosGuard';

function DashboardContent() {
  const [perfil, setPerfil] = useState(null);
  const [bloqueiosCount, setBloqueiosCount] = useState(0);
  const [denunciasCount, setDenunciasCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = pb.authStore.record?.id;
    if (!uid) return;

    Promise.all([
      pb.collection('rel_perfis').getList(1, 1, {
        filter: pb.filter('owner = {:id}', { id: uid }),
        requestKey: 'dash-perfil',
      }).catch(() => ({ totalItems: 0, items: [] })),
      pb.collection('rel_bloqueios').getList(1, 1, {
        filter: pb.filter('bloqueador = {:id}', { id: uid }),
        requestKey: 'dash-bloqueios',
      }).catch(() => ({ totalItems: 0 })),
      pb.collection('rel_denuncias').getList(1, 1, {
        filter: pb.filter('denunciante = {:id}', { id: uid }),
        requestKey: 'dash-denuncias',
      }).catch(() => ({ totalItems: 0 })),
    ]).then(([p, b, d]) => {
      setPerfil(p.items[0] || null);
      setBloqueiosCount(b.totalItems);
      setDenunciasCount(d.totalItems);
      setLoading(false);
    });
  }, []);

  const fotoUrl = perfil?.foto ? pb.files.getURL(perfil, perfil.foto, { thumb: '200x200' }) : null;

  return (
    <>
      <Helmet>
        <title>Meu Painel | Relacionamentos | Conexão Batista</title>
        <meta name="description" content="Painel da área de Relacionamentos no Conexão Batista." />
      </Helmet>
      <div className="mx-auto max-w-[70rem] px-5 py-12 lg:px-10">
        <div className="mb-8">
          <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">Área exclusiva</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-primary sm:text-4xl">Relacionamentos</h1>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-border bg-white p-7 shadow-sm sm:flex-row sm:items-center">
              <div className="shrink-0">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Minha foto" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <User size={32} className="text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-display text-xl font-bold text-primary">{perfil?.apelido || pb.authStore.record?.name || 'Meu perfil'}</p>
                <p className="text-sm text-muted-foreground">
                  {perfil ? `${perfil.cidade ? perfil.cidade + ', ' : ''}${perfil.estado || ''}`.trim() || 'Sem localização' : 'Perfil não configurado'}
                </p>
                {!perfil && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 inline-block">
                    Configure seu perfil para aparecer nas buscas
                  </p>
                )}
              </div>
              <Link to="/relacionamentos/perfil" className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground whitespace-nowrap">
                {perfil ? 'Editar perfil' : 'Criar perfil'} <ArrowRight size={16} />
              </Link>
            </div>

            {/* Action cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link to="/relacionamentos/descobrir" className="group rounded-2xl border border-border bg-white p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary/20 text-primary mb-4">
                  <Search size={22} strokeWidth={1.8} />
                </span>
                <p className="font-display text-lg font-bold text-primary">Descobrir Perfis</p>
                <p className="mt-1 text-sm text-muted-foreground">Explore perfis de membros batistas com intenções claras.</p>
                <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">Ver perfis <ArrowRight size={15} /></p>
              </Link>

              <Link to="/relacionamentos/bloqueios" className="group rounded-2xl border border-border bg-white p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive mb-4">
                  <ShieldOff size={22} strokeWidth={1.8} />
                </span>
                <p className="font-display text-lg font-bold text-primary">Meus Bloqueios</p>
                <p className="mt-1 text-sm text-muted-foreground">Gerencie usuários que você bloqueou.</p>
                <p className="mt-4 text-sm font-semibold text-muted-foreground">{bloqueiosCount} bloqueado{bloqueiosCount !== 1 ? 's' : ''}</p>
              </Link>

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600 mb-4">
                  <Flag size={22} strokeWidth={1.8} />
                </span>
                <p className="font-display text-lg font-bold text-primary">Denúncias Enviadas</p>
                <p className="mt-1 text-sm text-muted-foreground">Histórico de denúncias que você enviou à moderação.</p>
                <p className="mt-4 text-sm font-semibold text-muted-foreground">{denunciasCount} enviada{denunciasCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Info banner */}
            <div className="mt-8 flex items-start gap-4 rounded-2xl bg-primary/5 p-5">
              <Heart className="shrink-0 text-accent mt-0.5" size={20} />
              <p className="text-sm leading-relaxed text-foreground">
                <strong className="font-semibold">Lembrete:</strong> Toda interação nesta área deve refletir os valores cristãos de respeito, honestidade e amor ao próximo. Comportamentos inadequados devem ser reportados imediatamente.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function RelacionamentosDashboardPage() {
  return (
    <RelacionamentosGuard>
      <DashboardContent />
    </RelacionamentosGuard>
  );
}
