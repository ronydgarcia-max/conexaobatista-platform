import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, ArrowLeft } from 'lucide-react';

export default function ConsentimentoPage() {
  return (
    <>
      <Helmet>
        <title>Consentimento para uso dos dados | Conexão Batista</title>
        <meta name="description" content="Termo de Consentimento para uso dos dados no portal Conexão Batista." />
      </Helmet>
      <section className="mx-auto max-w-3xl px-5 py-16 lg:py-20">
        <Link to="/cadastro" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar ao cadastro
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary"><ShieldCheck size={24} strokeWidth={1.8} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Documentos</p>
            <h1 className="font-display text-3xl font-bold text-primary">Consentimento para uso dos dados</h1>
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
            <h2 className="font-display text-lg font-bold text-primary">1. Finalidade do tratamento</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Descrição das finalidades para as quais
              os dados cadastrais (nome, WhatsApp, sexo, cidade e e-mail) serão coletados e tratados
              pelo Conexão Batista, em conformidade com a LGPD (Lei nº 13.709/2018).
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">2. Dados coletados</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Relação detalhada dos dados pessoais
              coletados no cadastro, prazo de guarda e forma de armazenamento seguro.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">3. Compartilhamento</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Condições em que os dados poderão ser
              compartilhados, inclusive com a igreja responsável pela validação da condição de membro.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">4. Direitos do titular</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Direitos de acesso, correção, exclusão
              e revogação do consentimento, com os canais para exercê-los.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">5. Revogação do consentimento</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Procedimento para revogar este
              consentimento a qualquer tempo, observados os prazos legais.
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
