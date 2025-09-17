'use client';

import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let interval: any;

    (async () => {
      const auth = await getClientAuth();
      if (!auth) {
        router.replace('/login');
        return;
      }

      unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.replace('/login');
          return;
        }

        setEmail(user.email);

        // If already verified, go straight to the wizard
        if (user.emailVerified) {
          router.replace('/account/health');
          return;
        }

        // Poll every 2s for verification without needing a refresh
        interval = setInterval(async () => {
          try {
            await auth.currentUser?.reload();
            if (auth.currentUser?.emailVerified) {
              router.replace('/account/health');
            }
          } catch {
            /* ignore transient reload errors */
          }
        }, 2000);
      });
    })();

    return () => {
      unsub?.();
      if (interval) clearInterval(interval);
    };
  }, [router]);

  const resend = useCallback(async () => {
    setError(null);
    setSent(false);
    try {
      const auth = await getClientAuth();
      if (!auth || !auth.currentUser) throw new Error('Not signed in');
      // if already verified, continue immediately
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        router.replace('/account/health');
        return;
      }
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(auth.currentUser);
      setSent(true);
    } catch (err) {
      console.error(err);
      setError('Could not send email right now. Try again in a minute.');
    }
  }, [router]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-2">Verify your email</h1>
        <p className="text-gray-700 mb-4">
          We sent a verification email to{' '}
          <span className="font-medium">{email ?? 'your address'}</span>. Click the link to verify.
          This page will continue automatically once verified.
        </p>

        {sent ? (
          <p className="text-green-600 mb-4">Verification email sent!</p>
        ) : (
          <button
            onClick={resend}
            className="w-full bg-[#58e221] text-white py-2 rounded-md hover:opacity-90"
          >
            Resend verification email
          </button>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        <div className="mt-6 text-center">
          <Link className="text-[#58e221] underline" href="/login">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
