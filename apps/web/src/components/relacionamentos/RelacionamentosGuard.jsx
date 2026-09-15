import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';

/**
 * Guards all /relacionamentos/* routes.
 * 1. Must be authenticated → redirect to /login
 * 2. Must have a consent record → redirect to /relacionamentos (entry page)
 */
export default function RelacionamentosGuard({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok' | 'no-auth' | 'no-consent'

  useEffect(() => {
    if (!pb.authStore.isValid) {
      setStatus('no-auth');
      return;
    }
    // Check sessionStorage cache first
    if (sessionStorage.getItem('rel_consented') === '1') {
      setStatus('ok');
      return;
    }
    pb.collection('rel_consentimentos')
      .getList(1, 1, {
        filter: pb.filter('owner = {:id}', { id: pb.authStore.record.id }),
        requestKey: 'rel-consent-check',
      })
      .then((res) => {
        if (res.totalItems > 0) {
          sessionStorage.setItem('rel_consented', '1');
          setStatus('ok');
        } else {
          setStatus('no-consent');
        }
      })
      .catch(() => setStatus('no-consent'));
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (status === 'no-auth') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (status === 'no-consent') {
    return <Navigate to="/relacionamentos" replace />;
  }
  return children;
}
