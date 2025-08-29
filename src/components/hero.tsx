import React from "react";
import Image from "next/image";
import { HeroProps } from "@/types/landingPage";

export function Hero({
  title1,
  title2,
  description,
  videoURL,
  imageURL,
  mediaType,
  children,
}: HeroProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-stretch lg:gap-8">
          {/* Text Section */}
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:pb-28 xl:pb-32">
            <main className="pt-10 sm:pt-12 md:pt-16 lg:pt-20 xl:pt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">{title1}</span>
                  <span className="block text-[#58e221]">{title2}</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  {description}
                </p>
                {children && (
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    {children}
                  </div>
                )}
              </div>
            </main>
          </div>

          {/* Media Section — fixed square, cover */}
          <div className="lg:flex-1 flex items-start justify-center pt-10 sm:pt-12 md:pt-16 lg:pt-20 xl:pt-28">
            <div
              className="
                relative aspect-square
                w-[280px] sm:w-[340px] md:w-[420px] lg:w-[500px]
                rounded-2xl overflow-hidden bg-gray-100
                shadow-[0_10px_30px_rgba(0,0,0,0.06)]
              "
            >
              {mediaType === "video" && videoURL ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={videoURL.trimEnd()}
                  autoPlay
                  loop
                  muted
                  playsInline
                  // optional: a poster while the video loads
                  poster={imageURL?.trimEnd()}
                />
              ) : imageURL ? (
                <Image
                  src={imageURL.trimEnd()}
                  alt="MyMealMigo hero"
                  fill
                  sizes="(min-width:1024px) 500px, (min-width:768px) 420px, 90vw"
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <Image
                  src="/placeholder.svg"
                  alt="MyMealMigo placeholder"
                  fill
                  className="object-contain p-6"
                  unoptimized
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
