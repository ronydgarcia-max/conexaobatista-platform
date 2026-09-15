import React, { useCallback, useEffect, useState } from 'react';
import {
  Church, Plus, Pencil, Trash2, History, Loader2, ShieldCheck, ShieldOff,
  Check, AlertTriangle, Clock, PauseCircle, StopCircle, CheckCircle2,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const PAPEL_LABEL = {
  pastor: 'Pastor',
  secretario: 'Secretário',
  membro: 'Membro',
};

const STATUS_INFO = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
  ativo: { label: 'Ativo', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
  suspenso: { label: 'Suspenso', icon: PauseCircle, className: 'bg-amber-100 text-amber-700 border-amber-300' },
  encerrado: { label: 'Encerrado', icon: StopCircle, className: 'bg-muted text-muted-foreground border-border' },
};

function formatarData(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (_) { return iso; }
}

function nomeIgreja(rec) {
  if (!rec) return '—';
  return rec.razao_social || rec.nome_fantasia || rec.nome || 'Igreja sem nome';
}

export default function VinculosIgrejaSection({ userId }) {
  const { admin } = useAdminAuth();
  const responsavelNome = admin?.get?.('name') || admin?.name || admin?.get?.('username') || admin?.username || 'Administrador';

  const [vinculos, setVinculos] = useState([]);
  const [igrejas, setIgrejas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const [modalAdd, setModalAdd] = useState(false);
  const [editando, setEditando] = useState(null); // vinculo record
  const [removendo, setRemovendo] = useState(null); // vinculo record
  const [historico, setHistorico] = useState(null); // vinculo record whose history is open
  const [historicoItems, setHistoricoItems] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [vList, iList] = await Promise.all([
        pb.collection('vinculos_usuario_igreja').getFullList({
          filter: pb.filter('usuario_id = {:uid}', { uid: userId }),
          expand: 'igreja_id',
          sort: '-created',
        }),
        pb.collection('empresas').getFullList({
          filter: "tipo = 'igreja'",
          sort: 'razao_social,nome_fantasia',
        }),
      ]);
      setVinculos(vList);
      setIgrejas(iList);
    } catch (err) {
      setErro('Não foi possível carregar os vínculos.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { carregar(); }, [carregar]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 5000); };

  const registrarHistorico = async (vinculo, tipo, anterior, novo, motivo) => {
    try {
      await pb.collection('historico_vinculos').create({
        vinculo_id: vinculo.id,
        usuario_id: vinculo.usuario_id,
        igreja_id: Array.isArray(vinculo.igreja_id) ? vinculo.igreja_id[0] : vinculo.igreja_id,
        responsavel_nome: responsavelNome,
        tipo_acao: tipo,
        papel_anterior: anterior?.papel || '',
        papel_novo: novo?.papel || '',
        status_anterior: anterior?.status || '',
        status_novo: novo?.status || '',
        pode_aprovar_anterior: !!anterior?.pode_aprovar_membros,
        pode_aprovar_novo: !!novo?.pode_aprovar_membros,
        motivo: motivo || '',
        data_acao: new Date().toISOString().split('T')[0],
      });
    } catch (_) {}
  };

  const abrirHistorico = async (vinc) => {
    setHistorico(vinc);
    setLoadingHist(true);
    setHistoricoItems([]);
    try {
      const items = await pb.collection('historico_vinculos').getFullList({
        filter: pb.filter('vinculo_id = {:vid}', { vid: vinc.id }),
        sort: '-created',
      });
      setHistoricoItems(items);
    } catch (_) {
      setHistoricoItems([]);
    } finally {
      setLoadingHist(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary">
          <Church size={18} className="text-accent" /> Vínculos com Igrejas
        </h2>
        <button
          type="button"
          onClick={() => setModalAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:bg-primary/90"
        >
          <Plus size={16} /> Adicionar vínculo
        </button>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Seção separada dos dados pessoais. Um usuário pode ser vinculado a uma ou mais igrejas, com papel e status próprios.
        Vínculos de <strong>Pastor/Secretário</strong> pendentes também aparecem em{' '}
        <a href="/adm/aprovacao-vinculos" className="font-semibold text-primary hover:underline">Aprovação de Vínculos</a>{' '}
        (Fluxo 2) para ativação como aprovador.
      </p>

      {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{msg}</p>}
      {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" /> Carregando vínculos…
        </div>
      ) : vinculos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Church size={28} className="text-muted-foreground/50" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhum vínculo com igreja cadastrado.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {vinculos.map((v) => {
            const igreja = v.expand?.igreja_id;
            const ig = Array.isArray(igreja) ? igreja[0] : igreja;
            const st = STATUS_INFO[v.status] || STATUS_INFO.pendente;
            const StIcon = st.icon;
            return (
              <li key={v.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-foreground">{nomeIgreja(ig)}</p>
                    <p className="text-xs text-muted-foreground">
                      CNPJ: {ig?.cnpj || '—'} · {ig?.cidade || '—'}{ig?.estado ? `/${ig.estado}` : ''}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                    <StIcon size={13} strokeWidth={2} /> {st.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Papel: <strong className="text-foreground">{PAPEL_LABEL[v.papel] || v.papel}</strong></span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    {v.pode_aprovar_membros ? (
                      <><ShieldCheck size={15} className="text-green-600" /> <strong className="text-green-700">Pode aprovar membros</strong></>
                    ) : (
                      <><ShieldOff size={15} className="text-muted-foreground" /> <strong className="text-foreground">Não aprova membros</strong></>
                    )}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  <button type="button" onClick={() => setEditando(v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5">
                    <Pencil size={13} /> Editar
                  </button>
                  <button type="button" onClick={() => abrirHistorico(v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
                    <History size={13} /> Histórico
                  </button>
                  <button type="button" onClick={() => setRemovendo(v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10">
                    <Trash2 size={13} /> Remover
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal Adicionar */}
      {modalAdd && (
        <VinculoForm
          titulo="Adicionar vínculo"
          igrejas={igrejas}
          vinculosExistentes={vinculos}
          onCancel={() => setModalAdd(false)}
          onSubmit={async (dados) => {
            const rec = await pb.collection('vinculos_usuario_igreja').create({
              usuario_id: userId,
              igreja_id: dados.igreja_id,
              papel: dados.papel,
              status: dados.status,
              pode_aprovar_membros: dados.pode_aprovar_membros,
              responsavel_nome: responsavelNome,
              motivo_alteracao: dados.motivo || '',
            });
            await registrarHistorico(rec, 'criacao', null, {
              papel: dados.papel, status: dados.status, pode_aprovar_membros: dados.pode_aprovar_membros,
            }, dados.motivo);
            setModalAdd(false);
            flash('Vínculo adicionado com sucesso.');
            carregar();
          }}
        />
      )}

      {/* Modal Editar */}
      {editando && (
        <VinculoForm
          titulo="Editar vínculo"
          igrejas={igrejas}
          vinculosExistentes={vinculos.filter((v) => v.id !== editando.id)}
          vinculoInicial={editando}
          exigeMotivo
          onCancel={() => setEditando(null)}
          onSubmit={async (dados) => {
            await pb.collection('vinculos_usuario_igreja').update(editando.id, {
              papel: dados.papel,
              status: dados.status,
              pode_aprovar_membros: dados.pode_aprovar_membros,
              responsavel_nome: responsavelNome,
              motivo_alteracao: dados.motivo || '',
            });
            // O histórico da edição é registrado server-side pelo hook
            // vinculos_flow.pb.js (inclui status anterior/novo e motivo).
            setEditando(null);
            flash('Vínculo atualizado com sucesso.');
            carregar();
          }}
        />
      )}

      {/* Modal Remover */}
      {removendo && (
        <RemoverVinculoDialog
          vinculo={removendo}
          onCancel={() => setRemovendo(null)}
          onConfirm={async (motivo) => {
            const anterior = {
              papel: removendo.papel, status: removendo.status, pode_aprovar_membros: removendo.pode_aprovar_membros,
            };
            const igrejaId = Array.isArray(removendo.igreja_id) ? removendo.igreja_id[0] : removendo.igreja_id;
            // registra histórico de remoção antes de excluir o vínculo.
            // O cascadeDelete do campo vinculo_id foi removido, então o
            // histórico de auditoria (incluindo este registro de remoção)
            // é preservado após a exclusão do vínculo.
            await pb.collection('historico_vinculos').create({
              vinculo_id: removendo.id,
              usuario_id: userId,
              igreja_id: igrejaId,
              responsavel_nome: responsavelNome,
              tipo_acao: 'remocao',
              papel_anterior: anterior.papel,
              status_anterior: anterior.status,
              pode_aprovar_anterior: !!anterior.pode_aprovar_membros,
              motivo: motivo || '',
              data_acao: new Date().toISOString().split('T')[0],
            });
            await pb.collection('vinculos_usuario_igreja').delete(removendo.id);
            setRemovendo(null);
            flash('Vínculo removido permanentemente.');
            carregar();
          }}
        />
      )}

      {/* Modal Histórico */}
      <Dialog open={!!historico} onOpenChange={(v) => !v && setHistorico(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold text-primary">
              <History size={18} className="text-accent" /> Histórico do vínculo
            </DialogTitle>
          </DialogHeader>
          {loadingHist ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" /> Carregando…
            </div>
          ) : historicoItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
          ) : (
            <ol className="space-y-3">
              {historicoItems.map((h) => (
                <li key={h.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{tipoAcaoLabel(h.tipo_acao)}</span>
                    <span className="text-xs text-muted-foreground">{formatarData(h.created)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {(h.papel_anterior || h.papel_novo) && (
                      <HistDiff label="Papel" ant={PAPEL_LABEL[h.papel_anterior]} novo={PAPEL_LABEL[h.papel_novo]} />
                    )}
                    {(h.status_anterior || h.status_novo) && (
                      <HistDiff label="Status" ant={STATUS_INFO[h.status_anterior]?.label} novo={STATUS_INFO[h.status_novo]?.label} />
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {h.pode_aprovar_novo === true ? (
                      <span className="inline-flex items-center gap-1 text-green-700"><ShieldCheck size={13} /> Pode aprovar</span>
                    ) : h.pode_aprovar_novo === false ? (
                      <span className="inline-flex items-center gap-1"><ShieldOff size={13} /> Não aprova</span>
                    ) : null}
                  </div>
                  {h.motivo && <p className="mt-2 text-xs text-muted-foreground">Motivo: {h.motivo}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Responsável: {h.responsavel_nome || '—'}</p>
                </li>
              ))}
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function tipoAcaoLabel(t) {
  return { criacao: 'Criação do vínculo', edicao: 'Edição', remocao: 'Remoção' }[t] || t;
}

function HistDiff({ label, ant, novo }) {
  return (
    <div>
      <p className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-foreground">
        {ant || '—'} <span className="text-muted-foreground">→</span> <strong>{novo || '—'}</strong>
      </p>
    </div>
  );
}

const PAPEL_OPTIONS = [
  { value: 'pastor', label: 'Pastor' },
  { value: 'secretario', label: 'Secretário' },
  { value: 'membro', label: 'Membro' },
];

const STATUS_OPTIONS_ADD = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'ativo', label: 'Ativo' },
];

const STATUS_OPTIONS_EDIT = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'recusado', label: 'Recusado' },
];

function VinculoForm({ titulo, igrejas, vinculosExistentes, vinculoInicial, exigeMotivo, onCancel, onSubmit }) {
  const [igrejaId, setIgrejaId] = useState(
    vinculoInicial ? (Array.isArray(vinculoInicial.igreja_id) ? vinculoInicial.igreja_id[0] : vinculoInicial.igreja_id) : ''
  );
  const [papel, setPapel] = useState(vinculoInicial?.papel || 'membro');
  const [status, setStatus] = useState(vinculoInicial?.status || 'pendente');
  const [podeAprovar, setPodeAprovar] = useState(
    vinculoInicial ? !!vinculoInicial.pode_aprovar_membros : (papel === 'pastor' || papel === 'secretario')
  );
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const editando = !!vinculoInicial;
  const duplicado = igrejaId && vinculosExistentes.some((v) => {
    const vid = Array.isArray(v.igreja_id) ? v.igreja_id[0] : v.igreja_id;
    return vid === igrejaId;
  });

  // Ao mudar o papel no formulário de criação, ajusta o padrão da permissão.
  const onPapelChange = (val) => {
    setPapel(val);
    if (!editando) {
      setPodeAprovar(val === 'pastor' || val === 'secretario');
    }
  };

  const podeAprovarDisabled = papel === 'membro';

  const submit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!igrejaId) { setErro('Selecione uma igreja.'); return; }
    if (duplicado) { setErro('Este usuário já está vinculado a esta igreja.'); return; }
    if (exigeMotivo && !motivo.trim()) { setErro('Informe o motivo da alteração.'); return; }
    setSalvando(true);
    try {
      await onSubmit({
        igreja_id: igrejaId,
        papel,
        status,
        pode_aprovar_membros: podeAprovarDisabled ? false : podeAprovar,
        motivo: motivo.trim(),
      });
    } catch (err) {
      const m = err?.response?.message || err?.message || 'Não foi possível salvar o vínculo.';
      setErro(m);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold text-primary">{titulo}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {erro && <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erro}</p>}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Igreja *</label>
            <select value={igrejaId} onChange={(e) => setIgrejaId(e.target.value)} disabled={editando}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted/50">
              <option value="">Selecione…</option>
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>{nomeIgreja(i)}{i.cidade ? ` — ${i.cidade}/${i.estado || ''}` : ''}</option>
              ))}
            </select>
            {duplicado && <p className="mt-1 text-xs font-semibold text-destructive">Vínculo duplicado com esta igreja.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Papel *</label>
              <select value={papel} onChange={(e) => onPapelChange(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                {PAPEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Status *</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                {(editando ? STATUS_OPTIONS_EDIT : STATUS_OPTIONS_ADD).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <label className={`flex items-start gap-3 rounded-lg border p-3 ${podeAprovarDisabled ? 'border-border bg-muted/40 opacity-70' : 'border-primary/30 bg-primary/5'}`}>
            <input type="checkbox" checked={podeAprovarDisabled ? false : podeAprovar} disabled={podeAprovarDisabled}
              onChange={(e) => setPodeAprovar(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/20" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">Pode aprovar membros</span>
              <span className="block text-xs text-muted-foreground">
                {podeAprovarDisabled
                  ? 'Membros não podem aprovar solicitações.'
                  : 'Ativado por padrão para Pastor e Secretário. Pode ser desativado pelo administrador.'}
              </span>
            </span>
          </label>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              {exigeMotivo ? 'Motivo da alteração *' : 'Motivo (opcional)'}
            </label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
              placeholder="Descreva o motivo desta alteração…"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} disabled={salvando}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60">
              {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoverVinculoDialog({ vinculo, onCancel, onConfirm }) {
  const [confirmou, setConfirmou] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const confirmar = async () => {
    if (!confirmou) return;
    setSalvando(true);
    setErro('');
    try {
      await onConfirm(motivo.trim());
    } catch (err) {
      setErro(err?.response?.message || err?.message || 'Não foi possível remover.');
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold text-destructive">
            <AlertTriangle size={18} /> Remover vínculo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {erro && <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erro}</p>}
          <p className="text-sm text-foreground">
            A remoção é <strong>permanente</strong> e não pode ser desfeita. O vínculo deste usuário com a igreja será excluído.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Motivo (opcional)</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2}
              placeholder="Registre o motivo da remoção…"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <input type="checkbox" checked={confirmou} onChange={(e) => setConfirmou(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input text-destructive focus:ring-destructive/20" />
            <span className="text-sm font-semibold text-foreground">Confirmo que desejo excluir permanentemente este vínculo.</span>
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} disabled={salvando}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">
              Cancelar
            </button>
            <button type="button" onClick={confirmar} disabled={!confirmou || salvando}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-bold text-destructive-foreground transition-opacity disabled:opacity-50">
              {salvando ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {salvando ? 'Removendo…' : 'Excluir vínculo'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
