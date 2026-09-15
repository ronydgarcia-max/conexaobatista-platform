import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import {
    UploadCloud, Loader2, AlertCircle, CheckCircle2, Image as ImageIcon,
    RefreshCw, Trash2,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import { useInstitutionalLogo } from '@/contexts/InstitutionalLogoContext.jsx';

export default function LogoInstitucionalPage() {
    const { admin } = useAdminAuth();
    const { recarregar } = useInstitutionalLogo();
    const [registroAtual, setRegistroAtual] = useState(null);
    const [imagemPreview, setImagemPreview] = useState(null);
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
            const lista = await pb.collection('config_logo').getList(1, 1, {
                sort: '-created',
                requestKey: 'admin-logo-current',
            });
            const rec = lista?.items?.[0] || null;
            setRegistroAtual(rec);
            if (rec && rec.logo) {
                const nome = Array.isArray(rec.logo) ? rec.logo[0] : rec.logo;
                setImagemPreview(nome ? pb.files.getURL(rec, nome) : null);
            } else {
                setImagemPreview(null);
            }
        } catch (e) {
            setErro('Não foi possível carregar o logo atual.');
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
            setErro('Selecione um arquivo de imagem válido (PNG, SVG, JPG ou WebP).');
            setSucesso('');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setErro('A imagem deve ter no máximo 2 MB.');
            setSucesso('');
            return;
        }
        setArquivo(file);
        setErro('');
        setSucesso('');
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
            fd.append('logo', arquivo);
            if (admin?.id) fd.append('atualizado_por', admin.id);

            if (registroAtual?.id) {
                // Substitui o logo atual (mesmo registro).
                await pb.collection('config_logo').update(registroAtual.id, fd);
            } else {
                // Cria o primeiro registro de logo.
                await pb.collection('config_logo').create(fd);
            }
            setSucesso('Logo institucional salvo com sucesso! Ele já aparece no cabeçalho do site.');
            setArquivo(null);
            if (inputRef.current) inputRef.current.value = '';
            await carregarAtual();
            recarregar();
        } catch (e) {
            setErro(e?.message || 'Falha ao salvar o logo.');
        } finally {
            setSalvando(false);
        }
    };

    const onRemover = async () => {
        if (!registroAtual?.id) return;
        if (!window.confirm('Remover o logo personalizado? O logo padrão (emblema Conexão Batista) voltará a ser exibido no cabeçalho.')) return;
        setRemovendo(true);
        setErro('');
        setSucesso('');
        try {
            await pb.collection('config_logo').delete(registroAtual.id);
            setSucesso('Logo removido. O logo padrão será exibido no cabeçalho.');
            setRegistroAtual(null);
            setImagemPreview(null);
            setArquivo(null);
            if (inputRef.current) inputRef.current.value = '';
            recarregar();
        } catch (e) {
            setErro(e?.message || 'Falha ao remover o logo.');
        } finally {
            setRemovendo(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Logo Institucional - Conexão Batista</title>
                <meta name="description" content="Gerenciamento do logo institucional exibido no cabeçalho do site." />
            </Helmet>

            <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
                {/* Cabeçalho */}
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-bold text-primary">
                        Logo Institucional
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Gerencie a imagem de logo exibida no cabeçalho e no rodapé de todas as
                        áreas públicas do site. Quando nenhum logo personalizado está configurado,
                        o logo padrão (emblema <span className="font-semibold">Conexão<span className="text-accent">Batista</span></span>) é exibido automaticamente.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* ----- Preview ----- */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-foreground">
                            <ImageIcon size={20} className="text-primary" /> Pré-visualização
                        </h2>

                        {carregando ? (
                            <div className="flex h-48 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Enquadramento seguro: fundo que simula o cabeçalho (azul) */}
                                <div className="flex items-center gap-3 rounded-lg border border-border bg-primary px-5 py-4">
                                    {imagemPreview ? (
                                        <img
                                            src={imagemPreview}
                                            alt="Pré-visualização do logo institucional"
                                            className="h-9 w-auto max-w-[180px] object-contain sm:h-10"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <span className="font-display text-lg font-bold leading-none text-white">
                                            Conexão<span className="text-accent">Batista</span>
                                        </span>
                                    )}
                                </div>

                                {/* Enquadramento seguro: fundo claro (rodapé/áreas claras) */}
                                <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-5 py-4">
                                    {imagemPreview ? (
                                        <img
                                            src={imagemPreview}
                                            alt="Pré-visualização do logo em fundo claro"
                                            className="h-9 w-auto max-w-[180px] object-contain sm:h-10"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <span className="font-display text-lg font-bold leading-none text-primary">
                                            Conexão<span className="text-accent">Batista</span>
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs font-semibold text-muted-foreground">
                                    {registroAtual
                                        ? 'Logo personalizado ativo (definido pelo administrador)'
                                        : 'Logo padrão ativo (fallback — nenhum arquivo personalizado)'}
                                </p>
                            </div>
                        )}

                        {registroAtual && (
                            <p className="mt-3 text-xs text-muted-foreground">
                                Atualizado em:{' '}
                                {new Date(registroAtual.updated || registroAtual.created).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                            </p>
                        )}
                    </div>

                    {/* ----- Upload ----- */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-foreground">
                            <UploadCloud size={20} className="text-primary" /> Enviar / substituir logo
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground">
                                    Selecione um arquivo
                                </label>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    PNG, SVG, JPG ou WebP — até 2 MB. Recomendado: arquivo PNG com
                                    fundo transparente (largura horizontal, proporção até 4:1, ex.:
                                    400×100&nbsp;px). A transparência do PNG é preservada e o logo se
                                    integra ao fundo azul do cabeçalho/rodapé sem caixa branca.
                                    A proporção original é sempre preservada (sem distorção).
                                </p>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
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
                                            <UploadCloud size={16} /> {registroAtual ? 'Substituir logo' : 'Salvar logo'}
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
                                                <Trash2 size={16} /> Remover e usar padrão
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
