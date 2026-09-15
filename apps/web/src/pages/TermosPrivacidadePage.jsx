import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermosPrivacidadePage() {
  return (
    <>
      <Helmet>
        <title>Termos de Uso e Política de Privacidade | Conexão Batista</title>
        <meta name="description" content="Termos de Uso e Política de Privacidade do portal Conexão Batista." />
      </Helmet>
      <section className="mx-auto max-w-3xl px-5 py-16 lg:py-20">
        <Link to="/cadastro" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar ao cadastro
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary"><FileText size={24} strokeWidth={1.8} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Documentos</p>
            <h1 className="font-display text-3xl font-bold text-primary">Termos de Uso e Política de Privacidade</h1>
          </div>
        </div>

        <div className="mb-10 rounded-xl border border-accent/40 bg-accent/8 px-5 py-4 text-sm leading-relaxed text-foreground">
          <p className="font-semibold text-primary">Aviso de revisão jurídica</p>
          <p className="mt-1">
            O conteúdo abaixo é um modelo de estrutura, em revisão por especialista jurídico.
            O texto definitivo será inserido após essa revisão e publicação oficial.
          </p>
        </div>

        <div className="space-y-8 text-left">
          <div>
            <h2 className="font-display text-lg font-bold text-primary">1. Objeto dos Termos de Uso</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Condições gerais de uso do portal
              Conexão Batista, responsabilidades do usuário e regras de conduta entre membros.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">2. Cadastro e aprovação</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Fluxo de cadastro, condição de membro
              de igreja batista, validação pela igreja e critérios de aprovação ou recusa de contas.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">3. Política de Privacidade</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Base legal, finalidades do tratamento,
              medidas de segurança e retenção dos dados pessoais, em conformidade com a LGPD.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">4. Responsabilidades</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Limitação de responsabilidade do
              Conexão Batista, condutas proibidas e consequências em caso de descumprimento.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">5. Encerramento de conta</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Hipóteses de suspensão ou encerramento
              da conta, solicitação de exclusão de dados e efeitos sobre o cadastro.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">6. Alterações</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Condições para atualização destes
              Termos e da Política de Privacidade, com comunicação prévia aos usuários.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <FileText size={16} /> Documento em revisão
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Versão preliminar — não vinculante. O texto definitivo substituirá este conteúdo
              após a conclusão da revisão jurídica especializada.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
