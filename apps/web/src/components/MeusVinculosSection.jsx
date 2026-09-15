import React, { useCallback, useEffect, useState } from 'react';
import { Church, Clock, CheckCircle2, XCircle, PauseCircle, StopCircle, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const STATUS_INFO = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
  ativo: { label: 'Ativo', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
  recusado: { label: 'Recusado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  suspenso: { label: 'Suspenso', icon: PauseCircle, className: 'bg-amber-100 text-amber-700 border-amber-300' },
  encerrado: { label: 'Encerrado', icon: StopCircle, className: 'bg-muted text-muted-foreground border-border' },
};

const PAPEL_LABEL = { pastor: 'Pastor', secretario: 'Secretário', membro: 'Membro' };

function nomeIgreja(rec) {
  if (!rec) return '—';
  return rec.razao_social || rec.nome_fantasia || rec.nome || 'Igreja sem nome';
}

export default function MeusVinculosSection({ userId }) {
  const [vinculos, setVinculos] = useState([]);
  const [igrejas, setIgrejas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const [modalSolicitar, setModalSolicitar] = useState(false);
  const [removendo, setRemovendo] = useState(null);

  const carregar = useCallback(async (signal) => {
    // requestKey: null desativa o auto-cancelamento do SDK PocketBase para
    // estas requisições, evitando que chamadas simultâneas de
    // PainelIgrejaCard/IgrejaLayout sobre a mesma coleção se cancelem entre
    // si (causa do "signal is aborted without reason"). O cancelamento passa
    // a ser controlado pelo AbortController PRÓPRIO deste efeito.
    const opts = signal ? { requestKey: null, signal } : {};
    const ehAbort = (err) => !!signal?.aborted || !!err?.isAbort || err?.name === 'AbortError' || err?.status === 0;
    setLoading(true);
    setErro('');
    try {
      const [vList, iList] = await Promise.all([
        pb.collection('vinculos_usuario_igreja').getFullList({
          filter: pb.filter('usuario_id = {:uid}', { uid: userId }),
          expand: 'igreja_id',
          sort: '-created',
          ...opts,
        }),
        pb.collection('empresas').getFullList({
          filter: "tipo = 'igreja' && status_aprovacao = 'aprovado'",
          sort: 'razao_social,nome_fantasia',
          ...opts,
        }),
      ]);
      if (signal?.aborted) return;
      setVinculos(vList);
      setIgrejas(iList);
    } catch (err) {
      // Cancelamento esperado (desmontagem/troca de userId): silencioso, sem
      // log nem alteração de estado.
      if (ehAbort(err)) return;
      console.error('MeusVinculosSection: erro ao carregar vínculos', err);
      setErro('Não foi possível carregar seus vínculos.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    carregar(controller.signal);
    return () => { controller.abort(); };
  }, [carregar]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 6000); };

  // Igrejas que o usuário ainda não tem vínculo (para o select de nova solicitação).
  const igrejaIdJaVinculado = new Set(
    vinculos.map((v) => (Array.isArray(v.igreja_id) ? v.igreja_id[0] : v.igreja_id)),
  );
  const igrejasDisponiveis = igrejas.filter((i) => !igrejaIdJaVinculado.has(i.id));

  return (
    <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary">
          <Church size={18} className="text-accent" /> Vínculos com igrejas
        </h2>
        <button
          type="button"
          onClick={() => setModalSolicitar(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:bg-primary/90"
        >
          <Plus size={16} /> Solicitar vínculo
        </button>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Cada solicitação é analisada pelos representantes da igreja. Quando aprovada, o vínculo fica ativo e a igreja aparece aqui.
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
          <p className="text-sm font-semibold text-muted-foreground">Você ainda não solicitou vínculo com nenhuma igreja.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {vinculos.map((v) => {
            const ig = v.expand?.igreja_id;
            const igreja = Array.isArray(ig) ? ig[0] : ig;
            const st = STATUS_INFO[v.status] || STATUS_INFO.pendente;
            const StIcon = st.icon;
            const podeRemover = v.status === 'recusado' || v.status === 'suspenso' || v.status === 'encerrado';
            return (
              <li key={v.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-foreground">{nomeIgreja(igreja)}</p>
                    <p className="text-xs text-muted-foreground">
                      {igreja?.cidade || '—'}{igreja?.estado ? `/${igreja.estado}` : ''} · {PAPEL_LABEL[v.papel] || v.papel}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                    <StIcon size={13} strokeWidth={2} /> {st.label}
                  </span>
                </div>

                {v.status === 'pendente' && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-accent/8 px-3 py-2 text-xs text-foreground">
                    <Clock size={14} className="mt-0.5 shrink-0 text-accent" />
                    Solicitação enviada. Aguarde a aprovação dos representantes da igreja.
                  </p>
                )}

                {v.status === 'recusado' && v.motivo_recusa && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-foreground">
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">Motivo da recusa:</p>
                      <p className="mt-0.5">{v.motivo_recusa}</p>
                    </div>
                  </div>
                )}

                {podeRemover && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    <button type="button" onClick={() => setRemovendo(v)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10">
                      <Trash2 size={13} /> Remover vínculo
                    </button>
                    {v.status === 'recusado' && (
                      <span className="self-center text-xs text-muted-foreground">
                        Após remover, você poderá solicitar um novo vínculo com esta ou outra igreja.
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal Solicitar novo vínculo */}
      {modalSolicitar && (
        <SolicitarVinculoDialog
          igrejas={igrejasDisponiveis}
          onCancel={() => setModalSolicitar(false)}
          onConfirm={async (igrejaId) => {
            await pb.collection('vinculos_usuario_igreja').create({
              usuario_id: userId,
              igreja_id: igrejaId,
              papel: 'membro',
              status: 'pendente',
              pode_aprovar_membros: false,
              responsavel_nome: 'Solicitação do usuário',
              motivo_alteracao: 'Nova solicitação de vínculo',
            });
            setModalSolicitar(false);
            flash('Solicitação de vínculo enviada com sucesso. Aguarde a aprovação da igreja.');
            carregar();
          }}
        />
      )}

      {/* Modal Remover vínculo recusado/suspenso/encerrado */}
      {removendo && (
        <RemoverVinculoDialog
          vinculo={removendo}
          onCancel={() => setRemovendo(null)}
          onConfirm={async () => {
            await pb.collection('vinculos_usuario_igreja').delete(removendo.id);
            setRemovendo(null);
            flash('Vínculo removido. Você pode solicitar um novo vínculo quando quiser.');
            carregar();
          }}
        />
      )}
    </div>
  );
}

function SolicitarVinculoDialog({ igrejas, onCancel, onConfirm }) {
  const [igrejaId, setIgrejaId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!igrejaId) { setErro('Selecione uma igreja.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onConfirm(igrejaId);
    } catch (err) {
      const m = err?.response?.message || err?.message || 'Não foi possível enviar a solicitação.';
      setErro(m);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <Church size={18} className="text-accent" /> Solicitar vínculo com igreja
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {erro && <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erro}</p>}
          {igrejas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você já solicitou vínculo com todas as igrejas disponíveis. Aguarde a análise das solicitações pendentes.
            </p>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Igreja *</label>
              <select value={igrejaId} onChange={(e) => setIgrejaId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="">Selecione a igreja…</option>
                {igrejas.map((i) => (
                  <option key={i.id} value={i.id}>{nomeIgreja(i)}{i.cidade ? ` — ${i.cidade}/${i.estado || ''}` : ''}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                A solicitação será enviada com status "Pendente" e papel "Membro". Os representantes da igreja vão analisar.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} disabled={salvando}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={salvando || igrejas.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60">
              {salvando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {salvando ? 'Enviando…' : 'Enviar solicitação'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoverVinculoDialog({ vinculo, onCancel, onConfirm }) {
  const [confirmou, setConfirmou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const confirmar = async () => {
    if (!confirmou) return;
    setSalvando(true);
    setErro('');
    try {
      await onConfirm();
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
            <AlertCircle size={18} /> Remover vínculo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {erro && <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erro}</p>}
          <p className="text-sm text-foreground">
            A remoção é permanente. Após remover, você poderá solicitar um novo vínculo com esta ou outra igreja.
          </p>
          <label className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <input type="checkbox" checked={confirmou} onChange={(e) => setConfirmou(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input text-destructive focus:ring-destructive/20" />
            <span className="text-sm font-semibold text-foreground">Confirmo que desejo remover este vínculo.</span>
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
