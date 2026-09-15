import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Church,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  History,
  Globe,
  EyeOff,
  ShieldOff,
  Save,
  Plus,
  Users,
  UserPlus,
  UserCog,
  UserX,
  Ban,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

const PER_PAGE = 12;

const STATUS_APROVACAO = {
  aguardando_aprovacao: {
    label: 'Aguardando aprovação',
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
  reprovado: {
    label: 'Reprovado',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

const VISIBILIDADE = {
  publico: { label: 'Público', icon: Globe, className: 'bg-green-100 text-green-700 border-green-300' },
  privado: { label: 'Privado', icon: Lock, className: 'bg-muted text-muted-foreground border-border' },
  oculto: { label: 'Oculto', icon: EyeOff, className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const PAPEL_LABEL = {
  pastor: 'Pastor',
  secretario: 'Secretário',
  membro: 'Membro',
  admin: 'Administrador',
};

const PAPEL_OPTIONS = [
  { value: 'pastor', label: 'Pastor' },
  { value: 'secretario', label: 'Secretário' },
  { value: 'membro', label: 'Membro' },
];

const inputClass =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground';

function formatarData(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return iso;
  }
}

// Constrói a lista de QSA a partir do retorno da BrasilAPI.
function construirQsa(data) {
  const qsa = Array.isArray(data?.qsa) ? data.qsa : [];
  return qsa
    .map((item) => {
      const nome = item?.nome_socio || item?.nome || item?.nome_representante_legal || '';
      if (!nome) return null;
      const documento = item?.cnpj_cpf_do_socio || item?.cpf_cnpj_socio || '';
      const cargo =
        item?.qualificacao_socio || item?.qual_descricao_socio || item?.qualificacao || '';
      const periodo = item?.data_entrada_sociedade || item?.data_entrada || '';
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

function formatCnpj(value) {
  const d = (value || '').replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

const EMPTY_NOVA = {
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
  cnae_principal_codigo: '',
  cnae_principal_descricao: '',
  cnaes_secundarios: [],
  natureza_juridica_codigo: '',
  natureza_juridica_descricao: '',
  qsa: [],
  cargo_representante: '',
  ramo_atividade: '',
  numero_funcionarios: '',
  visibilidade: 'privado',
  visibilidade_perfil: 'membros',
  fonte_dados: '',
};

const NUM_FUNC = [
  { value: '', label: 'Selecione…' },
  { value: '1-10', label: '1 a 10' },
  { value: '11-50', label: '11 a 50' },
  { value: '51-100', label: '51 a 100' },
  { value: '101-500', label: '101 a 500' },
  { value: '500+', label: 'Mais de 500' },
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

const VISIBILIDADE_PERFIL = [
  { value: 'publico', label: 'Público (visível para todos)' },
  { value: 'membros', label: 'Apenas membros aprovados' },
  { value: 'privado', label: 'Privado (só administração)' },
];

export default function IgrejasPage() {
  const { admin } = useAdminAuth();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroVisibilidade, setFiltroVisibilidade] = useState('todas');
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Modal de detalhes / edição
  const [detalhe, setDetalhe] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [carregandoHist, setCarregandoHist] = useState(false);

  // Modal de ação (não aprovar / suspender)
  const [modalAcao, setModalAcao] = useState(null);
  const [salvandoAcao, setSalvandoAcao] = useState(false);
  const [erroAcao, setErroAcao] = useState('');

  // Modal Nova Igreja
  const [modalNova, setModalNova] = useState(false);
  const [formNova, setFormNova] = useState(EMPTY_NOVA);
  const [consultandoNova, setConsultandoNova] = useState(false);
  const [erroCnpjNova, setErroCnpjNova] = useState('');
  const [sucessoCnpjNova, setSucessoCnpjNova] = useState('');
  const [bloqueadaNova, setBloqueadaNova] = useState(false);
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [erroNova, setErroNova] = useState('');

  // Usuários vinculados
  const [usuariosVinculados, setUsuariosVinculados] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);

  // Modal adicionar usuário
  const [modalAddUser, setModalAddUser] = useState(false);
  const [buscaEmail, setBuscaEmail] = useState('');
  const [userEncontrado, setUserEncontrado] = useState(null);
  const [buscandoUser, setBuscandoUser] = useState(false);
  const [papelNovoUser, setPapelNovoUser] = useState('membro');
  const [erroAddUser, setErroAddUser] = useState('');
  const [salvandoAddUser, setSalvandoAddUser] = useState(false);

  // Modal alterar papel
  const [modalPapel, setModalPapel] = useState(null); // { user }
  const [papelEdit, setPapelEdit] = useState('membro');
  const [salvandoPapel, setSalvandoPapel] = useState(false);

  // Modal Excluir cadastro
  const [modalExcluir, setModalExcluir] = useState(null);
  const [confirmaExcluir, setConfirmaExcluir] = useState(false);
  const [motivoExcluir, setMotivoExcluir] = useState('');
  const [salvandoExcluir, setSalvandoExcluir] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  const [processandoId, setProcessandoId] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const filtros = [pb.filter('tipo = {:tipo}', { tipo: 'igreja' })];
      if (filtroStatus !== 'todos') {
        filtros.push(pb.filter('status_aprovacao = {:status}', { status: filtroStatus }));
      }
      if (filtroVisibilidade !== 'todas') {
        filtros.push(pb.filter('visibilidade = {:vis}', { vis: filtroVisibilidade }));
      }
      const termo = busca.trim();
      if (termo) {
        filtros.push(
          pb.filter(
            '(razao_social ~ {:q} || nome_fantasia ~ {:q} || cnpj ~ {:q} || cidade ~ {:q} || estado ~ {:q})',
            { q: termo },
          ),
        );
      }
      const result = await pb.collection('empresas').getList(pagina, PER_PAGE, {
        filter: filtros.join(' && '),
        sort: '-data_cadastro',
        expand: 'usuario_id',
      });
      setItems(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (e) {
      setErro('Não foi possível carregar a lista de igrejas.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, filtroVisibilidade, pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPagina(1);
  }, [busca, filtroStatus, filtroVisibilidade]);

  const nomeUsuario = (s) => s?.expand?.usuario_id?.name || s?.expand?.usuario_id?.email || '—';
  const emailUsuario = (s) => s?.expand?.usuario_id?.email || '—';

  // ---- Usuários vinculados ----
  const carregarUsuarios = useCallback(async (igrejaId) => {
    setCarregandoUsuarios(true);
    try {
      const lista = await pb.collection('users').getFullList({
        filter: pb.filter('igreja_id = {:id}', { id: igrejaId }),
        sort: 'name',
      });
      setUsuariosVinculados(lista);
    } catch (e) {
      setUsuariosVinculados([]);
    } finally {
      setCarregandoUsuarios(false);
    }
  }, []);

  const abrirDetalhe = async (s) => {
    setDetalhe(s);
    setEditando(false);
    setFormEdit({
      razao_social: s.razao_social || '',
      nome_fantasia: s.nome_fantasia || '',
      tipo_empresa: s.tipo_empresa || '',
      data_abertura: s.data_abertura || '',
      situacao_cadastral: s.situacao_cadastral || '',
      logradouro: s.logradouro || '',
      numero: s.numero || '',
      complemento: s.complemento || '',
      bairro: s.bairro || '',
      cep: s.cep || '',
      cidade: s.cidade || '',
      estado: s.estado || '',
      telefone: s.telefone || '',
      email: s.email || '',
      website: s.website || '',
      descricao: s.descricao || '',
      ramo_atividade: s.ramo_atividade || '',
      numero_funcionarios: s.numero_funcionarios || '',
      visibilidade: s.visibilidade || 'privado',
      visibilidade_perfil: s.visibilidade_perfil || 'membros',
      cargo_representante: s.cargo_representante || '',
      cnae_principal_codigo: s.cnae_principal_codigo || '',
      cnae_principal_descricao: s.cnae_principal_descricao || '',
      natureza_juridica_codigo: s.natureza_juridica_codigo || '',
      natureza_juridica_descricao: s.natureza_juridica_descricao || '',
    });
    setHistorico([]);
    setCarregandoHist(true);
    setUsuariosVinculados([]);
    try {
      const lista = await pb.collection('acoes_empresas').getFullList({
        filter: pb.filter('empresa_id = {:id}', { id: s.id }),
        sort: '-data_acao',
        expand: 'usuario_admin_id',
      });
      setHistorico(lista);
    } catch (e) {
      setHistorico([]);
    } finally {
      setCarregandoHist(false);
    }
    carregarUsuarios(s.id);
  };

  const registrarAcao = async (empresa, statusNovo, justificativa) => {
    const adminId = admin?.id;
    const dataAcao = new Date().toISOString();
    try {
      await pb.collection('acoes_empresas').create({
        empresa_id: empresa.id,
        usuario_admin_id: adminId,
        data_acao: dataAcao,
        status_anterior: empresa.status_aprovacao || '',
        status_novo: statusNovo,
        justificativa: justificativa || '',
      });
    } catch (e) {
      console.error('Falha ao registrar ação de auditoria', e);
    }
  };

  const aprovar = async (empresa) => {
    setProcessandoId(empresa.id);
    setErro('');
    setSucesso('');
    try {
      const rec = await pb.collection('empresas').update(empresa.id, {
        status_aprovacao: 'aprovado',
      });
      await registrarAcao(empresa, 'aprovado', '');
      setItems((prev) => prev.map((it) => (it.id === rec.id ? { ...it, ...rec, expand: it.expand } : it)));
      setDetalhe((d) => (d && d.id === rec.id ? { ...d, ...rec, expand: d.expand } : d));
      setSucesso(`Igreja "${empresa.razao_social || empresa.nome_fantasia}" aprovada.`);
    } catch (e) {
      setErro(e?.response?.message || 'Não foi possível aprovar a igreja agora.');
    } finally {
      setProcessandoId(null);
    }
  };

  const abrirModalAcao = (empresa, statusNovo) => {
    setErroAcao('');
    const titulo =
      statusNovo === 'nao_aprovado' ? 'Não aprovar igreja' : 'Suspender igreja';
    setModalAcao({ empresa, statusNovo, titulo, motivo: '' });
  };

  const confirmarAcao = async (e) => {
    e.preventDefault();
    if (!modalAcao) return;
    if (!modalAcao.motivo.trim()) {
      setErroAcao('Informe o motivo (obrigatório).');
      return;
    }
    setSalvandoAcao(true);
    setErroAcao('');
    try {
      const { empresa, statusNovo, motivo } = modalAcao;
      const rec = await pb.collection('empresas').update(empresa.id, {
        status_aprovacao: statusNovo,
      });
      await registrarAcao(empresa, statusNovo, motivo.trim());
      setItems((prev) => prev.map((it) => (it.id === rec.id ? { ...it, ...rec, expand: it.expand } : it)));
      setDetalhe((d) => (d && d.id === rec.id ? { ...d, ...rec, expand: d.expand } : d));
      setModalAcao(null);
      setSucesso(
        statusNovo === 'nao_aprovado'
          ? `Igreja "${empresa.razao_social || empresa.nome_fantasia}" marcada como não aprovada.`
          : `Igreja "${empresa.razao_social || empresa.nome_fantasia}" suspensa.`,
      );
    } catch (e) {
      setErroAcao(e?.response?.message || 'Não foi possível realizar a ação agora.');
    } finally {
      setSalvandoAcao(false);
    }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    if (!detalhe) return;
    setSalvandoEdicao(true);
    try {
      const rec = await pb.collection('empresas').update(detalhe.id, {
        razao_social: formEdit.razao_social,
        nome_fantasia: formEdit.nome_fantasia,
        tipo_empresa: formEdit.tipo_empresa || null,
        data_abertura: formEdit.data_abertura || null,
        situacao_cadastral: formEdit.situacao_cadastral || null,
        logradouro: formEdit.logradouro || null,
        numero: formEdit.numero || null,
        complemento: formEdit.complemento || null,
        bairro: formEdit.bairro || null,
        cep: formEdit.cep || null,
        cidade: formEdit.cidade || null,
        estado: formEdit.estado || null,
        telefone: formEdit.telefone || null,
        email: formEdit.email || null,
        website: formEdit.website || null,
        descricao: formEdit.descricao || null,
        ramo_atividade: formEdit.ramo_atividade || null,
        numero_funcionarios: formEdit.numero_funcionarios || null,
        visibilidade: formEdit.visibilidade,
        visibilidade_perfil: formEdit.visibilidade_perfil,
        cargo_representante: formEdit.cargo_representante || null,
        cnae_principal_codigo: formEdit.cnae_principal_codigo || null,
        cnae_principal_descricao: formEdit.cnae_principal_descricao || null,
        natureza_juridica_codigo: (formEdit.natureza_juridica_codigo || '').slice(0, 20) || null,
        natureza_juridica_descricao: formEdit.natureza_juridica_descricao || null,
      });
      setItems((prev) => prev.map((it) => (it.id === rec.id ? { ...it, ...rec, expand: it.expand } : it)));
      setDetalhe({ ...detalhe, ...rec, expand: detalhe.expand });
      setEditando(false);
      setSucesso('Dados da igreja atualizados.');
    } catch (e) {
      setErro(e?.response?.message || 'Não foi possível salvar a edição.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // ---- Nova igreja ----
  const abrirNovaIgreja = () => {
    setFormNova(EMPTY_NOVA);
    setErroCnpjNova('');
    setSucessoCnpjNova('');
    setBloqueadaNova(false);
    setErroNova('');
    setModalNova(true);
  };

  const consultarCnpjNova = async (cnpjDigits) => {
    setErroCnpjNova('');
    setSucessoCnpjNova('');
    setBloqueadaNova(false);
    if (cnpjDigits.length !== 14) {
      setErroCnpjNova('CNPJ deve conter 14 dígitos.');
      return;
    }
    setConsultandoNova(true);
    try {
      const resp = await apiServerClient.fetch(`/cnpj/${cnpjDigits}`);
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 404) {
        setErroCnpjNova(body?.error || 'CNPJ não encontrado na base da Receita Federal.');
        return;
      }
      if (resp.status === 422) {
        setErroCnpjNova(body?.error || 'CNPJ inválido (formato incorreto).');
        return;
      }
      if (!resp.ok) {
        setErroCnpjNova('Não foi possível consultar o CNPJ agora. Tente novamente em instantes.');
        return;
      }
      const situacao = (body.descricao_situacao_cadastral || '').toUpperCase().trim();
      const cnaesSec = Array.isArray(body.cnaes_secundarios)
        ? body.cnaes_secundarios.map((c) => ({ codigo: c?.codigo || '', descricao: c?.descricao || '' }))
        : [];
      setFormNova((prev) => ({
        ...prev,
        cnpj: cnpjDigits,
        razao_social: body.razao_social || prev.razao_social,
        nome_fantasia: body.nome_fantasia || prev.nome_fantasia,
        tipo_empresa: body.natureza_juridica || body.porte || prev.tipo_empresa,
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
        cnae_principal_codigo: body.cnae_fiscal || prev.cnae_principal_codigo,
        cnae_principal_descricao: body.cnae_fiscal_descricao || prev.cnae_principal_descricao,
        cnaes_secundarios: cnaesSec.length ? cnaesSec : prev.cnaes_secundarios,
        natureza_juridica_codigo: body.codigo_natureza_juridica
          ? String(body.codigo_natureza_juridica).slice(0, 20)
          : prev.natureza_juridica_codigo,
        natureza_juridica_descricao:
          body.natureza_juridica || body.natureza_juridica_descricao || prev.natureza_juridica_descricao,
        qsa: construirQsa(body).length ? construirQsa(body) : prev.qsa,
        fonte_dados: 'BrasilAPI',
      }));
      if (['INAPTA', 'BAIXADA', 'SUSPENSA'].includes(situacao)) {
        setBloqueadaNova(true);
        setErroCnpjNova(`Situação cadastral "${situacao}" — esta igreja não pode ser cadastrada.`);
        return;
      }
      setSucessoCnpjNova(situacao ? `Dados encontrados. Situação: ${situacao}.` : 'Dados encontrados.');
    } catch (e) {
      setErroCnpjNova('Não foi possível consultar o CNPJ agora. Tente novamente em instantes.');
    } finally {
      setConsultandoNova(false);
    }
  };

  const onCnpjNovaChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setFormNova((p) => ({ ...p, cnpj: digits }));
    setErroCnpjNova('');
    setSucessoCnpjNova('');
    setBloqueadaNova(false);
    if (digits.length === 14) consultarCnpjNova(digits);
  };

  const salvarNovaIgreja = async (e) => {
    e.preventDefault();
    setErroNova('');
    if (!formNova.razao_social.trim()) {
      setErroNova('Informe a razão social da igreja.');
      return;
    }
    if (!formNova.cnpj || formNova.cnpj.length !== 14) {
      setErroNova('Informe um CNPJ válido de 14 dígitos.');
      return;
    }
    if (bloqueadaNova) {
      setErroNova('Situação cadastral bloqueada.');
      return;
    }
    setSalvandoNova(true);
    try {
      const payload = {
        tipo: 'igreja',
        cnpj: formNova.cnpj,
        razao_social: formNova.razao_social,
        nome_fantasia: formNova.nome_fantasia,
        tipo_empresa: formNova.tipo_empresa,
        data_abertura: formNova.data_abertura || null,
        situacao_cadastral: formNova.situacao_cadastral,
        logradouro: formNova.logradouro,
        numero: formNova.numero,
        complemento: formNova.complemento,
        bairro: formNova.bairro,
        cidade: formNova.cidade,
        estado: formNova.estado,
        cep: formNova.cep,
        telefone: formNova.telefone,
        email: formNova.email || null,
        website: formNova.website || null,
        descricao: formNova.descricao,
        cnae_principal_codigo: formNova.cnae_principal_codigo || null,
        cnae_principal_descricao: formNova.cnae_principal_descricao || null,
        cnaes_secundarios: formNova.cnaes_secundarios || [],
        natureza_juridica_codigo: (formNova.natureza_juridica_codigo || '').slice(0, 20) || null,
        natureza_juridica_descricao: formNova.natureza_juridica_descricao || null,
        qsa: formNova.qsa || [],
        cargo_representante: formNova.cargo_representante || null,
        ramo_atividade: formNova.ramo_atividade || null,
        numero_funcionarios: formNova.numero_funcionarios || null,
        visibilidade: formNova.visibilidade || 'privado',
        visibilidade_perfil: formNova.visibilidade_perfil || 'membros',
        status: 'rascunho',
        status_aprovacao: 'aguardando_aprovacao',
        fonte_dados: formNova.fonte_dados || null,
      };
      await pb.collection('empresas').create(payload);
      setModalNova(false);
      setSucesso('Igreja cadastrada com status "Aguardando aprovação".');
      setPagina(1);
      carregar();
    } catch (e) {
      setErroNova(e?.response?.message || 'Não foi possível cadastrar a igreja agora.');
    } finally {
      setSalvandoNova(false);
    }
  };

  // ---- Vínculo de usuários ----
  const buscarUsuario = async () => {
    setErroAddUser('');
    setUserEncontrado(null);
    const termo = buscaEmail.trim();
    if (!termo) return;
    setBuscandoUser(true);
    try {
      // Busca por e-mail ou nome de usuário.
      const lista = await pb.collection('users').getFirstListItem(
        pb.filter('email = {:t} || username = {:t}', { t: termo }),
      ).catch(() => null);
      if (!lista) {
        setErroAddUser('Usuário não encontrado com esse e-mail ou nome de usuário.');
        return;
      }
      setUserEncontrado(lista);
    } catch (e) {
      setErroAddUser('Usuário não encontrado.');
    } finally {
      setBuscandoUser(false);
    }
  };

  const confirmarAddUser = async () => {
    if (!userEncontrado || !detalhe) return;
    setErroAddUser('');
    // Validação: usuário já vinculado a outra igreja?
    const atual = Array.isArray(userEncontrado.igreja_id) ? userEncontrado.igreja_id[0] : userEncontrado.igreja_id;
    if (atual && atual !== detalhe.id) {
      setErroAddUser('Este usuário já está vinculado a outra igreja. Remova o vínculo anterior antes de vinculá-lo aqui.');
      return;
    }
    setSalvandoAddUser(true);
    try {
      await pb.collection('users').update(userEncontrado.id, {
        igreja_id: detalhe.id,
        papel: papelNovoUser,
      });
      setModalAddUser(false);
      setBuscaEmail('');
      setUserEncontrado(null);
      setPapelNovoUser('membro');
      carregarUsuarios(detalhe.id);
      setSucesso('Usuário vinculado à igreja.');
    } catch (e) {
      setErroAddUser(e?.response?.message || 'Não foi possível vincular o usuário.');
    } finally {
      setSalvandoAddUser(false);
    }
  };

  const removerUsuario = async (user) => {
    if (!detalhe) return;
    if (!window.confirm(`Remover o vínculo de ${user.name || user.email} com esta igreja?`)) return;
    try {
      await pb.collection('users').update(user.id, {
        igreja_id: null,
        papel: 'membro',
      });
      carregarUsuarios(detalhe.id);
      setSucesso('Vínculo removido.');
    } catch (e) {
      setErro(e?.response?.message || 'Não foi possível remover o vínculo.');
    }
  };

  const abrirAlterarPapel = (user) => {
    setModalPapel({ user });
    setPapelEdit(user.papel || 'membro');
  };

  const salvarPapel = async () => {
    if (!modalPapel) return;
    setSalvandoPapel(true);
    try {
      await pb.collection('users').update(modalPapel.user.id, { papel: papelEdit });
      setModalPapel(null);
      carregarUsuarios(detalhe.id);
      setSucesso('Papel do usuário atualizado.');
    } catch (e) {
      setErro(e?.response?.message || 'Não foi possível alterar o papel.');
    } finally {
      setSalvandoPapel(false);
    }
  };

  // ---- Excluir cadastro ----
  const abrirModalExcluir = (empresa) => {
    setErroExcluir('');
    setConfirmaExcluir(false);
    setMotivoExcluir('');
    setModalExcluir(empresa);
  };

  const confirmarExcluir = async (e) => {
    e.preventDefault();
    if (!modalExcluir) return;
    if (!confirmaExcluir) {
      setErroExcluir('Marque a caixa confirmando que a exclusão é permanente.');
      return;
    }
    if (!motivoExcluir.trim()) {
      setErroExcluir('Informe o motivo da exclusão (obrigatório).');
      return;
    }
    setSalvandoExcluir(true);
    setErroExcluir('');
    try {
      // Registra a ação de exclusão (responsável, data, motivo) no histórico
      // de auditoria antes de remover o cadastro.
      await registrarAcao(modalExcluir, 'excluido', motivoExcluir.trim());
      await pb.collection('empresas').delete(modalExcluir.id);
      setItems((prev) => prev.filter((it) => it.id !== modalExcluir.id));
      setDetalhe((d) => (d && d.id === modalExcluir.id ? null : d));
      setSucesso(`Cadastro de "${modalExcluir.razao_social || modalExcluir.nome_fantasia}" excluído permanentemente.`);
      setModalExcluir(null);
    } catch (e) {
      setErroExcluir(e?.response?.message || 'Não foi possível excluir o cadastro agora.');
    } finally {
      setSalvandoExcluir(false);
    }
  };

  const botoesAcao = (empresa) => {
    const st = empresa.status_aprovacao;
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => abrirDetalhe(empresa)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <Eye size={13} /> Detalhes
        </button>
        {st !== 'aprovado' && (
          <button
            type="button"
            onClick={() => aprovar(empresa)}
            disabled={processandoId === empresa.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
          >
            {processandoId === empresa.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Aprovar
          </button>
        )}
        {st !== 'nao_aprovado' && (
          <button
            type="button"
            onClick={() => abrirModalAcao(empresa, 'nao_aprovado')}
            disabled={processandoId === empresa.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
          >
            <XCircle size={13} /> Não aprovar
          </button>
        )}
        {st !== 'suspenso' && (
          <button
            type="button"
            onClick={() => abrirModalAcao(empresa, 'suspenso')}
            disabled={processandoId === empresa.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            <PauseCircle size={13} /> Suspender
          </button>
        )}
        <button
          type="button"
          onClick={() => abrirModalExcluir(empresa)}
          disabled={processandoId === empresa.id}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
        >
          <Trash2 size={13} /> Excluir
        </button>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Cadastro de Igrejas | Administração Conexão Batista</title>
        <meta name="description" content="Gerenciamento de cadastros de igrejas." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Administração</p>
            <h1 className="font-display text-3xl font-bold text-primary">Cadastro de Igrejas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalItems} igreja(s) cadastrada(s)
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Lock size={12} /> Apenas cadastros públicos aparecem nas áreas públicas
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={abrirNovaIgreja}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} /> Nova igreja
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CNPJ, cidade ou estado"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os status</option>
            <option value="aguardando_aprovacao">Aguardando aprovação</option>
            <option value="aprovado">Aprovado</option>
            <option value="nao_aprovado">Não aprovado</option>
            <option value="suspenso">Suspenso</option>
          </select>
          <select
            value={filtroVisibilidade}
            onChange={(e) => setFiltroVisibilidade(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="todas">Toda visibilidade</option>
            <option value="publico">Público</option>
            <option value="privado">Privado</option>
            <option value="oculto">Oculto</option>
          </select>
        </div>

        {erro && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}
        {sucesso && !erro && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{sucesso}</span>
          </div>
        )}

        {/* Tabela */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" /> Carregando igrejas…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Church size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">
                Nenhuma igreja encontrada com esses filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Igreja</th>
                    <th className="hidden px-4 py-3 font-bold md:table-cell">Responsável</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Cidade/UF</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="hidden px-4 py-3 font-bold lg:table-cell">Visibilidade</th>
                    <th className="px-4 py-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((s) => {
                    const st = STATUS_APROVACAO[s.status_aprovacao] || STATUS_APROVACAO.aguardando_aprovacao;
                    const StIcon = st.icon;
                    const vis = VISIBILIDADE[s.visibilidade] || VISIBILIDADE.privado;
                    const VisIcon = vis.icon;
                    return (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{s.razao_social || s.nome_fantasia || '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.cnpj ? `CNPJ ${s.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}` : '—'}
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          <div className="font-semibold text-foreground">{nomeUsuario(s)}</div>
                          <div className="text-xs">{s.cargo_representante || emailUsuario(s)}</div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {s.cidade || '—'}{s.estado ? `/${s.estado}` : ''}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                            <StIcon size={12} /> {st.label}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${vis.className}`}>
                            <VisIcon size={12} /> {vis.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{botoesAcao(s)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {!loading && items.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Página {pagina} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}
                disabled={pagina >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-semibold text-foreground disabled:opacity-40 hover:bg-muted"
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal de detalhes / edição */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                  <Church size={18} />
                </span>
                <h3 className="font-display text-lg font-bold text-primary">Detalhes da igreja</h3>
              </div>
              <div className="flex items-center gap-2">
                {!editando && (
                  <button
                    type="button"
                    onClick={() => setEditando(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    <Save size={13} /> Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetalhe(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {editando ? (
              <form onSubmit={salvarEdicao} className="space-y-4 text-sm">
                <div className="space-y-5">
                  {/* Dados cadastrais */}
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Dados cadastrais</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Razão social</label>
                        <input className={inputClass} value={formEdit.razao_social} onChange={(e) => setFormEdit((p) => ({ ...p, razao_social: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Nome fantasia</label>
                        <input className={inputClass} value={formEdit.nome_fantasia} onChange={(e) => setFormEdit((p) => ({ ...p, nome_fantasia: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Tipo / natureza jurídica</label>
                        <input className={inputClass} value={formEdit.tipo_empresa} onChange={(e) => setFormEdit((p) => ({ ...p, tipo_empresa: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Data de abertura</label>
                        <input type="date" className={inputClass} value={formEdit.data_abertura || ''} onChange={(e) => setFormEdit((p) => ({ ...p, data_abertura: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Situação cadastral</label>
                        <input className={inputClass} value={formEdit.situacao_cadastral} onChange={(e) => setFormEdit((p) => ({ ...p, situacao_cadastral: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Endereço</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Logradouro</label>
                        <input className={inputClass} value={formEdit.logradouro} onChange={(e) => setFormEdit((p) => ({ ...p, logradouro: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Número</label>
                        <input className={inputClass} value={formEdit.numero} onChange={(e) => setFormEdit((p) => ({ ...p, numero: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Complemento</label>
                        <input className={inputClass} value={formEdit.complemento} onChange={(e) => setFormEdit((p) => ({ ...p, complemento: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Bairro</label>
                        <input className={inputClass} value={formEdit.bairro} onChange={(e) => setFormEdit((p) => ({ ...p, bairro: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>CEP</label>
                        <input className={inputClass} value={formEdit.cep} onChange={(e) => setFormEdit((p) => ({ ...p, cep: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Estado</label>
                        <input className={inputClass} value={formEdit.estado} onChange={(e) => setFormEdit((p) => ({ ...p, estado: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Cidade</label>
                        <input className={inputClass} value={formEdit.cidade} onChange={(e) => setFormEdit((p) => ({ ...p, cidade: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  {/* Contato e descrição */}
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Contato e descrição</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Telefone</label>
                        <input className={inputClass} value={formEdit.telefone} onChange={(e) => setFormEdit((p) => ({ ...p, telefone: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>E-mail</label>
                        <input type="email" className={inputClass} value={formEdit.email} onChange={(e) => setFormEdit((p) => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Website</label>
                        <input type="url" className={inputClass} value={formEdit.website} onChange={(e) => setFormEdit((p) => ({ ...p, website: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Ramo de atividade</label>
                        <input className={inputClass} value={formEdit.ramo_atividade} onChange={(e) => setFormEdit((p) => ({ ...p, ramo_atividade: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Número de funcionários</label>
                        <select className={inputClass} value={formEdit.numero_funcionarios} onChange={(e) => setFormEdit((p) => ({ ...p, numero_funcionarios: e.target.value }))}>
                          {NUM_FUNC.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Descrição</label>
                        <textarea rows={3} className={inputClass} value={formEdit.descricao} onChange={(e) => setFormEdit((p) => ({ ...p, descricao: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  {/* Dados da igreja (Receita Federal) */}
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Dados da igreja (Receita Federal)</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Atividade principal — código</label>
                        <input className={inputClass} value={formEdit.cnae_principal_codigo} onChange={(e) => setFormEdit((p) => ({ ...p, cnae_principal_codigo: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Atividade principal — descrição</label>
                        <input className={inputClass} value={formEdit.cnae_principal_descricao} onChange={(e) => setFormEdit((p) => ({ ...p, cnae_principal_descricao: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Natureza jurídica — código</label>
                        <input className={inputClass} value={formEdit.natureza_juridica_codigo} onChange={(e) => setFormEdit((p) => ({ ...p, natureza_juridica_codigo: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Natureza jurídica — descrição</label>
                        <input className={inputClass} value={formEdit.natureza_juridica_descricao} onChange={(e) => setFormEdit((p) => ({ ...p, natureza_juridica_descricao: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Cargo do representante</label>
                        <select className={inputClass} value={formEdit.cargo_representante} onChange={(e) => setFormEdit((p) => ({ ...p, cargo_representante: e.target.value }))}>
                          {CARGO_REPRESENTANTE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Visibilidade */}
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Visibilidade</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Visibilidade nas áreas públicas</label>
                        <select className={inputClass} value={formEdit.visibilidade} onChange={(e) => setFormEdit((p) => ({ ...p, visibilidade: e.target.value }))}>
                          <option value="publico">Público</option>
                          <option value="privado">Privado</option>
                          <option value="oculto">Oculto</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Visibilidade do perfil</label>
                        <select className={inputClass} value={formEdit.visibilidade_perfil} onChange={(e) => setFormEdit((p) => ({ ...p, visibilidade_perfil: e.target.value }))}>
                          {VISIBILIDADE_PERFIL.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditando(false)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40">
                    Cancelar
                  </button>
                  <button type="submit" disabled={salvandoEdicao} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {salvandoEdicao ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                  </button>
                </div>
              </form>
            ) : (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Razão social / Nome fantasia</dt>
                  <dd className="font-semibold text-foreground">{detalhe.razao_social || '—'}</dd>
                  <dd className="text-muted-foreground">{detalhe.nome_fantasia || '—'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CNPJ</dt>
                    <dd className="text-foreground">{detalhe.cnpj ? detalhe.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Situação cadastral</dt>
                    <dd className="text-foreground">{detalhe.situacao_cadastral || '—'}</dd>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cidade/UF</dt>
                    <dd className="text-foreground">{detalhe.cidade || '—'}{detalhe.estado ? `/${detalhe.estado}` : ''}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone / E-mail</dt>
                    <dd className="text-foreground">{detalhe.telefone || '—'}</dd>
                    <dd className="text-xs text-muted-foreground">{detalhe.email || '—'}</dd>
                  </div>
                </div>

                {/* Dados econômicos/jurídicos (BrasilAPI) */}
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <ShieldOff size={14} /> Dados da Receita Federal
                    {detalhe.fonte_dados && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Fonte: {detalhe.fonte_dados}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground">Atividade principal: </span>
                      <span className="text-foreground">
                        {detalhe.cnae_principal_codigo ? `${detalhe.cnae_principal_codigo} — ` : ''}
                        {detalhe.cnae_principal_descricao || 'Não informado'}
                      </span>
                    </div>
                    {Array.isArray(detalhe.cnaes_secundarios) && detalhe.cnaes_secundarios.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground">Atividades secundárias:</span>
                        <ul className="mt-1 space-y-0.5">
                          {detalhe.cnaes_secundarios.map((c, i) => (
                            <li key={i} className="text-foreground">
                              <span className="font-mono text-xs">{c.codigo || '—'}</span> — {c.descricao || '—'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground">Natureza jurídica: </span>
                      <span className="text-foreground">
                        {detalhe.natureza_juridica_codigo ? `${detalhe.natureza_juridica_codigo} — ` : ''}
                        {detalhe.natureza_juridica_descricao || 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QSA */}
                {Array.isArray(detalhe.qsa) && detalhe.qsa.length > 0 && (
                  <div>
                    <dt className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">QSA — Sócios e administradores</dt>
                    <dd className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-bold">Nome</th>
                            <th className="hidden px-3 py-2 font-bold sm:table-cell">Documento</th>
                            <th className="px-3 py-2 font-bold">Cargo</th>
                            <th className="hidden px-3 py-2 font-bold sm:table-cell">Período</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-white">
                          {detalhe.qsa.map((p, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 font-semibold text-foreground">{p.nome || '—'}</td>
                              <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">{p.documento || '—'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{p.cargo || '—'}</td>
                              <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                                {p.data_inicio || '—'}{p.data_fim ? ` até ${p.data_fim}` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </dd>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status de aprovação</dt>
                    <dd>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${(STATUS_APROVACAO[detalhe.status_aprovacao] || STATUS_APROVACAO.aguardando_aprovacao).className}`}>
                        {(STATUS_APROVACAO[detalhe.status_aprovacao] || STATUS_APROVACAO.aguardando_aprovacao).label}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visibilidade</dt>
                    <dd>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${(VISIBILIDADE[detalhe.visibilidade] || VISIBILIDADE.privado).className}`}>
                        {(VISIBILIDADE[detalhe.visibilidade] || VISIBILIDADE.privado).label}
                      </span>
                    </dd>
                  </div>
                </div>

                {/* Usuários vinculados */}
                <div className="mt-2 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Users size={14} /> Usuários vinculados ({usuariosVinculados.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => { setModalAddUser(true); setBuscaEmail(''); setUserEncontrado(null); setPapelNovoUser('membro'); setErroAddUser(''); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
                    >
                      <UserPlus size={13} /> Adicionar usuário
                    </button>
                  </div>
                  {carregandoUsuarios ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" /> Carregando…
                    </div>
                  ) : usuariosVinculados.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum usuário vinculado a esta igreja ainda.</p>
                  ) : (
                    <ul className="space-y-2">
                      {usuariosVinculados.map((u) => (
                        <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{u.name || '—'}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email || '—'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                              {PAPEL_LABEL[u.papel] || u.papel || '—'}
                            </span>
                            <button
                              type="button"
                              onClick={() => abrirAlterarPapel(u)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-border text-foreground hover:bg-muted"
                              title="Alterar papel"
                            >
                              <UserCog size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removerUsuario(u)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-destructive/30 text-destructive hover:bg-destructive/5"
                              title="Remover vínculo"
                            >
                              <UserX size={13} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    O vínculo de usuários é separado dos dados cadastrais da igreja. Uma igreja pode ter vários usuários (pastor, secretário, membros); cada usuário só pode estar vinculado a uma igreja.
                  </p>
                </div>

                {/* Histórico de ações */}
                <div className="mt-2 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <History size={14} /> Histórico de ações
                  </div>
                  {carregandoHist ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" /> Carregando…
                    </div>
                  ) : historico.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma ação registrada.</p>
                  ) : (
                    <ul className="space-y-2">
                      {historico.map((h) => {
                        const novo = STATUS_APROVACAO[h.status_novo] || { label: h.status_novo, className: 'border-border bg-muted text-muted-foreground' };
                        return (
                          <li key={h.id} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${novo.className}`}>
                                {novo.label}
                              </span>
                              <span className="text-xs text-muted-foreground">{formatarData(h.data_acao)}</span>
                            </div>
                            {h.justificativa && <p className="mt-1.5 text-foreground">{h.justificativa}</p>}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Por: {h.expand?.usuario_admin_id?.name || h.expand?.usuario_admin_id?.username || 'Administrador'}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </dl>
            )}

            {!editando && (
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                {detalhe.status_aprovacao !== 'aprovado' && (
                  <button
                    type="button"
                    onClick={() => aprovar(detalhe)}
                    disabled={processandoId === detalhe.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-100 disabled:opacity-60"
                  >
                    {processandoId === detalhe.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Aprovar
                  </button>
                )}
                {detalhe.status_aprovacao !== 'nao_aprovado' && (
                  <button
                    type="button"
                    onClick={() => { setDetalhe(null); abrirModalAcao(detalhe, 'nao_aprovado'); }}
                    className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/5"
                  >
                    <XCircle size={16} /> Não aprovar
                  </button>
                )}
                {detalhe.status_aprovacao !== 'suspenso' && (
                  <button
                    type="button"
                    onClick={() => { setDetalhe(null); abrirModalAcao(detalhe, 'suspenso'); }}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted"
                  >
                    <PauseCircle size={16} /> Suspender
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setDetalhe(null); abrirModalExcluir(detalhe); }}
                  className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/5"
                >
                  <Trash2 size={16} /> Excluir cadastro
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Excluir cadastro */}
      {modalExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 size={18} />
                </span>
                <h3 className="font-display text-lg font-bold text-primary">Excluir cadastro</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalExcluir(null)}
                disabled={salvandoExcluir}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <p className="font-bold">A exclusão é permanente e não pode ser desfeita.</p>
              <p className="mt-1">
                Você está prestes a excluir o cadastro de{' '}
                <strong>{modalExcluir.razao_social || modalExcluir.nome_fantasia}</strong>
                {modalExcluir.cnpj ? ` (CNPJ ${formatCnpj(modalExcluir.cnpj)})` : ''}.
                Todos os dados vinculados serão removidos.
              </p>
            </div>

            <form onSubmit={confirmarExcluir} className="space-y-4">
              <div>
                <label className={labelClass}>Motivo da exclusão *</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="Ex.: Cadastro duplicado, erro de preenchimento, solicitação…"
                  value={motivoExcluir}
                  onChange={(e) => setMotivoExcluir(e.target.value)}
                  required
                />
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-input text-destructive"
                  checked={confirmaExcluir}
                  onChange={(e) => setConfirmaExcluir(e.target.checked)}
                />
                <span className="font-semibold leading-relaxed text-foreground">
                  Confirmo que entendo que a exclusão é permanente e não pode ser desfeita, e desejo prosseguir.
                </span>
              </label>

              {erroExcluir && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{erroExcluir}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalExcluir(null)}
                  disabled={salvandoExcluir}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoExcluir || !confirmaExcluir}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-6 py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
                >
                  {salvandoExcluir ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Excluir permanentemente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Igreja */}
      {modalNova && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                  <Plus size={18} />
                </span>
                <h3 className="font-display text-lg font-bold text-primary">Cadastrar nova igreja</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNova(false)}
                disabled={salvandoNova}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarNovaIgreja} className="space-y-4 text-sm">
              <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-foreground">
                A igreja é cadastrada de forma independente, sem usuário responsável. Após o cadastro, você poderá vincular usuários (pastor, secretário, membros) na tela de detalhes.
              </p>

              {/* CNPJ */}
              <div>
                <label className={labelClass}>CNPJ *</label>
                <div className="relative">
                  <input
                    inputMode="numeric"
                    className={inputClass}
                    placeholder="00.000.000/0000-00"
                    value={formatCnpj(formNova.cnpj)}
                    onChange={onCnpjNovaChange}
                    disabled={consultandoNova}
                  />
                  {consultandoNova && (
                    <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">A consulta acontece automaticamente ao digitar os 14 dígitos.</p>
                {sucessoCnpjNova && !bloqueadaNova && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {sucessoCnpjNova}
                  </div>
                )}
                {erroCnpjNova && (
                  <div className={`mt-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${bloqueadaNova ? 'border border-red-300 bg-red-50 text-red-800' : 'border border-amber-200 bg-amber-50 text-amber-800'}`}>
                    {bloqueadaNova ? <Ban size={15} className="mt-0.5 shrink-0" /> : <AlertCircle size={15} className="mt-0.5 shrink-0" />} {erroCnpjNova}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {/* Dados cadastrais */}
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Dados cadastrais</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Razão social *</label>
                      <input className={inputClass} value={formNova.razao_social} onChange={(e) => setFormNova((p) => ({ ...p, razao_social: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Nome fantasia</label>
                      <input className={inputClass} value={formNova.nome_fantasia} onChange={(e) => setFormNova((p) => ({ ...p, nome_fantasia: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Tipo / natureza jurídica</label>
                      <input className={inputClass} value={formNova.tipo_empresa} onChange={(e) => setFormNova((p) => ({ ...p, tipo_empresa: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Data de abertura</label>
                      <input type="date" className={inputClass} value={formNova.data_abertura || ''} onChange={(e) => setFormNova((p) => ({ ...p, data_abertura: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Situação cadastral</label>
                      <input className={inputClass} value={formNova.situacao_cadastral} onChange={(e) => setFormNova((p) => ({ ...p, situacao_cadastral: e.target.value }))} />
                      <p className="mt-1 text-xs text-muted-foreground">Igrejas com situação INAPTA, BAIXADA ou SUSPENSA não podem ser cadastradas.</p>
                    </div>
                  </div>
                </div>

                {/* Dados da igreja (Receita Federal) */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">Dados da igreja (Receita Federal)</p>
                    {formNova.fonte_dados && (
                      <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        <ShieldCheck size={11} /> Fonte: {formNova.fonte_dados}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Atividade principal — código</label>
                      <input className={inputClass} value={formNova.cnae_principal_codigo} onChange={(e) => setFormNova((p) => ({ ...p, cnae_principal_codigo: e.target.value }))} placeholder="Ex.: 9491-0/00" />
                    </div>
                    <div>
                      <label className={labelClass}>Atividade principal — descrição</label>
                      <input className={inputClass} value={formNova.cnae_principal_descricao} onChange={(e) => setFormNova((p) => ({ ...p, cnae_principal_descricao: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Atividades secundárias</label>
                      {formNova.cnaes_secundarios.length > 0 ? (
                        <ul className="space-y-1.5 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                          {formNova.cnaes_secundarios.map((c, i) => (
                            <li key={i} className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">{c.codigo || '—'}</span>
                              <span className="text-foreground">{c.descricao || '—'}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">Nenhuma atividade secundária retornada pela BrasilAPI para este CNPJ.</p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Natureza jurídica — código</label>
                      <input className={inputClass} value={formNova.natureza_juridica_codigo} onChange={(e) => setFormNova((p) => ({ ...p, natureza_juridica_codigo: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Natureza jurídica — descrição</label>
                      <input className={inputClass} value={formNova.natureza_juridica_descricao} onChange={(e) => setFormNova((p) => ({ ...p, natureza_juridica_descricao: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>QSA — Quadro de sócios e administradores</label>
                      {formNova.qsa.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-border">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 font-bold">Nome</th>
                                <th className="hidden px-3 py-2 font-bold sm:table-cell">Documento</th>
                                <th className="px-3 py-2 font-bold">Cargo</th>
                                <th className="hidden px-3 py-2 font-bold sm:table-cell">Período</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-white">
                              {formNova.qsa.map((p, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2 font-semibold text-foreground">{p.nome || '—'}</td>
                                  <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">{p.documento || '—'}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{p.cargo || '—'}</td>
                                  <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">{p.data_inicio || '—'}{p.data_fim ? ` até ${p.data_fim}` : ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">Nenhum sócio ou administrador retornado pela BrasilAPI para este CNPJ.</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Cargo do representante</label>
                      <select className={inputClass} value={formNova.cargo_representante} onChange={(e) => setFormNova((p) => ({ ...p, cargo_representante: e.target.value }))}>
                        {CARGO_REPRESENTANTE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Endereço</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Logradouro</label>
                      <input className={inputClass} value={formNova.logradouro} onChange={(e) => setFormNova((p) => ({ ...p, logradouro: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Número</label>
                      <input className={inputClass} value={formNova.numero} onChange={(e) => setFormNova((p) => ({ ...p, numero: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Complemento</label>
                      <input className={inputClass} value={formNova.complemento} onChange={(e) => setFormNova((p) => ({ ...p, complemento: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Bairro</label>
                      <input className={inputClass} value={formNova.bairro} onChange={(e) => setFormNova((p) => ({ ...p, bairro: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>CEP</label>
                      <input className={inputClass} value={formNova.cep} onChange={(e) => setFormNova((p) => ({ ...p, cep: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Estado</label>
                      <input className={inputClass} value={formNova.estado} onChange={(e) => setFormNova((p) => ({ ...p, estado: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Cidade</label>
                      <input className={inputClass} value={formNova.cidade} onChange={(e) => setFormNova((p) => ({ ...p, cidade: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Contato e descrição */}
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Contato e descrição</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Telefone</label>
                      <input className={inputClass} value={formNova.telefone} onChange={(e) => setFormNova((p) => ({ ...p, telefone: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>E-mail</label>
                      <input type="email" className={inputClass} value={formNova.email} onChange={(e) => setFormNova((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Website</label>
                      <input type="url" className={inputClass} value={formNova.website} onChange={(e) => setFormNova((p) => ({ ...p, website: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Ramo de atividade</label>
                      <input className={inputClass} value={formNova.ramo_atividade} onChange={(e) => setFormNova((p) => ({ ...p, ramo_atividade: e.target.value }))} placeholder="Ex.: Templo religioso, Assistência social…" />
                    </div>
                    <div>
                      <label className={labelClass}>Número de funcionários</label>
                      <select className={inputClass} value={formNova.numero_funcionarios} onChange={(e) => setFormNova((p) => ({ ...p, numero_funcionarios: e.target.value }))}>
                        {NUM_FUNC.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Descrição</label>
                      <textarea rows={3} className={inputClass} value={formNova.descricao} onChange={(e) => setFormNova((p) => ({ ...p, descricao: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Visibilidade */}
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">Visibilidade</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Visibilidade nas áreas públicas</label>
                      <select className={inputClass} value={formNova.visibilidade} onChange={(e) => setFormNova((p) => ({ ...p, visibilidade: e.target.value }))}>
                        <option value="privado">Privado</option>
                        <option value="publico">Público</option>
                        <option value="oculto">Oculto</option>
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">Apenas cadastros <strong>Público</strong> aparecem nas áreas públicas do portal.</p>
                    </div>
                    <div>
                      <label className={labelClass}>Visibilidade do perfil</label>
                      <select className={inputClass} value={formNova.visibilidade_perfil} onChange={(e) => setFormNova((p) => ({ ...p, visibilidade_perfil: e.target.value }))}>
                        {VISIBILIDADE_PERFIL.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {erroNova && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" /> {erroNova}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalNova(false)} disabled={salvandoNova}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={salvandoNova || bloqueadaNova}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {salvandoNova ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Cadastrar igreja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar usuário */}
      {modalAddUser && detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                  <UserPlus size={18} />
                </span>
                <h3 className="font-display text-lg font-bold text-primary">Vincular usuário</h3>
              </div>
              <button type="button" onClick={() => setModalAddUser(false)} disabled={salvandoAddUser}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Vincule um usuário existente à igreja <strong className="text-foreground">{detalhe.razao_social || detalhe.nome_fantasia}</strong>. O usuário só pode estar vinculado a uma igreja por vez.
            </p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>E-mail ou nome de usuário</label>
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="email@exemplo.com ou usuario"
                    value={buscaEmail}
                    onChange={(e) => setBuscaEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarUsuario(); } }}
                  />
                  <button type="button" onClick={buscarUsuario} disabled={buscandoUser}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60">
                    {buscandoUser ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Buscar
                  </button>
                </div>
              </div>

              {userEncontrado && (
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                  <p className="font-semibold text-foreground">{userEncontrado.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{userEncontrado.email || '—'}</p>
                  {(() => {
                    const atual = Array.isArray(userEncontrado.igreja_id) ? userEncontrado.igreja_id[0] : userEncontrado.igreja_id;
                    return atual && atual !== detalhe.id ? (
                      <p className="mt-1 text-xs font-semibold text-amber-700">Já vinculado a outra igreja.</p>
                    ) : null;
                  })()}
                </div>
              )}

              <div>
                <label className={labelClass}>Papel</label>
                <select className={inputClass} value={papelNovoUser} onChange={(e) => setPapelNovoUser(e.target.value)}>
                  {PAPEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {erroAddUser && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" /> {erroAddUser}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModalAddUser(false)} disabled={salvandoAddUser}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50">
                  Cancelar
                </button>
                <button type="button" onClick={confirmarAddUser} disabled={salvandoAddUser || !userEncontrado}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {salvandoAddUser ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Vincular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alterar papel */}
      {modalPapel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                  <UserCog size={18} />
                </span>
                <h3 className="font-display text-lg font-bold text-primary">Alterar papel</h3>
              </div>
              <button type="button" onClick={() => setModalPapel(null)} disabled={salvandoPapel}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Alterar o papel de <strong className="text-foreground">{modalPapel.user.name || modalPapel.user.email}</strong> nesta igreja.
            </p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Novo papel</label>
                <select className={inputClass} value={papelEdit} onChange={(e) => setPapelEdit(e.target.value)}>
                  {PAPEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setModalPapel(null)} disabled={salvandoPapel}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50">
                  Cancelar
                </button>
                <button type="button" onClick={salvarPapel} disabled={salvandoPapel}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {salvandoPapel ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ação (não aprovar / suspender) */}
      {modalAcao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  {modalAcao.statusNovo === 'suspenso' ? <PauseCircle size={18} /> : <XCircle size={18} />}
                </span>
                <h3 className="font-display text-lg font-bold text-primary">{modalAcao.titulo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAcao(null)}
                disabled={salvandoAcao}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Você está alterando a igreja <strong className="text-foreground">{modalAcao.empresa.razao_social || modalAcao.empresa.nome_fantasia}</strong>.
              Informe o motivo — ele será registrado com responsável, data, status e justificativa.
            </p>

            <form onSubmit={confirmarAcao} className="space-y-4">
              <div>
                <label className={labelClass}>Motivo *</label>
                <textarea
                  rows={4}
                  className={inputClass}
                  placeholder="Ex.: Documentação pendente, informações inconsistentes…"
                  value={modalAcao.motivo}
                  onChange={(e) => setModalAcao((prev) => (prev ? { ...prev, motivo: e.target.value } : prev))}
                  required
                />
              </div>

              {erroAcao && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{erroAcao}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAcao(null)}
                  disabled={salvandoAcao}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAcao}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-6 py-2.5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
                >
                  {salvandoAcao ? <Loader2 size={16} className="animate-spin" /> : (modalAcao.statusNovo === 'suspenso' ? <PauseCircle size={16} /> : <XCircle size={16} />)}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
