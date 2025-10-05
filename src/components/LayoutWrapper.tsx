'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, Lock } from 'lucide-react'; // ← added Lock
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
}

const defaultSettings: Settings = {
  general: {
    siteName: 'MyMealMigo',
    siteDescription: 'A smart companion to guide you toward a healthier lifestyle',
    contactEmail: 'support@mymealmigo.com',
    phoneNumber: '+1 (888) 123-4567',
  },
  socialLinks: {
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
  },
};

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ref = doc(db, "settings", "main");
        const snap = await getDoc(ref); // one-time read, no listener

        if (cancelled) return;

        if (snap.exists()) {
          console.log("Footer settings loaded:", snap.data());
          setSettings(snap.data() as Settings);
        } else {
          console.log("No settings document found, using defaults");
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching footer settings:", error);
        if (!cancelled) setSettings(defaultSettings);
      }
    })();

    return () => {
      cancelled = true; // prevents state update after unmount
    };
  }, []);

  // Filter non-empty social links
  const activeSocialLinks = Object.entries(settings.socialLinks).filter(
    ([, link]) => link.trim() !== ''
  );

  return (
    <>
      {children}
      {!isAdminRoute && (
        <footer className="bg-white text-gray-800 py-12 border-t border-[#2fe93b]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-[#58e221]">
                  {settings.general.siteName}
                </h3>
                <p className="text-gray-600">{settings.general.siteDescription}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-[#58e221]">Quick Links</h3>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-600 hover:text-[#58e221]">Features</a></li>
                  <li><a href="#howitworks" className="text-gray-600 hover:text-[#58e221]">How It Works</a></li>
                  <li><a href="#pricing" className="text-gray-600 hover:text-[#58e221]">Pricing</a></li>
                  <li><a href="#testimonials" className="text-gray-600 hover:text-[#58e221]">Testimonials</a></li>
                  {isLoggedIn && (
                    <li><a href="/download" className="text-gray-600 hover:text-[#58e221]">Download</a></li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-[#58e221]">Connect</h3>
                <ul className="space-y-2">
                  <li>
                    <span className="text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {settings.general.contactEmail || 'Email not set'}
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-600 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {settings.general.phoneNumber || 'Phone not set'}
                    </span>
                  </li>

                  {/* Admin login moved to footer */}
                  <li>
                    <a href="/login" className="text-gray-600 hover:text-[#58e221] flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Admin login
                    </a>
                  </li>
                </ul>

                {activeSocialLinks.length > 0 && (
                  <div className="flex space-x-4 mt-4">
                    {activeSocialLinks.map(([key, link]) => (
                      <a
                        key={key}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-[#58e221]"
                      >
                        {key === 'facebook' && <Facebook className="h-6 w-6" />}
                        {key === 'twitter' && <Twitter className="h-6 w-6" />}
                        {key === 'instagram' && <Instagram className="h-6 w-6" />}
                        {key === 'youtube' && <Youtube className="h-6 w-6" />}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-[#2fe93b] text-center text-gray-600">
              <p>© {new Date().getFullYear()} {settings.general.siteName}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
