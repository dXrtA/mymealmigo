"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Features } from "@/components/features";
import { Pricing } from "@/components/pricing";
import { Testimonials } from "@/components/testimonials";
import { HowItWorks } from "@/components/how-it-works";
import { SignUpModal } from "@/components/sign-up-modal";
import UpgradeToPremiumModal from "@/components/UpgradeToPremiumModal";
import { ProjectWebsite } from "@/components/ProjectWebsite";
import { useContent } from "@/context/ContentProvider";
import { Hero } from "@/components/hero";
import { useAuth } from "@/context/AuthContext";


export default function Home() {
  const router = useRouter();
  const [showProject, setShowProject] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // ⬇️ Only free | premium (nutritionist removed)
  const [selectedRole, setSelectedRole] = useState<"free" | "premium" | null>(null);

  const { hero, features, howItWorks, pricing, testimonials, isLoading } = useContent();
  const { user } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const mappedFeatures = features;

  // ⬇️ Smart handler:
  // - Logged OUT: open SignUpModal (free default or premium if pressed in Pricing)
  // - Logged IN:
  //    - premium CTA -> open UpgradeToPremiumModal
  //    - any other CTA (e.g., "Get Started") -> go to /account
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
      {showProject ? (
        <div className="w-full h-full fade-in">
          <ProjectWebsite onClose={() => setShowProject(false)} />
        </div>
      ) : (
        <>
          <Hero
            title1={hero.title1 || "Your Health"}
            title2={hero.title2 || "Made Simple"}
            description={hero.description || "Track your diet and health with ease."}
            videoURL={hero.videoURL}
            imageURL={hero.imageURL}
            mediaType={hero.mediaType || "image"}
          >
            {/* Do NOT show Download here per your preference */}
            {!user && (
              <button
                onClick={() => openModal("free")}
                className="btn btn-primary btn-lg"
              >
                Get Started
              </button>
            )}
            <a
              href="#features"
              className="mt-3 sm:mt-0 sm:ml-3 w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-[#58e221] bg-white hover:bg-gray-100 md:py-4 md:text-lg md:px-10"
            >
              Learn More
            </a>
            <button
              onClick={() => setShowProject(true)}
              className="mt-3 sm:mt-0 sm:ml-3 w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-[#58e221] bg-white hover:bg-gray-100 md:py-4 md:text-lg md:px-10"
            >
              About Project
            </button>
          </Hero>

          <Features features={mappedFeatures} />
          {/* Pricing will call onOpenModal('premium') for premium CTAs */}
          <Pricing plans={pricing} onOpenModal={openModal} />
          <Testimonials testimonials={testimonials} />
          <HowItWorks steps={howItWorks} />

          {/* Modals */}
          <SignUpModal
            isOpen={showSignUp}
            onClose={closeModal}
            initialRole={selectedRole || undefined} // safe; 'nutritionist' removed everywhere here
          />
          <UpgradeToPremiumModal
            isOpen={showUpgrade}
            onClose={() => setShowUpgrade(false)}
          />
        </>
      )}
    </div>
  );
}
