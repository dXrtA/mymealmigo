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

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const docRef = doc(db, "settings", "main");

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, defaultSettings);
        setSettings(defaultSettings);
      } else {
        setSettings(snap.data() as Settings);
      }
    } catch (e: any) {
      console.error("Settings load error:", e);
      setMsg(
        e?.code === "permission-denied"
          ? "Permission denied. Check Firestore rules."
          : "Failed to load settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]); // one-time fetch when mounted & authed

  const handleChange =
    (section: keyof Settings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setSettings((prev) => ({
        ...prev,
        [section]: { ...(prev as any)[section], [name]: value },
      }));
    };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await setDoc(docRef, settings, { merge: true });
      setMsg("Settings saved!");
      setTimeout(() => setMsg(""), 2500);
    } catch (e: any) {
      console.error("Settings save error:", e);
      setMsg(
        e?.code === "permission-denied"
          ? "Permission denied. Check Firestore rules."
          : "Failed to save."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {msg && <p className="text-sm mb-3">{msg}</p>}

        {loading ? (
          <div className="p-6 bg-white border rounded-xl">Loading…</div>
        ) : (
          <div className="space-y-6 bg-white p-6 rounded-xl border">
            {/* General */}
            <section>
              <h2 className="text-lg font-medium mb-3">General</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Site Name</label>
                  <input
                    name="siteName"
                    value={settings.general.siteName}
                    onChange={handleChange("general")}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Description</label>
                  <input
                    name="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={handleChange("general")}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={settings.general.contactEmail}
                    onChange={handleChange("general")}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Phone</label>
                  <input
                    name="phoneNumber"
                    value={settings.general.phoneNumber}
                    onChange={handleChange("general")}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </section>

            {/* Social */}
            <section>
              <h2 className="text-lg font-medium mb-3">Social Links</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {(["facebook", "twitter", "instagram", "youtube"] as const).map((k) => (
                  <div key={k}>
                    <label className="block text-sm text-gray-700 mb-1 capitalize">{k}</label>
                    <input
                      name={k}
                      value={(settings.socialLinks as any)[k]}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, [k]: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* API Keys */}
            <section>
              <h2 className="text-lg font-medium mb-3">API Keys</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {(["geminiApiKey", "stripePublishableKey", "stripeSecretKey"] as const).map((k) => (
                  <div key={k}>
                    <label className="block text-sm text-gray-700 mb-1">{k}</label>
                    <input
                      type="password"
                      name={k}
                      value={(settings.apiKeys as any)[k]}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          apiKeys: { ...prev.apiKeys, [k]: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* App Store Links */}
            <section>
              <h2 className="text-lg font-medium mb-3">App Links</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {(["googlePlay", "appStore", "apk"] as const).map((k) => (
                  <div key={k}>
                    <label className="block text-sm text-gray-700 mb-1 capitalize">{k}</label>
                    <input
                      name={k}
                      value={(settings.appStoreLinks as any)[k]}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          appStoreLinks: { ...prev.appStoreLinks, [k]: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF6F61] text-white hover:opacity-90 disabled:opacity-60"
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
