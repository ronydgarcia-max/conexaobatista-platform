import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';

// Contexto único que carrega o logo institucional personalizado (coleção
// config_logo, registro mais recente). Compartilhado entre Header e Footer
// (Brand/LogoMark) para evitar buscas duplicadas a cada render. Quando não há
// registro (ou a busca falha), `logoUrl` é null e o cabeçalho exibe o logo
// padrão (emblema SVG embutido).
const InstitutionalLogoContext = createContext({ logoUrl: null, carregando: true, recarregar: () => {} });

export function InstitutionalLogoProvider({ children }) {
    const [logoUrl, setLogoUrl] = useState(null);
    const [carregando, setCarregando] = useState(true);

    const carregar = useCallback(async () => {
        try {
            const lista = await pb.collection('config_logo').getList(1, 1, {
                sort: '-created',
                requestKey: 'institutional-logo-latest',
            });
            const rec = lista?.items?.[0] || null;
            if (rec && rec.logo) {
                const nome = Array.isArray(rec.logo) ? rec.logo[0] : rec.logo;
                setLogoUrl(nome ? pb.files.getURL(rec, nome) : null);
            } else {
                setLogoUrl(null);
            }
        } catch (err) {
            // Auto-cancelamento (status 0) ou coleção sem registro → logo padrão.
            if (err?.status !== 0 && !err?.isAbort) {
                setLogoUrl(null);
            }
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    // Atualiza em tempo real quando um admin envia/remove o logo.
    useEffect(() => {
        let active = true;
        const sub = pb
            .collection('config_logo')
            .subscribe('*', () => {
                if (active) carregar();
            })
            .catch(() => {});
        return () => {
            active = false;
            sub.then((u) => u && u()).catch(() => {});
        };
    }, [carregar]);

    return (
        <InstitutionalLogoContext.Provider value={{ logoUrl, carregando, recarregar: carregar }}>
            {children}
        </InstitutionalLogoContext.Provider>
    );
}

export function useInstitutionalLogo() {
    return useContext(InstitutionalLogoContext);
}
