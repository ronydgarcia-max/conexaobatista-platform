import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';

const AdminAuthContext = createContext(null);

// PocketBase restores the authStore from localStorage on page load. In some
// cases the restored record is a plain JSON object without the RecordModel
// prototype, so `.get()` is undefined and crashes consumers. This wrapper
// guarantees a stable shape with a working `.get()` and direct field access.
function normalizeAdmin(rec) {
  if (!rec) return null;
  if (rec.collectionName !== 'admins') return null;
  if (typeof rec.get === 'function') return rec;
  const data = { ...rec };
  return {
    ...data,
    id: rec.id,
    collectionName: 'admins',
    get: (key) => data[key],
  };
}

function currentAdmin() {
  const rec = pb.authStore.record || pb.authStore.model;
  return normalizeAdmin(rec);
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(currentAdmin);

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => setAdmin(currentAdmin()));
    return () => unsub();
  }, []);

  const login = useCallback(async (username, password) => {
    const result = await pb.collection('admins').authWithPassword(username, password);
    const normalized = normalizeAdmin(result.record);
    setAdmin(normalized);
    return normalized;
  }, []);

  const logout = useCallback(() => {
    pb.authStore.clear();
    setAdmin(null);
  }, []);

  const changePassword = useCallback(
    async (newPassword, oldPassword) => {
      if (!admin) throw new Error('Não autenticado.');
      const username = admin.get('username');
      // PocketBase requires `oldPassword` when an auth record updates its own
      // password (non-superuser). Include it so the update is accepted.
      await pb.collection('admins').update(admin.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: newPassword,
        must_change_password: false,
      });
      // Re-authenticate so the token reflects the new password.
      const result = await pb.collection('admins').authWithPassword(username, newPassword);
      const normalized = normalizeAdmin(result.record);
      setAdmin(normalized);
      return normalized;
    },
    [admin],
  );

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, changePassword }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider.');
  return ctx;
}
