'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { db, getClientAuth } from '@/lib/firebase';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type SignUpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'free' | 'premium'; // kept for compat, ignored
};

export function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  const auth = getClientAuth();
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  // If already logged in, close modal and go to Account
  useEffect(() => {
    if (isOpen && user) {
      onClose();
      router.push('/account');
    }
  }, [isOpen, user, onClose, router]);

  // Close on outside click / ESC
  useEffect(() => {
    if (!isOpen) return;

    const onDocClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      // 1) Create auth user (role is always FREE)
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const created = cred.user;

      // 2) Basic profile
      if (name.trim()) {
        await updateProfile(created, { displayName: name.trim() });
      }

      // 3) Firestore user doc
      await setDoc(
        doc(db, 'users', created.uid),
        {
          name: name.trim() || null,
          email: created.email,
          role: 'free',
          accountStatus: 'Active',
          createdAt: serverTimestamp(),
          subscription: {
            plan: 'free',
            active: false,
            billing: null,
            startedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      // 4) Verify & sign out
      await sendEmailVerification(created);
      await signOut(auth);

      setAlert({
        title: 'Account Created',
        message:
          'We sent a verification link to your email. Verify, then log in. You can upgrade anytime from your Account page.',
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeAlert = () => {
    setAlert(null);
    onClose();
    router.push('/login');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-left" // ⬅️ add text-left
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-title"
          className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 id="signup-title" className="text-lg font-semibold">
              Create your free account
            </h2>
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-md hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-left"> {/* ⬅️ add text-left */}
            <div>
              <label className="mb-1 block text-sm text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Your name"
                autoComplete="name"
                autoFocus
                className="w-full text-left rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#58e221] focus:border-[#58e221]" // ⬅️ text-left
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full text-left rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#58e221] focus:border-[#58e221]" // ⬅️ text-left
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder="••••••••"
                minLength={6}
                required
                autoComplete="new-password"
                className="w-full text-left rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#58e221] focus:border-[#58e221]" // ⬅️ text-left
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
              {loading ? 'Creating…' : 'Create free account'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-[#58e221] underline">Log in</a>
            </p>
          </form>
        </div>
      </div>

      {/* Success dialog unchanged */}
      {alert && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
            <h3 className="text-lg font-semibold mb-2">{alert.title}</h3>
            <p className="text-gray-700 mb-4">{alert.message}</p>
            <button onClick={closeAlert} className="btn btn-primary w-full">OK</button>
          </div>
        </div>
      )}
    </>
  );
}