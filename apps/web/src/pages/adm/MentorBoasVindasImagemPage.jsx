import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
    UploadCloud, Loader2, AlertCircle, CheckCircle2, Image as ImageIcon,
    RefreshCw, Trash2,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

const IMAGEM_PADRAO = 'https://images.hostinger.com/fd98c755-6454-4ee7-b708-23e39ee70d15.png';

export default function MentorBoasVindasImagemPage() {
    const { admin } = useAdminAuth();
    const [registroAtual, setRegistroAtual] = useState(null);
    const [imagemPreview, setImagemPreview] = useState(IMAGEM_PADRAO);
    const [arquivo, setArquivo] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [removendo, setRemovendo] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const inputRef = useRef(null);

    const carregarAtual = useCallback(async () => {
        setCarregando(true);
        setErro('');
        try {
            const lista = await pb.collection('mentor_boas_vindas').getList(1, 1, {
                sort: '-created',
            });
            const rec = lista?.items?.[0] || null;
            setRegistroAtual(rec);
            if (rec && rec.imagem) {
                const nome = Array.isArray(rec.imagem) ? rec.imagem[0] : rec.imagem;
                if (nome) setImagemPreview(pb.files.getURL(rec, nome));
                else setImagemPreview(IMAGEM_PADRAO);
            } else {
                setImagemPreview(IMAGEM_PADRAO);
            }
        } catch (e) {
            setErro('Não foi possível carregar a imagem atual.');
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarAtual();
    }, [carregarAtual]);

    const onSelecionarArquivo = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setErro('Selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
            setSucesso('');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErro('A imagem deve ter no máximo 5 MB.');
            setSucesso('');
            return;
        }
        setArquivo(file);
        setErro('');
        setSucesso('');
        // preview local
        const url = URL.createObjectURL(file);
        setImagemPreview(url);
    };

    const onSalvar = async () => {
        if (!arquivo) {
            setErro('Selecione uma imagem antes de salvar.');
            return;
        }
        setSalvando(true);
        setErro('');
        setSucesso('');
        try {
            const fd = new FormData();
            fd.append('imagem', arquivo);
            if (admin?.id) fd.append('atualizado_por', admin.id);

            if (registroAtual?.id) {
                // Atualiza o registro existente (substitui a imagem).
                await pb.collection('mentor_boas_vindas').update(registroAtual.id, fd);
            } else {
                // Cria o primeiro registro.
                await pb.collection('mentor_boas_vindas').create(fd);
            }
            setSucesso('Imagem de boas-vindas salva com sucesso!');
            setArquivo(null);
            if (inputRef.current) inputRef.current.value = '';
            await carregarAtual();
        } catch (e) {
            setErro(e?.message || 'Falha ao salvar a imagem.');
        } finally {
            setSalvando(false);
        }
    };

    const onRemover = async () => {
        if (!registroAtual?.id) return;
        if (!window.confirm('Remover a imagem de boas-vindas? A imagem padrão será exibida na página pública.')) return;
        setRemovendo(true);
        setErro('');
        setSucesso('');
        try {
            await pb.collection('mentor_boas_vindas').delete(registroAtual.id);
            setSucesso('Imagem removida. A imagem padrão será exibida.');
            setRegistroAtual(null);
            setImagemPreview(IMAGEM_PADRAO);
            setArquivo(null);
            if (inputRef.current) inputRef.current.value = '';
        } catch (e) {
            setErro(e?.message || 'Falha ao remover a imagem.');
        } finally {
            setRemovendo(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Imagem de Boas-Vindas do Mentor - Conexão Batista</title>
                <meta name="description" content="Gerenciamento da imagem exibida na página de boas-vindas do mentor." />
            </Helmet>

            <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
                {/* Cabeçalho */}
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-bold text-primary">
                        Imagem de Boas-Vindas do Mentor
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Gerencie a imagem exibida no lado direito da página de boas-vindas
                        do mentor (<Link to="/curso/boas-vindas" className="font-semibold text-primary hover:underline">/curso/boas-vindas</Link>).
                        A imagem mais recente é carregada automaticamente na página pública.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* ----- Preview ----- */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-foreground">
                            <ImageIcon size={20} className="text-primary" /> Pré-visualização
                        </h2>

                        {carregando ? (
                            <div className="flex h-64 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
                                <img
                                    src={imagemPreview}
                                    alt="Pré-visualização da imagem de boas-vindas"
                                    className="h-72 w-full object-cover sm:h-80"
                                    onError={(e) => { e.target.src = IMAGEM_PADRAO; }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-2">
                                    <p className="text-xs font-semibold text-white">
                                        {registroAtual ? 'Imagem ativa (definida pelo administrador)' : 'Imagem padrão (fallback)'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {registroAtual && (
                            <p className="mt-3 text-xs text-muted-foreground">
                                Atualizada em:{' '}
                                {new Date(registroAtual.updated || registroAtual.created).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                            </p>
                        )}
                    </div>

                    {/* ----- Upload ----- */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-foreground">
                            <UploadCloud size={20} className="text-primary" /> Enviar nova imagem
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground">
                                    Selecione um arquivo
                                </label>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    JPG, PNG ou WebP — até 5 MB. Use imagens verticais ou quadradas para melhor resultado.
                                </p>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={onSelecionarArquivo}
                                    className="mt-3 block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2.5 file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                                />
                            </div>

                            {arquivo && (
                                <p className="text-xs text-muted-foreground">
                                    Arquivo selecionado: <strong className="text-foreground">{arquivo.name}</strong>{' '}
                                    ({(arquivo.size / 1024).toFixed(0)} KB)
                                </p>
                            )}

                            {/* Mensagens */}
                            {erro && (
                                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{erro}</span>
                                </div>
                            )}
                            {sucesso && (
                                <div className="flex items-start gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                    <span>{sucesso}</span>
                                </div>
                            )}

                            {/* Ações */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onSalvar}
                                    disabled={salvando || !arquivo}
                                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {salvando ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Salvando…
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud size={16} /> Salvar imagem
                                        </>
                                    )}
                                </button>

                                {registroAtual && (
                                    <button
                                        type="button"
                                        onClick={onRemover}
                                        disabled={removendo}
                                        className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-5 py-2.5 text-sm font-bold text-destructive transition-colors hover:bg-destructive/5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {removendo ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" /> Removendo…
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={16} /> Remover
                                            </>
                                        )}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={carregarAtual}
                                    disabled={carregando}
                                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary disabled:opacity-50"
                                >
                                    <RefreshCw size={16} /> Atualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
