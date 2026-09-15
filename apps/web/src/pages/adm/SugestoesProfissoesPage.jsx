import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  X,
  Send,
  Mail,
  Eye,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

const inputClass =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted/50 disabled:text-muted-foreground';
const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground';

const STATUS_INFO = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/40',
  },
  aceita: {
    label: 'Aceita',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  recusada: {
    label: 'Recusada',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

const STATUS_EMAIL_INFO = {
  nao_enviado: { label: 'Não enviado', className: 'border-border bg-muted text-muted-foreground' },
  enviado: { label: 'Enviado', className: 'border-green-300 bg-green-50 text-green-700' },
  erro: { label: 'Erro no envio', className: 'border-red-300 bg-red-50 text-red-700' },
};

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

export default function SugestoesProfissoesPage() {
  const [sugestoes, setSugestoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLoad, setErroLoad] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Modal de detalhes
  const [detalhe, setDetalhe] = useState(null); // record | null

  // Modal de recusa
  const [modalRecusa, setModalRecusa] = useState(null); // null | { id, motivo }
  const [salvandoRecusa, setSalvandoRecusa] = useState(false);
  const [erroRecusa, setErroRecusa] = useState('');

  // Ações
  const [processandoId, setProcessandoId] = useState(null);
  const [enviandoEmailId, setEnviandoEmailId] = useState(null);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroLoad('');
    try {
      const lista = await pb
        .collection('sugestoes_profissoes')
        .getFullList({ sort: '-created', expand: 'usuario_id,categoria_relacionada' });
      setSugestoes(lista);
    } catch (e) {
      setErroLoad('Não foi possível carregar as sugestões.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const recarregarUm = (rec) => {
    setSugestoes((prev) => {
      const resto = prev.filter((s) => s.id !== rec.id);
      return [rec, ...resto].sort((a, b) => (a.created < b.created ? 1 : -1));
    });
    setDetalhe((d) => (d && d.id === rec.id ? rec : d));
  };

  // Aceitar: cria categoria/profissão automaticamente e marca status=aceita.
  const aceitar = async (sug) => {
    setProcessandoId(sug.id);
    setErro('');
    setSucesso('');
    try {
      if (sug.tipo === 'categoria') {
        // Cria a categoria (ativa).
        await pb.collection('categorias_profissionais').create({
          nome: sug.nome,
          descricao: sug.descricao || '',
          ativo: true,
        });
      } else {
        // Cria a profissão vinculada à categoria relacionada (ativa).
        const catId = sug.categoria_relacionada;
        if (!catId) {
          throw new Error('Sugestão de profissão sem categoria relacionada.');
        }
        await pb.collection('profissoes').create({
          nome: sug.nome,
          categoria_id: catId,
          descricao: sug.descricao || '',
          ativo: true,
        });
      }
      const rec = await pb
        .collection('sugestoes_profissoes')
        .update(sug.id, { status: 'aceita', motivo_recusa: '' });
      recarregarUm(rec);
      setSucesso(
        sug.tipo === 'categoria'
          ? `Categoria "${sug.nome}" criada e ativada com sucesso.`
          : `Profissão "${sug.nome}" criada e ativada com sucesso.`,
      );
    } catch (e) {
      setErro(
        e?.response?.message ||
          e?.message ||
          'Não foi possível aceitar a sugestão agora. Tente novamente.',
      );
    } finally {
      setProcessandoId(null);
    }
  };

  // Recusar: abre modal para informar motivo.
  const abrirRecusa = (sug) => {
    setErroRecusa('');
    setModalRecusa({ id: sug.id, nome: sug.nome, motivo: '' });
  };

  const confirmarRecusa = async (e) => {
    e.preventDefault();
    if (!modalRecusa) return;
    if (!modalRecusa.motivo.trim()) {
      setErroRecusa('Informe o motivo da recusa.');
      return;
    }
    setSalvandoRecusa(true);
    setErroRecusa('');
    try {
      const rec = await pb
        .collection('sugestoes_profissoes')
        .update(modalRecusa.id, {
          status: 'recusada',
          motivo_recusa: modalRecusa.motivo.trim(),
        });
      recarregarUm(rec);
      setModalRecusa(null);
      setSucesso('Sugestão recusada. Você pode enviar o e-mail ao usuário.');
    } catch (e) {
      setErroRecusa(
        e?.response?.message ||
          'Não foi possível recusar a sugestão agora. Tente novamente.',
      );
    } finally {
      setSalvandoRecusa(false);
    }
  };

  // Enviar e-mail ao usuário (rota customizada no PocketBase).
  const enviarEmail = async (sug) => {
    setEnviandoEmailId(sug.id);
    setErro('');
    setSucesso('');
    try {
      const res = await pb.send(
        `/api/sugestoes-profissoes/${sug.id}/enviar-email`,
        { method: 'POST' },
      );
      // Recarrega o registro atualizado pela rota.
      const rec = await pb
        .collection('sugestoes_profissoes')
        .getOne(sug.id, { expand: 'usuario_id,categoria_relacionada' });
      recarregarUm(rec);
      if (res?.status === 'enviado') {
        setSucesso('E-mail enviado ao usuário com sucesso.');
      } else {
        setErro('O e-mail não pôde ser enviado agora. Tente novamente.');
      }
    } catch (e) {
      setErro(
        e?.response?.message ||
          e?.message ||
          'Não foi possível enviar o e-mail agora. Tente novamente.',
      );
    } finally {
      setEnviandoEmailId(null);
    }
  };

  const listaFiltrada =
    filtroStatus === 'todos'
      ? sugestoes
      : sugestoes.filter((s) => s.status === filtroStatus);

  const nomeUsuario = (s) =>
    s?.expand?.usuario_id?.name || s?.expand?.usuario_id?.email || '—';
  const emailUsuario = (s) => s?.expand?.usuario_id?.email || '—';
  const nomeCategoria = (s) =>
    s?.expand?.categoria_relacionada?.nome || '—';

  return (
    <>
      <Helmet>
        <title>Sugestões de Categorias e Profissões | Administração Conexão Batista</title>
        <meta
          name="description"
          content="Análise de sugestões de categorias e profissões enviadas pelos usuários."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            Administração
          </p>
          <h1 className="font-display text-3xl font-bold text-primary">
            Sugestões de Categorias e Profissões
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analise as sugestões enviadas pelos usuários. Ao aceitar, a
            categoria/profissão é criada automaticamente no catálogo.
          </p>
        </div>

        {/* Filtro */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {[
            { value: 'todos', label: 'Todas' },
            { value: 'pendente', label: 'Pendentes' },
            { value: 'aceita', label: 'Aceitas' },
            { value: 'recusada', label: 'Recusadas' },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltroStatus(f.value)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                filtroStatus === f.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-white text-foreground hover:bg-muted'
              }`}
            >
              {f.label}
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {f.value === 'todos'
                  ? sugestoes.length
                  : sugestoes.filter((s) => s.status === f.value).length}
              </span>
            </button>
          ))}
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

        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {carregando ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" /> Carregando…
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Lightbulb size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">
                Nenhuma sugestão encontrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Tipo</th>
                    <th className="px-4 py-3 font-bold">Nome</th>
                    <th className="hidden px-4 py-3 font-bold md:table-cell">Usuário</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Data</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="hidden px-4 py-3 font-bold lg:table-cell">E-mail</th>
                    <th className="px-4 py-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listaFiltrada.map((s) => {
                    const st = STATUS_INFO[s.status] || STATUS_INFO.pendente;
                    const StIcon = st.icon;
                    const se =
                      STATUS_EMAIL_INFO[s.status_email] ||
                      STATUS_EMAIL_INFO.nao_enviado;
                    const analisada = s.status === 'aceita' || s.status === 'recusada';
                    return (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {s.tipo === 'categoria' ? 'Categoria' : 'Profissão'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {s.nome}
                          {s.tipo === 'profissao' && (
                            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                              Cat.: {nomeCategoria(s)}
                            </span>
                          )}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          {nomeUsuario(s)}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {formatarData(s.data_sugestao || s.created)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}
                          >
                            <StIcon size={12} /> {st.label}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${se.className}`}
                          >
                            {se.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDetalhe(s)}
                              title="Ver detalhes"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              <Eye size={13} /> Detalhes
                            </button>
                            {s.status === 'pendente' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => aceitar(s)}
                                  disabled={processandoId === s.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
                                >
                                  {processandoId === s.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={13} />
                                  )}
                                  Aceitar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => abrirRecusa(s)}
                                  disabled={processandoId === s.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
                                >
                                  <XCircle size={13} /> Recusar
                                </button>
                              </>
                            )}
                            {analisada && (
                              <button
                                type="button"
                                onClick={() => enviarEmail(s)}
                                disabled={enviandoEmailId === s.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                              >
                                {enviandoEmailId === s.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Mail size={13} />
                                )}
                                Enviar e-mail
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
          )}
        </div>
      </section>

      {/* Modal de detalhes */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                  <Lightbulb size={18} />
                </span>
                <h3 className="font-display text-lg font-bold text-primary">
                  Detalhes da sugestão
                </h3>
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
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</dt>
                <dd className="font-semibold text-foreground">
                  {detalhe.tipo === 'categoria' ? 'Nova categoria' : 'Nova profissão'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</dt>
                <dd className="font-semibold text-foreground">{detalhe.nome}</dd>
              </div>
              {detalhe.tipo === 'profissao' && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria relacionada</dt>
                  <dd className="font-semibold text-foreground">{nomeCategoria(detalhe)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</dt>
                <dd className="text-foreground">{detalhe.descricao || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuário</dt>
                <dd className="text-foreground">
                  {nomeUsuario(detalhe)} <span className="text-muted-foreground">({emailUsuario(detalhe)})</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data da sugestão</dt>
                <dd className="text-foreground">{formatarData(detalhe.data_sugestao || detalhe.created)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</dt>
                <dd>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${(STATUS_INFO[detalhe.status] || STATUS_INFO.pendente).className}`}
                  >
                    {(STATUS_INFO[detalhe.status] || STATUS_INFO.pendente).label}
                  </span>
                </dd>
              </div>
              {detalhe.status === 'recusada' && detalhe.motivo_recusa && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-destructive">Motivo da recusa</dt>
                  <dd className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-foreground">
                    {detalhe.motivo_recusa}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</dt>
                <dd className="text-foreground">
                  {(STATUS_EMAIL_INFO[detalhe.status_email] || STATUS_EMAIL_INFO.nao_enviado).label}
                  {detalhe.data_email_enviado ? ` · ${formatarData(detalhe.data_email_enviado)}` : ''}
                </dd>
              </div>
            </dl>

            {detalhe.status === 'pendente' && (
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { aceitar(detalhe); }}
                  disabled={processandoId === detalhe.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-100 disabled:opacity-60"
                >
                  {processandoId === detalhe.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Aceitar
                </button>
                <button
                  type="button"
                  onClick={() => { setDetalhe(null); abrirRecusa(detalhe); }}
                  className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/5"
                >
                  <XCircle size={16} /> Recusar
                </button>
              </div>
            )}
            {(detalhe.status === 'aceita' || detalhe.status === 'recusada') && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => enviarEmail(detalhe)}
                  disabled={enviandoEmailId === detalhe.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {enviandoEmailId === detalhe.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Enviar e-mail ao usuário
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de recusa */}
      {modalRecusa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <XCircle size={18} />
                </span>
                <h3 className="font-display text-lg font-bold text-primary">
                  Recusar sugestão
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRecusa(null)}
                disabled={salvandoRecusa}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Você está recusando a sugestão <strong className="text-foreground">{modalRecusa.nome}</strong>.
              Informe o motivo — ele será exibido e enviado ao usuário por e-mail.
            </p>

            <form onSubmit={confirmarRecusa} className="space-y-4">
              <div>
                <label className={labelClass}>Motivo da recusa *</label>
                <textarea
                  rows={4}
                  className={inputClass}
                  placeholder="Ex.: A categoria já existe no catálogo com outro nome…"
                  value={modalRecusa.motivo}
                  onChange={(e) =>
                    setModalRecusa((prev) =>
                      prev ? { ...prev, motivo: e.target.value } : prev,
                    )
                  }
                  required
                />
              </div>

              {erroRecusa && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{erroRecusa}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRecusa(null)}
                  disabled={salvandoRecusa}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoRecusa}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-6 py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
                >
                  {salvandoRecusa ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Confirmar recusa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
