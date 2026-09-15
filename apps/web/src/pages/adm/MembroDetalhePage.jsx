import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, ShieldCheck, ShieldAlert, Church, Clock, CheckCircle2, XCircle,
  Check, X, AlertTriangle, UserCircle, FileCheck2, Trash2,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { STATUS, formatarData } from '@/pages/adm/MembrosPage.jsx';
import VinculosIgrejaSection from '@/components/admin/VinculosIgrejaSection.jsx';

const SEXO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro / prefiro não informar' },
];

const STATUS_OPTIONS = [
  { value: 'aguardando_aprovacao', label: 'Aguardando aprovação da igreja' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
];

export default function MembroDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [membro, setMembro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erroLoad, setErroLoad] = useState('');

  // editable fields
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sexo, setSexo] = useState('');
  const [cidade, setCidade] = useState('');

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');

  // status change
  const [novoStatus, setNovoStatus] = useState('');
  const [confirmacao, setConfirmacao] = useState(null); // { status, label }
  const [salvandoStatus, setSalvandoStatus] = useState(false);

  // exclusão do membro
  const [excluindo, setExcluindo] = useState(false); // modal aberto
  const [confirmouExclusao, setConfirmouExclusao] = useState(false);
  const [excluindoRegistro, setExcluindoRegistro] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      setErroLoad('');
      try {
        const rec = await pb.collection('users').getOne(id);
        if (!ativo) return;
        setMembro(rec);
        setNome(rec.name || '');
        setWhatsapp(rec.whatsapp || '');
        setSexo(rec.sexo || '');
        setCidade(rec.cidade || '');
        setNovoStatus(rec.status_cadastro || 'aguardando_aprovacao');
      } catch (err) {
        setErroLoad('Não foi possível carregar este membro. Ele pode ter sido removido ou você não tem permissão.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, [id]);

  const atualizarLocal = (rec) => {
    setMembro(rec);
    setNome(rec.name || '');
    setWhatsapp(rec.whatsapp || '');
    setSexo(rec.sexo || '');
    setCidade(rec.cidade || '');
    setNovoStatus(rec.status_cadastro || 'aguardando_aprovacao');
  };

  const handleSalvarDados = async (e) => {
    e.preventDefault();
    setErro('');
    setMsg('');
    setSalvando(true);
    try {
      const rec = await pb.collection('users').update(id, { name: nome, whatsapp, sexo, cidade });
      atualizarLocal(rec);
      setEditando(false);
      setMsg('Dados do membro atualizados com sucesso.');
    } catch (err) {
      setErro('Não foi possível salvar. Verifique os campos e tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const abrirExclusao = () => {
    setConfirmouExclusao(false);
    setErroExclusao('');
    setExcluindo(true);
  };

  const confirmarExclusao = async () => {
    if (!confirmouExclusao) return;
    setExcluindoRegistro(true);
    setErroExclusao('');
    try {
      await pb.collection('users').delete(id);
      setExcluindo(false);
      navigate('/adm/membros');
    } catch (err) {
      setErroExclusao(err?.response?.message || err?.message || 'Não foi possível excluir o membro.');
      setExcluindoRegistro(false);
    }
  };

  const pedirConfirmacaoStatus = (status) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    setConfirmacao({ status, label: opt?.label || status });
  };

  const confirmarStatus = async () => {
    if (!confirmacao) return;
    setErro('');
    setMsg('');
    setSalvandoStatus(true);
    try {
      const rec = await pb.collection('users').update(id, { status_cadastro: confirmacao.status });
      atualizarLocal(rec);
      setMsg(`Status alterado para "${confirmacao.label}".`);
      setConfirmacao(null);
    } catch (err) {
      setErro('Não foi possível alterar o status. Tente novamente.');
    } finally {
      setSalvandoStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-muted-foreground">
        <Loader2 size={22} className="animate-spin" /> Carregando membro…
      </div>
    );
  }

  if (erroLoad || !membro) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <AlertTriangle size={36} className="mx-auto text-accent" />
        <p className="mt-4 text-sm text-muted-foreground">{erroLoad || 'Membro não encontrado.'}</p>
        <Link to="/adm/membros" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
          <ArrowLeft size={16} /> Voltar para membros
        </Link>
      </section>
    );
  }

  const st = STATUS[membro.status_cadastro] || STATUS.aguardando_aprovacao;
  const StIcon = st.icon;
  const statusMudou = novoStatus !== membro.status_cadastro;

  return (
    <>
      <Helmet>
        <title>{membro.name || 'Membro'} | Administração Conexão Batista</title>
        <meta name="description" content="Detalhes e gerenciamento de membro." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="mx-auto max-w-5xl px-5 py-10 lg:px-10">
        <Link to="/adm/membros" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar para membros
        </Link>

        {/* Cabeçalho */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/8 text-primary">
            <UserCircle size={30} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-bold text-primary">{membro.name || 'Sem nome'}</h1>
            <p className="truncate text-sm text-muted-foreground">{membro.email}</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${st.className}`}>
            <StIcon size={16} strokeWidth={2} /> {st.label}
          </span>
        </div>

        {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{msg}</p>}
        {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna principal: dados + edição */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-primary">Dados do membro</h2>
                {!editando && (
                  <button type="button" onClick={() => setEditando(true)} className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
                    Editar dados
                  </button>
                )}
              </div>

              {!editando ? (
                <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Campo label="Nome completo" valor={membro.name} />
                  <Campo label="E-mail" valor={membro.email} />
                  <Campo label="Nome de usuário" valor={membro.username || 'Não definido'} />
                  <Campo label="WhatsApp" valor={membro.whatsapp} />
                  <Campo label="Sexo" valor={SEXO_OPTIONS.find((o) => o.value === membro.sexo)?.label} />
                  <Campo label="Cidade" valor={membro.cidade} />
                  <Campo label="E-mail verificado" valor={membro.verified ? 'Sim' : 'Não'} />
                </dl>
              ) : (
                <form onSubmit={handleSalvarDados} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">Nome completo</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">WhatsApp</label>
                      <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">Sexo</label>
                      <select value={sexo} onChange={(e) => setSexo(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                        {SEXO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">Cidade</label>
                    <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">E-mail</label>
                    <input type="email" value={membro.email} disabled
                      className="w-full cursor-not-allowed rounded-lg border border-input bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground" />
                    <p className="mt-1 text-xs font-semibold text-foreground">
                      Por segurança, o e-mail só pode ser alterado pelo próprio usuário em Minha conta.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Se o usuário não tiver acesso ao e-mail atual, deverá solicitar assistência pelo formulário de contato do portal.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={salvando}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60">
                      <Save size={16} /> {salvando ? 'Salvando…' : 'Salvar dados'}
                    </button>
                    <button type="button" onClick={() => { setEditando(false); setErro(''); }}
                      className="rounded-lg border border-border px-5 py-2.5 font-display text-sm font-bold text-foreground hover:bg-muted">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Coluna lateral: status + declarações */}
          <div className="space-y-6">
            {/* Status do cadastro (Fluxo 1 — aprovação do cadastro do usuário) */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-1 font-display text-lg font-bold text-primary">Aprovação do cadastro</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Fluxo 1 · Aprova o cadastro geral do usuário no portal. Independente do vínculo com igreja.
                Data de envio: <span className="font-semibold text-foreground">{formatarData(membro.data_envio)}</span>
              </p>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Alterar status</label>
                <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!statusMudou || salvandoStatus}
                  onClick={() => pedirConfirmacaoStatus(novoStatus)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-40"
                >
                  <Save size={16} /> Salvar status
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={membro.status_cadastro === 'aprovado' || salvandoStatus}
                    onClick={() => { setNovoStatus('aprovado'); pedirConfirmacaoStatus('aprovado'); }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-bold text-green-700 transition-opacity disabled:opacity-40 hover:bg-green-100"
                  >
                    <CheckCircle2 size={16} /> Aprovar
                  </button>
                  <button
                    type="button"
                    disabled={membro.status_cadastro === 'reprovado' || salvandoStatus}
                    onClick={() => { setNovoStatus('reprovado'); pedirConfirmacaoStatus('reprovado'); }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-bold text-destructive transition-opacity disabled:opacity-40 hover:bg-destructive/10"
                  >
                    <XCircle size={16} /> Reprovar
                  </button>
                </div>
              </div>
            </div>

            {/* Declarações e consentimentos */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-primary">
                <FileCheck2 size={18} className="text-accent" /> Declarações e consentimentos
              </h2>
              <ul className="space-y-3 text-sm">
                <ConsentItem
                  icon={ShieldCheck}
                  ok={!!membro.aceitou_consentimento}
                  titulo="Consentimento para uso dos dados"
                  link="/consentimento-uso-dados"
                />
                <ConsentItem
                  icon={ShieldCheck}
                  ok={!!membro.aceitou_termos}
                  titulo="Termos de Uso e Política de Privacidade"
                  link="/termos-uso-privacidade"
                />
                <ConsentItem
                  icon={Church}
                  ok={!!membro.aceitou_termos}
                  titulo="Declaração de membro da igreja"
                  link="/declaracao-membro-igreja"
                  observacao="Vinculada à aceitação dos Termos no cadastro."
                />
              </ul>
              <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
                <p className="flex items-center justify-between">
                  <span>Data de envio do cadastro</span>
                  <span className="font-semibold text-foreground">{formatarData(membro.data_envio)}</span>
                </p>
                <p className="mt-2 flex items-center justify-between">
                  <span>Criado em</span>
                  <span className="font-semibold text-foreground">{formatarData(membro.created)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vínculos com Igrejas — seção separada dos dados pessoais */}
        <div className="mt-6">
          <VinculosIgrejaSection userId={membro.id} />
        </div>

        {/* Excluir membro — zona de perigo */}
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-destructive">
            <AlertTriangle size={18} /> Excluir membro
          </h2>
          <p className="mt-2 text-sm text-foreground">
            A exclusão é <strong>permanente</strong> e remove o cadastro do usuário, incluindo acesso ao portal. Esta ação não pode ser desfeita.
          </p>
          <button
            type="button"
            onClick={abrirExclusao}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-white px-5 py-2.5 text-sm font-bold text-destructive transition-opacity hover:bg-destructive/10"
          >
            <Trash2 size={16} /> Excluir membro
          </button>
        </div>
      </section>

      {/* Modal de exclusão */}
      {excluindo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle size={22} />
              </span>
              <h3 className="font-display text-lg font-bold text-destructive">Excluir membro</h3>
            </div>
            {erroExclusao && <p className="mb-3 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erroExclusao}</p>}
            <p className="text-sm leading-relaxed text-foreground">
              Você está prestes a excluir permanentemente o cadastro de <span className="font-bold">{membro.name || membro.email}</span>.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Esta ação não pode ser desfeita. O usuário perderá o acesso ao portal e seus dados de autenticação serão removidos.
            </p>
            <label className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <input type="checkbox" checked={confirmouExclusao} onChange={(e) => setConfirmouExclusao(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input text-destructive focus:ring-destructive/20" />
              <span className="text-sm font-semibold text-foreground">Confirmo que desejo excluir permanentemente este membro.</span>
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setExcluindo(false)} disabled={excluindoRegistro}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">
                Cancelar
              </button>
              <button type="button" onClick={confirmarExclusao} disabled={!confirmouExclusao || excluindoRegistro}
                className="inline-flex items-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-bold text-destructive-foreground transition-opacity disabled:opacity-50">
                {excluindoRegistro ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {excluindoRegistro ? 'Excluindo…' : 'Excluir membro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação */}
      {confirmacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${confirmacao.status === 'aprovado' ? 'bg-green-100 text-green-700' : confirmacao.status === 'reprovado' ? 'bg-destructive/10 text-destructive' : 'bg-accent/15 text-accent'}`}>
                <AlertTriangle size={22} />
              </span>
              <h3 className="font-display text-lg font-bold text-primary">Confirmar alteração</h3>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              Você está prestes a alterar o status do cadastro de <span className="font-bold">{membro.name || membro.email}</span> para:
            </p>
            <p className="mt-2 rounded-lg bg-muted/60 px-4 py-2.5 text-sm font-bold text-primary">{confirmacao.label}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Os demais dados do membro serão preservados. Esta ação pode ser revertida alterando o status novamente.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmacao(null)} disabled={salvandoStatus}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">
                Cancelar
              </button>
              <button type="button" onClick={confirmarStatus} disabled={salvandoStatus}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60">
                {salvandoStatus ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {salvandoStatus ? 'Salvando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Campo({ label, valor }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{valor || '—'}</dd>
    </div>
  );
}

function ConsentItem({ icon: Icon, ok, titulo, link, observacao }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${ok ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
        {ok ? <Check size={15} /> : <X size={15} />}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{titulo}</p>
        <p className={`text-xs ${ok ? 'text-green-700' : 'text-muted-foreground'}`}>
          {ok ? 'Aceito no cadastro' : 'Não registrado'}
        </p>
        {link && (
          <Link to={link} className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <Icon size={12} /> Ver documento
          </Link>
        )}
        {observacao && <p className="mt-0.5 text-xs text-muted-foreground">{observacao}</p>}
      </div>
    </li>
  );
}
