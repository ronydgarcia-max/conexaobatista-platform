import React from 'react';
import { Navigate, Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import SiteLayout from './components/SiteLayout.jsx';
import { SubscriptionAuthProvider } from '@/contexts/SubscriptionAuthContext.jsx';
import HomePage from './pages/HomePage';
import AboutPage from '@/pages/AboutPage.jsx';
import FeaturesPage from '@/pages/FeaturesPage.jsx';
import JoinPage from '@/pages/JoinPage.jsx';
import BusinessPage from '@/pages/BusinessPage.jsx';
import BlogPage from '@/pages/BlogPage.jsx';
import PlansPage from '@/pages/PlansPage.jsx';
import SubscriptionsPage from '@/pages/SubscriptionsPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import CursosPage from '@/pages/CursosPage.jsx';
import CadastroCursosPage from '@/pages/CadastroCursosPage.jsx';
import DevocionalPage from '@/pages/DevocionalPage.jsx';
import HistoriasPage from '@/pages/HistoriasPage.jsx';
import MinhaContaPage from '@/pages/MinhaContaPage.jsx';
import EmpresaFormPage from '@/pages/minha-conta/EmpresaFormPage.jsx';
import ProfissionalFormPage from '@/pages/minha-conta/ProfissionalFormPage.jsx';
import CurriculoFormPage from '@/pages/minha-conta/CurriculoFormPage.jsx';
import AlterarEmailPage from '@/pages/minha-conta/AlterarEmailPage.jsx';
import NomeUsuarioPage from '@/pages/minha-conta/NomeUsuarioPage.jsx';
import ConsentimentoPage from '@/pages/ConsentimentoPage.jsx';
import TermosPrivacidadePage from '@/pages/TermosPrivacidadePage.jsx';
import DeclaracaoMembroPage from '@/pages/DeclaracaoMembroPage.jsx';
import RelatorioDownloadPage from '@/pages/RelatorioDownloadPage.jsx';

// Relacionamentos pages
import RelacionamentosEntryPage from '@/pages/relacionamentos/EntryPage.jsx';
import RelacionamentosDashboardPage from '@/pages/relacionamentos/DashboardPage.jsx';
import RelacionamentosEditarPerfilPage from '@/pages/relacionamentos/EditarPerfilPage.jsx';
import RelacionamentosDescobrirPage from '@/pages/relacionamentos/DescobrirPage.jsx';
import RelacionamentosBloqueiosPage from '@/pages/relacionamentos/BloqueiosPage.jsx';
import RelacionamentosPrivacidadePage from '@/pages/relacionamentos/PrivacidadePage.jsx';

// Administração
import { AdminAuthProvider } from '@/contexts/AdminAuthContext.jsx';
import AdminLayout from '@/components/admin/AdminLayout.jsx';
import AdminLoginPage from '@/pages/adm/AdminLoginPage.jsx';
import AlterarSenhaPage from '@/pages/adm/AlterarSenhaPage.jsx';
import MembrosPage from '@/pages/adm/MembrosPage.jsx';
import MembroDetalhePage from '@/pages/adm/MembroDetalhePage.jsx';
import CurriculosPage from '@/pages/adm/CurriculosPage.jsx';
import CurriculoDetalhePage from '@/pages/adm/CurriculoDetalhePage.jsx';
import CategoriasProfissoesPage from '@/pages/adm/CategoriasProfissoesPage.jsx';
import SugestoesProfissoesPage from '@/pages/adm/SugestoesProfissoesPage.jsx';
import ServicosProfissionaisPage from '@/pages/adm/ServicosProfissionaisPage.jsx';
import IgrejasPage from '@/pages/adm/IgrejasPage.jsx';
import EmpresasPage from '@/pages/adm/EmpresasPage.jsx';
import AprovacaoVinculosPage from '@/pages/adm/AprovacaoVinculosPage.jsx';
import AprovacaoRepresentantesPage from '@/pages/adm/AprovacaoRepresentantesPage.jsx';
import AprovacaoTutoresPage from '@/pages/adm/AprovacaoTutoresPage.jsx';
import PromoverAdministradorPage from '@/pages/adm/PromoverAdministradorPage.jsx';
import TextoLegalMentorPage from '@/pages/adm/TextoLegalMentorPage.jsx';
import MentorBoasVindasImagemPage from '@/pages/adm/MentorBoasVindasImagemPage.jsx';
import RelatorioAlteracoesPage from '@/pages/adm/RelatorioAlteracoesPage.jsx';
import ModeracaoCursosPage from '@/pages/adm/ModeracaoCursosPage.jsx';
import LogoInstitucionalPage from '@/pages/adm/LogoInstitucionalPage.jsx';

// Painel da Igreja (Pastor/Secretário)
import IgrejaLayout from '@/components/igreja/IgrejaLayout.jsx';
import PainelPage from '@/pages/igreja/PainelPage.jsx';
import AprovacaoMembrosPage from '@/pages/igreja/AprovacaoMembrosPage.jsx';

// Plataforma de Cursos (área isolada)
import CursoLayout from '@/components/curso/CursoLayout.jsx';
import CursoHomePage from '@/pages/curso/CursoHomePage.jsx';
import CursoCursosPage from '@/pages/curso/CursoCursosPage.jsx';
import CursoDetalhePage from '@/pages/curso/CursoDetalhePage.jsx';
import CursoCarrinhoPage from '@/pages/curso/CursoCarrinhoPage.jsx';
import CursoAlunoPage from '@/pages/curso/CursoAlunoPage.jsx';
import CursoMentorPage from '@/pages/curso/CursoMentorPage.jsx';
import MentorBoasVindasPage from '@/pages/curso/MentorBoasVindasPage.jsx';
import CursoMeusCursosPage from '@/pages/curso/CursoMeusCursosPage.jsx';
import CursoAulaPage from '@/pages/curso/CursoAulaPage.jsx';
import CursoAcessarPage from '@/pages/curso/CursoAcessarPage.jsx';
import CursoProvaPage from '@/pages/curso/CursoProvaPage.jsx';
import ChatWidget from '@/components/curso/ChatWidget.jsx';
import AdminRouteGuard from '@/hooks/useAdminGuard.jsx';
import { InstitutionalLogoProvider } from '@/contexts/InstitutionalLogoContext.jsx';

function App() {
    return (
        <Router>
            <ScrollToTop />
            {/* Proteção GLOBAL: redireciona admins para /adm em qualquer rota
                que não seja /adm/*, evitando buscas inválidas em `users` (404).
                Envolve providers + Routes para que NENHUM componente de rota
                pública/igreja/curso monte quando um admin acessá-las. */}
            <AdminRouteGuard>
            <SubscriptionAuthProvider>
                <AdminAuthProvider>
                <InstitutionalLogoProvider>
                    <Routes>
                        {/* Área administrativa privada (fora do layout público) */}
                        <Route path="/adm/login" element={<AdminLoginPage />} />
                        <Route path="/adm/alterar-senha" element={<AlterarSenhaPage />} />
                        {/* Atalho: /painel → painel da igreja (aprovação de membros) */}
                        <Route path="/painel" element={<Navigate to="/igreja/aprovacao-membros" replace />} />

                        {/* Painel da Igreja (Pastor/Secretário) */}
                        <Route path="/igreja" element={<IgrejaLayout />}>
                            <Route index element={<Navigate to="/igreja/painel" replace />} />
                            <Route path="painel" element={<PainelPage />} />
                            <Route path="aprovacao-membros" element={<AprovacaoMembrosPage />} />
                        </Route>

                        <Route path="/adm" element={<AdminLayout />}>
                            <Route index element={<Navigate to="/adm/membros" replace />} />
                            <Route path="membros" element={<MembrosPage />} />
                            <Route path="membros/:id" element={<MembroDetalhePage />} />
                            <Route path="curriculos" element={<CurriculosPage />} />
                            <Route path="curriculos/:id" element={<CurriculoDetalhePage />} />
                            <Route path="categorias-profissoes" element={<CategoriasProfissoesPage />} />
                            <Route path="sugestoes-profissoes" element={<SugestoesProfissoesPage />} />
                            <Route path="servicos-profissionais" element={<ServicosProfissionaisPage />} />
                            <Route path="igrejas" element={<IgrejasPage />} />
                            <Route path="empresas" element={<EmpresasPage />} />
                            <Route path="aprovacao-vinculos" element={<AprovacaoVinculosPage />} />
                            <Route path="aprovacao-representantes" element={<AprovacaoRepresentantesPage />} />
                            <Route path="aprovacao-tutores" element={<AprovacaoTutoresPage />} />
                            <Route path="promover-administrador" element={<PromoverAdministradorPage />} />
                            <Route path="texto-legal-mentor" element={<TextoLegalMentorPage />} />
                            <Route path="mentor-boas-vindas-imagem" element={<MentorBoasVindasImagemPage />} />
                            <Route path="moderacao-cursos" element={<ModeracaoCursosPage />} />
                            <Route path="logo-institucional" element={<LogoInstitucionalPage />} />
                            <Route path="relatorio-alteracoes" element={<RelatorioAlteracoesPage />} />
                        </Route>

                        {/* Plataforma de Cursos — área isolada do restante do site */}
                        <Route path="/curso" element={<CursoLayout />}>
                            <Route index element={<CursoHomePage />} />
                            <Route path="cursos" element={<CursoCursosPage />} />
                            <Route path=":id" element={<CursoDetalhePage />} />
                            <Route path="carrinho" element={<CursoCarrinhoPage />} />
                            <Route path="aluno" element={<CursoAlunoPage />} />
                            <Route path="mentor" element={<CursoMentorPage />} />
                            <Route path="boas-vindas" element={<MentorBoasVindasPage />} />
                            <Route path="meus-cursos" element={<CursoMeusCursosPage />} />
                            <Route path=":id/acessar" element={<CursoAcessarPage />} />
                            <Route path=":id/aula" element={<CursoAulaPage />} />
                            <Route path=":id/prova/:provaId" element={<CursoProvaPage />} />
                        </Route>

                        <Route element={<SiteLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/o-que-e" element={<AboutPage />} />
                        <Route path="/funcionalidades" element={<FeaturesPage />} />
                        <Route path="/como-participar" element={<JoinPage />} />
                        <Route path="/para-empresas" element={<BusinessPage />} />
                        <Route path="/blog" element={<BlogPage />} />
                        <Route path="/plans" element={<PlansPage />} />
                        <Route path="/subscriptions" element={<SubscriptionsPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/cadastro" element={<SignupPage />} />
                        <Route path="/cursos" element={<CursosPage />} />
                        <Route path="/cadastro-cursos" element={<CadastroCursosPage />} />
                        <Route path="/devocional" element={<DevocionalPage />} />
                        <Route path="/historias" element={<HistoriasPage />} />

                        {/* Conta e documentos */}
                        <Route path="/minha-conta" element={<MinhaContaPage />} />
                        <Route path="/minha-conta/empresa" element={<EmpresaFormPage />} />
                        <Route path="/minha-conta/profissional" element={<ProfissionalFormPage />} />
                        <Route path="/minha-conta/curriculo" element={<CurriculoFormPage />} />
                        <Route path="/minha-conta/alterar-email" element={<AlterarEmailPage />} />
                        <Route path="/minha-conta/nome-usuario" element={<NomeUsuarioPage />} />
                        <Route path="/consentimento-uso-dados" element={<ConsentimentoPage />} />
                        <Route path="/termos-uso-privacidade" element={<TermosPrivacidadePage />} />
                        <Route path="/declaracao-membro-igreja" element={<DeclaracaoMembroPage />} />
                        <Route path="/relatorio-download" element={<RelatorioDownloadPage />} />

                        {/* Relacionamentos area */}
                        <Route path="/relacionamentos" element={<RelacionamentosEntryPage />} />
                        <Route path="/relacionamentos/dashboard" element={<RelacionamentosDashboardPage />} />
                        <Route path="/relacionamentos/perfil" element={<RelacionamentosEditarPerfilPage />} />
                        <Route path="/relacionamentos/descobrir" element={<RelacionamentosDescobrirPage />} />
                        <Route path="/relacionamentos/bloqueios" element={<RelacionamentosBloqueiosPage />} />
                        <Route path="/relacionamentos/privacidade" element={<RelacionamentosPrivacidadePage />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                    </Routes>
                </InstitutionalLogoProvider>
                </AdminAuthProvider>
            </SubscriptionAuthProvider>
            </AdminRouteGuard>
            {/* Assistente Batista — disponível em todas as páginas */}
            <ChatWidget />
        </Router>
    );
}

export default App;
