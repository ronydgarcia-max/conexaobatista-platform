import React from 'react';
import BatistaExpressions from './BatistaExpressions.jsx';

// Personagem visual do Batista — robô SVG simpático com animações.
//
// Props:
//  - state: 'idle' | 'thinking' | 'talking' | 'celebrating' | 'sleeping'
//  - wave: boolean — anima um aceno com o braço (primeira entrada da sessão)
//  - size: número (px) — largura do SVG (default 56)
//
// Paleta: azul profundo (#1E3A8A) + dourado (#F59E0B).
// Animações GPU-accelerated (transform/opacity) definidas em index.css.

const AZUL = '#1E3A8A';
const AZUL_CLARO = '#3B5BDB';
const DOURADO = '#F59E0B';
const PRATA = '#E8EDF5'; // corpo branco/prata claro
const PRATA_ESCURA = '#C7D2E0'; // sombreado do corpo
const VERMELHO = '#EF4444'; // coração vermelho vibrante
const VERMELHO_ESCURO = '#DC2626';

// Classe de pulsação do coração conforme o estado.
function heartClass(state) {
  switch (state) {
    case 'thinking':
      return 'batista-heart-thinking';
    case 'celebrating':
      return 'batista-heart-celebrate';
    case 'sleeping':
      return 'batista-heart-sleeping';
    default:
      return 'batista-heart';
  }
}

function heartGlowClass(state) {
  switch (state) {
    case 'thinking':
      return 'batista-heart-glow-thinking';
    case 'celebrating':
      return 'batista-heart-glow-celebrate';
    case 'sleeping':
      return 'batista-heart-glow-sleeping';
    default:
      return 'batista-heart-glow';
  }
}

