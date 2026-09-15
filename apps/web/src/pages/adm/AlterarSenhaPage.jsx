import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

const rules = [
  { test: (p) => p.length >= 10, label: 'Mínimo de 10 caracteres' },
  { test: (p) => /[a-z]/.test(p), label: 'Letra minúscula' },
  { test: (p) => /[A-Z]/.test(p), label: 'Letra maiúscula' },
  { test: (p) => /[0-9]/.test(p), label: 'Número' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Símbolo (ex.: ! @ # $)' },
];

export default function AlterarSenhaPage() {
  const { admin, changePassword, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [atual, setAtual] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  if (!admin) {
    return <Navigate to="/adm/login" replace />;
  }
  if (!admin.get('must_change_password')) {
    return <Navigate to="/adm/membros" replace />;
  }

  const todasOk = rules.every((r) => r.test(senha));
  const podeEnviar = todasOk && senha === confirmar && atual.length > 0 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (senha !== confirmar) {
      setErro('As senhas não conferem.');
      return;
    }
    if (!atual) {
      setErro('Informe a senha atual (temporária).');
      return;
    }
    setLoading(true);
    try {
      await changePassword(senha, atual);
      navigate('/adm/membros', { replace: true });
    } catch (err) {
      const msg = err?.response?.message || err?.message || '';
      setErro(
        msg ||
          'Não foi possível alterar a senha. A senha deve ter 10+ caracteres com maiúsculas, minúsculas, números e símbolos.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Alterar senha | Administração Conexão Batista</title>
        <meta name="description" content="Troca obrigatória da senha temporária de administrador." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="flex min-h-[100dvh] items-center justify-center bg-primary px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><KeyRound size={20} strokeWidth={1.8} /></span>
              <div>
                <h1 className="font-display text-xl font-bold text-primary">Trocar senha</h1>
                <p className="text-xs text-muted-foreground">Senha temporária detectada</p>
              </div>
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/8 px-4 py-3 text-sm leading-relaxed text-foreground">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-accent" />
              <p>
                Por segurança, é obrigatório trocar a senha temporária antes de acessar o painel. Escolha uma senha forte e exclusiva.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Senha atual (temporária)</label>
                <div className="relative">
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={atual}
                    onChange={(e) => setAtual(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Nova senha</label>
                <div className="relative">
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Confirmar nova senha</label>
                <input
                  type={mostrar ? 'text' : 'password'}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <ul className="space-y-1.5 rounded-lg bg-muted/50 px-4 py-3 text-xs">
                {rules.map((r) => {
                  const ok = r.test(senha);
                  return (
                    <li key={r.label} className={`flex items-center gap-2 ${ok ? 'text-green-700' : 'text-muted-foreground'}`}>
                      <span className={`grid h-4 w-4 place-items-center rounded-full ${ok ? 'bg-green-600 text-white' : 'bg-border text-transparent'}`}>✓</span>
                      {r.label}
                    </li>
                  );
                })}
              </ul>

              {erro && <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erro}</p>}

              <button
                type="submit"
                disabled={!podeEnviar}
                className="w-full rounded-lg bg-primary py-3 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50"
              >
                {loading ? 'Salvando…' : 'Salvar nova senha'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { logout(); navigate('/adm/login', { replace: true }); }}
              className="mt-4 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Sair e voltar ao login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
