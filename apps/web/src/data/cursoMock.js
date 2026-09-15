// Dados demonstrativos (mock) para a plataforma de cursos Conexão Batista.
// Nenhuma chamada a API real — apenas dados fictícios para popular a interface.

export const cursos = [
    {
        id: 1,
        img: 'https://images.hostinger.com/b94be402-145f-4813-b749-2d12a2671520.png',
        titulo: 'Liderança Cristã',
        descricao: 'Princípios bíblicos para liderar com integridade, serviço e visão no contexto contemporâneo.',
        instrutor: 'Pr. Elias Moreira',
        duracao: '8 semanas',
        nivel: 'Intermediário',
        categoria: 'Fé',
        preco: 0,
        avaliacao: 4.8,
        alunos: 1240,
    },
    {
        id: 2,
        img: 'https://images.hostinger.com/eb050101-eda1-41e4-b737-b462378b5db0.png',
        titulo: 'Empreendedorismo Bíblico',
        descricao: 'Como construir negócios sólidos com fundamento nos valores do Reino de Deus.',
        instrutor: 'Roberto Cunha',
        duracao: '6 semanas',
        nivel: 'Iniciante',
        categoria: 'Negócios',
        preco: 97,
        avaliacao: 4.9,
        alunos: 860,
    },
    {
        id: 3,
        img: 'https://images.hostinger.com/0d733f6d-1156-4d06-bcd5-0b0ac6f0cb2f.png',
        titulo: 'Comunicação Eficaz',
        descricao: 'Desenvolva habilidades de oratória, escuta ativa e comunicação assertiva para o dia a dia.',
        instrutor: 'Dra. Ana Paula Lima',
        duracao: '4 semanas',
        nivel: 'Iniciante',
        categoria: 'Profissional',
        preco: 0,
        avaliacao: 4.7,
        alunos: 1530,
    },
    {
        id: 4,
        img: 'https://images.hostinger.com/5bb8f3b9-8773-4efd-b643-1471fa81cdaf.png',
        titulo: 'Finanças Pessoais',
        descricao: 'Administração financeira com base em princípios bíblicos: orçamento, poupança e investimento.',
        instrutor: 'Marcelo Souza',
        duracao: '5 semanas',
        nivel: 'Iniciante',
        categoria: 'Negócios',
        preco: 79,
        avaliacao: 4.6,
        alunos: 980,
    },
    {
        id: 5,
        img: 'https://images.hostinger.com/b94be402-145f-4813-b749-2d12a2671520.png',
        titulo: 'Discipulado',
        descricao: 'Fundamentos do discipulado cristão: como fazer discípulos e crescer espiritualmente em comunidade.',
        instrutor: 'Pr. João Ferreira',
        duracao: '10 semanas',
        nivel: 'Iniciante',
        categoria: 'Fé',
        preco: 0,
        avaliacao: 4.9,
        alunos: 2100,
    },
    {
        id: 6,
        img: 'https://images.hostinger.com/0d733f6d-1156-4d06-bcd5-0b0ac6f0cb2f.png',
        titulo: 'Gestão de Equipes',
        descricao: 'Liderança de times em contextos ministeriais e profissionais, com foco em cultura e propósito.',
        instrutor: 'Carla Mendes',
        duracao: '6 semanas',
        nivel: 'Avançado',
        categoria: 'Profissional',
        preco: 147,
        avaliacao: 4.8,
        alunos: 540,
    },
    {
        id: 7,
        img: 'https://images.hostinger.com/eb050101-eda1-41e4-b737-b462378b5db0.png',
        titulo: 'Teologia Sistemática',
        descricao: 'Panorama das principais doutrinas da fé cristã com fundamentação bíblica e histórica.',
        instrutor: 'Pr. Lucas Almeida',
        duracao: '12 semanas',
        nivel: 'Avançado',
        categoria: 'Fé',
        preco: 189,
        avaliacao: 5.0,
        alunos: 720,
    },
    {
        id: 8,
        img: 'https://images.hostinger.com/5bb8f3b9-8773-4efd-b643-1471fa81cdaf.png',
        titulo: 'Marketing com Propósito',
        descricao: 'Estratégias de marketing digital alinhadas a valores cristãos para empreendedores e ministérios.',
        instrutor: 'Beatriz Ramos',
        duracao: '5 semanas',
        nivel: 'Intermediário',
        categoria: 'Negócios',
        preco: 119,
        avaliacao: 4.5,
        alunos: 410,
    },
    {
        id: 9,
        img: 'https://images.hostinger.com/0d733f6d-1156-4d06-bcd5-0b0ac6f0cb2f.png',
        titulo: 'Vida Devocional',
        descricao: 'Práticas de oração, leitura bíblica e meditação para cultivar intimidade com Deus diariamente.',
        instrutor: 'Pra. Sofia Cardoso',
        duracao: '4 semanas',
        nivel: 'Iniciante',
        categoria: 'Fé',
        preco: 0,
        avaliacao: 4.9,
        alunos: 1870,
    },
];

