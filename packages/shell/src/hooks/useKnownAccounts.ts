import { useCallback, useState } from 'react';
import { StorageKeys } from '@mycircle/shared';
import type { KnownAccount } from '../lib/firebase';

const MAX_ACCOUNTS = 5;

function readAccounts(): KnownAccount[] {
  try {
    const raw = localStorage.getItem(StorageKeys.KNOWN_ACCOUNTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out invalid entries
    return parsed.filter(
      (a: any) => a && typeof a.uid === 'string' && typeof a.lastSignedInAt === 'number',
    );
  } catch {
    return [];
  }
}

function writeAccounts(accounts: KnownAccount[]): void {
  localStorage.setItem(StorageKeys.KNOWN_ACCOUNTS, JSON.stringify(accounts));
}

export function useKnownAccounts() {
  const [accounts, setAccounts] = useState<KnownAccount[]>(readAccounts);

  const refresh = useCallback(() => {
    setAccounts(readAccounts());
  }, []);

  const addOrUpdate = useCallback((user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    providerData: Array<{ providerId: string }>;
  }) => {
    const current = readAccounts();
    const providerId = user.providerData[0]?.providerId === 'password' ? 'password' : 'google.com';
    const entry: KnownAccount = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      providerId: providerId as 'google.com' | 'password',
      lastSignedInAt: Date.now(),
    };

    // Remove existing entry for this uid
    const filtered = current.filter((a) => a.uid !== user.uid);
    // Add at the front
    const updated = [entry, ...filtered].slice(0, MAX_ACCOUNTS);
    writeAccounts(updated);
    setAccounts(updated);
  }, []);

  const remove = useCallback((uid: string) => {
    const current = readAccounts();
    const updated = current.filter((a) => a.uid !== uid);
    writeAccounts(updated);
    setAccounts(updated);
  }, []);

  const getOthers = useCallback((currentUid: string): KnownAccount[] => {
    return accounts
      .filter((a) => a.uid !== currentUid)
      .sort((a, b) => b.lastSignedInAt - a.lastSignedInAt);
  }, [accounts]);

  return { accounts, addOrUpdate, remove, getOthers, refresh };
}
