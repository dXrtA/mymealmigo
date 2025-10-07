// src/app/page.tsx
"use client";

import { Features } from "@/components/features";
import { Pricing } from "@/components/pricing";
import { Testimonials } from "@/components/testimonials";
import { HowItWorks } from "@/components/how-it-works";
import { useContent } from "@/context/ContentProvider";
import { Hero } from "@/components/hero";
import { Download } from "@/components/download";

export default function Home() {
  const { hero, features, howItWorks, pricing, testimonials, isLoading } = useContent();

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
          "MyMealMigo is your all-in-one nutrition companion that makes healthy eating simple, personalized, and fun."
        }
        videoURL={hero.videoURL}
        imageURL={hero.imageURL}
        mediaType={hero.mediaType || "image"}
      />

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
