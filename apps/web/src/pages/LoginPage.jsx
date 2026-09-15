import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/minha-conta';
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const valor = identificador.trim();
      let loginEmail = valor;

      // If the identifier is not an email, resolve the username to the user's
      // email via the server (which also validates the password first).
      if (valor && !valor.includes('@')) {
        const res = await pb.send('/api/auth/resolve-login', {
          method: 'POST',
          body: { identifier: valor, password: senha },
        });
        // Contas administrativas vivem em coleção separada (`admins`).
        // Redireciona ao painel admin em vez de tentar autenticar em `users`.
        if (res.isAdmin) {
          navigate('/adm/login', { replace: true });
          return;
        }
        loginEmail = res.email;
      }

      await pb.collection('users').authWithPassword(loginEmail, senha);
      navigate(redirect, { replace: true });
    } catch (err) {
      const status = err?.status || err?.response?.status;
      if (status === 401) {
        setErro('Credenciais inválidas. Verifique e tente novamente.');
      } else {
        setErro('E-mail/usuário ou senha inválidos. Verifique e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Entrar | Conexão Batista</title>
        <meta name="description" content="Acesse sua conta Conexão Batista." />
      </Helmet>
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 px-4 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="mx-auto mb-8 flex items-center justify-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">CB</span>
            <span className="font-display text-xl font-bold text-primary">Conexão<span className="text-accent">Batista</span></span>
          </Link>
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary"><LogIn size={20} strokeWidth={1.8} /></span>
              <div>
                <h1 className="font-display text-xl font-bold text-primary">Entrar</h1>
                <p className="text-xs text-muted-foreground">Bem-vindo de volta, irmão!</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">E-mail ou nome de usuário</label>
                <input
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  required
                  placeholder="seu@email.com ou @usuario"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Senha</label>
                <div className="relative">
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {erro && <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erro}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-3 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60"
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Ainda não tem conta?{' '}
              <Link to="/cadastro" className="font-semibold text-primary hover:underline">Criar conta</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
