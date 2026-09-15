import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export const ESTADOS_BR = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

const cache = {};

/**
 * Campos dependentes UF -> Cidade (municípios via API oficial do IBGE).
 * Sempre renderiza UF antes de Cidade.
 */
export default function UfCidadeFields({
  uf,
  cidade,
  onChangeUf,
  onChangeCidade,
  required = false,
  labelClass = 'mb-1.5 block text-sm font-semibold text-foreground',
  inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
  ufLabel = 'Estado (UF)',
  cidadeLabel = 'Cidade',
  className = 'grid gap-4 sm:grid-cols-2',
}) {
  const [municipios, setMunicipios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async (sigla) => {
    if (!sigla) {
      setMunicipios([]);
      setErro('');
      return;
    }
    if (cache[sigla]) {
      setMunicipios(cache[sigla]);
      setErro('');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios?orderBy=nome`
      );
      if (!res.ok) throw new Error('falha');
      const data = await res.json();
      const nomes = (Array.isArray(data) ? data : [])
        .map((m) => m.nome)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
      cache[sigla] = nomes;
      setMunicipios(nomes);
    } catch {
      setMunicipios([]);
      setErro('Não foi possível carregar os municípios. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar((uf || '').toUpperCase());
  }, [uf, carregar]);

  const handleUf = (valor) => {
    onChangeUf(valor);
    onChangeCidade('');
  };

  const cidadeAtual = cidade || '';
  const opcoes =
    cidadeAtual && !municipios.includes(cidadeAtual) ? [cidadeAtual, ...municipios] : municipios;

  return (
    <div className={className}>
      <div>
        <label className={labelClass}>
          {ufLabel} {required ? '*' : ''}
        </label>
        <select
          className={inputClass}
          value={(uf || '').toUpperCase()}
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

      <div>
        <label className={labelClass}>
          {cidadeLabel} {required ? '*' : ''}
        </label>
        <select
          className={inputClass}
          value={cidadeAtual}
          onChange={(e) => onChangeCidade(e.target.value)}
          required={required}
          disabled={!uf || carregando || (!!erro && opcoes.length === 0)}
        >
          <option value="">
            {!uf
              ? 'Selecione primeiro o estado'
              : carregando
                ? 'Carregando municípios...'
                : 'Selecione a cidade'}
          </option>
          {opcoes.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>

        {carregando && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" /> Carregando municípios do IBGE...
          </p>
        )}
        {erro && !carregando && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-destructive">
            <span>{erro}</span>
            <button
              type="button"
              onClick={() => carregar((uf || '').toUpperCase())}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 font-semibold transition hover:bg-destructive/10"
            >
              <RefreshCw size={12} /> Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
