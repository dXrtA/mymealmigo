"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { SignUpModal } from "@/components/sign-up-modal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BmiCalculator from "@/components/bmiCalculator";
import BmrCalculator from "@/components/bmrCalculator";

type Sex = "male" | "female" | "other" | null;

type UserProfile = {
  birthday?: string;        // ISO yyyy-mm-dd
  heightCm?: number | null;
  weightKg?: number | null;
  sex?: Sex;
};

type UserDoc = {
  profile?: UserProfile;
};

export default function CalculatorsPage() {
  const { user, loading } = useAuth();
  const [profileDoc, setProfileDoc] = useState<UserDoc | null>(null);
  const [showSignup, setShowSignup] = useState(false);

  // Only fetch profile when signed-in (for prefill). Guests skip this.
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) {
        setProfileDoc(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!cancel) {
          setProfileDoc((snap.exists() ? (snap.data() as UserDoc) : {}) || {});
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
        if (!cancel) setProfileDoc({});
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user?.uid, user]);

  // Prefill data if available; otherwise leave empty (guest).
  const initial = useMemo(() => {
    const p = (profileDoc?.profile ?? {}) as UserProfile;

    // derive age from birthday if present & valid
    let age: number | null = null;
    if (p.birthday) {
      const b = new Date(p.birthday);
      if (!Number.isNaN(b.getTime())) {
        const today = new Date();
        age = today.getFullYear() - b.getFullYear();
        const m = today.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
      }
    }

    return {
      heightCm: p.heightCm ?? null,
      weightKg: p.weightKg ?? null,
      age,
      sex: p.sex ?? null,
    };
  }, [profileDoc]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      {!user && (
        <div className="mx-auto mb-6 max-w-3xl rounded-md border bg-white p-4 text-sm text-gray-700">
          You’re using the calculators as a guest. Results are computed locally and not saved.
          <button
            onClick={() => setShowSignup(true)}
            className="ml-2 rounded-md bg-[#58e221] px-2 py-1 text-white hover:opacity-90"
          >
            Create a free account
          </button>{" "}
          or <a className="underline" href="/login">log in</a> to prefill and save defaults.
        </div>
      )}

      {/* Modal lives here so guests can open it */}
      <SignUpModal isOpen={showSignup} onClose={() => setShowSignup(false)} />

      <div className="max-w-3xl mx-auto space-y-6">
        <BmiCalculator
          initialHeightCm={initial.heightCm}
          initialWeightKg={initial.weightKg}
        />
        <BmrCalculator
          initialAge={initial.age}
          initialHeightCm={initial.heightCm}
          initialWeightKg={initial.weightKg}
          initialSex={initial.sex}
        />
      </div>
    </div>
  );
}
