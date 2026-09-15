import React from 'react';
import { X } from 'lucide-react';

// Bolha de fala flutuante (formato de balão de quadrinho) com mensagens
// proativas do Batista após inatividade.
//
// Props:
//  - message: texto exibido na bolha
//  - onClose: callback ao fechar (X) — também some automaticamente após alguns segundos
//  - autoDismissMs: tempo até desaparecer sozinho (default 8000)

export default function BatistaProactiveMessage({ message, onClose, autoDismissMs = 8000 }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(t);
  }, [onClose, autoDismissMs]);

  return (
    <div
      className="batista-bubble-in pointer-events-auto absolute bottom-[5rem] left-0 z-50 w-60 max-w-[80vw] rounded-2xl border border-border bg-white p-3.5 pr-8 text-sm leading-snug text-foreground shadow-xl"
      role="status"
    >
      {/* Bico do balão apontando para baixo-esquerda */}
      <span
        className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b border-r border-border bg-white"
        aria-hidden="true"
      />
      <button
        type="button"
        aria-label="Fechar mensagem"
        onClick={onClose}
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={14} />
      </button>
      <p className="font-medium">{message}</p>
    </div>
  );
}
