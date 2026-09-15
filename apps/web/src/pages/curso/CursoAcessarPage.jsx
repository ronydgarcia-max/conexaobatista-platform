import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

// Página de acesso ao curso — redireciona para o NOVO painel do aluno
// integrado no site (leitor de PDF em /curso/:id/aula).
//
// ANTES: redirecionava via SSO para o painel antigo da VPS
//        (https://api.conexaobatista.com.br/aluno/cursos/:id?token=…).
// AGORA: leva ao leitor de PDF integrado, sem sair do site e sem expor
//        tokens na URL. Mantém a rota por compatibilidade com links
//        legados, mas o destino é o novo painel.
export default function CursoAcessarPage() {
    const { id } = useParams();
    return <Navigate to={`/curso/${encodeURIComponent(id)}/aula`} replace />;
}
