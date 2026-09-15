import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, Loader2, ShieldCheck, ShieldOff,
  Crown, Church, FileText, Users as UsersIcon, Calendar, History, UserCircle,
  CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const PAPEL_LABEL = {
  pastor: 'Pastor',
  secretario: 'Secretário',
  presidente: 'Presidente',
  membro: 'Membro',
  admin: 'Administrador',
  tutor: 'Tutor',
};

const PAPEL_ICON = {
  pastor: Church,
  secretario: FileText,
  presidente: Crown,
  membro: UsersIcon,
  admin: ShieldCheck,
  tutor: UsersIcon,
};

const PAPEL_BADGE = {
  pastor: 'bg-primary/10 text-primary border-primary/30',
  secretario: 'bg-secondary/15 text-secondary-foreground border-secondary/40',
  presidente: 'bg-accent/15 text-accent border-accent/40',
  membro: 'bg-muted text-muted-foreground border-border',
  admin: 'bg-green-100 text-green-700 border-green-300',
  tutor: 'bg-indigo-100 text-indigo-700 border-indigo-300',
};

const STATUS_APROVACAO_LABEL = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  solicitar_informacoes: 'Solicitar informações',
};

const PER_PAGE = 10;

function formatarData(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (_) { return iso; }
}

function nomeUser(user) {
  if (!user) return '—';
  return user.name || user.username || user.email || '—';
}

