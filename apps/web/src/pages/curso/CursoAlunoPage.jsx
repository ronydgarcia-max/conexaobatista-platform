import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { capturarTokenDaUrl } from '@/services/cursosAuthService';

// Área do aluno — entrada direta para o painel integrado de cursos.
// O aceite de termos não é solicitado novamente nesta entrada; os textos e
// links legais continuam disponíveis nas páginas legais já existentes.
export default function CursoAlunoPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Captura o token SSO recebido na URL para a sessão atual antes de seguir
    // para o painel e remove o token da barra de endereço.
    useEffect(() => {
        capturarTokenDaUrl();
        if (searchParams.has('token')) {
            const clean = new URLSearchParams(searchParams);
            clean.delete('token');
            navigate(
                { search: clean.toString() ? `?${clean.toString()}` : '' },
                { replace: true },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!pb.authStore.isValid) {
            navigate('/login?redirect=/curso/aluno', { replace: true });
            return;
        }
        navigate('/curso/meus-cursos', { replace: true });
    }, [navigate]);

    return (
        <div className="page-centered">
            <Helmet>
                <title>Área do aluno | Conexão Cursos</title>
                <meta name="description" content="Painel do aluno da plataforma de cursos Conexão Batista." />
            </Helmet>
            <section className="mx-auto max-w-md px-5 py-24 text-center">
                <RefreshCw size={32} className="mx-auto animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Abrindo o painel do aluno…</p>
            </section>
        </div>
    );
}
