import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Search, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2,
  UserCheck, Church, ShieldCheck, ShieldOff, PauseCircle, StopCircle,
  Crown, FileText, Users as UsersIcon, History, X,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

// Papéis de representante tratados por este painel.
const PAPEIS_REPRESENTANTES = ['pastor', 'secretario', 'presidente'];

const PAPEL_LABEL = {
  pastor: 'Pastor',
  secretario: 'Secretário',
  presidente: 'Presidente',
  membro: 'Membro',
  admin: 'Administrador',
};

const PAPEL_ICON = {
  pastor: Church,
  secretario: FileText,
  presidente: Crown,
};

const PAPEL_BADGE = {
  pastor: 'bg-primary/10 text-primary border-primary/30',
  secretario: 'bg-secondary/15 text-secondary-foreground border-secondary/40',
  presidente: 'bg-accent/15 text-accent border-accent/40',
};

const STATUS_INFO = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
  ativo: { label: 'Ativo', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
  recusado: { label: 'Recusado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  suspenso: { label: 'Suspenso', icon: PauseCircle, className: 'bg-amber-100 text-amber-700 border-amber-300' },
  encerrado: { label: 'Encerrado', icon: StopCircle, className: 'bg-muted text-muted-foreground border-border' },
};

const SEXO_LABEL = { masculino: 'Masculino', feminino: 'Feminino', outro: 'Outro' };
const PER_PAGE = 10;

function formatarData(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (_) { return iso; }
}

function formatarDataHora(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch (_) { return iso; }
}

function firstId(raw) {
  return Array.isArray(raw) ? raw[0] || '' : raw || '';
}

function nomeIgreja(rec) {
  if (!rec) return '—';
  return rec.razao_social || rec.nome_fantasia || rec.nome || 'Igreja sem nome';
}

function nomeUser(user) {
  if (!user) return '—';
  return user.name || user.username || user.email || '—';
}

export default function AprovacaoRepresentantesPage() {
  const { admin } = useAdminAuth();
  const responsavelNome = admin?.get?.('name') || admin?.name || admin?.get?.('username') || admin?.username || 'Administrador';
  const adminId = admin?.id || '';

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [filtroPapel, setFiltroPapel] = useState('todos');
  const [filtroIgreja, setFiltroIgreja] = useState('todas');
  const [igrejas, setIgrejas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msgSucesso, setMsgSucesso] = useState('');

  const [detalhe, setDetalhe] = useState(null); // vínculo em detalhe
  const [historico, setHistorico] = useState([]);
  const [carregandoHist, setCarregandoHist] = useState(false);
  const [acaoAtual, setAcaoAtual] = useState(null); // { tipo, vinculo }
  const [justificativa, setJustificativa] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Carrega lista de igrejas (empresas com tipo=igreja) para o filtro.
  useEffect(() => {
    pb.collection('empresas').getFullList({
      filter: 'tipo = "igreja"',
      sort: 'razao_social,nome_fantasia',
      fields: 'id,razao_social,nome_fantasia,nome,cidade,estado',
    }).then(setIgrejas).catch(() => setIgrejas([]));
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const filtros = [
        pb.filter('(papel = "pastor" || papel = "secretario" || papel = "presidente")'),
      ];
      if (filtroStatus !== 'todos') {
        filtros.push(pb.filter('status = {:st}', { st: filtroStatus }));
      }
      if (PAPEIS_REPRESENTANTES.includes(filtroPapel)) {
        filtros.push(pb.filter('papel = {:p}', { p: filtroPapel }));
      }
      if (filtroIgreja !== 'todas') {
        filtros.push(pb.filter('igreja_id = {:ig}', { ig: filtroIgreja }));
      }
      const result = await pb.collection('vinculos_usuario_igreja').getList(pagina, PER_PAGE, {
        filter: filtros.join(' && '),
        expand: 'usuario_id,igreja_id',
        sort: '-created',
      });
      // Busca client-side sobre o expand (nome/e-mail/igreja).
      const termo = busca.trim().toLowerCase();
      let filtered = result.items;
      if (termo) {
        filtered = result.items.filter((v) => {
          const u = v.expand?.usuario_id;
          const user = Array.isArray(u) ? u[0] : u;
          const ig = v.expand?.igreja_id;
          const igreja = Array.isArray(ig) ? ig[0] : ig;
          const nome = (nomeUser(user) || '').toLowerCase();
          const email = (user?.email || '').toLowerCase();
          const igrejaNome = (nomeIgreja(igreja) || '').toLowerCase();
          return nome.includes(termo) || email.includes(termo) || igrejaNome.includes(termo);
        });
      }
      setItems(filtered);
      setTotalItems(termo ? filtered.length : result.totalItems);
      setTotalPages(termo ? 1 : result.totalPages);
    } catch (err) {
      if (err?.isAbort || err?.status === 0) return;
      setErro('Não foi possível carregar a lista de solicitações de representantes.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, filtroPapel, filtroIgreja, pagina]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [busca, filtroStatus, filtroPapel, filtroIgreja]);

  const abrirDetalhe = async (vinculo) => {
    setDetalhe(vinculo);
    setHistorico([]);
    setCarregandoHist(true);
    try {
      const hist = await pb.collection('historico_vinculos').getFullList({
        filter: pb.filter('vinculo_id = {:vid}', { vid: vinculo.id }),
        sort: '-created',
      });
      setHistorico(hist);
    } catch (_) {
      setHistorico([]);
    } finally {
      setCarregandoHist(false);
    }
  };

  const executarAcao = async () => {
    if (!acaoAtual) return;
    const { tipo, vinculo } = acaoAtual;
    if (tipo === 'recusar' && !justificativa.trim()) return;

    // Validações no frontend
    if (!PAPEIS_REPRESENTANTES.includes(vinculo.papel)) {
      setErro('Este vínculo não é de um representante (Pastor, Secretário ou Presidente).');
      return;
    }
    if (vinculo.status !== 'pendente') {
      setErro('Apenas vínculos pendentes podem ser aprovados ou recusados.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      if (tipo === 'aprovar') {
        await pb.collection('vinculos_usuario_igreja').update(vinculo.id, {
          status: 'ativo',
          pode_aprovar_membros: true,
          motivo_recusa: '',
          motivo_alteracao: 'Vínculo de representante aprovado pelo administrador',
          responsavel_nome: responsavelNome,
        });
        const user = vinculo.expand?.usuario_id;
        const userName = nomeUser(Array.isArray(user) ? user[0] : user);
        setMsgSucesso(`Vínculo de ${userName} (${PAPEL_LABEL[vinculo.papel]}) ativado. Ele já pode atuar como aprovador no Painel da Igreja.`);
      } else if (tipo === 'recusar') {
        await pb.collection('vinculos_usuario_igreja').update(vinculo.id, {
          status: 'recusado',
          motivo_recusa: justificativa.trim(),
          motivo_alteracao: justificativa.trim(),
          responsavel_nome: responsavelNome,
        });
        const user = vinculo.expand?.usuario_id;
        const userName = nomeUser(Array.isArray(user) ? user[0] : user);
        setMsgSucesso(`Vínculo de ${userName} recusado. O motivo foi registrado no histórico.`);
      }
      setAcaoAtual(null);
      setJustificativa('');
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

  const abrirAcao = (tipo, vinculo) => {
    setAcaoAtual({ tipo, vinculo });
    setJustificativa('');
  };

  const fecharAcao = () => {
    setAcaoAtual(null);
    setJustificativa('');
  };

  const acaoTitulo = { aprovar: 'Aprovar representante', recusar: 'Recusar representante' };
  const acaoLabel = { aprovar: 'Confirmar aprovação', recusar: 'Confirmar recusa' };

  const limparFiltros = () => {
    setBusca('');
    setFiltroStatus('pendente');
    setFiltroPapel('todos');
    setFiltroIgreja('todas');
  };

  const filtrosAtivos = busca || filtroStatus !== 'pendente' || filtroPapel !== 'todos' || filtroIgreja !== 'todas';

  return (
    <>
      <Helmet>
        <title>Aprovação de Representantes | Administração Conexão Batista</title>
        <meta name="description" content="Aprovação de vínculos de Pastores, Secretários e Presidentes com igrejas." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Administração · Representantes</p>
          <h1 className="font-display text-3xl font-bold text-primary">Aprovação de Representantes</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Aprove ou recuse vínculos de <strong>Pastores</strong>, <strong>Secretários</strong> e <strong>Presidentes</strong>
            {' '}com suas igrejas. Ao aprovar, o vínculo fica <strong>Ativo</strong>, o representante recebe permissão para
            aprovar membros no Painel da Igreja e o usuário passa a ter acesso normal ao portal.
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
                placeholder="Buscar por nome, e-mail ou igreja"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="pendente">Pendentes</option>
                <option value="ativo">Ativos</option>
                <option value="recusado">Recusados</option>
                <option value="suspenso">Suspensos</option>
                <option value="encerrado">Encerrados</option>
                <option value="todos">Todos os status</option>
              </select>
              <select
                value={filtroPapel}
                onChange={(e) => setFiltroPapel(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="todos">Todos os papéis</option>
                <option value="pastor">Pastor</option>
                <option value="secretario">Secretário</option>
                <option value="presidente">Presidente</option>
              </select>
              <select
                value={filtroIgreja}
                onChange={(e) => setFiltroIgreja(e.target.value)}
                className="col-span-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:col-span-1"
              >
                <option value="todas">Todas as igrejas</option>
                {igrejas.map((ig) => (
                  <option key={ig.id} value={ig.id}>{nomeIgreja(ig)}</option>
                ))}
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
              <Loader2 size={20} className="animate-spin" /> Carregando solicitações de representantes…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <UserCheck size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">
                {filtrosAtivos
                  ? 'Nenhuma solicitação encontrada com esses filtros.'
                  : 'Nenhuma solicitação de representante pendente.'}
              </p>
            </div>
          ) : (
            <>
              {/* Tabela desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-bold">Representante</th>
                      <th className="px-4 py-3 font-bold">Papel</th>
                      <th className="px-4 py-3 font-bold">Igreja</th>
                      <th className="px-4 py-3 font-bold">Data</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Aprova membros</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((v) => {
                      const u = v.expand?.usuario_id;
                      const user = Array.isArray(u) ? u[0] : u;
                      const ig = v.expand?.igreja_id;
                      const igreja = Array.isArray(ig) ? ig[0] : ig;
                      const st = STATUS_INFO[v.status] || STATUS_INFO.pendente;
                      const StIcon = st.icon;
                      const PIcon = PAPEL_ICON[v.papel] || UsersIcon;
                      return (
                        <tr key={v.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{nomeUser(user)}</div>
                            <div className="text-xs text-muted-foreground">{user?.email || '—'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${PAPEL_BADGE[v.papel] || 'border-border bg-muted text-muted-foreground'}`}>
                              <PIcon size={13} /> {PAPEL_LABEL[v.papel] || v.papel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {nomeIgreja(igreja)}
                            {(igreja?.cidade || igreja?.estado) && (
                              <span className="block text-xs">{igreja?.cidade}{igreja?.estado ? `/${igreja.estado}` : ''}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatarData(v.data_criacao || v.created)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                              <StIcon size={13} strokeWidth={2} /> {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {v.pode_aprovar_membros ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700"><ShieldCheck size={14} /> Sim</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><ShieldOff size={14} /> Não</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button type="button" onClick={() => abrirDetalhe(v)}
                                className="rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/5">
                                Detalhes
                              </button>
                              {v.status === 'pendente' && (
                                <>
                                  <button type="button" onClick={() => abrirAcao('aprovar', v)}
                                    className="rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100">
                                    Aprovar
                                  </button>
                                  <button type="button" onClick={() => abrirAcao('recusar', v)}
                                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10">
                                    Rejeitar
                                  </button>
                                </>
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
                {items.map((v) => {
                  const u = v.expand?.usuario_id;
                  const user = Array.isArray(u) ? u[0] : u;
                  const ig = v.expand?.igreja_id;
                  const igreja = Array.isArray(ig) ? ig[0] : ig;
                  const st = STATUS_INFO[v.status] || STATUS_INFO.pendente;
                  const StIcon = st.icon;
                  const PIcon = PAPEL_ICON[v.papel] || UsersIcon;
                  return (
                    <div key={v.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{nomeUser(user)}</p>
                          <p className="truncate text-xs text-muted-foreground">{user?.email || '—'}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${PAPEL_BADGE[v.papel] || 'border-border bg-muted text-muted-foreground'}`}>
                          <PIcon size={13} /> {PAPEL_LABEL[v.papel] || v.papel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{nomeIgreja(igreja)}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                          <StIcon size={13} strokeWidth={2} /> {st.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatarData(v.data_criacao || v.created)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => abrirDetalhe(v)}
                          className="flex-1 rounded-lg border border-primary/30 px-2.5 py-2 text-xs font-bold text-primary hover:bg-primary/5">
                          Detalhes
                        </button>
                        {v.status === 'pendente' && (
                          <>
                            <button type="button" onClick={() => abrirAcao('aprovar', v)}
                              className="flex-1 rounded-lg border border-green-300 bg-green-50 px-2.5 py-2 text-xs font-bold text-green-700 hover:bg-green-100">
                              Aprovar
                            </button>
                            <button type="button" onClick={() => abrirAcao('recusar', v)}
                              className="flex-1 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10">
                              Rejeitar
                            </button>
                          </>
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
        {!loading && items.length > 0 && filtroStatus !== 'todos' && !busca && filtroPapel === 'todos' && filtroIgreja === 'todas' && (
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
            <DialogTitle className="font-display text-lg font-bold text-primary">Detalhes da solicitação</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <DetalhesContent
              vinculo={detalhe}
              onAcao={abrirAcao}
              historico={historico}
              carregandoHist={carregandoHist}
              adminId={adminId}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de ação (aprovar / recusar) */}
      <Dialog open={!!acaoAtual} onOpenChange={(v) => !v && fecharAcao()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-primary">
              {acaoAtual ? acaoTitulo[acaoAtual.tipo] : ''}
            </DialogTitle>
          </DialogHeader>
          {acaoAtual && (
            <div className="space-y-4">
              {(() => {
                const user = acaoAtual.vinculo.expand?.usuario_id;
                const u = Array.isArray(user) ? user[0] : user;
                const ig = acaoAtual.vinculo.expand?.igreja_id;
                const igreja = Array.isArray(ig) ? ig[0] : ig;
                const nome = nomeUser(u);
                return (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                    <p className="font-bold text-foreground">{nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {PAPEL_LABEL[acaoAtual.vinculo.papel]} · {nomeIgreja(igreja)}
                    </p>
                  </div>
                );
              })()}
              <p className="text-sm text-muted-foreground">
                {acaoAtual.tipo === 'aprovar'
                  ? 'Confirmar a aprovação deste vínculo? O status passará para "Ativo", o representante receberá permissão para aprovar membros no Painel da Igreja e o usuário terá acesso normal ao portal.'
                  : 'Recusar este vínculo? A justificativa abaixo é obrigatória e será registrada no histórico.'}
              </p>
              {acaoAtual.tipo === 'recusar' && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Justificativa *</label>
                  <textarea
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    rows={4}
                    placeholder="Informe o motivo da recusa…"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={fecharAcao}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executarAcao}
                  disabled={salvando || (acaoAtual.tipo === 'recusar' && !justificativa.trim())}
                  className={`rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${
                    acaoAtual.tipo === 'aprovar' ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-destructive hover:bg-destructive/90'
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

function DetalhesContent({ vinculo, onAcao, historico, carregandoHist, adminId }) {
  const u = vinculo.expand?.usuario_id;
  const user = Array.isArray(u) ? u[0] : u;
  const ig = vinculo.expand?.igreja_id;
  const igreja = Array.isArray(ig) ? ig[0] : ig;
  const st = STATUS_INFO[vinculo.status] || STATUS_INFO.pendente;
  const StIcon = st.icon;
  const PIcon = PAPEL_ICON[vinculo.papel] || UsersIcon;
  const isSelf = adminId && firstId(vinculo.usuario_id) === adminId;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
          {(nomeUser(user) || '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-display text-lg font-bold text-foreground">{nomeUser(user)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${PAPEL_BADGE[vinculo.papel] || 'border-border bg-muted text-muted-foreground'}`}>
              <PIcon size={13} /> {PAPEL_LABEL[vinculo.papel] || vinculo.papel}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
              <StIcon size={13} strokeWidth={2} /> {st.label}
            </span>
          </div>
        </div>
      </div>

      <dl className="divide-y divide-border rounded-xl border border-border">
        <DetalheRow label="E-mail" value={user?.email} />
        <DetalheRow label="WhatsApp" value={user?.whatsapp} />
        <DetalheRow label="Sexo" value={SEXO_LABEL[user?.sexo]} />
        <DetalheRow label="Cidade" value={user?.cidade} />
        <DetalheRow label="Igreja" value={nomeIgreja(igreja)} />
        <DetalheRow label="Papel solicitado" value={PAPEL_LABEL[vinculo.papel] || vinculo.papel} />
        <DetalheRow label="Data da solicitação" value={formatarData(vinculo.data_criacao || vinculo.created)} />
        <DetalheRow label="Pode aprovar membros" value={vinculo.pode_aprovar_membros ? 'Sim' : 'Não'} />
        {vinculo.motivo_recusa && (
          <DetalheRow label="Motivo da recusa" value={vinculo.motivo_recusa} />
        )}
      </dl>

      {/* Histórico de ações */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <History size={16} /> Histórico de ações
        </p>
        {carregandoHist ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Carregando histórico…
          </p>
        ) : historico.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma ação registrada.</p>
        ) : (
          <ol className="space-y-2.5">
            {historico.map((h) => (
              <li key={h.id} className="rounded-lg border border-border bg-white p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground">
                    {h.tipo_acao === 'criacao' ? 'Criação' : h.tipo_acao === 'edicao' ? 'Decisão' : h.tipo_acao}
                  </span>
                  <span className="text-muted-foreground">{formatarDataHora(h.created || h.data_acao)}</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Por: <span className="font-semibold text-foreground">{h.responsavel_nome || '—'}</span>
                </p>
                {(h.status_anterior || h.status_novo) && (
                  <p className="mt-0.5 text-muted-foreground">
                    Status: {h.status_anterior || '—'} → <span className="font-semibold text-foreground">{h.status_novo || '—'}</span>
                  </p>
                )}
                {(h.papel_anterior || h.papel_novo) && (
                  <p className="mt-0.5 text-muted-foreground">
                    Papel: {PAPEL_LABEL[h.papel_anterior] || h.papel_anterior || '—'} → <span className="font-semibold text-foreground">{PAPEL_LABEL[h.papel_novo] || h.papel_novo || '—'}</span>
                  </p>
                )}
                {h.motivo && (
                  <p className="mt-1 text-muted-foreground">Motivo: {h.motivo}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {isSelf && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
          Você não pode aprovar o seu próprio vínculo. Esta solicitação deve ser decidida por outro administrador.
        </p>
      )}

      {/* Botões de ação — apenas para vínculos pendentes */}
      {vinculo.status === 'pendente' && !isSelf && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => onAcao('aprovar', vinculo)}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:bg-green-700">
            <CheckCircle2 size={16} className="mr-1.5 inline" /> Aprovar
          </button>
          <button type="button" onClick={() => onAcao('recusar', vinculo)}
            className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground transition-opacity hover:bg-destructive/90">
            <XCircle size={16} className="mr-1.5 inline" /> Rejeitar
          </button>
        </div>
      )}

      {vinculo.status !== 'pendente' && (
        <Link to={`/adm/membros/${firstId(vinculo.usuario_id)}`}
          className="block rounded-lg border border-primary/30 px-4 py-2.5 text-center text-sm font-bold text-primary hover:bg-primary/5">
          Ver membro
        </Link>
      )}
    </div>
  );
}

function DetalheRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-semibold text-foreground">{value || '—'}</dd>
    </div>
  );
}
