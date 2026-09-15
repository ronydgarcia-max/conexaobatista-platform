import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send, Trash2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useChat } from '@/hooks/useChat';
import BatistaCharacter from './BatistaCharacter.jsx';
import BatistaProactiveMessage from './BatistaProactiveMessage.jsx';

// Sugestões iniciais por contexto.
const SUGESTOES = {
  curso: [
    'Como acessar meus cursos?',
    'Onde vejo meu progresso?',
    'Como funciona a matrícula?',
    'Como recuperar minha senha?',
    'Funciona no celular?',
    'Como ser mentor?',
  ],
  logado: [
    'O que é a Conexão Batista?',
    'Como funciona a plataforma de cursos?',
    'Como completar meu perfil?',
    'Como participar da rede?',
    'Como ser mentor?',
    'Funciona no celular?',
  ],
  visitante: [
    'O que é a Conexão Batista?',
    'Como funciona a plataforma de cursos?',
    'Como me cadastro?',
    'Quanto custa participar?',
    'Como participar da rede?',
    'Funciona no celular?',
  ],
};

const MENSAGENS_PROATIVAS = [
  'Posso te ajudar com algo? 🙌',
  'Tá perdido? Me pergunta qualquer coisa!',
  'Quer saber como acessar seus cursos? É só perguntar!',
  'Precisa de ajuda? Estou aqui pra você! 😊',
];

const INATIVIDADE_MS = 30000; // 30 segundos
const DORMIR_MS = 60000; // 60s sem interação → estado "dormindo"

function nomeUsuario() {
  try {
    const rec = pb.authStore.record;
    if (!rec) return '';
    return rec.name || rec.username || (rec.email ? rec.email.split('@')[0] : '');
  } catch {
    return '';
  }
}

function usuarioLogado() {
  try {
    return pb.authStore.isValid && !!pb.authStore.record;
  } catch {
    return false;
  }
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
    </span>
  );
}

