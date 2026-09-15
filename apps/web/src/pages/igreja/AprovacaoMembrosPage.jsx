import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useOutletContext } from 'react-router-dom';
import { Search, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2, Users, Church, PauseCircle, StopCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';
import { getIgrejaId } from '@/components/igreja/IgrejaLayout.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STATUS_INFO = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
  ativo: { label: 'Ativo', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
  recusado: { label: 'Recusado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  suspenso: { label: 'Suspenso', icon: PauseCircle, className: 'bg-amber-100 text-amber-700 border-amber-300' },
  encerrado: { label: 'Encerrado', icon: StopCircle, className: 'bg-muted text-muted-foreground border-border' },
};

const SEXO_LABEL = { masculino: 'Masculino', feminino: 'Feminino', outro: 'Outro' };
const PER_PAGE = 10;

function formatarData(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (_) { return iso; }
}

function firstId(raw) {
  return Array.isArray(raw) ? raw[0] || '' : raw || '';
}

export default function AprovacaoMembrosPage() {
  const { currentUser } = useSubscriptionAuth();
  const repId = currentUser?.id || '';
  // A regra de acesso (listRule/viewRule/updateRule) de
  // `vinculos_usuario_igreja` filtra os vínculos visíveis a um
  // pastor/secretário/presidente/admin por
  // `igreja_id = @request.auth.igreja_id` — ou seja, pelo campo
  // `igreja_id` do PRÓPRIO registro do representante na coleção `users`
  // (escopado por igreja). A migração 1787098000_vinculos_rule_admin_presidente
  // adicionou 'presidente' e 'admin' ao branch por igreja, alinhando a regra
  // com o painel (verificarAcessoPainel) e o hook (repPodeAprovar), que
  // validam pelo VÍNCULO ativo — assim um representante com users.papel=
  // 'admin' (que possui vínculo ativo de pastor com permissão) agora
  // enxerga e aprova os membros pendentes da sua igreja, em vez de receber
  // uma lista vazia (HTTP 200, sem erro). Para que o filtro enviado nesta
  // query coincida EXATAMENTE com a regra aplicada pelo PocketBase (ambas
  // são combinadas em AND), usamos o `igreja_id` do registro do usuário
  // como fonte primária. Se divergissem (ex.: vínculo ativo em outra igreja
  // enquanto `users.igreja_id` ficou defasado), a regra de acesso zeraria a
  // lista silenciosamente (HTTP 200, sem erro). O context do layout (igreja
  // do vínculo ativo) serve de fallback quando o registro do usuário ainda
  // não foi sincronizado. A migração 1787094511_sync_pastor_igreja_id_to_vinculo
  // garante que `users.igreja_id` reflita o vínculo ativo do pastor.
  const { igrejaId: ctxIgrejaId } = useOutletContext() || {};
  const igrejaId = getIgrejaId(currentUser) || ctxIgrejaId;

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [detalhe, setDetalhe] = useState(null); // vínculo + usuário expandido
  const [acaoAtual, setAcaoAtual] = useState(null); // { tipo: 'aprovar'|'recusar', vinculo }
  const [justificativa, setJustificativa] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');

  const carregar = useCallback(async () => {
    // CORREÇÃO DEFINITIVA: o escopo por igreja é feito PELA REGRA DE ACESSO
    // do PocketBase (listRule de vinculos_usuario_igreja filtra por
    // `igreja_id = @request.auth.igreja_id` para pastor/secretário/
    // presidente/admin). NÃO adicionamos `igreja_id` ao filtro da query.
    //
    // Motivo: o `igreja_id` lido do authStore no frontend
    // (getIgrejaId(currentUser)) é o registro CACHÉADO no momento do login,
    // que pode estar defasado em relação ao banco (ex.: pastor logou antes
    // do backfill que sincronizou users.igreja_id). Já a regra de acesso usa
    // o valor FRESCO do banco, porque o PocketBase recarrega o auth record
    // a cada requisição. Quando o filtro da query (valor defasado) e a regra
    // (valor fresco) apontavam para igrejas diferentes, o AND resultante
    // zerava a lista — HTTP 200, sem erro (falha silenciosa). O membro
    // cadastrado existia e estava pendente, mas ficava invisível.
    //
    // Deixar o escopo SÓ na regra de acesso elimina definitivamente a
    // divergência das duas fontes de verdade: existe agora uma única fonte
    // (o banco, via @request.auth.igreja_id). O pastor enxerga apenas os
    // vínculos de membros da SUA igreja, sem depender de cache do frontend.
    setLoading(true);
    setErro('');
    try {
      const filtros = [
        pb.filter('papel = "membro"'),
      ];
      if (filtroStatus !== 'todos') {
        filtros.push(pb.filter('status = {:st}', { st: filtroStatus }));
      }
      const result = await pb.collection('vinculos_usuario_igreja').getList(pagina, PER_PAGE, {
        filter: filtros.join(' && '),
        expand: 'usuario_id,igreja_id',
        sort: '-created',
      });
      // Filtro de busca por nome/e-mail do usuário (client-side, pois é sobre o expand).
      const termo = busca.trim().toLowerCase();
      let filtered = result.items;
      if (termo) {
        filtered = result.items.filter((v) => {
          const u = v.expand?.usuario_id;
          const user = Array.isArray(u) ? u[0] : u;
          const nome = (user?.name || '').toLowerCase();
          const email = (user?.email || '').toLowerCase();
          return nome.includes(termo) || email.includes(termo);
        });
      }
      setItems(filtered);
      setTotalItems(termo ? filtered.length : result.totalItems);
      setTotalPages(termo ? 1 : result.totalPages);
    } catch (err) {
      if (err?.isAbort || err?.status === 0) return;
      setErro('Não foi possível carregar a lista de solicitações.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, pagina, igrejaId]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [busca, filtroStatus]);

  const executarAcao = async () => {
    if (!acaoAtual) return;
    const { tipo, vinculo } = acaoAtual;
    if (tipo === 'recusar' && !justificativa.trim()) return;

    setSalvando(true);
    setErro('');
    try {
      const agora = new Date();
      const dataHoraIso = agora.toISOString();
      const horaAcao = agora.toTimeString().split(' ')[0].substring(0, 5);
      const representanteId = pb.authStore.model?.id || repId;
      const usuarioId = firstId(vinculo.usuario_id);

      if (tipo === 'aprovar') {
        // 1) Atualiza o vínculo
        await pb.collection('vinculos_usuario_igreja').update(vinculo.id, {
          status: 'ativo',
          motivo_recusa: '',
        });

        // 2) Atualiza o status_aprovacao do usuário
        await pb.collection('users').update(usuarioId, {
          status_aprovacao: 'aprovado',
        });

        // 3) Grava a decisão na tabela de auditoria
        await pb.collection('decisoes_aprovacao_igreja').create({
          usuario_id: usuarioId,
          representante_id: representanteId,
          igreja_id: igrejaId,
          data_acao: dataHoraIso,
          hora_acao: horaAcao,
          status: 'aprovado',
          tipo_acao: 'aprovacao',
          justificativa: '',
        });

        const user = vinculo.expand?.usuario_id;
        const userName = (Array.isArray(user) ? user[0]?.name : user?.name) || 'Membro';
        setMsgSucesso(`${userName} foi aprovado(a). O vínculo está ativo e o usuário já tem acesso ao portal.`);
      } else if (tipo === 'recusar') {
        // 1) Atualiza o vínculo
        await pb.collection('vinculos_usuario_igreja').update(vinculo.id, {
          status: 'recusado',
          motivo_recusa: justificativa.trim(),
        });

        // 2) Atualiza o status_aprovacao do usuário
        await pb.collection('users').update(usuarioId, {
          status_aprovacao: 'recusado',
        });

        // 3) Grava a decisão na tabela de auditoria
        await pb.collection('decisoes_aprovacao_igreja').create({
          usuario_id: usuarioId,
          representante_id: representanteId,
          igreja_id: igrejaId,
          data_acao: dataHoraIso,
          hora_acao: horaAcao,
          status: 'recusado',
          tipo_acao: 'recusa',
          justificativa: justificativa.trim(),
        });

        const user = vinculo.expand?.usuario_id;
        const userName = (Array.isArray(user) ? user[0]?.name : user?.name) || 'Membro';
        setMsgSucesso(`Vínculo de ${userName} recusado. O motivo foi registrado e será visível ao usuário.`);
      }
      setAcaoAtual(null);
      setJustificativa('');
      setDetalhe(null);
      carregar();
      setTimeout(() => setMsgSucesso(''), 6000);
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

  const acaoTitulo = { aprovar: 'Aprovar solicitação', recusar: 'Recusar solicitação' };
  const acaoLabel = { aprovar: 'Confirmar aprovação', recusar: 'Confirmar recusa' };

  return (
    <>
      <Helmet>
        <title>Solicitações de Membros | Painel da Igreja</title>
        <meta name="description" content="Aprovação de solicitações de vínculo de membros da igreja." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Fluxo 3 · Painel da Igreja</p>
          <h1 className="font-display text-3xl font-bold text-primary">Solicitações de membros</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {totalItems} solicitação(ões) de membros para a sua igreja.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Apenas vínculos de <strong>Membros</strong> pendentes. Vínculos de Pastores e Secretários são aprovados pela administração geral.
          </p>
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
              placeholder="Buscar por nome ou e-mail"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
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
              <Loader2 size={20} className="animate-spin" /> Carregando solicitações…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Users size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhuma solicitação encontrada com esses filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Nome</th>
                    <th className="hidden px-4 py-3 font-bold md:table-cell">E-mail</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Data da solicitação</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((v) => {
                    const u = v.expand?.usuario_id;
                    const user = Array.isArray(u) ? u[0] : u;
                    const st = STATUS_INFO[v.status] || STATUS_INFO.pendente;
                    const StIcon = st.icon;
                    const isSelf = repId && firstId(v.usuario_id) === repId;
                    return (
                      <tr key={v.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{user?.name || '—'}</div>
                          <div className="text-xs text-muted-foreground">{SEXO_LABEL[user?.sexo] || '—'}</div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{user?.email || '—'}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{formatarData(v.data_criacao || v.created)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                            <StIcon size={13} strokeWidth={2} /> {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDetalhe(v)}
                            className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
                          >
                            Detalhes
                          </button>
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

      {/* Modal de detalhes */}
      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-primary">Detalhes da solicitação</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <DetalhesContent vinculo={detalhe} onAcao={abrirAcao} repId={repId} />
          )}
        </DialogContent>
      </Dialog>

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
                const nome = u?.name || 'membro';
                return (
                  <p className="text-sm text-muted-foreground">
                    {acaoAtual.tipo === 'aprovar'
                      ? `Confirmar a aprovação de ${nome}? Após a aprovação, o vínculo ficará ativo e o usuário terá acesso normal ao portal.`
                      : `Recusar o vínculo de ${nome}? A justificativa abaixo é obrigatória e será visível ao usuário em "Minha conta".`}
                  </p>
                );
              })()}
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

function DetalhesContent({ vinculo, onAcao, repId }) {
  const u = vinculo.expand?.usuario_id;
  const user = Array.isArray(u) ? u[0] : u;
  const ig = vinculo.expand?.igreja_id;
  const igreja = Array.isArray(ig) ? ig[0] : ig;
  const st = STATUS_INFO[vinculo.status] || STATUS_INFO.pendente;
  const StIcon = st.icon;
  const isSelf = repId && firstId(vinculo.usuario_id) === repId;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
          {(user?.name || '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-display text-lg font-bold text-foreground">{user?.name || '—'}</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
            <StIcon size={13} strokeWidth={2} /> {st.label}
          </span>
        </div>
      </div>

      <dl className="divide-y divide-border rounded-xl border border-border">
        <DetalheRow label="E-mail" value={user?.email} />
        <DetalheRow label="WhatsApp" value={user?.whatsapp} />
        <DetalheRow label="Sexo" value={SEXO_LABEL[user?.sexo]} />
        <DetalheRow label="Cidade" value={user?.cidade} />
        <DetalheRow label="Igreja" value={igreja?.razao_social || igreja?.nome_fantasia || '—'} />
        <DetalheRow label="Data da solicitação" value={formatarData(vinculo.data_criacao || vinculo.created)} />
        {vinculo.motivo_recusa && (
          <DetalheRow label="Motivo da recusa" value={vinculo.motivo_recusa} />
        )}
      </dl>

      {isSelf && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
          Você não pode aprovar o seu próprio vínculo. Esta solicitação deve ser decidida por outro representante da igreja.
        </p>
      )}

      {/* Action buttons — apenas para vínculos pendentes */}
      {vinculo.status === 'pendente' && !isSelf && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => onAcao('aprovar', vinculo)}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:bg-green-700">
            <CheckCircle2 size={16} className="mr-1.5 inline" /> Aprovar
          </button>
          <button type="button" onClick={() => onAcao('recusar', vinculo)}
            className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground transition-opacity hover:bg-destructive/90">
            <XCircle size={16} className="mr-1.5 inline" /> Recusar
          </button>
        </div>
      )}
    </div>
  );
}

function DetalheRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-semibold text-foreground">{value || '—'}</dd>
    </div>
  );
}
