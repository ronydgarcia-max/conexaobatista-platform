import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Search, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2,
  UserCheck, Church, ShieldCheck, ShieldOff, PauseCircle, StopCircle,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const PAPEL_LABEL = { pastor: 'Pastor', secretario: 'Secretário', membro: 'Membro', presidente: 'Presidente' };

const STATUS_INFO = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
  ativo: { label: 'Ativo', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
  recusado: { label: 'Recusado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  suspenso: { label: 'Suspenso', icon: PauseCircle, className: 'bg-amber-100 text-amber-700 border-amber-300' },
  encerrado: { label: 'Encerrado', icon: StopCircle, className: 'bg-muted text-muted-foreground border-border' },
};

const PER_PAGE = 10;

function formatarData(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (_) { return iso; }
}

function firstId(raw) {
  return Array.isArray(raw) ? raw[0] || '' : raw || '';
}

function nomeIgreja(rec) {
  if (!rec) return '—';
  return rec.razao_social || rec.nome_fantasia || rec.nome || 'Igreja sem nome';
}

export default function AprovacaoVinculosPage() {
  const { admin } = useAdminAuth();
  const responsavelNome = admin?.get?.('name') || admin?.name || admin?.get?.('username') || admin?.username || 'Administrador';

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [filtroTipo, setFiltroTipo] = useState('representantes');
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msgSucesso, setMsgSucesso] = useState('');

  const [acaoAtual, setAcaoAtual] = useState(null); // { tipo, vinculo }
  const [justificativa, setJustificativa] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      // Filtro por tipo de vínculo. "representantes" = Fluxo 2
      // (pastor/secretário); "membros" = vínculos de membros (Fluxo 3,
      // normalmente aprovados pelo pastor no Painel da Igreja, mas o admin
      // pode ver/aprovar aqui como fallback); "todos" = qualquer papel.
      const filtros = [];
      if (filtroTipo === 'representantes') {
        filtros.push(pb.filter('(papel = "pastor" || papel = "secretario")'));
      } else if (filtroTipo === 'membros') {
        filtros.push(pb.filter('papel = "membro"'));
      } else {
        filtros.push(pb.filter('(papel = "pastor" || papel = "secretario" || papel = "presidente" || papel = "membro")'));
      }
      if (filtroStatus !== 'todos') {
        filtros.push(pb.filter('status = {:st}', { st: filtroStatus }));
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
          const nome = (user?.name || '').toLowerCase();
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
      setErro('Não foi possível carregar a lista de vínculos de representantes.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, filtroTipo, pagina]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [busca, filtroStatus, filtroTipo]);

  const executarAcao = async () => {
    if (!acaoAtual) return;
    const { tipo, vinculo } = acaoAtual;
    if (tipo === 'recusar' && !justificativa.trim()) return;

    setSalvando(true);
    setErro('');
    try {
      if (tipo === 'aprovar') {
        await pb.collection('vinculos_usuario_igreja').update(vinculo.id, {
          status: 'ativo',
          motivo_recusa: '',
          motivo_alteracao: 'Vínculo de representante aprovado pelo administrador',
          responsavel_nome: responsavelNome,
        });
        const user = vinculo.expand?.usuario_id;
        const userName = (Array.isArray(user) ? user[0]?.name : user?.name) || 'Representante';
        setMsgSucesso(`Vínculo de ${userName} (${PAPEL_LABEL[vinculo.papel]}) ativado. Ele já pode atuar como aprovador no Painel da Igreja.`);
      } else if (tipo === 'recusar') {
        await pb.collection('vinculos_usuario_igreja').update(vinculo.id, {
          status: 'recusado',
          motivo_recusa: justificativa.trim(),
          motivo_alteracao: justificativa.trim(),
          responsavel_nome: responsavelNome,
        });
        const user = vinculo.expand?.usuario_id;
        const userName = (Array.isArray(user) ? user[0]?.name : user?.name) || 'Representante';
        setMsgSucesso(`Vínculo de ${userName} recusado. O motivo foi registrado.`);
      }
      setAcaoAtual(null);
      setJustificativa('');
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

  const acaoTitulo = { aprovar: 'Aprovar vínculo do representante', recusar: 'Recusar vínculo do representante' };
  const acaoLabel = { aprovar: 'Confirmar aprovação', recusar: 'Confirmar recusa' };

  return (
    <>
      <Helmet>
        <title>Aprovação de Vínculos de Representantes | Administração Conexão Batista</title>
        <meta name="description" content="Aprovação de vínculos de Pastores e Secretários com igrejas." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Fluxo 2 · Administração</p>
          <h1 className="font-display text-3xl font-bold text-primary">Aprovação do vínculo do representante</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Aprove ou recuse vínculos de <strong>Pastores</strong> e <strong>Secretários</strong> com suas igrejas.
            Ao aprovar, o vínculo fica <strong>Ativo</strong> e o representante passa a atuar como aprovador de membros no Painel da Igreja.
            Use o filtro <strong>Tipo de vínculo</strong> para ver também vínculos de <strong>Membros</strong> pendentes (normalmente aprovados pelo pastor no Painel da Igreja, mas disponíveis aqui como fallback de administração).
          </p>
        </div>

        {/* Diferenciação dos fluxos */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fluxo 1</p>
            <p className="mt-1 text-sm font-bold text-foreground">Aprovação do cadastro do usuário</p>
            <Link to="/adm/membros" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Ver em Membros →
            </Link>
          </div>
          <div className="rounded-xl border border-accent/40 bg-accent/8 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Fluxo 2 · Você está aqui</p>
            <p className="mt-1 text-sm font-bold text-foreground">Aprovação do vínculo do representante</p>
            <p className="mt-1 text-xs text-muted-foreground">Pastor / Secretário · ativa o aprovador</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fluxo 3</p>
            <p className="mt-1 text-sm font-bold text-foreground">Solicitações de membros</p>
            <p className="mt-1 text-xs text-muted-foreground">Painel da Igreja · Pastor / Secretário ativo</p>
          </div>
        </div>

        {msgSucesso && (
          <p className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 size={16} className="mr-1.5 inline" /> {msgSucesso}
          </p>
        )}
        {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
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
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="representantes">Representantes (Pastor/Secretário)</option>
            <option value="membros">Membros</option>
            <option value="todos">Todos os vínculos</option>
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="pendente">Pendentes</option>
            <option value="ativo">Ativos</option>
            <option value="recusado">Recusados</option>
            <option value="suspenso">Suspensos</option>
            <option value="encerrado">Encerrados</option>
            <option value="todos">Todos os status</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" /> Carregando vínculos de representantes…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <UserCheck size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhum vínculo encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Representante</th>
                    <th className="px-4 py-3 font-bold">Papel</th>
                    <th className="hidden px-4 py-3 font-bold md:table-cell">Igreja</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Data do vínculo</th>
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
                    return (
                      <tr key={v.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{user?.name || '—'}</div>
                          <div className="text-xs text-muted-foreground">{user?.email || '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-foreground">{PAPEL_LABEL[v.papel] || v.papel}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          {nomeIgreja(igreja)}
                          {(igreja?.cidade || igreja?.estado) && (
                            <span className="block text-xs">{igreja?.cidade}{igreja?.estado ? `/${igreja.estado}` : ''}</span>
                          )}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{formatarData(v.data_criacao || v.created)}</td>
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
                          {v.status === 'pendente' ? (
                            <div className="flex justify-end gap-1.5">
                              <button type="button" onClick={() => abrirAcao('aprovar', v)}
                                className="rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100">
                                Aprovar
                              </button>
                              <button type="button" onClick={() => abrirAcao('recusar', v)}
                                className="rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10">
                                Recusar
                              </button>
                            </div>
                          ) : (
                            <Link to={`/adm/membros/${firstId(v.usuario_id)}`}
                              className="rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/5">
                              Ver membro
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {!loading && items.length > 0 && filtroStatus !== 'todos' && !busca && (
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
                const nome = u?.name || 'representante';
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
                  ? 'Confirmar a aprovação deste vínculo? O status passará para "Ativo" e o representante poderá aprovar solicitações de membros no Painel da Igreja.'
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
