import React, { useState } from 'react';
import { X, Flag } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

const MOTIVOS = [
  { value: 'comportamento_inadequado', label: 'Comportamento inadequado' },
  { value: 'conteudo_ofensivo', label: 'Conteúdo ofensivo' },
  { value: 'perfil_falso', label: 'Perfil falso' },
  { value: 'assedio', label: 'Assédio' },
  { value: 'outro', label: 'Outro' },
];

export default function DenunciaModal({ perfil, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motivo) { setErro('Selecione um motivo.'); return; }
    setLoading(true);
    setErro('');
    try {
      await pb.collection('rel_denuncias').create({
        denunciante: pb.authStore.record.id,
        denunciado: perfil.owner,
        denunciado_apelido: perfil.apelido || 'Usuário',
        motivo,
        descricao,
        status: 'pendente',
      });
      setEnviado(true);
    } catch {
      setErro('Não foi possível enviar a denúncia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive"><Flag size={18} /></span>
            <div>
              <h2 className="font-display text-lg font-bold text-primary">Denunciar perfil</h2>
              <p className="text-xs text-muted-foreground">{perfil.apelido || 'Usuário'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>

        {enviado ? (
          <div className="rounded-xl bg-green-50 p-5 text-center">
            <p className="font-display font-bold text-green-700">Denúncia enviada!</p>
            <p className="mt-1 text-sm text-green-600">Nossa equipe irá analisar em breve. Obrigado por contribuir com a segurança da rede.</p>
            <button onClick={onClose} className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white">Fechar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Motivo da denúncia</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} required
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="">Selecione um motivo…</option>
                {MOTIVOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Descrição <span className="font-normal text-muted-foreground">(opcional)</span></label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3}
                placeholder="Descreva o ocorrido com mais detalhes…"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            {erro && <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erro}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Cancelar</button>
              <button type="submit" disabled={loading}
                className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {loading ? 'Enviando…' : 'Enviar denúncia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
