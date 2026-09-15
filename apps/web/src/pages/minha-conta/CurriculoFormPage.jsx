import UfCidadeFields from '@/components/UfCidadeFields.jsx';
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Upload,
  PenLine,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Star,
  Languages,
  Award,
  Eye,
  Lock,
  Users,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';
import {
  extractTextFromFile,
  parseLinkedInText,
  EMPTY_CURRICULO,
} from '@/lib/linkedinParser';

const TIPO_CONTRATO = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'estagio', label: 'Estágio' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'temporario', label: 'Temporário' },
  { value: 'outro', label: 'Outro' },
];

const REGIME = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'remoto', label: 'Remoto' },
  { value: 'indiferente', label: 'Indiferente' },
];

const VISIBILIDADE = [
  { value: 'publico', label: 'Público (visível para todos)' },
  { value: 'membros', label: 'Apenas membros aprovados' },
  { value: 'privado', label: 'Privado (só eu e administradores)' },
];

const GRAU = [
  { value: 'ensino_fundamental', label: 'Ensino Fundamental' },
  { value: 'ensino_medio', label: 'Ensino Médio' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'superior', label: 'Superior' },
  { value: 'pos_graduacao', label: 'Pós-graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
];

const STATUS_FORMACAO = [
  { value: 'cursando', label: 'Cursando' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'trancado', label: 'Trancado' },
  { value: 'abandonado', label: 'Abandonado' },
];

const NIVEL_HABILIDADE = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
  { value: 'especialista', label: 'Especialista' },
];

const NIVEL_IDIOMA = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
  { value: 'fluente', label: 'Fluente' },
  { value: 'nativo', label: 'Nativo' },
];

const MODALIDADE = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'remoto', label: 'Remoto' },
];

const inputClass =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted/50 disabled:text-muted-foreground';
const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground';

