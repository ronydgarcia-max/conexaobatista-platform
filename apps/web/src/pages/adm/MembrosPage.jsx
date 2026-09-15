import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Search, Users, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

export const STATUS = {
  aguardando_aprovacao: { label: 'Aguardando aprovação da igreja', icon: Clock, className: 'bg-accent/15 text-accent border-accent/40' },
  aprovado: { label: 'Aprovado', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-300' },
  reprovado: { label: 'Reprovado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const SEXO_LABEL = { masculino: 'Masculino', feminino: 'Feminino', outro: 'Outro' };

const PER_PAGE = 12;

export function formatarData(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch (_) {
    return iso;
  }
}

export default function MembrosPage() {
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
        filtros.push(pb.filter('status_cadastro = {:status}', { status: filtroStatus }));
      }
      const termo = busca.trim();
      if (termo) {
        filtros.push(
          pb.filter('(name ~ {:q} || email ~ {:q} || cidade ~ {:q} || whatsapp ~ {:q})', { q: termo }),
        );
      }
      const result = await pb.collection('users').getList(pagina, PER_PAGE, {
        filter: filtros.length ? filtros.join(' && ') : '',
        sort: '-created',
      });
      setItems(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (err) {
      setErro('Não foi possível carregar a lista de membros.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Reset to page 1 when filters/search change.
  useEffect(() => {
    setPagina(1);
  }, [busca, filtroStatus]);

  const pendentes = items.filter((m) => m.status_cadastro === 'aguardando_aprovacao').length;

  return (
    <>
      <Helmet>
        <title>Membros | Administração Conexão Batista</title>
        <meta name="description" content="Gerenciamento de membros do Conexão Batista." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-[90rem] px-5 py-10 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Fluxo 1 · Administração</p>
            <h1 className="font-display text-3xl font-bold text-primary">Aprovação do cadastro do usuário</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {totalItems} membro(s) cadastrado(s)
              {pendentes > 0 && <span className="ml-2 font-semibold text-accent">· {pendentes} aguardando nesta página</span>}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Aprova o cadastro geral do usuário no portal. Independente do vínculo com igreja.
              Para aprovar vínculos de Pastores e Secretários, use <Link to="/adm/aprovacao-vinculos" className="font-semibold text-primary hover:underline">Aprovação de Vínculos</Link>.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail, cidade ou WhatsApp"
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
            <option value="aprovado">Aprovados</option>
            <option value="reprovado">Reprovados</option>
          </select>
        </div>

        {erro && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

        {/* Tabela */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" /> Carregando membros…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Users size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhum membro encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">Nome</th>
                    <th className="px-4 py-3 font-bold">E-mail</th>
                    <th className="hidden px-4 py-3 font-bold md:table-cell">Cidade</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Envio</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((m) => {
                    const st = STATUS[m.status_cadastro] || STATUS.aguardando_aprovacao;
                    const StIcon = st.icon;
                    return (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{m.name || '—'}</div>
                          <div className="text-xs text-muted-foreground">{SEXO_LABEL[m.sexo] || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.email || '—'}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{m.cidade || '—'}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{formatarData(m.data_envio)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${st.className}`}>
                            <StIcon size={13} strokeWidth={2} /> {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/adm/membros/${m.id}`}
                            className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
                          >
                            Gerenciar
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
