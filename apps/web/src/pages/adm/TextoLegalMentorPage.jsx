import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { FileText, Save, Loader2, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

// Valor provisório exibido quando ainda não há registro salvo na coleção.
const VALOR_PROVISORIO = {
  titulo: 'Termo de responsabilidade do mentor',
  conteudo: 'Texto provisório, será substituído posteriormente',
};

export default function TextoLegalMentorPage() {
  const { admin } = useAdminAuth();

  const [registroId, setRegistroId] = useState(null);
  const [titulo, setTitulo] = useState(VALOR_PROVISORIO.titulo);
  const [conteudo, setConteudo] = useState(VALOR_PROVISORIO.conteudo);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [atualizadoPor, setAtualizadoPor] = useState('');

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  // Carrega o registro do termo do mentor (tipo = "mentor_termo").
  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const result = await pb.collection('textos_legais').getFullList({
        filter: 'tipo = "mentor_termo"',
      });
      if (result.length > 0) {
        const rec = result[0];
        setRegistroId(rec.id);
        setTitulo(rec.titulo || VALOR_PROVISORIO.titulo);
        setConteudo(rec.conteudo || VALOR_PROVISORIO.conteudo);
        setUltimaAtualizacao(rec.data_atualizacao || rec.updated || null);
        setAtualizadoPor(rec.expand?.atualizado_por?.name || rec.expand?.atualizado_por?.username || '');
      } else {
        // Sem registro: usa valor provisório.
        setRegistroId(null);
        setTitulo(VALOR_PROVISORIO.titulo);
        setConteudo(VALOR_PROVISORIO.conteudo);
        setUltimaAtualizacao(null);
        setAtualizadoPor('');
      }
    } catch (err) {
      setErro('Não foi possível carregar o texto do termo.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Descarta alterações não salvas e recarrega o estado salvo.
  const cancelar = () => {
    setSucesso('');
    setErro('');
    carregar();
  };

  // Salva o título e o conteúdo. Cria o registro se não existir, ou atualiza.
  const salvar = async (e) => {
    e.preventDefault();
    setSucesso('');
    setErro('');

    if (!titulo.trim()) {
      setErro('O título é obrigatório.');
      return;
    }
    if (!conteudo.trim()) {
      setErro('O conteúdo é obrigatório.');
      return;
    }

    setSalvando(true);
    try {
      const adminId = admin?.id || null;
      const dados = {
        tipo: 'mentor_termo',
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        atualizado_por: adminId,
      };

      if (registroId) {
        // Atualiza o registro existente.
        const rec = await pb.collection('textos_legais').update(registroId, dados);
        setUltimaAtualizacao(rec.data_atualizacao || rec.updated || null);
      } else {
        // Cria o registro pela primeira vez.
        const rec = await pb.collection('textos_legais').create(dados);
        setRegistroId(rec.id);
        setUltimaAtualizacao(rec.data_atualizacao || rec.updated || null);
      }

      // Tenta exibir o nome do admin que atualizou.
      setAtualizadoPor(admin?.name || admin?.username || '');
      setSucesso('Texto do termo salvo com sucesso.');
    } catch (err) {
      setErro('Não foi possível salvar o texto. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const formatarData = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('pt-BR');
    } catch (_) {
      return iso;
    }
  };

  return (
    <>
      <Helmet>
        <title>Texto Legal Mentor | Administração Conexão Batista</title>
        <meta name="description" content="Gerenciamento do termo de responsabilidade do mentor." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="mx-auto max-w-4xl px-5 py-10 lg:px-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Textos legais</p>
          <h1 className="font-display text-3xl font-bold text-primary">Texto Legal Mentor</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Edite o título e o conteúdo do termo de responsabilidade exibido no fluxo de cadastro
            para usuários que marcam a opção “Quero ser mentor”. As alterações refletem
            imediatamente no modal de aceite.
          </p>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white py-20 text-muted-foreground shadow-sm">
            <Loader2 size={20} className="animate-spin" /> Carregando texto…
          </div>
        ) : (
          <form onSubmit={salvar} className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
            {/* Título */}
            <div>
              <label htmlFor="titulo-mentor" className="mb-1.5 block text-sm font-semibold text-foreground">
                Título do termo *
              </label>
              <input
                id="titulo-mentor"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                maxLength={200}
                placeholder="Título exibido no modal de aceite"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Conteúdo */}
            <div>
              <label htmlFor="conteudo-mentor" className="mb-1.5 block text-sm font-semibold text-foreground">
                Conteúdo do termo *
              </label>
              <textarea
                id="conteudo-mentor"
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                required
                rows={14}
                placeholder="Conteúdo do termo de responsabilidade…"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                As quebras de linha são preservadas no modal de aceite.
              </p>
            </div>

            {/* Metadados da última atualização */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FileText size={13} /> Última atualização: <strong className="text-foreground">{formatarData(ultimaAtualizacao)}</strong>
              </span>
              {atualizadoPor && (
                <span>Por: <strong className="text-foreground">{atualizadoPor}</strong></span>
              )}
              {!registroId && (
                <span className="font-semibold text-accent">Texto provisório — ainda não salvo.</span>
              )}
            </div>

            {/* Mensagens de feedback */}
            {sucesso && (
              <p className="flex items-start gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {sucesso}
              </p>
            )}
            {erro && (
              <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /> {erro}
              </p>
            )}

            {/* Ações */}
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelar}
                disabled={salvando}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50"
              >
                <RotateCcw size={16} /> Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
