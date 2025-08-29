"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Profile = {
  displayName?: string;
  birthday?: string;     // ISO yyyy-mm-dd
  heightCm?: number;
  weightKg?: number;
  sex?: "male" | "female" | "other";
};

export default function ProfileForm() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!mounted) return;
        const data = snap.data() || {};
        setProfile({
          displayName: data.name || user.displayName || "",
          birthday: data.profile?.birthday || "",
          heightCm: data.profile?.heightCm ?? undefined,
          weightKg: data.profile?.weightKg ?? undefined,
          sex: data.profile?.sex || "other",
        });
      } catch (e: any) {
        setErr(e?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        name: profile.displayName ?? null,
        profile: {
          birthday: profile.birthday || null,
          heightCm: profile.heightCm ?? null,
          weightKg: profile.weightKg ?? null,
          sex: profile.sex || "other",
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
      setMsg("Profile saved.");
    } catch (e: any) {
      setErr(e?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

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
            onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Birthday</span>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.birthday ?? ""}
            onChange={(e) => setProfile(p => ({ ...p, birthday: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Height (cm)</span>
          <input
            type="number" inputMode="decimal" min={0} step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.heightCm ?? ""}
            onChange={(e) => setProfile(p => ({ ...p, heightCm: e.target.value ? Number(e.target.value) : undefined }))}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Weight (kg)</span>
          <input
            type="number" inputMode="decimal" min={0} step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.weightKg ?? ""}
            onChange={(e) => setProfile(p => ({ ...p, weightKg: e.target.value ? Number(e.target.value) : undefined }))}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Sex</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={profile.sex ?? "other"}
            onChange={(e) => setProfile(p => ({ ...p, sex: e.target.value as Profile["sex"] }))}
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
