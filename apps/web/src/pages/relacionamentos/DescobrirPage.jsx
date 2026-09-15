import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Search, MapPin, Filter, ArrowLeft, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import RelacionamentosGuard from '@/components/relacionamentos/RelacionamentosGuard';
import PerfilModal from '@/components/relacionamentos/PerfilModal';

const STATUS_LABEL = { solteiro: 'Solteiro(a)', viuvo: 'Viúvo(a)', divorciado: 'Divorciado(a)', outro: 'Outro' };
const PER_PAGE = 12;

function DescobrirContent() {
  const [perfis, setPerfis] = useState([]);
  const [bloqueados, setBloqueados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [filtros, setFiltros] = useState({ status: '', preferencia: '', estado: '' });
  const [showFiltros, setShowFiltros] = useState(false);

  const uid = pb.authStore.record?.id;

  // Load blocked user IDs
  useEffect(() => {
    pb.collection('rel_bloqueios').getFullList({
      filter: pb.filter('bloqueador = {:id}', { id: uid }),
      requestKey: 'desc-bloqueios',
    }).then((res) => {
      setBloqueados(new Set(res.map((b) => b.bloqueado)));
    }).catch(() => {});
  }, [uid]);

  const loadPerfis = useCallback(() => {
    setLoading(true);
    const filterParts = [`owner != "${uid}"`, `ativo = true`, `visibilidade != 'privado'`];
    if (filtros.status) filterParts.push(`status_relacionamento = '${filtros.status}'`);
    if (filtros.estado) filterParts.push(`estado = '${filtros.estado}'`);

    pb.collection('rel_perfis').getList(page, PER_PAGE, {
      filter: filterParts.join(' && '),
      sort: '-created',
      requestKey: 'desc-perfis',
    }).then((res) => {
      // Filter out blocked users client-side
      const items = res.items.filter((p) => !bloqueados.has(p.owner));
      setPerfis(items);
      setTotal(res.totalItems);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [uid, page, filtros, bloqueados]);

  useEffect(() => { loadPerfis(); }, [loadPerfis]);

  const handleBlocked = (blockedUid) => {
    setBloqueados((prev) => new Set([...prev, blockedUid]));
    setPerfis((prev) => prev.filter((p) => p.owner !== blockedUid));
  };

  const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      <Helmet>
        <title>Descobrir Perfis | Relacionamentos | Conexão Batista</title>
        <meta name="description" content="Explore perfis de membros batistas na área de Relacionamentos." />
      </Helmet>
      <div className="mx-auto max-w-[80rem] px-5 py-12 lg:px-10">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/relacionamentos/dashboard" className="text-muted-foreground hover:text-primary"><ArrowLeft size={20} /></Link>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">Área de Relacionamentos</p>
            <h1 className="font-display text-3xl font-extrabold text-primary">Descobrir Perfis</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button onClick={() => setShowFiltros(!showFiltros)}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold hover:border-primary/50">
            <Filter size={15} /> Filtros
          </button>
          {(filtros.status || filtros.estado) && (
            <button onClick={() => { setFiltros({ status: '', preferencia: '', estado: '' }); setPage(1); }}
              className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-destructive">
              Limpar filtros
            </button>
          )}
        </div>

        {showFiltros && (
          <div className="mb-6 rounded-2xl border border-border bg-white p-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
              <select value={filtros.status} onChange={(e) => { setFiltros({ ...filtros, status: e.target.value }); setPage(1); }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">Todos</option>
                <option value="solteiro">Solteiro(a)</option>
                <option value="viuvo">Viúvo(a)</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</label>
              <select value={filtros.estado} onChange={(e) => { setFiltros({ ...filtros, estado: e.target.value }); setPage(1); }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">Todos</option>
                {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : perfis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={40} className="text-muted-foreground/40 mb-4" />
            <p className="font-display text-lg font-bold text-primary">Nenhum perfil encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou volte mais tarde.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {perfis.map((p) => {
                const foto = p.foto ? pb.files.getURL(p, p.foto, { thumb: '200x200' }) : null;
                return (
                  <button key={p.id} onClick={() => setSelected(p)}
                    className="group text-left rounded-2xl border border-border bg-white overflow-hidden hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="relative">
                      {foto ? (
                        <img src={foto} alt={p.apelido || 'Perfil'} className="h-44 w-full object-cover" />
                      ) : (
                        <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                          <UserCircle size={48} className="text-primary/30" />
                        </div>
                      )}
                      {p.status_relacionamento && (
                        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {STATUS_LABEL[p.status_relacionamento] || p.status_relacionamento}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-display text-base font-bold text-primary truncate">{p.apelido || 'Usuário'}</p>
                      {(p.cidade || p.estado) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin size={12} /> {[p.cidade, p.estado].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {p.bio && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.bio}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40">Anterior</button>
                <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40">Próxima</button>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <PerfilModal perfil={selected} onClose={() => setSelected(null)} onBlocked={handleBlocked} />
      )}
    </>
  );
}

export default function RelacionamentosDescobrirPage() {
  return (
    <RelacionamentosGuard>
      <DescobrirContent />
    </RelacionamentosGuard>
  );
}
