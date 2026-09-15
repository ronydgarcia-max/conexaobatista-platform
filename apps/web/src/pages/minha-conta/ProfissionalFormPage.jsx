import UfCidadeFields from '@/components/UfCidadeFields.jsx';
import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ArrowLeft,
  Save,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Image as ImageIcon,
  Clock,
  XCircle,
  PauseCircle,
  CalendarClock,
  Truck,
  Stethoscope,
  Award,
  BadgeDollarSign,
  CreditCard,
  Sparkles,
  Lightbulb,
  Send,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';

const inputClass =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted/50 disabled:text-muted-foreground';
const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground';

const STATUS_OPCOES = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
];

const APROVACAO = {
  aguardando_analise: {
    label: 'Aguardando análise',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/40',
  },
  aprovado: {
    label: 'Aprovado',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  nao_aprovado: {
    label: 'Não aprovado',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  suspenso: {
    label: 'Suspenso',
    icon: PauseCircle,
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const MAX_FOTOS = 6;
const MAX_SERVICOS = 5;
const MAX_PROFISSOES = 5;

const EMPTY_SERVICO = {
  profissao: '',
  profissoes_ids: [],
  descricao_servicos: '',
  cidade: '',
  estado: '',
  telefone_whatsapp: '',
  status: 'ativo',
  tipos_atendimento: [],
  leva_traz: 'nao',
  distancia_maxima_km: '',
  horario_segunda_inicio: '',
  horario_segunda_fim: '',
  horario_terca_inicio: '',
  horario_terca_fim: '',
  horario_quarta_inicio: '',
  horario_quarta_fim: '',
  horario_quinta_inicio: '',
  horario_quinta_fim: '',
  horario_sexta_inicio: '',
  horario_sexta_fim: '',
  horario_sabado_inicio: '',
  horario_sabado_fim: '',
  horario_domingo_inicio: '',
  horario_domingo_fim: '',
  atende_feriados: 'nao',
  atende_emergencias: 'nao',
  horario_emergencia_inicio: '',
  horario_emergencia_fim: '',
  // Informações profissionais
  anos_experiencia: '',
  certificacoes: [],
  curso_tecnico: 'nao',
  mei: 'nao',
  emissao_nota_fiscal: 'nao',
  materiais_proprios: 'nao',
  // Forma de cobrança
  forma_cobranca: '',
  forma_cobranca_outro: '',
  // Faixa de preço
  preco_minimo: '',
  preco_maximo: '',
  // Formas de pagamento
  formas_pagamento: [],
  // Opções de pagamento
  parcelamento: 'nao',
  parcelas_maximas: '',
  orcamento_gratuito: 'nao',
  desconto_membros_igreja: 'nao',
  percentual_desconto: '',
  // Diferenciais
  diferenciais: [],
};

const TIPOS_ATENDIMENTO_OPCOES = [
  { value: 'estabelecimento', label: 'No estabelecimento' },
  { value: 'domicilio', label: 'Em domicílio' },
  { value: 'online', label: 'Online/remoto' },
  { value: 'hora_marcada', label: 'Por hora marcada' },
  { value: 'ordem_chegada', label: 'Por ordem de chegada' },
];

const DIAS_SEMANA = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

const SIM_NAO_OPCOES = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
];

const FORMA_COBRANCA_OPCOES = [
  { value: 'hora', label: 'Por hora' },
  { value: 'projeto', label: 'Projeto / serviço completo' },
  { value: 'valor_fixo', label: 'Valor fixo' },
  { value: 'outro', label: 'Outro' },
];

const FORMAS_PAGAMENTO_OPCOES = [
  { value: 'pix', label: 'Pix' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
  { value: 'cartao_debito', label: 'Cartão de débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência bancária' },
];

const DIFERENCIAIS_OPCOES = [
  { value: 'idosos', label: 'Atendimento a idosos' },
  { value: 'criancas', label: 'Atendimento a crianças' },
  { value: 'eventos_igreja', label: 'Experiência com eventos da igreja' },
  { value: 'libras', label: 'Libras' },
  { value: 'acessibilidade', label: 'Acessibilidade' },
  { value: 'trabalho_equipe', label: 'Trabalho em equipe' },
];

export default function ProfissionalFormPage() {
  const { currentUser, isAuthenticated } = useSubscriptionAuth();
  const navigate = useNavigate();

  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLoad, setErroLoad] = useState('');

  // Form state
  const [modo, setModo] = useState('lista'); // 'lista' | 'novo' | 'editar'
  const [editandoId, setEditandoId] = useState(null);
  const [dados, setDados] = useState(EMPTY_SERVICO);
  const [fotosNovas, setFotosNovas] = useState([]); // File[]
  const [fotosExistentes, setFotosExistentes] = useState([]); // string[] nomes
  const [fotosRemover, setFotosRemover] = useState([]); // string[] nomes a remover
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [novaCertificacao, setNovaCertificacao] = useState('');
  const fileInputRef = useRef(null);

  // Lista de profissões ativas (catálogo administrativo) para seleção.
  const [profissoesCatalogo, setProfissoesCatalogo] = useState([]);
  const [carregandoProfissoes, setCarregandoProfissoes] = useState(true);

  // Categorias ativas (catálogo administrativo) para o filtro em duas etapas.
  const [categoriasCatalogo, setCategoriasCatalogo] = useState([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  // Categoria atualmente selecionada no filtro (apenas UI, não persistida).
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');

  // Modal de sugestão de nova categoria/profissão.
  const [modalSugestao, setModalSugestao] = useState(null); // null | { tipo, nome, descricao, categoria_relacionada }
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [erroSugestao, setErroSugestao] = useState('');
  const [sucessoSugestao, setSucessoSugestao] = useState('');

  const setCampo = (campo, valor) =>
    setDados((prev) => ({ ...prev, [campo]: valor }));

  const toggleTipoAtendimento = (value) =>
    setDados((prev) => {
      const atuais = Array.isArray(prev.tipos_atendimento) ? prev.tipos_atendimento : [];
      return {
        ...prev,
        tipos_atendimento: atuais.includes(value)
          ? atuais.filter((v) => v !== value)
          : [...atuais, value],
      };
    });

  const toggleArray = (campo, value) =>
    setDados((prev) => {
      const atuais = Array.isArray(prev[campo]) ? prev[campo] : [];
      return {
        ...prev,
        [campo]: atuais.includes(value)
          ? atuais.filter((v) => v !== value)
          : [...atuais, value],
      };
    });

  // Alterna a seleção de uma profissão do catálogo, respeitando o limite de 5.
  const toggleProfissaoId = (id) =>
    setDados((prev) => {
      const atuais = Array.isArray(prev.profissoes_ids) ? prev.profissoes_ids : [];
      if (atuais.includes(id)) {
        return { ...prev, profissoes_ids: atuais.filter((v) => v !== id) };
      }
      if (atuais.length >= MAX_PROFISSOES) return prev;
      return { ...prev, profissoes_ids: [...atuais, id] };
    });

  const addCertificacao = (texto) => {
    const limpo = (texto || '').trim();
    if (!limpo) return;
    setDados((prev) => {
      const atuais = Array.isArray(prev.certificacoes) ? prev.certificacoes : [];
      if (atuais.some((c) => c.toLowerCase() === limpo.toLowerCase())) return prev;
      return { ...prev, certificacoes: [...atuais, limpo] };
    });
  };

  const removeCertificacao = (idx) =>
    setDados((prev) => ({
      ...prev,
      certificacoes: (Array.isArray(prev.certificacoes) ? prev.certificacoes : []).filter((_, i) => i !== idx),
    }));

  const setCampoSugestao = (campo, valor) =>
    setModalSugestao((prev) => (prev ? { ...prev, [campo]: valor } : prev));

  const enviarSugestao = async (e) => {
    e.preventDefault();
    if (!modalSugestao) return;
    if (!modalSugestao.nome.trim()) {
      setErroSugestao('Informe o nome da categoria ou profissão sugerida.');
      return;
    }
    if (modalSugestao.tipo === 'profissao' && !modalSugestao.categoria_relacionada) {
      setErroSugestao('Selecione a categoria relacionada à profissão sugerida.');
      return;
    }
    setEnviandoSugestao(true);
    setErroSugestao('');
    try {
      await pb.collection('sugestoes_profissoes').create({
        usuario_id: currentUser.id,
        tipo: modalSugestao.tipo,
        nome: modalSugestao.nome.trim(),
        descricao: (modalSugestao.descricao || '').trim(),
        categoria_relacionada:
          modalSugestao.tipo === 'profissao' ? modalSugestao.categoria_relacionada : '',
      });
      setSucessoSugestao('Sua sugestão foi enviada para análise da administração. Obrigado!');
      setModalSugestao(null);
    } catch (err) {
      setErroSugestao(
        err?.response?.message ||
          'Não foi possível enviar a sugestão agora. Tente novamente.',
      );
    } finally {
      setEnviandoSugestao(false);
    }
  };

  // Carrega profissões ativas do catálogo administrativo.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const lista = await pb
          .collection('profissoes')
          .getFullList({
            filter: 'ativo = true',
            sort: 'nome',
            expand: 'categoria_id',
          });
        if (!cancelado) setProfissoesCatalogo(lista);
      } catch (e) {
        console.error('Erro ao carregar profissões:', e);
      } finally {
        if (!cancelado) setCarregandoProfissoes(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Carrega categorias ativas do catálogo administrativo.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const lista = await pb
          .collection('categorias_profissionais')
          .getFullList({
            filter: 'ativo = true',
            sort: 'nome',
          });
        if (!cancelado) setCategoriasCatalogo(lista);
      } catch (e) {
        console.error('Erro ao carregar categorias:', e);
      } finally {
        if (!cancelado) setCarregandoCategorias(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Carrega serviços existentes do usuário.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/minha-conta/profissional', { replace: true });
      return;
    }
    if (!currentUser) return;

    let cancelado = false;
    (async () => {
      try {
        const lista = await pb
          .collection('servicos_profissionais')
          .getFullList({
            filter: `usuario_id = "${currentUser.id}"`,
            sort: '-created',
          });
        if (!cancelado) setServicos(lista);
      } catch (e) {
        console.error('Erro ao carregar serviços:', e);
        if (!cancelado)
          setErroLoad('Não foi possível carregar seus serviços. Tente novamente.');
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, currentUser, navigate]);

  if (!isAuthenticated || !currentUser) return null;

  const abrirNovo = () => {
    setModo('novo');
    setEditandoId(null);
    setDados({ ...EMPTY_SERVICO, cidade: currentUser.cidade || '' });
    setFotosNovas([]);
    setFotosExistentes([]);
    setFotosRemover([]);
    setErroSalvar('');
    setSucesso('');
    setNovaCertificacao('');
    setCategoriaSelecionada('');
  };

  const abrirEditar = (serv) => {
    setModo('editar');
    setEditandoId(serv.id);
    setCategoriaSelecionada('');
    setDados({
      profissao: serv.profissao || '',
      profissoes_ids: Array.isArray(serv.profissoes_ids)
        ? serv.profissoes_ids
        : serv.profissoes_ids
          ? [serv.profissoes_ids]
          : [],
      descricao_servicos: serv.descricao_servicos || '',
      cidade: serv.cidade || '',
      estado: serv.estado || '',
      telefone_whatsapp: serv.telefone_whatsapp || '',
      status: serv.status || 'ativo',
      tipos_atendimento: Array.isArray(serv.tipos_atendimento)
        ? serv.tipos_atendimento
        : serv.tipos_atendimento
          ? [serv.tipos_atendimento]
          : [],
      leva_traz: serv.leva_traz || 'nao',
      distancia_maxima_km:
        serv.distancia_maxima_km != null ? String(serv.distancia_maxima_km) : '',
      horario_segunda_inicio: serv.horario_segunda_inicio || '',
      horario_segunda_fim: serv.horario_segunda_fim || '',
      horario_terca_inicio: serv.horario_terca_inicio || '',
      horario_terca_fim: serv.horario_terca_fim || '',
      horario_quarta_inicio: serv.horario_quarta_inicio || '',
      horario_quarta_fim: serv.horario_quarta_fim || '',
      horario_quinta_inicio: serv.horario_quinta_inicio || '',
      horario_quinta_fim: serv.horario_quinta_fim || '',
      horario_sexta_inicio: serv.horario_sexta_inicio || '',
      horario_sexta_fim: serv.horario_sexta_fim || '',
      horario_sabado_inicio: serv.horario_sabado_inicio || '',
      horario_sabado_fim: serv.horario_sabado_fim || '',
      horario_domingo_inicio: serv.horario_domingo_inicio || '',
      horario_domingo_fim: serv.horario_domingo_fim || '',
      atende_feriados: serv.atende_feriados || 'nao',
      atende_emergencias: serv.atende_emergencias || 'nao',
      horario_emergencia_inicio: serv.horario_emergencia_inicio || '',
      horario_emergencia_fim: serv.horario_emergencia_fim || '',
      // Informações profissionais
      anos_experiencia:
        serv.anos_experiencia != null ? String(serv.anos_experiencia) : '',
      certificacoes: Array.isArray(serv.certificacoes)
        ? serv.certificacoes
        : serv.certificacoes
          ? [serv.certificacoes]
          : [],
      curso_tecnico: serv.curso_tecnico || 'nao',
      mei: serv.mei || 'nao',
      emissao_nota_fiscal: serv.emissao_nota_fiscal || 'nao',
      materiais_proprios: serv.materiais_proprios || 'nao',
      // Forma de cobrança
      forma_cobranca: serv.forma_cobranca || '',
      forma_cobranca_outro: serv.forma_cobranca_outro || '',
      // Faixa de preço
      preco_minimo:
        serv.preco_minimo != null ? String(serv.preco_minimo) : '',
      preco_maximo:
        serv.preco_maximo != null ? String(serv.preco_maximo) : '',
      // Formas de pagamento
      formas_pagamento: Array.isArray(serv.formas_pagamento)
        ? serv.formas_pagamento
        : serv.formas_pagamento
          ? [serv.formas_pagamento]
          : [],
      // Opções de pagamento
      parcelamento: serv.parcelamento || 'nao',
      parcelas_maximas:
        serv.parcelas_maximas != null ? String(serv.parcelas_maximas) : '',
      orcamento_gratuito: serv.orcamento_gratuito || 'nao',
      desconto_membros_igreja: serv.desconto_membros_igreja || 'nao',
      percentual_desconto:
        serv.percentual_desconto != null
          ? String(serv.percentual_desconto)
          : '',
      // Diferenciais
      diferenciais: Array.isArray(serv.diferenciais)
        ? serv.diferenciais
        : serv.diferenciais
          ? [serv.diferenciais]
          : [],
    });
    const nomes = Array.isArray(serv.fotos) ? serv.fotos : serv.fotos ? [serv.fotos] : [];
    setFotosExistentes(nomes);
    setFotosNovas([]);
    setFotosRemover([]);
    setErroSalvar('');
    setSucesso('');
  };

  const cancelarForm = () => {
    setModo('lista');
    setEditandoId(null);
    setDados(EMPTY_SERVICO);
    setFotosNovas([]);
    setFotosExistentes([]);
    setFotosRemover([]);
    setErroSalvar('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setNovaCertificacao('');
  };

  const onSelecionarFotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const disponivel = MAX_FOTOS - fotosExistentes.length + fotosRemover.length;
    const restante = MAX_FOTOS - (fotosExistentes.length - fotosRemover.length) - fotosNovas.length;
    const cabem = files.slice(0, Math.max(0, restante));
    if (cabem.length < files.length) {
      setErroSalvar(`Você pode enviar no máximo ${MAX_FOTOS} fotos no total.`);
    } else {
      setErroSalvar('');
    }
    setFotosNovas((prev) => [...prev, ...cabem]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removerFotoNova = (idx) => {
    setFotosNovas((prev) => prev.filter((_, i) => i !== idx));
  };

  const removerFotoExistente = (nome) => {
    setFotosExistentes((prev) => prev.filter((n) => n !== nome));
    setFotosRemover((prev) => [...prev, nome]);
  };

  const validar = () => {
    if (!dados.profissoes_ids || dados.profissoes_ids.length === 0) {
      setErroSalvar('Selecione ao menos uma profissão do catálogo.');
      return false;
    }
    if (!dados.descricao_servicos.trim()) {
      setErroSalvar('Descreva os serviços que você oferece.');
      return false;
    }
    if (!dados.cidade.trim()) {
      setErroSalvar('Informe a cidade.');
      return false;
    }
    if (!dados.estado.trim()) {
      setErroSalvar('Informe o estado (UF).');
      return false;
    }
    if (!dados.telefone_whatsapp.trim()) {
      setErroSalvar('Informe o telefone/WhatsApp.');
      return false;
    }
    if (dados.leva_traz === 'sim' && !dados.distancia_maxima_km) {
      setErroSalvar('Informe a distância máxima (km) para o serviço de leva e traz.');
      return false;
    }
    if (dados.forma_cobranca === 'outro' && !dados.forma_cobranca_outro.trim()) {
      setErroSalvar('Descreva a forma de cobrança ("Outro").');
      return false;
    }
    if (dados.parcelamento === 'sim' && !dados.parcelas_maximas) {
      setErroSalvar('Informe o número máximo de parcelas.');
      return false;
    }
    if (
      dados.desconto_membros_igreja === 'sim' &&
      (dados.percentual_desconto === '' ||
        Number(dados.percentual_desconto) <= 0 ||
        Number(dados.percentual_desconto) > 100)
    ) {
      setErroSalvar('Informe o percentual de desconto para membros (1 a 100).');
      return false;
    }
    if (
      dados.preco_minimo !== '' &&
      dados.preco_maximo !== '' &&
      Number(dados.preco_minimo) > Number(dados.preco_maximo)
    ) {
      setErroSalvar('O valor mínimo não pode ser maior que o valor máximo.');
      return false;
    }
    setErroSalvar('');
    return true;
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    setSucesso('');
    try {
      const isEdit = modo === 'editar' && editandoId;

      // Monta FormData para suportar upload de fotos.
      const fd = new FormData();
      fd.append('usuario_id', currentUser.id);
      // Profissão (texto) derivada das profissões do catálogo selecionadas,
      // para exibição resumida na lista. O vínculo real é profissoes_ids.
      const nomesProfissao = (dados.profissoes_ids || [])
        .map((pid) => profissoesCatalogo.find((p) => p.id === pid)?.nome)
        .filter(Boolean);
      fd.append('profissao', nomesProfissao.join(', ') || '—');
      // Profissões vinculadas do catálogo (relações, até 5)
      (dados.profissoes_ids || []).forEach((pid) =>
        fd.append('profissoes_ids', pid),
      );
      fd.append('descricao_servicos', dados.descricao_servicos.trim());
      fd.append('cidade', dados.cidade.trim());
      fd.append('estado', dados.estado.trim().toUpperCase());
      fd.append('telefone_whatsapp', dados.telefone_whatsapp.trim());
      fd.append('status', dados.status || 'ativo');

      // Tipos de atendimento (múltiplo)
      (dados.tipos_atendimento || []).forEach((t) =>
        fd.append('tipos_atendimento', t),
      );

      // Leva e traz + distância
      fd.append('leva_traz', dados.leva_traz || 'nao');
      if ((dados.leva_traz === 'sim') && dados.distancia_maxima_km) {
        fd.append('distancia_maxima_km', dados.distancia_maxima_km);
      }

      // Horários por dia da semana
      DIAS_SEMANA.forEach((d) => {
        fd.append(`horario_${d.key}_inicio`, dados[`horario_${d.key}_inicio`] || '');
        fd.append(`horario_${d.key}_fim`, dados[`horario_${d.key}_fim`] || '');
      });

      // Feriados e emergências
      fd.append('atende_feriados', dados.atende_feriados || 'nao');
      fd.append('atende_emergencias', dados.atende_emergencias || 'nao');
      if (dados.atende_emergencias === 'sim') {
        fd.append('horario_emergencia_inicio', dados.horario_emergencia_inicio || '');
        fd.append('horario_emergencia_fim', dados.horario_emergencia_fim || '');
      }

      // Informações profissionais
      if (dados.anos_experiencia !== '') {
        fd.append('anos_experiencia', dados.anos_experiencia);
      }
      // Certificações (array de textos) — enviado como JSON
      fd.append('certificacoes', JSON.stringify(dados.certificacoes || []));
      fd.append('curso_tecnico', dados.curso_tecnico || 'nao');
      fd.append('mei', dados.mei || 'nao');
      fd.append('emissao_nota_fiscal', dados.emissao_nota_fiscal || 'nao');
      fd.append('materiais_proprios', dados.materiais_proprios || 'nao');

      // Forma de cobrança
      if (dados.forma_cobranca) {
        fd.append('forma_cobranca', dados.forma_cobranca);
      }
      if (dados.forma_cobranca === 'outro') {
        fd.append('forma_cobranca_outro', dados.forma_cobranca_outro.trim());
      } else {
        fd.append('forma_cobranca_outro', '');
      }

      // Faixa de preço (Real R$)
      if (dados.preco_minimo !== '') {
        fd.append('preco_minimo', dados.preco_minimo);
      }
      if (dados.preco_maximo !== '') {
        fd.append('preco_maximo', dados.preco_maximo);
      }

      // Formas de pagamento (múltiplo)
      (dados.formas_pagamento || []).forEach((f) =>
        fd.append('formas_pagamento', f),
      );

      // Opções de pagamento
      fd.append('parcelamento', dados.parcelamento || 'nao');
      if (dados.parcelamento === 'sim' && dados.parcelas_maximas) {
        fd.append('parcelas_maximas', dados.parcelas_maximas);
      } else {
        fd.append('parcelas_maximas', '');
      }
      fd.append('orcamento_gratuito', dados.orcamento_gratuito || 'nao');
      fd.append('desconto_membros_igreja', dados.desconto_membros_igreja || 'nao');
      if (
        dados.desconto_membros_igreja === 'sim' &&
        dados.percentual_desconto !== ''
      ) {
        fd.append('percentual_desconto', dados.percentual_desconto);
      } else {
        fd.append('percentual_desconto', '');
      }

      // Diferenciais (múltiplo)
      (dados.diferenciais || []).forEach((d) =>
        fd.append('diferenciais', d),
      );

      if (isEdit) {
        // Ao editar, status_aprovacao permanece o já definido (admin controla).
        // Fotos existentes que devem permanecer são reenviadas via campo
        // "fotos" para o PocketBase preservá-las; as removidas não são
        // reenviadas. O SDK PocketBase, ao receber FormData em update,
        // substitui o campo file pelos arquivos enviados — então enviamos
        // os nomes das existentes mantidas + os novos arquivos.
        fotosExistentes.forEach((nome) => fd.append('fotos', nome));
        fotosNovas.forEach((file) => fd.append('fotos', file));
      } else {
        // Novo serviço inicia como "Aguardando análise".
        fd.append('status_aprovacao', 'aguardando_analise');
        fotosNovas.forEach((file) => fd.append('fotos', file));
      }

      let rec;
      if (isEdit) {
        rec = await pb
          .collection('servicos_profissionais')
          .update(editandoId, fd);
      } else {
        rec = await pb
          .collection('servicos_profissionais')
          .create(fd);
      }

      setServicos((prev) => {
        const resto = prev.filter((s) => s.id !== rec.id);
        return [rec, ...resto];
      });
      setSucesso(
        isEdit
          ? 'Serviço atualizado com sucesso.'
          : 'Serviço cadastrado com status "Aguardando aprovação". A administração irá analisar antes da publicação.',
      );
      cancelarForm();
    } catch (e) {
      console.error('Erro ao salvar serviço:', e);
      setErroSalvar(
        e?.response?.message ||
          'Não foi possível salvar agora. Verifique os campos e tente novamente.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const removerServico = async (serv) => {
    if (!window.confirm('Tem certeza que deseja remover este serviço? Esta ação não pode ser desfeita.')) return;
    try {
      await pb.collection('servicos_profissionais').delete(serv.id);
      setServicos((prev) => prev.filter((s) => s.id !== serv.id));
      setSucesso('Serviço removido.');
    } catch (e) {
      console.error('Erro ao remover serviço:', e);
      setErroSalvar('Não foi possível remover o serviço. Tente novamente.');
    }
  };

  const fotoUrl = (serv, nome) => {
    try {
      return pb.files.getURL({ id: serv.id, collectionId: 'servicos_profissionais', collectionName: 'servicos_profissionais' }, nome, { thumb: '400x300' });
    } catch (_) {
      return pb.files.getUrl({ id: serv.id }, nome, { thumb: '400x300' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Cadastrar serviços de profissional liberal | Conexão Batista</title>
        <meta name="description" content="Cadastre seus serviços como profissional liberal no Conexão Batista." />
      </Helmet>
      <section className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
        <Link to="/minha-conta" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Voltar para Minha conta
        </Link>

        <div className="page-centered mt-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/8 text-primary">
            <Briefcase size={26} strokeWidth={1.8} />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-accent">Conclusão de perfil</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">Cadastrar meus serviços como profissional liberal</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Cadastre os serviços profissionais que você oferece para a comunidade da fé. Você pode adicionar até cinco serviços, editar ou remover quando quiser. Todos os cadastros começam como "Aguardando aprovação" e só ficam visíveis após análise da administração.
          </p>
        </div>

        {carregando ? (
          <div className="mt-12 text-center">
            <Loader2 className="mx-auto animate-spin text-primary" size={28} />
            <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>
          </div>
        ) : (
          <>
            {erroLoad && (
              <div className="mt-8 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{erroLoad}</span>
              </div>
            )}

            {sucesso && modo === 'lista' && (
              <div className="mt-8 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>{sucesso}</span>
              </div>
            )}

            {sucessoSugestao && (
              <div className="mt-8 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>{sucessoSugestao}</span>
              </div>
            )}

            {modo === 'lista' && (
              <div className="mt-10 text-left">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-primary">Meus serviços <span className="ml-1 text-sm font-semibold text-muted-foreground">({servicos.length}/{MAX_SERVICOS})</span></h2>
                  <button type="button" onClick={abrirNovo} disabled={servicos.length >= MAX_SERVICOS} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                    <Plus size={16} /> Novo serviço
                  </button>
                </div>

                {servicos.length >= MAX_SERVICOS && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>Você atingiu o limite de {MAX_SERVICOS} serviços. Para adicionar um novo, remova um dos serviços cadastrados.</span>
                  </div>
                )}

                {servicos.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary">
                      <Briefcase size={22} strokeWidth={1.8} />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-foreground">Você ainda não cadastrou nenhum serviço.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Clique em "Novo serviço" para começar.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {servicos.map((serv) => {
                      const aprov = APROVACAO[serv.status_aprovacao] || APROVACAO.aguardando_analise;
                      const AprovIcon = aprov.icon;
                      const nomes = Array.isArray(serv.fotos) ? serv.fotos : serv.fotos ? [serv.fotos] : [];
                      return (
                        <li key={serv.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display text-base font-bold text-primary">{serv.profissao}</h3>
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${aprov.className}`}>
                                  <AprovIcon size={12} /> {aprov.label}
                                </span>
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${serv.status === 'ativo' ? 'border-green-300 bg-green-50 text-green-700' : 'border-border bg-muted text-muted-foreground'}`}>
                                  {serv.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{serv.descricao_servicos}</p>
                              <p className="mt-2 text-xs font-semibold text-foreground">
                                {serv.cidade}{serv.estado ? ` — ${serv.estado}` : ''}{serv.telefone_whatsapp ? ` · ${serv.telefone_whatsapp}` : ''}
                              </p>
                              {nomes.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {nomes.slice(0, 4).map((nome) => (
                                    <img key={nome} src={fotoUrl(serv, nome)} alt="Foto do serviço" className="h-14 w-14 rounded-lg border border-border object-cover" />
                                  ))}
                                  {nomes.length > 4 && (
                                    <span className="grid h-14 w-14 place-items-center rounded-lg border border-border bg-muted text-xs font-semibold text-muted-foreground">+{nomes.length - 4}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button type="button" onClick={() => abrirEditar(serv)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
                                <Pencil size={14} /> Editar
                              </button>
                              <button type="button" onClick={() => removerServico(serv)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5">
                                <Trash2 size={14} /> Remover
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {(modo === 'novo' || modo === 'editar') && (
              <form onSubmit={salvar} className="mt-10 space-y-6 text-left">
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Briefcase size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">
                      {modo === 'editar' ? 'Editar serviço' : 'Novo serviço'}
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Profissões do catálogo (filtro em duas etapas, até 5) */}
                    <div className="sm:col-span-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className={labelClass + ' mb-0'}>Profissões *</label>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {(dados.profissoes_ids || []).length} de {MAX_PROFISSOES} profissões selecionadas
                        </span>
                      </div>
                      {carregandoCategorias || carregandoProfissoes ? (
                        <p className="text-xs text-muted-foreground">Carregando categorias e profissões…</p>
                      ) : categoriasCatalogo.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Nenhuma categoria ativa disponível no catálogo no momento.
                        </p>
                      ) : (
                        <>
                          <p className="mb-2 text-xs text-muted-foreground">
                            Selecione até {MAX_PROFISSOES} profissões no total, podendo somar escolhas de categorias diferentes.
                          </p>

                          {/* Primeira etapa: categoria */}
                          <div className="mb-3">
                            <label className="mb-1.5 block text-xs font-semibold text-foreground">Qual categoria?</label>
                            <select
                              className={inputClass}
                              value={categoriaSelecionada}
                              onChange={(e) => setCategoriaSelecionada(e.target.value)}
                            >
                              <option value="">Selecione uma categoria…</option>
                              {categoriasCatalogo.map((c) => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                              ))}
                            </select>
                          </div>

                          {/* Segunda etapa: profissões da categoria selecionada */}
                          {categoriaSelecionada ? (
                            (() => {
                              const profsCat = profissoesCatalogo.filter(
                                (p) => p.categoria_id === categoriaSelecionada,
                              );
                              const totalSel = (dados.profissoes_ids || []).length;
                              const limiteAtingido = totalSel >= MAX_PROFISSOES;
                              return (
                                <div>
                                  {profsCat.length === 0 ? (
                                    <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                                      Nenhuma profissão ativa vinculada a esta categoria.
                                    </p>
                                  ) : (
                                    <>
                                      {limiteAtingido && (
                                        <div className="mb-2 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">
                                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                          <span>Você atingiu o limite de {MAX_PROFISSOES} profissões. Desmarque uma opção para escolher outra.</span>
                                        </div>
                                      )}
                                      <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border border-border p-2.5 sm:grid-cols-2">
                                        {profsCat.map((p) => {
                                          const checked = (dados.profissoes_ids || []).includes(p.id);
                                          const disabled = limiteAtingido && !checked;
                                          return (
                                            <label
                                              key={p.id}
                                              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                                checked
                                                  ? 'border-primary bg-primary/5 text-primary'
                                                  : disabled
                                                    ? 'cursor-not-allowed border-border bg-muted/30 text-muted-foreground opacity-60'
                                                    : 'cursor-pointer border-border bg-background text-foreground hover:bg-muted/40'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={disabled}
                                                onChange={() => toggleProfissaoId(p.id)}
                                                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                                              />
                                              <span className="min-w-0 font-medium">{p.nome}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                              Selecione uma categoria acima para ver as profissões vinculadas.
                            </p>
                          )}

                          {/* Resumo das profissões selecionadas (de todas as categorias) */}
                          {(dados.profissoes_ids || []).length > 0 && (
                            <div className="mt-3">
                              <p className="mb-1.5 text-xs font-semibold text-foreground">Profissões selecionadas:</p>
                              <div className="flex flex-wrap gap-2">
                                {(dados.profissoes_ids || []).map((pid) => {
                                  const prof = profissoesCatalogo.find((p) => p.id === pid);
                                  const catNome = prof?.expand?.categoria_id?.nome || '';
                                  return (
                                    <span
                                      key={pid}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
                                    >
                                      {prof ? prof.nome : 'Profissão'}
                                      {catNome && <span className="font-normal text-primary/70">· {catNome}</span>}
                                      <button
                                        type="button"
                                        onClick={() => toggleProfissaoId(pid)}
                                        aria-label="Remover profissão"
                                        className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary/15"
                                      >
                                        <X size={12} />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                Você pode trocar de categoria acima para adicionar ou remover profissões de outras áreas sem perder as já escolhidas.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Link para sugerir nova categoria/profissão */}
                      <button
                        type="button"
                        onClick={() => setModalSugestao({ tipo: 'profissao', nome: '', descricao: '', categoria_relacionada: '' })}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        <Lightbulb size={14} /> Não encontrei minha categoria ou profissão
                      </button>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Descrição dos serviços *</label>
                      <textarea rows={4} className={inputClass} placeholder="Descreva os serviços que você oferece, experiência, áreas de atuação…" value={dados.descricao_servicos} onChange={(e) => setCampo('descricao_servicos', e.target.value)} required />
                    </div>
                    <div className="sm:col-span-2">
                      <UfCidadeFields
                        uf={dados.estado}
                        cidade={dados.cidade}
                        onChangeUf={(v) => setCampo('estado', v)}
                        onChangeCidade={(v) => setCampo('cidade', v)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Telefone / WhatsApp *</label>
                      <input type="tel" className={inputClass} placeholder="(00) 00000-0000" value={dados.telefone_whatsapp} onChange={(e) => setCampo('telefone_whatsapp', e.target.value)} required />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Status do serviço</label>
                      <select className={inputClass} value={dados.status} onChange={(e) => setCampo('status', e.target.value)}>
                        {STATUS_OPCOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">O status de aprovação é controlado pela administração do portal.</p>
                    </div>
                  </div>
                </div>

                {/* Tipos de atendimento */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Briefcase size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">Tipos de atendimento</h2>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">Selecione todas as opções que se aplicam ao seu serviço.</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {TIPOS_ATENDIMENTO_OPCOES.map((o) => {
                      const checked = (dados.tipos_atendimento || []).includes(o.value);
                      return (
                        <label key={o.value} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${checked ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleTipoAtendimento(o.value)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30" />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Leva e traz */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Truck size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">Serviço de leva e traz</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Oferece leva e traz?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.leva_traz === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="leva_traz" value={o.value} checked={dados.leva_traz === o.value} onChange={(e) => setCampo('leva_traz', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    {dados.leva_traz === 'sim' && (
                      <div>
                        <label className={labelClass}>Distância máxima (km) *</label>
                        <input type="number" min="0" step="1" className={inputClass} placeholder="Ex.: 20" value={dados.distancia_maxima_km} onChange={(e) => setCampo('distancia_maxima_km', e.target.value)} />
                        <p className="mt-1 text-xs text-muted-foreground">Informe a distância máxima que você percorre para busca e entrega.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dias e horários de atendimento */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <CalendarClock size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">Dias e horários de atendimento</h2>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">Informe os horários no formato 24h (ex.: 08:00). Deixe em branco se não ativer no dia.</p>
                  <div className="space-y-3">
                    {DIAS_SEMANA.map((d) => (
                      <div key={d.key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_auto]">
                        <span className="text-sm font-semibold text-foreground">{d.label}</span>
                        <div className="flex items-center gap-2">
                          <input type="time" className={inputClass} value={dados[`horario_${d.key}_inicio`]} onChange={(e) => setCampo(`horario_${d.key}_inicio`, e.target.value)} aria-label={`${d.label} - início`} />
                          <span className="text-xs text-muted-foreground">às</span>
                          <input type="time" className={inputClass} value={dados[`horario_${d.key}_fim`]} onChange={(e) => setCampo(`horario_${d.key}_fim`, e.target.value)} aria-label={`${d.label} - fim`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Atende feriados?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.atende_feriados === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="atende_feriados" value={o.value} checked={dados.atende_feriados === o.value} onChange={(e) => setCampo('atende_feriados', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergências */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Stethoscope size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">Emergências</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Atende emergências?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.atende_emergencias === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="atende_emergencias" value={o.value} checked={dados.atende_emergencias === o.value} onChange={(e) => setCampo('atende_emergencias', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    {dados.atende_emergencias === 'sim' && (
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Horário de atendimento de emergências</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input type="time" className={inputClass} value={dados.horario_emergencia_inicio} onChange={(e) => setCampo('horario_emergencia_inicio', e.target.value)} aria-label="Emergência - início" />
                          <span className="text-xs text-muted-foreground">às</span>
                          <input type="time" className={inputClass} value={dados.horario_emergencia_fim} onChange={(e) => setCampo('horario_emergencia_fim', e.target.value)} aria-label="Emergência - fim" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações profissionais */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Award size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">Informações profissionais</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Anos de experiência</label>
                      <input type="number" min="0" step="1" className={inputClass} placeholder="Ex.: 5" value={dados.anos_experiencia} onChange={(e) => setCampo('anos_experiencia', e.target.value)} />
                      <p className="mt-1 text-xs text-muted-foreground">Quantos anos de experiência na área.</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Certificações</label>
                      <div className="flex flex-wrap gap-2">
                        {(dados.certificacoes || []).map((c, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                            {c}
                            <button type="button" onClick={() => removeCertificacao(idx)} aria-label="Remover" className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary/15">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input className={inputClass} placeholder="Ex.: NR-10, Curso de Primeiros Socorros…" value={novaCertificacao} onChange={(e) => setNovaCertificacao(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCertificacao(novaCertificacao); setNovaCertificacao(''); } }} />
                        <button type="button" onClick={() => { addCertificacao(novaCertificacao); setNovaCertificacao(''); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                          <Plus size={16} /> Adicionar
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Pressione Enter ou clique em "Adicionar".</p>
                    </div>
                    <div>
                      <label className={labelClass}>Possui curso técnico?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.curso_tecnico === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="curso_tecnico" value={o.value} checked={dados.curso_tecnico === o.value} onChange={(e) => setCampo('curso_tecnico', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>É MEI?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.mei === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="mei" value={o.value} checked={dados.mei === o.value} onChange={(e) => setCampo('mei', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Emite nota fiscal?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.emissao_nota_fiscal === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="emissao_nota_fiscal" value={o.value} checked={dados.emissao_nota_fiscal === o.value} onChange={(e) => setCampo('emissao_nota_fiscal', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Possui materiais próprios?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.materiais_proprios === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="materiais_proprios" value={o.value} checked={dados.materiais_proprios === o.value} onChange={(e) => setCampo('materiais_proprios', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Forma de cobrança e faixa de preço */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <BadgeDollarSign size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">Forma de cobrança e faixa de preço</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Forma de cobrança</label>
                      <select className={inputClass} value={dados.forma_cobranca} onChange={(e) => setCampo('forma_cobranca', e.target.value)}>
                        <option value="">Selecione…</option>
                        {FORMA_COBRANCA_OPCOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    {dados.forma_cobranca === 'outro' && (
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Descreva a forma de cobrança *</label>
                        <input className={inputClass} placeholder="Ex.: Diária + material à parte…" value={dados.forma_cobranca_outro} onChange={(e) => setCampo('forma_cobranca_outro', e.target.value)} />
                      </div>
                    )}
                    <div>
                      <label className={labelClass}>Valor mínimo (R$)</label>
                      <input type="number" min="0" step="0.01" className={inputClass} placeholder="Ex.: 50,00" value={dados.preco_minimo} onChange={(e) => setCampo('preco_minimo', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Valor máximo (R$)</label>
                      <input type="number" min="0" step="0.01" className={inputClass} placeholder="Ex.: 500,00" value={dados.preco_maximo} onChange={(e) => setCampo('preco_maximo', e.target.value)} />
                    </div>
                    <p className="sm:col-span-2 text-xs text-muted-foreground">Moeda: Real (R$). Informe a faixa de preço praticada.</p>
                  </div>
                </div>

                {/* Formas de pagamento e opções */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <CreditCard size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">Formas de pagamento e opções</h2>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">Selecione todas as formas de pagamento aceitas.</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {FORMAS_PAGAMENTO_OPCOES.map((o) => {
                      const checked = (dados.formas_pagamento || []).includes(o.value);
                      return (
                        <label key={o.value} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${checked ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleArray('formas_pagamento', o.value)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30" />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Oferece parcelamento?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.parcelamento === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="parcelamento" value={o.value} checked={dados.parcelamento === o.value} onChange={(e) => setCampo('parcelamento', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    {dados.parcelamento === 'sim' && (
                      <div>
                        <label className={labelClass}>Número máximo de parcelas *</label>
                        <input type="number" min="1" step="1" className={inputClass} placeholder="Ex.: 12" value={dados.parcelas_maximas} onChange={(e) => setCampo('parcelas_maximas', e.target.value)} />
                      </div>
                    )}
                    <div>
                      <label className={labelClass}>Orçamento gratuito?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.orcamento_gratuito === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="orcamento_gratuito" value={o.value} checked={dados.orcamento_gratuito === o.value} onChange={(e) => setCampo('orcamento_gratuito', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Desconto para membros da igreja?</label>
                      <div className="flex gap-3">
                        {SIM_NAO_OPCOES.map((o) => (
                          <label key={o.value} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${dados.desconto_membros_igreja === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                            <input type="radio" name="desconto_membros_igreja" value={o.value} checked={dados.desconto_membros_igreja === o.value} onChange={(e) => setCampo('desconto_membros_igreja', e.target.value)} className="h-4 w-4 text-primary focus:ring-primary/30" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    {dados.desconto_membros_igreja === 'sim' && (
                      <div>
                        <label className={labelClass}>Percentual de desconto (%) *</label>
                        <input type="number" min="1" max="100" step="1" className={inputClass} placeholder="Ex.: 10" value={dados.percentual_desconto} onChange={(e) => setCampo('percentual_desconto', e.target.value)} />
                        <p className="mt-1 text-xs text-muted-foreground">Informe um valor entre 1 e 100.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Diferenciais */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <Sparkles size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">Diferenciais</h2>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">Selecione os diferenciais que se aplicam ao seu serviço.</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {DIFERENCIAIS_OPCOES.map((o) => {
                      const checked = (dados.diferenciais || []).includes(o.value);
                      return (
                        <label key={o.value} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${checked ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleArray('diferenciais', o.value)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30" />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Fotos */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                      <ImageIcon size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-primary">Fotos do serviço</h2>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">Envie até {MAX_FOTOS} fotos (JPG, PNG ou WEBP, até 5 MB cada). Opcional.</p>

                  {/* Fotos existentes (modo edição) */}
                  {fotosExistentes.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-xs font-semibold text-foreground">Fotos atuais</p>
                      <div className="flex flex-wrap gap-3">
                        {fotosExistentes.map((nome) => (
                          <div key={nome} className="relative">
                            <img src={fotoUrl({ id: editandoId }, nome)} alt="Foto atual" className="h-20 w-20 rounded-lg border border-border object-cover" />
                            <button type="button" onClick={() => removerFotoExistente(nome)} aria-label="Remover foto" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-white shadow hover:bg-destructive/90">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fotos novas selecionadas */}
                  {fotosNovas.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-xs font-semibold text-foreground">Novas fotos</p>
                      <div className="flex flex-wrap gap-3">
                        {fotosNovas.map((file, idx) => (
                          <div key={idx} className="relative">
                            <img src={URL.createObjectURL(file)} alt="Pré-visualização" className="h-20 w-20 rounded-lg border border-border object-cover" />
                            <button type="button" onClick={() => removerFotoNova(idx)} aria-label="Remover foto" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-white shadow hover:bg-destructive/90">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {fotosExistentes.length - fotosRemover.length + fotosNovas.length < MAX_FOTOS && (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10">
                      <Plus size={16} /> Adicionar fotos
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onSelecionarFotos} />
                    </label>
                  )}
                </div>

                {erroSalvar && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{erroSalvar}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={cancelarForm} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40">
                    Cancelar
                  </button>
                  <button type="submit" disabled={salvando} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                    {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {modo === 'editar' ? 'Salvar alterações' : 'Cadastrar serviço'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      {/* Modal: sugerir nova categoria ou profissão */}
      {modalSugestao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                  <Lightbulb size={18} />
                </span>
                <h3 className="font-display text-lg font-bold text-primary">
                  Sugerir categoria ou profissão
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setModalSugestao(null); setErroSugestao(''); }}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={enviarSugestao} className="space-y-4">
              <div>
                <label className={labelClass}>O que você quer sugerir? *</label>
                <div className="flex gap-3">
                  {[
                    { value: 'categoria', label: 'Nova categoria' },
                    { value: 'profissao', label: 'Nova profissão' },
                  ].map((o) => (
                    <label
                      key={o.value}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${modalSugestao.tipo === o.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}
                    >
                      <input
                        type="radio"
                        name="tipo_sugestao"
                        value={o.value}
                        checked={modalSugestao.tipo === o.value}
                        onChange={(e) => setCampoSugestao('tipo', e.target.value)}
                        className="h-4 w-4 text-primary focus:ring-primary/30"
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  {modalSugestao.tipo === 'categoria' ? 'Nome da categoria *' : 'Nome da profissão *'}
                </label>
                <input
                  className={inputClass}
                  placeholder={modalSugestao.tipo === 'categoria' ? 'Ex.: Tecnologia, Estética…' : 'Ex.: Eletricista, Costureira…'}
                  value={modalSugestao.nome}
                  onChange={(e) => setCampoSugestao('nome', e.target.value)}
                  required
                />
              </div>

              {modalSugestao.tipo === 'profissao' && (
                <div>
                  <label className={labelClass}>Categoria relacionada *</label>
                  <select
                    className={inputClass}
                    value={modalSugestao.categoria_relacionada}
                    onChange={(e) => setCampoSugestao('categoria_relacionada', e.target.value)}
                    required
                  >
                    <option value="">Selecione a categoria…</option>
                    {categoriasCatalogo.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  {categoriasCatalogo.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Nenhuma categoria ativa disponível no momento. Considere sugerir uma nova categoria.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className={labelClass}>Descrição</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="Conte um pouco sobre a categoria/profissão sugerida (opcional)"
                  value={modalSugestao.descricao}
                  onChange={(e) => setCampoSugestao('descricao', e.target.value)}
                />
              </div>

              <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                Sua sugestão será enviada para análise da administração do portal. Você receberá um retorno por e-mail assim que for avaliada.
              </p>

              {erroSugestao && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{erroSugestao}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalSugestao(null); setErroSugestao(''); }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoSugestao}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {enviandoSugestao ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Enviar sugestão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
