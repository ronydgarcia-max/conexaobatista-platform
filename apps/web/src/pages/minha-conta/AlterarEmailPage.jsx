import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';

export default function AlterarEmailPage() {
  const { currentUser, isAuthenticated } = useSubscriptionAuth();
  const navigate = useNavigate();

  const [novoEmail, setNovoEmail] = useState('');
  const [confirmarEmail, setConfirmarEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login?redirect=/minha-conta/alterar-email', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const emailAtual = currentUser?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMsg('');

    const ne = novoEmail.trim().toLowerCase();
    const ce = confirmarEmail.trim().toLowerCase();

    if (!ne || !ce || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (ne !== ce) {
      setErro('O novo e-mail e a confirmação não conferem.');
      return;
    }
    if (ne === emailAtual.toLowerCase()) {
      setErro('O novo e-mail é igual ao e-mail atual.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify the current password by re-authenticating.
      try {
        await pb.collection('users').authWithPassword(emailAtual, senha);
      } catch (_) {
        setErro('A senha atual está incorreta.');
        setLoading(false);
        return;
      }

      // 2. Request the email change — PocketBase sends a confirmation link
      //    to the NEW address. The email only changes after the user clicks it.
      await pb.collection('users').requestEmailChange(ne);

      setMsg(
        'Enviamos um link de confirmação para o novo e-mail. A alteração só será concluída após você acessar o link e confirmar. Até lá, seu e-mail atual continua válido para login e recuperação.',
      );
      setNovoEmail('');
      setConfirmarEmail('');
      setSenha('');
    } catch (err) {
      const data = err?.response?.data;
      if (data?.email) {
        setErro('Este e-mail não pode ser usado. Verifique o endereço informado.');
      } else {
        setErro('Não foi possível solicitar a alteração. Tente novamente.');
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
        <title>Alterar e-mail | Conexão Batista</title>
        <meta name="description" content="Altere o e-mail da sua conta Conexão Batista com confirmação de segurança." />
      </Helmet>

      <section className="mx-auto max-w-2xl px-5 py-14 lg:py-20">
        <Link to="/minha-conta" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar para Minha conta
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary"><Mail size={24} strokeWidth={1.8} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Conta</p>
            <h1 className="font-display text-3xl font-bold text-primary">Alterar e-mail</h1>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Por segurança, a alteração de e-mail exige sua senha atual e a confirmação do novo endereço.
            Enviaremos um <span className="font-semibold text-foreground">link de confirmação</span> para o novo e-mail —
            a troca só acontece após você clicar nesse link.
          </p>
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            <p className="font-semibold text-primary">E-mail atual</p>
            <p className="mt-0.5">{emailAtual || '—'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          {msg && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm leading-relaxed text-green-700">
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
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Novo e-mail *</label>
              <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} required placeholder="novo@email.com"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Confirmar novo e-mail *</label>
              <input type="email" value={confirmarEmail} onChange={(e) => setConfirmarEmail(e.target.value)} required placeholder="repita o novo e-mail"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
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

            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {loading ? 'Enviando…' : 'Enviar link de confirmação'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
