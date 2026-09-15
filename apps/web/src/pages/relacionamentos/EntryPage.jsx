import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Heart, AlertTriangle, Lock, ArrowRight, Users, Check, BookOpen, MessageSquare, Sparkles, Shield, Sprout, Loader2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';

export default function RelacionamentosEntryPage() {
  const navigate = useNavigate();
  const isAuthed = pb.authStore.isValid;

  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [confirmaIdade, setConfirmaIdade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // ----- Acessar Corações Conectados (SSO via GET ?token=) -----
  const [acessandoCoracoes, setAcessandoCoracoes] = useState(false);
  const [erroCoracoes, setErroCoracoes] = useState('');

  const acessarCoracoesConectados = async () => {
    if (!isAuthed) {
      navigate('/login?redirect=/relacionamentos');
      return;
    }
    setAcessandoCoracoes(true);
    setErroCoracoes('');
    try {
      const pbToken = pb.authStore.token;
      if (!pbToken) {
        throw new Error('Sua sessão expirou. Faça login novamente.');
      }
      const res = await apiServerClient.fetch('/coracoes-sso-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pbToken}` },
      });
      let data = null;
      const text = await res.text().catch(() => '');
      try { data = text ? JSON.parse(text) : null; } catch (_) { data = text || null; }
      if (!res.ok || !data?.token) {
        let mensagem = 'Não foi possível gerar a credencial para o Corações Conectados. Tente novamente.';
        if (typeof data === 'string' && data) mensagem = data;
        else if (data?.error) mensagem = data.error;
        if (res.status === 401) mensagem = 'Sua sessão expirou. Faça login novamente.';
        throw new Error(mensagem);
      }
      window.location.href = `https://coracoes.conexaobatista.com.br?token=${encodeURIComponent(data.token)}`;
    } catch (e) {
      setErroCoracoes(e?.message || 'Erro inesperado ao acessar o Corações Conectados.');
      setAcessandoCoracoes(false);
    }
  };

  const handleEntrar = async () => {
    if (!aceitaTermos || !confirmaIdade) { setErro('Você precisa aceitar os termos e confirmar a maioridade para continuar.'); return; }
    if (!isAuthed) { navigate('/login?redirect=/relacionamentos'); return; }
    setLoading(true);
    setErro('');
    try {
      // Upsert consent: try create, if duplicate (409) it already exists
      await pb.collection('rel_consentimentos').create({
        owner: pb.authStore.record.id,
        aceito_termos: true,
        confirmou_idade: true,
      }).catch(async (err) => {
        // If already exists, just update
        if (err?.status === 400 || err?.status === 409) {
          const existing = await pb.collection('rel_consentimentos').getList(1, 1, {
            filter: pb.filter('owner = {:id}', { id: pb.authStore.record.id }),
          });
          if (existing.totalItems > 0) {
            await pb.collection('rel_consentimentos').update(existing.items[0].id, { aceito_termos: true, confirmou_idade: true });
          }
        } else { throw err; }
      });
      sessionStorage.setItem('rel_consented', '1');
      navigate('/relacionamentos/descobrir');
    } catch {
      setErro('Não foi possível registrar o consentimento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-centered">
      <Helmet>
        <title>Relacionamentos | Conexão Batista</title>
        <meta name="description" content="Área exclusiva para membros batistas autenticados interessados em conexões genuínas." />
      </Helmet>
      <div className="mx-auto max-w-2xl px-5 py-16 lg:px-0">
        {/* Hero */}
        <div className="mb-8 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent mb-4">
            <Heart size={32} strokeWidth={1.6} />
          </span>
          <h1 className="font-display text-4xl font-extrabold text-primary">Relacionamentos</h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Um espaço seguro para batistas que buscam conexões genuínas, fundamentadas na fé e no respeito cristão.
          </p>
        </div>

        {/* Safety warning */}
        <div className="mb-6 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={20} />
            <div>
              <p className="font-display text-sm font-bold text-amber-800">Aviso de segurança</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-700">
                Esta área é exclusiva para maiores de 18 anos e membros verificados. Toda interação deve respeitar os princípios bíblicos e a dignidade de cada pessoa. Casos de assédio ou comportamento inadequado serão reportados e resultarão em suspensão permanente.
              </p>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Heart, t: 'Conexões genuínas', d: 'Encontre irmãos com valores e intenções compatíveis.' },
            { icon: ShieldCheck, t: 'Ambiente moderado', d: 'Perfis verificados. Denúncias levadas a sério.' },
            { icon: Lock, t: 'Privacidade real', d: 'Você controla quem vê seu perfil e suas informações.' },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-border bg-white p-5">
              <c.icon className="text-primary mb-3" size={22} strokeWidth={1.8} />
              <p className="font-display text-sm font-bold text-primary">{c.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        {/* Consent form */}
        <div className="rounded-2xl border border-border bg-white p-7 shadow-sm text-left">
          <p className="font-display text-lg font-bold text-primary mb-5">Para continuar, confirme abaixo:</p>

          <div className="space-y-4 mb-6">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 hover:bg-muted/40 transition-colors">
              <input type="checkbox" checked={confirmaIdade} onChange={(e) => setConfirmaIdade(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Confirmo que tenho 18 anos ou mais</p>
                <p className="text-xs text-muted-foreground mt-0.5">Esta área é restrita a maiores de idade, conforme nossa política.</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 hover:bg-muted/40 transition-colors">
              <input type="checkbox" checked={aceitaTermos} onChange={(e) => setAceitaTermos(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Li e aceito a{' '}
                  <Link to="/relacionamentos/privacidade" className="text-primary underline" target="_blank">
                    Política de Privacidade para Relacionamentos
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Concordo em usar esta área com respeito, honestidade e dentro dos princípios cristãos.</p>
              </div>
            </label>
          </div>

          {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{erro}</p>}

          {isAuthed ? (
            <button onClick={handleEntrar} disabled={loading || (!aceitaTermos || !confirmaIdade)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-display font-bold text-primary-foreground transition-opacity disabled:opacity-50">
              {loading ? 'Aguarde…' : <><span>Entrar na área de Relacionamentos</span><ArrowRight size={18} /></>}
            </button>
          ) : (
            <div className="space-y-3">
              <button onClick={() => navigate('/login?redirect=/relacionamentos')}
                className="w-full rounded-xl bg-primary py-4 font-display font-bold text-primary-foreground">
                Entrar na minha conta
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Não tem conta?{' '}
                <Link to="/cadastro" className="font-semibold text-primary hover:underline">Criar conta grátis</Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Seção Corações Conectados (SSO para o app externo) */}
      <div className="mx-auto max-w-2xl px-5 pb-16 lg:px-0">
        <div className="rounded-2xl border border-accent/30 bg-white p-7 shadow-sm text-left">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Heart size={24} strokeWidth={1.6} />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-primary">Corações Conectados</p>
              <p className="text-xs text-muted-foreground">Aplicativo de relacionamento</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Conecte-se ao aplicativo de relacionamento <span className="font-semibold text-foreground">Corações Conectados</span> com autenticação segura (credencial válida por 10 minutos).
          </p>

          {erroCoracoes && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{erroCoracoes}</span>
            </div>
          )}

          <button
            type="button"
            onClick={acessarCoracoesConectados}
            disabled={acessandoCoracoes}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-display font-bold text-accent-foreground transition-opacity disabled:opacity-50"
          >
            {acessandoCoracoes ? (
              <><Loader2 size={18} className="animate-spin" /> Gerando credencial…</>
            ) : (
              <><Heart size={18} /> Acessar Corações Conectados</>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo complementar */}
      <div className="mx-auto max-w-[80rem] px-5 pb-20 lg:px-10">
        {/* Intro */}
        <section className="rounded-3xl bg-primary px-7 py-12 text-primary-foreground sm:px-12">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Encontre alguém que caminha na mesma fé</h2>
          <p className="mt-5 mx-auto max-w-3xl text-base leading-relaxed text-primary-foreground/85">
            Sabemos que um dos desejos mais profundos do coração humano é encontrar um companheiro ou companheira para a vida. E para o cristão, esse desejo ganha uma dimensão ainda mais especial: a busca por alguém que compartilhe não apenas sonhos e projetos, mas também a fé, os valores e o propósito de viver para Cristo.
          </p>
          <p className="mt-4 mx-auto max-w-3xl text-base leading-relaxed text-primary-foreground/85">
            O Corações Conectados é um espaço seguro, respeitoso e com propósito dentro do Conexão Batista, para irmãos solteiros, viúvos e divorciados que desejam construir um relacionamento sério, com vistas ao casamento, dentro dos princípios bíblicos. Aqui, você não vai encontrar perfis superficiais ou propostas passageiras. Vai encontrar pessoas reais, validadas e comprometidas com a fé, que também buscam um relacionamento com significado e eternidade.
          </p>
        </section>

        {/* Para quem é */}
        <section className="mt-16">
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Para quem é este espaço</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Users, t: 'Solteiros', d: 'Que desejam um relacionamento com propósito de casamento.' },
              { icon: Heart, t: 'Viúvos e viúvas', d: 'Que sentem o desejo de recomeçar.' },
              { icon: Sparkles, t: 'Divorciados', d: 'Que buscam uma nova chance de construir uma família segundo Deus.' },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <c.icon className="text-primary mb-3" size={22} strokeWidth={1.8} />
                <p className="font-display text-base font-bold text-primary">{c.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Por que */}
        <section className="mt-16 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Por que fazer isso aqui?</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Mesmos valores, propósito claro</h2>
          </div>
          <ul className="space-y-3">
            {[
              'Segurança e confiança, todos os perfis são validados',
              'Mesmos valores, fé, visão de família e princípios alinhados',
              'Propósito claro, não é app de encontros, é para quem busca casamento',
              'Acolhimento pastoral, cada história tratada com respeito',
              'Comunidade ao redor, apoio de irmãos maduros na fé',
            ].map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Privacidade */}
        <section className="mt-16 rounded-3xl border border-border bg-white p-8 shadow-sm lg:p-10">
          <div className="flex items-center justify-center gap-3">
            <Lock className="text-accent" size={24} />
            <h2 className="font-display text-2xl font-bold text-primary sm:text-3xl">Sua privacidade em primeiro lugar</h2>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-primary/5 p-6">
              <Shield className="text-primary mb-3" size={22} strokeWidth={1.8} />
              <p className="font-display text-base font-bold text-primary">Criptografia de ponta a ponta</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Apenas você e a pessoa com quem conversa têm acesso às mensagens. Nem mesmo o Conexão Batista lê suas conversas.</p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-6">
              <Sparkles className="text-primary mb-3" size={22} strokeWidth={1.8} />
              <p className="font-display text-base font-bold text-primary">Moderação inteligente com IA</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Atua como guardiã, analisando padrões de comportamento sem acessar o conteúdo das conversas. A análise ocorre no próprio dispositivo, antes da criptografia.</p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-6">
              <MessageSquare className="text-primary mb-3" size={22} strokeWidth={1.8} />
              <p className="font-display text-base font-bold text-primary">Denúncia manual</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Botão de denúncia direto na conversa. Moderadores capacitados analisam cada caso.</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5">
            <p className="font-display text-sm font-bold text-amber-800">A IA emite alertas para:</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                'Assédio, insistência excessiva, mensagens invasivas',
                'Linguagem imprópria, ofensas, baixo calão',
                'Conteúdo sexual explícito',
                'Tentativas de golpe, pedidos de dinheiro',
                'Comportamento predatório, manipulação, chantagem',
                'Contato externo precoce, sair da plataforma antes da confiança',
              ].map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm text-amber-700">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" /> <span>{a}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-amber-700">
              Quando um alerta é acionado, um moderador humano é notificado apenas sobre aquele trecho. Nenhum moderador tem acesso livre às conversas. Privacidade protegida.
            </p>
          </div>
        </section>

        {/* Como funciona + Princípios */}
        <section className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16 text-left">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Como funciona</p>
            <ol className="mt-6 space-y-5">
              {[
                'Preencha seu perfil de relacionamento',
                'Conheça outros perfis (filtre por idade, cidade, profissão)',
                'Conecte-se com respeito, recomendamos acompanhamento pastoral',
                'Caminhe com propósito, conteúdos sobre namoro cristão e casamento',
              ].map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">{i + 1}</span>
                  <p className="pt-1 text-sm leading-relaxed text-foreground">{s}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-3xl border border-border bg-muted/40 p-8">
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Nossos princípios</p>
            <ul className="mt-6 space-y-3">
              {[
                'Casamento é instituição de Deus',
                'Jugo igual, “Não vos ponhais em jugo desigual com os incrédulos” (2 Coríntios 6:14)',
                'Pureza e honra',
                'Acompanhamento pastoral',
                'Cada história importa, Deus é especialista em recomeços',
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                  <BookOpen size={18} className="mt-0.5 shrink-0 text-accent" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Fundamentação bíblica */}
        <section className="mt-16">
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Fundamentação bíblica</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              { ref: 'Gênesis 2:18', texto: 'Não é bom que o homem esteja só…' },
              { ref: 'Colossenses 3:14', texto: 'Acima de tudo, revistam-se do amor…' },
              { ref: 'Provérbios 5:18', texto: 'Alegra-te com a esposa da tua mocidade.' },
            ].map((b) => (
              <figure key={b.ref} className="rounded-2xl border-l-4 border-accent bg-white p-6 shadow-sm">
                <blockquote className="font-display text-sm font-semibold italic leading-relaxed text-primary">“{b.texto}”</blockquote>
                <figcaption className="mt-3 text-xs font-bold text-accent">— {b.ref}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Palavra de cuidado */}
        <section className="mt-16 rounded-3xl bg-primary px-7 py-12 text-primary-foreground sm:px-12">
          <div className="flex items-center justify-center gap-3">
            <Sprout className="text-accent" size={24} />
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Uma palavra de cuidado</h2>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              'O tempo de Deus é perfeito',
              'Você é completo em Cristo',
              'Cuide do seu coração',
              'Busque sabedoria, envolva pastores, pais, mentores',
              'Seja íntegro, seja a pessoa que gostaria de encontrar',
            ].map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-primary-foreground/90">
                <Check size={18} className="mt-0.5 shrink-0 text-accent" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
