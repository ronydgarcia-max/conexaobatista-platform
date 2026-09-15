import UfCidadeFields from '@/components/UfCidadeFields.jsx';
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Save,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Eye,
  Lock,
  Ban,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';

const inputClass =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted/50 disabled:text-muted-foreground';
const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground';

const VISIBILIDADE = [
  { value: 'publico', label: 'Público (visível para todos)' },
  { value: 'membros', label: 'Apenas membros aprovados' },
  { value: 'privado', label: 'Privado (só eu e administradores)' },
];

// Controle de visibilidade nas áreas públicas do portal.
const VISIBILIDADE_PORTAL = [
  { value: 'privado', label: 'Privado (não aparece em áreas públicas)' },
  { value: 'publico', label: 'Público (aparece em áreas públicas do portal)' },
  { value: 'oculto', label: 'Oculto (visível apenas para a administração)' },
];

const CARGO_REPRESENTANTE = [
  { value: '', label: 'Selecione…' },
  { value: 'Pastor', label: 'Pastor' },
  { value: 'Presidente', label: 'Presidente' },
  { value: 'Responsável legal', label: 'Responsável legal' },
  { value: 'Secretário', label: 'Secretário' },
  { value: 'Diácono', label: 'Diácono' },
  { value: 'Outro', label: 'Outro' },
];

const NUM_FUNC = [
  { value: '', label: 'Selecione…' },
  { value: '1-10', label: '1 a 10' },
  { value: '11-50', label: '11 a 50' },
  { value: '51-100', label: '51 a 100' },
  { value: '101-500', label: '101 a 500' },
  { value: '500+', label: 'Mais de 500' },
];

// Situações cadastrais que impedem o prosseguimento do cadastro.
const SITUACOES_BLOQUEADAS = ['INAPTA', 'BAIXADA', 'SUSPENSA'];

// Versão e texto do termo de declaração de sócio/administrador autorizado.
const TERMO_VERSAO = '1.0';
const TERMO_TEXTO =
  'Declaro que sou sócio ou administrador autorizado desta empresa e que as informações fornecidas são verdadeiras.';

