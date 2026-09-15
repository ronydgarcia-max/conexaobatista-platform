import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle2, AlertCircle, ArrowRight, GraduationCap } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';

// Página de cadastro de alunos para a plataforma de cursos (API na VPS).
// O envio é feito via fetch ao proxy Express (/hcgi/api/cursos/usuarios), que
// repassa à API de cursos evitando o bloqueio de mixed content (HTTPS -> HTTP)
// que ocorreria numa chamada direta do navegador.
const CURSOS_HOME = 'https://cursos.conexaobatista.com.br';

export default function CadastroCursosPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validação básica no frontend antes de enviar.
  const validar = () => {
    if (!nome.trim()) return 'Informe o seu nome.';
    if (!email.trim()) return 'Informe o seu e-mail.';
    // Validação simples de formato de e-mail.
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) return 'Informe um e-mail válido.';
    if (senha.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    const erroValidacao = validar();
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setLoading(true);
    try {
      // Chamada ao proxy Express (mesma origem) que repassa à API de cursos.
      const response = await apiServerClient.fetch('/cursos/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          senha,
        }),
      });

      // 201 = cadastro criado com sucesso.
      if (response.status === 201) {
        // Limpa o formulário antes de redirecionar.
        setNome('');
        setEmail('');
        setSenha('');
        setSucesso(true);

        // Mostra a mensagem de sucesso e redireciona após 2 segundos.
        setTimeout(() => {
          window.location.href = CURSOS_HOME;
        }, 2000);
        return;
      }

      // Erros 400/409/500 — exibe mensagem e mantém o formulário visível.
      let mensagem = 'Não foi possível concluir o cadastro. Tente novamente.';
      try {
        const data = await response.json();
        if (data?.error) mensagem = data.error;
        else if (data?.mensagem) mensagem = data.mensagem;
      } catch (_) {
        // Mantém a mensagem padrão se o corpo não for JSON.
      }
      setErro(mensagem);
    } catch (_) {
      // Erro de rede/conexão — não expõe detalhes sensíveis.
      setErro('Não foi possível conectar ao serviço de cursos. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  // Tela de sucesso exibida antes do redirecionamento.
  if (sucesso) {
    return (
      <>
        <Helmet>
          <title>Cadastro realizado | Cursos Conexão Batista</title>
          <meta name="description" content="Seu cadastro na plataforma de cursos foi criado com sucesso." />
        </Helmet>
        <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 px-4 py-16">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={30} strokeWidth={1.8} />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold text-primary">Cadastro realizado!</h1>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              Sua conta de aluno foi criada na plataforma de cursos. Você será redirecionado em instantes…
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
              <a
                href={CURSOS_HOME}
                className="font-display text-sm font-bold text-primary underline"
              >
                Ir agora para a plataforma de cursos
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cadastro na plataforma de cursos | Conexão Batista</title>
        <meta name="description" content="Crie sua conta de aluno na plataforma de cursos do Conexão Batista." />
      </Helmet>

      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 px-4 py-16">
        <div className="w-full max-w-xl">
          {/* Logo */}
          <Link to="/" className="mx-auto mb-8 flex items-center justify-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">CB</span>
            <span className="font-display text-xl font-bold text-primary">Conexão<span className="text-accent">Batista</span></span>
          </Link>

          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            {/* Cabeçalho */}
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
                <GraduationCap size={20} strokeWidth={1.8} />
              </span>
              <div>
                <h1 className="font-display text-xl font-bold text-primary">Cadastro na plataforma de cursos</h1>
                <p className="text-xs text-muted-foreground">Crie sua conta de aluno e comece a estudar</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Nome */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Nome completo *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Seu nome"
                    autoComplete="name"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">E-mail *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Senha *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock size={16} />
                  </span>
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    placeholder="Mín. 6 caracteres"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrar(!mostrar)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Mensagem de erro — mantém o formulário visível */}
              {erro && (
                <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /> {erro}
                </p>
              )}

              {/* Botão com estado de carregamento */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Cadastrando…
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Cadastrar <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
              Ao se cadastrar, você terá acesso à plataforma de cursos do Conexão Batista como aluno.
            </p>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Quer participar da rede de irmãos?{' '}
              <Link to="/cadastro" className="font-semibold text-primary hover:underline">
                Criar conta no Conexão Batista
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
