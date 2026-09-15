import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Search, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2,
  GraduationCap, BookOpen, FileText, Calendar, History, UserCircle,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const STATUS_INFO = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
  aprovado: { label: 'Aprovado', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
  rejeitado: { label: 'Rejeitado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

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

function nomeUser(user) {
  if (!user) return '—';
  return user.name || user.username || user.email || '—';
}

function parseJson(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch (_) { return []; }
}

export default function AprovacaoTutoresPage() {
  const { admin } = useAdminAuth();
  const responsavelNome = admin?.get?.('name') || admin?.name || admin?.get?.('username') || admin?.username || 'Administrador';
  const adminId = admin?.id || '';

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [filtroArea, setFiltroArea] = useState('todas');
  const [areas, setAreas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msgSucesso, setMsgSucesso] = useState('');

  const [detalhe, setDetalhe] = useState(null);
  const [acaoAtual, setAcaoAtual] = useState(null); // { tipo, user }
  const [justificativa, setJustificativa] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Carrega áreas de mentor para o filtro.
  useEffect(() => {
    pb.collection('areas_mentor').getFullList({
      filter: 'ativo = true',
      sort: 'nome',
      fields: 'id,nome',
    }).then(setAreas).catch(() => setAreas([]));
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const filtros = [pb.filter('mentor_solicitado = true')];
      if (filtroStatus !== 'todos') {
        filtros.push(pb.filter('mentor_status = {:st}', { st: filtroStatus }));
      }
      const result = await pb.collection('users').getList(pagina, PER_PAGE, {
        filter: filtros.join(' && '),
        sort: '-mentor_data_solicitacao,-created',
        fields: 'id,name,username,email,whatsapp,cidade,mentor_solicitado,mentor_status,mentor_areas,mentor_cursos_publicados,mentor_biografia,mentor_data_solicitacao,mentor_aprovado_por,mentor_data_aprovacao,mentor_motivo_rejeicao,created',
      });

      // Busca client-side + filtro por área (área está dentro de mentor_areas JSON).
      const termo = busca.trim().toLowerCase();
      let filtered = result.items;
      if (termo) {
        filtered = filtered.filter((u) => {
          const nome = (nomeUser(u) || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          return nome.includes(termo) || email.includes(termo);
        });
      }
      if (filtroArea !== 'todas') {
        filtered = filtered.filter((u) => {
          const userAreas = parseJson(u.mentor_areas);
          return userAreas.some((a) => (typeof a === 'string' ? a : a?.id || a?.nome) === filtroArea
            || (a?.id || '') === filtroArea || (a?.nome || '') === filtroArea);
        });
      }
      setItems(filtered);
      setTotalItems(termo || filtroArea !== 'todas' ? filtered.length : result.totalItems);
      setTotalPages(termo || filtroArea !== 'todas' ? 1 : result.totalPages);
    } catch (err) {
      if (err?.isAbort || err?.status === 0) return;
      setErro('Não foi possível carregar a lista de solicitações de tutores.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, filtroArea, pagina]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [busca, filtroStatus, filtroArea]);

  const abrirAcao = (tipo, user) => {
    setAcaoAtual({ tipo, user });
    setJustificativa('');
  };

  const fecharAcao = () => {
    setAcaoAtual(null);
    setJustificativa('');
  };

  const executarAcao = async () => {
    if (!acaoAtual) return;
    const { tipo, user } = acaoAtual;
    if (tipo === 'rejeitar' && !justificativa.trim()) return;

    if (user.mentor_status !== 'pendente') {
      setErro('Apenas solicitações pendentes podem ser aprovadas ou rejeitadas.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      const agora = new Date().toISOString();
      if (tipo === 'aprovar') {
        await pb.collection('users').update(user.id, {
          mentor_status: 'aprovado',
          mentor_data_aprovacao: agora,
          mentor_aprovado_por: adminId,
          mentor_motivo_rejeicao: '',
        });
        setMsgSucesso(`${nomeUser(user)} foi aprovado como tutor. Ele já pode publicar cursos na plataforma.`);
      } else if (tipo === 'rejeitar') {
        await pb.collection('users').update(user.id, {
          mentor_status: 'rejeitado',
          mentor_data_aprovacao: agora,
          mentor_aprovado_por: adminId,
          mentor_motivo_rejeicao: justificativa.trim(),
        });
        setMsgSucesso(`Solicitação de ${nomeUser(user)} foi rejeitada. O motivo foi registrado.`);
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

  const limparFiltros = () => {
    setBusca('');
    setFiltroStatus('pendente');
    setFiltroArea('todas');
  };

  const filtrosAtivos = busca || filtroStatus !== 'pendente' || filtroArea !== 'todas';
  const acaoTitulo = { aprovar: 'Aprovar tutor', rejeitar: 'Rejeitar tutor' };
  const acaoLabel = { aprovar: 'Confirmar aprovação', rejeitar: 'Confirmar recusa' };

  return (
    <>
      <Helmet>
        <title>Aprovação de Tutores | Administração Conexão Batista</title>
        <meta name="description" content="Aprovação de solicitações de usuários que desejam ser tutores na plataforma de cursos." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Administração · Tutores</p>
          <h1 className="font-display text-3xl font-bold text-primary">Aprovação de Tutores</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Aprove ou recuse solicitações de membros que desejam atuar como <strong>tutores</strong> na plataforma de cursos.
            Ao aprovar, o usuário poderá publicar e ministrar cursos.
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
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="pendente">Pendentes</option>
                <option value="aprovado">Aprovados</option>
                <option value="rejeitado">Rejeitados</option>
                <option value="todos">Todos os status</option>
              </select>
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="col-span-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:col-span-1"
              >
                <option value="todas">Todas as áreas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
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
              <Loader2 size={20} className="animate-spin" /> Carregando solicitações de tutores…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <GraduationCap size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">
                {filtrosAtivos
                  ? 'Nenhuma solicitação encontrada com esses filtros.'
                  : 'Nenhuma solicitação de tutor pendente.'}
              </p>
            </div>
          ) : (
            <>
              {/* Tabela desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-bold">Tutor</th>
                      <th className="px-4 py-3 font-bold">Áreas</th>
                      <th className="px-4 py-3 font-bold">Data solicitação</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((u) => {
                      const st = STATUS_INFO[u.mentor_status] || STATUS_INFO.pendente;
                      const StIcon = st.icon;
                      const userAreas = parseJson(u.mentor_areas);
                      const nomesAreas = userAreas.map((a) => (typeof a === 'string' ? a : a?.nome || a?.id || '—'));
                      return (
                        <tr key={u.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{nomeUser(u)}</div>
                            <div className="text-xs text-muted-foreground">{u.email || '—'}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {nomesAreas.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {nomesAreas.slice(0, 3).map((n, i) => (
                                  <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{n}</span>
                                ))}
                                {nomesAreas.length > 3 && <span className="text-xs">+{nomesAreas.length - 3}</span>}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatarData(u.mentor_data_solicitacao || u.created)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                              <StIcon size={13} strokeWidth={2} /> {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button type="button" onClick={() => setDetalhe(u)}
                                className="rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/5">
                                Detalhes
                              </button>
                              {u.mentor_status === 'pendente' && (
                                <>
                                  <button type="button" onClick={() => abrirAcao('aprovar', u)}
                                    className="rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100">
                                    Aprovar
                                  </button>
                                  <button type="button" onClick={() => abrirAcao('rejeitar', u)}
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
                {items.map((u) => {
                  const st = STATUS_INFO[u.mentor_status] || STATUS_INFO.pendente;
                  const StIcon = st.icon;
                  const userAreas = parseJson(u.mentor_areas);
                  const nomesAreas = userAreas.map((a) => (typeof a === 'string' ? a : a?.nome || a?.id || '—'));
                  return (
                    <div key={u.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{nomeUser(u)}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email || '—'}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                          <StIcon size={13} strokeWidth={2} /> {st.label}
                        </span>
                      </div>
                      {nomesAreas.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {nomesAreas.map((n, i) => (
                            <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{n}</span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">Solicitado em {formatarData(u.mentor_data_solicitacao || u.created)}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => setDetalhe(u)}
                          className="flex-1 rounded-lg border border-primary/30 px-2.5 py-2 text-xs font-bold text-primary hover:bg-primary/5">
                          Detalhes
                        </button>
                        {u.mentor_status === 'pendente' && (
                          <>
                            <button type="button" onClick={() => abrirAcao('aprovar', u)}
                              className="flex-1 rounded-lg border border-green-300 bg-green-50 px-2.5 py-2 text-xs font-bold text-green-700 hover:bg-green-100">
                              Aprovar
                            </button>
                            <button type="button" onClick={() => abrirAcao('rejeitar', u)}
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
        {!loading && items.length > 0 && !busca && filtroArea === 'todas' && (
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
            <DialogTitle className="font-display text-lg font-bold text-primary">Detalhes do tutor</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <DetalhesTutor user={detalhe} onAcao={abrirAcao} adminId={adminId} responsavelNome={responsavelNome} />
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
                <p className="text-xs text-muted-foreground">{acaoAtual.user.email}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {acaoAtual.tipo === 'aprovar'
                  ? 'Confirmar a aprovação deste tutor? Ele poderá publicar e ministrar cursos na plataforma.'
                  : 'Rejeitar esta solicitação? A justificativa abaixo é opcional e será registrada.'}
              </p>
              {acaoAtual.tipo === 'rejeitar' && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Justificativa (opcional)</label>
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
                  disabled={salvando}
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

function DetalhesTutor({ user, onAcao, adminId, responsavelNome }) {
  const st = STATUS_INFO[user.mentor_status] || STATUS_INFO.pendente;
  const StIcon = st.icon;
  const userAreas = parseJson(user.mentor_areas);
  const userCursos = parseJson(user.mentor_cursos_publicados);
  const nomesAreas = userAreas.map((a) => (typeof a === 'string' ? a : a?.nome || a?.id || '—'));
  const nomesCursos = userCursos.map((c) => (typeof c === 'string' ? c : c?.titulo || c?.nome || '—'));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
          {(nomeUser(user) || '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-display text-lg font-bold text-foreground">{nomeUser(user)}</p>
          <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
            <StIcon size={13} strokeWidth={2} /> {st.label}
          </span>
        </div>
      </div>

      <dl className="divide-y divide-border rounded-xl border border-border">
        <DetalheRow icon={UserCircle} label="E-mail" value={user.email} />
        <DetalheRow icon={UserCircle} label="WhatsApp" value={user.whatsapp} />
        <DetalheRow icon={UserCircle} label="Cidade" value={user.cidade} />
        <DetalheRow icon={Calendar} label="Data da solicitação" value={formatarData(user.mentor_data_solicitacao || user.created)} />
        {user.mentor_data_aprovacao && (
          <DetalheRow icon={Calendar} label="Data da decisão" value={formatarData(user.mentor_data_aprovacao)} />
        )}
      </dl>

      {/* Áreas de expertise */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
          <BookOpen size={16} /> Áreas de expertise
        </p>
        {nomesAreas.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {nomesAreas.map((n, i) => (
              <span key={i} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{n}</span>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground">Não informadas.</p>}
      </div>

      {/* Cursos que pode ministrar */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
          <GraduationCap size={16} /> Cursos que pode ministrar
        </p>
        {nomesCursos.length > 0 ? (
          <ul className="space-y-1 text-xs text-foreground">
            {nomesCursos.map((c, i) => <li key={i} className="rounded bg-white px-2 py-1.5">{c}</li>)}
          </ul>
        ) : <p className="text-xs text-muted-foreground">Não informados.</p>}
      </div>

      {/* Mini-biografia */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
          <FileText size={16} /> Mini-biografia
        </p>
        {user.mentor_biografia
          ? <p className="text-xs leading-relaxed text-foreground">{user.mentor_biografia}</p>
          : <p className="text-xs text-muted-foreground">Não informada.</p>}
      </div>

      {user.mentor_motivo_rejeicao && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <strong>Motivo da recusa:</strong> {user.mentor_motivo_rejeicao}
        </div>
      )}

      {/* Botões de ação — apenas pendentes */}
      {user.mentor_status === 'pendente' && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => onAcao('aprovar', user)}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:bg-green-700">
            <CheckCircle2 size={16} className="mr-1.5 inline" /> Aprovar
          </button>
          <button type="button" onClick={() => onAcao('rejeitar', user)}
            className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:bg-destructive/90">
            <XCircle size={16} className="mr-1.5 inline" /> Rejeitar
          </button>
        </div>
      )}

      {user.mentor_status !== 'pendente' && (
        <Link to={`/adm/membros/${user.id}`}
          className="block rounded-lg border border-primary/30 px-4 py-2.5 text-center text-sm font-bold text-primary hover:bg-primary/5">
          Ver membro
        </Link>
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
