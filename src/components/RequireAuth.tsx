'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const auth = await getClientAuth();   
      if (!auth) {
        // No auth on the server or something went wrong -> send to login
        if (!cancelled) router.replace('/login');
        return;
      }

      unsub = onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.replace('/login');
        } else {
          setReady(true);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
