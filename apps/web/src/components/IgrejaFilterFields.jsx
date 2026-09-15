import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Church } from 'lucide-react';
import { ESTADOS_BR } from '@/components/UfCidadeFields.jsx';
import pb from '@/lib/pocketbaseClient';

// Cache em memória dos municípios por UF (compartilhado com UfCidadeFields).
const municipiosCache = {};

/**
 * Filtro encadeado de igreja em 3 níveis: UF -> Cidade -> Igreja.
 *
 * Replica o padrão do cadastro de empresas (UfCidadeFields) para o campo de
 * seleção de igreja no cadastro de usuário:
 *   Nível 1: UF (26 estados + DF)
 *   Nível 2: Cidade (municípios via API oficial do IBGE)
 *   Nível 3: Igrejas batistas aprovadas daquela cidade (coleção `empresas`,
 *            tipo='igreja' && status_aprovacao='aprovado')
 *
 * O componente carrega todas as igrejas aprovadas uma vez ( PocketBase) e
 * filtra client-side por UF + cidade, evitando uma chamada por cidade.
 * Reporta o id da igreja selecionada via `onChangeIgreja`.
 */
export default function IgrejaFilterFields({
  igrejaId,
  onChangeIgreja,
  required = false,
  labelClass = 'mb-1.5 block text-sm font-semibold text-foreground',
  inputClass = 'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
  className = 'space-y-4',
}) {
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [municipios, setMunicipios] = useState([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [erroMunicipios, setErroMunicipios] = useState('');

  const [igrejas, setIgrejas] = useState([]);
  const [carregandoIgrejas, setCarregandoIgrejas] = useState(true);
  const [erroIgrejas, setErroIgrejas] = useState('');

  // Carrega todas as igrejas aprovadas uma única vez.
  useEffect(() => {
    let cancelado = false;
    setCarregandoIgrejas(true);
    setErroIgrejas('');
    pb.collection('empresas')
      .getFullList({
        filter: "tipo = 'igreja' && status_aprovacao = 'aprovado'",
        sort: 'razao_social',
      })
      .then((lista) => {
        if (!cancelado) setIgrejas(lista || []);
      })
      .catch(() => {
        if (!cancelado) {
          setIgrejas([]);
          setErroIgrejas('Não foi possível carregar a lista de igrejas. Tente novamente.');
        }
      })
      .finally(() => {
        if (!cancelado) setCarregandoIgrejas(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Carrega municípios do IBGE para a UF selecionada.
  const carregarMunicipios = useCallback(async (sigla) => {
    if (!sigla) {
      setMunicipios([]);
      setErroMunicipios('');
      return;
    }
    if (municipiosCache[sigla]) {
      setMunicipios(municipiosCache[sigla]);
      setErroMunicipios('');
      return;
    }
    setCarregandoMunicipios(true);
    setErroMunicipios('');
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios?orderBy=nome`,
      );
      if (!res.ok) throw new Error('falha');
      const data = await res.json();
      const nomes = (Array.isArray(data) ? data : [])
        .map((m) => m.nome)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
      municipiosCache[sigla] = nomes;
      setMunicipios(nomes);
    } catch {
      setMunicipios([]);
      setErroMunicipios('Não foi possível carregar os municípios. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregandoMunicipios(false);
    }
  }, []);

  const handleUf = (valor) => {
    setUf(valor);
    setCidade('');
    setMunicipios([]);
    setErroMunicipios('');
    onChangeIgreja('');
    if (valor) carregarMunicipios(valor);
  };

  const handleCidade = (valor) => {
    setCidade(valor);
    onChangeIgreja('');
  };

  // Igrejas filtradas pela UF + cidade selecionadas.
  const igrejasFiltradas = useMemo(() => {
    if (!uf || !cidade) return [];
    return igrejas.filter((i) => {
      const estadoOk = (i.estado || '').toUpperCase() === uf.toUpperCase();
      const cidadeOk = (i.cidade || '').trim().toLowerCase() === cidade.trim().toLowerCase();
      return estadoOk && cidadeOk;
    });
  }, [igrejas, uf, cidade]);

  return (
    <div className={className}>
      {/* Nível 1 — UF */}
      <div>
        <label className={labelClass}>Estado (UF) {required ? '*' : ''}</label>
        <select
          className={inputClass}
          value={uf}
          onChange={(e) => handleUf(e.target.value)}
          required={required}
        >
          <option value="">Selecione o estado</option>
          {ESTADOS_BR.map((e) => (
            <option key={e.sigla} value={e.sigla}>
              {e.nome} ({e.sigla})
            </option>
          ))}
        </select>
      </div>

      {/* Nível 2 — Cidade */}
      <div>
        <label className={labelClass}>Cidade {required ? '*' : ''}</label>
        <select
          className={inputClass}
          value={cidade}
          onChange={(e) => handleCidade(e.target.value)}
          required={required}
          disabled={!uf || carregandoMunicipios}
        >
          <option value="">
            {!uf
              ? 'Selecione primeiro o estado'
              : carregandoMunicipios
                ? 'Carregando municípios...'
                : 'Selecione a cidade'}
          </option>
          {municipios.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>
        {carregandoMunicipios && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" /> Carregando municípios do IBGE...
          </p>
        )}
        {erroMunicipios && !carregandoMunicipios && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-destructive">
            <span>{erroMunicipios}</span>
            <button
              type="button"
              onClick={() => carregarMunicipios(uf)}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 font-semibold transition hover:bg-destructive/10"
            >
              <RefreshCw size={12} /> Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Nível 3 — Igreja */}
      <div>
        <label className={labelClass}>Igreja {required ? '*' : ''}</label>
        <select
          className={inputClass}
          value={igrejaId}
          onChange={(e) => onChangeIgreja(e.target.value)}
          required={required}
          disabled={!cidade || carregandoIgrejas}
        >
          <option value="">
            {!cidade
              ? 'Selecione primeiro a cidade'
              : carregandoIgrejas
                ? 'Carregando igrejas...'
                : igrejasFiltradas.length === 0
                  ? 'Nenhuma igreja cadastrada nesta cidade'
                  : 'Selecione a sua igreja'}
          </option>
          {igrejasFiltradas.map((i) => (
            <option key={i.id} value={i.id}>
              {i.razao_social || i.nome_fantasia || '—'}
            </option>
          ))}
        </select>
        {carregandoIgrejas && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" /> Carregando igrejas...
          </p>
        )}
        {erroIgrejas && !carregandoIgrejas && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
            <Church size={13} /> {erroIgrejas}
          </p>
        )}
        {cidade && !carregandoIgrejas && !erroIgrejas && igrejasFiltradas.length === 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Não há igrejas batistas cadastradas nesta cidade. Se a sua igreja
            ainda não está no portal, entre em contato com a administração.
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Sua solicitação será enviada para os representantes da igreja selecionada.
        </p>
      </div>
    </div>
  );
}
