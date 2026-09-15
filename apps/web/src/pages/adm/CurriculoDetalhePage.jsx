import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, FileText, Save, Check, Briefcase, GraduationCap,
  Award, Languages, Sparkles, Lock, ShieldCheck,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { STATUS_CURRICULO, formatarDataCurriculo } from '@/pages/adm/CurriculosPage.jsx';

const STATUS_OPTIONS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'excluido', label: 'Excluído' },
];

const GRAU_LABEL = {
  ensino_fundamental: 'Ensino Fundamental',
  ensino_medio: 'Ensino Médio',
  tecnico: 'Técnico',
  superior: 'Superior',
  pos_graduacao: 'Pós-graduação',
  mestrado: 'Mestrado',
  doutorado: 'Doutorado',
};

const NIVEL_HAB = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado', especialista: 'Especialista' };
const NIVEL_IDIOMA = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado', fluente: 'Fluente', nativo: 'Nativo' };
const MODALIDADE = { presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' };
const STATUS_FORM = { cursando: 'Cursando', concluido: 'Concluído', trancado: 'Trancado', abandonado: 'Abandonado' };
const TIPO_CONTRATO = { clt: 'CLT', pj: 'PJ', estagio: 'Estágio', freelancer: 'Freelancer', temporario: 'Temporário', outro: 'Outro' };
const REGIME = { presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto', indiferente: 'Indiferente' };
const VISIBILIDADE = { publico: 'Público', membros: 'Membros', privado: 'Privado' };

export default function CurriculoDetalhePage() {
  const { id } = useParams();

  const [curriculo, setCurriculo] = useState(null);
  const [experiencias, setExperiencias] = useState([]);
  const [formacoes, setFormacoes] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [certificacoes, setCertificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erroLoad, setErroLoad] = useState('');

  const [novoStatus, setNovoStatus] = useState('');
  const [confirmacao, setConfirmacao] = useState(null);
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      setErroLoad('');
      try {
        const rec = await pb.collection('curriculos').getOne(id, { expand: 'usuario_id' });
        if (!ativo) return;
        setCurriculo(rec);
        setNovoStatus(rec.status || 'rascunho');

        const filtro = pb.filter('curriculo_id = {:cid}', { cid: id });
        const [exp, form, hab, idiom, cert] = await Promise.all([
          pb.collection('curriculo_experiencias').getFullList({ filter: filtro, sort: '-data_inicio' }),
          pb.collection('curriculo_formacoes').getFullList({ filter: filtro, sort: '-data_inicio' }),
          pb.collection('curriculo_habilidades').getFullList({ filter: filtro }),
          pb.collection('curriculo_idiomas').getFullList({ filter: filtro }),
          pb.collection('curriculo_certificacoes').getFullList({ filter: filtro, sort: '-data_conclusao' }),
        ]);
        if (!ativo) return;
        setExperiencias(exp);
        setFormacoes(form);
        setHabilidades(hab);
        setIdiomas(idiom);
        setCertificacoes(cert);
      } catch (err) {
        setErroLoad('Não foi possível carregar este currículo. Ele pode ter sido removido ou você não tem permissão.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, [id]);

  const pedirConfirmacao = (status) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    setConfirmacao({ status, label: opt?.label || status });
  };

  const confirmarStatus = async () => {
    if (!confirmacao) return;
    setErro('');
    setMsg('');
    setSalvandoStatus(true);
    try {
      const rec = await pb.collection('curriculos').update(id, { status: confirmacao.status });
      setCurriculo(rec);
      setNovoStatus(confirmacao.status);
      setMsg(`Status alterado para "${confirmacao.label}".`);
      setConfirmacao(null);
    } catch (err) {
      setErro('Não foi possível alterar o status. Tente novamente.');
    } finally {
      setSalvandoStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-muted-foreground">
        <Loader2 size={22} className="animate-spin" /> Carregando currículo…
      </div>
    );
  }

  if (erroLoad || !curriculo) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <AlertTriangle size={36} className="mx-auto text-accent" />
        <p className="mt-4 text-sm text-muted-foreground">{erroLoad || 'Currículo não encontrado.'}</p>
        <Link to="/adm/curriculos" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
          <ArrowLeft size={16} /> Voltar para o Banco de Empregos
        </Link>
      </section>
    );
  }

  const st = STATUS_CURRICULO[curriculo.status] || STATUS_CURRICULO.rascunho;
  const statusMudou = novoStatus !== curriculo.status;

  return (
    <>
      <Helmet>
        <title>{curriculo.nome_completo || 'Currículo'} | Banco de Empregos</title>
        <meta name="description" content="Visualização de currículo." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="mx-auto max-w-5xl px-5 py-10 lg:px-10">
        <Link to="/adm/curriculos" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar para o Banco de Empregos
        </Link>

        {/* Cabeçalho */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/8 text-primary">
            <FileText size={30} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-bold text-primary">{curriculo.nome_completo || 'Sem nome'}</h1>
            <p className="truncate text-sm text-muted-foreground">
              {curriculo.email || '—'}
              {curriculo.expand?.usuario_id?.name ? ` · conta: ${curriculo.expand.usuario_id.name}` : ''}
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${st.className}`}>
            {st.label}
          </span>
        </div>

        {/* Aviso de privacidade */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          <Lock size={18} className="mt-0.5 shrink-0 text-accent" />
          <p>
            Por privacidade, campos sensíveis (CPF, data de nascimento, endereço, pretensão salarial e arquivo do currículo)
            são <span className="font-semibold">ocultados</span> desta visualização. Os dados são preservados no banco.
          </p>
        </div>

        {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{msg}</p>}
        {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna principal: dados + seções relacionadas */}
          <div className="space-y-6 lg:col-span-2">
            {/* Dados profissionais */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-display text-lg font-bold text-primary">Dados profissionais</h2>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Campo label="Nome completo" valor={curriculo.nome_completo} />
                <Campo label="E-mail" valor={curriculo.email} />
                <Campo label="Telefone" valor={curriculo.telefone} />
                <Campo label="Cidade/UF" valor={[curriculo.cidade, curriculo.estado].filter(Boolean).join('/')} />
                <Campo label="País" valor={curriculo.pais} />
                <Campo label="Tipo de contrato" valor={TIPO_CONTRATO[curriculo.tipo_contrato]} />
                <Campo label="Regime de trabalho" valor={REGIME[curriculo.regime_trabalho]} />
                <Campo label="Disponibilidade para viagem" valor={curriculo.disponibilidade_viagem ? 'Sim' : 'Não'} />
                <Campo label="Disponibilidade para mudança" valor={curriculo.disponibilidade_mudanca ? 'Sim' : 'Não'} />
                <Campo label="LinkedIn" valor={curriculo.linkedin_url} link />
                <Campo label="Portfolio" valor={curriculo.portfolio_url} link />
                <Campo label="Visibilidade do perfil" valor={VISIBILIDADE[curriculo.visibilidade_perfil]} />
              </dl>

              {curriculo.resumo_profissional && (
                <div className="mt-5 border-t border-border pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo profissional</dt>
                  <dd className="mt-1 text-sm text-foreground">{curriculo.resumo_profissional}</dd>
                </div>
              )}
              {curriculo.objetivo && (
                <div className="mt-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Objetivo</dt>
                  <dd className="mt-1 text-sm text-foreground">{curriculo.objetivo}</dd>
                </div>
              )}
            </div>

            {/* Experiências profissionais */}
            <Secao titulo="Experiências profissionais" icon={Briefcase} vazia="Nenhuma experiência cadastrada.">
              {experiencias.map((e) => (
                <div key={e.id} className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{e.cargo || '—'}</p>
                    {e.modalidade && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{MODALIDADE[e.modalidade] || e.modalidade}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{e.empresa || '—'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatarDataCurriculo(e.data_inicio)} — {e.emprego_atual ? 'Emprego atual' : formatarDataCurriculo(e.data_fim)}
                  </p>
                  {e.descricao && <p className="mt-2 text-sm text-foreground">{e.descricao}</p>}
                </div>
              ))}
            </Secao>

            {/* Formações acadêmicas */}
            <Secao titulo="Formações acadêmicas" icon={GraduationCap} vazia="Nenhuma formação cadastrada.">
              {formacoes.map((f) => (
                <div key={f.id} className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="font-semibold text-foreground">{f.curso || '—'}</p>
                  <p className="text-sm text-muted-foreground">{f.instituicao || '—'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {GRAU_LABEL[f.grau] || '—'}
                    {' · '}
                    {STATUS_FORM[f.status] || '—'}
                    {' · '}
                    {formatarDataCurriculo(f.data_inicio)} — {formatarDataCurriculo(f.data_conclusao)}
                  </p>
                </div>
              ))}
            </Secao>

            {/* Habilidades */}
            <Secao titulo="Habilidades" icon={Sparkles} vazia="Nenhuma habilidade cadastrada.">
              <div className="flex flex-wrap gap-2">
                {habilidades.map((h) => (
                  <span key={h.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1 text-sm text-foreground">
                    {h.nome || '—'}
                    {h.nivel && <span className="text-xs text-muted-foreground">· {NIVEL_HAB[h.nivel] || h.nivel}</span>}
                  </span>
                ))}
              </div>
            </Secao>

            {/* Idiomas */}
            <Secao titulo="Idiomas" icon={Languages} vazia="Nenhum idioma cadastrado.">
              <div className="flex flex-wrap gap-2">
                {idiomas.map((i) => (
                  <span key={i.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1 text-sm text-foreground">
                    {i.idioma || '—'}
                    {i.nivel && <span className="text-xs text-muted-foreground">· {NIVEL_IDIOMA[i.nivel] || i.nivel}</span>}
                  </span>
                ))}
              </div>
            </Secao>

            {/* Certificações */}
            <Secao titulo="Certificações" icon={Award} vazia="Nenhuma certificação cadastrada.">
              {certificacoes.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="font-semibold text-foreground">{c.curso || '—'}</p>
                  <p className="text-sm text-muted-foreground">{c.instituicao || '—'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Conclusão: {formatarDataCurriculo(c.data_conclusao)}</p>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      Ver credencial
                    </a>
                  )}
                </div>
              ))}
            </Secao>
          </div>

          {/* Coluna lateral: status + metadados */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-1 font-display text-lg font-bold text-primary">Status do currículo</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Atual: <span className="font-semibold text-foreground">{st.label}</span>
              </p>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Alterar status</label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={!statusMudou || salvandoStatus}
                onClick={() => pedirConfirmacao(novoStatus)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-40"
              >
                <Save size={16} /> Salvar status
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                A administração pode alterar apenas o status. Os demais dados são preservados.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-primary">
                <ShieldCheck size={18} className="text-accent" /> Metadados
              </h2>
              <ul className="space-y-2 text-sm">
                <Meta label="Data de cadastro" valor={formatarDataCurriculo(curriculo.data_cadastro)} />
                <Meta label="Última atualização" valor={formatarDataCurriculo(curriculo.data_atualizacao)} />
                <Meta label="Fonte de origem" valor={curriculo.fonte_origem} />
                <Meta label="Consentimento LGPD" valor={curriculo.lgpd_consentimento ? 'Concedido' : 'Não registrado'} />
                <Meta label="Data do consentimento" valor={formatarDataCurriculo(curriculo.data_consentimento)} />
                <Meta label="Exclusão solicitada" valor={formatarDataCurriculo(curriculo.data_exclusao_solicitada)} />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de confirmação */}
      {confirmacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <AlertTriangle size={22} />
              </span>
              <h3 className="font-display text-lg font-bold text-primary">Confirmar alteração de status</h3>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              Você está prestes a alterar o status do currículo de <span className="font-bold">{curriculo.nome_completo || curriculo.email}</span> para:
            </p>
            <p className="mt-2 rounded-lg bg-muted/60 px-4 py-2.5 text-sm font-bold text-primary">{confirmacao.label}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Os demais dados do currículo serão preservados. Esta ação pode ser revertida alterando o status novamente.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmacao(null)} disabled={salvandoStatus}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">
                Cancelar
              </button>
              <button type="button" onClick={confirmarStatus} disabled={salvandoStatus}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60">
                {salvandoStatus ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {salvandoStatus ? 'Salvando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Campo({ label, valor, link }) {
  if (link && valor) {
    return (
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="mt-1 truncate text-sm font-semibold text-primary hover:underline">
          <a href={valor} target="_blank" rel="noreferrer" className="break-all">{valor}</a>
        </dd>
      </div>
    );
  }
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{valor || '—'}</dd>
    </div>
  );
}

function Meta({ label, valor }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{valor || '—'}</span>
    </li>
  );
}

function Secao({ titulo, icon: Icon, vazia, children }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-primary">
        <Icon size={18} className="text-accent" /> {titulo}
      </h2>
      {React.Children.count(children) === 0 ? (
        <p className="text-sm text-muted-foreground">{vazia}</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  );
}
