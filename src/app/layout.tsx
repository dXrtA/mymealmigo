import type React from "react";
import { Navbar } from "@/components/navbar";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ContentProvider } from "@/context/ContentProvider";
import { AuthProvider } from "@/context/AuthContext";
import LayoutWrapper from "@/components/LayoutWrapper";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MyMealMigo - Your Personal Diet & Health Companion",
  description: "MyMealMigo is your all-in-one nutrition & fitness companion. Eat smarter, live better.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                console.log('Running DOM normalization script');
                if (document.body) {
                  document.body.removeAttribute('data-new-gr-c-s-check-loaded');
                  document.body.removeAttribute('data-gr-ext-installed');
                } else {
                  document.addEventListener('DOMContentLoaded', () => {
                    console.log('DOMContentLoaded: Removing Grammarly attributes');
                    document.body.removeAttribute('data-new-gr-c-s-check-loaded');
                    document.body.removeAttribute('data-gr-ext-installed');
                  });
                }
              })();
            `,
          }}
        />
  <script src="https://cdn.botpress.cloud/webchat/v3.3/inject.js"></script>
  <script src="https://files.bpcontent.cloud/2025/10/06/14/20251006142047-5STW4U7G.js" defer></script>
  </head>
      <body
        className={`${inter.className} bg-white min-h-screen`}
        suppressHydrationWarning // Temporary for development
      >
        <AuthProvider>
          <ContentProvider>
            <LayoutWrapper>
              <Navbar />
              {children}
            </LayoutWrapper>
          </ContentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}