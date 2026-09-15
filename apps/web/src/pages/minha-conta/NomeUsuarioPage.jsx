import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';
import {
  validateUsernameFormat,
  checkUsernameAvailability,
  USERNAME_RULES,
} from '@/utils/username';

export default function NomeUsuarioPage() {
  const { currentUser, isAuthenticated } = useSubscriptionAuth();
  const navigate = useNavigate();

  const [usernameAtual, setUsernameAtual] = useState('');
  const [novoUsername, setNovoUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);

  const [formatoErro, setFormatoErro] = useState('');
  const [disponivel, setDisponivel] = useState(null); // null=unknown, true, false
  const [checando, setChecando] = useState(false);

  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  // Redirect unauthenticated users (after hooks so rules-of-hooks holds).
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login?redirect=/minha-conta/nome-usuario', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    const u = currentUser.username || '';
    setUsernameAtual(u);
    setNovoUsername(u);
  }, [currentUser]);

  // Real-time availability check (debounced), skipping the user's own current
  // username so editing nothing doesn't show "indisponível".
  useEffect(() => {
    const value = novoUsername.trim();
    setDisponivel(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const fmtErr = validateUsernameFormat(value);
    setFormatoErro(fmtErr);
    if (fmtErr) return;

    if (value.toLowerCase() === (usernameAtual || '').toLowerCase()) {
      setDisponivel(true);
      return;
    }

    setChecando(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(value);
        setDisponivel(res.available);
      } catch (_) {
        setDisponivel(null);
      } finally {
        setChecando(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [novoUsername, usernameAtual]);

  const podeSalvar =
    novoUsername.trim() &&
    !formatoErro &&
    disponivel === true &&
    novoUsername.trim().toLowerCase() !== (usernameAtual || '').toLowerCase() &&
    senha.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMsg('');

    const value = novoUsername.trim();
    const fmtErr = validateUsernameFormat(value);
    if (fmtErr) {
      setErro(fmtErr);
      return;
    }
    if (!senha) {
      setErro('Informe sua senha atual para confirmar a alteração.');
      return;
    }
    if (value.toLowerCase() === (usernameAtual || '').toLowerCase()) {
      setErro('O novo nome de usuário é igual ao atual.');
      return;
    }

    setLoading(true);
    try {
      // Verify the current password by re-authenticating with email.
      try {
        await pb.collection('users').authWithPassword(currentUser.email, senha);
      } catch (_) {
        setErro('A senha atual está incorreta.');
        setLoading(false);
        return;
      }

      const atualizado = await pb.collection('users').update(currentUser.id, {
        username: value,
      });
      pb.authStore.save(atualizado.token || pb.authStore.token, atualizado);
      setUsernameAtual(value);
      setSenha('');
      setMsg('Nome de usuário atualizado com sucesso!');
    } catch (err) {
      const data = err?.response?.data;
      if (data?.username) {
        setErro('Este nome de usuário já está em uso. Escolha outro.');
        setDisponivel(false);
      } else {
        setErro('Não foi possível alterar o nome de usuário. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Nome de usuário | Conexão Batista</title>
        <meta name="description" content="Visualize e altere seu nome de usuário no Conexão Batista." />
      </Helmet>

      <section className="mx-auto max-w-2xl px-5 py-14 lg:py-20">
        <Link to="/minha-conta" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar para Minha conta
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary"><AtSign size={24} strokeWidth={1.8} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Conta</p>
            <h1 className="font-display text-3xl font-bold text-primary">Nome de usuário</h1>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome de usuário atual</p>
          <p className="mt-1 font-display text-lg font-bold text-foreground">
            {usernameAtual || 'Não definido — crie um agora.'}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            O nome de usuário pode ser usado no lugar do e-mail para entrar. O e-mail continua sendo o principal meio de recuperação e segurança da conta.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          {msg && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p>{msg}</p>
            </div>
          )}
          {erro && (
            <p className="mb-5 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {erro}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Novo nome de usuário *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><AtSign size={16} /></span>
                <input
                  type="text"
                  value={novoUsername}
                  onChange={(e) => setNovoUsername(e.target.value)}
                  placeholder="seu_usuario"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {checando && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                  </span>
                )}
                {!checando && novoUsername.trim() && !formatoErro && disponivel === true && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600"><CheckCircle2 size={16} /></span>
                )}
                {!checando && novoUsername.trim() && !formatoErro && disponivel === false && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive"><X size={16} /></span>
                )}
              </div>

              {/* Regras */}
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {USERNAME_RULES.map((r) => <li key={r}>• {r}</li>)}
              </ul>

              {/* Feedback de validação */}
              {formatoErro && (
                <p className="mt-2 text-xs font-semibold text-destructive">{formatoErro}</p>
              )}
              {!formatoErro && novoUsername.trim() && disponivel === false && (
                <p className="mt-2 text-xs font-semibold text-destructive">Este nome de usuário já está em uso.</p>
              )}
              {!formatoErro && novoUsername.trim() && disponivel === true &&
                novoUsername.trim().toLowerCase() !== (usernameAtual || '').toLowerCase() && (
                <p className="mt-2 text-xs font-semibold text-green-600">Nome de usuário disponível!</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Senha atual *</label>
              <div className="relative">
                <input type={mostrar ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} required placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Necessária para confirmar a alteração.</p>
            </div>

            <button type="submit" disabled={loading || !podeSalvar}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <AtSign size={16} />}
              {loading ? 'Salvando…' : 'Salvar nome de usuário'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
