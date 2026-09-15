import React, { useState } from 'react';
import { X, ShieldOff, Flag, MapPin, Heart } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import DenunciaModal from './DenunciaModal';

const STATUS_LABEL = { solteiro: 'Solteiro(a)', viuvo: 'Viúvo(a)', divorciado: 'Divorciado(a)', outro: 'Outro' };
const PREF_LABEL = { amizade: 'Amizade', namoro: 'Namoro', casamento: 'Casamento', networking: 'Networking', estudo: 'Estudo bíblico' };

export default function PerfilModal({ perfil, onClose, onBlocked }) {
  const [denunciando, setDenunciando] = useState(false);
  const [bloqueando, setBloqueando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const isOwn = perfil.owner === pb.authStore.record?.id;

  const fotoUrl = perfil.foto
    ? pb.files.getURL(perfil, perfil.foto, { thumb: '400x400' })
    : null;

  const handleBloquear = async () => {
    if (!window.confirm(`Deseja bloquear ${perfil.apelido || 'este usuário'}? Você não verá mais o perfil desta pessoa.`)) return;
    setBloqueando(true);
    try {
      await pb.collection('rel_bloqueios').create({
        bloqueador: pb.authStore.record.id,
        bloqueado: perfil.owner,
        bloqueado_apelido: perfil.apelido || 'Usuário',
      });
      setBloqueado(true);
      onBlocked?.(perfil.owner);
      onClose();
    } catch {
      alert('Não foi possível bloquear. Tente novamente.');
    } finally {
      setBloqueando(false);
    }
  };

  const prefs = Array.isArray(perfil.preferencias) ? perfil.preferencias : (perfil.preferencias ? [perfil.preferencias] : []);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            {fotoUrl ? (
              <img src={fotoUrl} alt={perfil.apelido || 'Perfil'} className="h-56 w-full object-cover" />
            ) : (
              <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <span className="font-display text-6xl font-bold text-primary/40">{(perfil.apelido || 'U')[0].toUpperCase()}</span>
              </div>
            )}
            <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-foreground shadow hover:bg-white"><X size={16} /></button>
          </div>

          <div className="p-6">
            <h2 className="font-display text-2xl font-bold text-primary">{perfil.apelido || 'Usuário'}</h2>
            {(perfil.cidade || perfil.estado) && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin size={14} /> {[perfil.cidade, perfil.estado].filter(Boolean).join(', ')}
              </p>
            )}
            {perfil.status_relacionamento && (
              <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {STATUS_LABEL[perfil.status_relacionamento] || perfil.status_relacionamento}
              </span>
            )}

            {prefs.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent"><Heart size={12} /> Busca</p>
                <div className="flex flex-wrap gap-2">
                  {prefs.map((p) => (
                    <span key={p} className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground">{PREF_LABEL[p] || p}</span>
                  ))}
                </div>
              </div>
            )}

            {perfil.bio && (
              <p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm leading-relaxed text-foreground">{perfil.bio}</p>
            )}

            {!isOwn && !bloqueado && (
              <div className="mt-5 flex gap-3">
                <button onClick={() => setDenunciando(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:border-destructive hover:text-destructive">
                  <Flag size={15} /> Denunciar
                </button>
                <button onClick={handleBloquear} disabled={bloqueando}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-60">
                  <ShieldOff size={15} /> {bloqueando ? 'Bloqueando…' : 'Bloquear'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {denunciando && <DenunciaModal perfil={perfil} onClose={() => setDenunciando(false)} />}
    </>
  );
}