export default function ChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  // Detecção de contexto pela rota atual + estado de autenticação.
  const contexto = useMemo(() => {
    if (location.pathname.startsWith('/curso')) return 'curso';
    if (usuarioLogado()) return 'logado';
    return 'visitante';
  }, [location.pathname]);

  const nome = useMemo(nomeUsuario, []);
  const welcome = useMemo(() => {
    const saud = nome ? `Que bom te ver, ${nome}! 🙌` : 'Olá! Que bom te ver por aqui! 🙌';
    const base =
      contexto === 'curso'
        ? 'Eu sou o Batista, seu assistente da Conexão Cursos. Posso te ajudar com cursos, matrículas, progresso, certificados e muito mais.'
        : 'Eu sou o Batista, o assistente da Conexão Batista. Posso te explicar como funciona a rede, a plataforma de cursos, como participar e muito mais.';
    return `${saud} ${base} O que você gostaria de saber?`;
  }, [nome, contexto]);

  const { messages, isLoading, sendMessage, clearChat } = useChat({ welcome, context: contexto });

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Estado visual do personagem.
  // 'idle' | 'thinking' | 'talking' | 'celebrating' | 'sleeping'
  const [charState, setCharState] = useState('idle');
  const [wave, setWave] = useState(false);
  const [proativa, setProativa] = useState(null);

  // Primeira entrada na sessão → aceno com a mão.
  useEffect(() => {
    try {
      const visto = sessionStorage.getItem('batista_acenou');
      if (!visto) {
        setWave(true);
        sessionStorage.setItem('batista_acenou', '1');
        const t = setTimeout(() => setWave(false), 1700);
        return () => clearTimeout(t);
      }
    } catch (_) {
      /* sessionStorage indisponível — segue sem aceno */
    }
  }, []);

  // Estado do personagem acompanha o streaming.
  useEffect(() => {
    if (isLoading) {
      setCharState('thinking');
    } else {
      // Ao terminar, se a última mensagem do assistente tiver conteúdo, "fala" brevemente.
      const ultima = messages[messages.length - 1];
      if (ultima && ultima.role === 'assistant' && ultima.content) {
        setCharState('talking');
        const t = setTimeout(() => setCharState('idle'), 1800);
        return () => clearTimeout(t);
      }
      setCharState('idle');
    }
  }, [isLoading, messages]);

  // Rolar para o fim ao receber mensagens.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Foco no input ao abrir.
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Timer de inatividade → bolha proativa + estado dormindo.
  // Reseta ao interagir com o chat ou navegar para outra página.
  const inatividadeRef = useRef(null);
  const dormirRef = useRef(null);

  const resetarInatividade = () => {
    setProativa(null);
    setCharState((s) => (s === 'sleeping' ? 'idle' : s));
    if (inatividadeRef.current) clearTimeout(inatividadeRef.current);
    if (dormirRef.current) clearTimeout(dormirRef.current);
    inatividadeRef.current = setTimeout(() => {
      // Só mostra bolha proativa se o chat estiver fechado.
      setOpen((prevOpen) => {
        if (!prevOpen) {
          const msg = MENSAGENS_PROATIVAS[Math.floor(Math.random() * MENSAGENS_PROATIVAS.length)];
          setProativa(msg);
        }
        return prevOpen;
      });
    }, INATIVIDADE_MS);
    dormirRef.current = setTimeout(() => {
      setOpen((prevOpen) => {
        if (!prevOpen) setCharState('sleeping');
        return prevOpen;
      });
    }, DORMIR_MS);
  };

  useEffect(() => {
    resetarInatividade();
    return () => {
      if (inatividadeRef.current) clearTimeout(inatividadeRef.current);
      if (dormirRef.current) clearTimeout(dormirRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleSend = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
    resetarInatividade();
  };

  const handleSuggestion = (text) => {
    if (isLoading) return;
    sendMessage(text);
    resetarInatividade();
  };

  const handleClear = () => {
    clearChat(welcome);
    resetarInatividade();
  };

  const handleOpen = (v) => {
    setOpen(v);
    if (v) {
      setProativa(null);
      setCharState((s) => (s === 'sleeping' ? 'idle' : s));
      resetarInatividade();
    }
  };

  const showSuggestions = messages.length <= 1 && !isLoading;
  const sugestoes = SUGESTOES[contexto] || SUGESTOES.visitante;

  return (
    <>
      {/* Botão flutuante com o personagem animado — canto inferior esquerdo */}
      <div className="fixed bottom-5 left-5 z-[60] lg:bottom-7 lg:left-7">
        {!open && proativa && (
          <BatistaProactiveMessage message={proativa} onClose={() => setProativa(null)} />
        )}
        <button
          type="button"
          aria-label={open ? 'Fechar Batista' : 'Falar com o Batista'}
          onClick={() => handleOpen(!open)}
          className="batista-fab relative grid h-[70px] w-[70px] place-items-center rounded-full bg-white shadow-lg ring-2 ring-accent transition-transform hover:scale-105 active:scale-95"
        >
          {open ? (
            <X size={28} className="text-primary" />
          ) : (
            <BatistaCharacter state={charState} wave={wave} size={56} />
          )}
          {!open && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-accent" />
            </span>
          )}
        </button>
      </div>

      {/* Painel do chat — abre a partir do canto inferior esquerdo */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:left-5 sm:h-[34rem] sm:w-[24rem] sm:rounded-2xl sm:border sm:border-border lg:left-7"
          role="dialog"
          aria-label="Chat com o Batista"
        >
          {/* Cabeçalho com o personagem */}
          <div className="flex items-center gap-3 rounded-t-2xl bg-primary px-4 py-3 text-primary-foreground">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-accent/40">
              <BatistaCharacter state={isLoading ? 'thinking' : 'idle'} size={34} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold leading-tight">Batista</p>
              <p className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {isLoading ? 'digitando…' : 'online'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Limpar conversa"
              onClick={handleClear}
              disabled={isLoading || messages.length <= 1}
              className="grid h-9 w-9 place-items-center rounded-lg text-primary-foreground/80 transition-colors hover:bg-white/15 disabled:opacity-40"
            >
              <Trash2 size={18} />
            </button>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => handleOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-lg text-primary-foreground/80 transition-colors hover:bg-white/15 sm:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mensagens */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-4 py-4">
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              const isLast = i === messages.length - 1;
              const showTyping = !isUser && isLoading && isLast && !m.content;
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-white text-foreground ring-1 ring-border'
                    }`}
                  >
                    {showTyping ? <TypingDots /> : m.content}
                  </div>
                </div>
              );
            })}

            {showSuggestions && (
              <div className="pt-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sugestões
                </p>
                <div className="flex flex-wrap gap-2">
                  {sugestoes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSuggestion(s)}
                      className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Entrada */}
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border bg-white px-3 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva sua mensagem…"
              disabled={isLoading}
              className="flex-1 rounded-full border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-white disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Enviar"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
