import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Building2,
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
  Globe,
  EyeOff,
  Save,
  Trash2,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

const PER_PAGE = 12;

const STATUS_APROVACAO = {
  aguardando_aprovacao: { label: 'Aguardando aprovação', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
  aprovado: { label: 'Aprovado', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
  nao_aprovado: { label: 'Não aprovado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  suspenso: { label: 'Suspenso', icon: PauseCircle, className: 'bg-muted text-muted-foreground border-border' },
  reprovado: { label: 'Reprovado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const VISIBILIDADE = {
  publico: { label: 'Público', icon: Globe, className: 'bg-green-100 text-green-700 border-green-300' },
  privado: { label: 'Privado', icon: Lock, className: 'bg-muted text-muted-foreground border-border' },
  oculto: { label: 'Oculto', icon: EyeOff, className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const inputClass =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground';

function formatarData(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (_) { return iso; }
}

function formatarCnpj(v) {
  const d = (v || '').replace(/\D/g, '');
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export default function EmpresasPage() {
  const { admin } = useAdminAuth();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroVisibilidade, setFiltroVisibilidade] = useState('todas');
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [detalhe, setDetalhe] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [carregandoHist, setCarregandoHist] = useState(false);

  const [modalAcao, setModalAcao] = useState(null);
  const [salvandoAcao, setSalvandoAcao] = useState(false);
  const [erroAcao, setErroAcao] = useState('');
  const [processandoId, setProcessandoId] = useState(null);

  // Modal Excluir cadastro
  const [modalExcluir, setModalExcluir] = useState(null);
  const [confirmaExcluir, setConfirmaExcluir] = useState(false);
  const [motivoExcluir, setMotivoExcluir] = useState('');
  const [salvandoExcluir, setSalvandoExcluir] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      // Lista apenas cadastros de empresa (tipo = "empresa" ou sem tipo —
      // registros anteriores à inclusão do campo).
      const filtros = ["(tipo = 'empresa' || tipo = '')"];
      if (filtroStatus !== 'todos') {
        filtros.push(pb.filter('status_aprovacao = {:status}', { status: filtroStatus }));
      }
      if (filtroVisibilidade !== 'todas') {
        filtros.push(pb.filter('visibilidade = {:vis}', { vis: filtroVisibilidade }));
      }
      const termo = busca.trim();
      if (termo) {
        filtros.push(
          pb.filter(
            '(razao_social ~ {:q} || nome_fantasia ~ {:q} || cnpj ~ {:q} || cidade ~ {:q} || estado ~ {:q})',
            { q: termo },
          ),
        );
      }
      const result = await pb.collection('empresas').getList(pagina, PER_PAGE, {
        filter: filtros.join(' && '),
        sort: '-data_cadastro',
        expand: 'usuario_id',
      });
      setItems(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (e) {
      setErro('Não foi possível carregar a lista de empresas.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, filtroVisibilidade, pagina]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [busca, filtroStatus, filtroVisibilidade]);

  const nomeUsuario = (s) => s?.expand?.usuario_id?.name || s?.expand?.usuario_id?.email || '—';
  const emailUsuario = (s) => s?.expand?.usuario_id?.email || '—';

  const abrirDetalhe = async (s) => {
    setDetalhe(s);
    setEditando(false);
    setFormEdit({
      razao_social: s.razao_social || '',
      nome_fantasia: s.nome_fantasia || '',
      cidade: s.cidade || '',
      estado: s.estado || '',
      telefone: s.telefone || '',
      email: s.email || '',
      website: s.website || '',
      descricao: s.descricao || '',
      ramo_atividade: s.ramo_atividade || '',
      visibilidade: s.visibilidade || 'privado',
    });
    setHistorico([]);
    setCarregandoHist(true);
    try {
      const lista = await pb.collection('acoes_empresas').getFullList({
        filter: pb.filter('empresa_id = {:id}', { id: s.id }),
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

  const registrarAcao = async (empresa, statusNovo, justificativa) => {
    try {
      await pb.collection('acoes_empresas').create({
        empresa_id: empresa.id,
        usuario_admin_id: admin?.id,
        data_acao: new Date().toISOString(),
        status_anterior: empresa.status_aprovacao || '',
        status_novo: statusNovo,
        justificativa: justificativa || '',
      });
    } catch (e) {
      console.error('Falha ao registrar ação de auditoria', e);
    }
  };

  const aprovar = async (empresa) => {
    setProcessandoId(empresa.id);
    setErro(''); setSucesso('');
    try {
      const rec = await pb.collection('empresas').update(empresa.id, { status_aprovacao: 'aprovado' });
      await registrarAcao(empresa, 'aprovado', '');
      setItems((prev) => prev.map((it) => (it.id === rec.id ? { ...it, ...rec, expand: it.expand } : it)));
      setDetalhe((d) => (d && d.id === rec.id ? { ...d, ...rec, expand: d.expand } : d));
      setSucesso(`Empresa "${empresa.razao_social || empresa.nome_fantasia}" aprovada.`);
    } catch (e) {
      setErro(e?.response?.message || 'Não foi possível aprovar a empresa agora.');
    } finally {
      setProcessandoId(null);
    }
  };

  const abrirModalAcao = (empresa, statusNovo) => {
    setErroAcao('');
    setModalAcao({ empresa, statusNovo, titulo: statusNovo === 'nao_aprovado' ? 'Não aprovar empresa' : 'Suspender empresa', motivo: '' });
  };

  const confirmarAcao = async (e) => {
    e.preventDefault();
    if (!modalAcao) return;
    if (!modalAcao.motivo.trim()) { setErroAcao('Informe o motivo (obrigatório).'); return; }
    setSalvandoAcao(true); setErroAcao('');
    try {
      const { empresa, statusNovo, motivo } = modalAcao;
      const rec = await pb.collection('empresas').update(empresa.id, { status_aprovacao: statusNovo });
      await registrarAcao(empresa, statusNovo, motivo.trim());
      setItems((prev) => prev.map((it) => (it.id === rec.id ? { ...it, ...rec, expand: it.expand } : it)));
      setDetalhe((d) => (d && d.id === rec.id ? { ...d, ...rec, expand: d.expand } : d));
      setModalAcao(null);
      setSucesso(statusNovo === 'nao_aprovado' ? `Empresa "${empresa.razao_social || empresa.nome_fantasia}" marcada como não aprovada.` : `Empresa "${empresa.razao_social || empresa.nome_fantasia}" suspensa.`);
    } catch (e) {
      setErroAcao(e?.response?.message || 'Não foi possível realizar a ação agora.');
    } finally {
      setSalvandoAcao(false);
    }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    if (!detalhe) return;
    setSalvandoEdicao(true);
    try {
      const rec = await pb.collection('empresas').update(detalhe.id, {
        razao_social: formEdit.razao_social,
        nome_fantasia: formEdit.nome_fantasia,
        cidade: formEdit.cidade,
        estado: formEdit.estado,
        telefone: formEdit.telefone,
        email: formEdit.email || null,
        website: formEdit.website || null,
        descricao: formEdit.descricao,
        ramo_atividade: formEdit.ramo_atividade,
        visibilidade: formEdit.visibilidade,
      });
      setItems((prev) => prev.map((it) => (it.id === rec.id ? { ...it, ...rec, expand: it.expand } : it)));
      setDetalhe({ ...detalhe, ...rec, expand: detalhe.expand });
      setEditando(false);
      setSucesso('Dados da empresa atualizados.');
    } catch (e) {
      setErro(e?.response?.message || 'Não foi possível salvar a edição.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // ---- Excluir cadastro ----
  const abrirModalExcluir = (empresa) => {
    setErroExcluir('');
    setConfirmaExcluir(false);
    setMotivoExcluir('');
    setModalExcluir(empresa);
  };

  const confirmarExcluir = async (e) => {
    e.preventDefault();
    if (!modalExcluir) return;
    if (!confirmaExcluir) {
      setErroExcluir('Marque a caixa confirmando que a exclusão é permanente.');
      return;
    }
    if (!motivoExcluir.trim()) {
      setErroExcluir('Informe o motivo da exclusão (obrigatório).');
      return;
    }
    setSalvandoExcluir(true);
    setErroExcluir('');
    try {
      await registrarAcao(modalExcluir, 'excluido', motivoExcluir.trim());
      await pb.collection('empresas').delete(modalExcluir.id);
      setItems((prev) => prev.filter((it) => it.id !== modalExcluir.id));
      setDetalhe((d) => (d && d.id === modalExcluir.id ? null : d));
      setSucesso(`Cadastro de "${modalExcluir.razao_social || modalExcluir.nome_fantasia}" excluído permanentemente.`);
      setModalExcluir(null);
    } catch (e) {
      setErroExcluir(e?.response?.message || 'Não foi possível excluir o cadastro agora.');
    } finally {
      setSalvandoExcluir(false);
    }
  };

  const botoesAcao = (empresa) => {
    const st = empresa.status_aprovacao;
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={() => abrirDetalhe(empresa)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
          <Eye size={13} /> Detalhes
        </button>
        {st !== 'aprovado' && (
          <button type="button" onClick={() => aprovar(empresa)} disabled={processandoId === empresa.id} className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60">
            {processandoId === empresa.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Aprovar
          </button>
        )}
        {st !== 'nao_aprovado' && (
          <button type="button" onClick={() => abrirModalAcao(empresa, 'nao_aprovado')} disabled={processandoId === empresa.id} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60">
            <XCircle size={13} /> Não aprovar
          </button>
        )}
        {st !== 'suspenso' && (
          <button type="button" onClick={() => abrirModalAcao(empresa, 'suspenso')} disabled={processandoId === empresa.id} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60">
            <PauseCircle size={13} /> Suspender
          </button>
        )}
        <button type="button" onClick={() => abrirModalExcluir(empresa)} disabled={processandoId === empresa.id} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60">
          <Trash2 size={13} /> Excluir
        </button>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Cadastro de Empresas | Administração Conexão Batista</title>
        <meta name="description" content="Gerenciamento de cadastros de empresas." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Administração</p>
          <h1 className="font-display text-3xl font-bold text-primary">Cadastro de Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalItems} empresa(s) cadastrada(s)
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock size={12} /> Apenas cadastros públicos aparecem nas áreas públicas
            </span>
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, CNPJ, cidade ou estado" className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="todos">Todos os status</option>
            <option value="aguardando_aprovacao">Aguardando aprovação</option>
            <option value="aprovado">Aprovado</option>
            <option value="nao_aprovado">Não aprovado</option>
            <option value="suspenso">Suspenso</option>
          </select>
          <select value={filtroVisibilidade} onChange={(e) => setFiltroVisibilidade(e.target.value)} className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option value="todas">Toda visibilidade</option>
            <option value="publico">Público</option>
            <option value="privado">Privado</option>
            <option value="oculto">Oculto</option>
          </select>
        </div>

        {erro && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{erro}</span>
          </div>
        )}
        {sucesso && !erro && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" /><span>{sucesso}</span>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" /> Carregando empresas…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Building2 size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhuma empresa encontrada com esses filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Empresa</th>
                    <th className="hidden px-4 py-3 font-bold md:table-cell">Responsável</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Cidade/UF</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="hidden px-4 py-3 font-bold lg:table-cell">Visibilidade</th>
                    <th className="px-4 py-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((s) => {
                    const st = STATUS_APROVACAO[s.status_aprovacao] || STATUS_APROVACAO.aguardando_aprovacao;
                    const StIcon = st.icon;
                    const vis = VISIBILIDADE[s.visibilidade] || VISIBILIDADE.privado;
                    const VisIcon = vis.icon;
                    return (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{s.razao_social || s.nome_fantasia || '—'}</div>
                          <div className="text-xs text-muted-foreground">{s.cnpj ? `CNPJ ${formatarCnpj(s.cnpj)}` : '—'}</div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          <div className="font-semibold text-foreground">{nomeUsuario(s)}</div>
                          <div className="text-xs">{emailUsuario(s)}</div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{s.cidade || '—'}{s.estado ? `/${s.estado}` : ''}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                            <StIcon size={12} /> {st.label}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${vis.className}`}>
                            <VisIcon size={12} /> {vis.label}
                          </span>
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

        {!loading && items.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Página {pagina} de {totalPages}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-semibold text-foreground disabled:opacity-40 hover:bg-muted">
                <ChevronLeft size={16} /> Anterior
              </button>
              <button type="button" onClick={() => setPagina((p) => Math.min(totalPages, p + 1))} disabled={pagina >= totalPages} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-semibold text-foreground disabled:opacity-40 hover:bg-muted">
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary"><Building2 size={18} /></span>
                <h3 className="font-display text-lg font-bold text-primary">Detalhes da empresa</h3>
              </div>
              <div className="flex items-center gap-2">
                {!editando && (
                  <button type="button" onClick={() => setEditando(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                    <Save size={13} /> Editar
                  </button>
                )}
                <button type="button" onClick={() => setDetalhe(null)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X size={18} /></button>
              </div>
            </div>

            {editando ? (
              <form onSubmit={salvarEdicao} className="space-y-4 text-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><label className={labelClass}>Razão social</label><input className={inputClass} value={formEdit.razao_social} onChange={(e) => setFormEdit((p) => ({ ...p, razao_social: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><label className={labelClass}>Nome fantasia</label><input className={inputClass} value={formEdit.nome_fantasia} onChange={(e) => setFormEdit((p) => ({ ...p, nome_fantasia: e.target.value }))} /></div>
                  <div><label className={labelClass}>Cidade</label><input className={inputClass} value={formEdit.cidade} onChange={(e) => setFormEdit((p) => ({ ...p, cidade: e.target.value }))} /></div>
                  <div><label className={labelClass}>Estado</label><input className={inputClass} value={formEdit.estado} onChange={(e) => setFormEdit((p) => ({ ...p, estado: e.target.value }))} /></div>
                  <div><label className={labelClass}>Telefone</label><input className={inputClass} value={formEdit.telefone} onChange={(e) => setFormEdit((p) => ({ ...p, telefone: e.target.value }))} /></div>
                  <div><label className={labelClass}>E-mail</label><input type="email" className={inputClass} value={formEdit.email} onChange={(e) => setFormEdit((p) => ({ ...p, email: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><label className={labelClass}>Website</label><input type="url" className={inputClass} value={formEdit.website} onChange={(e) => setFormEdit((p) => ({ ...p, website: e.target.value }))} /></div>
                  <div><label className={labelClass}>Ramo de atividade</label><input className={inputClass} value={formEdit.ramo_atividade} onChange={(e) => setFormEdit((p) => ({ ...p, ramo_atividade: e.target.value }))} /></div>
                  <div><label className={labelClass}>Visibilidade</label><select className={inputClass} value={formEdit.visibilidade} onChange={(e) => setFormEdit((p) => ({ ...p, visibilidade: e.target.value }))}><option value="publico">Público</option><option value="privado">Privado</option><option value="oculto">Oculto</option></select></div>
                  <div className="sm:col-span-2"><label className={labelClass}>Descrição</label><textarea rows={3} className={inputClass} value={formEdit.descricao} onChange={(e) => setFormEdit((p) => ({ ...p, descricao: e.target.value }))} /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditando(false)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40">Cancelar</button>
                  <button type="submit" disabled={salvandoEdicao} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{salvandoEdicao ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar</button>
                </div>
              </form>
            ) : (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Razão social / Nome fantasia</dt>
                  <dd className="font-semibold text-foreground">{detalhe.razao_social || '—'}</dd>
                  <dd className="text-muted-foreground">{detalhe.nome_fantasia || '—'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CNPJ</dt><dd className="text-foreground">{detalhe.cnpj ? formatarCnpj(detalhe.cnpj) : '—'}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Situação cadastral</dt><dd className="text-foreground">{detalhe.situacao_cadastral || '—'}</dd></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Responsável</dt><dd className="font-semibold text-foreground">{nomeUsuario(detalhe)}</dd><dd className="text-xs text-muted-foreground">{emailUsuario(detalhe)}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cidade/UF</dt><dd className="text-foreground">{detalhe.cidade || '—'}{detalhe.estado ? `/${detalhe.estado}` : ''}</dd></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone</dt><dd className="text-foreground">{detalhe.telefone || '—'}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</dt><dd className="text-foreground">{detalhe.email || '—'}</dd></div>
                </div>
                {detalhe.ramo_atividade && <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ramo de atividade</dt><dd className="text-foreground">{detalhe.ramo_atividade}</dd></div>}
                {detalhe.descricao && <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</dt><dd className="whitespace-pre-wrap text-foreground">{detalhe.descricao}</dd></div>}
                <div className="grid grid-cols-2 gap-3">
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status de aprovação</dt><dd><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${(STATUS_APROVACAO[detalhe.status_aprovacao] || STATUS_APROVACAO.aguardando_aprovacao).className}`}>{(STATUS_APROVACAO[detalhe.status_aprovacao] || STATUS_APROVACAO.aguardando_aprovacao).label}</span></dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visibilidade</dt><dd><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${(VISIBILIDADE[detalhe.visibilidade] || VISIBILIDADE.privado).className}`}>{(VISIBILIDADE[detalhe.visibilidade] || VISIBILIDADE.privado).label}</span></dd></div>
                </div>

                <div className="mt-2 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><History size={14} /> Histórico de ações</div>
                  {carregandoHist ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
                  ) : historico.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma ação registrada.</p>
                  ) : (
                    <ul className="space-y-2">
                      {historico.map((h) => {
                        const novo = STATUS_APROVACAO[h.status_novo] || { label: h.status_novo, className: 'border-border bg-muted text-muted-foreground' };
                        return (
                          <li key={h.id} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${novo.className}`}>{novo.label}</span>
                              <span className="text-xs text-muted-foreground">{formatarData(h.data_acao)}</span>
                            </div>
                            {h.justificativa && <p className="mt-1.5 text-foreground">{h.justificativa}</p>}
                            <p className="mt-1 text-xs text-muted-foreground">Por: {h.expand?.usuario_admin_id?.name || h.expand?.usuario_admin_id?.username || 'Administrador'}</p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </dl>
            )}

            {!editando && (
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                {detalhe.status_aprovacao !== 'aprovado' && (
                  <button type="button" onClick={() => aprovar(detalhe)} disabled={processandoId === detalhe.id} className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-100 disabled:opacity-60">
                    {processandoId === detalhe.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Aprovar
                  </button>
                )}
                {detalhe.status_aprovacao !== 'nao_aprovado' && (
                  <button type="button" onClick={() => { setDetalhe(null); abrirModalAcao(detalhe, 'nao_aprovado'); }} className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/5"><XCircle size={16} /> Não aprovar</button>
                )}
                {detalhe.status_aprovacao !== 'suspenso' && (
                  <button type="button" onClick={() => { setDetalhe(null); abrirModalAcao(detalhe, 'suspenso'); }} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted"><PauseCircle size={16} /> Suspender</button>
                )}
                <button type="button" onClick={() => { setDetalhe(null); abrirModalExcluir(detalhe); }} className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/5"><Trash2 size={16} /> Excluir cadastro</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Excluir cadastro */}
      {modalExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/10 text-destructive"><Trash2 size={18} /></span>
                <h3 className="font-display text-lg font-bold text-primary">Excluir cadastro</h3>
              </div>
              <button type="button" onClick={() => setModalExcluir(null)} disabled={salvandoExcluir} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"><X size={18} /></button>
            </div>
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <p className="font-bold">A exclusão é permanente e não pode ser desfeita.</p>
              <p className="mt-1">Você está prestes a excluir o cadastro de <strong>{modalExcluir.razao_social || modalExcluir.nome_fantasia}</strong>{modalExcluir.cnpj ? ` (CNPJ ${formatarCnpj(modalExcluir.cnpj)})` : ''}. Todos os dados vinculados serão removidos.</p>
            </div>
            <form onSubmit={confirmarExcluir} className="space-y-4">
              <div><label className={labelClass}>Motivo da exclusão *</label><textarea rows={3} className={inputClass} placeholder="Ex.: Cadastro duplicado, erro de preenchimento, solicitação…" value={motivoExcluir} onChange={(e) => setMotivoExcluir(e.target.value)} required /></div>
              <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input text-destructive" checked={confirmaExcluir} onChange={(e) => setConfirmaExcluir(e.target.checked)} />
                <span className="font-semibold leading-relaxed text-foreground">Confirmo que entendo que a exclusão é permanente e não pode ser desfeita, e desejo prosseguir.</span>
              </label>
              {erroExcluir && <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{erroExcluir}</span></div>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalExcluir(null)} disabled={salvandoExcluir} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={salvandoExcluir || !confirmaExcluir} className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-6 py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">{salvandoExcluir ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Excluir permanentemente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAcao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/10 text-destructive">{modalAcao.statusNovo === 'suspenso' ? <PauseCircle size={18} /> : <XCircle size={18} />}</span>
                <h3 className="font-display text-lg font-bold text-primary">{modalAcao.titulo}</h3>
              </div>
              <button type="button" onClick={() => setModalAcao(null)} disabled={salvandoAcao} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"><X size={18} /></button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Você está alterando a empresa <strong className="text-foreground">{modalAcao.empresa.razao_social || modalAcao.empresa.nome_fantasia}</strong>. Informe o motivo — ele será registrado com responsável, data, status e justificativa.</p>
            <form onSubmit={confirmarAcao} className="space-y-4">
              <div><label className={labelClass}>Motivo *</label><textarea rows={4} className={inputClass} placeholder="Ex.: Documentação pendente, informações inconsistentes…" value={modalAcao.motivo} onChange={(e) => setModalAcao((prev) => (prev ? { ...prev, motivo: e.target.value } : prev))} required /></div>
              {erroAcao && <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{erroAcao}</span></div>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalAcao(null)} disabled={salvandoAcao} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={salvandoAcao} className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-6 py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">{salvandoAcao ? <Loader2 size={16} className="animate-spin" /> : (modalAcao.statusNovo === 'suspenso' ? <PauseCircle size={16} /> : <XCircle size={16} />)} Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
