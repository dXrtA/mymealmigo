"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/context/ProtectedRoute";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AppStoreLinks {
  googlePlay: string;
  appStore: string;
  apk: string;
}

export default function DownloadPage() {
  const [appStoreLinks, setAppStoreLinks] = useState<AppStoreLinks>({
    googlePlay: "https://play.google.com/store",
    appStore: "https://www.apple.com/app-store/",
    apk: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppStoreLinks = async () => {
      try {
        const settingsRef = doc(db, "settings", "main");
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          const links = data.appStoreLinks as AppStoreLinks;

          if (links && links.googlePlay && links.appStore) {
            setAppStoreLinks({
              googlePlay: links.googlePlay,
              appStore: links.appStore,
              apk: links.apk || "",
            });
          } else {
            console.warn("DownloadPage - appStoreLinks missing or incomplete:", data.appStoreLinks);
            setError("App store links are not configured correctly.");
          }
        } else {
          console.error("DownloadPage - Settings document not found");
          setError("Failed to load app store links.");
        }
      } catch (err) {
        console.error("DownloadPage - Error fetching app store links:", err);
        setError("Failed to load app store links. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppStoreLinks();
  }, []);

  return (
    <ProtectedRoute requireAuth redirectTo="/login">
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
        {loading ? (
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-[#58e221] mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <p className="text-lg">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center">
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <Link href="/" className="text-[#58e221] hover:underline">
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-6">Download MyMealMigo</h1>
            <p className="text-lg mb-8 text-center max-w-md">
              Your personal diet and health companion is ready! Download the app to start tracking your health.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href={appStoreLinks.appStore}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-[#58e221] to-[#FF9A8B] text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#58e221]"
              >
                App Store
              </Link>
              <Link
                href={appStoreLinks.googlePlay}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-[#58e221] to-[#FF9A8B] text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#58e221]"
              >
                Google Play
              </Link>
              {appStoreLinks.apk && (
                <Link
                  href={appStoreLinks.apk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gradient-to-r from-[#58e221] to-[#FF9A8B] text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#58e221]"
                >
                  Download APK
                </Link>
              )}
            </div>
            <Link href="/" className="mt-6 text-[#58e221] hover:underline">
              Back to Home
            </Link>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}