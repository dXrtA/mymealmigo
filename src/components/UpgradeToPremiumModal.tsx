'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

type Props = { isOpen: boolean; onClose: () => void };
type BillingPlan = 'monthly' | 'yearly';

export default function UpgradeToPremiumModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<BillingPlan>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const confirmUpgrade = async () => {
    setError(null);

    if (!user) {
      setError('You need to sign in first.');
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const payload = {
      role: 'premium',
      subscription: {
        plan: 'premium',
        billing: plan,
        active: true,
        startedAt: serverTimestamp(),
      },
    };

    try {
      // Try updating existing doc
      await updateDoc(userRef, payload);
      setSuccess(true);
    } catch (e) {
      // If doc missing, merge-create it
      try {
        await setDoc(userRef, payload, { merge: true });
        setSuccess(true);
      } catch (e2) {
        console.error(e2);
        const msg = e2 instanceof Error ? e2.message : 'Upgrade failed. Please try again.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Overlay that closes on click
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-labelledby="upgrade-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Dialog (stop propagation so inside clicks don't close) */}
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h2 id="upgrade-title" className="text-xl font-semibold">
            Go Premium
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-green-600 font-medium mb-2">
              You&apos;re Premium now! 🎉
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full bg-[#58e221] text-white py-2 rounded-md hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-700 mb-3">
              Unlock photo recognition, advanced analytics, and more.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3" role="group" aria-label="Billing interval">
              <button
                type="button"
                className={`border rounded-md py-2 ${
                  plan === 'monthly' ? 'bg-[#58e221] text-white' : 'bg-white'
                }`}
                onClick={() => setPlan('monthly')}
                aria-pressed={plan === 'monthly'}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`border rounded-md py-2 ${
                  plan === 'yearly' ? 'bg-[#58e221] text-white' : 'bg-white'
                }`}
                onClick={() => setPlan('yearly')}
                aria-pressed={plan === 'yearly'}
              >
                Yearly
              </button>
            </div>

            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            <button
              onClick={confirmUpgrade}
              disabled={loading || !user}
              className="w-full bg-[#58e221] text-white py-2 rounded-md hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Processing…' : 'Confirm Upgrade'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
