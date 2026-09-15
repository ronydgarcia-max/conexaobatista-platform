import { useCallback, useRef, useState } from 'react';
import pb from '@/lib/pocketbaseClient';

const API_URL = '/hcgi/api/batista/message';

// Token PocketBase no formato esperado pelo backend (base64 do JSON do authStore).
function getAuthHeader() {
  try {
    const raw = localStorage.getItem('pocketbase_auth');
    if (!raw) return null;
    const bytes = new TextEncoder().encode(raw);
    const binary = String.fromCharCode(...bytes);
    return `Bearer ${btoa(binary)}`;
  } catch {
    return null;
  }
}

/**
 * Hook do assistente Batista.
 * @param {object} [options]
 * @param {string} [options.welcome] Mensagem de boas-vindas inicial.
 * @returns {{ messages, isLoading, sendMessage, clearChat, setMessages }}
 */
export function useChat({ welcome = '', context = 'visitante' } = {}) {
  const [messages, setMessages] = useState(() =>
    welcome ? [{ role: 'assistant', content: welcome }] : [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(null);
  const contextRef = useRef(context);
  contextRef.current = context;

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || isLoading) return;

    // Histórico atual (sem a mensagem de boas-vindas repetida) para contexto.
    const history = messages
      .filter((m) => m.content && (m.role === 'user' || m.role === 'assistant'))
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '' },
    ]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const headers = { 'Content-Type': 'application/json' };
      const auth = getAuthHeader();
      if (auth) headers.Authorization = auth;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: trimmed, history, context: contextRef.current }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Não foi possível falar com o Batista agora. Tente novamente em instantes.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const block of events) {
          if (!block.trim()) continue;
          const lines = block.split('\n');
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('data: ')) dataStr += line.slice(6);
          }
          if (!dataStr || dataStr === '[DONE]') continue;

          let parsed;
          try { parsed = JSON.parse(dataStr); } catch { continue; }

          if (parsed.type === 'content') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + (parsed.data?.content || '') };
              }
              return updated;
            });
          } else if (parsed.type === 'error') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const msg = parsed.data?.content || 'Ops! Algo deu errado. Tente novamente. 🙏';
              if (last && last.role === 'assistant' && !last.content) {
                updated[updated.length - 1] = { ...last, content: msg };
              } else {
                updated.push({ role: 'assistant', content: msg });
              }
              return updated;
            });
          } else if (parsed.type === 'completed') {
            // fim do fluxo
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg = err?.message || 'Ops! Algo deu errado. Tente novamente. 🙏';
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = { ...last, content: msg };
        } else {
          updated.push({ role: 'assistant', content: msg });
        }
        return updated;
      });
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  const clearChat = useCallback((welcomeText = '') => {
    if (abortRef.current) abortRef.current.abort();
    setMessages(welcomeText ? [{ role: 'assistant', content: welcomeText }] : []);
    setIsLoading(false);
  }, []);

  const setMessagesDirect = useCallback((updater) => {
    setMessages(updater);
  }, []);

  return { messages, isLoading, sendMessage, clearChat, setMessages: setMessagesDirect };
}

export default useChat;
