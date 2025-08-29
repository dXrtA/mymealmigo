"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import UpgradeToPremiumModal from "@/components/UpgradeToPremiumModal";
import ProfileForm from "@/components/profileForm"; 
import { useAuth } from "@/context/AuthContext";

type Profile = {
  displayName?: string;
  email?: string;
  subscription?: { plan?: string; active?: boolean; billing?: string | null };
};

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [openUpgrade, setOpenUpgrade] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setProfile(snap.exists() ? (snap.data() as Profile) : null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // still show the auth guard while auth context resolves
  if (authLoading) return <div className="p-4">Loading…</div>;

  // protect the page if not signed in
  if (!user) return <RequireAuth><div /></RequireAuth>;

  return (
    <RequireAuth>
      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-semibold">Account</h1>

        {loading ? (
          <p>Loading…</p>
        ) : !profile ? (
          <p>Profile not found.</p>
        ) : (
          <>
            <div className="p-4 rounded-xl border">
              <div className="font-medium">
                {user.displayName || profile.displayName || "Member"}
              </div>
              <div className="text-sm text-gray-600">
                {user.email || profile.email}
              </div>
            </div>

            <div className="p-4 rounded-xl border">
              <div className="font-medium mb-1">Plan</div>
              <div className="text-gray-700">
                {profile.subscription?.plan === "premium" && profile.subscription?.active ? (
                  <>Premium ({profile.subscription?.billing ?? "monthly"})</>
                ) : (
                  <>Free</>
                )}
              </div>
              {!(profile.subscription?.plan === "premium" && profile.subscription?.active) && (
                <button
                  onClick={() => setOpenUpgrade(true)}
                  className="mt-3 bg-[#58e221] text-white px-4 py-2 rounded-md hover:opacity-90"
                >
                  Go Premium
                </button>
              )}
            </div>

            {/* ✅ Profile editor */}
            <ProfileForm />
          </>
        )}

        <UpgradeToPremiumModal
          isOpen={openUpgrade}
          onClose={() => setOpenUpgrade(false)}
        />
      </main>
    </RequireAuth>
  );
}
