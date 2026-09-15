// Download do relatório de VERIFICAÇÃO DE PERSISTÊNCIA DE MATRÍCULA (.txt
// gerado em memória).
//
// Documenta a verificação de que a matrícula foi realmente persistida na VPS
// antes de redirecionar para o SSO — tanto no backend (objeto matricula +
// checagem /aluno/cursos) quanto no frontend (confirmação explícita na
// resposta, não assumindo 200 = sucesso).
//
// Rota protegida por adminAuth (coleção `admins`).
// GET /relatorio-verificacao-persistencia-matricula/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const agora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "long",
  });

  return `================================================================================
RELATÓRIO - Verificação de Persistência de Matrícula
================================================================================

Período: 30/08/2026
Data/hora de geração: ${agora} (horário de Brasília)

================================================================================
1. Objetivo
================================================================================

  Garantir que a matrícula seja realmente registrada na VPS antes de
  redirecionar o aluno para o SSO/painel-aluno. Sem persistência na VPS, o
  curso não aparece em "Meus Cursos".

================================================================================
2. Verificação no backend (cursos-matricula.js)
================================================================================

  Passo 4 — GET /cursos/:id/token (Bearer cursosToken):
    A VPS devolve { token, matricula:{ id, usuario_id, curso_id, progresso,
    status, matriculado_em, concluido_em } }. A presença do objeto
    matricula É a confirmação de persistência. Se ausente, o backend lança
    erro ("token endpoint não retornou objeto matricula") e o fluxo aborta.

  Passo 5 — GET /aluno/cursos (best-effort, log):
    Após criar a matrícula, o backend lê /aluno/cursos e verifica se o
    curso_id está presente na lista. O resultado é registrado em log
    ("curso 29 presente ✅" ou "AUSENTE ⚠️"). Não bloqueia o fluxo, mas
    registra evidência para diagnóstico.

  Logs com timestamp ISO em cada etapa (início, curso validado, ensure,
  bridge-login, matrícula VPS criada com id/usuario_id/curso_id/status,
  verificação /aluno/cursos, fim).

================================================================================
3. Verificação no frontend (cursosService.matricularCurso)
================================================================================

  NÃO assume 200 = sucesso. Após receber a resposta, exige confirmação
  explícita de persistência:

    const confirmado = data?.sucesso || data?.matricula ||
                       data?.vps_matricula || data?.id;
    if (!confirmado) {
      throw new Error('Matrícula não foi confirmada pelo servidor.');
    }

  Só então retorna os dados para a página, que prossegue para o SSO.
  Logs detalhados: URL chamada, status HTTP, tempo da requisição, e o
  resumo da confirmação (vps_matricula_id, vps_curso_id, vps_status,
  local_id).

================================================================================
4. Idempotência
================================================================================

  Probe confirmado (30/08/2026): chamadas repetidas a GET /cursos/29/token
  devolvem o MESMO matricula.id (123) — a VPS não duplica matrículas.
  O registro local no PocketBase também é idempotente (índice único
  usuario_id + curso_api_id). Clicar "Inscrever-se" novamente não duplica.

================================================================================
5. Ordem garantida
================================================================================

  matricularCurso() (com verificação) → SÓ DEPOIS getAlunoSso() → redirect.
  O SSO só inicia após a matrícula confirmada. Se a matrícula falha, o SSO
  não é chamado e o erro é exibido ao aluno.

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-verificacao-persistencia-matricula] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorio();
  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-verificacao-persistencia-matricula-30-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