export default function PromoverAdministradorPage() {
  const { admin } = useAdminAuth();
  const responsavelNome = admin?.get?.('name') || admin?.name || admin?.get?.('username') || admin?.username || 'Administrador';
  const adminId = admin?.id || '';

  const [busca, setBusca] = useState('');
  const [filtroPapel, setFiltroPapel] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msgSucesso, setMsgSucesso] = useState('');

  const [detalhe, setDetalhe] = useState(null); // user em detalhe
  const [detalheExtra, setDetalheExtra] = useState(null); // dados de vínculos/histórico
  const [carregandoExtra, setCarregandoExtra] = useState(false);
  const [acaoAtual, setAcaoAtual] = useState(null); // { tipo, user }
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const filtros = [];
      if (filtroPapel !== 'todos') {
        filtros.push(pb.filter('papel = {:p}', { p: filtroPapel }));
      }
      if (filtroStatus !== 'todos') {
        filtros.push(pb.filter('status_aprovacao = {:s}', { s: filtroStatus }));
      }
      const result = await pb.collection('users').getList(pagina, PER_PAGE, {
        filter: filtros.length ? filtros.join(' && ') : '',
        sort: '-created',
        fields: 'id,name,username,email,whatsapp,cidade,sexo,papel,status_aprovacao,status_cadastro,igreja_id,admin_promovido_por,admin_data_promocao,created',
      });

      const termo = busca.trim().toLowerCase();
      let filtered = result.items;
      if (termo) {
        filtered = filtered.filter((u) => {
          const nome = (nomeUser(u) || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          return nome.includes(termo) || email.includes(termo);
        });
      }
      setItems(filtered);
      setTotalItems(termo ? filtered.length : result.totalItems);
      setTotalPages(termo ? 1 : result.totalPages);
    } catch (err) {
      if (err?.isAbort || err?.status === 0) return;
      setErro('Não foi possível carregar a lista de membros.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroPapel, filtroStatus, pagina]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [busca, filtroPapel, filtroStatus]);

  const abrirDetalhe = async (user) => {
    setDetalhe(user);
    setDetalheExtra(null);
    setCarregandoExtra(true);
    try {
      const [vinculos, historico] = await Promise.all([
        pb.collection('vinculos_usuario_igreja').getFullList({
          filter: pb.filter('usuario_id = {:uid}', { uid: user.id }),
          expand: 'igreja_id',
          sort: '-created',
        }).catch(() => []),
        pb.collection('historico_vinculos').getFullList({
          filter: pb.filter('usuario_id = {:uid}', { uid: user.id }),
          sort: '-created',
        }).catch(() => []),
      ]);
      setDetalheExtra({ vinculos, historico });
    } finally {
      setCarregandoExtra(false);
    }
  };

  const abrirAcao = (tipo, user) => {
    // Validações no frontend
    if (user.id === adminId) {
      setErro(tipo === 'promover'
        ? 'Você não pode promover a si mesmo.'
        : 'Você não pode remover a sua própria promoção.');
      return;
    }
    if (tipo === 'promover' && user.papel === 'admin') {
      setErro('Este usuário já é administrador.');
      return;
    }
    if (tipo === 'remover' && user.papel !== 'admin') {
      setErro('Este usuário não é administrador.');
      return;
    }
    setErro('');
    setAcaoAtual({ tipo, user });
  };

  const fecharAcao = () => setAcaoAtual(null);

  const executarAcao = async () => {
    if (!acaoAtual) return;
    const { tipo, user } = acaoAtual;
    setSalvando(true);
    setErro('');
    try {
      const agora = new Date().toISOString();
      if (tipo === 'promover') {
        await pb.collection('users').update(user.id, {
          papel: 'admin',
          admin_promovido_por: adminId,
          admin_data_promocao: agora,
        });
        setMsgSucesso(`${nomeUser(user)} foi promovido a administrador. Ele agora possui privilégios administrativos no portal.`);
      } else if (tipo === 'remover') {
        await pb.collection('users').update(user.id, {
          papel: 'membro',
          admin_promovido_por: adminId,
          admin_data_promocao: agora,
        });
        setMsgSucesso(`A promoção de ${nomeUser(user)} foi removida. Ele voltou ao papel de membro.`);
      }
      setAcaoAtual(null);
      setDetalhe(null);
      carregar();
      setTimeout(() => setMsgSucesso(''), 7000);
    } catch (err) {
      const msg = err?.response?.message || err?.message || 'Não foi possível concluir a ação.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroPapel('todos');
    setFiltroStatus('todos');
  };

  const filtrosAtivos = busca || filtroPapel !== 'todos' || filtroStatus !== 'todos';
  const acaoTitulo = { promover: 'Promover a administrador', remover: 'Remover promoção' };
  const acaoLabel = { promover: 'Confirmar promoção', remover: 'Confirmar remoção' };

  return (
    <>
      <Helmet>
        <title>Promover Administrador | Administração Conexão Batista</title>
        <meta name="description" content="Promover membros a administradores do portal Conexão Batista." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Administração · Administradores</p>
          <h1 className="font-display text-3xl font-bold text-primary">Promover Administrador</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Promova membros a <strong>administradores</strong> do portal ou remova a promoção quando necessário.
            Apenas administradores podem realizar esta ação, e ninguém pode promover ou remover a si mesmo.
          </p>
        </div>

        {msgSucesso && (
          <p className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 size={16} className="mr-1.5 inline" /> {msgSucesso}
          </p>
        )}
        {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

        {/* Filtros */}
        <div className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
              <select
                value={filtroPapel}
                onChange={(e) => setFiltroPapel(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="todos">Todos os papéis</option>
                <option value="membro">Membros</option>
                <option value="pastor">Pastores</option>
                <option value="secretario">Secretários</option>
                <option value="presidente">Presidentes</option>
                <option value="admin">Administradores</option>
              </select>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="col-span-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:col-span-1"
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="aprovado">Aprovados</option>
                <option value="recusado">Recusados</option>
              </select>
            </div>
          </div>
          {filtrosAtivos && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{totalItems} resultado(s)</span>
              <button type="button" onClick={limparFiltros} className="font-semibold text-primary hover:underline">
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabela / Cards */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" /> Carregando membros…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <ShieldCheck size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">
                {filtrosAtivos ? 'Nenhum membro encontrado com esses filtros.' : 'Nenhum membro cadastrado.'}
              </p>
            </div>
          ) : (
            <>
              {/* Tabela desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-bold">Membro</th>
                      <th className="px-4 py-3 font-bold">Papel atual</th>
                      <th className="px-4 py-3 font-bold">Status aprovação</th>
                      <th className="px-4 py-3 font-bold">Cadastro</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((u) => {
                      const PIcon = PAPEL_ICON[u.papel] || UsersIcon;
                      const isAdmin = u.papel === 'admin';
                      const isSelf = u.id === adminId;
                      return (
                        <tr key={u.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">
                              {nomeUser(u)}{isSelf && <span className="ml-1.5 text-xs font-bold text-accent">(você)</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">{u.email || '—'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${PAPEL_BADGE[u.papel] || 'border-border bg-muted text-muted-foreground'}`}>
                              <PIcon size={13} /> {PAPEL_LABEL[u.papel] || u.papel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {STATUS_APROVACAO_LABEL[u.status_aprovacao] || u.status_aprovacao || '—'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatarData(u.created)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button type="button" onClick={() => abrirDetalhe(u)}
                                className="rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/5">
                                Detalhes
                              </button>
                              {isAdmin ? (
                                <button type="button" onClick={() => abrirAcao('remover', u)} disabled={isSelf}
                                  className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40">
                                  Remover
                                </button>
                              ) : (
                                <button type="button" onClick={() => abrirAcao('promover', u)} disabled={isSelf}
                                  className="rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40">
                                  Promover
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile */}
              <div className="divide-y divide-border md:hidden">
                {items.map((u) => {
                  const PIcon = PAPEL_ICON[u.papel] || UsersIcon;
                  const isAdmin = u.papel === 'admin';
                  const isSelf = u.id === adminId;
                  return (
                    <div key={u.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {nomeUser(u)}{isSelf && <span className="ml-1 text-xs font-bold text-accent">(você)</span>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{u.email || '—'}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${PAPEL_BADGE[u.papel] || 'border-border bg-muted text-muted-foreground'}`}>
                          <PIcon size={13} /> {PAPEL_LABEL[u.papel] || u.papel}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{STATUS_APROVACAO_LABEL[u.status_aprovacao] || u.status_aprovacao || '—'}</span>
                        <span>{formatarData(u.created)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => abrirDetalhe(u)}
                          className="flex-1 rounded-lg border border-primary/30 px-2.5 py-2 text-xs font-bold text-primary hover:bg-primary/5">
                          Detalhes
                        </button>
                        {isAdmin ? (
                          <button type="button" onClick={() => abrirAcao('remover', u)} disabled={isSelf}
                            className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-40">
                            Remover
                          </button>
                        ) : (
                          <button type="button" onClick={() => abrirAcao('promover', u)} disabled={isSelf}
                            className="flex-1 rounded-lg border border-green-300 bg-green-50 px-2.5 py-2 text-xs font-bold text-green-700 hover:bg-green-100 disabled:opacity-40">
                            Promover
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Paginação */}
        {!loading && items.length > 0 && !busca && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Página {pagina} de {totalPages}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-semibold text-foreground disabled:opacity-40 hover:bg-muted">
                <ChevronLeft size={16} /> Anterior
              </button>
              <button type="button" onClick={() => setPagina((p) => Math.min(totalPages, p + 1))} disabled={pagina >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-semibold text-foreground disabled:opacity-40 hover:bg-muted">
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal de detalhes */}
      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-primary">Detalhes do membro</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <DetalhesMembro
              user={detalhe}
              extra={detalheExtra}
              carregandoExtra={carregandoExtra}
              onAcao={abrirAcao}
              adminId={adminId}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de ação */}
      <Dialog open={!!acaoAtual} onOpenChange={(v) => !v && fecharAcao()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-primary">
              {acaoAtual ? acaoTitulo[acaoAtual.tipo] : ''}
            </DialogTitle>
          </DialogHeader>
          {acaoAtual && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="font-bold text-foreground">{nomeUser(acaoAtual.user)}</p>
                <p className="text-xs text-muted-foreground">
                  {acaoAtual.user.email} · Papel atual: {PAPEL_LABEL[acaoAtual.user.papel] || acaoAtual.user.papel}
                </p>
              </div>
              {acaoAtual.tipo === 'promover' ? (
                <div className="rounded-lg bg-green-50 px-4 py-3 text-xs text-green-700">
                  <AlertTriangle size={14} className="mr-1.5 inline" />
                  Ao promover, este usuário terá privilégios administrativos no portal (acesso a todos os membros,
                  aprovações, etc.). Confirme apenas se confiar nesta pessoa.
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Remover a promoção? O usuário voltará ao papel de <strong>membro</strong> e perderá os privilégios administrativos.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={fecharAcao}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executarAcao}
                  disabled={salvando}
                  className={`rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${
                    acaoAtual.tipo === 'promover' ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {salvando ? 'Salvando…' : acaoLabel[acaoAtual.tipo]}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetalhesMembro({ user, extra, carregandoExtra, onAcao, adminId }) {
  const PIcon = PAPEL_ICON[user.papel] || UsersIcon;
  const isAdmin = user.papel === 'admin';
  const isSelf = user.id === adminId;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
          {(nomeUser(user) || '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-display text-lg font-bold text-foreground">
            {nomeUser(user)}{isSelf && <span className="ml-1.5 text-xs font-bold text-accent">(você)</span>}
          </p>
          <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${PAPEL_BADGE[user.papel] || 'border-border bg-muted text-muted-foreground'}`}>
            <PIcon size={13} /> {PAPEL_LABEL[user.papel] || user.papel}
          </span>
        </div>
      </div>

      <dl className="divide-y divide-border rounded-xl border border-border">
        <DetalheRow icon={UserCircle} label="E-mail" value={user.email} />
        <DetalheRow icon={UserCircle} label="WhatsApp" value={user.whatsapp} />
        <DetalheRow icon={UserCircle} label="Cidade" value={user.cidade} />
        <DetalheRow icon={Calendar} label="Data de cadastro" value={formatarData(user.created)} />
        <DetalheRow icon={ShieldCheck} label="Status de aprovação" value={STATUS_APROVACAO_LABEL[user.status_aprovacao] || user.status_aprovacao} />
        {user.admin_data_promocao && (
          <DetalheRow icon={Crown} label="Promovido em" value={formatarData(user.admin_data_promocao)} />
        )}
      </dl>

      {/* Vínculos com igrejas */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
          <Church size={16} /> Vínculos com igrejas
        </p>
        {carregandoExtra ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Carregando…</p>
        ) : extra && extra.vinculos.length > 0 ? (
          <ul className="space-y-1.5 text-xs">
            {extra.vinculos.map((v) => {
              const ig = v.expand?.igreja_id;
              const igreja = Array.isArray(ig) ? ig[0] : ig;
              return (
                <li key={v.id} className="rounded bg-white px-2.5 py-1.5">
                  <span className="font-semibold text-foreground">{igreja?.razao_social || igreja?.nome_fantasia || igreja?.nome || 'Igreja'}</span>
                  {' — '}
                  {PAPEL_LABEL[v.papel] || v.papel} · {v.status}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-xs text-muted-foreground">Nenhum vínculo registrado.</p>}
      </div>

      {/* Histórico de ações */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <History size={16} /> Histórico de ações
        </p>
        {carregandoExtra ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Carregando…</p>
        ) : extra && extra.historico.length > 0 ? (
          <ol className="space-y-2.5">
            {extra.historico.slice(0, 8).map((h) => (
              <li key={h.id} className="rounded-lg border border-border bg-white p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground">
                    {h.tipo_acao === 'criacao' ? 'Criação' : h.tipo_acao === 'edicao' ? 'Decisão' : h.tipo_acao}
                  </span>
                  <span className="text-muted-foreground">{formatarData(h.created || h.data_acao)}</span>
                </div>
                <p className="mt-1 text-muted-foreground">Por: <span className="font-semibold text-foreground">{h.responsavel_nome || '—'}</span></p>
                {(h.status_anterior || h.status_novo) && (
                  <p className="mt-0.5 text-muted-foreground">Status: {h.status_anterior || '—'} → {h.status_novo || '—'}</p>
                )}
                {h.motivo && <p className="mt-1 text-muted-foreground">Motivo: {h.motivo}</p>}
              </li>
            ))}
          </ol>
        ) : <p className="text-xs text-muted-foreground">Nenhuma ação registrada.</p>}
      </div>

      {isSelf && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
          Você não pode promover ou remover a sua própria promoção.
        </p>
      )}

      {/* Botões de ação */}
      {!isSelf && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          {isAdmin ? (
            <button type="button" onClick={() => onAcao('remover', user)}
              className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:bg-amber-700">
              <ShieldOff size={16} className="mr-1.5 inline" /> Remover promoção
            </button>
          ) : (
            <button type="button" onClick={() => onAcao('promover', user)}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:bg-green-700">
              <ShieldCheck size={16} className="mr-1.5 inline" /> Promover a administrador
            </button>
          )}
          <Link to={`/adm/membros/${user.id}`}
            className="flex-1 rounded-lg border border-primary/30 px-4 py-2.5 text-center text-sm font-bold text-primary hover:bg-primary/5">
            Ver membro
          </Link>
        </div>
      )}
    </div>
  );
}

function DetalheRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon size={13} />} {label}
      </dt>
      <dd className="text-right text-sm font-semibold text-foreground">{value || '—'}</dd>
    </div>
  );
}
