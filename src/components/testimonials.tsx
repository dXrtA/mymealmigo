"use client";

import Image from "next/image";
import type { Testimonials } from "@/types/landingPage";
import { formatDistanceToNow, subDays } from "date-fns";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestimonialsProps {
  testimonials: Testimonials[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formatSubmittedTime = (date: Date | string) => {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    if (isNaN(parsedDate.getTime())) {
      console.warn("Invalid submittedTime:", date);
      return "Unknown date";
    }
    const threshold = subDays(new Date(), 30);
    if (parsedDate > threshold) {
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    }
    return parsedDate.toLocaleDateString();
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div id="testimonials" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Testimonials</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            What Our Users Have to Say
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Find out how MyMealMigo has supported users on their wellness journey.
          </p>
        </div>

        <div className="mt-12 relative">
          {testimonials.length > 3 && (
            <>
              <Button
                variant="outline"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/80 hover:bg-white shadow-sm backdrop-blur-sm"
                onClick={() => scroll("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/80 hover:bg-white shadow-sm backdrop-blur-sm"
                onClick={() => scroll("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-6 pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollBehavior: "smooth" }}
          >
            {testimonials.length > 0 ? (
              testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="testimonial-card bg-white rounded-lg shadow-md p-6 flex flex-col relative min-w-[280px] max-w-[320px] snap-center"
                >
                  <div className="flex items-center mb-4">
                    <Image
                      src={testimonial.photoURL || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{testimonial.name}</h4>
                    </div>
                  </div>
                  <p className="text-gray-600 italic flex-grow">{`"${testimonial.text}"`}</p>
                  <div className="mt-4 flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${
                          i < testimonial.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784 .57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81 .588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-500 absolute bottom-4 right-4">
                    {formatSubmittedTime(testimonial.submittedTime)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center w-full">No testimonials available.</p>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}