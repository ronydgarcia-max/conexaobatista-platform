// Relatório de IMPLEMENTAÇÃO — LOGO INSTITUCIONAL: PNG TRANSPARENTE E MARCA ÚNICA
// (10/09/2026). GET /relatorio-logo-transparencia/download
//
// Documenta as alterações EXCLUSIVAS de identidade visual e gerenciamento do
// logo: aceitar/usar PNG com fundo transparente (preservando a transparência
// sobre o fundo azul do site), remover o texto duplicado ao lado do logo no
// cabeçalho (logo institucional como único elemento de marca), ajustar a
// altura responsiva para equivaler à escrita anterior (sem distorção, desktop
// e celular), manter o logo padrão atual como fallback quando não há PNG
// personalizado e aplicar o logo configurado nas áreas públicas que já exibem
// a identidade institucional. Não altera páginas, rotas, autenticação, cursos,
// Área do Aluno, Painel do Mentor, integrações, API da VPS nem publicação.

import logger from '../utils/logger.js';

function montarRelatorio() {
  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return [
    '================================================================================',
    'RELATÓRIO DE IMPLEMENTAÇÃO — LOGO INSTITUCIONAL',
    'PNG transparente, marca única e altura equivalente à escrita',
    '================================================================================',
    '',
    `Data/hora da geração (Brasília): ${dataHora}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. RESUMO EXECUTIVO',
    '--------------------------------------------------------------------------------',
    'OBJETIVO: ajustar EXCLUSIVAMENTE a identidade visual e o gerenciamento do',
    '          logo institucional, sem alterar páginas, rotas, autenticação,',
    '          cursos, Área do Aluno, Painel do Mentor, integrações, API da VPS',
    '          ou publicação.',
    '',
    'ALTERAÇÕES APLICADAS:',
    '  1) Upload e uso de PNG com fundo transparente preservados — o PocketBase',
    '     serve o arquivo original (mimeTypes já inclui image/png) e o <img> do',
    '     cabeçalho não impõe fundo, então a transparência se integra ao fundo',
    '     azul do site (sem caixa branca).',
    '  2) Remoção do texto duplicado ao lado do logo no cabeçalho — quando há',
    '     logo personalizado, ele é o ÚNICO elemento de marca (o texto',
    '     "ConexãoBatista" deixa de ser renderizado ao lado).',
    '  3) Altura visual equivalente à escrita anterior, responsiva e sem',
    '     distorção — h-7 (28px) no celular e h-8 (32px) no desktop, com',
    '     w-auto + object-contain (proporção preservada).',
    '  4) Fallback mantido — quando não há logo personalizado, o logo padrão',
    '     atual (emblema SVG + texto "ConexãoBatista") continua sendo exibido.',
    '  5) Logo aplicado nas áreas públicas que já exibem a identidade',
    '     institucional (cabeçalho e rodapé — Brand).',
    '',
    '--------------------------------------------------------------------------------',
    '2. COMPONENTES E CONFIGURAÇÕES AJUSTADOS',
    '--------------------------------------------------------------------------------',
    'apps/web/src/components/SiteLayout.jsx',
    '  * InstitutionalLogo({ className }): a <img> do logo personalizado passou a',
    '    usar altura responsiva h-7 sm:h-8 (28/32px) — equivalente à altura da',
    '    escrita anterior (text-lg ≈ 18px) com folga para legibilidade — e',
    '    max-w-[220px] para evitar estouro do cabeçalho. w-auto + object-contain',
    '    preservam a proporção (sem distorção). A transparência do PNG é',
    '    preservada (nenhum fundo é imposto sobre a imagem).',
    '  * Brand({ onDark, compact }): quando há logo personalizado (logoUrl),',
    '    renderiza APENAS o <InstitutionalLogo/> — o texto "ConexãoBatista" é',
    '    removido, eliminando a duplicação (o logo é o único elemento de marca).',
    '    Quando não há logo personalizado, mantém o fallback padrão atual',
    '    (emblema SVG + texto "ConexãoBatista").',
    '',
    'apps/web/src/pages/adm/LogoInstitucionalPage.jsx',
    '  * Texto de orientação do upload reescrito para destacar o PNG com fundo',
    '    transparente como formato recomendado (a transparência é preservada e',
    '    o logo se integra ao fundo azul sem caixa branca).',
    '  * Mensagem de validação de tipo atualizada (PNG, SVG, JPG ou WebP).',
    '  * O atributo `accept` do <input type="file"> já inclui image/png',
    '    (image/jpeg,image/png,image/webp,image/svg+xml) — sem alteração funcional.',
    '',
    'apps/pocketbase/pb_migrations/1789062072_create_config_logo.js',
    '  * Sem alteração — a coleção config_logo já aceita image/png (mimeTypes:',
    '    image/jpeg, image/png, image/webp, image/svg+xml). O PocketBase',
    '    armazena e serve o arquivo original, preservando a transparência do',
    '    PNG. Nenhuma migração nova foi necessária.',
    '',
    'apps/web/src/contexts/InstitutionalLogoContext.jsx',
    '  * Sem alteração — já carrega o registro mais recente e expõe a URL do',
    '    arquivo original via pb.files.getURL(rec, nome), preservando a',
    '    transparência. Atualização em tempo real (realtime) mantida.',
    '',
    '--------------------------------------------------------------------------------',
    '3. TRANSPARÊNCIA PNG — COMO É PRESERVADA',
    '--------------------------------------------------------------------------------',
    '  * O upload envia o arquivo PNG original ao PocketBase (coleção',
    '    config_logo, campo `logo`). O PocketBase grava o binário original em',
    '    seu armazenamento de arquivos.',
    '  * O contexto monta a URL do arquivo ORIGINAL (pb.files.getURL), não uma',
    '    miniatura processada. O navegador recebe o PNG com o canal alfa',
    '    intacto.',
    '  * O <img> no cabeçalho/rodapé não recebe fundo (sem bg-* na classe),',
    '    então os pixels transparentes do PNG mostram o fundo azul do',
    '    cabeçalho/rodapé — o logo se integra visualmente, sem caixa branca.',
    '',
    '--------------------------------------------------------------------------------',
    '4. ALTURA VISUAL E RESPONSIVIDADE',
    '--------------------------------------------------------------------------------',
    '  * Logo personalizado: h-7 (28px) no celular, h-8 (32px) no desktop.',
    '    Equivale à altura da escrita anterior (text-lg ≈ 18px, leading-none)',
    '    com folga para legibilidade do logo. Largura acompanha a proporção',
    '    original (w-auto + object-contain) — sem distorção, sem corte.',
    '  * max-w-[220px] evita que logos muito largos estourem o cabeçalho.',
    '  * Fallback (emblema + texto): h-8 sm:h-9 — inalterado.',
    '',
    '--------------------------------------------------------------------------------',
    '5. ONDE O LOGO É APLICADO',
    '--------------------------------------------------------------------------------',
    '  * Cabeçalho público (Header → Brand): todas as áreas públicas que usam',
    '    o SiteLayout.',
    '  * Rodapé público (Footer → Brand): mesma identidade institucional.',
    '  * Quando há logo personalizado, ambas as áreas mostram APENAS o logo',
    '    (sem texto duplicado). Quando não há, ambas mostram o fallback padrão.',
    '',
    '--------------------------------------------------------------------------------',
    '6. O QUE NÃO FOI ALTERADO',
    '--------------------------------------------------------------------------------',
    '  * Páginas, rotas, autenticação (PocketBase users + admins), SSO.',
    '  * Cursos, Área do Aluno, Painel do Mentor (VPS via SSO).',
    '  * Integrações, API da VPS, proxies e endpoints existentes.',
    '  * Banco/schema existente — nenhuma coleção foi modificada; a coleção',
    '    config_logo (já existente) continua aceitando PNG.',
    '  * Layout, estilos e responsividade existentes — preservados; o',
    '    cabeçalho mantém a mesma silhueta, apenas sem o texto duplicado ao',
    '    lado do logo quando há logo personalizado.',
    '  * Publicação — site NÃO publicado.',
    '',
    '--------------------------------------------------------------------------------',
    '7. VALIDAÇÃO',
    '--------------------------------------------------------------------------------',
    'VALIDAÇÃO POR INSPEÇÃO DE CÓDIGO (COMPROVADA):',
    '  * Brand renderiza APENAS o <img> quando logoUrl existe (sem texto).',
    '  * InstitutionalLogo usa h-7 sm:h-8 + w-auto + object-contain (sem',
    '    distorção) e nenhum fundo sobre a imagem (transparência preservada).',
    '  * Fallback (emblema + texto) mantido quando não há logoUrl.',
    '  * A coleção config_logo já aceita image/png; o contexto serve o',
    '    arquivo original.',
    '',
    'VALIDAÇÃO AUTENTICADA AO VIVO (NÃO COMPROVADA):',
    '  * Requer sessão admin: enviar um PNG transparente, confirmar a prévia',
    '    sobre o fundo azul, verificar o cabeçalho/rodapé público (desktop e',
    '    celular) sem texto duplicado e sem caixa branca, e remover para',
    '    voltar ao fallback.',
    '',
    'Nenhum segredo, token ou credencial é exposto neste relatório.',
    '',
    '================================================================================',
    'Fim do Relatório — Logo Institucional (PNG transparente e marca única)',
    '================================================================================',
    '',
  ].join('\n');
}

export default function relatorioLogoTransparencia(req, res) {
  try {
    const corpo = montarRelatorio();
    const nome = 'relatorio-logo-transparencia-10-09-2026.txt';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.status(200).send(corpo);
  } catch (err) {
    logger.error('Falha ao gerar Relatório Logo Transparência', { err: err?.message });
    res.status(500).json({ error: 'Não foi possível gerar o relatório.' });
  }
}
