import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Search, FileText, Loader2, ChevronLeft, ChevronRight, Briefcase, Eye, Lock,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

export const STATUS_CURRICULO = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground border-border' },
  publicado: { label: 'Publicado', className: 'bg-green-100 text-green-700 border-green-300' },
  pausado: { label: 'Pausado', className: 'bg-accent/15 text-accent border-accent/40' },
  excluido: { label: 'Excluído', className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const PER_PAGE = 12;

export function formatarDataCurriculo(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch (_) {
    return iso;
  }
}

export default function CurriculosPage() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const filtros = [];
      if (filtroStatus !== 'todos') {
        filtros.push(pb.filter('status = {:status}', { status: filtroStatus }));
      }
      const termo = busca.trim();
      if (termo) {
        filtros.push(
          pb.filter(
            '(nome_completo ~ {:q} || email ~ {:q} || cidade ~ {:q} || estado ~ {:q} || objetivo ~ {:q})',
            { q: termo },
          ),
        );
      }
      const result = await pb.collection('curriculos').getList(pagina, PER_PAGE, {
        filter: filtros.length ? filtros.join(' && ') : '',
        sort: '-data_cadastro',
        expand: 'usuario_id',
      });
      setItems(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (err) {
      setErro('Não foi possível carregar a lista de currículos.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPagina(1);
  }, [busca, filtroStatus]);

  return (
    <>
      <Helmet>
        <title>Banco de Empregos | Administração Conexão Batista</title>
        <meta name="description" content="Gerenciamento de currículos do Banco de Empregos." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Administração</p>
          <h1 className="font-display text-3xl font-bold text-primary">Banco de Empregos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalItems} currículo(s) cadastrado(s)
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock size={12} /> Informações privadas são ocultadas na visualização
            </span>
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail, cidade, estado ou objetivo"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="publicado">Publicados</option>
            <option value="pausado">Pausados</option>
            <option value="excluido">Excluídos</option>
          </select>
        </div>

        {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

        {/* Tabela */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" /> Carregando currículos…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <FileText size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhum currículo encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Nome</th>
                    <th className="hidden px-4 py-3 font-bold md:table-cell">E-mail</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Cidade/UF</th>
                    <th className="hidden px-4 py-3 font-bold lg:table-cell">Objetivo</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Cadastro</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((c) => {
                    const st = STATUS_CURRICULO[c.status] || STATUS_CURRICULO.rascunho;
                    return (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{c.nome_completo || '—'}</div>
                          <div className="text-xs text-muted-foreground">{c.expand?.usuario_id?.name || ''}</div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{c.email || '—'}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {c.cidade || '—'}{c.estado ? `/${c.estado}` : ''}
                        </td>
                        <td className="hidden max-w-xs px-4 py-3 text-muted-foreground lg:table-cell">
                          <span className="line-clamp-1">{c.objetivo || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatarDataCurriculo(c.data_cadastro)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/adm/curriculos/${c.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
                          >
                            <Eye size={13} /> Visualizar
                          </Link>
                        </td>
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
    </>
  );
}
