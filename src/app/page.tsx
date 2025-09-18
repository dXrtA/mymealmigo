"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Features } from "@/components/features";
import { Pricing } from "@/components/pricing";
import { Testimonials } from "@/components/testimonials";
import { HowItWorks } from "@/components/how-it-works";
import { SignUpModal } from "@/components/sign-up-modal";
import UpgradeToPremiumModal from "@/components/UpgradeToPremiumModal";
import { useContent } from "@/context/ContentProvider";
import { Hero } from "@/components/hero";
import { useAuth } from "@/context/AuthContext";
import { Download } from "@/components/download"; 

export default function Home() {
  const router = useRouter();
  const [showSignUp, setShowSignUp] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"free" | "premium" | null>(null);

  const { hero, features, howItWorks, pricing, testimonials, isLoading } = useContent();
  const { user } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const mappedFeatures = features;

  // still used by Pricing (kept so its CTA works)
  const openModal = (role?: "free" | "premium") => {
    if (user) {
      if (role === "premium") {
        setShowUpgrade(true);
      } else {
        router.push("/account");
      }
      return;
    }
    setSelectedRole(role || null);
    setShowSignUp(true);
  };

  const closeModal = () => {
    setShowSignUp(false);
    setSelectedRole(null);
  };

  return (
    <div className="font-sans antialiased text-gray-800 bg-white">
      <Hero
        title1={hero.title1 || "Eat Smart,"}
        title2={hero.title2 || "Live Better."}
        description={
          hero.description ||
          "MyMealMigo is your all-in-one nutrition companion that makes healthy eating simple, personalized, and fun."
        }
        videoURL={hero.videoURL}
        imageURL={hero.imageURL}
        mediaType={hero.mediaType || "image"}
      >
        {/* Unimeal-style CTA: Male / Female — no Get Started, no Learn More, no About Project */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/onboarding?sex=male"
            className="rounded-full bg-[#58e221] px-8 py-3 text-white font-medium hover:opacity-90 text-center"
          >
            Male
          </Link>
          <Link
            href="/onboarding?sex=female"
            className="rounded-full bg-[#58e221] px-8 py-3 text-white font-medium hover:opacity-90 text-center"
          >
            Female
          </Link>
        </div>
      </Hero>

      <Features features={mappedFeatures} />
      <Pricing plans={pricing} onOpenModal={openModal} />
      <Testimonials testimonials={testimonials} />
      <HowItWorks steps={howItWorks} />
      
      {/* ✅ Download section on the home page */}
      <Download />

      {/* Modals (kept so Pricing CTA continues to work) */}
      <SignUpModal
        isOpen={showSignUp}
        onClose={closeModal}
        initialRole={selectedRole || undefined}
      />
      <UpgradeToPremiumModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  );
}
