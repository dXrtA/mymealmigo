"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Sex = "male" | "female" | "other";

type Profile = {
  displayName?: string;
  birthday?: string;       // ISO yyyy-mm-dd (stored in users/{uid}.profile)
  heightCm?: number;
  weightKg?: number;
  sex?: Sex;               // UX label; mapped to sexAtBirth in health_profile
};

type FirestoreUserDoc = {
  name?: string;
  profile?: {
    birthday?: string;
    heightCm?: number;
    weightKg?: number;
    sex?: Sex;
  };
};

type HealthProfileDemographics = {
  birthYear?: number;
  sexAtBirth?: "male" | "female" | "intersex" | "prefer_not_to_say";
  heightCm?: number;
  weightKg?: number;
  country?: string;
};

export default function ProfileForm() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;

      try {
        // 1) Basic user doc
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = (userSnap.data() ?? {}) as FirestoreUserDoc;

        // 2) Health profile (private)
        const hpRef = doc(db, "users", user.uid, "private", "health_profile");
        const hpSnap = await getDoc(hpRef);
        const hp = hpSnap.exists() ? (hpSnap.data() as { demographics?: HealthProfileDemographics }) : {};

        // Prefer values from health_profile.demographics if present
        const d = hp.demographics ?? {};
        const sexFromHP: Sex | undefined =
          d.sexAtBirth === "male" || d.sexAtBirth === "female"
            ? d.sexAtBirth
            : d.sexAtBirth
            ? "other"
            : undefined;

        const merged: Profile = {
          displayName: userData.name ?? user.displayName ?? "",
          // birthday is only stored in users/{uid}.profile (string)
          birthday: userData.profile?.birthday ?? "",
          // prefer HP height/weight; fallback to users.profile
          heightCm: d.heightCm ?? userData.profile?.heightCm ?? undefined,
          weightKg: d.weightKg ?? userData.profile?.weightKg ?? undefined,
          // prefer HP sex; fallback to users.profile.sex
          sex: sexFromHP ?? userData.profile?.sex ?? "other",
        };

        if (!cancelled) setProfile(merged);
      } catch (e: unknown) {
        const message =
          typeof e === "object" && e && "message" in e
            ? String((e as { message?: string }).message)
            : "Failed to load profile.";
        if (!cancelled) setErr(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      // --- Save 1: users/{uid} (your existing shape) ---
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: profile.displayName ?? null,
        profile: {
          birthday: profile.birthday || null,
          heightCm: typeof profile.heightCm === "number" ? profile.heightCm : null,
          weightKg: typeof profile.weightKg === "number" ? profile.weightKg : null,
          sex: (profile.sex as Sex) ?? "other",
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // --- Save 2: users/{uid}/private/health_profile (demographics only) ---
      const hpRef = doc(db, "users", user.uid, "private", "health_profile");
      // compute birthYear if we have a birthday string
      const birthYear =
        profile.birthday && /^\d{4}-\d{2}-\d{2}$/.test(profile.birthday)
          ? new Date(profile.birthday).getFullYear()
          : undefined;

      // Map our "sex" to health_profile.sexAtBirth
      let sexAtBirth: HealthProfileDemographics["sexAtBirth"] | undefined;
      if (profile.sex === "male" || profile.sex === "female") sexAtBirth = profile.sex;
      else sexAtBirth = "prefer_not_to_say";

      await setDoc(
        hpRef,
        {
          demographics: {
            // Only set fields when they’re defined; null removes the key during merge,
            // so we omit undefined ones instead of forcing nulls here.
            ...(typeof profile.heightCm === "number" ? { heightCm: profile.heightCm } : {}),
            ...(typeof profile.weightKg === "number" ? { weightKg: profile.weightKg } : {}),
            ...(typeof birthYear === "number" ? { birthYear } : {}),
            ...(sexAtBirth ? { sexAtBirth } : {}),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg("Profile saved.");
      setTimeout(() => setMsg(null), 2500);
    } catch (e: unknown) {
      const message =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Failed to save profile.";
      setErr(message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="text-sm text-gray-500">Loading profile…</div>;

  return (
    <div className="rounded-xl border p-4 bg-white">
      <h3 className="text-lg font-semibold mb-3">Profile</h3>

      {msg && <p className="text-green-600 text-sm mb-2">{msg}</p>}
      {err && <p className="text-red-600 text-sm mb-2">{err}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-gray-700">Account Name</span>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.displayName ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Birthday</span>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.birthday ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, birthday: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Height (cm)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.heightCm ?? ""}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                heightCm: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Weight (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.weightKg ?? ""}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                weightKg: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Sex</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.sex ?? "other"}
            onChange={(e) => setProfile((p) => ({ ...p, sex: e.target.value as Sex }))}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / Prefer not to say</option>
          </select>
        </label>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-md bg-[#58e221] text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