export default function CurriculoFormPage() {
  const { currentUser, isAuthenticated } = useSubscriptionAuth();
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState('carregando'); // carregando | escolha | formulario
  const [dados, setDados] = useState(EMPTY_CURRICULO);
  const [curriculoId, setCurriculoId] = useState(null);
  const [removedIds, setRemovedIds] = useState({
    experiencias: [],
    formacoes: [],
    habilidades: [],
    idiomas: [],
    certificacoes: [],
  });

  const [importando, setImportando] = useState(false);
  const [erroImport, setErroImport] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [jaExistia, setJaExistia] = useState(false);

  // Consulta automática de CEP via ViaCEP.
  const [cepStatus, setCepStatus] = useState(''); // '' | 'buscando' | 'ok' | 'erro'
  const [cepMensagem, setCepMensagem] = useState('');
  const [cepBuscando, setCepBuscando] = useState(false);

  // Carrega currículo existente (se houver) para permitir atualização.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/minha-conta/curriculo', { replace: true });
      return;
    }
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await pb
          .collection('curriculos')
          .getFirstListItem(`usuario_id = "${currentUser.id}"`)
          .catch(() => null);
        if (cancelled) return;
        if (existing) {
          setCurriculoId(existing.id);
          setJaExistia(true);
          await carregarRelacionados(existing);
          setEtapa('formulario');
        } else {
          setEtapa('escolha');
        }
      } catch (e) {
        setEtapa('escolha');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser]);

  const carregarRelacionados = async (curriculo) => {
    const base = {
      nome_completo: curriculo.nome_completo || '',
      cpf: curriculo.cpf || '',
      data_nascimento: curriculo.data_nascimento || '',
      email: curriculo.email || '',
      telefone: curriculo.telefone || '',
      linkedin_url: curriculo.linkedin_url || '',
      portfolio_url: curriculo.portfolio_url || '',
      cep: curriculo.cep || '',
      logradouro: curriculo.logradouro || '',
      complemento: curriculo.complemento || '',
      bairro: curriculo.bairro || '',
      cidade: curriculo.cidade || '',
      estado: curriculo.estado || '',
      pais: curriculo.pais || 'Brasil',
      resumo_profissional: curriculo.resumo_profissional || '',
      objetivo: curriculo.objetivo || '',
      pretensao_salarial: curriculo.pretensao_salarial || '',
      tipo_contrato: curriculo.tipo_contrato || '',
      disponibilidade_viagem: !!curriculo.disponibilidade_viagem,
      disponibilidade_mudanca: !!curriculo.disponibilidade_mudanca,
      regime_trabalho: curriculo.regime_trabalho || '',
      arquivo_curriculo_url: curriculo.arquivo_curriculo_url || '',
      lgpd_consentimento: !!curriculo.lgpd_consentimento,
      visibilidade_perfil: curriculo.visibilidade_perfil || 'membros',
      fonte_origem: curriculo.fonte_origem || 'manual',
      status: curriculo.status || 'rascunho',
    };

    const [exp, form, hab, idi, cert] = await Promise.all([
      pb.collection('curriculo_experiencias').getFullList({
        filter: `curriculo_id = "${curriculo.id}"`,
        sort: '-data_inicio',
      }).catch(() => []),
      pb.collection('curriculo_formacoes').getFullList({
        filter: `curriculo_id = "${curriculo.id}"`,
        sort: '-data_conclusao',
      }).catch(() => []),
      pb.collection('curriculo_habilidades').getFullList({
        filter: `curriculo_id = "${curriculo.id}"`,
      }).catch(() => []),
      pb.collection('curriculo_idiomas').getFullList({
        filter: `curriculo_id = "${curriculo.id}"`,
      }).catch(() => []),
      pb.collection('curriculo_certificacoes').getFullList({
        filter: `curriculo_id = "${curriculo.id}"`,
      }).catch(() => []),
    ]);

    setDados({
      curriculo: base,
      experiencias: exp.map(normalizeExp),
      formacoes: form.map(normalizeForm),
      habilidades: hab.map(normalizeHab),
      idiomas: idi.map(normalizeIdi),
      certificacoes: cert.map(normalizeCert),
    });
  };

  const setCampo = (campo, valor) => {
    setDados((d) => ({ ...d, curriculo: { ...d.curriculo, [campo]: valor } }));
  };

  // Consulta automática de CEP via ViaCEP quando o usuário informa 8 dígitos.
  const consultarCep = async (cepRaw) => {
    const cep = (cepRaw || '').replace(/\D/g, '');
    if (cep.length !== 8) {
      setCepStatus('');
      setCepMensagem('');
      return;
    }
    setCepBuscando(true);
    setCepStatus('buscando');
    setCepMensagem('Buscando endereço…');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('resposta-invalida');
      const data = await res.json();
      if (data.erro) {
        setCepStatus('erro');
        setCepMensagem('CEP não encontrado. Verifique o número e tente novamente.');
        return;
      }
      setDados((d) => ({
        ...d,
        curriculo: {
          ...d.curriculo,
          cep,
          logradouro: data.logradouro || d.curriculo.logradouro,
          bairro: data.bairro || d.curriculo.bairro,
          cidade: data.localidade || d.curriculo.cidade,
          estado: data.uf || d.curriculo.estado,
        },
      }));
      setCepStatus('ok');
      setCepMensagem('Endereço preenchido automaticamente. Revise e ajuste se necessário.');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setCepStatus('erro');
        setCepMensagem('O serviço de consulta está indisponível no momento. Preencha o endereço manualmente.');
      } else {
        setCepStatus('erro');
        setCepMensagem('Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setCepBuscando(false);
    }
  };

  const handleCepChange = (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.slice(0, 8);
    // Formata como 00000-000.
    const formatado = valor.length > 5 ? `${valor.slice(0, 5)}-${valor.slice(5)}` : valor;
    setCampo('cep', formatado);
    if (valor.length === 8) {
      consultarCep(valor);
    } else if (cepStatus) {
      setCepStatus('');
      setCepMensagem('');
    }
  };

  const handleImportar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true);
    setErroImport('');
    try {
      const text = await extractTextFromFile(file);
      const parsed = parseLinkedInText(text);
      // Mescla com dados já existentes (não sobrescreve campos preenchidos).
      setDados((d) => ({
        curriculo: {
          ...EMPTY_CURRICULO.curriculo,
          ...d.curriculo,
          ...parsed.curriculo,
          // Mantém consentimento e visibilidade já escolhidos.
          lgpd_consentimento: d.curriculo.lgpd_consentimento,
          visibilidade_perfil: d.curriculo.visibilidade_perfil || 'membros',
          fonte_origem: 'linkedin',
          status: d.curriculo.status || 'rascunho',
        },
        experiencias: parsed.experiencias.length ? parsed.experiencias : d.experiencias,
        formacoes: parsed.formacoes.length ? parsed.formacoes : d.formacoes,
        habilidades: parsed.habilidades.length ? parsed.habilidades : d.habilidades,
        idiomas: parsed.idiomas.length ? parsed.idiomas : d.idiomas,
        certificacoes: parsed.certificacoes.length ? parsed.certificacoes : d.certificacoes,
      }));
      setEtapa('formulario');
    } catch (err) {
      setErroImport(err?.message || 'Não foi possível ler o arquivo.');
    } finally {
      setImportando(false);
      e.target.value = '';
    }
  };

  const iniciarManual = () => {
    setDados((d) => ({
      ...EMPTY_CURRICULO,
      curriculo: {
        ...EMPTY_CURRICULO.curriculo,
        nome_completo: currentUser?.name || '',
        email: currentUser?.email || '',
        telefone: currentUser?.whatsapp || '',
        cidade: currentUser?.cidade || '',
      },
    }));
    setEtapa('formulario');
  };

  // ----- Operações de seções dinâmicas -----
  const addItem = (secao, itemVazio) => {
    setDados((d) => ({ ...d, [secao]: [...d[secao], itemVazio] }));
  };
  const updateItem = (secao, index, campo, valor) => {
    setDados((d) => ({
      ...d,
      [secao]: d[secao].map((it, i) => (i === index ? { ...it, [campo]: valor } : it)),
    }));
  };
  const removeItem = (secao, index) => {
    setDados((d) => {
      const item = d[secao][index];
      if (item.id) {
        setRemovedIds((r) => ({ ...r, [secao]: [...r[secao], item.id] }));
      }
      return { ...d, [secao]: d[secao].filter((_, i) => i !== index) };
    });
  };

  // ----- Salvamento -----
  const validar = () => {
    if (!dados.curriculo.nome_completo.trim()) return 'Informe seu nome completo.';
    if (!dados.curriculo.email.trim()) return 'Informe seu e-mail.';
    if (!dados.curriculo.lgpd_consentimento)
      return 'Você precisa aceitar o consentimento LGPD para salvar o currículo.';
    return '';
  };

  const salvar = async (e) => {
    e?.preventDefault();
    setErro('');
    setSucesso('');
    const errValid = validar();
    if (errValid) {
      setErro(errValid);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSalvando(true);
    try {
      const userId = currentUser.id;
      const hoje = new Date().toISOString().slice(0, 10);
      const payload = {
        usuario_id: userId,
        nome_completo: dados.curriculo.nome_completo,
        cpf: dados.curriculo.cpf,
        data_nascimento: dados.curriculo.data_nascimento || null,
        email: dados.curriculo.email,
        telefone: dados.curriculo.telefone,
        linkedin_url: dados.curriculo.linkedin_url,
        portfolio_url: dados.curriculo.portfolio_url,
        cep: dados.curriculo.cep,
        logradouro: dados.curriculo.logradouro,
        complemento: dados.curriculo.complemento,
        bairro: dados.curriculo.bairro,
        cidade: dados.curriculo.cidade,
        estado: dados.curriculo.estado,
        pais: dados.curriculo.pais,
        resumo_profissional: dados.curriculo.resumo_profissional,
        objetivo: dados.curriculo.objetivo,
        pretensao_salarial: dados.curriculo.pretensao_salarial,
        tipo_contrato: dados.curriculo.tipo_contrato || null,
        disponibilidade_viagem: !!dados.curriculo.disponibilidade_viagem,
        disponibilidade_mudanca: !!dados.curriculo.disponibilidade_mudanca,
        regime_trabalho: dados.curriculo.regime_trabalho || null,
        arquivo_curriculo_url: dados.curriculo.arquivo_curriculo_url,
        lgpd_consentimento: true,
        data_consentimento: dados.curriculo.lgpd_consentimento
          ? (dados.curriculo.data_consentimento || hoje)
          : null,
        visibilidade_perfil: dados.curriculo.visibilidade_perfil || 'membros',
        fonte_origem: dados.curriculo.fonte_origem || 'manual',
        status: 'rascunho',
      };

      let cid = curriculoId;
      if (cid) {
        await pb.collection('curriculos').update(cid, payload);
      } else {
        const created = await pb.collection('curriculos').create(payload);
        cid = created.id;
        setCurriculoId(cid);
        setJaExistia(true);
      }

      // Sincroniza seções relacionadas: cria novos, atualiza existentes.
      await sincronizarSecao('curriculo_experiencias', 'experiencias', cid, dados.experiencias);
      await sincronizarSecao('curriculo_formacoes', 'formacoes', cid, dados.formacoes);
      await sincronizarSecao('curriculo_habilidades', 'habilidades', cid, dados.habilidades);
      await sincronizarSecao('curriculo_idiomas', 'idiomas', cid, dados.idiomas);
      await sincronizarSecao('curriculo_certificacoes', 'certificacoes', cid, dados.certificacoes);

      // Remove registros marcados para exclusão.
      await removerMarcados(cid);

      setRemovedIds({
        experiencias: [],
        formacoes: [],
        habilidades: [],
        idiomas: [],
        certificacoes: [],
      });
      setSucesso('Currículo salvo como rascunho com sucesso! Você pode atualizá-lo quando quiser.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.usuario_id) {
        setErro('Já existe um currículo vinculado à sua conta. Recarregue a página para editá-lo.');
      } else {
        setErro('Não foi possível salvar o currículo. Verifique os dados e tente novamente.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const sincronizarSecao = async (collection, secao, cid, itens) => {
    for (let i = 0; i < itens.length; i += 1) {
      const it = itens[i];
      const base = { ...it, curriculo_id: cid };
      delete base.id;
      // Limpa campos vazios de data.
      ['data_inicio', 'data_fim', 'data_conclusao'].forEach((f) => {
        if (base[f] === '') base[f] = null;
      });
      try {
        if (it.id) {
          await pb.collection(collection).update(it.id, base, { requestKey: `${collection}-upd-${it.id}` });
        } else {
          await pb.collection(collection).create(base, { requestKey: `${collection}-new-${i}-${cid}` });
        }
      } catch (e) {
        console.error(`Erro ao salvar ${collection}:`, e);
      }
    }
  };

  const removerMarcados = async () => {
    const map = {
      curriculo_experiencias: removedIds.experiencias,
      curriculo_formacoes: removedIds.formacoes,
      curriculo_habilidades: removedIds.habilidades,
      curriculo_idiomas: removedIds.idiomas,
      curriculo_certificacoes: removedIds.certificacoes,
    };
    for (const [col, ids] of Object.entries(map)) {
      for (const id of ids) {
        try {
          await pb.collection(col).delete(id, { requestKey: `${col}-del-${id}` });
        } catch (e) {
          console.error(`Erro ao remover ${col}/${id}:`, e);
        }
      }
    }
  };

  if (!isAuthenticated || !currentUser) return null;

  // ---------- Tela de escolha ----------
  if (etapa === 'carregando') {
    return (
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Loader2 className="mx-auto animate-spin text-primary" size={28} />
        <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>
      </section>
    );
  }

  if (etapa === 'escolha') {
    return (
      <>
        <Helmet>
          <title>Cadastrar currículo | Conexão Batista</title>
          <meta name="description" content="Cadastre seu currículo no Conexão Batista preenchendo manualmente ou importando um arquivo do LinkedIn." />
        </Helmet>
        <section className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
          <Link to="/minha-conta" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft size={16} /> Voltar para Minha conta
          </Link>

          <div className="page-centered mt-8">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/8 text-primary">
              <FileText size={26} strokeWidth={1.8} />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-accent">Banco de Vagas e Currículos</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">Cadastrar meu currículo</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Escolha como deseja começar. Você poderá editar tudo antes de salvar e atualizar o currículo quando quiser.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={iniciarManual}
              className="group flex flex-col items-start rounded-2xl border border-border bg-white p-6 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <PenLine size={22} strokeWidth={1.8} />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-primary">Preencher manualmente</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Comece com um formulário vazio e preencha cada campo diretamente, no seu ritmo.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                Começar <ArrowLeft size={14} className="rotate-180" />
              </span>
            </button>

            <label className="group flex flex-col items-start rounded-2xl border border-border bg-white p-6 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md cursor-pointer">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <Upload size={22} strokeWidth={1.8} />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-primary">Importar arquivo do LinkedIn</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Envie o PDF ou DOCX exportado do seu LinkedIn. Vamos extrair os dados e você revisa tudo antes de salvar.
              </p>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleImportar}
                className="hidden"
              />
              {importando ? (
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Loader2 size={14} className="animate-spin" /> Importando…
                </span>
              ) : (
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                  Selecionar arquivo <ArrowLeft size={14} className="rotate-180" />
                </span>
              )}
            </label>
          </div>

          {erroImport && (
            <p className="mt-5 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {erroImport}
            </p>
          )}

          <div className="mt-8 rounded-xl border border-border bg-muted/30 p-5 text-left">
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <ShieldCheck size={16} /> Proteção dos seus dados
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Dados sensíveis (CPF, data de nascimento, endereço e pretensão salarial) ficam protegidos e visíveis apenas para você e para a administração do portal, conforme a LGPD. Você controla a visibilidade do seu perfil.
            </p>
          </div>
        </section>
      </>
    );
  }

  // ---------- Formulário ----------
  return (
    <>
      <Helmet>
        <title>{jaExistia ? 'Editar currículo' : 'Cadastrar currículo'} | Conexão Batista</title>
        <meta name="description" content="Formulário de cadastro de currículo no Conexão Batista." />
      </Helmet>
      <section className="mx-auto max-w-4xl px-5 py-14 lg:py-20">
        <Link to="/minha-conta" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar para Minha conta
        </Link>

        <div className="mt-8 mb-8">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/8 text-primary">
            <FileText size={26} strokeWidth={1.8} />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-accent">Banco de Vagas e Currículos</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">
            {jaExistia ? 'Atualizar meu currículo' : 'Cadastrar meu currículo'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Preencha os campos abaixo e adicione quantas experiências, formações, habilidades, idiomas e certificações precisar. O currículo será salvo como rascunho e você poderá atualizá-lo quando quiser.
          </p>
        </div>

        {sucesso && (
          <p className="mb-6 flex items-start gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {sucesso}
          </p>
        )}
        {erro && (
          <p className="mb-6 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {erro}
          </p>
        )}

        <form onSubmit={salvar} className="space-y-6">
          {/* Dados pessoais */}
          <CardSecao titulo="Dados pessoais" icone={<FileText size={18} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome completo *</label>
                <input className={inputClass} value={dados.curriculo.nome_completo} onChange={(e) => setCampo('nome_completo', e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>CPF</label>
                <input className={inputClass} placeholder="000.000.000-00" value={dados.curriculo.cpf} onChange={(e) => setCampo('cpf', e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Privado, visível só para você e a administração.</p>
              </div>
              <div>
                <label className={labelClass}>Data de nascimento</label>
                <input type="date" className={inputClass} value={dados.curriculo.data_nascimento || ''} onChange={(e) => setCampo('data_nascimento', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>E-mail *</label>
                <input type="email" className={inputClass} value={dados.curriculo.email} onChange={(e) => setCampo('email', e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Telefone / WhatsApp</label>
                <input className={inputClass} placeholder="(11) 99999-9999" value={dados.curriculo.telefone} onChange={(e) => setCampo('telefone', e.target.value)} />
              </div>
            </div>
          </CardSecao>

          {/* Links */}
          <CardSecao titulo="Links e portfólio" icone={<Star size={18} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>LinkedIn</label>
                <input type="url" className={inputClass} placeholder="https://linkedin.com/in/usuario" value={dados.curriculo.linkedin_url} onChange={(e) => setCampo('linkedin_url', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Portfólio / GitHub</label>
                <input type="url" className={inputClass} placeholder="https://…" value={dados.curriculo.portfolio_url} onChange={(e) => setCampo('portfolio_url', e.target.value)} />
              </div>
            </div>
          </CardSecao>

          {/* Endereço */}
          <CardSecao titulo="Endereço" icone={<Briefcase size={18} />}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>CEP</label>
                <div className="relative">
                  <input
                    className={inputClass}
                    placeholder="00000-000"
                    value={dados.curriculo.cep}
                    onChange={handleCepChange}
                    inputMode="numeric"
                  />
                  {cepBuscando && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />
                  )}
                </div>
                {cepMensagem && (
                  <p
                    className={`mt-1.5 flex items-start gap-1.5 text-xs ${
                      cepStatus === 'erro' ? 'text-destructive' : cepStatus === 'ok' ? 'text-green-700' : 'text-muted-foreground'
                    }`}
                  >
                    {cepStatus === 'erro' ? <AlertCircle size={13} className="mt-0.5 shrink-0" /> : cepStatus === 'ok' ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" /> : <Loader2 size={13} className="mt-0.5 shrink-0 animate-spin" />}
                    {cepMensagem}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Logradouro</label>
                <input className={inputClass} value={dados.curriculo.logradouro} onChange={(e) => setCampo('logradouro', e.target.value)} />
              </div>
              <div className="sm:col-span-1">
                <label className={labelClass}>Bairro</label>
                <input className={inputClass} value={dados.curriculo.bairro} onChange={(e) => setCampo('bairro', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Complemento</label>
                <input className={inputClass} placeholder="Apto 101, Bloco A, Sala 5, etc." value={dados.curriculo.complemento} onChange={(e) => setCampo('complemento', e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Opcional. Privado, visível só para você e a administração.</p>
              </div>
              <div>
                <label className={labelClass}>Cidade</label>
                <input className={inputClass} value={dados.curriculo.cidade} onChange={(e) => setCampo('cidade', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Estado (UF)</label>
                <input className={inputClass} maxLength={2} placeholder="SP" value={dados.curriculo.estado} onChange={(e) => setCampo('estado', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>País</label>
                <input className={inputClass} value={dados.curriculo.pais} onChange={(e) => setCampo('pais', e.target.value)} />
              </div>
            </div>
          </CardSecao>

          {/* Profissional */}
          <CardSecao titulo="Informações profissionais" icone={<Briefcase size={18} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Resumo profissional</label>
                <textarea rows={4} className={inputClass} value={dados.curriculo.resumo_profissional} onChange={(e) => setCampo('resumo_profissional', e.target.value)} placeholder="Breve resumo da sua trajetória…" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Objetivo</label>
                <textarea rows={2} className={inputClass} value={dados.curriculo.objetivo} onChange={(e) => setCampo('objetivo', e.target.value)} placeholder="O que você busca profissionalmente…" />
              </div>
              <div>
                <label className={labelClass}>Pretensão salarial</label>
                <input className={inputClass} placeholder="R$ …" value={dados.curriculo.pretensao_salarial} onChange={(e) => setCampo('pretensao_salarial', e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Privado, visível só para você e a administração.</p>
              </div>
              <div>
                <label className={labelClass}>Tipo de contrato</label>
                <select className={inputClass} value={dados.curriculo.tipo_contrato} onChange={(e) => setCampo('tipo_contrato', e.target.value)}>
                  <option value="">Selecione…</option>
                  {TIPO_CONTRATO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Regime de trabalho</label>
                <select className={inputClass} value={dados.curriculo.regime_trabalho} onChange={(e) => setCampo('regime_trabalho', e.target.value)}>
                  <option value="">Selecione…</option>
                  {REGIME.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-3 sm:pt-7">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <input type="checkbox" className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30" checked={dados.curriculo.disponibilidade_viagem} onChange={(e) => setCampo('disponibilidade_viagem', e.target.checked)} />
                  Disponibilidade para viagem
                </label>
                <label className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <input type="checkbox" className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30" checked={dados.curriculo.disponibilidade_mudanca} onChange={(e) => setCampo('disponibilidade_mudanca', e.target.checked)} />
                  Disponibilidade para mudança
                </label>
              </div>
            </div>
          </CardSecao>

          {/* Experiências */}
          <SecaoDinamica
            titulo="Experiências profissionais"
            icone={<Briefcase size={18} />}
            onAdd={() => addItem('experiencias', { empresa: '', cargo: '', data_inicio: '', data_fim: '', emprego_atual: false, descricao: '', modalidade: '' })}
            onRemove={(i) => removeItem('experiencias', i)}
            itens={dados.experiencias}
            vazio="Nenhuma experiência adicionada."
          >
            {(item, i) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Cargo</label>
                  <input className={inputClass} value={item.cargo} onChange={(e) => updateItem('experiencias', i, 'cargo', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Empresa</label>
                  <input className={inputClass} value={item.empresa} onChange={(e) => updateItem('experiencias', i, 'empresa', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Data de início</label>
                  <input type="date" className={inputClass} value={item.data_inicio || ''} onChange={(e) => updateItem('experiencias', i, 'data_inicio', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Data de fim</label>
                  <input type="date" className={inputClass} disabled={item.emprego_atual} value={item.data_fim || ''} onChange={(e) => updateItem('experiencias', i, 'data_fim', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Modalidade</label>
                  <select className={inputClass} value={item.modalidade || ''} onChange={(e) => updateItem('experiencias', i, 'modalidade', e.target.value)}>
                    <option value="">Selecione…</option>
                    {MODALIDADE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <input type="checkbox" className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30" checked={item.emprego_atual} onChange={(e) => updateItem('experiencias', i, 'emprego_atual', e.target.checked)} />
                    Emprego atual
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Descrição</label>
                  <textarea rows={3} className={inputClass} value={item.descricao} onChange={(e) => updateItem('experiencias', i, 'descricao', e.target.value)} />
                </div>
              </div>
            )}
          </SecaoDinamica>

          {/* Formações */}
          <SecaoDinamica
            titulo="Formações acadêmicas"
            icone={<GraduationCap size={18} />}
            onAdd={() => addItem('formacoes', { instituicao: '', curso: '', grau: '', data_inicio: '', data_conclusao: '', status: '' })}
            onRemove={(i) => removeItem('formacoes', i)}
            itens={dados.formacoes}
            vazio="Nenhuma formação adicionada."
          >
            {(item, i) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Instituição</label>
                  <input className={inputClass} value={item.instituicao} onChange={(e) => updateItem('formacoes', i, 'instituicao', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Curso</label>
                  <input className={inputClass} value={item.curso} onChange={(e) => updateItem('formacoes', i, 'curso', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Grau</label>
                  <select className={inputClass} value={item.grau || ''} onChange={(e) => updateItem('formacoes', i, 'grau', e.target.value)}>
                    <option value="">Selecione…</option>
                    {GRAU.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={inputClass} value={item.status || ''} onChange={(e) => updateItem('formacoes', i, 'status', e.target.value)}>
                    <option value="">Selecione…</option>
                    {STATUS_FORMACAO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Data de início</label>
                  <input type="date" className={inputClass} value={item.data_inicio || ''} onChange={(e) => updateItem('formacoes', i, 'data_inicio', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Data de conclusão</label>
                  <input type="date" className={inputClass} value={item.data_conclusao || ''} onChange={(e) => updateItem('formacoes', i, 'data_conclusao', e.target.value)} />
                </div>
              </div>
            )}
          </SecaoDinamica>

          {/* Habilidades */}
          <SecaoDinamica
            titulo="Habilidades"
            icone={<Star size={18} />}
            onAdd={() => addItem('habilidades', { nome: '', nivel: 'intermediario' })}
            onRemove={(i) => removeItem('habilidades', i)}
            itens={dados.habilidades}
            vazio="Nenhuma habilidade adicionada."
          >
            {(item, i) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Habilidade</label>
                  <input className={inputClass} value={item.nome} onChange={(e) => updateItem('habilidades', i, 'nome', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Nível</label>
                  <select className={inputClass} value={item.nivel || 'intermediario'} onChange={(e) => updateItem('habilidades', i, 'nivel', e.target.value)}>
                    {NIVEL_HABILIDADE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </SecaoDinamica>

          {/* Idiomas */}
          <SecaoDinamica
            titulo="Idiomas"
            icone={<Languages size={18} />}
            onAdd={() => addItem('idiomas', { idioma: '', nivel: 'intermediario' })}
            onRemove={(i) => removeItem('idiomas', i)}
            itens={dados.idiomas}
            vazio="Nenhum idioma adicionado."
          >
            {(item, i) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Idioma</label>
                  <input className={inputClass} value={item.idioma} onChange={(e) => updateItem('idiomas', i, 'idioma', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Nível</label>
                  <select className={inputClass} value={item.nivel || 'intermediario'} onChange={(e) => updateItem('idiomas', i, 'nivel', e.target.value)}>
                    {NIVEL_IDIOMA.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </SecaoDinamica>

          {/* Certificações */}
          <SecaoDinamica
            titulo="Certificações"
            icone={<Award size={18} />}
            onAdd={() => addItem('certificacoes', { curso: '', instituicao: '', data_conclusao: '', url: '' })}
            onRemove={(i) => removeItem('certificacoes', i)}
            itens={dados.certificacoes}
            vazio="Nenhuma certificação adicionada."
          >
            {(item, i) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Curso / Certificação</label>
                  <input className={inputClass} value={item.curso} onChange={(e) => updateItem('certificacoes', i, 'curso', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Instituição</label>
                  <input className={inputClass} value={item.instituicao} onChange={(e) => updateItem('certificacoes', i, 'instituicao', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Data de conclusão</label>
                  <input type="date" className={inputClass} value={item.data_conclusao || ''} onChange={(e) => updateItem('certificacoes', i, 'data_conclusao', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>URL do certificado</label>
                  <input type="url" className={inputClass} value={item.url} onChange={(e) => updateItem('certificacoes', i, 'url', e.target.value)} />
                </div>
              </div>
            )}
          </SecaoDinamica>

          {/* Arquivo e visibilidade */}
          <CardSecao titulo="Arquivo e visibilidade" icone={<Eye size={18} />}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Link do arquivo do currículo (PDF)</label>
                <input type="url" className={inputClass} placeholder="https://…/meu-curriculo.pdf" value={dados.curriculo.arquivo_curriculo_url} onChange={(e) => setCampo('arquivo_curriculo_url', e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Cole aqui o link público do seu currículo em PDF, se tiver.</p>
              </div>
              <div>
                <label className={labelClass}>Visibilidade do perfil</label>
                <select className={inputClass} value={dados.curriculo.visibilidade_perfil} onChange={(e) => setCampo('visibilidade_perfil', e.target.value)}>
                  {VISIBILIDADE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Eye size={13} /> Público</span>
                  <span className="inline-flex items-center gap-1"><Users size={13} /> Membros</span>
                  <span className="inline-flex items-center gap-1"><Lock size={13} /> Privado</span>
                </div>
              </div>
            </div>
          </CardSecao>

          {/* LGPD */}
          <div className="rounded-2xl border border-accent/40 bg-accent/8 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <ShieldCheck size={18} /> Consentimento LGPD
            </p>
            <label className="mt-3 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                checked={dados.curriculo.lgpd_consentimento}
                onChange={(e) => setCampo('lgpd_consentimento', e.target.checked)}
              />
              <span className="text-sm leading-relaxed text-foreground">
                Autorizo o tratamento dos meus dados pessoais para fins de cadastro no Banco de Vagas e Currículos do Conexão Batista, conforme a <Link to="/consentimento-uso-dados" target="_blank" className="font-semibold text-primary underline">Política de Privacidade</Link>. Entendo que dados sensíveis (CPF, data de nascimento, endereço e pretensão salarial) serão protegidos e acessíveis apenas a mim e à administração. *
              </span>
            </label>
          </div>

          {/* Ações */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link to="/minha-conta" className="rounded-lg border border-border px-5 py-3 text-center font-display text-sm font-bold text-foreground hover:bg-muted">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {salvando ? <><Loader2 size={16} className="animate-spin" /> Salvando…</> : <><Save size={16} /> Salvar como rascunho</>}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function CardSecao({ titulo, icone, children }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">{icone}</span>
        <h2 className="font-display text-lg font-bold text-primary">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

function SecaoDinamica({ titulo, icone, onAdd, onRemove, itens, vazio, children }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">{icone}</span>
          <h2 className="font-display text-lg font-bold text-primary">{titulo}</h2>
        </div>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5">
          <Plus size={15} /> Adicionar
        </button>
      </div>

      {itens.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">{vazio}</p>
      ) : (
        <div className="space-y-4">
          {itens.map((item, i) => (
            <div key={item.id || i} className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">#{i + 1}</span>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} /> Remover
                </button>
              </div>
              {children(item, i)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Normalizadores de registros vindos do PocketBase.
function normalizeExp(r) {
  return {
    id: r.id,
    empresa: r.empresa || '',
    cargo: r.cargo || '',
    data_inicio: r.data_inicio || '',
    data_fim: r.data_fim || '',
    emprego_atual: !!r.emprego_atual,
    descricao: r.descricao || '',
    modalidade: r.modalidade || '',
  };
}
function normalizeForm(r) {
  return {
    id: r.id,
    instituicao: r.instituicao || '',
    curso: r.curso || '',
    grau: r.grau || '',
    data_inicio: r.data_inicio || '',
    data_conclusao: r.data_conclusao || '',
    status: r.status || '',
  };
}
function normalizeHab(r) {
  return { id: r.id, nome: r.nome || '', nivel: r.nivel || 'intermediario' };
}
function normalizeIdi(r) {
  return { id: r.id, idioma: r.idioma || '', nivel: r.nivel || 'intermediario' };
}
function normalizeCert(r) {
  return {
    id: r.id,
    curso: r.curso || '',
    instituicao: r.instituicao || '',
    data_conclusao: r.data_conclusao || '',
    url: r.url || '',
  };
}
