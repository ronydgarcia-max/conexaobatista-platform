import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Propósito desta política',
    content: 'Esta Política de Privacidade específica rege a Área de Relacionamentos do Conexão Batista. Ela complementa a Política de Privacidade geral do site e detalha como tratamos os dados pessoais coletados e utilizados nesta área exclusiva.',
  },
  {
    title: '2. Dados coletados',
    content: 'Na Área de Relacionamentos, coletamos: apelido ou nome de exibição, data de nascimento (para verificação de maioridade, nunca exibida publicamente), status de relacionamento, preferências de relacionamento, biografia, cidade e estado, foto de perfil, configuração de visibilidade, registro de consentimento, registros de bloqueios e denúncias.',
  },
  {
    title: '3. Como os dados são utilizados',
    content: 'Os dados são utilizados exclusivamente para: exibição do seu perfil para outros membros autenticados (conforme sua configuração de visibilidade), filtragem e descoberta de perfis compatíveis, moderação de comportamentos inadequados, segurança e integridade da plataforma. Nunca vendemos, compartilhamos ou utilizamos seus dados para fins de marketing externo ou publicidade.',
  },
  {
    title: '4. Visibilidade e controle',
    content: 'Você tem controle total sobre a visibilidade do seu perfil: Público — visível para todos os membros autenticados; Apenas membros validados — visível somente para membros com membresia verificada; Privado — visível somente para você. Você pode alterar a visibilidade ou desativar seu perfil a qualquer momento na página de edição.',
  },
  {
    title: '5. Segurança e moderação',
    content: 'Todo acesso à Área de Relacionamentos requer autenticação. Implementamos medidas técnicas para proteger seus dados. Nossa equipe de moderação analisa denúncias em até 72 horas. Comportamentos que violem os princípios cristãos ou as normas da plataforma resultarão em suspensão ou banimento permanente.',
  },
  {
    title: '6. Bloqueios e denúncias',
    content: 'Ao bloquear um usuário, impedimos que ele visualize seu perfil e que apareça em suas buscas. Os dados de bloqueio são mantidos enquanto você não desbloqueie. Denúncias são encaminhadas à nossa equipe de moderação e mantidas em nossos registros por 12 meses para fins de segurança.',
  },
  {
    title: '7. Retenção e exclusão de dados',
    content: 'Seus dados de relacionamento são mantidos enquanto sua conta estiver ativa. Você pode excluir seu perfil de relacionamentos a qualquer momento, o que removerá seus dados desta área. A exclusão da conta principal remove todos os dados associados. Registros de moderação podem ser mantidos por até 12 meses após a exclusão por razões de segurança.',
  },
  {
    title: '8. Direitos do usuário',
    content: 'Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a: acesso aos seus dados, correção de dados inexatos, exclusão dos seus dados, portabilidade dos dados, revogação do consentimento a qualquer momento. Para exercer qualquer desses direitos, entre em contato pelo e-mail: privacidade@conexaobatista.com.br',
  },
  {
    title: '9. Consentimento',
    content: 'O acesso à Área de Relacionamentos requer consentimento explícito com esta política e confirmação de maioridade (18+ anos). Ao entrar na área, você confirma ter lido e concordado com todos os termos aqui descritos. O consentimento pode ser revogado a qualquer momento através do contato com nosso suporte.',
  },
  {
    title: '10. Alterações nesta política',
    content: 'Esta política pode ser atualizada. Notificaremos os usuários sobre mudanças significativas por e-mail ou aviso na plataforma. O uso continuado da Área de Relacionamentos após notificação implica aceitação das novas condições.',
  },
];

export default function RelacionamentosPrivacidadePage() {
  return (
    <>
      <Helmet>
        <title>Privacidade na Área de Relacionamentos | Conexão Batista</title>
        <meta name="description" content="Política de privacidade específica para a Área de Relacionamentos do Conexão Batista." />
      </Helmet>
      <div className="mx-auto max-w-3xl px-5 py-16 lg:px-0">
        <Link to="/relacionamentos" className="mb-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="mb-10 flex items-start gap-4">
          <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck size={24} strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="font-display text-4xl font-extrabold text-primary">Política de Privacidade</h1>
            <p className="mt-2 text-base text-muted-foreground">Área de Relacionamentos — Conexão Batista</p>
            <p className="mt-1 text-xs text-muted-foreground">Última atualização: agosto de 2025</p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border-l-4 border-primary bg-primary/5 p-5">
          <p className="text-sm leading-relaxed text-foreground">
            Esta área é exclusiva para adultos (18+) que concordam com os princípios cristãos do Conexão Batista. Seus dados são tratados com máxima confidencialidade e utilizados apenas para proporcionar conexões genuínas entre membros.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title} className="border-t border-border pt-8 first:border-0 first:pt-0">
              <h2 className="font-display text-lg font-bold text-primary mb-3">{s.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-primary p-7 text-center text-primary-foreground">
          <p className="font-display text-lg font-bold mb-2">Dúvidas sobre privacidade?</p>
          <p className="text-sm text-primary-foreground/80 mb-4">Entre em contato com nossa equipe de privacidade.</p>
          <a href="mailto:privacidade@conexaobatista.com.br" className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-bold text-accent-foreground">
            privacidade@conexaobatista.com.br
          </a>
        </div>
      </div>
    </>
  );
}
