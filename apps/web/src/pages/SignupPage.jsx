import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, ShieldCheck, FileText, CheckCircle2, Church, AlertCircle, AtSign, Loader2, X, Sparkles } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  validateUsernameFormat,
  checkUsernameAvailability,
  USERNAME_RULES,
} from '@/utils/username';
import MentorProfileForm from '@/components/MentorProfileForm.jsx';
import IgrejaFilterFields from '@/components/IgrejaFilterFields.jsx';

const SEXO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
];

// Máscara de CPF: 000.000.000-00
function formatarCpf(value) {
  const d = (value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
  if (d.length > 6) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
  if (d.length > 3) return d.slice(0, 3) + '.' + d.slice(3);
  return d;
}

// Validação de CPF (módulo 11, padrão brasileiro). Não usa API externa.
function validarCpf(cpf) {
  const numeros = (cpf || '').replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false; // todos os dígitos iguais
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(numeros[i], 10) * (10 - i);
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(numeros[9], 10) !== d1) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(numeros[i], 10) * (11 - i);
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(numeros[10], 10) !== d2) return false;
  return true;
}

// Estado Civil — opções exatas (integração com Corações Conectados).
const ESTADO_CIVIL_OPTIONS = [
  { value: 'Solteiro', label: 'Solteiro' },
  { value: 'Casado', label: 'Casado' },
  { value: 'Separado', label: 'Separado' },
  { value: 'Divorciado', label: 'Divorciado' },
  { value: 'Viúvo', label: 'Viúvo' },
  { value: 'União estável', label: 'União estável' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sexo, setSexo] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameFormatoErro, setUsernameFormatoErro] = useState('');
  const [usernameDisponivel, setUsernameDisponivel] = useState(null);
  const [checandoUsername, setChecandoUsername] = useState(false);
  const usernameDebounce = useRef(null);
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrar, setMostrar] = useState(false);

  const [abriuConsentimento, setAbriuConsentimento] = useState(false);
  const [aceitouConsentimento, setAceitouConsentimento] = useState(false);
  const [abriuTermos, setAbriuTermos] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  // Etapa 1 do fluxo de mentor: opção de candidatura + termo de responsabilidade.
  const [querMentor, setQuerMentor] = useState(false);
  const [mostrarTermoMentor, setMostrarTermoMentor] = useState(false);
  const [aceitouTermoMentor, setAceitouTermoMentor] = useState(false);
  // Etapa 2 do fluxo de mentor: formulário complementar de perfil exibido
  // após o aceite do termo e antes da conclusão do cadastro.
  const [mostrarFormMentor, setMostrarFormMentor] = useState(false);
  const [igrejaId, setIgrejaId] = useState('');
  const [cpf, setCpf] = useState('');
  const [erroCpf, setErroCpf] = useState('');

  // Texto do termo de mentor carregado da coleção `textos_legais` (tipo =
  // "mentor_termo"). Se não houver registro, usa o valor provisório.
  const [termoMentor, setTermoMentor] = useState({
    titulo: 'Termo de responsabilidade do mentor',
    conteudo: 'Texto provisório, será substituído posteriormente',
  });

  useEffect(() => {
    // Carrega o texto legal do mentor definido pela administração.
    pb.collection('textos_legais').getFullList({ filter: 'tipo = "mentor_termo"' })
      .then((res) => {
        if (res.length > 0 && res[0].titulo && res[0].conteudo) {
          setTermoMentor({ titulo: res[0].titulo, conteudo: res[0].conteudo });
        }
      })
      .catch(() => {});
  }, []);

  // Real-time username availability check (debounced).
  useEffect(() => {
    const value = username.trim();
    setUsernameDisponivel(null);

    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);

    const fmtErr = validateUsernameFormat(value);
    setUsernameFormatoErro(fmtErr);
    if (fmtErr) return;

    setChecandoUsername(true);
    usernameDebounce.current = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(value);
        setUsernameDisponivel(res.available);
      } catch (_) {
        setUsernameDisponivel(null);
      } finally {
        setChecandoUsername(false);
      }
    }, 500);

    return () => {
      if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    };
  }, [username]);

  const documentosAceitos = aceitouConsentimento && aceitouTermos;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      setErro('A senha e a confirmação não conferem.');
      return;
    }
    if (!sexo) {
      setErro('Selecione o sexo.');
      return;
    }
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
    if (!igrejaId) {
      setErro('Selecione a sua igreja.');
      return;
    }
    const usernameErro = validateUsernameFormat(username);
    if (usernameErro) {
      setErro(usernameErro);
      return;
    }
    if (usernameDisponivel === false) {
      setErro('Este nome de usuário já está em uso. Escolha outro.');
      return;
    }
    if (!documentosAceitos) {
      setErro('Você precisa abrir, ler e aceitar os dois documentos para concluir o cadastro.');
      return;
    }

    // Se o usuário marcou "Quero ser mentor", exibe o termo de responsabilidade
    // antes de concluir o cadastro. Usuários que NÃO marcaram a opção seguem
    // o fluxo atual sem nenhuma alteração.
    if (querMentor) {
      setMostrarTermoMentor(true);
      return;
    }

    await submeterCadastro(false);
  };

  // Submete o cadastro no PocketBase. `comMentor=true` grava os campos
  // mentor_solicitado e mentor_data_aceite_termo (etapa 1 do fluxo de mentor).
  // `perfilMentor` (opcional) contém os dados do formulário complementar
  // (etapa 2): areas, cursos e biografia — grava mentor_status="pendente".
  const submeterCadastro = async (comMentor, perfilMentor) => {
    setErro('');
    setLoading(true);
    try {
      await pb.collection('users').create({
        name: nome,
        email,
        username,
        password: senha,
        passwordConfirm: confirmar,
        whatsapp,
        sexo,
        cpf,
        dataNascimento,
        estadoCivil,
        igreja_id: igrejaId,
        aceitou_consentimento: true,
        aceitou_termos: true,
        ...(comMentor
          ? {
              mentor_solicitado: true,
              mentor_data_aceite_termo: new Date().toISOString(),
              ...(perfilMentor
                ? {
                    mentor_areas: perfilMentor.areas,
                    mentor_cursos_publicados: perfilMentor.cursos,
                    mentor_biografia: perfilMentor.biografia,
                    mentor_status: 'pendente',
                    mentor_data_solicitacao: new Date().toISOString(),
                  }
                : {}),
            }
          : {}),
      });
      // Login automático para o usuário acompanhar o status do cadastro.
      try {
        await pb.collection('users').authWithPassword(email, senha);
      } catch (_) {}
      setSucesso(true);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.email) setErro('Este e-mail já está cadastrado.');
      else if (data?.username) setErro('Este nome de usuário já está em uso. Escolha outro.');
      else if (data?.password) setErro('A senha não atende aos requisitos de segurança.');
      else setErro('Não foi possível concluir o cadastro. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Aceita o termo de responsabilidade do mentor e avança para o formulário
  // complementar de perfil (etapa 2). O cadastro só é concluído após o
  // envio (ou pulo) desse formulário.
  const aceitarTermoMentor = () => {
    setMostrarTermoMentor(false);
    setMostrarFormMentor(true);
  };

  // Envia o formulário complementar de perfil do mentor e conclui o cadastro
  // com mentor_status="pendente" para análise administrativa.
  const enviarPerfilMentor = async (perfilMentor) => {
    setMostrarFormMentor(false);
    await submeterCadastro(true, perfilMentor);
  };

  // Pula o formulário complementar e conclui o cadastro apenas com o aceite
  // do termo (mentor_solicitado=true, sem perfil complementar).
  const pularFormMentor = async () => {
    setMostrarFormMentor(false);
    await submeterCadastro(true);
  };

  // Volta do formulário complementar para o termo de responsabilidade.
  const voltarFormMentorParaTermo = () => {
    setMostrarFormMentor(false);
    setMostrarTermoMentor(true);
  };

  if (sucesso) {
    return (
      <>
        <Helmet>
          <title>Cadastro enviado | Conexão Batista</title>
          <meta name="description" content="Cadastro enviado para aprovação da igreja." />
        </Helmet>
        <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 px-4 py-16">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent">
              <CheckCircle2 size={30} strokeWidth={1.8} />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold text-primary">Cadastro enviado!</h1>
            <p className="mt-2 text-sm font-semibold text-foreground">Status: Aguardando aprovação da igreja</p>
            <div className="mt-5 rounded-xl border border-accent/40 bg-accent/8 px-5 py-4 text-left text-sm leading-relaxed text-foreground">
              <p className="flex items-center gap-2 font-semibold text-primary">
                <Church size={16} /> Próximo passo
              </p>
              <p className="mt-1">
                Sua conta só será aprovada depois que a igreja receber e validar a
                <Link to="/declaracao-membro-igreja" className="font-semibold text-primary underline"> declaração de que você é membro</Link>.
                Até lá, você já pode acompanhar o status e editar seus dados em "Minha conta".
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/minha-conta" className="rounded-lg bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground transition-opacity hover:bg-primary/90">
                Ir para Minha conta
              </Link>
              <Link to="/" className="rounded-lg border border-border px-5 py-3 font-display text-sm font-bold text-primary hover:bg-muted">
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Criar conta | Conexão Batista</title>
        <meta name="description" content="Crie sua conta no Conexão Batista. Cadastro sujeito à aprovação da igreja." />
      </Helmet>
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 px-4 py-16">
        <div className="w-full max-w-xl">
          <Link to="/" className="mx-auto mb-8 flex items-center justify-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">CB</span>
            <span className="font-display text-xl font-bold text-primary">Conexão<span className="text-accent">Batista</span></span>
          </Link>
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary"><UserPlus size={20} strokeWidth={1.8} /></span>
              <div>
                <h1 className="font-display text-xl font-bold text-primary">Criar conta</h1>
                <p className="text-xs text-muted-foreground">Cadastro sujeito à aprovação da igreja</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Nome completo *</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Seu nome"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">WhatsApp *</label>
                  <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required placeholder="(11) 99999-9999"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Sexo *</label>
                  <select value={sexo} onChange={(e) => setSexo(e.target.value)} required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <option value="">Selecione…</option>
                    {SEXO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Data de nascimento *</label>
                  <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Estado civil *</label>
                  <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <option value="">Selecione…</option>
                    {ESTADO_CIVIL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">CPF *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => {
                    setCpf(formatarCpf(e.target.value));
                    if (erroCpf) setErroCpf('');
                  }}
                  onBlur={() => {
                    if (cpf && !validarCpf(cpf)) {
                      setErroCpf('CPF inválido. Verifique os dígitos verificadores.');
                    }
                  }}
                  required
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {erroCpf && (
                  <p className="mt-1 text-xs font-semibold text-destructive">{erroCpf}</p>
                )}
              </div>

              <IgrejaFilterFields
                igrejaId={igrejaId}
                onChangeIgreja={setIgrejaId}
                required
              />

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">E-mail *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Nome de usuário *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><AtSign size={16} /></span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="seu_usuario"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {checandoUsername && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Loader2 size={16} className="animate-spin" />
                    </span>
                  )}
                  {!checandoUsername && username.trim() && !usernameFormatoErro && usernameDisponivel === true && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600"><CheckCircle2 size={16} /></span>
                  )}
                  {!checandoUsername && username.trim() && !usernameFormatoErro && usernameDisponivel === false && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive"><X size={16} /></span>
                  )}
                </div>
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {USERNAME_RULES.map((r) => <li key={r}>• {r}</li>)}
                </ul>
                {usernameFormatoErro && (
                  <p className="mt-1 text-xs font-semibold text-destructive">{usernameFormatoErro}</p>
                )}
                {!usernameFormatoErro && username.trim() && usernameDisponivel === false && (
                  <p className="mt-1 text-xs font-semibold text-destructive">Este nome de usuário já está em uso.</p>
                )}
                {!usernameFormatoErro && username.trim() && usernameDisponivel === true && (
                  <p className="mt-1 text-xs font-semibold text-green-600">Nome de usuário disponível!</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Pode ser usado no lugar do e-mail para entrar.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Senha *</label>
                  <div className="relative">
                    <input type={mostrar ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} required placeholder="Mín. 8 caracteres"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Confirmar senha *</label>
                  <input type={mostrar ? 'text' : 'password'} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required placeholder="Repita a senha"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              {/* Aceitação dos documentos */}
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-bold text-primary">Aceite dos documentos</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Abra e leia cada documento abaixo. Só depois de aberto você poderá marcar a aceitação.
                </p>

                <DocumentoAceite
                  icone={<ShieldCheck size={18} strokeWidth={1.8} />}
                  titulo="Consentimento para uso dos dados"
                  resumo="Como tratamos seus dados pessoais (LGPD)."
                  abriu={abriuConsentimento}
                  aceitou={aceitouConsentimento}
                  onAbrir={() => setAbriuConsentimento(true)}
                  onAceitar={(v) => setAceitouConsentimento(v)}
                  linkTo="/consentimento-uso-dados"
                  conteudo={
                    <>
                      <p>Este consentimento descreve as finalidades do tratamento dos seus dados cadastrais (nome, WhatsApp, sexo, cidade e e-mail), o compartilhamento com a igreja responsável pela validação, seus direitos como titular e como revogar o consentimento.</p>
                      <p className="mt-3 text-xs text-muted-foreground">Este é um resumo. O texto completo está em revisão jurídica e será publicado em breve.</p>
                    </>
                  }
                />

                <DocumentoAceite
                  icone={<FileText size={18} strokeWidth={1.8} />}
                  titulo="Termos de Uso e Política de Privacidade"
                  resumo="Regras de uso e tratamento dos dados no portal."
                  abriu={abriuTermos}
                  aceitou={aceitouTermos}
                  onAbrir={() => setAbriuTermos(true)}
                  onAceitar={(v) => setAceitouTermos(v)}
                  linkTo="/termos-uso-privacidade"
                  conteudo={
                    <>
                      <p>Os Termos de Uso definem as condições de uso do portal, o fluxo de cadastro e aprovação pela igreja, responsabilidades e hipóteses de encerramento de conta. A Política de Privacidade descreve a base legal e as medidas de segurança do tratamento de dados.</p>
                      <p className="mt-3 text-xs text-muted-foreground">Este é um resumo. O texto completo está em revisão jurídica e será publicado em breve.</p>
                    </>
                  }
                />
              </div>

              {/* Opção "Quero ser mentor" — etapa 1 do fluxo de mentor */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={querMentor}
                    onChange={(e) => setQuerMentor(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm leading-relaxed text-foreground">
                    <span className="font-bold text-primary">Quero ser mentor</span>
                    <span className="block text-xs text-muted-foreground">Marque esta opção se deseja se candidatar como mentor. Ao concluir o cadastro, você precisará aceitar o termo de responsabilidade.</span>
                  </span>
                </label>
              </div>

              {erro && (
                <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /> {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !documentosAceitos}
                className="w-full rounded-lg bg-primary py-3 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Enviando cadastro…' : 'Concluir cadastro'}
              </button>
              {!documentosAceitos && (
                <p className="text-center text-xs text-muted-foreground">
                  Você precisa abrir, ler e aceitar os dois documentos para concluir.
                </p>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
            </p>
          </div>
        </div>

        {/* Modal do termo de responsabilidade do mentor (etapa 1) */}
        {mostrarTermoMentor && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/55 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Termo de responsabilidade do mentor">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
              <div className="px-6 pb-8 pt-7 sm:px-10">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"><Sparkles size={22} strokeWidth={1.8} /></span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">Programa de mentores</p>
                    <h2 className="font-display text-xl font-bold text-primary sm:text-2xl">{termoMentor.titulo}</h2>
                  </div>
                </div>

                <div className="mt-5 max-h-[40dvh] space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {termoMentor.conteudo}
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg px-1">
                  <input
                    type="checkbox"
                    checked={aceitouTermoMentor}
                    onChange={(e) => setAceitouTermoMentor(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm leading-relaxed text-foreground">
                    Confirmo que li e aceito o <span className="font-semibold">termo de responsabilidade</span>.
                  </span>
                </label>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => { setMostrarTermoMentor(false); setAceitouTermoMentor(false); }}
                    className="rounded-lg border border-border px-5 py-3 font-display text-sm font-bold text-foreground hover:bg-muted"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={!aceitouTermoMentor || loading}
                    onClick={aceitarTermoMentor}
                    className="rounded-lg bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Concluindo cadastro…' : 'Aceitar e continuar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulário complementar de perfil de mentor (etapa 2) — exibido
            após o aceite do termo e antes da conclusão do cadastro. */}
        {mostrarFormMentor && (
          <MentorProfileForm
            onEnviar={enviarPerfilMentor}
            onPular={pularFormMentor}
            onVoltar={voltarFormMentorParaTermo}
            loading={loading}
          />
        )}
      </div>
    </>
  );
}

function DocumentoAceite({ icone, titulo, resumo, abriu, aceitou, onAbrir, onAceitar, linkTo, conteudo }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">{icone}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{titulo}</p>
          <p className="text-xs text-muted-foreground">{resumo}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" onClick={onAbrir} className="rounded-md border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5">
                  Abrir e ler
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display text-lg font-bold text-primary">{titulo}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm leading-relaxed text-foreground">
                  {conteudo}
                  <Link to={linkTo} target="_blank" className="inline-block font-semibold text-primary underline">
                    Ver página completa do documento
                  </Link>
                </div>
              </DialogContent>
            </Dialog>
            <Link to={linkTo} target="_blank" className="text-xs font-semibold text-muted-foreground hover:text-primary">
              Abrir página
            </Link>
          </div>
        </div>
      </div>
      <label className={`mt-3 flex items-start gap-2.5 rounded-md px-2 py-2 ${abriu ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
        <input
          type="checkbox"
          disabled={!abriu}
          checked={aceitou}
          onChange={(e) => onAceitar(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
        />
        <span className="text-xs leading-relaxed text-foreground">
          {abriu
            ? <>Li o documento e aceito o <span className="font-semibold">{titulo}</span>.</>
            : 'Abra o documento para habilitar a aceitação.'}
        </span>
      </label>
    </div>
  );
}
