'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

type Props = { isOpen: boolean; onClose: () => void };

export default function UpgradeToPremiumModal({ isOpen, onClose }: Props) {
  const { user } = useAuth(); // ✅ stable source of logged-in user
  const modalRef = useRef<HTMLDivElement>(null);
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const confirmUpgrade = async () => {
    setError(null);
    try {
      if (!user) throw new Error('Not signed in');
      setLoading(true);

      await updateDoc(doc(db, 'users', user.uid), {
        role: 'premium',
        subscription: {
          plan: 'premium',
          billing: plan,
          active: true,
          startedAt: serverTimestamp(),
        },
      });

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setError(err?.message || 'Upgrade failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-xl font-semibold">Go Premium</h2>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-green-600 font-medium mb-2">You're Premium now! 🎉</p>
            <button onClick={onClose} className="mt-2 w-full bg-[#58e221] text-white py-2 rounded-md hover:opacity-90">
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-700 mb-3">Unlock photo recognition, advanced analytics, and more.</p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                className={`border rounded-md py-2 ${plan === 'monthly' ? 'bg-[#58e221] text-white' : 'bg-white'}`}
                onClick={() => setPlan('monthly')}
              >
                Monthly
              </button>
              <button
                className={`border rounded-md py-2 ${plan === 'yearly' ? 'bg-[#58e221] text-white' : 'bg-white'}`}
                onClick={() => setPlan('yearly')}
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
