// src/app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Features } from "@/components/features";
import { Pricing } from "@/components/pricing";
import { Testimonials } from "@/components/testimonials";
import { HowItWorks } from "@/components/how-it-works";
import { useContent } from "@/context/ContentProvider";
import { Hero } from "@/components/hero";
import { useAuth } from "@/context/AuthContext";
import { Download } from "@/components/download"; 

export default function Home() {
  const router = useRouter();
  const { hero, features, howItWorks, pricing, testimonials, isLoading } = useContent();
  const { user } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const mappedFeatures = features;

  return (
    <div className="font-sans antialiased text-gray-800 bg-white">
      <Hero
        title1={hero.title1 || "Eat Smart,"}
        title2={hero.title2 || "Live Better."}
        description={
          hero.description ||
          "MyMealMigo is your all-in-one nutrition companion that makes healthy eating simple, personalized, and fun. Take our Quiz to get a personal meal plan."
        }
        videoURL={hero.videoURL}
        imageURL={hero.imageURL}
        mediaType={hero.mediaType || "image"}
      >
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

      {/* Display-only pricing (no buttons / no click actions) */}
      <Pricing plans={pricing} hideButtons />

      <Testimonials testimonials={testimonials} />
      <HowItWorks steps={howItWorks} />

      {/* Download section */}
      <Download />
    </div>
  );
}
