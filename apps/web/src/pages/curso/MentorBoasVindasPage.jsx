import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import {
    RefreshCw, AlertCircle, ArrowLeft, Sparkles, BookOpen,
    UploadCloud, ShieldCheck, Heart, Loader2,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { getMentorSsoToken } from '@/services/cursosService';

// Imagem padrão (fallback) exibida quando nenhum administrador definiu uma
// imagem de boas-vindas. Gerada via get_images e embutida como constante.
const IMAGEM_PADRAO = 'https://images.hostinger.com/fd98c755-6454-4ee7-b708-23e39ee70d15.png';

// ----- Regra de gênero para a saudação -----
// O campo real no modelo de dados do usuário é `sexo` (select com valores
// "masculino", "feminino", "outro"). Aplicamos a saudação conforme o valor:
//   feminino  → "Seja bem-vinda, {nome}!"
//   masculino → "Seja bem-vindo, {nome}!"
//   outro/vazio/qualquer outro → "Seja bem-vindo(a), {nome}!"
function obterTextosGenero(sexo, nomeCompleto) {
    const primeiroNome = (nomeCompleto || 'mentor').trim().split(/\s+/)[0] || 'mentor';
    const s = (sexo || '').toLowerCase().trim();
    if (s === 'feminino') {
        return {
            saudacao: `Seja bem-vinda, ${primeiroNome}!`,
            mentor: 'mentora',
            ponte: 'Sua mentoria será uma ponte',
        };
    }
    if (s === 'masculino') {
        return {
            saudacao: `Seja bem-vindo, ${primeiroNome}!`,
            mentor: 'mentor',
            ponte: 'Seu curso será uma ponte',
        };
    }
    return {
        saudacao: `Seja bem-vindo(a), ${primeiroNome}!`,
        mentor: 'mentor(a)',
        ponte: 'Seu curso será uma ponte',
    };
}

// ----- Carregamento da imagem de boas-vindas -----
// Lê o registro mais recente da coleção `mentor_boas_vindas` (público para
// leitura). Se não houver registro ou falhar, usa a imagem padrão.
async function carregarImagemBoasVindas() {
    try {
        const lista = await pb.collection('mentor_boas_vindas').getList(1, 1, {
            sort: '-created',
        });
        const rec = lista?.items?.[0];
        if (rec && rec.imagem) {
            const nomeArquivo = Array.isArray(rec.imagem) ? rec.imagem[0] : rec.imagem;
            if (nomeArquivo) {
                return pb.files.getURL(rec, nomeArquivo);
            }
        }
    } catch (_) {
        // silencioso — usa fallback
    }
    return IMAGEM_PADRAO;
}

const passos = [
    {
        icon: BookOpen,
        titulo: 'Prepare seu material',
        texto: 'Organize o conteúdo do seu curso: aulas, apostilas e recursos que vão equipar seus alunos.',
    },
    {
        icon: UploadCloud,
        titulo: 'Publique na plataforma',
        texto: 'Acesse o ambiente do mentor e cadastre seu curso com título, descrição e módulos.',
    },
    {
        icon: ShieldCheck,
        titulo: 'Acompanhe seus alunos',
        texto: 'Monitore o progresso, responva dúvidas e incentive a jornada de cada participante.',
    },
    {
        icon: Heart,
        titulo: 'Sirva com excelência',
        texto: 'Cada aluno é uma vida sendo transformada. Ensine com dedicação e amor cristão.',
    },
];

export default function MentorBoasVindasPage() {
    const navigate = useNavigate();
    const [carregando, setCarregando] = useState(true);
    const [imagemUrl, setImagemUrl] = useState(IMAGEM_PADRAO);
    const [saudacao, setSaudacao] = useState('');
    const [textoGenero, setTextoGenero] = useState({ saudacao: '', mentor: 'mentor(a)', ponte: 'Seu curso será uma ponte' });
    const [nomeUsuario, setNomeUsuario] = useState('');
    const [acessandoPainel, setAcessandoPainel] = useState(false);
    const [erroPainel, setErroPainel] = useState('');

    const authed = pb.authStore.isValid;
    const usuario = pb.authStore.record || null;
    // Dependências ESTÁVEIS: pb.authStore.record devolve um novo objeto a cada
    // render; usá-lo diretamente como dependência do useEffect recriava o efeito
    // indefinidamente (loop "Preparando sua recepção…" + requisições abortadas).
    const usuarioId = usuario?.id || '';
    const usuarioNome = usuario?.name || usuario?.username || 'Mentor';
    const usuarioSexo = usuario?.sexo || '';

    useEffect(() => {
        if (!authed) {
            navigate('/login?redirect=/curso/boas-vindas', { replace: true });
            return undefined;
        }
        let cancelado = false;
        setCarregando(true);
        setNomeUsuario(usuarioNome);
        const tg = obterTextosGenero(usuarioSexo, usuarioNome);
        setTextoGenero(tg);
        setSaudacao(tg.saudacao);
        (async () => {
            const url = await carregarImagemBoasVindas();
            if (cancelado) return;
            setImagemUrl(url);
            setCarregando(false);
        })();
        return () => { cancelado = true; };
    }, [authed, navigate, usuarioId, usuarioNome, usuarioSexo]);

    // ----- Acessar painel do mentor (SSO via GET ?token=) -----
    // Chama o endpoint /mentor-sso-token (backend assina o JWT HS256 com o
    // segredo dedicado) e redireciona o navegador para a URL de destino com
    // o token na query string. O segredo nunca é exposto no frontend.
    const acessarPainelMentor = useCallback(async () => {
        setAcessandoPainel(true);
        setErroPainel('');
        try {
            const data = await getMentorSsoToken();
            if (!data?.redirectUrl) {
                throw new Error('Não foi possível obter a URL de acesso ao painel.');
            }
            // Validação: só redireciona após receber o token com sucesso.
            window.location.href = data.redirectUrl;
        } catch (e) {
            setErroPainel(e?.message || 'Erro inesperado ao acessar o painel do mentor.');
            setAcessandoPainel(false);
        }
    }, []);

    // ----- Estado: não logado (breve, antes do redirect) -----
    if (!authed) {
        return (
            <div className="page-centered">
                <Helmet>
                    <title>Boas-vindas do mentor | Conexão Cursos</title>
                    <meta name="description" content="Página de boas-vindas para mentores da plataforma Conexão Batista." />
                </Helmet>
                <section className="mx-auto max-w-md px-5 py-24 text-center">
                    <RefreshCw size={32} className="mx-auto animate-spin text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">Redirecionando para o login…</p>
                </section>
            </div>
        );
    }

    const mentorAprovado = usuario?.mentor_status === 'aprovado';

    return (
        <div className="page-centered">
            <Helmet>
                <title>Boas-vindas do mentor | Conexão Cursos</title>
                <meta name="description" content="Página de boas-vindas para mentores da plataforma Conexão Batista." />
            </Helmet>

            {/* Faixa de cabeçalho */}
            <section className="bg-primary py-12 text-primary-foreground">
                <div className="mx-auto max-w-[80rem] px-5 lg:px-10">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">Mentor</p>
                    <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Boas-vindas</h1>
                </div>
            </section>

            <section className="mx-auto max-w-[80rem] px-5 py-14 lg:px-10 text-left">
                {/* ----- Carregando ----- */}
                {carregando && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <RefreshCw size={32} className="animate-spin text-primary" />
                        <p className="mt-4 text-sm">Preparando sua recepção…</p>
                    </div>
                )}

                {/* ----- Não aprovado como mentor ----- */}
                {!carregando && !mentorAprovado && (
                    <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
                        <AlertCircle size={40} className="mx-auto mb-3 text-amber-600" />
                        <p className="font-display text-base font-bold text-amber-800">
                            Sua solicitação como mentor ainda não foi aprovada.
                        </p>
                        <p className="mt-2 text-sm text-amber-800/80">
                            Aguarde a aprovação do administrador para acessar esta página e o ambiente do mentor.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link to="/curso" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                                <ArrowLeft size={16} /> Voltar
                            </Link>
                            <Link to="/minha-conta" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary">
                                Minha conta
                            </Link>
                        </div>
                    </div>
                )}

                {/* ----- Split-screen integrado (mentor aprovado) ----- */}
                {!carregando && mentorAprovado && (
                    <>
                        {/* Container único com fundo contínuo que atravessa as duas metades */}
                        <div className="relative overflow-hidden rounded-3xl border border-primary/15 shadow-2xl">
                            {/* Fundo gradiente contínuo (atravessa as duas metades) */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-secondary/10" />

                            <div className="relative grid lg:grid-cols-2">
                                {/* ----- Lado ESQUERDO: texto ----- */}
                                <div className="flex flex-col justify-center p-8 text-primary-foreground sm:p-12 lg:p-16">
                                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                                        <Sparkles size={14} /> Área do mentor
                                    </span>

                                    {/* a. Saudação personalizada (regra de gênero) */}
                                    <p className="mt-6 font-display text-2xl font-bold text-accent sm:text-3xl">
                                        {saudacao}
                                    </p>

                                    {/* b. Título principal e parágrafo acolhedor */}
                                    <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                                        Que alegria ter você como {textoGenero.mentor}!
                                    </h2>
                                    <p className="mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/85">
                                        Como {textoGenero.mentor}, você tem o privilégio de formar vidas com conhecimento e fé.
                                        {textoGenero.ponte} entre o saber e o serviço — equipando membros da
                                        rede Conexão Batista para crescerem profissionalmente e servirem com
                                        excelência o Reino de Deus.
                                    </p>

                                    {/* c. Seção "Como começar" */}
                                    <div className="mt-8">
                                        <p className="font-display text-sm font-bold uppercase tracking-wider text-accent">
                                            Como começar
                                        </p>
                                        <ol className="mt-4 space-y-4">
                                            {passos.map((p, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-accent">
                                                        <p.icon size={18} />
                                                    </span>
                                                    <div>
                                                        <p className="font-display text-sm font-bold text-white">
                                                            {i + 1}. {p.titulo}
                                                        </p>
                                                        <p className="mt-0.5 text-sm text-primary-foreground/75">
                                                            {p.texto}
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>

                                {/* ----- Lado DIREITO: imagem grande ----- */}
                                <div className="relative min-h-[320px] overflow-hidden sm:min-h-[420px] lg:min-h-[560px]">
                                    <img
                                        src={imagemUrl}
                                        alt="Mentor dando boas-vindas"
                                        className="h-full w-full object-cover"
                                        onError={(e) => { e.target.src = IMAGEM_PADRAO; }}
                                    />
                                    {/* Overlay de fusão: fade na borda esquerda da imagem
                                        conectando-a ao fundo gradiente do texto */}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary via-primary/40 to-transparent lg:from-primary lg:via-primary/30" />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* ----- Chamada final (abaixo do split, centralizada) ----- */}
                        <div className="mt-12 text-center">
                            {/* ----- Acessar painel do mentor (SSO via GET ?token=) ----- */}
                            <div className="border-t border-border pt-6">
                                <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                                    Já tem seu curso publicado? Acesse diretamente o painel do mentor
                                    com autenticação segura (credencial válida por 10 minutos).
                                </p>

                                {erroPainel && (
                                    <div className="mx-auto mt-4 flex max-w-md items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <span>{erroPainel}</span>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={acessarPainelMentor}
                                    disabled={acessandoPainel}
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 font-display text-sm font-bold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {acessandoPainel ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Gerando credencial…
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={18} />
                                            Acessar painel do mentor
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mt-4">
                                <Link to="/curso/mentor" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                                    <ArrowLeft size={14} /> Ir para a área do mentor
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
