// Download do relatório de TRATAMENTO DE ERROS DE MATRÍCULA E SSO (.txt gerado
// em memória).
//
// Documenta o tratamento separado de erros de matrícula e erros de SSO, com
// mensagens distintas e claras para cada tipo, no backend e no frontend.
//
// Rota protegida por adminAuth (coleção `admins`).
// GET /relatorio-tratamento-erros-matricula-sso/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const agora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "long",
  });

  return `================================================================================
RELATÓRIO - Tratamento de Erros de Matrícula e SSO
================================================================================

Período: 30/08/2026
Data/hora de geração: ${agora} (horário de Brasília)

================================================================================
1. Objetivo
================================================================================

  Tratar erros de matrícula e erros de SSO separadamente, exibindo mensagens
  diferentes e claras para cada tipo, para que o aluno saiba exatamente onde
  o fluxo falhou.

================================================================================
2. Backend — cursos-matricula.js
================================================================================

  Erros de entrada/auth (resposta direta 4xx):
    - Usuário não autenticado → 401 { error: "Não autenticado." }
    - ID do curso ausente → 422 { error: "ID do curso é obrigatório." }
    - Curso não encontrado/não publicado → 404
      { error: "Curso não encontrado ou não publicado." }

  Falhas de infra/upstream (throw → errorMiddleware → 500 com a mensagem):
    - CURSOS_API_BRIDGE_SECRET ausente → throw
    - bridge-login falhou (VPS indisponível/401) → throw
      "Não foi possível autenticar na plataforma de cursos. Tente novamente
       em instantes."
    - GET /cursos/:id/token falhou ou sem objeto matricula → throw
      "Não foi possível registrar sua matrícula na plataforma de cursos.
       Tente novamente."

  Cada throw inclui status + statusText no log (ex.: "bridge-login failed:
  401 Unauthorized"). O registro local no PocketBase é best-effort: se falhar
  após a matrícula VPS já criada, o fluxo NÃO aborta (a VPS já persistiu).

================================================================================
3. Backend — aluno-sso.js
================================================================================

  - Usuário não autenticado → 401 { error: "Não autenticado." }
  - Conta não aprovada (status_aprovacao != "aprovado") → 403
    { error: "Sua conta ainda não foi aprovada. Aguarde a aprovação da sua
      igreja para acessar a área do aluno." }
  - MENTOR_JWT_SECRET ausente → 503 (fail-closed)
    { error: "Área do aluno não configurada. Contate o administrador." }
  - Falha ao assinar JWT → throw

================================================================================
4. Frontend — cursosService.js
================================================================================

  matricularCurso(): mapeia status HTTP para mensagens PT-BR:
    - 401 → "Sua sessão expirou. Faça login novamente para se inscrever."
    - 404 → "Curso não encontrado ou não publicado."
    - outros → mensagem do backend ou "Não foi possível concluir sua matrícula."
    - 200 sem confirmação de persistência → "Matrícula não foi confirmada
      pelo servidor."

  getAlunoSso(): mapeia status HTTP:
    - 401 → "Sua sessão expirou. Faça login novamente para acessar a área
      do aluno."
    - 403 → mensagem do backend (conta não aprovada)
    - 503 → "Área do aluno não configurada. Contate o administrador."

================================================================================
5. Frontend — CursoDetalhePage.jsx (handleInscrever)
================================================================================

  Dois blocos try/catch SEPARADOS:

  Bloco 1 (matrícula):
    catch (e) {
      setErroInscricao(e?.message || 'Erro ao inscrever. Tente novamente.');
      // NÃO prossegue para o SSO
    }

  Bloco 2 (SSO):
    catch (e) {
      setErroInscricao('Erro ao acessar a área do aluno. Tente novamente.');
    }

  Mensagens distintas: erros de matrícula mostram a causa (ex.: "Curso não
  encontrado"); erros de SSO mostram "Erro ao acessar a área do aluno". O
  aluno distingue se a falha foi ao registrar a matrícula ou ao acessar o
  painel. O estado inscrevendo é resetado em ambos os caminhos de erro.

================================================================================
6. Logs correlacionados
================================================================================

  Cada etapa registra timestamp ISO + identificador (user.id, cursoId), sem
  tokens completos nem segredos:
    [matricula][ISO] Início — usuário=… curso=…
    [matricula][ISO] Curso validado: …
    [matricula][ISO] Bridge-login OK (token obtido)
    [matricula][ISO] Matrícula criada na VPS — id=… usuario_id=… curso_id=…
    [matricula][ISO] Verificação /aluno/cursos — curso … presente ✅
    [matricula][ISO] Fim — …

  Frontend (Console): [MATRÍCULA] / [INSCRIÇÃO] / [SSO-ALUNO] com status,
  tempo e confirmação.

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-tratamento-erros-matricula-sso] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorio();
  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-tratamento-erros-matricula-sso-30-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
