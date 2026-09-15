import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { adicionarAoCarrinho } from '@/lib/cursoCarrinho';
import { matricularCurso, verificarMatricula } from '@/services/cursosService';
import CourseBanner from '@/components/curso/CourseBanner';
import CourseHeader from '@/components/curso/CourseHeader';
import CourseSummary from '@/components/curso/CourseSummary';
import CourseTabs from '@/components/curso/CourseTabs';
import CourseAbout from '@/components/curso/CourseAbout';
import CurriculumMatrix from '@/components/curso/CurriculumMatrix';

// Converte o campo texto `matriz_curricular` (vindo da API) em uma estrutura
// de módulos/aulas para o componente CurriculumMatrix. O texto vem como linhas
// numeradas (ex.: "1 – Apresentação do curso"). Linhas de cabeçalho como
// "Matriz Curricular" são ignoradas. Sem inventar conteúdo.
function parseMatrizCurricular(texto) {
    if (!texto || typeof texto !== 'string') return [];
    const linhas = texto
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .filter((l) => !/^matriz\s+curricular$/i.test(l));
    if (linhas.length === 0) return [];
    return [{ titulo: 'Matriz Curricular', aulas: linhas }];
}

// Normaliza um curso da API pública para o formato usado pelos componentes
// de detalhe. Aceita variações de nomes de campos (PT/EN) sem inventar dados.
function normalizarCurso(c) {
    const carga = Number(c.carga_horaria);
    const matriz = parseMatrizCurricular(c.matriz_curricular);
    return {
        id: c.id,
        imagem: c.imagem_url || c.img || '',
        titulo: c.titulo || '',
        categoria: c.categoria || '',
        subcategoria: c.subcategoria || '',
        mentor: c.mentor_nome || c.instrutor || c.mentor_nome || c.autor || '',
        descricao: c.descricao || '',
        descricaoCurta: (c.descricao || '').slice(0, 180),
        cargaHoraria: Number.isFinite(carga) && carga > 0 ? `${carga}h` : '',
        preco: c.preco,
        nivel: c.nivel || '',
        status: c.status || '',
        // Campos opcionais — só exibidos se existirem no banco. Aceita
        // variações de nomes de campos (PT/EN) retornadas pela API externa;
        // quando ausentes sob qualquer variante, segue vazio (placeholder).
        objetivos:
            c.objetivos || c.objetivo || c.course_objectives || c.goals || c.objetivos_curso || '',
        publicoAlvo:
            c.publico_alvo || c.publicoAlvo || c.publico || c.target_audience || c.audience || '',
        prerequisitos:
            c.pre_requisitos || c.preRequisitos || c.prerequisitos || c.prerequisites || c.requirements || c.pre_requisito || '',
        modulos: Array.isArray(c.modulos) ? c.modulos : matriz,
    };
}