// Normaliza um nome para comparação: sem acentos, sem pontuação, sem
// maiúsculas/minúsculas e com espaços colapsados.
function normalizeName(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrai os nomes de sócios e administradores (QSA) do retorno da BrasilAPI.
function extrairNomesQsa(data) {
  const nomes = [];
  const qsa = Array.isArray(data?.qsa) ? data.qsa : [];
  qsa.forEach((item) => {
    if (item?.nome_socio) nomes.push(item.nome_socio);
    if (item?.nome) nomes.push(item.nome);
    if (item?.nome_representante_legal)
      nomes.push(item.nome_representante_legal);
  });
  return nomes.filter(Boolean);
}

// Compara o nome do usuário com os nomes do QSA (normalizados). Considera
// correspondência quando há igualdade exata ou quando um nome contém o outro
// (para tratar variações de composição como "da", "de", sobrenomes extras).
function compararQsa(nomeUsuario, nomesQsa) {
  const alvo = normalizeName(nomeUsuario);
  if (!alvo) return false;
  return nomesQsa.some((n) => {
    const candidato = normalizeName(n);
    if (!candidato) return false;
    return (
      candidato === alvo ||
      candidato.includes(alvo) ||
      alvo.includes(candidato)
    );
  });
}

// Calcula o hash SHA-256 (hex) de uma string usando a Web Crypto API.
async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constrói a lista de QSA (quadro de sócios e administradores) a partir do
// retorno da BrasilAPI, normalizando os campos para nome, documento, cargo e
// período. Não inventa dados: apenas repassa o que a API retornou.
function construirQsa(data) {
  const qsa = Array.isArray(data?.qsa) ? data.qsa : [];
  return qsa
    .map((item) => {
      const nome = item?.nome_socio || item?.nome || item?.nome_representante_legal || '';
      if (!nome) return null;
      const documento =
        item?.cnpj_cpf_do_socio || item?.cpf_cnpj_socio || '';
      const cargo =
        item?.qualificacao_socio ||
        item?.qual_descricao_socio ||
        item?.qualificacao ||
        '';
      const periodo =
        item?.data_entrada_sociedade || item?.data_entrada || '';
      return {
        nome,
        documento: documento || '',
        cargo: cargo || '',
        data_inicio: periodo || '',
        data_fim: item?.data_saida || '',
      };
    })
    .filter(Boolean);
}

const EMPTY_EMPRESA = {
  tipo: 'empresa',
  cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  tipo_empresa: '',
  data_abertura: '',
  situacao_cadastral: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  telefone: '',
  email: '',
  website: '',
  descricao: '',
  ramo_atividade: '',
  numero_funcionarios: '',
  visibilidade_perfil: 'membros',
  visibilidade: 'privado',
  // Campos específicos de igreja (BrasilAPI / Receita Federal)
  cnae_principal_codigo: '',
  cnae_principal_descricao: '',
  cnaes_secundarios: [],
  natureza_juridica_codigo: '',
  natureza_juridica_descricao: '',
  qsa: [],
  cargo_representante: '',
  fonte_dados: '',
  lgpd_consentimento: false,
  status: 'rascunho',
};

// Normaliza o CNPJ exibido (XX.XXX.XXX/XXXX-XX) mantendo só dígitos no estado.
function formatCnpj(value) {
  const d = (value || '').replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export default function EmpresaFormPage() {
  const { currentUser, isAuthenticated } = useSubscriptionAuth();
  const navigate = useNavigate();

  const [empresaId, setEmpresaId] = useState(null);
  const [dados, setDados] = useState(EMPTY_EMPRESA);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [erroCnpj, setErroCnpj] = useState('');
  const [sucessoCnpj, setSucessoCnpj] = useState('');
  const [bloqueada, setBloqueada] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [qsaNomes, setQsaNomes] = useState([]);
  const [qsaVerificado, setQsaVerificado] = useState(false);
  const [qsaCorrespondente, setQsaCorrespondente] = useState(false);
  const [qsaErro, setQsaErro] = useState('');
  const [declaracaoAceita, setDeclaracaoAceita] = useState(false);

  const setCampo = (campo, valor) =>
    setDados((prev) => ({ ...prev, [campo]: valor }));

  // Carrega registro existente do usuário (se houver).
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/minha-conta/empresa', { replace: true });
      return;
    }
    if (!currentUser) return;

    let cancelado = false;
    (async () => {
      try {
        const rec = await pb
          .collection('empresas')
          .getFirstListItem(`usuario_id = "${currentUser.id}"`)
          .catch(() => null);

        if (cancelado || !rec) return;
        setEmpresaId(rec.id);
        setDados({
          tipo: rec.tipo || 'empresa',
          cnpj: rec.cnpj || '',
          razao_social: rec.razao_social || '',
          nome_fantasia: rec.nome_fantasia || '',
          tipo_empresa: rec.tipo_empresa || '',
          data_abertura: rec.data_abertura || '',
          situacao_cadastral: rec.situacao_cadastral || '',
          logradouro: rec.logradouro || '',
          numero: rec.numero || '',
          complemento: rec.complemento || '',
          bairro: rec.bairro || '',
          cidade: rec.cidade || '',
          estado: rec.estado || '',
          cep: rec.cep || '',
          telefone: rec.telefone || '',
          email: rec.email || '',
          website: rec.website || '',
          descricao: rec.descricao || '',
          ramo_atividade: rec.ramo_atividade || '',
          numero_funcionarios: rec.numero_funcionarios || '',
          visibilidade_perfil: rec.visibilidade_perfil || 'membros',
          visibilidade: rec.visibilidade || 'privado',
          cnae_principal_codigo: rec.cnae_principal_codigo || '',
          cnae_principal_descricao: rec.cnae_principal_descricao || '',
          cnaes_secundarios: Array.isArray(rec.cnaes_secundarios) ? rec.cnaes_secundarios : [],
          natureza_juridica_codigo: rec.natureza_juridica_codigo || '',
          natureza_juridica_descricao: rec.natureza_juridica_descricao || '',
          qsa: Array.isArray(rec.qsa) ? rec.qsa : [],
          cargo_representante: rec.cargo_representante || '',
          fonte_dados: rec.fonte_dados || '',
          lgpd_consentimento: !!rec.lgpd_consentimento,
          status: rec.status || 'rascunho',
        });

        // Se já existe uma declaração de integridade registrada para este
        // usuário + CNPJ, restaura o estado de confirmação para permitir a
        // edição sem exigir nova consulta/declaração.
        if (rec.cnpj) {
          const conf = await pb
            .collection('confirmacoes_empresa')
            .getFirstListItem(
              `usuario_id = "${currentUser.id}" && cnpj = "${rec.cnpj}"`,
            )
            .catch(() => null);
          if (!cancelado && conf) {
            setQsaVerificado(true);
            setQsaCorrespondente(true);
            setDeclaracaoAceita(true);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar empresa:', e);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, currentUser, navigate]);

  // Consulta automática quando o CNPJ atinge 14 dígitos.
  const consultarCnpj = async (cnpjDigits) => {
    setErroCnpj('');
    setSucessoCnpj('');
    setBloqueada(false);
    setQsaNomes([]);
    setQsaVerificado(false);
    setQsaCorrespondente(false);
    setQsaErro('');
    setDeclaracaoAceita(false);

    if (cnpjDigits.length !== 14) {
      setErroCnpj('CNPJ deve conter 14 dígitos.');
      return;
    }

    setConsultando(true);
    try {
      const resp = await apiServerClient.fetch(`/cnpj/${cnpjDigits}`);
      const body = await resp.json().catch(() => ({}));

      if (resp.status === 404) {
        setErroCnpj(
          body?.error || 'CNPJ não encontrado na base da Receita Federal.',
        );
        return;
      }
      if (resp.status === 422) {
        setErroCnpj(body?.error || 'CNPJ inválido (formato incorreto).');
        return;
      }
      if (!resp.ok) {
        setErroCnpj(
          'Não foi possível consultar o CNPJ agora. A BrasilAPI está indisponível — tente novamente em instantes.',
        );
        return;
      }

      const situacao = (body.descricao_situacao_cadastral || '').toUpperCase().trim();

      // Preenche os campos retornados pela Receita (editáveis a seguir).
      const cnaesSec = Array.isArray(body.cnaes_secundarios)
        ? body.cnaes_secundarios.map((c) => ({
            codigo: c?.codigo || '',
            descricao: c?.descricao || '',
          }))
        : [];
      setDados((prev) => ({
        ...prev,
        cnpj: cnpjDigits,
        razao_social: body.razao_social || prev.razao_social,
        nome_fantasia: body.nome_fantasia || prev.nome_fantasia,
        tipo_empresa:
          body.natureza_juridica || body.porte || prev.tipo_empresa,
        data_abertura: body.data_inicio_atividade || prev.data_abertura,
        situacao_cadastral: body.descricao_situacao_cadastral || '',
        logradouro: body.logradouro || prev.logradouro,
        numero: body.numero || prev.numero,
        complemento: body.complemento || prev.complemento,
        bairro: body.bairro || prev.bairro,
        cidade: body.municipio || prev.cidade,
        estado: body.uf || prev.estado,
        cep: body.cep ? body.cep.replace(/\D/g, '') : prev.cep,
        telefone: body.ddd_telefone_1 || body.ddd_telefone_2 || prev.telefone,
        email: body.email || prev.email,
        // Dados econômicos/jurídicos da Receita (BrasilAPI) — não inventados.
        cnae_principal_codigo: body.cnae_fiscal || prev.cnae_principal_codigo,
        cnae_principal_descricao:
          body.cnae_fiscal_descricao || prev.cnae_principal_descricao,
        cnaes_secundarios: cnaesSec.length ? cnaesSec : prev.cnaes_secundarios,
        natureza_juridica_codigo: body.codigo_natureza_juridica
          ? String(body.codigo_natureza_juridica).slice(0, 20)
          : prev.natureza_juridica_codigo,
        natureza_juridica_descricao:
          body.natureza_juridica || body.natureza_juridica_descricao || prev.natureza_juridica_descricao,
        qsa: construirQsa(body).length ? construirQsa(body) : prev.qsa,
        fonte_dados: 'BrasilAPI',
      }));

      if (SITUACOES_BLOQUEADAS.includes(situacao)) {
        setBloqueada(true);
        setErroCnpj(
          `Situação cadastral "${situacao}" — esta empresa não pode ser cadastrada no portal. Só permitimos empresas ATIVAS.`,
        );
        return;
      }

      // Validação de QSA: compara o nome do usuário autenticado com os
      // sócios/administradores retornados pela BrasilAPI (normalizado).
      const nomesQsa = extrairNomesQsa(body);
      setQsaNomes(nomesQsa);
      setQsaVerificado(true);

      const nomeUsuario = currentUser?.name || '';
      const corresponde = compararQsa(nomeUsuario, nomesQsa);

      if (!corresponde) {
        setQsaCorrespondente(false);
        setQsaErro(
          `Não identificamos seu nome ("${nomeUsuario}") na lista de sócios e administradores (QSA) deste CNPJ. Apenas sócios ou administradores autorizados podem cadastrar a empresa. Se houver divergência, atualize seu nome em "Minha conta" ou entre em contato com a administração.`,
        );
        setSucessoCnpj(
          situacao
            ? `Dados encontrados. Situação cadastral: ${situacao}.`
            : 'Dados encontrados.',
        );
        return;
      }

      setQsaCorrespondente(true);
      setSucessoCnpj(
        situacao
          ? `Dados encontrados. Situação cadastral: ${situacao}. Identificamos seu nome no QSA da empresa. Revise as informações e confirme a declaração antes de salvar.`
          : 'Dados encontrados. Identificamos seu nome no QSA da empresa. Revise as informações e confirme a declaração antes de salvar.',
      );
    } catch (e) {
      console.error('Erro na consulta de CNPJ:', e);
      setErroCnpj(
        'Não foi possível consultar o CNPJ agora. Tente novamente em instantes.',
      );
    } finally {
      setConsultando(false);
    }
  };

  const onCnpjChange = (e) => {
    const formatado = formatCnpj(e.target.value);
    const digits = formatado.replace(/\D/g, '');
    setCampo('cnpj', digits);
    setErroCnpj('');
    setSucessoCnpj('');
    setBloqueada(false);
    setQsaNomes([]);
    setQsaVerificado(false);
    setQsaCorrespondente(false);
    setQsaErro('');
    setDeclaracaoAceita(false);
    if (digits.length === 14) {
      consultarCnpj(digits);
    }
  };

  const validar = () => {
    if (!dados.razao_social.trim()) {
      setErroSalvar('Informe a razão social da empresa.');
      return false;
    }
    if (!dados.cnpj || dados.cnpj.length !== 14) {
      setErroSalvar('Informe um CNPJ válido de 14 dígitos.');
      return false;
    }
    if (bloqueada) {
      setErroSalvar(
        'Não é possível salvar: a situação cadastral da empresa está bloqueada.',
      );
      return false;
    }
    if (!qsaVerificado) {
      setErroSalvar(
        'É necessário consultar o CNPJ para validar os sócios e administradores (QSA) antes de salvar.',
      );
      return false;
    }
    if (!qsaCorrespondente) {
      setErroSalvar(
        'Não foi possível confirmar que você é sócio ou administrador desta empresa (QSA). Apenas pessoas identificadas no QSA podem concluir o cadastro.',
      );
      return false;
    }
    if (!declaracaoAceita) {
      setErroSalvar(
        'É obrigatório marcar a declaração de sócio ou administrador autorizado para concluir o cadastro.',
      );
      return false;
    }
    if (!dados.lgpd_consentimento) {
      setErroSalvar('É necessário aceitar o consentimento LGPD para salvar.');
      return false;
    }
    if (dados.tipo === 'igreja' && !dados.cargo_representante) {
      setErroSalvar(
        'Para cadastros de igreja, informe o cargo do representante responsável.',
      );
      return false;
    }
    setErroSalvar('');
    return true;
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    setSalvo(false);
    try {
      // Registro de integridade: data/hora atual é gerada antes do hash para
      // garantir que o hash inclua exatamente o mesmo valor armazenado.
      const dataHora = new Date().toISOString();
      const hashInput = `${currentUser.id}|${dados.cnpj}|${dataHora}|${TERMO_TEXTO}`;
      const hash = await sha256Hex(hashInput);

      const payload = {
        usuario_id: currentUser.id,
        tipo: dados.tipo || 'empresa',
        cnpj: dados.cnpj,
        razao_social: dados.razao_social,
        nome_fantasia: dados.nome_fantasia,
        tipo_empresa: dados.tipo_empresa,
        data_abertura: dados.data_abertura || null,
        situacao_cadastral: dados.situacao_cadastral,
        logradouro: dados.logradouro,
        numero: dados.numero,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        cep: dados.cep,
        telefone: dados.telefone,
        email: dados.email || null,
        website: dados.website || null,
        descricao: dados.descricao,
        ramo_atividade: dados.ramo_atividade,
        numero_funcionarios: dados.numero_funcionarios,
        visibilidade_perfil: dados.visibilidade_perfil || 'membros',
        visibilidade: dados.visibilidade || 'privado',
        cnae_principal_codigo: dados.cnae_principal_codigo || null,
        cnae_principal_descricao: dados.cnae_principal_descricao || null,
        cnaes_secundarios: dados.cnaes_secundarios || [],
        natureza_juridica_codigo: (dados.natureza_juridica_codigo || '').slice(0, 20) || null,
        natureza_juridica_descricao: dados.natureza_juridica_descricao || null,
        qsa: dados.qsa || [],
        cargo_representante: dados.cargo_representante || null,
        fonte_dados: dados.fonte_dados || null,
        lgpd_consentimento: true,
        status: 'rascunho',
        status_aprovacao: 'aguardando_aprovacao',
      };

      if (empresaId) {
        await pb.collection('empresas').update(empresaId, payload);
      } else {
        const created = await pb.collection('empresas').create(payload);
        setEmpresaId(created.id);
      }

      // Registra a declaração de integridade. Se já existir um registro para
      // este usuário + CNPJ, atualiza; caso contrário, cria um novo.
      const confirmacaoPayload = {
        usuario_id: currentUser.id,
        cnpj: dados.cnpj,
        data_hora: dataHora,
        versao_termo: TERMO_VERSAO,
        texto_termo: TERMO_TEXTO,
        hash_sha256: hash,
      };
      const existente = await pb
        .collection('confirmacoes_empresa')
        .getFirstListItem(
          `usuario_id = "${currentUser.id}" && cnpj = "${dados.cnpj}"`,
        )
        .catch(() => null);
      if (existente) {
        await pb
          .collection('confirmacoes_empresa')
          .update(existente.id, confirmacaoPayload);
      } else {
        await pb.collection('confirmacoes_empresa').create(confirmacaoPayload);
      }

      setSalvo(true);
    } catch (e) {
      console.error('Erro ao salvar empresa:', e);
      setErroSalvar(
        e?.response?.message ||
          'Não foi possível salvar agora. Verifique os campos e tente novamente.',
      );
    } finally {
      setSalvando(false);
    }
  };

  if (!isAuthenticated || !currentUser) return null;

  if (carregando) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Loader2 className="mx-auto animate-spin text-primary" size={28} />
        <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>
      </section>
    );
  }

  return (
    <>
      <Helmet>
        <title>{dados.tipo === 'igreja' ? 'Cadastrar minha igreja' : 'Cadastrar minha empresa'} | Conexão Batista</title>
        <meta
          name="description"
          content="Cadastre sua empresa ou igreja no Conexão Batista com consulta automática de CNPJ via BrasilAPI."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
        <Link
          to="/minha-conta"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft size={16} /> Voltar para Minha conta
        </Link>

        <div className="page-centered mt-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/8 text-primary">
            <Building2 size={26} strokeWidth={1.8} />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-accent">
            Conclusão de perfil
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">
            {dados.tipo === 'igreja' ? 'Cadastrar minha igreja' : 'Cadastrar minha empresa'}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Informe o CNPJ para buscar os dados cadastrais automaticamente na
            BrasilAPI. Validaremos se você consta como sócio ou administrador
            (QSA) antes de permitir o cadastro. Você poderá revisar tudo antes
            de enviar para aprovação.
          </p>
        </div>

        <form onSubmit={salvar} className="mt-10 space-y-6 text-left">
          {/* Consulta de CNPJ */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                <Search size={18} />
              </span>
              <h2 className="font-display text-lg font-bold text-primary">
                Consulta de CNPJ
              </h2>
            </div>

            <label className={labelClass}>CNPJ *</label>
            <div className="relative">
              <input
                inputMode="numeric"
                className={inputClass}
                placeholder="00.000.000/0000-00"
                value={formatCnpj(dados.cnpj)}
                onChange={onCnpjChange}
                disabled={consultando}
              />
              {consultando && (
                <Loader2
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary"
                />
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              A consulta acontece automaticamente ao digitar os 14 dígitos.
            </p>

            {/* Mensagens de consulta */}
            {sucessoCnpj && !bloqueada && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>{sucessoCnpj}</span>
              </div>
            )}
            {erroCnpj && (
              <div
                className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  bloqueada
                    ? 'border border-red-300 bg-red-50 text-red-800'
                    : 'border border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {bloqueada ? (
                  <Ban size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                )}
                <span>{erroCnpj}</span>
              </div>
            )}
            {bloqueada && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2.5 text-xs font-semibold text-red-800">
                Prosseguimento bloqueado: a situação cadastral impede o cadastro
                desta empresa no portal.
              </div>
            )}

            {/* Validação de QSA: sócios e administradores */}
            {qsaVerificado && qsaCorrespondente && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>
                  Identificamos seu nome na lista de sócios e administradores
                  (QSA) desta empresa. Você pode prosseguir com o cadastro.
                </span>
              </div>
            )}
            {qsaErro && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                <Ban size={18} className="mt-0.5 shrink-0" />
                <span>{qsaErro}</span>
              </div>
            )}
            {qsaVerificado && qsaNomes.length > 0 && (
              <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Sócios e administradores (QSA):
                </span>{' '}
                {qsaNomes.join(' · ')}
              </div>
            )}
          </div>

          {/* Dados cadastrais */}
          <CardSecao titulo="Dados cadastrais" icone={<Building2 size={18} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Razão social *</label>
                <input
                  className={inputClass}
                  value={dados.razao_social}
                  onChange={(e) => setCampo('razao_social', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome fantasia</label>
                <input
                  className={inputClass}
                  value={dados.nome_fantasia}
                  onChange={(e) => setCampo('nome_fantasia', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Tipo / natureza jurídica</label>
                <input
                  className={inputClass}
                  value={dados.tipo_empresa}
                  onChange={(e) => setCampo('tipo_empresa', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Data de abertura</label>
                <input
                  type="date"
                  className={inputClass}
                  value={dados.data_abertura || ''}
                  onChange={(e) => setCampo('data_abertura', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Situação cadastral</label>
                <input
                  className={inputClass}
                  value={dados.situacao_cadastral}
                  onChange={(e) =>
                    setCampo('situacao_cadastral', e.target.value)
                  }
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Empresas com situação INAPTA, BAIXADA ou SUSPENSA não podem ser
                  cadastradas.
                </p>
              </div>
            </div>
          </CardSecao>

          {/* Campos específicos de Igreja (atividade econômica, natureza jurídica, QSA) */}
          {dados.tipo === 'igreja' && (
            <CardSecao titulo="Dados da igreja (Receita Federal)" icone={<ShieldCheck size={18} />}>
              {dados.fonte_dados && (
                <p className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <CheckCircle2 size={13} className="text-green-600" />
                  Fonte dos dados: {dados.fonte_dados}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Atividade econômica principal — código</label>
                  <input
                    className={inputClass}
                    value={dados.cnae_principal_codigo}
                    onChange={(e) => setCampo('cnae_principal_codigo', e.target.value)}
                    placeholder="Ex.: 9491-0/00"
                  />
                </div>
                <div>
                  <label className={labelClass}>Atividade econômica principal — descrição</label>
                  <input
                    className={inputClass}
                    value={dados.cnae_principal_descricao}
                    onChange={(e) => setCampo('cnae_principal_descricao', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Atividades econômicas secundárias</label>
                  {dados.cnaes_secundarios.length > 0 ? (
                    <ul className="space-y-1.5 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                      {dados.cnaes_secundarios.map((c, i) => (
                        <li key={i} className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                            {c.codigo || '—'}
                          </span>
                          <span className="text-foreground">{c.descricao || '—'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                      Nenhuma atividade secundária retornada pela BrasilAPI para este CNPJ.
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Natureza jurídica — código</label>
                  <input
                    className={inputClass}
                    value={dados.natureza_juridica_codigo}
                    onChange={(e) => setCampo('natureza_juridica_codigo', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Natureza jurídica — descrição</label>
                  <input
                    className={inputClass}
                    value={dados.natureza_juridica_descricao}
                    onChange={(e) => setCampo('natureza_juridica_descricao', e.target.value)}
                  />
                </div>
              </div>

              {/* QSA — quadro de sócios e administradores */}
              <div className="mt-5">
                <label className={labelClass}>QSA — Quadro de sócios e administradores</label>
                {dados.qsa.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-bold">Nome</th>
                          <th className="hidden px-3 py-2 font-bold sm:table-cell">Documento</th>
                          <th className="px-3 py-2 font-bold">Função / cargo</th>
                          <th className="hidden px-3 py-2 font-bold sm:table-cell">Período</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {dados.qsa.map((p, i) => {
                          const isRep = compararQsa(currentUser?.name, [p.nome]);
                          return (
                            <tr key={i} className={isRep ? 'bg-accent/10' : ''}>
                              <td className="px-3 py-2 font-semibold text-foreground">
                                {p.nome}
                                {isRep && (
                                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">
                                    <CheckCircle2 size={11} /> Você
                                  </span>
                                )}
                              </td>
                              <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                                {p.documento || '—'}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{p.cargo || '—'}</td>
                              <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                                {p.data_inicio || '—'}
                                {p.data_fim ? ` até ${p.data_fim}` : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    Nenhum sócio ou administrador retornado pela BrasilAPI para este CNPJ.
                  </p>
                )}
              </div>

              {/* Cargo do representante responsável pelo cadastro */}
              <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3.5">
                <label className={labelClass}>Cargo do representante responsável pelo cadastro *</label>
                <select
                  className={inputClass}
                  value={dados.cargo_representante}
                  onChange={(e) => setCampo('cargo_representante', e.target.value)}
                >
                  {CARGO_REPRESENTANTE.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  Informe o cargo correto do responsável por este cadastro. Não
                  presumimos que seja pastor — pode ser Presidente, Responsável
                  legal, Secretário, etc. O nome do responsável é o do usuário
                  autenticado ({currentUser?.name || '—'}).
                </p>
              </div>
            </CardSecao>
          )}

          {/* Endereço */}
          <CardSecao titulo="Endereço" icone={<ShieldCheck size={18} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Logradouro</label>
                <input
                  className={inputClass}
                  value={dados.logradouro}
                  onChange={(e) => setCampo('logradouro', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Número</label>
                <input
                  className={inputClass}
                  value={dados.numero}
                  onChange={(e) => setCampo('numero', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Complemento</label>
                <input
                  className={inputClass}
                  placeholder="Sala, andar, bloco…"
                  value={dados.complemento}
                  onChange={(e) => setCampo('complemento', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Bairro</label>
                <input
                  className={inputClass}
                  value={dados.bairro}
                  onChange={(e) => setCampo('bairro', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>CEP</label>
                <input
                  className={inputClass}
                  value={dados.cep}
                  onChange={(e) => setCampo('cep', e.target.value)}
                />
              </div>
              <UfCidadeFields
                className="sm:col-span-2 grid gap-4 sm:grid-cols-2"
                labelClass={labelClass}
                inputClass={inputClass}
                uf={dados.estado}
                cidade={dados.cidade}
                onChangeUf={(v) => setCampo('estado', v)}
                onChangeCidade={(v) => setCampo('cidade', v)}
              />
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                <Lock size={12} className="mr-1 inline" />
                O endereço completo é protegido e visível apenas para você e a
                administração do portal.
              </p>
            </div>
          </CardSecao>

          {/* Contato e descrição */}
          <CardSecao titulo="Contato e descrição" icone={<Eye size={18} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Telefone</label>
                <input
                  className={inputClass}
                  value={dados.telefone}
                  onChange={(e) => setCampo('telefone', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>E-mail</label>
                <input
                  type="email"
                  className={inputClass}
                  value={dados.email}
                  onChange={(e) => setCampo('email', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://suaempresa.com.br"
                  value={dados.website}
                  onChange={(e) => setCampo('website', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Ramo de atividade</label>
                <input
                  className={inputClass}
                  placeholder="Ex.: Alimentação, Construção…"
                  value={dados.ramo_atividade}
                  onChange={(e) => setCampo('ramo_atividade', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Número de funcionários</label>
                <select
                  className={inputClass}
                  value={dados.numero_funcionarios}
                  onChange={(e) =>
                    setCampo('numero_funcionarios', e.target.value)
                  }
                >
                  {NUM_FUNC.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descrição</label>
                <textarea
                  rows={4}
                  className={inputClass}
                  placeholder="Conte um pouco sobre sua empresa…"
                  value={dados.descricao}
                  onChange={(e) => setCampo('descricao', e.target.value)}
                />
              </div>
            </div>
          </CardSecao>

          {/* Visibilidade e LGPD */}
          <CardSecao titulo="Visibilidade e LGPD" icone={<ShieldCheck size={18} />}>
            <div className="grid gap-4">
              <div>
                <label className={labelClass}>Visibilidade do perfil</label>
                <select
                  className={inputClass}
                  value={dados.visibilidade_perfil}
                  onChange={(e) =>
                    setCampo('visibilidade_perfil', e.target.value)
                  }
                >
                  {VISIBILIDADE.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Visibilidade nas áreas públicas do portal</label>
                <select
                  className={inputClass}
                  value={dados.visibilidade}
                  onChange={(e) => setCampo('visibilidade', e.target.value)}
                >
                  {VISIBILIDADE_PORTAL.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Apenas cadastros <strong>Público</strong> aparecem nas áreas
                  públicas do portal. <strong>Oculto</strong> é visível apenas
                  para a administração.
                </p>
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                  checked={dados.lgpd_consentimento}
                  onChange={(e) =>
                    setCampo('lgpd_consentimento', e.target.checked)
                  }
                />
                <span className="leading-relaxed text-muted-foreground">
                  Autorizo o tratamento dos dados desta empresa conforme a LGPD,
                  para divulgação dentro do portal Conexão Batista. Dados
                  sensíveis (CNPJ e endereço completo) ficam protegidos e visíveis
                  apenas para mim e a administração.
                </span>
              </label>

              {/* Declaração obrigatória de sócio/administrador — exibida apenas
                  quando houver correspondência no QSA. */}
              {qsaVerificado && qsaCorrespondente && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3.5">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                      checked={declaracaoAceita}
                      onChange={(e) => setDeclaracaoAceita(e.target.checked)}
                    />
                    <span className="font-semibold leading-relaxed text-foreground">
                      {TERMO_TEXTO}
                    </span>
                  </label>
                  <p className="mt-2 pl-7 text-xs text-muted-foreground">
                    Termo versão {TERMO_VERSAO}. Ao marcar esta declaração, seu
                    nome, CNPJ, data/hora e o texto do termo serão registrados
                    com um hash SHA-256 para preservar a integridade do registro.
                  </p>
                </div>
              )}
            </div>
          </CardSecao>

          {/* Erro / sucesso de salvamento */}
          {erroSalvar && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{erroSalvar}</span>
            </div>
          )}
          {salvo && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>
                Empresa salva com status <strong>“Aguardando aprovação”</strong>. A administração do portal irá analisar o cadastro antes da publicação. Você pode editar as informações quando quiser.
              </span>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/minha-conta"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={salvando || bloqueada || (qsaVerificado && !qsaCorrespondente)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Enviar para aprovação
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function CardSecao({ titulo, icone, children }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
          {icone}
        </span>
        <h2 className="font-display text-lg font-bold text-primary">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}
