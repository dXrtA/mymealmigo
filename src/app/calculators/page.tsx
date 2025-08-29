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

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!cancel) {
          setProfileDoc((snap.exists() ? (snap.data() as UserDoc) : {}) || {});
        }
      } catch (e) {
        // non-fatal for calculators; just log
        console.error("Failed to load profile:", e);
        if (!cancel) setProfileDoc({});
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user?.uid, user]);

  const initial = useMemo(() => {
    const p = (profileDoc?.profile ?? {}) as UserProfile;

    // derive age from birthday if present + valid
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-lg w-full rounded-xl border bg-white p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">BMI / BMR Calculators</h1>
          <p className="text-gray-600 mb-4">
            Create a free account to access the calculators and personalize your results.
          </p>
          <button
            onClick={() => setShowSignup(true)}
            className="rounded-md bg-[#58e221] text-white px-4 py-2 hover:opacity-90"
          >
            Create Free Account
          </button>
          <SignUpModal isOpen={showSignup} onClose={() => setShowSignup(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <BmiCalculator initialHeightCm={initial.heightCm} initialWeightKg={initial.weightKg} />
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
