import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, AlertCircle, ArrowLeft, ArrowRight, ClipboardCheck, CheckCircle2,
    PenLine, Award, BookOpen, Send, CheckCircle, XCircle, Lock,
} from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';
import pb from '@/lib/pocketbaseClient';
import { getProvaDetalhe, getAulas, getResultadoProva, enviarRespostasProva } from '@/services/cursosService';

// Página da prova de uma etapa (aula). Acessada via /curso/:id/prova/:provaId.
//
// IMPLEMENTAÇÃO (07/09/2026 — endpoints de prova do aluno):
// A prova cadastrada pelo mentor é LOCALIZADA pelo vínculo real
// prova.etapa_id === aula.id (via /mentor/cursos/:id/provas, mentor-only; o
// backend faz bridge-login como mentor dono do curso e devolve a prova real
// SEM o gabarito — campo `correta` removido). O aluno seleciona uma
// alternativa por questão e envia as respostas (POST /cursos/:id/provas/
// :provaId/respostas → VPS POST /aluno/provas/:provaId/respostas). A VPS
// valida a matrícula, persiste as respostas (UPSERT), calcula a nota
// ((acertos/total)*100), grava o resultado (UPSERT) e devolve
// { nota, aprovado, total_perguntas, total_acertos, nota_minima } — sem
// gabarito. O resultado também pode ser consultado (GET .../resultado) para
// bloquear reenvio (tentativa única — 409).
//
// Mantém intactos: matrícula, SSO, autenticação, permissões, rotas do mentor
// e backend VPS (apenas leitura/envio via proxy). Nenhum dado é simulado.
export default function CursoProvaPage() {
    const { id, provaId } = useParams();
    const navigate = useNavigate();
    const [curso, setCurso] = useState(null);
    const [prova, setProva] = useState({ existe: false, prova: null, status: 'sem_prova' });
    const [aulas, setAulas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    // Estado do formulário e do resultado.
    const [respostas, setRespostas] = useState({}); // { [pergunta_id]: alternativa_id }
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null); // { nota, aprovado, ... }
    const [erroEnvio, setErroEnvio] = useState('');

    // ===== RETORNO VISUAL APÓS ENVIO (Prompt 3) =====
    // `registrada` = a API confirmou que as respostas foram registradas
    // (sucesso no envio OU 409 — tentativa única já respondida). Enquanto
    // true, BLOQUEIA qualquer novo envio da mesma questão/prova.
    // `correcaoDetalhada` = a API trouxe correção POR QUESTÃO (correta/
    // incorreta + alternativa correta). Quando false, a correção detalhada
    // depende do backend e isso é informado claramente na tela.
    // `correcaoPorQuestao` = Map<pergunta_id, { correta, alternativa_correta_id, escolhida_id }>
    // extraído da resposta real da API — nunca inventado localmente.
    const [registrada, setRegistrada] = useState(false);
    const [correcaoDetalhada, setCorrecaoDetalhada] = useState(false);
    const [correcaoPorQuestao, setCorrecaoPorQuestao] = useState(() => new Map());

    // Carrega o título do curso (proxy público) para o cabeçalho.
    useEffect(() => {
        let cancelado = false;
        async function carregar() {
            try {
                const res = await apiServerClient.fetch(
                    `/cursos-publicados/${encodeURIComponent(id)}`,
                );
                if (!res.ok) throw new Error('Falha ao carregar o curso.');
                const data = await res.json();
                if (!cancelado) setCurso(data.curso || null);
            } catch (e) {
                if (!cancelado) setCurso(null);
            }
        }
        carregar();
        return () => { cancelado = true; };
    }, [id]);

    // Extrai a correção POR QUESTÃO da resposta real da API. Procura por
    // arrays de correção em campos comuns (respostas, detalhes, resultados,
    // perguntas, questoes, correcoes). Nenhum resultado é inventado — só
    // marca correção quando a API devolve explicitamente `correta` (bool) ou
    // `alternativa_correta_id` para a questão.
    function extrairCorrecao(res) {
        const porQuestao = new Map();
        if (!res || typeof res !== 'object') return { detalhada: false, porQuestao };
        const candidatos = [
            res.respostas, res.detalhes, res.resultados, res.correcoes,
            res.resposta_detalhes, res.perguntas, res.questoes, res.questions,
        ].filter(Array.isArray);
        for (const arr of candidatos) {
            for (const item of arr) {
                if (!item || typeof item !== 'object') continue;
                const pid = String(item.pergunta_id ?? item.questao_id ?? item.question_id ?? item.id ?? '');
                if (!pid) continue;
                const correta = item.correta ?? item.certa ?? item.correct ?? item.is_correct ?? null;
                const altCorreta = item.alternativa_correta_id ?? item.correta_id ?? item.resposta_correta_id ?? item.correct_alternative_id ?? item.alternativa_correta ?? null;
                const escolhida = item.alternativa_id ?? item.alternativa_escolhida_id ?? item.resposta_id ?? item.escolhida_id ?? null;
                if (correta !== null || altCorreta !== null) {
                    porQuestao.set(pid, {
                        correta: correta === true || correta === 1 || correta === 'true',
                        alternativa_correta_id: altCorreta !== null && altCorreta !== undefined ? String(altCorreta) : null,
                        escolhida_id: escolhida !== null && escolhida !== undefined ? String(escolhida) : null,
                    });
                }
            }
            if (porQuestao.size > 0) break;
        }
        return { detalhada: porQuestao.size > 0, porQuestao };
    }

    // Carrega a prova real (por provaId), a lista de aulas (para localizar a
    // próxima etapa) e o resultado existente (se o aluno já respondeu).
    useEffect(() => {
        let cancelado = false;
        async function carregarProva() {
            setCarregando(true);
            setErro('');
            setResultado(null);
            setRespostas({});
            setRegistrada(false);
            setCorrecaoDetalhada(false);
            setCorrecaoPorQuestao(new Map());
            try {
                const [dataProva, dataAulas] = await Promise.all([
                    getProvaDetalhe(id, provaId),
                    getAulas(id).catch(() => ({ aulas: [] })),
                ]);
                if (cancelado) return;
                setProva(dataProva || { existe: false, prova: null, status: 'sem_prova' });
                const lista = Array.isArray(dataAulas?.aulas) ? dataAulas.aulas : [];
                const norm = lista
                    .map((a, i) => ({
                        id: a.id ?? a.aula_id ?? String(i + 1),
                        ordem: a.ordem ?? a.numero ?? i + 1,
                        titulo: a.titulo || a.nome || `Aula ${i + 1}`,
                    }))
                    .filter((a) => a.id)
                    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
                setAulas(norm);

                // Tenta carregar um resultado já existente (tentativa única).
                // 404 = ainda não respondeu (fluxo normal). Outros erros são
                // ignorados para não bloquear a abertura da prova.
                // Se houver resultado, a prova já está REGISTRADA → bloqueia
                // reenvio e extrai a correção por questão da resposta da API.
                try {
                    const res = await getResultadoProva(id, provaId);
                    if (!cancelado && res && typeof res.nota === 'number') {
                        setResultado(res);
                        setRegistrada(true);
                        const corr = extrairCorrecao(res);
                        setCorrecaoDetalhada(corr.detalhada);
                        setCorrecaoPorQuestao(corr.porQuestao);
                    }
                } catch (_) {
                    /* ainda não respondida ou endpoint indisponível */
                }
            } catch (e) {
                if (cancelado) return;
                const msgErr = String(e?.message || '');
                if (e?.status === 401 || /sess[aã]o expirou|renovando acesso/i.test(msgErr)) {
                    if (!pb.authStore.isValid) {
                        navigate(`/login?redirect=${encodeURIComponent(`/curso/${id}/prova/${provaId || ''}`)}`, { replace: true });
                        return;
                    }
                }
                setErro(msgErr || 'Não foi possível carregar esta prova.');
                setProva({ existe: false, prova: null, status: 'sem_prova' });
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }
        carregarProva();
        return () => { cancelado = true; };
    }, [id, provaId, navigate]);

    const tituloCurso = curso?.titulo || 'Curso';
    const provaExiste = Boolean(prova?.existe && prova?.prova);
    const dadosProva = prova?.prova || null;
    const questoes = Array.isArray(dadosProva?.perguntas) ? dadosProva.perguntas
        : Array.isArray(dadosProva?.questoes) ? dadosProva.questoes
        : [];

    // Próxima etapa = primeira aula após a aula (etapa_id) desta prova.
    const etapaId = String(dadosProva?.etapa_id ?? '');
    const idxEtapa = aulas.findIndex((a) => String(a.id) === etapaId);
    const proximaEtapa = idxEtapa >= 0 && idxEtapa < aulas.length - 1
        ? aulas[idxEtapa + 1]
        : null;

    const notaMinima = Number(dadosProva?.nota_minima ?? resultado?.nota_minima ?? 60);
    // `jaRespondida` (exibição do cartão de resultado) = há resultado com nota.
    // `registrada` (bloqueio de reenvio) = a API confirmou o registro.
    const jaRespondida = Boolean(resultado && typeof resultado.nota === 'number');

    // Quantas questões foram respondidas (para habilitar o envio).
    const respondidasCount = useMemo(
        () => questoes.filter((q) => respostas[String(q.id)] !== undefined).length,
        [questoes, respostas],
    );
    const todasRespondidas = questoes.length > 0 && respondidasCount === questoes.length;

    function selecionar(perguntaId, alternativaId) {
        if (registrada || enviando) return;
        setRespostas((prev) => ({ ...prev, [String(perguntaId)]: alternativaId }));
        setErroEnvio('');
    }

    // Envia as respostas e usa a resposta REAL da API para atualizar a tela.
    // Após a confirmação (sucesso ou 409), marca `registrada=true` para
    // BLOQUEAR novo envio da mesma questão/prova. A correção por questão é
    // extraída da resposta da API — nunca calculada localmente.
    async function enviarProva() {
        if (registrada || enviando || !todasRespondidas) return;
        setEnviando(true);
        setErroEnvio('');
        try {
            const lista = questoes.map((q) => ({
                pergunta_id: q.id,
                alternativa_id: respostas[String(q.id)],
            }));
            const res = await enviarRespostasProva(id, provaId, lista);
            // API confirmou o registro — atualiza a tela com a resposta real.
            setResultado(res);
            setRegistrada(true);
            const corr = extrairCorrecao(res);
            setCorrecaoDetalhada(corr.detalhada);
            setCorrecaoPorQuestao(corr.porQuestao);
        } catch (e) {
            if (e?.status === 409) {
                // API confirmou: a prova já foi registrada (tentativa única).
                // Bloqueia reenvio e carrega o resultado real existente.
                setRegistrada(true);
                setErroEnvio('');
                try {
                    const res = await getResultadoProva(id, provaId);
                    if (res && typeof res.nota === 'number') {
                        setResultado(res);
                        const corr = extrairCorrecao(res);
                        setCorrecaoDetalhada(corr.detalhada);
                        setCorrecaoPorQuestao(corr.porQuestao);
                    }
                } catch (_) { /* resultado indisponível — bloqueio mantido */ }
            } else {
                setErroEnvio(e?.message || 'Não foi possível enviar suas respostas.');
            }
        } finally {
            setEnviando(false);
        }
    }

    if (carregando) {
        return (
            <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 size={40} className="animate-spin text-primary" />
                <p className="font-display font-semibold">Carregando prova…</p>
            </div>
        );
    }

    return (
        <div className="bg-muted/30">
            <Helmet>
                <title>{tituloCurso} — Prova | Conexão Cursos</title>
                <meta name="description" content={`Prova do curso ${tituloCurso} na plataforma Conexão Cursos.`} />
            </Helmet>

            {/* Cabeçalho compacto — alinhado à tela de aulas */}
            <header className="border-b border-border bg-white">
                <div className="mx-auto max-w-[60rem] px-4 py-5 lg:px-6">
                    <Link to={`/curso/${encodeURIComponent(id)}/aula`} className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary">
                        <ArrowLeft size={14} /> Voltar às aulas
                    </Link>
                    <h1 className="font-display text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
                        {tituloCurso}
                    </h1>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <ClipboardCheck size={14} /> Prova da etapa
                    </p>
                </div>
            </header>

            <div className="mx-auto max-w-[60rem] px-4 py-8 lg:px-6">
                {erro ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
                        <AlertCircle size={36} className="text-destructive" />
                        <p className="font-display text-sm font-bold text-destructive">{erro}</p>
                        <Link to={`/curso/${encodeURIComponent(id)}/aula`} className="mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                            <ArrowLeft size={16} /> Voltar às aulas
                        </Link>
                    </div>
                ) : !provaExiste ? (
                    /* Prova não localizada (não cadastrada ou backend não
                       conseguiu obter o token do mentor) — sem simulação. */
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center shadow-sm">
                        <span className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
                            <BookOpen size={32} />
                        </span>
                        <h2 className="font-display text-xl font-bold text-foreground">
                            Prova não localizada
                        </h2>
                        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                            Não foi possível localizar uma prova cadastrada para esta etapa.
                            Quando o mentor publicar a prova, ela aparecerá automaticamente
                            aqui e na lista de aulas.
                        </p>
                        <Link to={`/curso/${encodeURIComponent(id)}/aula`} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                            <ArrowLeft size={16} /> Voltar às aulas
                        </Link>
                    </div>
                ) : (
                    /* Prova localizada e aberta (dados reais da VPS, sem gabarito). */
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-accent/15 text-accent">
                                    <PenLine size={24} />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="font-display text-xl font-bold text-foreground">
                                        {dadosProva.titulo || dadosProva.titulo_prova || 'Prova da etapa'}
                                    </h2>
                                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${registrada ? 'bg-green-100 text-green-700' : 'bg-accent/20 text-accent'}`}>
                                        {registrada ? 'Respondida' : 'Pendente'}
                                    </span>
                                </div>
                            </div>

                            {dadosProva.nota_minima && (
                                <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/60 px-4 py-3 text-sm">
                                    <Award size={18} className="text-accent" />
                                    <span className="font-semibold text-foreground">Nota mínima para aprovação:</span>
                                    <span className="font-bold text-primary">{dadosProva.nota_minima}</span>
                                </div>
                            )}
                        </div>

                        {/* Cartão de resultado (após envio ou se já respondida). */}
                        {jaRespondida && resultado && (
                            <div className={`rounded-2xl border p-6 shadow-sm ${resultado.aprovado ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                                <div className="flex items-start gap-3">
                                    <span className={`grid h-12 w-12 flex-none place-items-center rounded-xl ${resultado.aprovado ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {resultado.aprovado ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="font-display text-xl font-extrabold text-foreground">
                                            {resultado.aprovado ? 'Parabéns! Você foi aprovado.' : 'Você não atingiu a nota mínima.'}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Sua nota foi computada e registrada na plataforma.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="rounded-lg bg-white/70 px-4 py-3 text-center">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Nota</p>
                                        <p className="font-display text-2xl font-extrabold text-foreground">{resultado.nota}</p>
                                    </div>
                                    <div className="rounded-lg bg-white/70 px-4 py-3 text-center">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Acertos</p>
                                        <p className="font-display text-2xl font-extrabold text-foreground">{resultado.total_acertos}/{resultado.total_perguntas}</p>
                                    </div>
                                    <div className="rounded-lg bg-white/70 px-4 py-3 text-center">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Mínimo</p>
                                        <p className="font-display text-2xl font-extrabold text-foreground">{resultado.nota_minima ?? notaMinima}</p>
                                    </div>
                                    <div className="rounded-lg bg-white/70 px-4 py-3 text-center">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                                        <p className={`font-display text-2xl font-extrabold ${resultado.aprovado ? 'text-green-600' : 'text-red-600'}`}>
                                            {resultado.aprovado ? 'Aprovado' : 'Reprovado'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {questoes.length > 0 ? (
                            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-display text-base font-bold text-primary">Questões</h3>
                                    {!registrada && (
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {respondidasCount}/{questoes.length} respondidas
                                        </span>
                                    )}
                                </div>

                                {/* Aviso: quando a API confirmou o registro mas
                                    NÃO trouxe correção por questão, a correção
                                    detalhada depende do backend. */}
                                {registrada && !correcaoDetalhada && (
                                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>Sua prova foi registrada pela API. A correção detalhada por questão (correta/incorreta) depende do backend — a API retornou apenas a nota geral.</span>
                                    </div>
                                )}

                                <ol className="mt-2 space-y-4">
                                    {questoes.map((q, idx) => {
                                        const perguntaId = String(q.id);
                                        const selecionada = respostas[perguntaId];
                                        const alternativas = q.alternativas || q.opcoes || q.options || [];
                                        const corr = correcaoPorQuestao.get(perguntaId);
                                        const temCorrecao = registrada && Boolean(corr);
                                        return (
                                            <li key={idx} className="rounded-lg border border-border bg-muted/30 p-4">
                                                <p className="font-semibold text-foreground">
                                                    {idx + 1}. {q.texto || q.enunciado || q.pergunta || q.titulo || q.question || ''}
                                                    {temCorrecao && (
                                                        <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${corr.correta ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {corr.correta ? <><CheckCircle size={12} /> Correta</> : <><XCircle size={12} /> Incorreta</>}
                                                        </span>
                                                    )}
                                                </p>
                                                <ul className="mt-3 space-y-1.5">
                                                    {alternativas.map((opt, i) => {
                                                        const altId = opt.id ?? opt.alternativa_id ?? null;
                                                        const letra = opt.letra || String.fromCharCode(65 + i);
                                                        const texto = typeof opt === 'string' ? opt : (opt.texto || opt.label || opt.text || '');
                                                        const checked = selecionada !== undefined && String(selecionada) === String(altId);
                                                        const disabled = registrada || enviando;
                                                        // Destaque de correção (apenas com correção real da API):
                                                        const ehCorreta = temCorrecao && corr.alternativa_correta_id && String(corr.alternativa_correta_id) === String(altId);
                                                        const ehEscolhidaIncorreta = temCorrecao && !corr.correta && checked && !ehCorreta;
                                                        const classeCorrecao = ehCorreta
                                                            ? 'border-green-500 bg-green-50 text-green-800'
                                                            : ehEscolhidaIncorreta
                                                                ? 'border-red-500 bg-red-50 text-red-800'
                                                                : checked
                                                                    ? 'border-primary bg-primary/5 text-foreground'
                                                                    : 'border-transparent text-muted-foreground hover:bg-muted/60';
                                                        return (
                                                            <li key={i}>
                                                                <label
                                                                    className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors ${classeCorrecao} ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`pergunta-${perguntaId}`}
                                                                        value={altId}
                                                                        checked={checked}
                                                                        disabled={disabled}
                                                                        onChange={() => selecionar(perguntaId, altId)}
                                                                        className="h-4 w-4 flex-none accent-primary"
                                                                    />
                                                                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-border bg-white text-xs font-bold text-muted-foreground">
                                                                        {letra}
                                                                    </span>
                                                                    <span>{texto}</span>
                                                                    {ehCorreta && (
                                                                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-green-700"><CheckCircle size={14} /> Resposta correta</span>
                                                                    )}
                                                                    {ehEscolhidaIncorreta && (
                                                                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-red-700"><XCircle size={14} /> Sua resposta</span>
                                                                    )}
                                                                </label>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </li>
                                        );
                                    })}
                                </ol>

                                {/* Envio das respostas (oculta após registrada). */}
                                {!registrada && (
                                    <div className="mt-5 border-t border-border pt-4">
                                        {erroEnvio && (
                                            <div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                                <span>{erroEnvio}</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={enviarProva}
                                            disabled={enviando || !todasRespondidas}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                        >
                                            {enviando ? (
                                                <><Loader2 size={16} className="animate-spin" /> Enviando respostas…</>
                                            ) : (
                                                <><Send size={16} /> Enviar respostas</>
                                            )}
                                        </button>
                                        {!todasRespondidas && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Responda todas as {questoes.length} questões para enviar a prova.
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Atenção: a prova pode ser respondida apenas uma vez. Ao enviar, sua nota será calculada e registrada.
                                        </p>
                                    </div>
                                )}

                                {/* Aviso de bloqueio após registro (tentativa única). */}
                                {registrada && (
                                    <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                                        <Lock size={14} className="mt-0.5 shrink-0" />
                                        <span>Esta prova já foi registrada. O reenvio das respostas está bloqueado.</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border bg-white p-6 text-center shadow-sm">
                                <p className="text-sm text-muted-foreground">
                                    A prova foi cadastrada, mas as questões ainda não foram publicadas.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link to={`/curso/${encodeURIComponent(id)}/aula`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-primary px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                                <ArrowLeft size={16} /> Voltar às aulas
                            </Link>
                            {proximaEtapa ? (
                                <Link
                                    to={`/curso/${encodeURIComponent(id)}/aula?aula=${encodeURIComponent(proximaEtapa.id)}`}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    Continuar para a próxima etapa <ArrowRight size={16} />
                                </Link>
                            ) : (
                                <Link to="/curso/meus-cursos" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                                    <CheckCircle2 size={16} /> Concluir curso
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
