import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Power,
  Briefcase,
  FolderTree,
  Save,
  Upload,
  FileUp,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

// Normaliza texto para comparação: sem acentos, sem pontuação, minúsculas.
function normalizar(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

// Faz o parse de um CSV separado por ponto e vírgula.
// Colunas esperadas: nome;descrição;profissões (descrição opcional,
// profissões separadas por |).
function parseCsvCSV(texto) {
  const linhas = texto
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const registros = [];
  // Detecta e descarta cabeçalho se a primeira linha contiver "nome"
  // (case-insensitive) e não parecer um registro válido.
  let inicio = 0;
  if (linhas.length > 0) {
    const primeira = normalizar(linhas[0]);
    if (primeira.startsWith('nome') || primeira === 'nome;descricao;profissoes') {
      inicio = 1;
    }
  }

  for (let i = inicio; i < linhas.length; i++) {
    const partes = linhas[i].split(';').map((p) => (p || '').trim());
    const nome = partes[0] || '';
    const descricao = partes[1] || '';
    const profissoesRaw = partes[2] || '';
    const profissoes = profissoesRaw
      .split('|')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    registros.push({ linha: i + 1, nome, descricao, profissoes });
  }
  return registros;
}

const inputClass =
  'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted/50 disabled:text-muted-foreground';
const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground';

function formatarData(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch (_) {
    return iso;
  }
}

const EMPTY_CAT = { nome: '', descricao: '', ativo: true };
const EMPTY_PROF = { nome: '', categoria_id: '', descricao: '', ativo: true };

export default function CategoriasProfissoesPage() {
  const [aba, setAba] = useState('categorias'); // 'categorias' | 'profissoes'

  // Categorias
  const [categorias, setCategorias] = useState([]);
  const [carregandoCat, setCarregandoCat] = useState(true);
  const [erroCat, setErroCat] = useState('');
  const [modalCat, setModalCat] = useState(null); // null | { modo, id, dados }
  const [salvandoCat, setSalvandoCat] = useState(false);
  const [erroFormCat, setErroFormCat] = useState('');
  const [sucessoCat, setSucessoCat] = useState('');

  // Profissões
  const [profissoes, setProfissoes] = useState([]);
  const [carregandoProf, setCarregandoProf] = useState(true);
  const [erroProf, setErroProf] = useState('');
  const [modalProf, setModalProf] = useState(null);
  const [salvandoProf, setSalvandoProf] = useState(false);
  const [erroFormProf, setErroFormProf] = useState('');
  const [sucessoProf, setSucessoProf] = useState('');

  // Importação CSV
  const [modalCsv, setModalCsv] = useState(null); // null | { preview, erros, nomeArquivo }
  const [importando, setImportando] = useState(false);
  const [erroCsv, setErroCsv] = useState('');
  const csvInputRef = useRef(null);

  // Mapa de id -> nome da categoria para exibição rápida.
  const categoriaNome = (id) => {
    const c = categorias.find((x) => x.id === id);
    return c ? c.nome : '—';
  };

  const carregarCategorias = useCallback(async () => {
    setCarregandoCat(true);
    setErroCat('');
    try {
      const lista = await pb
        .collection('categorias_profissionais')
        .getFullList({ sort: 'nome' });
      setCategorias(lista);
    } catch (e) {
      setErroCat('Não foi possível carregar as categorias.');
    } finally {
      setCarregandoCat(false);
    }
  }, []);

  const carregarProfissoes = useCallback(async () => {
    setCarregandoProf(true);
    setErroProf('');
    try {
      const lista = await pb
        .collection('profissoes')
        .getFullList({ sort: 'nome', expand: 'categoria_id' });
      setProfissoes(lista);
    } catch (e) {
      setErroProf('Não foi possível carregar as profissões.');
    } finally {
      setCarregandoProf(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
    carregarProfissoes();
  }, [carregarCategorias, carregarProfissoes]);

  // ---------- Categorias ----------
  const abrirNovaCat = () => {
    setErroFormCat('');
    setModalCat({ modo: 'novo', id: null, dados: { ...EMPTY_CAT } });
  };

  const abrirEditarCat = (cat) => {
    setErroFormCat('');
    setModalCat({
      modo: 'editar',
      id: cat.id,
      dados: {
        nome: cat.nome || '',
        descricao: cat.descricao || '',
        ativo: cat.ativo !== false,
      },
    });
  };

  const fecharModalCat = () => {
    setModalCat(null);
    setErroFormCat('');
  };

  const setCampoCat = (campo, valor) =>
    setModalCat((prev) =>
      prev ? { ...prev, dados: { ...prev.dados, [campo]: valor } } : prev,
    );

  const salvarCat = async (e) => {
    e.preventDefault();
    const { nome, descricao, ativo } = modalCat.dados;
    if (!nome.trim()) {
      setErroFormCat('Informe o nome da categoria.');
      return;
    }
    setSalvandoCat(true);
    setErroFormCat('');
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        ativo: !!ativo,
      };
      let rec;
      if (modalCat.modo === 'editar') {
        rec = await pb
          .collection('categorias_profissionais')
          .update(modalCat.id, payload);
        setCategorias((prev) =>
          prev.map((c) => (c.id === rec.id ? rec : c)).sort((a, b) =>
            a.nome.localeCompare(b.nome),
          ),
        );
        setSucessoCat('Categoria atualizada com sucesso.');
      } else {
        rec = await pb
          .collection('categorias_profissionais')
          .create(payload);
        setCategorias((prev) =>
          [...prev, rec].sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        setSucessoCat('Categoria criada com sucesso.');
      }
      fecharModalCat();
    } catch (e) {
      setErroFormCat(
        e?.response?.message ||
          'Não foi possível salvar a categoria. Tente novamente.',
      );
    } finally {
      setSalvandoCat(false);
    }
  };

  const toggleAtivoCat = async (cat) => {
    try {
      const rec = await pb
        .collection('categorias_profissionais')
        .update(cat.id, { ativo: !cat.ativo });
      setCategorias((prev) => prev.map((c) => (c.id === rec.id ? rec : c)));
    } catch (e) {
      setErroCat('Não foi possível alterar o status da categoria.');
    }
  };

  const excluirCat = async (cat) => {
    // Verifica vinculações: profissões que referenciam esta categoria.
    try {
      const vinculadas = await pb
        .collection('profissoes')
        .getList(1, 1, { filter: pb.filter('categoria_id = {:id}', { id: cat.id }) });
      if (vinculadas.totalItems > 0) {
        setErroCat(
          `Não é possível excluir "${cat.nome}" pois existem ${vinculadas.totalItems} profissão(ões) vinculada(s) a ela. Remova ou reatribua as profissões antes de excluir a categoria.`,
        );
        return;
      }
    } catch (e) {
      setErroCat('Não foi possível verificar as vinculações da categoria.');
      return;
    }
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a categoria "${cat.nome}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    try {
      await pb.collection('categorias_profissionais').delete(cat.id);
      setCategorias((prev) => prev.filter((c) => c.id !== cat.id));
      setErroCat('');
      setSucessoCat('Categoria excluída.');
    } catch (e) {
      setErroCat('Não foi possível excluir a categoria. Tente novamente.');
    }
  };

  // ---------- Profissões ----------
  const abrirNovaProf = () => {
    setErroFormProf('');
    setModalProf({ modo: 'novo', id: null, dados: { ...EMPTY_PROF } });
  };

  const abrirEditarProf = (prof) => {
    setErroFormProf('');
    setModalProf({
      modo: 'editar',
      id: prof.id,
      dados: {
        nome: prof.nome || '',
        categoria_id: prof.categoria_id || '',
        descricao: prof.descricao || '',
        ativo: prof.ativo !== false,
      },
    });
  };

  const fecharModalProf = () => {
    setModalProf(null);
    setErroFormProf('');
  };

  const setCampoProf = (campo, valor) =>
    setModalProf((prev) =>
      prev ? { ...prev, dados: { ...prev.dados, [campo]: valor } } : prev,
    );

  const salvarProf = async (e) => {
    e.preventDefault();
    const { nome, categoria_id, descricao, ativo } = modalProf.dados;
    if (!nome.trim()) {
      setErroFormProf('Informe o nome da profissão.');
      return;
    }
    if (!categoria_id) {
      setErroFormProf('Selecione a categoria da profissão.');
      return;
    }
    setSalvandoProf(true);
    setErroFormProf('');
    try {
      const payload = {
        nome: nome.trim(),
        categoria_id,
        descricao: descricao.trim(),
        ativo: !!ativo,
      };
      let rec;
      if (modalProf.modo === 'editar') {
        rec = await pb.collection('profissoes').update(modalProf.id, payload);
        setProfissoes((prev) =>
          prev
            .map((p) => (p.id === rec.id ? { ...rec, expand: p.expand } : p))
            .sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        setSucessoProf('Profissão atualizada com sucesso.');
      } else {
        rec = await pb.collection('profissoes').create(payload);
        setProfissoes((prev) =>
          [...prev, rec].sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        setSucessoProf('Profissão criada com sucesso.');
      }
      fecharModalProf();
    } catch (e) {
      setErroFormProf(
        e?.response?.message ||
          'Não foi possível salvar a profissão. Tente novamente.',
      );
    } finally {
      setSalvandoProf(false);
    }
  };

  const toggleAtivoProf = async (prof) => {
    try {
      const rec = await pb
        .collection('profissoes')
        .update(prof.id, { ativo: !prof.ativo });
      setProfissoes((prev) => prev.map((p) => (p.id === rec.id ? rec : p)));
    } catch (e) {
      setErroProf('Não foi possível alterar o status da profissão.');
    }
  };

  const excluirProf = async (prof) => {
    // Verifica vinculações: serviços profissionais cujo campo "profissao"
    // (texto livre) coincide com o nome da profissão.
    try {
      const vinculados = await pb
        .collection('servicos_profissionais')
        .getList(1, 1, {
          filter: pb.filter('profissao = {:nome}', { nome: prof.nome }),
        });
      if (vinculados.totalItems > 0) {
        setErroProf(
          `Não é possível excluir "${prof.nome}" pois existem ${vinculados.totalItems} serviço(s) cadastrado(s) vinculado(s) a esta profissão. Remova ou reatribua os serviços antes de excluir.`,
        );
        return;
      }
    } catch (e) {
      setErroProf('Não foi possível verificar as vinculações da profissão.');
      return;
    }
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a profissão "${prof.nome}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    try {
      await pb.collection('profissoes').delete(prof.id);
      setProfissoes((prev) => prev.filter((p) => p.id !== prof.id));
      setErroProf('');
      setSucessoProf('Profissão excluída.');
    } catch (e) {
      setErroProf('Não foi possível excluir a profissão. Tente novamente.');
    }
  };

  const categoriasAtivas = categorias.filter((c) => c.ativo !== false);

  // ---------- Importação CSV ----------
  const abrirImportCsv = () => {
    setErroCsv('');
    setModalCsv(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
    csvInputRef.current?.click();
  };

  const onSelecionarCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErroCsv('');
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setErroCsv('Selecione um arquivo .csv válido.');
      if (csvInputRef.current) csvInputRef.current.value = '';
      return;
    }
    try {
      const texto = await file.text();
      const registros = parseCsvCSV(texto);

      // Mapas de nomes existentes (normalizados) para detectar duplicidades.
      const catsExistentes = new Map();
      categorias.forEach((c) => catsExistentes.set(normalizar(c.nome), c));
      const profsExistentes = new Map();
      profissoes.forEach((p) => profsExistentes.set(normalizar(p.nome), p));

      // Acompanha categorias/profissões já vistas dentro do próprio CSV.
      const catsNoCsv = new Map(); // normalizado -> { nome, descricao, acao }
      const profsNoCsv = new Map(); // "catNorm::profNorm" -> { nome, catNome, acao }

      const preview = [];
      const erros = [];

      if (registros.length === 0) {
        setErroCsv('O arquivo está vazio ou não contém registros válidos.');
        if (csvInputRef.current) csvInputRef.current.value = '';
        return;
      }

      registros.forEach((r) => {
        const errosLinha = [];
        const nomeTrim = r.nome.trim();
        if (!nomeTrim) {
          errosLinha.push('Nome da categoria é obrigatório.');
        }

        const nomeNorm = normalizar(nomeTrim);
        let acaoCat = 'criar';
        if (!nomeTrim) {
          acaoCat = 'invalido';
        } else if (catsExistentes.has(nomeNorm)) {
          acaoCat = 'existente';
        } else if (catsNoCsv.has(nomeNorm)) {
          acaoCat = 'duplicado-csv';
        }

        if (acaoCat === 'criar') {
          catsNoCsv.set(nomeNorm, { nome: nomeTrim, descricao: r.descricao });
        }

        const profsLinha = [];
        (r.profissoes || []).forEach((pn) => {
          const pnTrim = pn.trim();
          if (!pnTrim) return;
          const pnNorm = normalizar(pnTrim);
          const chave = `${nomeNorm}::${pnNorm}`;
          let acaoProf = 'criar';
          if (profsExistentes.has(pnNorm)) {
            // Profissão já existe globalmente — não recriar.
            acaoProf = 'existente';
          } else if (profsNoCsv.has(chave)) {
            acaoProf = 'duplicado-csv';
          } else {
            profsNoCsv.set(chave, { nome: pnTrim, catNome: nomeTrim });
          }
          profsLinha.push({ nome: pnTrim, acao: acaoProf });
        });

        if (acaoCat === 'invalido') {
          errosLinha.push('Linha ignorada: nome da categoria vazio.');
          erros.push({ linha: r.linha, mensagens: errosLinha });
        }

        preview.push({
          linha: r.linha,
          nome: nomeTrim,
          descricao: r.descricao,
          acaoCat,
          profissoes: profsLinha,
        });
      });

      setModalCsv({ preview, erros, nomeArquivo: file.name });
      if (csvInputRef.current) csvInputRef.current.value = '';
    } catch (err) {
      setErroCsv('Não foi possível ler o arquivo. Verifique o formato e tente novamente.');
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const confirmarImportCsv = async () => {
    if (!modalCsv) return;
    setImportando(true);
    setErroCsv('');
    try {
      // Recarrega listas atualizadas para evitar duplicidade por concorrência.
      const catsAtuais = await pb
        .collection('categorias_profissionais')
        .getFullList({ sort: 'nome' });
      const profsAtuais = await pb
        .collection('profissoes')
        .getFullList({ sort: 'nome' });

      const catsMap = new Map();
      catsAtuais.forEach((c) => catsMap.set(normalizar(c.nome), c));
      const profsMap = new Map();
      profsAtuais.forEach((p) => profsMap.set(normalizar(p.nome), p));

      let catsCriadas = 0;
      let profsCriadas = 0;
      let duplicadas = 0;

      for (const r of modalCsv.preview) {
        if (!r.nome) continue;
        const nomeNorm = normalizar(r.nome);
        let cat = catsMap.get(nomeNorm);
        if (!cat) {
          cat = await pb.collection('categorias_profissionais').create({
            nome: r.nome,
            descricao: r.descricao || '',
            ativo: true,
          });
          catsMap.set(nomeNorm, cat);
          catsCriadas++;
        } else {
          duplicadas++;
        }

        for (const pl of r.profissoes) {
          if (pl.acao !== 'criar') continue;
          const pnNorm = normalizar(pl.nome);
          if (profsMap.has(pnNorm)) continue;
          const rec = await pb.collection('profissoes').create(
            {
              nome: pl.nome,
              categoria_id: cat.id,
              descricao: '',
              ativo: true,
            },
            { requestKey: `import-prof-${pnNorm}` },
          );
          profsMap.set(pnNorm, rec);
          profsCriadas++;
        }
      }

      await carregarCategorias();
      await carregarProfissoes();
      setModalCsv(null);
      setSucessoCat(
        `Importação concluída: ${catsCriadas} categoria(s) criada(s), ${profsCriadas} profissão(ões) criada(s) e ativada(s). ${duplicadas} categoria(s) já existente(s) preservada(s).`,
      );
      setSucessoProf('');
      setErroCat('');
      setErroProf('');
    } catch (err) {
      setErroCsv(
        err?.response?.message ||
          'Erro durante a importação. Verifique o arquivo e tente novamente.',
      );
    } finally {
      setImportando(false);
    }
  };

  const fecharModalCsv = () => {
    if (importando) return;
    setModalCsv(null);
    setErroCsv('');
  };

  return (
    <>
      <Helmet>
        <title>Categorias e Profissões | Administração Conexão Batista</title>
        <meta
          name="description"
          content="Gerenciamento de categorias e profissões dos profissionais liberais."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            Administração
          </p>
          <h1 className="font-display text-3xl font-bold text-primary">
            Categorias e Profissões
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as categorias e profissões disponíveis para os
            profissionais liberais.
          </p>
        </div>

        {/* Abas */}
        <div className="mb-6 inline-flex rounded-xl border border-border bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setAba('categorias')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              aba === 'categorias'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <FolderTree size={16} /> Categorias
            <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {categorias.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAba('profissoes')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              aba === 'profissoes'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <Briefcase size={16} /> Profissões
            <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {profissoes.length}
            </span>
          </button>
        </div>

        {/* Ação de importação CSV */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={abrirImportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10"
          >
            <Upload size={16} /> Importar CSV
          </button>
          <span className="text-xs text-muted-foreground">
            Arquivo separado por ponto e vírgula (;) com colunas{' '}
            <strong>nome;descrição;profissões</strong> (descrição opcional,
            profissões separadas por <strong>|</strong>).
          </span>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onSelecionarCsv}
          />
        </div>

        {erroCsv && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{erroCsv}</span>
          </div>
        )}

        {aba === 'categorias' && (
          <div>
            {erroCat && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{erroCat}</span>
              </div>
            )}
            {sucessoCat && !erroCat && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>{sucessoCat}</span>
              </div>
            )}

            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-primary">
                Categorias
              </h2>
              <button
                type="button"
                onClick={abrirNovaCat}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={16} /> Nova categoria
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              {carregandoCat ? (
                <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                  <Loader2 size={20} className="animate-spin" /> Carregando…
                </div>
              ) : categorias.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <Tags size={32} className="text-muted-foreground/50" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nenhuma categoria cadastrada.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-bold">Nome</th>
                        <th className="hidden px-4 py-3 font-bold md:table-cell">
                          Descrição
                        </th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="hidden px-4 py-3 font-bold sm:table-cell">
                          Criação
                        </th>
                        <th className="px-4 py-3 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {categorias.map((cat) => (
                        <tr key={cat.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {cat.nome}
                          </td>
                          <td className="hidden max-w-sm px-4 py-3 text-muted-foreground md:table-cell">
                            <span className="line-clamp-1">
                              {cat.descricao || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
                                cat.ativo !== false
                                  ? 'border-green-300 bg-green-50 text-green-700'
                                  : 'border-border bg-muted text-muted-foreground'
                              }`}
                            >
                              {cat.ativo !== false ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                            {formatarData(cat.data_criacao)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => toggleAtivoCat(cat)}
                                title={cat.ativo !== false ? 'Desativar' : 'Ativar'}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                              >
                                <Power size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => abrirEditarCat(cat)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                              >
                                <Pencil size={13} /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => excluirCat(cat)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5"
                              >
                                <Trash2 size={13} /> Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {aba === 'profissoes' && (
          <div>
            {erroProf && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{erroProf}</span>
              </div>
            )}
            {sucessoProf && !erroProf && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>{sucessoProf}</span>
              </div>
            )}

            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-primary">
                Profissões
              </h2>
              <button
                type="button"
                onClick={abrirNovaProf}
                disabled={categoriasAtivas.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  categoriasAtivas.length === 0
                    ? 'Crie uma categoria ativa antes'
                    : ''
                }
              >
                <Plus size={16} /> Nova profissão
              </button>
            </div>

            {categoriasAtivas.length === 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>
                  Crie e ative ao menos uma categoria antes de cadastrar
                  profissões.
                </span>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              {carregandoProf ? (
                <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                  <Loader2 size={20} className="animate-spin" /> Carregando…
                </div>
              ) : profissoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <Briefcase size={32} className="text-muted-foreground/50" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nenhuma profissão cadastrada.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-bold">Nome</th>
                        <th className="hidden px-4 py-3 font-bold sm:table-cell">
                          Categoria
                        </th>
                        <th className="hidden px-4 py-3 font-bold md:table-cell">
                          Descrição
                        </th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="hidden px-4 py-3 font-bold sm:table-cell">
                          Criação
                        </th>
                        <th className="px-4 py-3 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {profissoes.map((prof) => (
                        <tr key={prof.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {prof.nome}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                            {prof.expand?.categoria_id?.nome ||
                              categoriaNome(prof.categoria_id)}
                          </td>
                          <td className="hidden max-w-sm px-4 py-3 text-muted-foreground md:table-cell">
                            <span className="line-clamp-1">
                              {prof.descricao || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
                                prof.ativo !== false
                                  ? 'border-green-300 bg-green-50 text-green-700'
                                  : 'border-border bg-muted text-muted-foreground'
                              }`}
                            >
                              {prof.ativo !== false ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                            {formatarData(prof.data_criacao)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => toggleAtivoProf(prof)}
                                title={prof.ativo !== false ? 'Desativar' : 'Ativar'}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                              >
                                <Power size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => abrirEditarProf(prof)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                              >
                                <Pencil size={13} /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => excluirProf(prof)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5"
                              >
                                <Trash2 size={13} /> Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Modal Categoria */}
      {modalCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-primary">
                {modalCat.modo === 'editar'
                  ? 'Editar categoria'
                  : 'Nova categoria'}
              </h3>
              <button
                type="button"
                onClick={fecharModalCat}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={salvarCat} className="space-y-4">
              <div>
                <label className={labelClass}>Nome *</label>
                <input
                  className={inputClass}
                  placeholder="Ex.: Construção, Beleza, Saúde…"
                  value={modalCat.dados.nome}
                  onChange={(e) => setCampoCat('nome', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="Breve descrição da categoria (opcional)"
                  value={modalCat.dados.descricao}
                  onChange={(e) => setCampoCat('descricao', e.target.value)}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={modalCat.dados.ativo}
                  onChange={(e) => setCampoCat('ativo', e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                />
                Categoria ativa
              </label>

              {erroFormCat && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{erroFormCat}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModalCat}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoCat}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {salvandoCat ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profissão */}
      {modalProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-primary">
                {modalProf.modo === 'editar'
                  ? 'Editar profissão'
                  : 'Nova profissão'}
              </h3>
              <button
                type="button"
                onClick={fecharModalProf}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={salvarProf} className="space-y-4">
              <div>
                <label className={labelClass}>Nome *</label>
                <input
                  className={inputClass}
                  placeholder="Ex.: Eletricista, Pedreiro, Costureira…"
                  value={modalProf.dados.nome}
                  onChange={(e) => setCampoProf('nome', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Categoria *</label>
                <select
                  className={inputClass}
                  value={modalProf.dados.categoria_id}
                  onChange={(e) => setCampoProf('categoria_id', e.target.value)}
                  required
                >
                  <option value="">Selecione…</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                      {c.ativo === false ? ' (inativa)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="Breve descrição da profissão (opcional)"
                  value={modalProf.dados.descricao}
                  onChange={(e) => setCampoProf('descricao', e.target.value)}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={modalProf.dados.ativo}
                  onChange={(e) => setCampoProf('ativo', e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                />
                Profissão ativa
              </label>

              {erroFormProf && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{erroFormProf}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModalProf}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoProf}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {salvandoProf ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importação CSV */}
      {modalCsv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/8 text-primary">
                  <FileUp size={18} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-primary">
                    Prévia da importação
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {modalCsv.nomeArquivo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fecharModalCsv}
                disabled={importando}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {erroCsv && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{erroCsv}</span>
              </div>
            )}

            {modalCsv.erros.length > 0 && (
              <div className="mb-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
                <p className="font-bold">
                  {modalCsv.erros.length} linha(s) com erro(s) e será(ão) ignorada(s):
                </p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {modalCsv.erros.map((e) => (
                    <li key={e.linha}>
                      Linha {e.linha}: {e.mensagens.join(' ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-3 flex flex-wrap gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-green-700">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Será criada
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-400" /> Já existe (preservada)
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Duplicada no CSV (ignorada)
              </span>
            </div>

            <div className="overflow-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-border bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-bold">Linha</th>
                    <th className="px-3 py-2 font-bold">Categoria</th>
                    <th className="hidden px-3 py-2 font-bold md:table-cell">Descrição</th>
                    <th className="px-3 py-2 font-bold">Profissões</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {modalCsv.preview.map((r) => {
                    const catLabel =
                      r.acaoCat === 'criar'
                        ? 'Será criada'
                        : r.acaoCat === 'existente'
                          ? 'Já existe'
                          : r.acaoCat === 'duplicado-csv'
                            ? 'Duplicada no CSV'
                            : 'Inválida';
                    const catColor =
                      r.acaoCat === 'criar'
                        ? 'text-green-700'
                        : r.acaoCat === 'existente'
                          ? 'text-muted-foreground'
                          : 'text-accent';
                    return (
                      <tr key={r.linha} className="align-top hover:bg-muted/20">
                        <td className="px-3 py-2 text-muted-foreground">{r.linha}</td>
                        <td className="px-3 py-2">
                          <span className="font-semibold text-foreground">{r.nome || '—'}</span>
                          <span className={`mt-0.5 block text-xs font-bold ${catColor}`}>
                            {catLabel}
                          </span>
                        </td>
                        <td className="hidden max-w-xs px-3 py-2 text-muted-foreground md:table-cell">
                          <span className="line-clamp-2">{r.descricao || '—'}</span>
                        </td>
                        <td className="px-3 py-2">
                          {r.profissoes.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <ul className="space-y-1">
                              {r.profissoes.map((pl, idx) => {
                                const lbl =
                                  pl.acao === 'criar'
                                    ? 'criar'
                                    : pl.acao === 'existente'
                                      ? 'existe'
                                      : 'duplicada';
                                const cor =
                                  pl.acao === 'criar'
                                    ? 'text-green-700'
                                    : pl.acao === 'existente'
                                      ? 'text-muted-foreground'
                                      : 'text-accent';
                                return (
                                  <li key={idx} className="text-xs">
                                    <span className="font-semibold text-foreground">{pl.nome}</span>{' '}
                                    <span className={`font-bold ${cor}`}>({lbl})</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Categorias e profissões já existentes serão preservadas (não sobrescritas).
              As novas profissões serão criadas e ativadas automaticamente.
            </p>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={fecharModalCsv}
                disabled={importando}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarImportCsv}
                disabled={importando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {importando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Confirmar importação
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
