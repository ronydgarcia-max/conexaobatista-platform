import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ShieldOff, ShieldCheck, ArrowLeft, Trash2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import RelacionamentosGuard from '@/components/relacionamentos/RelacionamentosGuard';

function BloqueiosContent() {
  const [bloqueios, setBloqueios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = pb.authStore.record?.id;
    pb.collection('rel_bloqueios').getFullList({
      filter: pb.filter('bloqueador = {:id}', { id: uid }),
      sort: '-created',
      requestKey: 'bloqueios-list',
    }).then((res) => {
      setBloqueios(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDesbloquear = async (id, apelido) => {
    if (!window.confirm(`Deseja desbloquear ${apelido || 'este usuário'}? O perfil poderá aparecer novamente nas buscas.`)) return;
    await pb.collection('rel_bloqueios').delete(id);
    setBloqueios((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <>
      <Helmet>
        <title>Meus Bloqueios | Relacionamentos | Conexão Batista</title>
        <meta name="description" content="Gerencie usuários bloqueados na área de Relacionamentos." />
      </Helmet>
      <div className="mx-auto max-w-2xl px-5 py-12 lg:px-0">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/relacionamentos/dashboard" className="text-muted-foreground hover:text-primary"><ArrowLeft size={20} /></Link>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">Relacionamentos</p>
            <h1 className="font-display text-3xl font-extrabold text-primary">Meus Bloqueios</h1>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Usuários bloqueados não verão seu perfil e não aparecerão nas suas buscas.
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : bloqueios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck size={40} className="text-muted-foreground/40 mb-4" />
            <p className="font-display text-lg font-bold text-primary">Nenhum bloqueio</p>
            <p className="text-sm text-muted-foreground mt-1">Você ainda não bloqueou nenhum usuário.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bloqueios.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center gap-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                    <ShieldOff size={18} />
                  </span>
                  <div>
                    <p className="font-display font-bold text-primary">{b.bloqueado_apelido || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">Bloqueado em {new Date(b.created).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <button onClick={() => handleDesbloquear(b.id, b.bloqueado_apelido)}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-green-500 hover:text-green-600 transition-colors">
                  <Trash2 size={14} /> Desbloquear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function RelacionamentosBloqueiosPage() {
  return (
    <RelacionamentosGuard>
      <BloqueiosContent />
    </RelacionamentosGuard>
  );
}
