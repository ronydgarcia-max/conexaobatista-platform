import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Download, Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Página de download do relatório de alterações (.txt).
 * Busca o arquivo gerado dinamicamente na API (em memória) e dispara o
 * download no navegador. Acesso restrito a usuários autenticados.
 */
export default function RelatorioDownloadPage() {
    const [status, setStatus] = useState('idle'); // idle | loading | ok | erro
    const [erro, setErro] = useState('');

    async function baixarRelatorio() {
        setStatus('loading');
        setErro('');
        try {
            const token = pb.authStore.token || '';
            const res = await apiServerClient.fetch('/relatorio-download', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('Você precisa estar logado para baixar o relatório.');
                }
                throw new Error(`Falha ao gerar o relatório (HTTP ${res.status}).`);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'relatorio-alteracoes-15-16-agosto-2026.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setStatus('ok');
        } catch (e) {
            setErro(e?.message || 'Erro inesperado ao baixar o relatório.');
            setStatus('erro');
        }
    }

    // Dispara o download automaticamente ao entrar na página.
    useEffect(() => {
        baixarRelatorio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Helmet>
                <title>Relatório de Alterações - Conexão Batista</title>
                <meta name="description" content="Download do relatório de alterações do projeto Conexão Batista (15 a 16 de agosto de 2026)." />
            </Helmet>

            <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <CardTitle className="font-display text-2xl">
                            Relatório de Alterações
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Período: 15/08/2026 a 16/08/2026
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status === 'loading' && (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    Gerando o relatório em memória…
                                </p>
                            </div>
                        )}

                        {status === 'ok' && (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                                <p className="text-sm">
                                    Download iniciado! Verifique a pasta de downloads do seu navegador.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Arquivo: relatorio-alteracoes-15-16-agosto-2026.txt
                                </p>
                            </div>
                        )}

                        {status === 'erro' && (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <AlertCircle className="h-10 w-10 text-destructive" />
                                <p className="text-sm text-destructive">{erro}</p>
                            </div>
                        )}

                        <Button
                            onClick={baixarRelatorio}
                            disabled={status === 'loading'}
                            className="w-full"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gerando…
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar relatório novamente
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-muted-foreground">
                            Acesso restrito a usuários autenticados. O acesso é registrado em logs.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
