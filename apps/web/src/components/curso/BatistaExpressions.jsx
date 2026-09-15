import React from 'react';

// Gerencia as expressões faciais do Batista (olhos + boca) conforme o estado.
//
// Estados suportados:
//  - idle: olhos redondos com piscar periódico
//  - thinking: olhos virados para cima (pensativo) + sobrancelhas
//  - talking: olhos atentos + boca animada (movimento)
//  - celebrating: olhos felizes (^) + sorriso
//  - sleeping: olhos fechados (linhas) + boca serena
//
// Cores: azul profundo (#1E3A8A) e dourado (#F59E0B) definidas no SVG pai.

const AZUL = '#1E3A8A';
const DOURADO = '#F59E0B';
const CIANO = '#22D3EE'; // azul ciano brilhante — olhos bem visíveis

export default function BatistaExpressions({ state = 'idle' }) {
  // OLHOS
  const renderEyes = () => {
    switch (state) {
      case 'thinking':
        // Olhos virados para cima com ar pensativo.
        return (
          <>
            <g>
              <ellipse cx="42" cy="46" rx="7" ry="8" fill="#fff" stroke={AZUL} strokeWidth="0.8" />
              <circle cx="42" cy="43" r="3" fill={CIANO} />
            </g>
            <g>
              <ellipse cx="66" cy="46" rx="7" ry="8" fill="#fff" stroke={AZUL} strokeWidth="0.8" />
              <circle cx="66" cy="43" r="3" fill={CIANO} />
            </g>
            {/* sobrancelhas pensativas */}
            <path d="M34 33 Q42 30 50 34" stroke={DOURADO} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M58 34 Q66 30 74 33" stroke={DOURADO} strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        );
      case 'celebrating':
        // Olhos felizes em arco (^) — dourado vibrante.
        return (
          <>
            <path d="M36 48 Q42 40 48 48" stroke={DOURADO} strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M60 48 Q66 40 72 48" stroke={DOURADO} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          </>
        );
      case 'sleeping':
        // Olhos fechados (linhas curvas) — azul profundo.
        return (
          <>
            <path d="M36 46 Q42 50 48 46" stroke={AZUL} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M60 46 Q66 50 72 46" stroke={AZUL} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </>
        );
      case 'talking':
        // Olhos atentos (sem piscar) enquanto fala — ciano brilhante.
        return (
          <>
            <g>
              <ellipse cx="42" cy="46" rx="7" ry="8" fill="#fff" stroke={AZUL} strokeWidth="0.8" />
              <circle cx="42" cy="46" r="3" fill={CIANO} />
            </g>
            <g>
              <ellipse cx="66" cy="46" rx="7" ry="8" fill="#fff" stroke={AZUL} strokeWidth="0.8" />
              <circle cx="66" cy="46" r="3" fill={CIANO} />
            </g>
          </>
        );
      case 'idle':
      default:
        // Olhos redondos com piscar periódico (CSS) — ciano brilhante.
        return (
          <>
            <g className="batista-blink" style={{ transformOrigin: '42px 46px' }}>
              <ellipse cx="42" cy="46" rx="7" ry="8" fill="#fff" stroke={AZUL} strokeWidth="0.8" />
              <circle cx="42" cy="46" r="3" fill={CIANO} />
            </g>
            <g className="batista-blink" style={{ transformOrigin: '66px 46px' }}>
              <ellipse cx="66" cy="46" rx="7" ry="8" fill="#fff" stroke={AZUL} strokeWidth="0.8" />
              <circle cx="66" cy="46" r="3" fill={CIANO} />
            </g>
          </>
        );
    }
  };

  // BOCA
  const renderMouth = () => {
    switch (state) {
      case 'talking':
        // Boca animada (oval que abre/fecha) — azul profundo.
        return (
          <ellipse
            className="batista-talk"
            cx="54" cy="60" rx="6" ry="4.5"
            fill={AZUL}
            style={{ transformOrigin: '54px 60px' }}
          />
        );
      case 'celebrating':
        // Sorriso largo.
        return (
          <path d="M44 58 Q54 68 64 58 Q54 64 44 58 Z" fill={DOURADO} stroke={AZUL} strokeWidth="1.2" />
        );
      case 'sleeping':
        // Boca pequena serena.
        return (
          <path d="M50 60 Q54 62 58 60" stroke={AZUL} strokeWidth="2" fill="none" strokeLinecap="round" />
        );
      case 'thinking':
        // Boca levemente torta (pensativo).
        return (
          <path d="M48 61 Q54 58 60 61" stroke={AZUL} strokeWidth="2" fill="none" strokeLinecap="round" />
        );
      case 'idle':
      default:
        // Sorriso suave.
        return (
          <path d="M47 59 Q54 64 61 59" stroke={AZUL} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        );
    }
  };

  return (
    <g>
      {renderEyes()}
      {renderMouth()}
    </g>
  );
}
