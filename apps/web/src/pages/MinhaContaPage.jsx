import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, ShieldCheck, Church, Clock, CheckCircle2, XCircle, LogOut, Save, AlertCircle, Building2, Briefcase, FileText, Sparkles, ArrowRight, X, Mail, AtSign } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';
import MeusVinculosSection from '@/components/MeusVinculosSection.jsx';
import PainelIgrejaCard from '@/components/PainelIgrejaCard.jsx';
import { formatarCpf, validarCpf } from '@/utils/cpf';

const SEXO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
];

// Estado Civil — opções exatas (integração com Corações Conectados).
const ESTADO_CIVIL_OPTIONS = [
  { value: 'Solteiro', label: 'Solteiro' },
  { value: 'Casado', label: 'Casado' },
  { value: 'Separado', label: 'Separado' },
  { value: 'Divorciado', label: 'Divorciado' },
  { value: 'Viúvo', label: 'Viúvo' },
  { value: 'União estável', label: 'União estável' },
];

const STATUS = {
  aguardando_aprovacao: {
    label: 'Aguardando aprovação da igreja',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/40',
  },
  aprovado: {
    label: 'Aprovado',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  reprovado: {
    label: 'Reprovado',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

export default function MinhaContaPage() {
  const { currentUser, isAuthenticated } = useSubscriptionAuth();
  const navigate = useNavigate();

  // Guarda contra sessão de ADMINISTRADOR: o SubscriptionAuthContext
  // espelha pb.authStore.model, que quando um admin está autenticado
  // (coleção `admins`) retorna o registro do admin — e não um usuário
  // da coleção `users`. Repassar currentUser.id do admin para componentes
  // que consultam a coleção `users` (PainelIgrejaCard →
  // verificarAcessoPainel → pb.collection('users').getOne) gera HTTP 404,
  // pois o id do admin não existe em `users`. A página "Minha conta"
  // é exclusiva de usuários; admin é redirecionado para /adm.
  const isAdminUser = Boolean(currentUser && currentUser.collectionName === 'admins');

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sexo, setSexo] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [statusCadastro, setStatusCadastro] = useState('aguardando_aprovacao');
  const [dataEnvio, setDataEnvio] = useState('');
  const [statusAprovacao, setStatusAprovacao] = useState('');
  const [motivoRecusa, setMotivoRecusa] = useState('');

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarConclusao, setMostrarConclusao] = useState(false);

  // Tela de conclusão de perfil: exibida quando o cadastro está aprovado
  // e o usuário ainda não dispensou (não bloqueia o acesso ao portal).
  const storageKey = currentUser ? `perfil_concluido_${currentUser.id}` : null;
  const aprovado = statusCadastro === 'aprovado';

  useEffect(() => {
    if (aprovado && storageKey && typeof window !== 'undefined' && window.localStorage.getItem(storageKey) !== '1') {
      setMostrarConclusao(true);
    }
  }, [aprovado, storageKey]);

  const fecharConclusao = () => {
    setMostrarConclusao(false);
    if (storageKey) window.localStorage.setItem(storageKey, '1');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/minha-conta', { replace: true });
      return;
    }
    if (isAdminUser) {
      navigate('/adm', { replace: true });
      return;
    }
    if (!currentUser) return;
    setNome(currentUser.name || '');
    setWhatsapp(currentUser.whatsapp || '');
    setSexo(currentUser.sexo || '');
    setDataNascimento(currentUser.dataNascimento || '');
    setEstadoCivil(currentUser.estadoCivil || '');
    setCpf(currentUser.cpf || '');
    setEmail(currentUser.email || '');
    setStatusCadastro(currentUser.status_cadastro || 'aguardando_aprovacao');
    setDataEnvio(currentUser.data_envio || '');
    setStatusAprovacao(currentUser.status_aprovacao || '');
    setMotivoRecusa(currentUser.motivo_recusa || '');
  }, [isAuthenticated, currentUser, navigate, isAdminUser]);

  if (!isAuthenticated || !currentUser || isAdminUser) {
    return null;
  }

  const statusInfo = STATUS[statusCadastro] || STATUS.aguardando_aprovacao;
  const StatusIcon = statusInfo.icon;

  const STATUS_APROVACAO = {
    pendente: { label: 'Pendente', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
    aprovado: { label: 'Aprovado pela igreja', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
    recusado: { label: 'Recusado pela igreja', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
    solicitar_informacoes: { label: 'Informações solicitadas', icon: AlertCircle, className: 'bg-primary/10 text-primary border-primary/30' },
  };
  const statusAprovacaoInfo = STATUS_APROVACAO[statusAprovacao] || null;
  const StatusAprovacaoIcon = statusAprovacaoInfo ? statusAprovacaoInfo.icon : null;

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setMsg('');
    if (!dataNascimento) {
      setErro('Informe sua data de nascimento.');
      return;
    }
    if (!estadoCivil) {
      setErro('Selecione o estado civil.');
      return;
    }
    if (!cpf) {
      setErro('Informe o seu CPF.');
      return;
    }
    if (!validarCpf(cpf)) {
      setErro('CPF inválido. Verifique os dígitos verificadores.');
      return;
    }
    setSalvando(true);
    try {
      const atualizado = await pb.collection('users').update(currentUser.id, {
        name: nome,
        whatsapp,
        sexo,
        cpf,
        dataNascimento,
        estadoCivil,
      });
      // Atualiza o modelo local do authStore para refletir na UI.
      pb.authStore.save(atualizado.token || pb.authStore.token, atualizado);
      setEditando(false);
      setMsg('Dados atualizados com sucesso.');
    } catch (err) {
      setErro('Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    navigate('/', { replace: true });
  };

  const formatarData = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR');
    } catch (_) {
      return iso;
    }
  };

  // Formata data e hora (usado para o aceite do termo do mentor).
  const formatarDataHora = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR');
    } catch (_) {
      return iso;
    }
  };

  return (
    <>
      <Helmet>
        <title>Minha conta | Conexão Batista</title>
        <meta name="description" content="Visualize e edite seus dados de cadastro no Conexão Batista." />
      </Helmet>

      {mostrarConclusao && (
        <ConclusaoPerfilModal onFechar={fecharConclusao} />
      )}

      <section className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary"><UserCircle size={26} strokeWidth={1.8} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Conta</p>
            <h1 className="font-display text-3xl font-bold text-primary">Minha conta</h1>
          </div>
        </div>

        {/* Status do cadastro */}
        <div className="mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status do cadastro</p>
              <span className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${statusInfo.className}`}>
                <StatusIcon size={16} strokeWidth={2} /> {statusInfo.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data de envio</p>
              <p className="mt-2 font-display text-sm font-bold text-foreground">{formatarData(dataEnvio)}</p>
            </div>
          </div>

          {statusCadastro === 'aguardando_aprovacao' && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/8 px-4 py-3 text-sm leading-relaxed text-foreground">
              <Church size={18} className="mt-0.5 shrink-0 text-accent" />
              <p>
                Sua conta só será aprovada depois que a igreja receber e validar a
                <Link to="/declaracao-membro-igreja" className="font-semibold text-primary underline"> declaração de que você é membro</Link>.
                Aguarde o retorno. Você já pode editar seus dados abaixo.
              </p>
            </div>
          )}
          {statusCadastro === 'reprovado' && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm leading-relaxed text-foreground">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
              <p>Seu cadastro não foi aprovado pela igreja. Em caso de dúvida, entre em contato pelo formulário do portal.</p>
            </div>
          )}
        </div>

        {/* Acesso ao Painel da Igreja (pastor/secretário com permissão de aprovação) */}
        <PainelIgrejaCard userId={currentUser.id} />

        {/* Status da aprovação da igreja (Painel da Igreja) */}
        {statusAprovacaoInfo && statusAprovacao !== 'aprovado' && (
          <div className="mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aprovação da igreja</p>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${statusAprovacaoInfo.className}`}>
                {StatusAprovacaoIcon && <StatusAprovacaoIcon size={16} strokeWidth={2} />} {statusAprovacaoInfo.label}
              </span>
            </div>
            {motivoRecusa && (statusAprovacao === 'recusado' || statusAprovacao === 'solicitar_informacoes') && (
              <div className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed text-foreground ${statusAprovacao === 'recusado' ? 'border-destructive/30 bg-destructive/8' : 'border-primary/30 bg-primary/8'}`}>
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{statusAprovacao === 'recusado' ? 'Motivo da recusa:' : 'Informações solicitadas pela igreja:'}</p>
                  <p className="mt-1">{motivoRecusa}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vínculos com igrejas (fonte da verdade do fluxo de aprovação) */}
        <MeusVinculosSection userId={currentUser.id} />

        {/* Programa de mentores (registro da candidatura + perfil complementar) */}
        <div className="mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Programa de mentores</p>
          {currentUser.mentor_solicitado ? (
            <div className="mt-3">
              {/* Status da solicitação de mentor (análise administrativa) */}
              {currentUser.mentor_status && (
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${
                  currentUser.mentor_status === 'aprovado'
                    ? 'border-green-300 bg-green-100 text-green-700'
                    : currentUser.mentor_status === 'rejeitado'
                      ? 'border-destructive/30 bg-destructive/10 text-destructive'
                      : 'border-accent/40 bg-accent/15 text-accent'
                }`}>
                  <Sparkles size={16} strokeWidth={2} />
                  {currentUser.mentor_status === 'aprovado'
                    ? 'Mentor aprovado'
                    : currentUser.mentor_status === 'rejeitado'
                      ? 'Solicitação rejeitada'
                      : 'Solicitação em análise'}
                </span>
              )}
              {!currentUser.mentor_status && (
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1.5 text-sm font-bold text-accent">
                  <Sparkles size={16} strokeWidth={2} /> Solicitação de mentor enviada
                </span>
              )}

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Termo de responsabilidade aceito em <span className="font-semibold text-foreground">{formatarDataHora(currentUser.mentor_data_aceite_termo)}</span>.
              </p>

              {/* Perfil complementar preenchido (etapa 2) */}
              {currentUser.mentor_status && (
                <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  {currentUser.mentor_areas && currentUser.mentor_areas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Áreas de competência</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {currentUser.mentor_areas.map((area) => (
                          <span key={area} className="rounded-full bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">{area}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentUser.mentor_cursos_publicados && currentUser.mentor_cursos_publicados.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cursos publicados</p>
                      <ul className="mt-1.5 space-y-1">
                        {currentUser.mentor_cursos_publicados.map((c, i) => (
                          <li key={i} className="text-sm text-foreground">
                            <span className="font-semibold">{c.titulo}</span>
                            <span className="text-muted-foreground"> — {c.plataforma}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {currentUser.mentor_biografia && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mini-biografia</p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground">{currentUser.mentor_biografia}</p>
                    </div>
                  )}
                  {currentUser.mentor_data_solicitacao && (
                    <p className="text-xs text-muted-foreground">Solicitação enviada em {formatarDataHora(currentUser.mentor_data_solicitacao)}.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Você não solicitou participar como mentor.</p>
          )}
        </div>

        {/* Conclusão de perfil (acesso permanente quando aprovado) */}
        {aprovado && (
          <div className="mb-6 rounded-2xl border border-accent/40 bg-accent/8 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-accent">Complete seu perfil</p>
                <h2 className="mt-1 font-display text-lg font-bold text-primary">Potencialize sua participação</h2>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">Cadastre sua empresa, seus serviços profissionais ou seu currículo e aproveite tudo da rede.</p>
              </div>
              <button type="button" onClick={() => setMostrarConclusao(true)} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Ver opções
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {OPCOES_CONCLUSAO.map((op) => {
                const Icon = op.icon;
                return (
                  <Link key={op.to} to={op.to} className="group flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary"><Icon size={18} strokeWidth={1.8} /></span>
                    <span className="text-xs font-bold leading-snug text-primary">{op.titulo}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Dados / edição */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-primary">Meus dados</h2>
            {!editando && (
              <button type="button" onClick={() => setEditando(true)} className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
                Editar dados
              </button>
            )}
          </div>

          {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">{msg}</p>}
          {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erro}</p>}

          {!editando ? (
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Campo label="Nome" valor={nome} />
              <Campo label="E-mail" valor={email} />
              <Campo label="Nome de usuário" valor={currentUser.username || 'Não definido'} />
              <Campo label="WhatsApp" valor={whatsapp} />
              <Campo label="Sexo" valor={SEXO_OPTIONS.find((o) => o.value === sexo)?.label || '—'} />
              <Campo label="CPF" valor={currentUser.cpf || '—'} />
              <Campo label="Data de nascimento" valor={formatarData(dataNascimento)} />
              <Campo label="Estado civil" valor={ESTADO_CIVIL_OPTIONS.find((o) => o.value === estadoCivil)?.label || '—'} />
              <Campo label="Status" valor={statusInfo.label} />
            </dl>
          ) : (
            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Nome completo</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">WhatsApp</label>
                  <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Sexo</label>
                  <select value={sexo} onChange={(e) => setSexo(e.target.value)} required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    {SEXO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Data de nascimento</label>
                  <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Estado civil</label>
                  <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <option value="">Selecione…</option>
                    {ESTADO_CIVIL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">CPF</label>
                <input type="text" inputMode="numeric" value={cpf} onChange={(e) => setCpf(formatarCpf(e.target.value))} required placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">E-mail</label>
                <input type="email" value={email} disabled
                  className="w-full cursor-not-allowed rounded-lg border border-input bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Por segurança, o e-mail só pode ser alterado pelo próprio usuário em{' '}
                  <Link to="/minha-conta/alterar-email" className="font-semibold text-primary hover:underline">Alterar e-mail</Link>.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60">
                  <Save size={16} /> {salvando ? 'Salvando…' : 'Salvar'}
                </button>
                <button type="button" onClick={() => { setEditando(false); setErro(''); }}
                  className="rounded-lg border border-border px-5 py-2.5 font-display text-sm font-bold text-foreground hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Conta e segurança */}
        <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-display text-lg font-bold text-primary">Conta e segurança</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/minha-conta/alterar-email" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                <Mail size={16} /> Alterar e-mail
              </Link>
            </li>
            <li>
              <Link to="/minha-conta/nome-usuario" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                <AtSign size={16} /> Visualizar e alterar nome de usuário
              </Link>
            </li>
          </ul>
        </div>

        {/* Documentos */}
        <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-display text-lg font-bold text-primary">Documentos</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/consentimento-uso-dados" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                <ShieldCheck size={16} /> Consentimento para uso dos dados
              </Link>
            </li>
            <li>
              <Link to="/termos-uso-privacidade" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                <ShieldCheck size={16} /> Termos de Uso e Política de Privacidade
              </Link>
            </li>
            <li>
              <Link to="/declaracao-membro-igreja" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                <Church size={16} /> Declaração de membro da igreja
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
            <LogOut size={16} /> Sair da conta
          </button>
        </div>
      </section>
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

const OPCOES_CONCLUSAO = [
  {
    to: '/minha-conta/empresa',
    icon: Building2,
    titulo: 'Cadastrar minha empresa',
    desc: 'Divulgue sua empresa para a rede de irmãos e participe do marketplace batista.',
  },
  {
    to: '/minha-conta/profissional',
    icon: Briefcase,
    titulo: 'Cadastrar meus serviços como profissional liberal',
    desc: 'Ofereça seus serviços profissionais para a comunidade da fé.',
  },
  {
    to: '/minha-conta/curriculo',
    icon: FileText,
    titulo: 'Cadastrar meu currículo',
    desc: 'Insira seu currículo e concorra a vagas dentro do portal.',
  },
];

function ConclusaoPerfilModal({ onFechar }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/55 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Conclusão de perfil">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <button type="button" onClick={onFechar} aria-label="Fechar" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X size={18} />
        </button>

        <div className="page-centered px-6 pb-8 pt-10 sm:px-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Sparkles size={26} strokeWidth={1.8} />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-accent">Cadastro aprovado</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">Bem-vindo à rede, irmão!</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Sua conta foi aprovada pela igreja. Para aproveitar tudo do Conexão Batista, complete seu perfil escolhendo uma das opções abaixo. Você também pode fazer isso depois, sem perder o acesso ao portal.
          </p>

          <div className="mt-7 grid gap-4 text-left sm:grid-cols-3">
            {OPCOES_CONCLUSAO.map((op) => {
              const Icon = op.icon;
              return (
                <Link key={op.to} to={op.to} className="group flex flex-col rounded-xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 font-display text-sm font-bold leading-snug text-primary">{op.titulo}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{op.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                    Começar <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-7 border-t border-border pt-5">
            <button type="button" onClick={onFechar} className="text-sm font-semibold text-muted-foreground underline hover:text-primary">
              Fazer isso depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
