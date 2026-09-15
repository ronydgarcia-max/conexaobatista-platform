import React, { useState, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  Download, Loader2, AlertCircle, CheckCircle2, FileText,
  ShieldCheck, ShieldAlert, Settings, Stethoscope, KeyRound,
  LogIn, ImagePlus, Route, RefreshCw, KeySquare, Lock, Rocket,
  LayoutDashboard, Database, Globe, Users, Search, UserCircle,
  GraduationCap, Heart, Palette, Link2, History, CalendarDays, Wrench,
  Presentation, Menu, ClipboardCheck, Image as ImageIcon,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

/**
 * Catálogo central de todos os relatórios de alterações disponíveis.
 * Cada entrada mapeia um relatório (gerado em memória no backend) para
 * sua rota de download, metadados e ícone.
 *
 * O painel agrupa os relatórios por data (botões de data) e exibe apenas
 * os relatórios do dia selecionado — facilitando encontrar um relatório
 * específico sem percorrer uma lista longa.
 */
const RELATORIOS = [
  // ===== 16/08/2026 =====
  { id: 'geral', data: '2026-08-16', titulo: 'Relatório de Alterações', descricao: '10 alterações cronológicas (15–16/08/2026).', rota: '/relatorio-alteracoes/download', arquivo: 'relatorio-alteracoes-15-16-agosto-2026.txt', icon: FileText },
  { id: 'seguranca', data: '2026-08-16', titulo: 'Relatório de Segurança', descricao: '8 alterações dos Blocos 1, 2 e 3 + checklist de entrega.', rota: '/relatorio-alteracoes/seguranca/download', arquivo: 'relatorio-alteracoes-16-agosto-2026-seguranca.txt', icon: ShieldCheck },
  { id: 'verificacao', data: '2026-08-16', titulo: 'Relatório de Verificação de Segurança', descricao: 'Verificação de segurança — blocos P0, P1 e P2 (10 itens).', rota: '/relatorio-verificacao/download', arquivo: 'relatorio-verificacao-seguranca-16-08-2026.txt', icon: ShieldCheck },
  { id: 'correcoes', data: '2026-08-16', titulo: 'Relatório de Correções de Segurança', descricao: '5 correções pontuais de segurança (P1.1, P2.1, P2.3, P2.2, P0.3).', rota: '/relatorio-correcoes/download', arquivo: 'relatorio-correcoes-seguranca-16-08-2026.txt', icon: ShieldAlert },
  { id: 'configuracao', data: '2026-08-16', titulo: 'Relatório de Configuração Mentor', descricao: 'Variáveis MENTOR_ENV e MENTOR_REAL_URL.', rota: '/relatorio-configuracao/download', arquivo: 'relatorio-configuracao-mentor-16-08-2026.txt', icon: Settings },
  { id: 'diagnostico', data: '2026-08-16', titulo: 'Relatório de Diagnóstico Mentor', descricao: 'Variável de ambiente ausente no fluxo Mentor (MENTOR_JWT_SECRET).', rota: '/relatorio-diagnostico/download', arquivo: 'relatorio-diagnostico-mentor-16-08-2026.txt', icon: Stethoscope },
  { id: 'correcaoJwt', data: '2026-08-16', titulo: 'Relatório de Correção Mentor JWT', descricao: 'Segredo dedicado MENTOR_JWT_SECRET configurado; fluxo testado em produção.', rota: '/relatorio-correcao-jwt/download', arquivo: 'relatorio-correcao-jwt-16-08-2026.txt', icon: KeyRound },
  { id: 'diagnosticoLogin', data: '2026-08-16', titulo: 'Relatório de Diagnóstico Login Mentor', descricao: 'Erro "Usuário ou senha inválidos" investigado.', rota: '/relatorio-diagnostico-login/download', arquivo: 'relatorio-diagnostico-login-16-08-2026.txt', icon: LogIn },
  { id: 'paginaMentor', data: '2026-08-16', titulo: 'Relatório de Página Mentor Boas-Vindas', descricao: 'Criação da página + gerenciamento de imagem pela área administrativa.', rota: '/relatorio-pagina-mentor/download', arquivo: 'relatorio-pagina-mentor-boas-vindas-16-08-2026.txt', icon: ImagePlus },
  { id: 'correcaoFluxo', data: '2026-08-16', titulo: 'Relatório de Correção Fluxo Mentor', descricao: 'Menu e CTA agora apontam para /curso/boas-vindas.', rota: '/relatorio-correcao-fluxo-mentor/download', arquivo: 'relatorio-correcao-fluxo-mentor-16-08-2026.txt', icon: Route },
  { id: 'correcaoLoop', data: '2026-08-16', titulo: 'Relatório de Correção Loop Mentor', descricao: 'Loop infinito "preparando sua recepção" corrigido.', rota: '/relatorio-correcao-loop-mentor/download', arquivo: 'relatorio-correcao-loop-mentor-16-08-2026.txt', icon: RefreshCw },
  { id: 'docSso', data: '2026-08-16', titulo: 'Relatório de Documentação SSO Mentor', descricao: 'Documentação do fluxo SSO do mentor (URL, método, JWT claims).', rota: '/relatorio-documentacao-sso/download', arquivo: 'relatorio-documentacao-sso-16-08-2026.txt', icon: FileText },
  { id: 'atualizacaoJwt', data: '2026-08-16', titulo: 'Relatório de Atualização JWT', descricao: 'Segredos MENTOR_JWT_SECRET e JWT_SECRET atualizados em .env.', rota: '/relatorio-atualizacao-jwt/download', arquivo: 'relatorio-atualizacao-jwt-16-08-2026.txt', icon: KeySquare },
  { id: 'ajusteSso', data: '2026-08-16', titulo: 'Relatório de Ajuste SSO Mentor', descricao: 'Payload do JWT — identificador "email" confirmado no token.', rota: '/relatorio-ajuste-sso-mentor/download', arquivo: 'relatorio-ajuste-sso-mentor-16-08-2026.txt', icon: KeyRound },
  { id: 'correcaoAutorizacao', data: '2026-08-16', titulo: 'Relatório de Correção Autorização SSO', descricao: 'Erro 401 na rota de relatório SSO corrigido (adminAuth).', rota: '/relatorio-correcao-autorizacao-sso/download', arquivo: 'relatorio-correcao-autorizacao-sso-16-08-2026.txt', icon: Lock },
  { id: 'implBotaoMentor', data: '2026-08-16', titulo: 'Relatório de Implementação Botão Mentor', descricao: 'Endpoint /mentor-sso-token + redirecionamento SSO GET ?token=.', rota: '/relatorio-implementacao-botao-mentor/download', arquivo: 'relatorio-implementacao-botao-mentor-16-08-2026.txt', icon: Rocket },
  { id: 'correcaoPainelMentor', data: '2026-08-16', titulo: 'Relatório de Correção Painel Mentor', descricao: 'painel-mentor.html captura token SSO da query string (?token=).', rota: '/relatorio-correcao-painel-mentor/download', arquivo: 'relatorio-correcao-painel-mentor-16-08-2026.txt', icon: LayoutDashboard },
  { id: 'schemaSql', data: '2026-08-16', titulo: 'Relatório de Schema SQL (Script)', descricao: 'Script SQL completo do banco cursos_db (tabelas, índices, constraints).', rota: '/relatorio-schema-sql/download', arquivo: 'schema-cursos-db-16-08-2026.sql', icon: Database },
  { id: 'schemaRelatorio', data: '2026-08-16', titulo: 'Relatório de Schema SQL (Relatório)', descricao: 'Relatório de alterações referente à criação do schema SQL.', rota: '/relatorio-schema-sql/relatorio', arquivo: 'relatorio-schema-sql-16-08-2026.txt', icon: FileText },

  // ===== 18/08/2026 =====
  { id: 'boasVindas', data: '2026-08-18', titulo: 'Relatório de Alterações Boas-Vindas', descricao: 'Data/hora Brasília, lógica de gênero e remoção do botão "Vamos lá!".', rota: '/relatorio-alteracoes-boas-vindas/download', arquivo: 'relatorio-alteracoes-boas-vindas-18-08-2026.txt', icon: ImagePlus },
  { id: 'autenticacaoPainel', data: '2026-08-18', titulo: 'Relatório de Correção Autenticação Painel', descricao: 'API_BASE adaptativo no painel-mentor.html (SITE + VPS).', rota: '/relatorio-correcao-autenticacao-painel/download', arquivo: 'relatorio-correcao-autenticacao-painel-18-08-2026.txt', icon: Lock },
  { id: 'aprovarTutores', data: '2026-08-18', titulo: 'Relatório de Correção Aprovar Tutores', descricao: 'ReferenceError no hook admin_validacoes corrigido (import de vinculos_utils).', rota: '/relatorio-correcao-aprovar-tutores/download', arquivo: 'relatorio-correcao-aprovar-tutores-18-08-2026.txt', icon: ShieldCheck },
  { id: 'erroUsuarios', data: '2026-08-18', titulo: 'Relatório de Correção Erro Usuários', descricao: 'Constantes de validação movidas para dentro dos callbacks JSVM.', rota: '/relatorio-correcao-erro-usuarios/download', arquivo: 'relatorio-correcao-erro-usuarios-18-08-2026.txt', icon: Users },
  { id: 'fluxoMembros', data: '2026-08-18', titulo: 'Relatório de Correção Fluxo Membros Igreja', descricao: 'Igreja do vínculo ativo usada no filtro do painel (outlet context).', rota: '/relatorio-correcao-fluxo-membros-igreja/download', arquivo: 'relatorio-correcao-fluxo-membros-igreja-18-08-2026.txt', icon: Users },
  { id: 'acessoPainel', data: '2026-08-18', titulo: 'Relatório de Correção Acesso Painel Igreja', descricao: 'Fallback legado adicionado em verificarAcessoPainel.', rota: '/relatorio-correcao-acesso-painel-igreja/download', arquivo: 'relatorio-correcao-acesso-painel-igreja-18-08-2026.txt', icon: ShieldCheck },
  { id: 'erro404Usuario', data: '2026-08-18', titulo: 'Relatório de Correção Erro 404 Usuário', descricao: 'Guarda detecta admin em /minha-conta e redireciona para /adm.', rota: '/relatorio-correcao-erro-404-usuario/download', arquivo: 'relatorio-correcao-erro-404-usuario-18-08-2026.txt', icon: Search },
  { id: 'erro404PaginaInicial', data: '2026-08-18', titulo: 'Relatório de Correção Erro 404 Página Inicial', descricao: 'Header pula verificarAcessoPainel para admins (coleção admins).', rota: '/relatorio-correcao-erro-404-pagina-inicial/download', arquivo: 'relatorio-correcao-erro-404-pagina-inicial-18-08-2026.txt', icon: Search },
  { id: 'protecaoGlobalAdmin', data: '2026-08-18', titulo: 'Relatório de Implementação Proteção Global Admin', descricao: 'Guarda global redireciona admins para /adm em qualquer rota não-/adm.', rota: '/relatorio-implementacao-protecao-global-admin/download', arquivo: 'relatorio-implementacao-protecao-global-admin-18-08-2026.txt', icon: ShieldCheck },
  { id: 'membrosNaoAparecem', data: '2026-08-18', titulo: 'Relatório de Correção Membros Não Aparecem', descricao: 'Backfill sincroniza users.igreja_id ao vínculo ativo.', rota: '/relatorio-correcao-membros-nao-aparecem/download', arquivo: 'relatorio-correcao-membros-nao-aparecem-18-08-2026.txt', icon: Users },
  { id: 'filtroMembrosPendentes', data: '2026-08-18', titulo: 'Relatório de Correção Filtro Membros Pendentes', descricao: 'Regra estendida para presidente/admin no escopo por igreja.', rota: '/relatorio-correcao-filtro-membros-pendentes/download', arquivo: 'relatorio-correcao-filtro-membros-pendentes-18-08-2026.txt', icon: Users },
  { id: 'investigacaoMembrosPendentes', data: '2026-08-18', titulo: 'Relatório de Investigação e Correção Membros Pendentes', descricao: 'Filtro de igreja removido da query; regra server-side única fonte.', rota: '/relatorio-investigacao-correcao-membros-pendentes/download', arquivo: 'relatorio-investigacao-correcao-membros-pendentes-18-08-2026.txt', icon: Search },

  // ===== 19/08/2026 =====
  { id: 'correcaoHeaderPainelMentor', data: '2026-08-19', titulo: 'Relatório de Correção Header Painel Mentor', descricao: 'Header do painel mentor atualiza com dados do JWT (nome, avatar, Sair).', rota: '/relatorio-correcao-header-painel-mentor/download', arquivo: 'relatorio-correcao-header-painel-mentor-19-08-2026.txt', icon: UserCircle },
  { id: 'sistemaAprovacaoCursos', data: '2026-08-19', titulo: 'Relatório de Implementação Sistema de Aprovação de Cursos', descricao: 'Moderação de cursos no painel admin + status no painel mentor.', rota: '/relatorio-implementacao-sistema-aprovacao-cursos/download', arquivo: 'relatorio-implementacao-sistema-aprovacao-cursos-19-08-2026.txt', icon: GraduationCap },
  { id: 'painelMentorHtml', data: '2026-08-19', titulo: 'Painel do Mentor (arquivo HTML único)', descricao: 'HTML + CSS + JavaScript puro, sem frameworks externos.', rota: '/adm/painel-mentor-download', arquivo: 'painel-mentor.html', icon: LayoutDashboard },

  // ===== 20/08/2026 =====
  { id: 'erroUnauthorizedRelatorio', data: '2026-08-20', titulo: 'Relatório de Correção Erro Unauthorized', descricao: 'Rota de relatório corrigida de authMiddleware para adminAuth.', rota: '/relatorio-correcao-erro-unauthorized-relatorio/download', arquivo: 'relatorio-correcao-erro-unauthorized-relatorio-20-08-2026.txt', icon: Lock },
  { id: 'coracoesConectados', data: '2026-08-20', titulo: 'Relatório de Implementação Integração Corações Conectados', descricao: 'Campos dataNascimento/estadoCivil + rota SSO JWT.', rota: '/relatorio-implementacao-integracao-coracoes-conectados/download', arquivo: 'relatorio-implementacao-integracao-coracoes-conectados-20-08-2026.txt', icon: Heart },
  { id: 'erroUnauthorizedCoracoes', data: '2026-08-20', titulo: 'Relatório de Correção Erro Unauthorized Corações', descricao: 'Rota de relatório Corações corrigida para adminAuth.', rota: '/relatorio-correcao-erro-unauthorized-coracoes/download', arquivo: 'relatorio-correcao-erro-unauthorized-coracoes-20-08-2026.txt', icon: Lock },
  { id: 'ajusteBotaoCoracoes', data: '2026-08-20', titulo: 'Relatório de Ajuste Botão Corações Relacionamentos', descricao: 'Botão Corações Conectados movido para a página Relacionamentos.', rota: '/relatorio-ajuste-botao-coracoes-relacionamentos/download', arquivo: 'relatorio-ajuste-botao-coracoes-relacionamentos-20-08-2026.txt', icon: Heart },
  { id: 'cursosConexaoBatista', data: '2026-08-20', titulo: 'Relatório de Implementação Cursos Conexão Batista', descricao: 'Avaliação da IA + ajustes no cadastro (sexo, igreja, CPF).', rota: '/relatorio-implementacao-cursos-conexao-batista/download', arquivo: 'relatorio-implementacao-cursos-conexao-batista-20-08-2026.txt', icon: GraduationCap },

  // ===== 24/08/2026 =====
  { id: 'limpezaCampoCidade', data: '2026-08-24', titulo: 'Relatório de Limpeza Campo Cidade Antigo', descricao: 'Remoção do campo antigo de cidade (input de texto).', rota: '/relatorio-limpeza-campo-cidade-antigo/download', arquivo: 'relatorio-limpeza-campo-cidade-antigo-24-08-2026.txt', icon: RefreshCw },
  { id: 'listaCanonicaCategorias', data: '2026-08-24', titulo: 'Relatório de Implementação Lista Canônica de Categorias', descricao: '33 categorias canônicas + endpoint público + migração de cursos.', rota: '/relatorio-lista-canonica-categorias/download', arquivo: 'relatorio-lista-canonica-categorias-24-08-2026.txt', icon: GraduationCap },
  { id: 'correcaoPaginaCursos', data: '2026-08-24', titulo: 'Relatório de Correção Página de Cursos', descricao: 'Categorias dinâmicas e remoção do filtro Nível.', rota: '/relatorio-correcao-pagina-cursos/download', arquivo: 'relatorio-correcao-pagina-cursos-24-08-2026.txt', icon: GraduationCap },
  { id: 'correcaoCursosDestaque', data: '2026-08-24', titulo: 'Relatório de Correção Cursos em Destaque', descricao: 'Seção cursos em destaque com dados reais do banco.', rota: '/relatorio-correcao-cursos-destaque/download', arquivo: 'relatorio-correcao-cursos-destaque-24-08-2026.txt', icon: GraduationCap },

  // ===== 25/08/2026 =====
  { id: 'redesignPaginasCursos', data: '2026-08-25', titulo: 'Relatório de Redesign Páginas de Cursos', descricao: 'Layout profissional, banner, abas, matriz curricular, responsivo.', rota: '/relatorio-redesign-paginas-cursos/download', arquivo: 'relatorio-redesign-paginas-cursos-25-08-2026.txt', icon: Palette },
  { id: 'atualizacaoBloco02', data: '2026-08-25', titulo: 'Relatório de Atualização Bloco 02 Valide sua Membresia', descricao: 'Novo conteúdo do bloco 02 com opções de validação.', rota: '/relatorio-atualizacao-bloco-02-valide-membresia/download', arquivo: 'relatorio-atualizacao-bloco-02-valide-membresia-25-08-2026.txt', icon: ShieldCheck },
  { id: 'correcoesPortalPublico', data: '2026-08-25', titulo: 'Relatório de Correções Portal Público', descricao: 'Miniatura clicável, detalhes reais, fluxo inscrição, preço consistente.', rota: '/relatorio-correcoes-portal-publico/download', arquivo: 'relatorio-correcoes-portal-publico-25-08-2026.txt', icon: GraduationCap },

  // ===== 26/08/2026 =====
  { id: 'correcoesPendentesPortal', data: '2026-08-26', titulo: 'Relatório de Correções Pendentes Portal', descricao: 'Mapeamento de campos + botão Inscrever-se com causa raiz resolvida.', rota: '/relatorio-correcoes-pendentes-portal/download', arquivo: 'relatorio-correcoes-pendentes-portal-26-08-2026.txt', icon: GraduationCap },
  { id: 'correcaoCriticaApi', data: '2026-08-26', titulo: 'Relatório de Correção Crítica API', descricao: 'URL da API, paths, dados reais, fluxo inscrição, limpeza total.', rota: '/relatorio-correcao-critica-api/download', arquivo: 'relatorio-correcao-critica-api-26-08-2026.txt', icon: Globe },
  { id: 'correcaoLinkPainelMentor', data: '2026-08-26', titulo: 'Relatório de Correção Link do Painel do Mentor', descricao: 'Geração de token JWT + redirecionamento GET /painel?token=.', rota: '/relatorio-correcao-link-painel-mentor/download', arquivo: 'relatorio-correcao-link-painel-mentor-26-08-2026.txt', icon: Link2 },

  // ===== 30/08/2026 =====
  { id: 'correcaoFluxoInscricaoAluno', data: '2026-08-30', titulo: 'Relatório de Correção Fluxo de Inscrição do Aluno', descricao: 'Curso não aparecia em "Meus Cursos" — matrícula na VPS via GET /cursos/:id/token.', rota: '/relatorio-correcao-fluxo-inscricao-aluno/download', arquivo: 'relatorio-correcao-fluxo-inscricao-aluno-30-08-2026.txt', icon: GraduationCap },
  { id: 'sincronizacaoUsuarioMatricula', data: '2026-08-30', titulo: 'Relatório de Sincronização de Usuário na Matrícula', descricao: 'Ensure + bridge-login antes da matrícula; identificador consistente com SSO.', rota: '/relatorio-sincronizacao-usuario-matricula/download', arquivo: 'relatorio-sincronizacao-usuario-matricula-30-08-2026.txt', icon: Users },
  { id: 'verificacaoPersistenciaMatricula', data: '2026-08-30', titulo: 'Relatório de Verificação de Persistência de Matrícula', descricao: 'Confirmação de persistência na VPS antes do SSO (backend + frontend).', rota: '/relatorio-verificacao-persistencia-matricula/download', arquivo: 'relatorio-verificacao-persistencia-matricula-30-08-2026.txt', icon: ShieldCheck },
  { id: 'tratamentoErrosMatriculaSso', data: '2026-08-30', titulo: 'Relatório de Tratamento de Erros de Matrícula e SSO', descricao: 'Erros de matrícula e SSO tratados separadamente, mensagens distintas.', rota: '/relatorio-tratamento-erros-matricula-sso/download', arquivo: 'relatorio-tratamento-erros-matricula-sso-30-08-2026.txt', icon: ShieldAlert },

  // ===== 31/08/2026 =====
  { id: 'implementacaoPaginaCursosPdf', data: '2026-08-31', titulo: 'Implementação Nova Página de Cursos com Leitor de PDF - 31/08/2026 18:14', descricao: 'Página CursoAulaPage com leitor de PDF (pdf.js), navegação página a página, download, responsivo.', rota: '/relatorio-implementacao-pagina-cursos-pdf/download', arquivo: 'relatorio-implementacao-pagina-cursos-pdf-31-08-2026.txt', icon: FileText },
  { id: 'validacaoIntegracaoVps', data: '2026-08-31', titulo: 'Validação da Integração Frontend↔VPS - 31/08/2026 17:52', descricao: 'Auditoria de endpoints da VPS, mapeamento proxy↔VPS, validação do fluxo Login→Cursos→Matrícula→Painel→PDF e decisão arquitetural.', rota: '/relatorio-validacao-integracao-vps/download', arquivo: 'relatorio-validacao-integracao-vps-31-08-2026.txt', icon: Globe },
  { id: 'validacaoPontaAPonta', data: '2026-08-31', titulo: 'Validação Ponta a Ponta (Dados Reais) - 31/08/2026 18:58', descricao: 'Validação completa Matrícula→SSO→Meus Cursos→PDF com Rony Garcia, Curso 29. Tabela de 28 testes APROVADO/FALHOU/NÃO EXECUTADO + evidências.', rota: '/relatorio-validacao-ponta-a-ponta/download', arquivo: 'relatorio-validacao-ponta-a-ponta-31-08-2026.txt', icon: ShieldCheck },
  { id: 'investigacaoAusenciaPdf', data: '2026-08-31', titulo: 'Investigação: Ausência de PDF na Resposta da API - 31/08/2026 19:17', descricao: 'Comparação painel↔API↔mapeamento↔componente sobre o PDF do Curso 29. 13 hipóteses classificadas, causa raiz (schema VPS sem pdf_url) e fonte oficial do PDF.', rota: '/relatorio-investigacao-ausencia-pdf/download', arquivo: 'relatorio-investigacao-ausencia-pdf-31-08-2026.txt', icon: Search },
  { id: 'investigacaoFinalVps', data: '2026-08-31', titulo: 'Investigação Completa: Matrícula, PDF, SSO e Sincronização de Dados - 31/08/2026 19:30', descricao: 'Auditoria VPS completa (Curso 29, Matrícula 133, Rony Garcia). Confirma matrícula/SSO/sincronização e identifica ausência de PDF (mentor não fez upload). Fonte oficial: aulas.material_pdf_url.', rota: '/relatorio-investigacao-final-vps/download', arquivo: 'relatorio-investigacao-final-vps-31-08-2026.txt', icon: Search },
  { id: 'correcaoFrontendMaterialPdf', data: '2026-08-31', titulo: 'Correção Frontend: Consumo de aulas.material_pdf_url - 31/08/2026 20:45', descricao: 'CursoAulaPage.jsx corrigido para consumir o campo OFICIAL do PDF (aulas.material_pdf_url) via /cursos/:id/aulas, sem fallbacks para video_url/pdf_url, com tratamento correto da ausência de PDF. Matrícula/SSO/auth/VPS intactos.', rota: '/relatorio-correcao-frontend-material-pdf/download', arquivo: 'relatorio-correcao-frontend-material-pdf-31-08-2026.txt', icon: FileText },
  { id: 'ajustePainelAlunoMidia', data: '2026-08-31', titulo: 'Ajuste Painel do Aluno: Renderização Condicional de Mídia - 31/08/2026 21:05', descricao: 'CursoAulaPage.jsx com renderização condicional (vídeo YouTube → imagem → leitor PDF → "Material indisponível"), leitor PDF integrado no espaço principal (sem duplicidade), contador Página X de Y, navegação com limites, sem download automático e botão "Baixar PDF" separado (href, nova aba). Matrícula/SSO/auth/VPS intactos.', rota: '/relatorio-ajuste-painel-aluno-midia/download', arquivo: 'relatorio-ajuste-painel-aluno-midia-31-08-2026.txt', icon: GraduationCap },
  { id: 'integracaoNovoPainelAluno', data: '2026-08-31', titulo: 'Integração Novo Painel do Aluno no Site - 31/08/2026 21:45', descricao: 'Novo frontend do painel do aluno (CursoAulaPage com leitor PDF integrado) tornado destino principal da área do aluno. Botões "Área do aluno", "Abrir painel do aluno", "Acessar curso" e inscrição gratuita agora levam ao novo painel integrado (lista de cursos + leitor PDF), sem redirecionar para o painel antigo da VPS. Aceite de termos (LGPD + Termos) antes de abrir o painel. Backend VPS, autenticação, matrículas, permissões e tokens intactos.', rota: '/relatorio-integracao-novo-painel-aluno/download', arquivo: 'relatorio-integracao-novo-painel-aluno-31-08-2026.txt', icon: GraduationCap },
  { id: 'correcaoSessaoSso', data: '2026-08-31', titulo: 'Correção Passagem de Sessão SSO - 31/08/2026 22:25', descricao: 'Corrigida a perda de sessão ao abrir uma aula: o proxy /cursos/:id/aulas usava o token de curso em vez do token de sessão (bridge-login) para chamar /aluno/cursos/:id/aulas na VPS (401/403 → "Sua sessão expirou"). Agora usa o token de sessão em um único passo. Token da VPS movido de localStorage para memória. Sessão expirada redireciona ao login. Probe real confirmado (Rony Garcia, curso 29). VPS/API/matriculas/permissões/visual intactos.', rota: '/relatorio-correcao-sessao-sso/download', arquivo: 'relatorio-correcao-sessao-sso-31-08-2026.txt', icon: KeyRound },
  { id: 'otimizacaoLayoutAula', data: '2026-08-31', titulo: 'Otimização Layout Tela de Aprendizagem - 31/08/2026 22:50', descricao: 'Otimização de layout (apenas CSS/Tailwind) da página CursoAulaPage.jsx para melhor legibilidade em desktop: conteúdo principal ampliado (~80% da largura, container 96rem), margens reduzidas, título (text-5xl), apresentação (text-base), leitor PDF (min-h 640px) e controles (botões e contador) ampliados, coluna lateral (aulas) estreitada (18rem). Responsividade em celular mantida (layout em coluna). Sem alterar textos, dados, rotas, SSO, matrículas, lógica do leitor de PDF ou backend VPS.', rota: '/relatorio-otimizacao-layout-aula/download', arquivo: 'relatorio-otimizacao-layout-aula-31-08-2026.txt', icon: Palette },
  { id: 'correcaoFalhasTelaAula', data: '2026-08-31', titulo: 'Correção Falhas Funcionais Tela de Aula - 31/08/2026 23:10', descricao: 'Correção de duas falhas funcionais da página CursoAulaPage.jsx: (1) leitor PDF não carregava arquivo autenticado — agora carrega via proxy autenticado GET /cursos/:id/aulas/:aulaId/pdf (backend valida PocketBase + matrícula VPS, devolve blob; pdf.js consome ArrayBuffer, sem CORS/URL simulada/erro quando disponível); (2) controles "Voltar"/"Avançar" ficavam cortados em celular — min-height agora responsivo (360/480/640px), controles sempre visíveis abaixo do conteúdo e clicáveis. Botão "Baixar PDF" separado mantido. VPS, SSO, matrículas e permissões intactos.', rota: '/relatorio-correcao-falhas-tela-aula/download', arquivo: 'relatorio-correcao-falhas-tela-aula-31-08-2026.txt', icon: Wrench },
  { id: 'melhoriaExperienciaTelaAulas', data: '2026-08-31', titulo: 'Melhoria Experiência Tela de Aulas - 31/08/2026 23:20', descricao: 'Melhoria visual e funcional da tela de aulas: cabeçalho compacto (nome + duração discreta, sem faixa azul), informações do curso em seção menor (categoria, área, autor, data de criação), leitor PDF maximizado (ocupa praticamente toda a área central, proporção preservada, rolagem quando necessário) e prova integrada como etapa final (proxy GET /cursos/:id/prova consulta a VPS; última aula → botão "Fazer prova"; prova na sidebar com estado Pendente/Concluída; nova página /curso/:id/prova/:provaId). Renderização condicional de mídia (vídeo → imagem → PDF → "Material indisponível") e responsividade mantidas. VPS, API, SSO, matrículas, permissões e dados reais intactos.', rota: '/relatorio-melhoria-experiencia-tela-aulas/download', arquivo: 'relatorio-melhoria-experiencia-tela-aula-31-08-2026.txt', icon: Palette },
  { id: 'reducaoAlturaCabecalhoAula', data: '2026-08-31', titulo: 'Redução Altura Cabeçalho - Implementação Compacta - 31/08/2026 23:55', descricao: 'Reduz significativamente a altura vertical do cabeçalho da tela de aula (CursoAulaPage.jsx), tornando-o realmente compacto: padding vertical reduzido (py-5 → py-1.5), título + duração + link "Meus cursos" na mesma linha (flex items-baseline), fontes reduzidas (título text-lg/sm:text-xl, duração text-xs, info text-[11px]) e linha de informações compacta (mt-0.5, gap-x-3). Altura final ~60-80px (antes ~120-150px). Nome do curso e duração mantidos visíveis e legíveis. Sem alterar layout, conteúdo, rotas, SSO, responsividade, coluna lateral ou leitor de PDF.', rota: '/relatorio-reducao-altura-cabecalho-aula/download', arquivo: 'relatorio-reducao-altura-cabecalho-aula-31-08-2026.txt', icon: Palette },
  { id: 'investigacaoProvasEtapa', data: '2026-09-01', titulo: 'Investigação e Implementação Provas por Etapa - 01/09/2026 00:15', descricao: 'Investigação real da estrutura de provas/etapas no backend VPS (Curso 29, Rony Garcia) + implementação da associação dinâmica prova↔aula. Conclusão da investigação: a VPS NÃO possui sistema de provas (endpoint /aluno/cursos/:id/prova retorna 404; aulas sem campos prova/prova_id/etapa_id/tem_prova; todos os endpoints alternativos 404). Implementado SEM dados simulados: o proxy /cursos/:id/aulas agora devolve um mapa provas_por_aula (detecção future-proof de campos de prova por aula); o frontend exibe a prova imediatamente após a aula correspondente (sidebar + CTA "Fazer prova"/"Ver resultado") com estado dinâmico Pendente/Concluída. Removida a assunção "prova apenas na última aula". Quando a VPS não devolve prova (caso atual), nada é exibido. VPS, API, matrículas, SSO, permissões, leitor PDF e responsividade intactos.', rota: '/relatorio-investigacao-provas-etapa/download', arquivo: 'relatorio-investigacao-provas-etapa-01-09-2026.txt', icon: Search },
  { id: 'aplicacaoDuasAlteracoesFrontend', data: '2026-09-01', titulo: 'Aplicação Duas Alterações Frontend - 01/09/2026 00:35', descricao: 'Duas alterações no frontend, preservando VPS, API, SSO, matrículas, permissões e conteúdos reais. (1) Prova em Matriz Curricular: investigação real confirmou que a VPS não possui sistema de provas (Curso 29: /aluno/cursos/:id/prova 404, aulas sem campos de prova); o painel-mentor.html (botões Alterar/Excluir/Prova) vive na VPS e não pode ser editado do sandbox; o painel do aluno já exibe a prova vinculada (Pendente/Concluída) com dados reais via proxy /cursos/:id/prova e mapa provas_por_aula — sem dados simulados. (2) Layout PDF corrigido: container do canvas de min-h-[78vh] (empurrava controles fora da viewport) para max-h-[52/58/62vh] com overflow-auto — rolagem interna, controles sempre visíveis, proporção preservada, botão "Baixar PDF" separado.', rota: '/relatorio-aplicacao-duas-alteracoes-frontend/download', arquivo: 'relatorio-aplicacao-duas-alteracoes-frontend-01-09-2026.txt', icon: Wrench },
  { id: 'correcaoDoisProblemasFrontend', data: '2026-09-01', titulo: 'Correção Dois Problemas Frontend - PDF Largura Completa e Ação Prova', descricao: 'Correção de dois problemas no frontend, preservando VPS, API, SSO, matrículas, permissões, visual geral e conteúdos reais. (1) Leitor de PDF agora usa 100% da largura útil disponível (canvas width:100% + height:auto, padding do card/wrapper reduzido, container justify-start) — sem espaço vazio nas laterais, proporção preservada, rolagem interna mantida, controles e botão "Baixar PDF" mantidos. (2) Ação "Prova" visível no painel do mentor (CursoMentorCursosPage) ao lado de "Excluir curso" — botão clicável que abre a prova real cadastrada (CursoProvaPage consulta a VPS via proxy GET /cursos/:id/prova); sem dados simulados, sem transformar prova em etapa, proteção de edição mantida.', rota: '/relatorio-correcao-dois-problemas-frontend/download', arquivo: 'relatorio-correcao-dois-problemas-frontend-01-09-2026.txt', icon: Wrench },
  { id: 'correcaoLeitorPdfLargura', data: '2026-09-01', titulo: 'Correção Leitor PDF - Documento Ocupa Largura Completa - 01/09/2026 10:30', descricao: 'Corrigido APENAS o leitor de PDF da página CursoAulaPage.jsx para que o documento ocupe 100% da largura útil da área principal, sem espaço vazio nas laterais. Wrapper do PDF sem padding/borda/moldura; card sem padding lateral (padding só no cabeçalho e inferior); canvas block h-auto w-full (sem shadow). Proporção preservada (height:auto + buffer nativo em escala*dpr), rolagem interna mantida (max-h-[52/58/62vh] + overflow-auto) e espaço real reservado para os controles Anterior/Próxima e o botão Baixar PDF, sem sobreposição, corte ou download automático. Matriz curricular, provas, API, VPS, SSO, matrículas, permissões, conteúdos reais e dados cadastrados intactos.', rota: '/relatorio-correcao-leitor-pdf-largura/download', arquivo: 'relatorio-correcao-leitor-pdf-largura-01-09-2026.txt', icon: Wrench },
  { id: 'investigacaoEstruturaApiConclusaoEtapa', data: '2026-09-01', titulo: 'Investigação Estrutura API Conclusão Etapa - 01/09/2026 13:35', descricao: 'Investigação REAL (Curso 29, Rony Garcia) de todos os endpoints da VPS para progresso/conclusão de aulas (etapas). Conclusão principal: a VPS NÃO possui sistema de progresso/conclusão — GET /aluno/cursos/29/aulas (200) devolve as aulas SEM nenhum campo de conclusão (concluida/status/progresso/etapa_id) e TODOS os endpoints candidatos de progresso (GET) e conclusão (POST/PATCH/PUT) retornam 404 "Cannot <METHOD>". Documenta campos reais das aulas (id, curso_id, titulo, descricao, youtube_id, ordem, created_at, tipo, video_type, conteudo_url, public_id, num_slides, material_pdf_url, material_pdf_public_id), os 4 tipos de mídia do Curso 29 (slide/video/imagem, mídia real em conteudo_url Cloudinary, video_type "youtube" enganoso com youtube_id null), endpoints que existem vs. 404, exemplos de requisição/resposta, limitações e próximas etapas. Nenhum dado simulado.', rota: '/relatorio-investigacao-estrutura-api-conclusao-etapa/download', arquivo: 'relatorio-investigacao-estrutura-api-conclusao-etapa-01-09-2026.txt', icon: Search },
  { id: 'correcaoAutenticacaoPainelAluno', data: '2026-09-01', titulo: 'Correção Autenticação Painel do Aluno - Token SSO da URL - 01/09/2026', descricao: 'Corrigida APENAS a autenticação do painel do aluno no frontend: leitura do token SSO recebido na URL (?token=...), armazenamento para a sessão atual (sessionStorage, NÃO localStorage), remoção do token da barra de endereço e envio do token em todas as requisições reais a /aluno/cursos/:id/aulas (header x-cursos-token -> backend repassa como Authorization: Bearer para a VPS). 401/403 tratados sem redirecionar incorretamente para /login (só redireciona quando a sessão PocketBase está realmente inválida). Registra também o que NÃO foi feito nas últimas alterações. VPS, backend, SSO, matrículas, permissões, endpoints e visual intactos.', rota: '/relatorio-correcao-autenticacao-painel-aluno/download', arquivo: 'relatorio-correcao-autenticacao-painel-aluno-01-09-2026.txt', icon: Lock },
  { id: 'correcaoAvancoTelaAprendizagemSecretariado', data: '2026-09-01', titulo: 'Correção Avanço Tela Aprendizagem Secretariado - IMPEDIMENTO - 01/09/2026', descricao: 'Investigação real do fluxo "Concluir etapa -> Próxima -> Fazer prova" do Curso Livre Secretariado (Curso 29, Rony Garcia) contra a VPS (bridge-login + GET /aluno/cursos/29/aulas + varredura de endpoints de conclusão/progresso/prova com token válido). IMPEDIMENTO: a VPS NÃO possui mecanismo de conclusão de etapa — as 4 aulas reais (ids 10, 11, 12, 13) vêm SEM campos de conclusão e TODOS os endpoints de conclusão/progresso/prova retornam 404 mesmo com token válido. Por determinação da tarefa, NÃO foram criados endpoints, NÃO foram simulados dados, NÃO foi usado armazenamento alternativo, e NÃO foram alterados autenticação/SSO/matriculas/permissões/VPS/visual. O avanço NÃO é declarado corrigido. Documenta requisição, resposta, condição impeditiva, validação das 4 etapas e limitações.', rota: '/relatorio-correcao-avanco-tela-aprendizagem-secretariado/download', arquivo: 'relatorio-correcao-avanco-tela-aprendizagem-secretariado-01-09-2026.txt', icon: Wrench },
  { id: 'investigacaoFluxoPainelMentor', data: '2026-09-01', titulo: 'Investigação Fluxo Acessar Painel do Mentor - Serviço Externo Indisponível - 01/09/2026', descricao: 'Investigação exclusiva do fluxo "Acessar painel do mentor" (/curso/boas-vindas). Requisição real: frontend getMentorSsoToken -> GET /mentor-sso-token -> backend POST /auth/bridge-login na VPS -> redirectUrl https://api.conexaobatista.com.br/painel?token=. Credencial temporária de 10 minutos NÃO está sendo gerada: POST /auth/bridge-login retorna 502 Bad Gateway. Camada responsável pela falha: SERVIÇO EXTERNO INDISPONÍVEL (VPS api.conexaobatista.com.br, 69.62.124.240 — TODOS os endpoints /, /cursos, /health, /auth/bridge-login, /sso, /painel retornam 502; DNS íntegro, IP público). Encaminhamento do frontend e rota do backend estão CORRETOS e intactos; nenhuma correção de encaminhamento aplicada (a falha não está no frontend). Não cria endpoints, não simula credenciais, não altera painel do aluno, SSO, matrículas, etapas, permissões ou visual. Documenta requisição, método, status, resposta, confirmação (ou não) da credencial de 10 min, camada responsável e validações não comprovadas.', rota: '/relatorio-investigacao-fluxo-painel-mentor/download', arquivo: 'relatorio-investigacao-fluxo-painel-mentor-01-09-2026.txt', icon: Search },
  { id: 'correcaoNavegacaoPainelAlunoCurso29', data: '2026-09-02', titulo: 'Correção Navegação Painel do Aluno - Curso 29 - 02/09/2026', descricao: 'Investigação real (Curso 29, Rony Garcia) que descobriu o SISTEMA DE CONCLUSÃO/PROGRESSO novo da VPS (inexistente em 01/09): POST /aluno/cursos/:id/aulas/:aulaId/concluir -> 200 ({success, message, progresso}), GET /aluno/cursos/:id/progresso -> 200 ({total_aulas, aulas_concluidas, percentual}) e campos concluida/concluida_em em cada aula. IMPLEMENTADO o avanço real entre as 4 aulas: novo proxy backend POST /cursos/:id/aulas/:aulaId/concluir + botões "Aula anterior"/"Concluir e avançar" no CursoAulaPage que marcam a aula atual como concluída na VPS (endpoint real) e avançam; "Concluir e avançar" desabilitado na última aula (sem prova/etapa 2); checkmark de conclusão na sidebar. IMPEDIMENTO de PROVAS entre etapas mantido: a VPS NÃO possui sistema de provas (todos os endpoints de prova 404 mesmo com token válido; aulas sem campos prova/etapa) — nenhum dado simulado, comportamento atual preservado. Preservados: botões Anterior/Próxima de PÁGINA do PDF, matrícula, salvamento de respostas, autenticação, SSO, permissões, VPS, conteúdo cadastrado.', rota: '/relatorio-correcao-navegacao-painel-aluno-curso29/download', arquivo: 'relatorio-correcao-navegacao-painel-aluno-curso29-02-09-2026.txt', icon: Wrench },
  { id: 'correcaoNavegacaoGenericaPainelAluno', data: '2026-09-02', titulo: 'Correção Genérica Navegação Painel do Aluno - Provas por Etapa - 02/09/2026', descricao: 'Correção GENÉRICA da navegação do Painel do Aluno para qualquer curso (sem IDs/nomes fixos). Remove o botão inferior "Concluir e avançar" e unifica a navegação no botão "Próxima" (avança páginas + regra de prova/avanço na última página). Localiza e ABRE a prova real pelo vínculo prova.etapa_id===aula.id (via /mentor/cursos/:id/provas, mentor-only; backend faz bridge-login como mentor dono do curso). provas_por_aula agora é populado com o vínculo real (antes vazio). IMPEDIMENTO: a VPS NÃO possui endpoints de prova para aluno (envio/resultado/aprovação — todos 404); a prova é localizada e aberta (sem gabarito) mas não pode ser enviada/corrigida. Cenários: sem provas (comprovado), prova no final (não comprovado), provas em todas as etapas (não comprovado), provas alternadas (parcialmente comprovado — Curso 29). Preserva autenticação, matrículas, progresso, "Página X de Y", Anterior/Próxima, status "Concluída" e visual. Contrato da API inalterado; nenhum dado simulado.', rota: '/relatorio-correcao-navegacao-generica-painel-aluno/download', arquivo: 'relatorio-correcao-navegacao-generica-painel-aluno-02-09-2026.txt', icon: Wrench },

  // ===== 03/09/2026 =====
  { id: 'alteracaoFluxoLoginBridge', data: '2026-09-03', titulo: 'Alteração Fluxo de Login - Bridge-Login Direto do Frontend - 03/09/2026', descricao: 'Alterado SOMENTE o fluxo de login (bridge-login) no frontend: a chamada agora vai DIRETAMENTE para https://api.conexaobatista.com.br/api/bridge-login, sem o header x-bridge-secret, sem CURSOS_API_BRIDGE_SECRET e sem o token PocketBase no navegador. Body exatamente { pocketbase_id, email, nome, mentor_status }. URL final confirmada sem duplicação /api/api/bridge-login (fetch direto, sem prefixo /hcgi/api). Tratamento de resposta, erros, redirecionamentos e sessão preservados. Backend, SSO de aluno, login de mentor e demais endpoints NÃO alterados. Confirmação no navegador registrada como NÃO COMPROVADA (execução no navegador não realizada no sandbox).', rota: '/relatorio-alteracao-fluxo-login-bridge/download', arquivo: 'relatorio-alteracao-fluxo-login-bridge-03-09-2026.txt', icon: LogIn },
  { id: 'reversaoFluxoLoginBridge', data: '2026-09-03', titulo: 'Reversão Fluxo de Login - Bridge-Login via Proxy Express - 03/09/2026', descricao: 'Revertida a alteração anterior: renovarToken() restaurada para chamar o backend via apiServerClient.fetch(\'/cursos/bridge-login\', ...) enviando o token do PocketBase no header Authorization (Bearer), como estava antes. A rota proxy /cursos/bridge-login do backend (cursos-sso.js) permanece responsável por validar o usuário (authMiddleware) e adicionar o segredo (x-bridge-secret) internamente. Nenhum segredo trafega pelo navegador. Arquivo alterado: apps/web/src/services/cursosAuthService.js. Endpoint final: /hcgi/api/cursos/bridge-login. Tratamento de resposta, erros, redirecionamentos e sessão preservados. Backend, SSO de aluno, login de mentor e demais endpoints NÃO alterados. Confirmação no navegador registrada como NÃO COMPROVADA.', rota: '/relatorio-reversao-fluxo-login-bridge/download', arquivo: 'relatorio-reversao-fluxo-login-bridge-03-09-2026.txt', icon: LogIn },
  { id: 'correcaoVariavelApiVps', data: '2026-09-03', titulo: 'Auditoria Variável da API da VPS - Domínio', descricao: 'Auditoria das variáveis de ambiente do projeto. A ocorrência curso.conexaobatista.com.br não foi encontrada na configuração real; nenhum valor sensível é exibido e nenhuma alteração indevida foi aplicada. Validação de tráfego real registrada como NÃO COMPROVADA.', rota: '/relatorio-correcao-variavel-api-vps/download', arquivo: 'relatorio-correcao-variavel-api-vps-03-09-2026.txt', icon: Settings },
  { id: 'auditoriaFluxosLogin', data: '2026-09-03', titulo: 'Auditoria dos Fluxos de Login e SSO', descricao: 'Identifica a variável efetiva, URLs completas sem segredos, endpoints exatos na VPS e trechos relevantes dos fluxos de usuário, cursos, mentor e aluno.', rota: '/relatorio-auditoria-fluxos-login/download', arquivo: 'relatorio-auditoria-fluxos-login.txt', icon: LogIn },
  { id: 'diagnosticoBridgeSecret', data: '2026-09-03', titulo: 'Diagnóstico do Segredo Bridge-Login', descricao: 'Teste real contra a VPS com CURSOS_API_BRIDGE_SECRET (mascarado). Confirma que o segredo do projeto é aceito pela VPS (403 sem/errado, 201/404/500 com correto). Nenhuma correção aplicada.', rota: '/relatorio-diagnostico-bridge-secret/download', arquivo: 'relatorio-diagnostico-bridge-secret.txt', icon: KeySquare },

  // ===== 07/09/2026 =====
  { id: 'correcaoRenderizacaoYoutube', data: '2026-09-07', titulo: 'Correção Renderização de Vídeos do YouTube nas Aulas - 07/09/2026', descricao: 'Correção SOMENTE no frontend (CursoAulaPage.jsx) para renderizar vídeos do YouTube das aulas. O frontend passou a ler o campo youtube_id da VPS (ID puro ou URL completa), extrair o ID de vários formatos (watch, youtu.be, embed, shorts, com parâmetros extras), montar a URL de embed e renderizar um <iframe> responsivo 16:9. Adicionado fallback de "Vídeo indisponível" para valores inválidos/ausentes e preservada a renderização de vídeo direto, imagem, PDF e aulas sem material. Não altera backend, banco, permissões, matrícula, autenticação, SSO ou endpoints. Validação no navegador registrada como NÃO COMPROVADA.', rota: '/relatorio-correcao-renderizacao-youtube/download', arquivo: 'relatorio-correcao-renderizacao-youtube-07-09-2026.txt', icon: GraduationCap },
  { id: 'correcaoFrontendTiposMidia', data: '2026-09-07', titulo: 'Correção Geral Frontend - Renderização por Tipo de Aula + Provas por Configuração Real - 07/09/2026', descricao: 'Correção SOMENTE no frontend (CursoAulaPage.jsx) para renderização reutilizável em todos os cursos. A seleção de mídia passou a ser orientada pelo campo `tipo` da aula (slide | video | imagem | pdf), com subtipo video_type (youtube | upload) só quando tipo=video; a presença isolada de youtube_id/video_url/video_type NÃO classifica mais como YouTube (bug: aula slide com video_type=youtube herdado exibia "Vídeo indisponível"). Adicionada renderização de slides (deck PDF em conteudo_url via pdf.js), vídeo upload (Cloudinary) e imagem (conteudo_url), com estados claros para material ausente/inválido. Provas posicionadas pela configuração real do mentor (etapa_id===aula.id), sem regra fixa. Genérico; curso 29 apenas como caso de teste. Não altera backend, banco, permissões, matrícula, autenticação, SSO ou endpoints. Validação no navegador registrada como NÃO COMPROVADA (todos os itens).', rota: '/relatorio-correcao-frontend-tipos-midia/download', arquivo: 'relatorio-correcao-frontend-tipos-midia-07-09-2026.txt', icon: Presentation },

  // ===== Sequência numerada (pedido do usuário) =====
  { id: 'correcao01UrlsSlides', data: '2026-09-07', titulo: 'Relatório de correção 01 - Normalização segura de URLs de slides', descricao: 'Corrige o erro "url.startsWith is not a function" ao abrir aulas tipo slide. Função extrairUrlSegura normaliza string, objeto (url/secure_url/href/…), array, null ou inválido antes de pdf.js e do botão Baixar slides. Classificação por tipo do backend preservada; genérico para todos os cursos. Validação autenticada ao vivo: NÃO COMPROVADA.', rota: '/relatorio-correcao-01-urls-slides/download', arquivo: 'relatorio-de-correcao-01-urls-slides.txt', icon: Presentation },
  { id: 'correcao02UrlsSlides', data: '2026-09-07', titulo: 'Relatório de correção 02 - Validação HTTP(S) de URLs de slides antes do pdf.js', descricao: 'Corrige de forma definitiva o erro "url.startsWith is not a function" no componente de slides. Adiciona ehUrlHttpValida() (só chama pdf.js quando a URL normalizada é HTTP(S) absoluta) e mensagemAmigavelErro() (traduz erros técnicos do pdf.js em mensagens PT-BR). Botão "Baixar slides" só aparece com URL HTTP(S) válida; sem URL, mostra "Material de slides indisponível" sem bloquear conclusão ou navegação (Anterior/Próxima). Classificação por tipo, vídeos, imagens, navegação e provas preservados. Genérico para todos os cursos. Validação autenticada ao vivo (curso 29, 1ª aula e retorno após conclusão): NÃO COMPROVADA.', rota: '/relatorio-correcao-02-urls-slides/download', arquivo: 'relatorio-de-correcao-02-urls-slides.txt', icon: Presentation },
  { id: 'correcao03MensagemFalsaSlides', data: '2026-09-07', titulo: 'Relatório de correção 03 - Mensagem falsa "Material de slides indisponível" em aulas do tipo slide', descricao: 'Corrige SOMENTE no frontend (CursoAulaPage.jsx) a mensagem falsa "Material de slides indisponível" que aparecia em aulas do tipo slide cujo PDF carrega corretamente. Causa raiz: ao trocar de aula, um erroPdf STALE de uma aula anterior era renderizado antes do useEffect de carregamento limpar o estado. Correção: (1) reset imediato do estado do PDF durante o render quando aulaSelecionada.id muda (padrão React "adjusting state when props change"), zerando pdfDoc/erroPdf/carregandoPdf antes de qualquer saída; (2) reordenação do ternário do slide para que carregandoPdf e pdfDoc tenham prioridade sobre as mensagens de erro — a mensagem "indisponível" só aparece quando carregandoPdf=false E pdfDoc=null E (!slideUrlValida OU erroPdf). Visualizador atual, botão "Baixar slides", "Material de apoio", conclusão da aula, navegação (Anterior/Próxima), provas, vídeos YouTube/upload e imagens preservados. Não altera backend, banco, autenticação, permissões ou dados. Genérico para todos os cursos. Validação autenticada ao vivo: NÃO COMPROVADA.', rota: '/relatorio-correcao-03-mensagem-falsa-slides/download', arquivo: 'relatorio-de-correcao-03-mensagem-falsa-slides.txt', icon: Presentation },

  // ===== 07/09/2026 — Endpoints de Prova do Aluno =====
  { id: 'implementacaoProvasAluno', data: '2026-09-07', titulo: 'Relatório de Implementação - Endpoints de Prova do Aluno', descricao: 'Camada de API do aluno para provas: abrir a prova (sem gabarito), enviar respostas e receber o resultado (nota + aprovação). Proxy Hostinger (POST /cursos/:id/provas/:provaId/respostas, GET .../resultado) + código-fonte da rota da VPS (alunoProvas.js) para deploy manual. Reutiliza as tabelas já existentes (provas, provas_perguntas, provas_alternativas, provas_respostas, provas_resultados, matriculas) — sem alterar o schema nem as rotas do mentor. Frontend interativo (seleção, envio, resultado, tentativa única). Nenhum dado simulado; gabarito nunca exposto.', rota: '/relatorio-implementacao-provas-aluno/download', arquivo: 'relatorio-implementacao-provas-aluno-07-09-2026.txt', icon: GraduationCap },
  { id: 'vpsAlunoProvasDownload', data: '2026-09-07', titulo: 'Código VPS - Endpoints de Prova do Aluno (alunoProvas.js)', descricao: 'Arquivo-fonte src/routes/alunoProvas.js para deploy manual na VPS cursos-api (container cursos-api). Contém os três endpoints reais do aluno (GET /aluno/cursos/:cursoId/provas/:provaId, POST /aluno/provas/:provaId/respostas, GET /aluno/provas/:provaId/resultado) em Express + pool PostgreSQL + auth JWT, reutilizando as tabelas existentes e sem expor o gabarito. Inclui instruções de montagem em /aluno.', rota: '/adm/vps-aluno-provas-download', arquivo: 'alunoProvas.js', icon: FileText },

  // ===== 08/09/2026 — Ajuste dos endpoints de prova do aluno (VPS) =====
  { id: 'ajusteEndpointsProvasAluno', data: '2026-09-08', titulo: 'Relatório de Ajuste - Endpoints de Prova do Aluno (VPS)', descricao: 'Ajuste da integração frontend↔proxy↔VPS para os endpoints oficiais de prova do aluno (correção automática, já testados na VPS). Proxy agora repassa: GET /aluno/cursos/:cursoId/provas (listar — NOVO), GET /aluno/provas/:provaId (detalhes sem gabarito — substitui o workaround de bridge-login como mentor), POST /aluno/provas/:provaId/responder (enviar respostas — corrigido de /respostas para /responder, eliminando o 404 "endpoint ainda não disponível") e GET /aluno/provas/:provaId/resultado (ver resultado — caminho já correto). Gabarito (campo correta) ocultado para o aluno (VPS + remoção defensiva no proxy). Frontend ganhou getProvasCurso(). Rotas do mentor, schema do banco, autenticação, SSO, matrículas e permissões intactos. Nenhum dado simulado. Validação autenticada ao vivo: NÃO COMPROVADA.', rota: '/relatorio-ajuste-endpoints-provas-aluno/download', arquivo: 'relatorio-ajuste-endpoints-provas-aluno-08-09-2026.txt', icon: GraduationCap },
  { id: 'correcaoExibicaoProvaAluno', data: '2026-09-08', titulo: 'Relatório de Correção - Exibição da Prova do Aluno (Fallback de Detalhe)', descricao: 'Restaura a exibição da prova (perguntas + alternativas) e o envio de respostas, quebrada após o ajuste de 08/09 que reescreveu o detalhe para GET /aluno/provas/:provaId (ainda não deployado na VPS → 404/403 → "Prova não localizada"). Causa raiz: o provaId (do vínculo etapa_id===aula.id via /mentor/cursos/:id/provas) continuava válido, mas o novo endpoint de aluno não estava disponível. Correção: rota cursos-prova-detalhe.js com estratégia de camadas — Camada 1 (aluno, /aluno/provas/:provaId, preferencial) + Camada 2 (mentor fallback, buscarProvaDetalhe → /mentor/cursos/:id/provas/:provaId, mesmo id space). Gabarito (correta) removido defensivamente em ambas as camadas. Endpoints de lista/respostas/resultado (ajustes 08/09 para /aluno/*) preservados. Rotas do mentor, schema, auth, SSO, matrículas, vídeos, PDFs/slides e navegação intactos. Nenhum dado simulado; sem regras específicas para o curso 29. Validação autenticada ao vivo: NÃO COMPROVADA.', rota: '/relatorio-correcao-exibicao-prova-aluno/download', arquivo: 'relatorio-correcao-exibicao-prova-aluno-08-09-2026.txt', icon: GraduationCap },
  { id: 'correcaoAborterrorPocketbase', data: '2026-09-08', titulo: 'Relatório de Correção - AbortError "signal is aborted without reason" (PocketBase)', descricao: 'Corrige o erro de console AbortError após login com PocketBase nos componentes IgrejaLayout, MeusVinculosSection e PainelIgrejaCard. Causa raiz: o auto-cancelamento do SDK PocketBase 0.27.x cancela requisições simultâneas sobre a mesma coleção (chave = method + path base, sem query params), fazendo os três componentes se cancelarem mutuamente ao montar. Correção: cada useEffect passou a criar seu PRÓPRIO AbortController, repassar { requestKey: null, signal } às chamadas PB (desativa o auto-cancelamento do SDK e respeita o sinal do componente), abortar no cleanup e tratar cancelamentos esperados silenciosamente (sem console.error nem setState após abort). Erros reais (auth/rede/banco) seguem registrados via console.error. verificarAcessoPainel tornou-se backward-compatible (signal opcional) — SiteLayout não quebra. Fluxo de login, autenticação, coleções, filtros, permissões e layout intactos. Validação por inspeção de código: COMPROVADA; validação autenticada ao vivo (login, montagem simultânea, troca de usuário, desmontagem): NÃO COMPROVADA.', rota: '/relatorio-correcao-aborterror-pocketbase/download', arquivo: 'relatorio-correcao-aborterror-pocketbase-08-09-2026.txt', icon: Wrench },

  // ===== 09/09/2026 — Sincronização do estado de matrícula no frontend =====
  { id: 'sincronizacaoEstadoMatricula', data: '2026-09-09', titulo: 'Relatório de Correção - Sincronização do Estado de Matrícula no Frontend', descricao: 'Corrige exclusivamente a sincronização do estado de matrícula no frontend. (1) Ao excluir uma matrícula (botão "Cancelar matrícula" em Meus Cursos), limpa imediatamente da interface o curso selecionado, a lista de cursos matriculados e o indicador de "já matriculado", sem aguardar re-fetch. (2) Ao voltar à tela de inscrição (CursoDetalhePage) ou abrir um curso (CursoAulaPage), consulta novamente o estado real na API (verificarMatricula no PocketBase), sem reutilizar dados antigos do estado local ou cache do carrinho. (3) Se a API confirmar que o aluno não está matriculado, mostra a opção de inscrição normalmente e NÃO exibe a mensagem de sessão expirada (distinção "não matriculado" vs. "sessão expirada" via verificação real). Documenta também o que NÃO foi feito nas duas alterações anteriores (auditorias de leitura de 09/09). Autenticação, SSO, backend, VPS, provas, progresso, layout e schema intactos. Validação por inspeção de código: COMPROVADA; validação autenticada ao vivo: NÃO COMPROVADA.', rota: '/relatorio-sincronizacao-estado-matricula/download', arquivo: 'relatorio-sincronizacao-estado-matricula-09-09-2026.txt', icon: RefreshCw },
  { id: 'inicializacaoNovaMatricula', data: '2026-09-09', titulo: 'Relatório de Correção - Inicialização de Nova Matrícula no Frontend', descricao: 'Corrige exclusivamente a inicialização de uma nova matrícula no frontend. Após cancelar e re-inscrever, o frontend refaz as consultas reais de matrícula e progresso na API (getProgresso) e limpa estados locais antigos de curso concluído, aulas concluídas e progresso quando o progresso retornado for 0% ou não houver registros para a nova matrícula — não exibe o curso como concluído em matrícula nova. Impede o cancelamento de matrícula com progresso maior que zero. Investiga e informa onde o estado antigo foi encontrado (inclusive registros antigos de progresso_aulas devolvidos pela VPS em GET /aluno/cursos/:id/aulas), sem excluir dados da VPS e sem alterar backend, autenticação, SSO, provas, layout ou publicação. Validação por inspeção de código: COMPROVADA; validação autenticada ao vivo: NÃO COMPROVADA.', rota: '/relatorio-inicializacao-nova-matricula/download', arquivo: 'relatorio-inicializacao-nova-matricula-09-09-2026.txt', icon: RefreshCw },
  { id: 'investigacaoCancelamentoMatricula', data: '2026-09-09', titulo: 'Relatório de Investigação - Cancelamento × Meus Cursos × Sessão Expirada', descricao: 'Investigação EXCLUSIVAMENTE de leitura. Rastreia cancelarMatricula (remove APENAS o registro no PocketBase; NENHUMA chamada à VPS), a fonte usada por getMeusCursos (PocketBase coleção matriculas) e a fonte usada para validar o acesso ao abrir a aula (VPS GET /aluno/cursos/:id/aulas com token bridge-login). Confirma que o cancelamento NÃO propaga para a VPS (DELETE /cursos/:id/matricula → 404; a matrícula VPS permanece ativa) — divergência entre as duas fontes de verdade. Documenta a origem da mensagem "Sua sessão na plataforma de cursos expirou" (VPS retorna 401 para /aluno/cursos/:id/aulas mesmo após renovação do token; proxy + frontend interpretam como sessão expirada; verificarMatricula consulta PocketBase, que ainda tem o registro, e exibe "sessão expirada" em vez de "não matriculado"). Informa qual lado precisa ser corrigido (propagar cancelamento para a VPS — exige endpoint VPS que não existe — OU tornar a lista sourcing da VPS) e as limitações sem sessão autenticada ao vivo. Nenhum código, banco, backend, autenticação, SSO, progresso, layout ou publicação alterado.', rota: '/relatorio-investigacao-cancelamento-matricula/download', arquivo: 'relatorio-investigacao-cancelamento-matricula-09-09-2026.txt', icon: Search },

  // ===== 09/09/2026 — Correção do menu do frontend (mentor × aluno) =====
  { id: 'correcaoMenuMentorAluno', data: '2026-09-09', titulo: 'Relatório de Correção - Menu do Frontend (Mentor × Aluno)', descricao: 'Correção EXCLUSIVA do menu do frontend (CursoLayout.jsx): usuários autenticados com função de aluno (users.mentor_status !== "aprovado") não veem e não podem abrir os links "Meus Cursos (Mentor)" (/curso/mentor-cursos) e "Área do mentor" (/curso/boas-vindas, que leva ao Painel do Mentor hospedado na VPS via SSO). Itens mentorOnly filtrados do cabeçalho (desktop + mobile) e do rodapé para não mentores aprovados, de forma reativa (pb.authStore.onChange). Permanece somente a navegação do Painel do Aluno. Não recria o Painel do Mentor, não altera URL da VPS, backend, API, cursos, matrículas, progresso, autenticação, SSO ou publicação. Validação por inspeção de código COMPROVADA; validação autenticada ao vivo NÃO COMPROVADA.', rota: '/relatorio-correcao-menu-mentor-aluno/download', arquivo: 'relatorio-correcao-menu-mentor-aluno-09-09-2026.txt', icon: Menu },
  { id: 'revalidacaoCursosPortal', data: '2026-09-09', titulo: 'Relatório de Correção - Revalidação de Cursos do Portal + Remoção do Item Mentor', descricao: 'Correção EXCLUSIVA no frontend do portal: (1) removido completamente do menu (cabeçalho desktop + mobile e rodapé) e da rota /curso/mentor-cursos (App.jsx) o item "Meus Cursos (Mentor)" — para alunos E mentores. O Painel do Mentor já funciona separadamente na VPS (acessível pelo link "Área do mentor" via SSO); o painel NÃO foi recriado e a URL da VPS NÃO foi alterada. (2) getMeusCursos() agora revalida cada matrícula contra GET /cursos-publicados/:id; cursos que retornarem 404 ("Curso não encontrado ou não publicado" — excluídos/inexistentes/não publicados) são removidos do estado local/cache (lista exibida + registro de matrícula local stale). Cursos válidos, matrículas e progresso são preservados. Falhas transitórias (rede/5xx) NÃO removem o curso. Preserva autenticação, SSO, backend, API da VPS, layout, schema e publicação. Validação por inspeção de código COMPROVADA; validação autenticada ao vivo NÃO COMPROVADA.', rota: '/relatorio-revalidacao-cursos-portal/download', arquivo: 'relatorio-revalidacao-cursos-portal-09-09-2026.txt', icon: RefreshCw },
  { id: 'entradaAreaAluno', data: '2026-09-09', titulo: 'Relatório de Correção - Entrada Direta da Área do Aluno', descricao: 'Remoção exclusiva do bloqueio "Antes de continuar" em CursoAlunoPage.jsx. Usuários autenticados seguem diretamente para /curso/meus-cursos sem novo pedido de aceite a cada acesso; textos e links legais existentes permanecem nas páginas apropriadas. Autenticação, SSO, matrículas, progresso, provas, cursos, APIs, painel do mentor e publicação preservados.', rota: '/relatorio-entrada-area-aluno/download', arquivo: 'relatorio-entrada-area-aluno-09-09-2026.txt', icon: RefreshCw },
  { id: 'sincronizacaoExclusaoMatriculaVps', data: '2026-09-09', titulo: 'Relatório de Correção - Sincronização após Exclusão de Matrícula na VPS', descricao: 'Correção EXCLUSIVA no frontend: ao abrir "Meus Cursos" ou "Acessar curso", consulta a matrícula REAL na API da VPS (GET /cursos/meus → /cursos/usuario/meus, fonte oficial). Se a VPS confirmar que o aluno não está matriculado (matrícula excluída no painel administrativo da VPS), remove imediatamente o curso da lista, do curso selecionado e do estado/cache local (registro PocketBase stale deletado), mostra "Você ainda não está matriculado" e NÃO tenta renovar o bridge-login nem exibe "Sua sessão na plataforma expirou". Nova função verificarMatriculaApi(cursoId) em cursosService.js; getMeusCursos() revalida contra a lista da VPS; CursoAulaPage consulta a matrícula real ANTES de getAulas. Matrículas válidas, progresso, cursos, provas, autenticação, SSO, imagem, layout, backend e publicação preservados. Validação por inspeção de código COMPROVADA; validação autenticada ao vivo NÃO COMPROVADA.', rota: '/relatorio-sincronizacao-exclusao-matricula-vps/download', arquivo: 'relatorio-sincronizacao-exclusao-matricula-vps-09-09-2026.txt', icon: RefreshCw },

  // ===== 09/09/2026 — Prompt 2: origem da imagem dos cards =====
  { id: 'atualizacaoImagemCurso', data: '2026-09-09', titulo: 'Prompt 2, atualizar a imagem do curso', descricao: 'Correção EXCLUSIVA no frontend da origem da imagem dos cards de Cursos e Meus Cursos. Após uma nova inscrição, a imagem passou a ser obtida dos dados ATUAIS do curso retornados pela API (GET /cursos-publicados/:id, campo curso.imagem_url), sem reutilizar a imagem antiga congelada no registro da matrícula (matriculas.curso_imagem). Sem imagem definida → string vazia → placeholder padrão já existente. Não altera título, descrição, preço, progresso, matrícula, autenticação, SSO, layout, API da VPS nem publicação. Validação por inspeção de código COMPROVADA; validação autenticada ao vivo NÃO COMPROVADA.', rota: '/relatorio-atualizacao-imagem-curso/download', arquivo: 'relatorio-atualizacao-imagem-curso-09-09-2026.txt', icon: ImagePlus },

  // ===== 09/09/2026 — Prompt 3: retorno visual após envio da prova =====
  { id: 'atualizacaoResultadoProva', data: '2026-09-09', titulo: 'Prompt 3, atualizar o resultado da prova', descricao: 'Correção EXCLUSIVA no frontend do retorno visual após o envio das respostas da prova. A tela só atualiza após a confirmação REAL da API (POST /cursos/:id/provas/:provaId/respostas), usando os campos retornados (nota, aprovado, total_perguntas, total_acertos, nota_minima) e a correção por questão quando a API a traz (campos respostas/detalhes/correcoes com pergunta_id, correta, alternativa_correta_id). Nenhum resultado é inventado localmente. Bloqueia novo envio da mesma questão/prova já registrada (sucesso ou 409). Se a API não trouxer correção por questão, informa claramente que a correção detalhada depende do backend. Não altera provas, banco, autenticação, progresso, cursos ou publicação. Validação por inspeção de código COMPROVADA; validação autenticada ao vivo NÃO COMPROVADA.', rota: '/relatorio-atualizacao-resultado-prova/download', arquivo: 'relatorio-atualizacao-resultado-prova-09-09-2026.txt', icon: ClipboardCheck },
  { id: 'prompt4FinalizarRetornarAluno', data: '2026-09-09', titulo: 'Prompt 4, finalizar e retornar ao aluno', descricao: 'Correção EXCLUSIVA no frontend do fluxo após a confirmação da conclusão final do curso. Quando a API confirma que todas as aulas foram concluídas (getProgresso → GET /cursos/:id/progresso → percentual >= 100), preserva o registro de conclusão, mantém a mensagem de sucesso já existente visível e navega automaticamente para a página principal do Painel do Aluno (/curso/meus-cursos) após 2 segundos. Não altera matrícula, progresso, provas, autenticação, SSO, cursos, painel do mentor, API da VPS ou publicação. Validação por inspeção de código COMPROVADA; validação autenticada ao vivo NÃO COMPROVADA.', rota: '/relatorio-prompt4-finalizar-retornar-aluno/download', arquivo: 'relatorio-prompt4-finalizar-retornar-aluno-09-09-2026.txt', icon: GraduationCap },

  // ===== 10/09/2026 — Investigação do fluxo de provas no frontend =====
  { id: 'investigacaoFluxoProvaFrontend', data: '2026-09-10', titulo: 'Investigação do fluxo de envio e exibição do resultado da prova', descricao: 'Rastreio SOMENTE LEITURA do fluxo de provas no frontend, sem alterar código, layout, banco, autenticação, SSO, API da VPS ou publicação. Caminho completo: CursoProvaPage.jsx (useEffect carregarProva → getProvaDetalhe GET /cursos/:id/provas/:provaId; selecionar onChange dos radios; enviarProva onClick do botão → enviarRespostasProva POST /cursos/:id/provas/:provaId/respostas, payload { respostas: [{ pergunta_id, alternativa_id }] }; atualização da tela via extrairCorrecao). Resposta esperada da VPS: { nota, aprovado, total_perguntas, total_acertos, nota_minima } e, opcionalmente, array de correção por questão. Conclusão: o frontend JÁ exibe correção por questão (correta/incorreta) quando a API a devolve; não há ponto de falha na camada de apresentação. Ponto provável do problema: BACKEND/VPS devolve apenas a nota geral sem o array de correção. Próximo lado a corrigir: VPS (incluir array com pergunta_id, correta, alternativa_correta_id). Nenhum resultado inventado no frontend. Validação por inspeção de código COMPROVADA; validação autenticada ao vivo NÃO COMPROVADA.', rota: '/relatorio-investigacao-fluxo-prova-frontend/download', arquivo: 'relatorio-investigacao-fluxo-prova-frontend-10-09-2026.txt', icon: ClipboardCheck },
  { id: 'investigacaoEnvioRespostasProvaFrontend', data: '2026-09-10', titulo: 'Diagnóstico do envio das respostas da prova no frontend', descricao: 'Investigação SOMENTE LEITURA do payload real enviado por CursoProvaPage.jsx. Confirma o contrato { respostas: [{ pergunta_id, alternativa_id }] }: nome correto, array preenchido e identificadores enviados; a evidência de rede registrou POST /cursos/31/provas/8/respostas com { respostas: [{ pergunta_id: "8", alternativa_id: "29" }] } e retorno "Você já respondeu esta prova". A mensagem visual "Respostas inválidas" é um mapeamento genérico de HTTP 400 no serviço, não evidência de nome, lista, tipo ou identificadores incorretos. `extrairCorrecao` procura listas separadas no nível superior da resposta (`respostas`/`correcoes`), mas não dentro de `resultado`. Sem alterações funcionais em prova, backend, autenticação, SSO, layout ou publicação.', rota: '/relatorio-investigacao-envio-respostas-prova-frontend/download', arquivo: 'relatorio-investigacao-envio-respostas-prova-frontend-10-09-2026.txt', icon: Search },

  // ===== 10/09/2026 — Logo Institucional =====
  { id: 'logoInstitucional', data: '2026-09-10', titulo: 'Relatório de Implementação — Logo Institucional', descricao: 'Adição exclusiva ao painel administrativo de uma área de gerenciamento do logo institucional. Administradores enviam/substituem/removem uma imagem de logo armazenada no armazenamento integrado do projeto (PocketBase file storage — coleção config_logo), sem filesystem local. O cabeçalho exibe o logo personalizado em todas as áreas públicas com tamanho responsivo (desktop/celular), proporção preservada, sem distorção e boa legibilidade; mantém o logo padrão quando nenhum personalizado existe. Acesso restrito a administradores. Não altera páginas, rotas, autenticação, cursos, Área do Aluno, Painel do Mentor, integrações, API da VPS nem publicação.', rota: '/relatorio-logo-institucional/download', arquivo: 'relatorio-logo-institucional-10-09-2026.txt', icon: ImageIcon },
  { id: 'logoTransparencia', data: '2026-09-10', titulo: 'Relatório de Implementação — Logo Institucional: PNG Transparente e Marca Única', descricao: 'Alterações exclusivas de identidade visual e gerenciamento do logo: aceitar e usar PNG com fundo transparente (preservando a transparência sobre o fundo azul do site, sem caixa branca); remover o texto duplicado ao lado do logo no cabeçalho, usando o logo institucional como único elemento de marca; altura visual responsiva equivalente à escrita anterior (h-7/h-8, sem distorção, desktop e celular); manter o logo padrão atual como fallback quando não há PNG personalizado; aplicar o logo configurado nas áreas públicas que já exibem a identidade institucional (cabeçalho e rodapé). Não altera páginas, rotas, autenticação, cursos, Área do Aluno, Painel do Mentor, integrações, API da VPS nem publicação.', rota: '/relatorio-logo-transparencia/download', arquivo: 'relatorio-logo-transparencia-10-09-2026.txt', icon: ImageIcon }
];

// Datas únicas em ordem decrescente (mais recente primeiro).
const DATAS = [...new Set(RELATORIOS.map((r) => r.data))].sort().reverse();

/** Formata data ISO (YYYY-MM-DD) para exibição: DD/MM/YYYY. */
function formatarDataBR(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** Conta quantos relatórios existem em uma data. */
function contarRelatorios(data) {
  return RELATORIOS.filter((r) => r.data === data).length;
}

export default function RelatorioAlteracoesPage() {
  const { admin, logout } = useAdminAuth();
  const [dataSelecionada, setDataSelecionada] = useState(DATAS[0] || null);
  const [historico, setHistorico] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [erroMap, setErroMap] = useState({});

  const relatoriosFiltrados = useMemo(
    () => (dataSelecionada ? RELATORIOS.filter((r) => r.data === dataSelecionada) : []),
    [dataSelecionada],
  );

  const baixar = useCallback(
    async (rel) => {
      setStatusMap((s) => ({ ...s, [rel.id]: 'loading' }));
      setErroMap((e) => ({ ...e, [rel.id]: '' }));
      try {
        const token = pb.authStore.token || '';
        const res = await apiServerClient.fetch(rel.rota, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Sessão admin expirada/inválida — limpa o authStore para que o
            // AdminLayout redirecione ao login (/adm/login).
            logout();
            throw new Error('Sua sessão expirou. Faça login novamente.');
          }
          throw new Error(`Falha ao gerar o relatório (HTTP ${res.status}).`);
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = rel.arquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setStatusMap((s) => ({ ...s, [rel.id]: 'ok' }));
        setHistorico((h) => [
          {
            quando: new Date().toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
            }),
            por: admin?.name || admin?.username || '—',
            arquivo: rel.arquivo,
          },
          ...h,
        ]);
      } catch (e) {
        setErroMap((er) => ({ ...er, [rel.id]: e?.message || 'Erro inesperado ao baixar o relatório.' }));
        setStatusMap((s) => ({ ...s, [rel.id]: 'erro' }));
      }
    },
    [admin, logout],
  );

  return (
    <>
      <Helmet>
        <title>Relatórios de Alterações — Conexão Batista</title>
        <meta
          name="description"
          content="Painel administrativo de relatórios de alterações, organizados por data."
        />
      </Helmet>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            Relatórios de Alterações
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione uma data para visualizar os relatórios de alterações
            registrados naquele dia. Todos os relatórios são gerados em memória
            e o acesso é restrito a administradores.
          </p>
        </div>

        {/* Painel de datas */}
        <div className="mb-8 rounded-xl border border-border bg-muted/40 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
            <CalendarDays size={16} className="text-primary" />
            Selecione uma data
          </h2>
          <div className="flex flex-wrap gap-2">
            {DATAS.map((data) => {
              const ativo = dataSelecionada === data;
              const count = contarRelatorios(data);
              return (
                <button
                  key={data}
                  type="button"
                  onClick={() => setDataSelecionada(data)}
                  className={`inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                    ativo
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  <span>{formatarDataBR(data)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      ativo
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Relatórios do dia selecionado */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">
            Relatórios de {dataSelecionada ? formatarDataBR(dataSelecionada) : '—'}
          </h2>
          <span className="text-sm font-semibold text-muted-foreground">
            {relatoriosFiltrados.length}{' '}
            {relatoriosFiltrados.length === 1 ? 'relatório' : 'relatórios'}
          </span>
        </div>

        {relatoriosFiltrados.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum relatório nesta data.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatoriosFiltrados.map((rel) => {
              const Icon = rel.icon;
              const status = statusMap[rel.id] || 'idle';
              const erro = erroMap[rel.id] || '';
              return (
                <div
                  key={rel.id}
                  className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold leading-snug text-foreground">
                        {rel.titulo}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-primary">
                        {formatarDataBR(rel.data)}
                      </p>
                    </div>
                  </div>

                  <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {rel.descricao}
                  </p>

                  {status === 'ok' && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Download iniciado! Verifique a pasta de downloads.</span>
                    </div>
                  )}

                  {status === 'erro' && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{erro}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => baixar(rel)}
                    disabled={status === 'loading'}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando…
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Baixar Relatório
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Histórico de downloads da sessão */}
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-foreground">
            <History size={18} className="text-primary" />
            Downloads desta sessão
          </h3>

          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum download realizado nesta sessão ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {historico.map((h, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm"
                >
                  <div className="font-semibold text-foreground">{h.quando}</div>
                  <div className="truncate text-xs font-medium text-primary">
                    {h.arquivo}
                  </div>
                  <div className="text-xs text-muted-foreground">por {h.por}</div>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            O acesso às rotas de download é restrito a administradores e cada
            solicitação é registrada em logs do servidor.
          </p>
        </div>
      </section>
    </>
  );
}
