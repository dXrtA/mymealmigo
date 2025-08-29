"use client";

import React, { useEffect, useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/context/ProtectedRoute";

interface Settings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    phoneNumber: string;
  };
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
  };
  apiKeys: {
    geminiApiKey: string;
    stripePublishableKey: string;
    stripeSecretKey: string;
  };
  appStoreLinks: {
    googlePlay: string;
    appStore: string;
    apk: string;
  };
}

const defaultSettings: Settings = {
  general: {
    siteName: "MyMealMigo",
    siteDescription: "A smart companion to guide you toward a healthier lifestyle",
    contactEmail: "support@mymealmigo.com",
    phoneNumber: "+1 (888) 123-4567",
  },
  socialLinks: { facebook: "", twitter: "", instagram: "", youtube: "" },
  apiKeys: { geminiApiKey: "", stripePublishableKey: "", stripeSecretKey: "" },
  appStoreLinks: { googlePlay: "", appStore: "", apk: "" },
};

// helpers for safe error reading (no `any`)
const hasCode = (x: unknown): x is { code: string } =>
  typeof x === "object" && x !== null && typeof (x as Record<string, unknown>).code === "string";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // typed field setter – no `any`
  const setSectionField = <
    S extends keyof Settings,
    K extends keyof Settings[S]
  >(
    section: S,
    key: K,
    value: Settings[S][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  // Load on mount (when user exists) without a missing-deps warning
  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setLoading(true);
      setMsg("");
      try {
        const ref = doc(db, "settings", "main");
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, defaultSettings);
          setSettings(defaultSettings);
        } else {
          setSettings(snap.data() as Settings);
        }
      } catch (e: unknown) {
        console.error("Settings load error:", e);
        setMsg(
          hasCode(e) && e.code === "permission-denied"
            ? "Permission denied. Check Firestore rules."
            : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    setMsg("");
    try {
      const ref = doc(db, "settings", "main");
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, defaultSettings);
        setSettings(defaultSettings);
      } else {
        setSettings(snap.data() as Settings);
      }
      setMsg("Settings refreshed.");
      setTimeout(() => setMsg(""), 1800);
    } catch (e: unknown) {
      console.error("Settings refresh error:", e);
      setMsg(
        hasCode(e) && e.code === "permission-denied"
          ? "Permission denied. Check Firestore rules."
          : "Failed to refresh."
      );
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const ref = doc(db, "settings", "main");
      await setDoc(ref, settings, { merge: true });
      setMsg("Settings saved!");
      setTimeout(() => setMsg(""), 2500);
    } catch (e: unknown) {
      console.error("Settings save error:", e);
      setMsg(
        hasCode(e) && e.code === "permission-denied"
          ? "Permission denied. Check Firestore rules."
          : "Failed to save."
      );
    } finally {
      setSaving(false);
    }
  };

  // strongly-typed key lists (lets us use settings.section[k] directly)
  const socialKeys = ["facebook", "twitter", "instagram", "youtube"] as const;
  const apiKeys = ["geminiApiKey", "stripePublishableKey", "stripeSecretKey"] as const;
  const storeKeys = ["googlePlay", "appStore", "apk"] as const;

  return (
    <ProtectedRoute requireAdmin>
      <div className="max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {msg && <p className="mb-3 text-sm">{msg}</p>}

        {loading ? (
          <div className="rounded-xl border bg-white p-6">Loading…</div>
        ) : (
          <div className="space-y-6 rounded-xl border bg-white p-6">
            {/* General */}
            <section>
              <h2 className="mb-3 text-lg font-medium">General</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">Site Name</label>
                  <input
                    value={settings.general.siteName}
                    onChange={(e) => setSectionField("general", "siteName", e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">Description</label>
                  <input
                    value={settings.general.siteDescription}
                    onChange={(e) => setSectionField("general", "siteDescription", e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) => setSectionField("general", "contactEmail", e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">Phone</label>
                  <input
                    value={settings.general.phoneNumber}
                    onChange={(e) => setSectionField("general", "phoneNumber", e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>
              </div>
            </section>

            {/* Social */}
            <section>
              <h2 className="mb-3 text-lg font-medium">Social Links</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {socialKeys.map((k) => (
                  <div key={k}>
                    <label className="mb-1 block text-sm capitalize text-gray-700">{k}</label>
                    <input
                      value={settings.socialLinks[k]}
                      onChange={(e) => setSectionField("socialLinks", k, e.target.value)}
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* API Keys */}
            <section>
              <h2 className="mb-3 text-lg font-medium">API Keys</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {apiKeys.map((k) => (
                  <div key={k}>
                    <label className="mb-1 block text-sm text-gray-700">{k}</label>
                    <input
                      type="password"
                      value={settings.apiKeys[k]}
                      onChange={(e) => setSectionField("apiKeys", k, e.target.value)}
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* App Store Links */}
            <section>
              <h2 className="mb-3 text-lg font-medium">App Links</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {storeKeys.map((k) => (
                  <div key={k}>
                    <label className="mb-1 block text-sm capitalize text-gray-700">{k}</label>
                    <input
                      value={settings.appStoreLinks[k]}
                      onChange={(e) => setSectionField("appStoreLinks", k, e.target.value)}
                      className="w-full rounded-md border px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-[#FF6F61] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
              >
                <Save className="h-5 w-5" />
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