export const categorias = ['Todos', 'Fé', 'Negócios', 'Profissional'];
export const niveis = ['Todos', 'Iniciante', 'Intermediário', 'Avançado'];

// Itens demonstrativos no carrinho
export const carrinhoMock = [
    {
        id: 2,
        titulo: 'Empreendedorismo Bíblico',
        instrutor: 'Roberto Cunha',
        preco: 97,
        img: 'https://images.hostinger.com/eb050101-eda1-41e4-b737-b462378b5db0.png',
    },
    {
        id: 4,
        titulo: 'Finanças Pessoais',
        instrutor: 'Marcelo Souza',
        preco: 79,
        img: 'https://images.hostinger.com/5bb8f3b9-8773-4efd-b643-1471fa81cdaf.png',
    },
    {
        id: 8,
        titulo: 'Marketing com Propósito',
        instrutor: 'Beatriz Ramos',
        preco: 119,
        img: 'https://images.hostinger.com/0d733f6d-1156-4d06-bcd5-0b0ac6f0cb2f.png',
    },
];

// Cursos do aluno (estado demonstrativo)
export const alunoCursos = [
    {
        id: 5,
        titulo: 'Discipulado',
        instrutor: 'Pr. João Ferreira',
        progresso: 65,
        img: 'https://images.hostinger.com/b94be402-145f-4813-b749-2d12a2671520.png',
        status: 'Em andamento',
    },
    {
        id: 1,
        titulo: 'Liderança Cristã',
        instrutor: 'Pr. Elias Moreira',
        progresso: 100,
        img: 'https://images.hostinger.com/b94be402-145f-4813-b749-2d12a2671520.png',
        status: 'Concluído',
    },
    {
        id: 3,
        titulo: 'Comunicação Eficaz',
        instrutor: 'Dra. Ana Paula Lima',
        progresso: 30,
        img: 'https://images.hostinger.com/0d733f6d-1156-4d06-bcd5-0b0ac6f0cb2f.png',
        status: 'Em andamento',
    },
];

export const alunoCertificados = [
    { curso: 'Liderança Cristã', data: '12/07/2026', codigo: 'CB-2026-0142' },
    { curso: 'Finanças Pessoais', data: '03/05/2026', codigo: 'CB-2026-0089' },
];

// Painel do mentor (estado demonstrativo)
export const mentorCursos = [
    {
        id: 2,
        titulo: 'Empreendedorismo Bíblico',
        alunos: 860,
        avaliacao: 4.9,
        receita: 83420,
        status: 'Publicado',
    },
    {
        id: 8,
        titulo: 'Marketing com Propósito',
        alunos: 410,
        avaliacao: 4.5,
        receita: 48790,
        status: 'Publicado',
    },
    {
        id: 10,
        titulo: 'Gestão Financeira para Igrejas',
        alunos: 0,
        avaliacao: 0,
        receita: 0,
        status: 'Rascunho',
    },
];

export const mentorEstatisticas = [
    { rotulo: 'Cursos publicados', valor: '2' },
    { rotulo: 'Alunos inscritos', valor: '1.270' },
    { rotulo: 'Avaliação média', valor: '4.7' },
    { rotulo: 'Receita (mês)', valor: 'R$ 12.480' },
];

export const mentorAlunosRecentes = [
    { nome: 'André Oliveira', curso: 'Empreendedorismo Bíblico', progresso: 80, data: '10/08/2026' },
    { nome: 'Juliana Reis', curso: 'Marketing com Propósito', progresso: 45, data: '09/08/2026' },
    { nome: 'Rafael Monteiro', curso: 'Empreendedorismo Bíblico', progresso: 100, data: '08/08/2026' },
    { nome: 'Camila Duarte', curso: 'Marketing com Propósito', progresso: 20, data: '07/08/2026' },
];