export default function BatistaCharacter({ state = 'idle', wave = false, size = 56 }) {
  return (
    <div
      className={`relative ${state === 'sleeping' ? '' : 'batista-float'} batista-glow`}
      style={{ width: size, height: size * 1.15 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 108 124"
        width={size}
        height={size * 1.15}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Definições de gradiente para profundidade (iluminação suave) */}
        <defs>
          <linearGradient id="batista-body-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor={PRATA} />
            <stop offset="100%" stopColor={PRATA_ESCURA} />
          </linearGradient>
          <linearGradient id="batista-head-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor={PRATA} />
            <stop offset="100%" stopColor={PRATA_ESCURA} />
          </linearGradient>
          <radialGradient id="batista-heart-grad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="45%" stopColor={VERMELHO} />
            <stop offset="100%" stopColor={VERMELHO_ESCURO} />
          </radialGradient>
          <radialGradient id="batista-heart-glow-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={VERMELHO} stopOpacity="0.7" />
            <stop offset="100%" stopColor={VERMELHO} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sombra externa projetada abaixo (flutuação) */}
        <ellipse cx="54" cy="118" rx="22" ry="3.5" fill="#1E3A8A" opacity="0.18" />

        {/* Antena — dourado com brilho */}
        <line x1="54" y1="14" x2="54" y2="4" stroke={DOURADO} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="54" cy="4" r="3.4" fill={DOURADO} className="batista-antenna-glow">
          {state === 'thinking' && (
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          )}
        </circle>

        {/* Braço esquerdo (estático) — prata com contorno azul */}
        <rect x="20" y="74" width="9" height="20" rx="4.5" fill="url(#batista-body-grad)" stroke={AZUL} strokeWidth="1.4" transform="rotate(12 24.5 84)" />

        {/* Braço direito (acena quando wave=true) — prata com contorno azul */}
        <g
          className={wave ? 'batista-wave' : ''}
          style={{ transformOrigin: '88px 78px' }}
          transform="rotate(-12 88 78)"
        >
          <rect x="79" y="74" width="9" height="20" rx="4.5" fill="url(#batista-body-grad)" stroke={AZUL} strokeWidth="1.4" />
        </g>

        {/* Corpo (arredondado) — gradiente prata com contorno azul profundo */}
        <rect x="30" y="70" width="48" height="40" rx="16" fill="url(#batista-body-grad)" stroke={AZUL} strokeWidth="1.8" />
        {/* Sombra interna inferior do corpo (volume) */}
        <rect x="32" y="98" width="44" height="10" rx="12" fill={PRATA_ESCURA} opacity="0.45" />
        {/* Reflexo superior do corpo (iluminação) */}
        <rect x="34" y="73" width="40" height="8" rx="8" fill="#fff" opacity="0.5" />

        {/* Glow vermelho do coração (acompanha pulsação) */}
        <circle cx="54" cy="88" r="11" fill="url(#batista-heart-glow-grad)" className={heartGlowClass(state)} />

        {/* Coração pulsante vermelho — centralizado no torso */}
        <g className={heartClass(state)} style={{ transformOrigin: '54px 88px' }}>
          <path
            d="M54 93 C49 88 44 85 44 80.5 C44 77.5 46.5 75 49.5 75 C51.5 75 53 76 54 77.5 C55 76 56.5 75 58.5 75 C61.5 75 64 77.5 64 80.5 C64 85 59 88 54 93 Z"
            fill="url(#batista-heart-grad)"
            stroke={VERMELHO_ESCURO}
            strokeWidth="0.6"
          />
          {/* Brilho superior do coração (reflexo de luz) */}
          <ellipse cx="50" cy="79" rx="2.2" ry="1.4" fill="#fff" opacity="0.55" />
        </g>

        {/* Cabeça (arredondada) — gradiente prata com contorno azul profundo */}
        <rect x="26" y="22" width="56" height="48" rx="20" fill="url(#batista-head-grad)" stroke={AZUL} strokeWidth="1.8" />
        {/* Brilho superior da cabeça (reflexo de luz) */}
        <rect x="30" y="26" width="48" height="12" rx="10" fill="#fff" opacity="0.55" />

        {/* "Tela" do rosto (área clara onde ficam olhos e boca) — contorno dourado */}
        <rect x="32" y="32" width="44" height="34" rx="14" fill="#FFFFFF" stroke={DOURADO} strokeWidth="1.2" />

        {/* Expressões faciais contextuais */}
        <BatistaExpressions state={state} />

        {/* Bochechas douradas (toque carismático) */}
        <circle cx="34" cy="58" r="2.4" fill={DOURADO} opacity="0.7" />
        <circle cx="74" cy="58" r="2.4" fill={DOURADO} opacity="0.7" />

        {/* ZZZ quando dormindo */}
        {state === 'sleeping' && (
          <g fill={DOURADO} fontWeight="700" fontFamily="Montserrat, sans-serif">
            <text x="78" y="20" fontSize="9" className="batista-zzz" style={{ animationDelay: '0s' }}>z</text>
            <text x="84" y="14" fontSize="11" className="batista-zzz" style={{ animationDelay: '0.8s' }}>z</text>
            <text x="90" y="8" fontSize="13" className="batista-zzz" style={{ animationDelay: '1.6s' }}>Z</text>
          </g>
        )}

        {/* Confete/estrelas quando comemorando */}
        {state === 'celebrating' && (
          <g>
            <rect x="14" y="30" width="3" height="3" fill={DOURADO} className="batista-confetti" style={{ transformOrigin: '15.5px 31.5px', animationDelay: '0s' }} />
            <rect x="92" y="26" width="3" height="3" fill={AZUL_CLARO} className="batista-confetti" style={{ transformOrigin: '93.5px 27.5px', animationDelay: '0.15s' }} />
            <circle cx="10" cy="50" r="2" fill={DOURADO} className="batista-confetti" style={{ transformOrigin: '10px 50px', animationDelay: '0.3s' }} />
            <circle cx="98" cy="48" r="2" fill={AZUL_CLARO} className="batista-confetti" style={{ transformOrigin: '98px 48px', animationDelay: '0.45s' }} />
            <rect x="20" y="18" width="3" height="3" fill={DOURADO} className="batista-confetti" style={{ transformOrigin: '21.5px 19.5px', animationDelay: '0.6s' }} />
          </g>
        )}
      </svg>
    </div>
  );
}
