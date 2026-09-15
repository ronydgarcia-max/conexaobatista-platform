// Carrinho de cursos da plataforma Conexão Cursos — armazenamento real em
// localStorage (por navegador/dispositivo). Substitui o antigo carrinho mock
// (cursos fictícios e valores hardcoded). Cada item reflete um curso real
// adicionado pelo usuário, com preço vindo da API.

const CHAVE = 'cb_carrinho_cursos';
const EVENTO = 'cb:carrinho:atualizado';

function ler() {
    try {
        const bruto = localStorage.getItem(CHAVE);
        if (!bruto) return [];
        const arr = JSON.parse(bruto);
        return Array.isArray(arr) ? arr : [];
    } catch (_) {
        return [];
    }
}

function escrever(itens) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch (_) {}
    try {
        window.dispatchEvent(new CustomEvent(EVENTO, { detail: itens }));
    } catch (_) {}
}

export function obterCarrinho() {
    return ler();
}

export function adicionarAoCarrinho(curso) {
    if (!curso || !curso.id) return ler();
    const itens = ler();
    const existe = itens.some((i) => String(i.id) === String(curso.id));
    if (existe) return itens; // não duplica
    itens.push({
        id: curso.id,
        titulo: curso.titulo || '',
        instrutor: curso.instrutor || curso.mentor || '',
        preco: Number(curso.preco) || 0,
        imagem: curso.imagem || curso.img || curso.imagem_url || '',
    });
    escrever(itens);
    return itens;
}

export function removerDoCarrinho(id) {
    const itens = ler().filter((i) => String(i.id) !== String(id));
    escrever(itens);
    return itens;
}

export function limparCarrinho() {
    escrever([]);
}

export function estaNoCarrinho(id) {
    return ler().some((i) => String(i.id) === String(id));
}

export function totalCarrinho() {
    return ler().reduce((acc, i) => acc + (Number(i.preco) || 0), 0);
}

export { EVENTO };
