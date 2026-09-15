import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

export default function AdminLoginPage() {
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  if (admin) {
    return <Navigate to={admin.get('must_change_password') ? '/adm/alterar-senha' : '/adm/membros'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const record = await login(username.trim(), senha);
      navigate(record.get('must_change_password') ? '/adm/alterar-senha' : '/adm/membros', { replace: true });
    } catch (err) {
      setErro('Usuário ou senha inválidos. Verifique e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Administração — Entrar | Conexão Batista</title>
        <meta name="description" content="Acesso restrito à área administrativa do Conexão Batista." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="flex min-h-[100dvh] items-center justify-center bg-primary px-4 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="mx-auto mb-8 flex items-center justify-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 font-display text-sm font-bold text-white">CB</span>
            <span className="font-display text-xl font-bold text-white">
              Conexão<span className="text-accent">Batista</span>
            </span>
          </Link>

          <div className="rounded-2xl border border-border bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary"><ShieldCheck size={20} strokeWidth={1.8} /></span>
              <div>
                <h1 className="font-display text-xl font-bold text-primary">Administração</h1>
                <p className="text-xs text-muted-foreground">Acesso restrito</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Usuário</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="usuário"
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
                    autoComplete="current-password"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60"
              >
                <Lock size={16} /> {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
              Área restrita a administradores autorizados. O acesso é registrado e monitorado.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
