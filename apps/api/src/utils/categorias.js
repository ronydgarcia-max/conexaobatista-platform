// Lista CANÔNICA de categorias dos cursos — "Cursos Conexão Batista".
//
// Esta é a única fonte de verdade para os nomes de categoria exibidos no
// filtro do site e validados na criação/atualização de cursos. Os nomes estão
// em formato título (com acentos e "&" onde faz sentido) e cada um possui um
// slug estável para uso em URLs/chaves.
//
// O mesmo conteúdo deve ser replicado na VPS (projeto cursos-api,
// src/utils/categorias.js) para que site e backend permaneçam alinhados.
// Enquanto a migração dos 3 cursos existentes na VPS não é executada, o
// proxy /cursos-publicados normaliza os nomes antigos via
// CATEGORIA_LEGACY_MAP abaixo, de forma que o site já exibe as categorias
// canônicas imediatamente.

export const CATEGORIAS = [
  { nome: 'Programação/Desenvolvimento', slug: 'programacao-desenvolvimento' },
  { nome: 'Informática Básica', slug: 'informatica-basica' },
  { nome: 'Sistemas Operacionais', slug: 'sistemas-operacionais' },
  { nome: 'Automação / Manutenção / Robótica', slug: 'automacao-manutencao-robotica' },
  { nome: 'Design / Modelagem / Edição', slug: 'design-modelagem-edicao' },
  { nome: 'Tecnologia / Digital / Web', slug: 'tecnologia-digital-web' },
  { nome: 'Pacote Office, Produtividade e Escritório', slug: 'pacote-office-produtividade-escritorio' },
  { nome: 'Dados e Inteligência Artificial', slug: 'dados-inteligencia-artificial' },
  { nome: 'Administração Geral', slug: 'administracao-geral' },
  { nome: 'Departamento Financeiro / Contábil', slug: 'departamento-financeiro-contabil' },
  { nome: 'Bancos, Mercado e Investimentos', slug: 'bancos-mercado-investimentos' },
  { nome: 'Vendas e Atendimento', slug: 'vendas-atendimento' },
  { nome: 'Comércio e Negócios Digitais', slug: 'comercio-negocios-digitais' },
  { nome: 'Comércio & Serviços Operacionais', slug: 'comercio-servicos-operacionais' },
  { nome: 'Marketing Digital', slug: 'marketing-digital' },
  { nome: 'Comunicação e Jornalismo', slug: 'comunicacao-jornalismo' },
  { nome: 'Estética & Beleza', slug: 'estetica-beleza' },
  { nome: 'Saúde', slug: 'saude' },
  { nome: 'Indústria / Operação de Máquinas', slug: 'industria-operacao-maquinas' },
  { nome: 'Eletricidade e Sistemas Industriais', slug: 'eletricidade-sistemas-industriais' },
  { nome: 'Segurança do Trabalho (Normas NR)', slug: 'seguranca-trabalho-normas-nr' },
  { nome: 'Segurança Operacional', slug: 'seguranca-operacional' },
  { nome: 'Idiomas', slug: 'idiomas' },
  { nome: 'Teologia e Bíblia', slug: 'teologia-biblia' },
  { nome: 'Capacitação Pastoral', slug: 'capacitacao-pastoral' },
  { nome: 'Missões e Evangelismo', slug: 'missoes-evangelismo' },
  { nome: 'Discipulado e Vida Cristã', slug: 'discipulado-vida-crista' },
  { nome: 'Família e Relacionamento', slug: 'familia-relacionamento' },
  { nome: 'Ministério Infantil e de Jovens', slug: 'ministerio-infantil-jovens' },
  { nome: 'Diaconia e Serviço', slug: 'diaconia-servico' },
  { nome: 'Adoração e Louvor', slug: 'adoracao-louvor' },
  { nome: 'Liderança e Administração Eclesiástica', slug: 'lideranca-administracao-eclesiastica' },
  { nome: 'História e Doutrina Batista', slug: 'historia-doutrina-batista' },
];

// Mapa de nomes antigos (pré-migração na VPS) → nomes canônicos.
// Garante que o site já exiba as categorias canônicas mesmo antes da
// migração UPDATE dos 3 cursos existentes ser executada na VPS. Após a
// migração, os nomes já virão canônicos da VPS e este mapa torna-se inócuo.
export const CATEGORIA_LEGACY_MAP = {
  Bíblia: 'Teologia e Bíblia',
  Discipulado: 'Discipulado e Vida Cristã',
  Liderança: 'Liderança e Administração Eclesiástica',
};

// Normaliza um nome de categoria para o nome canônico correspondente.
// Se o nome já for canônico (ou não tiver mapeamento legado), retorna-o
// inalterado (após trim).
export function normalizarCategoria(nome) {
  if (!nome) return '';
  const key = String(nome).trim();
  return CATEGORIA_LEGACY_MAP[key] || key;
}

// Valida se um nome de categoria pertence à lista canônica.
export function categoriaEhValida(nome) {
  if (!nome) return false;
  const key = String(nome).trim();
  return CATEGORIAS.some((c) => c.nome === key);
}
