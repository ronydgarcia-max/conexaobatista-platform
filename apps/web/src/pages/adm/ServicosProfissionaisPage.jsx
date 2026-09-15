import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Briefcase,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  History,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

const PER_PAGE = 12;

const STATUS_APROVACAO = {
  aguardando_analise: {
    label: 'Aguardando análise',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/40',
  },
  aprovado: {
    label: 'Aprovado',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  nao_aprovado: {
    label: 'Não aprovado',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  suspenso: {
    label: 'Suspenso',
    icon: PauseCircle,
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const inputClass =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground';

function formatarData(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return iso;
  }
}

function formatarDataCurta(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch (_) {
    return iso;
  }
}

export default function ServicosProfissionaisPage() {
  const { admin } = useAdminAuth();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Modal de detalhes
  const [detalhe, setDetalhe] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregandoHist, setCarregandoHist] = useState(false);

  // Modal de ação (não aprovar / suspender)
  const [modalAcao, setModalAcao] = useState(null); // { servico, statusNovo, titulo, motivo }
  const [salvandoAcao, setSalvandoAcao] = useState(false);
  const [erroAcao, setErroAcao] = useState('');

  const [processandoId, setProcessandoId] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const filtros = [];
      if (filtroStatus !== 'todos') {
        filtros.push(pb.filter('status_aprovacao = {:status}', { status: filtroStatus }));
      }
      const termo = busca.trim();
      if (termo) {
        filtros.push(
          pb.filter(
            '(profissao ~ {:q} || cidade ~ {:q} || estado ~ {:q})',
            { q: termo },
          ),
        );
      }
      const result = await pb.collection('servicos_profissionais').getList(pagina, PER_PAGE, {
        filter: filtros.length ? filtros.join(' && ') : '',
        sort: '-data_cadastro',
        expand: 'usuario_id,profissoes_ids',
      });
      setItems(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (e) {
      setErro('Não foi possível carregar a lista de serviços profissionais.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPagina(1);
  }, [busca, filtroStatus]);

  const nomeUsuario = (s) => s?.expand?.usuario_id?.name || s?.expand?.usuario_id?.email || '—';
  const emailUsuario = (s) => s?.expand?.usuario_id?.email || '—';

  const abrirDetalhe = async (s) => {
    setDetalhe(s);
    setHistorico([]);
    setCarregandoHist(true);
    try {
      const lista = await pb.collection('acoes_servicos_profissionais').getFullList({
        filter: pb.filter('servico_id = {:id}', { id: s.id }),
        sort: '-data_acao',
        expand: 'usuario_admin_id',
      });
      setHistorico(lista);
    } catch (e) {
      setHistorico([]);
    } finally {
      setCarregandoHist(false);
    }
  };

  const registrarAcao = async (servico, statusNovo, justificativa) => {
    const adminId = admin?.id;
    const dataAcao = new Date().toISOString();
    try {
      await pb.collection('acoes_servicos_profissionais').create({
        servico_id: servico.id,
        usuario_admin_id: adminId,
        data_acao: dataAcao,
        status_anterior: servico.status_aprovacao || '',
        status_novo: statusNovo,
        justificativa: justificativa || '',
      });
    } catch (e) {
      // Falha no registro de auditoria não deve impedir a ação, mas avisamos.
      console.error('Falha ao registrar ação de auditoria', e);
    }
  };

  const aprovar = async (servico) => {
    setProcessandoId(servico.id);
    setErro('');
    setSucesso('');
    try {
      const rec = await pb.collection('servicos_profissionais').update(servico.id, {
        status_aprovacao: 'aprovado',
      });
      await registrarAcao(servico, 'aprovado', '');
      setItems((prev) => prev.map((it) => (it.id === rec.id ? { ...it, ...rec, expand: it.expand } : it)));
      setDetalhe((d) => (d && d.id === rec.id ? { ...d, ...rec, expand: d.expand } : d));
      setSucesso(`Serviço "${servico.profissao}" aprovado. Agora pode aparecer publicamente.`);
    } catch (e) {
      setErro(e?.response?.message || 'Não foi possível aprovar o serviço agora.');
    } finally {
      setProcessandoId(null);
    }
  };

  const abrirModalAcao = (servico, statusNovo) => {
    setErroAcao('');
    const titulo =
      statusNovo === 'nao_aprovado' ? 'Não aprovar serviço' : 'Suspender serviço';
    setModalAcao({ servico, statusNovo, titulo, motivo: '' });
  };

  const confirmarAcao = async (e) => {
    e.preventDefault();
    if (!modalAcao) return;
    if (!modalAcao.motivo.trim()) {
      setErroAcao('Informe o motivo (obrigatório).');
      return;
    }
    setSalvandoAcao(true);
    setErroAcao('');
    try {
      const { servico, statusNovo, motivo } = modalAcao;
      const rec = await pb.collection('servicos_profissionais').update(servico.id, {
        status_aprovacao: statusNovo,
      });
      await registrarAcao(servico, statusNovo, motivo.trim());
      setItems((prev) => prev.map((it) => (it.id === rec.id ? { ...it, ...rec, expand: it.expand } : it)));
      setDetalhe((d) => (d && d.id === rec.id ? { ...d, ...rec, expand: d.expand } : d));
      setModalAcao(null);
      setSucesso(
        statusNovo === 'nao_aprovado'
          ? `Serviço "${servico.profissao}" marcado como não aprovado.`
          : `Serviço "${servico.profissao}" suspenso.`,
      );
    } catch (e) {
      setErroAcao(e?.response?.message || 'Não foi possível realizar a ação agora.');
    } finally {
      setSalvandoAcao(false);
    }
  };

  const botoesAcao = (servico) => {
    const st = servico.status_aprovacao;
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => abrirDetalhe(servico)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <Eye size={13} /> Detalhes
        </button>
        {st !== 'aprovado' && (
          <button
            type="button"
            onClick={() => aprovar(servico)}
            disabled={processandoId === servico.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
          >
            {processandoId === servico.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Aprovar
          </button>
        )}
        {st !== 'nao_aprovado' && (
          <button
            type="button"
            onClick={() => abrirModalAcao(servico, 'nao_aprovado')}
            disabled={processandoId === servico.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
          >
            <XCircle size={13} /> Não aprovar
          </button>
        )}
        {st !== 'suspenso' && (
          <button
            type="button"
            onClick={() => abrirModalAcao(servico, 'suspenso')}
            disabled={processandoId === servico.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            <PauseCircle size={13} /> Suspender
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Serviços Profissionais | Administração Conexão Batista</title>
        <meta name="description" content="Gerenciamento de cadastros de serviços profissionais." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Administração</p>
          <h1 className="font-display text-3xl font-bold text-primary">Serviços Profissionais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalItems} serviço(s) cadastrado(s)
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock size={12} /> Apenas serviços aprovados aparecem publicamente
            </span>
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por profissão, cidade ou estado"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os status</option>
            <option value="aguardando_analise">Aguardando análise</option>
            <option value="aprovado">Aprovado</option>
            <option value="nao_aprovado">Não aprovado</option>
            <option value="suspenso">Suspenso</option>
          </select>
        </div>

        {erro && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}
        {sucesso && !erro && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{sucesso}</span>
          </div>
        )}

        {/* Tabela */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" /> Carregando serviços…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Briefcase size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">
                Nenhum serviço encontrado com esses filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Profissão</th>
                    <th className="hidden px-4 py-3 font-bold md:table-cell">Usuário</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Cidade/UF</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="hidden px-4 py-3 font-bold lg:table-cell">Cadastro</th>
                    <th className="px-4 py-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((s) => {
                    const st = STATUS_APROVACAO[s.status_aprovacao] || STATUS_APROVACAO.aguardando_analise;
                    const StIcon = st.icon;
                    return (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{s.profissao || '—'}</div>
                          <div className="max-w-xs text-xs text-muted-foreground line-clamp-1">
                            {s.descricao_servicos || ''}
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          <div className="font-semibold text-foreground">{nomeUsuario(s)}</div>
                          <div className="text-xs">{emailUsuario(s)}</div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {s.cidade || '—'}{s.estado ? `/${s.estado}` : ''}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                            <StIcon size={12} /> {st.label}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                          {formatarDataCurta(s.data_cadastro)}
                        </td>
                        <td className="px-4 py-3 text-right">{botoesAcao(s)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {!loading && items.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Página {pagina} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}
                disabled={pagina >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal de detalhes */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                  <Briefcase size={18} />
                </span>
                <h3 className="font-display text-lg font-bold text-primary">Detalhes do serviço</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetalhe(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profissão</dt>
                <dd className="font-semibold text-foreground">{detalhe.profissao || '—'}</dd>
              </div>
              {detalhe.expand?.profissoes_ids && detalhe.expand.profissoes_ids.length > 0 && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profissões do catálogo</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {detalhe.expand.profissoes_ids.map((p) => (
                      <span key={p.id} className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                        {p.nome}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição dos serviços</dt>
                <dd className="whitespace-pre-wrap text-foreground">{detalhe.descricao_servicos || '—'}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuário</dt>
                  <dd className="font-semibold text-foreground">{nomeUsuario(detalhe)}</dd>
                  <dd className="text-xs text-muted-foreground">{emailUsuario(detalhe)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</dt>
                  <dd className="text-foreground">{detalhe.telefone_whatsapp || '—'}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cidade/UF</dt>
                  <dd className="text-foreground">{detalhe.cidade || '—'}{detalhe.estado ? `/${detalhe.estado}` : ''}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cadastro</dt>
                  <dd className="text-foreground">{formatarDataCurta(detalhe.data_cadastro)}</dd>
                </div>
              </div>
              {Array.isArray(detalhe.tipos_atendimento) && detalhe.tipos_atendimento.length > 0 && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipos de atendimento</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {detalhe.tipos_atendimento.map((t) => (
                      <span key={t} className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-semibold text-foreground">{t}</span>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status de aprovação</dt>
                <dd>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${(STATUS_APROVACAO[detalhe.status_aprovacao] || STATUS_APROVACAO.aguardando_analise).className}`}>
                    {(STATUS_APROVACAO[detalhe.status_aprovacao] || STATUS_APROVACAO.aguardando_analise).label}
                  </span>
                </dd>
              </div>
              {Array.isArray(detalhe.fotos) && detalhe.fotos.length > 0 && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fotos</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {detalhe.fotos.map((nome) => (
                      <img
                        key={nome}
                        src={pb.files.getURL(detalhe, nome, { thumb: '400x300' })}
                        alt="Foto do serviço"
                        className="h-20 w-28 rounded-lg border border-border object-cover"
                      />
                    ))}
                  </dd>
                </div>
              )}

              {/* Histórico de ações */}
              <div className="mt-2 rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <History size={14} /> Histórico de ações
                </div>
                {carregandoHist ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" /> Carregando…
                  </div>
                ) : historico.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma ação registrada.</p>
                ) : (
                  <ul className="space-y-2">
                    {historico.map((h) => {
                      const novo = STATUS_APROVACAO[h.status_novo] || { label: h.status_novo, className: 'border-border bg-muted text-muted-foreground' };
                      return (
                        <li key={h.id} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${novo.className}`}>
                              {novo.label}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatarData(h.data_acao)}</span>
                          </div>
                          {h.justificativa && (
                            <p className="mt-1.5 text-foreground">{h.justificativa}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Por: {h.expand?.usuario_admin_id?.name || h.expand?.usuario_admin_id?.username || 'Administrador'}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {detalhe.status_aprovacao !== 'aprovado' && (
                <button
                  type="button"
                  onClick={() => aprovar(detalhe)}
                  disabled={processandoId === detalhe.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-100 disabled:opacity-60"
                >
                  {processandoId === detalhe.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Aprovar
                </button>
              )}
              {detalhe.status_aprovacao !== 'nao_aprovado' && (
                <button
                  type="button"
                  onClick={() => { setDetalhe(null); abrirModalAcao(detalhe, 'nao_aprovado'); }}
                  className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/5"
                >
                  <XCircle size={16} /> Não aprovar
                </button>
              )}
              {detalhe.status_aprovacao !== 'suspenso' && (
                <button
                  type="button"
                  onClick={() => { setDetalhe(null); abrirModalAcao(detalhe, 'suspenso'); }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted"
                >
                  <PauseCircle size={16} /> Suspender
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de ação (não aprovar / suspender) */}
      {modalAcao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  {modalAcao.statusNovo === 'suspenso' ? <PauseCircle size={18} /> : <XCircle size={18} />}
                </span>
                <h3 className="font-display text-lg font-bold text-primary">{modalAcao.titulo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAcao(null)}
                disabled={salvandoAcao}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Você está alterando o serviço <strong className="text-foreground">{modalAcao.servico.profissao}</strong>.
              Informe o motivo — ele será registrado com usuário, data, status e justificativa.
            </p>

            <form onSubmit={confirmarAcao} className="space-y-4">
              <div>
                <label className={labelClass}>Motivo *</label>
                <textarea
                  rows={4}
                  className={inputClass}
                  placeholder="Ex.: Informações inconsistentes, documentação pendente…"
                  value={modalAcao.motivo}
                  onChange={(e) => setModalAcao((prev) => (prev ? { ...prev, motivo: e.target.value } : prev))}
                  required
                />
              </div>

              {erroAcao && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{erroAcao}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAcao(null)}
                  disabled={salvandoAcao}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAcao}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-6 py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
                >
                  {salvandoAcao ? <Loader2 size={16} className="animate-spin" /> : (modalAcao.statusNovo === 'suspenso' ? <PauseCircle size={16} /> : <XCircle size={16} />)}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
