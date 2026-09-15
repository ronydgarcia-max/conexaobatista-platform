import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Church, ArrowRight, Users, Clock } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { verificarAcessoPainel } from '@/components/igreja/IgrejaLayout.jsx';

function firstId(raw) {
  return Array.isArray(raw) ? raw[0] || '' : raw || '';
}

// Cartão de acesso ao Painel da Igreja exibido na "Minha conta" para usuários
// que possuem vínculo ativo como pastor/secretário com permissão de aprovação
// (ou o fallback legado de pastor/secretário aprovado). Reusa a mesma função
// verificarAcessoPainel do IgrejaLayout para que o cartão e o painel usem
// exatamente a mesma regra de acesso — evita o bug onde o representante
// conseguia aprovar membros pela API mas não via o cartão/painel.
export default function PainelIgrejaCard({ userId }) {
  const [estado, setEstado] = useState({ carregando: true, autorizado: false, igrejaId: '', igrejaNome: '', pendentes: 0 });

  useEffect(() => {
    if (!userId) {
      setEstado({ carregando: false, autorizado: false, igrejaId: '', igrejaNome: '', pendentes: 0 });
      return;
    }
    // AbortController PRÓPRIO deste efeito (não compartilhado com
    // IgrejaLayout/MeusVinculosSection). Garante cancelamento silencioso ao
    // desmontar/trocar userId, sem recorrer ao auto-cancelamento do SDK.
    const controller = new AbortController();
    const { signal } = controller;
    const ehAbort = (err) => !!signal.aborted || !!err?.isAbort || err?.name === 'AbortError' || err?.status === 0;

    (async () => {
      let autorizado = false;
      let igrejaId = '';
      try {
        const res = await verificarAcessoPainel(userId, signal);
        if (signal.aborted) return;
        autorizado = res.autorizado;
        igrejaId = res.igrejaId;
      } catch (err) {
        if (ehAbort(err)) return;
        console.error('PainelIgrejaCard: erro ao verificar acesso ao painel', err);
        if (!signal.aborted) setEstado({ carregando: false, autorizado: false, igrejaId: '', igrejaNome: '', pendentes: 0 });
        return;
      }

      if (!autorizado || !igrejaId) {
        if (!signal.aborted) setEstado({ carregando: false, autorizado: false, igrejaId: '', igrejaNome: '', pendentes: 0 });
        return;
      }

      // Conta solicitações de membros pendentes para esta igreja.
      let pendentes = 0;
      let igrejaNome = '';
      try {
        const pendList = await pb.collection('vinculos_usuario_igreja').getList(1, 1, {
          filter: pb.filter('igreja_id = {:ig} && papel = "membro" && status = "pendente"', { ig: igrejaId }),
          requestKey: null,
          signal,
        });
        pendentes = pendList.totalItems || 0;
      } catch (err) {
        if (ehAbort(err)) return;
        console.error('PainelIgrejaCard: erro ao contar solicitações pendentes', err);
      }
      try {
        const rec = await pb.collection('empresas').getOne(igrejaId, { requestKey: null, signal });
        igrejaNome = rec.razao_social || rec.nome_fantasia || rec.nome || '';
      } catch (err) {
        if (ehAbort(err)) return;
        console.error('PainelIgrejaCard: erro ao carregar dados da igreja', err);
      }

      if (!signal.aborted) {
        setEstado({ carregando: false, autorizado: true, igrejaId, igrejaNome, pendentes });
      }
    })();

    return () => { controller.abort(); };
  }, [userId]);

  if (estado.carregando || !estado.autorizado) return null;

  const { igrejaNome, pendentes } = estado;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15">
            <Church size={24} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Painel da Igreja</p>
            <h2 className="mt-1 font-display text-xl font-bold">Aprovação de membros</h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-primary-foreground/80">
              {igrejaNome ? `Igreja ${igrejaNome}.` : 'Sua igreja.'} Analise e aprove as solicitações de vínculo de membros.
            </p>
          </div>
        </div>

        <Link
          to="/igreja/aprovacao-membros"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-display text-sm font-bold text-accent-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Users size={18} /> Acessar o painel <ArrowRight size={16} />
        </Link>
      </div>

      {pendentes > 0 && (
        <div className="flex items-center gap-2 border-t border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold">
          <Clock size={16} className="text-accent" />
          <span>
            {pendentes} solicitaç{pendentes === 1 ? 'ão pendente' : 'ões pendentes'} aguardando sua análise.
          </span>
        </div>
      )}
    </div>
  );
}