// Página de detalhe do curso — layout profissional em 2 colunas (conteúdo +
// sidebar fixo) no desktop, 1 coluna no tablet/mobile, com banner, breadcrumb,
// abas (Sobre / Matriz curricular) e chamada visual para inscrição.
// Consome os dados reais da API (descrição, matriz curricular, mentor, preço).
export default function CursoDetalhePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [curso, setCurso] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [inscrevendo, setInscrevendo] = useState(false);
    const [inscrito, setInscrito] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [erroInscricao, setErroInscricao] = useState('');

    useEffect(() => {
        let cancelado = false;
        async function carregar() {
            setCarregando(true);
            setErro('');
            try {
                const res = await apiServerClient.fetch(`/cursos-publicados/${encodeURIComponent(id)}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Curso não encontrado ou não publicado.');
                    throw new Error('Falha ao carregar o curso.');
                }
                const data = await res.json();
                if (cancelado) return;
                const encontrado = data.curso ? normalizarCurso(data.curso) : null;
                if (!encontrado) {
                    setErro('Curso não encontrado ou não publicado.');
                } else {
                    setCurso(encontrado);
                    // Consulta o estado REAL de matrícula na API (PocketBase),
                    // sem reutilizar dados antigos do estado local ou cache do
                    // carrinho. Cada visita à tela de inscrição refaz a consulta.
                    setInscrito(false);
                    try {
                        const { matriculado } = await verificarMatricula(encontrado.id);
                        if (cancelado) return;
                        setInscrito(matriculado);
                    } catch (_) {
                        if (!cancelado) setInscrito(false);
                    }
                }
            } catch (e) {
                if (!cancelado) {
                    setErro(e?.message || 'Não foi possível carregar este curso no momento.');
                }
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }
        carregar();
        return () => { cancelado = true; };
    }, [id]);

    const precoNum = Number(curso?.preco);
    const ehGratuito = !Number.isFinite(precoNum) || precoNum === 0;

    // Fluxo de inscrição real:
    //  - GRATUITO: exige login (PocketBase). Autentica na plataforma de cursos
    //    (garantirToken) e redireciona para a plataforma, onde a matrícula
    //    gratuita é concluída. Após a matrícula, o curso aparece em "Meus cursos".
    //  - PAGO: adiciona o curso real (com preço da API) ao carrinho e redireciona
    //    para o carrinho, sem cursos fictícios nem valores hardcoded.
    async function handleInscrever() {
        setMensagem('');
        setErroInscricao('');
        if (ehGratuito) {
            if (!pb.authStore.isValid) {
                console.log('❌ [INSCRIÇÃO] Usuário não logado');
                navigate(`/login?redirect=/curso/${id}`);
                return;
            }

            setInscrevendo(true);
            let matricula;
            try {
                console.log('📚 [INSCRIÇÃO] Iniciando matrícula do curso:', id);
                matricula = await matricularCurso(id);
                console.log('✅ [INSCRIÇÃO] Matrícula confirmada:', {
                    sucesso: matricula?.sucesso,
                    ja_matriculado: matricula?.ja_matriculado,
                    vps_matricula_id: matricula?.vps_matricula?.id,
                    vps_curso_id: matricula?.vps_matricula?.curso_id,
                    vps_status: matricula?.vps_matricula?.status,
                    local_id: matricula?.matricula?.id,
                });
            } catch (e) {
                console.error('❌ [INSCRIÇÃO] Erro na matrícula:', e?.message || e);
                setInscrevendo(false);
                setErroInscricao(e?.message || 'Erro ao inscrever. Tente novamente.');
                return;
            }

            // Matrícula confirmada — leva ao NOVO painel do aluno integrado
            // (lista de cursos + leitor de PDF), sem redirecionar para o
            // painel antigo da VPS via SSO. Atualiza o indicador de inscrição
            // imediatamente (sincronização do estado de matrícula).
            setInscrito(true);
            setMensagem(matricula?.ja_matriculado
                ? 'Você já estava matriculado. Abrindo seu painel…'
                : 'Matrícula realizada com sucesso! Abrindo seu painel…');
            setInscrevendo(false);
            setTimeout(() => {
                navigate('/curso/meus-cursos');
            }, 900);
            return;
        }
        // Pago → carrinho real
        adicionarAoCarrinho({
            id: curso.id,
            titulo: curso.titulo,
            instrutor: curso.mentor,
            preco: precoNum,
            imagem: curso.imagem,
        });
        navigate('/curso/carrinho');
    }

    if (carregando) {
        return (
            <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 size={40} className="animate-spin text-primary" />
                <p className="font-display font-semibold">Carregando curso…</p>
            </div>
        );
    }

    if (erro || !curso) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-24 text-center">
                <AlertCircle size={44} className="text-destructive" />
                <p className="font-display text-lg font-bold text-foreground">{erro || 'Curso não encontrado.'}</p>
                <Link to="/curso/cursos" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-display font-bold text-primary-foreground hover:bg-primary/90">
                    <ArrowLeft size={16} /> Voltar aos cursos
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-muted/30">
            <Helmet>
                <title>{curso.titulo} | Conexão Cursos</title>
                <meta name="description" content={curso.descricaoCurta || `Detalhes do curso ${curso.titulo} na plataforma Conexão Cursos.`} />
            </Helmet>

            {/* Banner principal com breadcrumb */}
            <CourseBanner imagem={curso.imagem} titulo={curso.titulo} categoria={curso.categoria} />

            {/* Container principal — 2 colunas no desktop, 1 no tablet/mobile */}
            <div className="mx-auto max-w-[80rem] px-5 py-10 lg:px-10 lg:py-12">
                <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
                    {/* Coluna esquerda — conteúdo + abas */}
                    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8 lg:order-1">
                        <CourseHeader
                            titulo={curso.titulo}
                            categoria={curso.categoria}
                            mentor={curso.mentor}
                            descricaoCurta={curso.descricaoCurta}
                        />

                        <CourseTabs
                            sobre={
                                <CourseAbout
                                    descricao={curso.descricao}
                                    objetivos={curso.objetivos}
                                    publicoAlvo={curso.publicoAlvo}
                                    prerequisitos={curso.prerequisitos}
                                />
                            }
                            matrizCurricular={
                                <CurriculumMatrix modulos={curso.modulos} />
                            }
                        />
                    </div>

                    {/* Coluna direita — sidebar com resumo rápido (fixo no desktop) */}
                    <div className="lg:order-2">
                        <div className="lg:sticky lg:top-24">
                            <CourseSummary
                                cargaHoraria={curso.cargaHoraria}
                                preco={curso.preco}
                                nivel={curso.nivel}
                                status={curso.status}
                                onInscrever={handleInscrever}
                                inscrito={inscrito}
                            />
                            {inscrito && (
                                <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm">
                                    <p className="flex items-center gap-2 font-display font-bold text-emerald-700">
                                        <CheckCircle2 size={16} /> Você está matriculado
                                    </p>
                                    <Link
                                        to={`/curso/${encodeURIComponent(curso.id)}/aula`}
                                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                        <BookOpen size={16} /> Acessar curso
                                    </Link>
                                </div>
                            )}
                            {erroInscricao && (
                                <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{erroInscricao}</span>
                                </div>
                            )}
                            {mensagem && (
                                <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 px-4 py-3 text-sm text-primary">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                    <span>{mensagem}</span>
                                </div>
                            )}
                            {inscrevendo && (
                                <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                                    <Loader2 size={16} className="animate-spin text-primary" />
                                    Processando sua matrícula…
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rodapé de navegação */}
                <div className="mt-10 text-center">
                    <Link to="/curso/cursos" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
                        <ArrowLeft size={16} /> Ver todos os cursos
                    </Link>
                </div>
            </div>

            {/* Chamada visual fixa no mobile (botão de inscrição flutuante) */}
            <div className="sticky bottom-0 z-30 border-t border-border bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
                {inscrito ? (
                    <Link
                        to={`/curso/${encodeURIComponent(curso.id)}/aula`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 font-display font-bold text-primary-foreground transition-transform active:scale-[0.98]"
                    >
                        <BookOpen size={18} /> Acessar curso
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={handleInscrever}
                        disabled={inscrevendo}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3.5 font-display font-bold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
                    >
                        <BookOpen size={18} /> {ehGratuito ? 'Inscrever-se Gratuitamente' : 'Adicionar ao Carrinho'}
                    </button>
                )}
            </div>
        </div>
    );
}
