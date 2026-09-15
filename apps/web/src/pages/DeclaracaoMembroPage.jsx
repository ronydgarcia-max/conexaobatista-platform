import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Church, FileText, ArrowLeft } from 'lucide-react';

export default function DeclaracaoMembroPage() {
  return (
    <>
      <Helmet>
        <title>Declaração de membro da igreja | Conexão Batista</title>
        <meta name="description" content="Declaração de condição de membro de igreja batista para aprovação de cadastro no Conexão Batista." />
      </Helmet>
      <section className="mx-auto max-w-3xl px-5 py-16 lg:py-20">
        <Link to="/minha-conta" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar para Minha conta
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary"><Church size={24} strokeWidth={1.8} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Documentos</p>
            <h1 className="font-display text-3xl font-bold text-primary">Declaração de membro da igreja</h1>
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
            <h2 className="font-display text-lg font-bold text-primary">1. Finalidade da declaração</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Explicação de que a aprovação do
              cadastro depende de a igreja receber e validar a declaração de que o solicitante
              é membro em plena comunhão de uma igreja batista.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">2. Como obter a declaração</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Orientações para o membro solicitar
              à sua igreja local a declaração ou carta de recomendação, e os canais de envio
              reconhecidos pelo Conexão Batista.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">3. Validação pela igreja</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Procedimento pelo qual a igreja
              confirma a condição de membro, prazos para retorno e efeito sobre o status do
              cadastro (aprovação ou recusa).
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-primary">4. Veracidade da informação</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [Texto a ser inserido após revisão jurídica.] Consequências de declaração falsa
              ou inconsistente, incluindo suspensão da conta.
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
