"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, onSnapshot as onCol } from "firebase/firestore";

type HeroContent = {
  title1: string;
  title2: string;
  description: string;
  imageURL?: string;
  videoURL?: string;
  mediaType: "image" | "video";
  storagePath?: string;
};

type Feature = { title: string; description: string; icon: string };
type Step = { title: string; description: string; image?: string; storagePath?: string };
type Plan = {
  name: string;
  description: string;
  price: number;
  features: string[];
  buttonText: string;
  featured?: boolean;
};

type AppRating = {
  id: string;
  name: string;
  text: string;
  rating: number;
  submittedTime: string;
  photoURL?: string;
  isVisible?: boolean;
};

type TestimonialSettings = {
  sortField: "rating" | "submittedTime";
  sortDirection: "asc" | "desc";
  minRating: number;
  showOnlyWithText: boolean;
  maxTestimonials: number;
};

type LandingPageContent = {
  hero: HeroContent;
  features: Feature[];
  howItWorks: Step[];
  pricing: Plan[];
  testimonialSettings?: TestimonialSettings;
};

type ContentContextType = {
  hero: HeroContent;
  features: Feature[];
  howItWorks: Step[];
  pricing: Plan[];
  testimonials: AppRating[];
  isLoading: boolean;
};

const ContentContext = createContext<ContentContextType | null>(null);

const toArray = <T,>(v: any): T[] =>
  Array.isArray(v) ? v : v && typeof v === "object" ? (Object.values(v) as T[]) : [];

const DEFAULT: LandingPageContent = {
  hero: { title1: "", title2: "", description: "", imageURL: "", videoURL: "", mediaType: "image" },
  features: [],
  howItWorks: [],
  pricing: [],
  testimonialSettings: {
    sortField: "rating",
    sortDirection: "desc",
    minRating: 0,
    showOnlyWithText: false,
    maxTestimonials: 0,
  },
};

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<LandingPageContent>(DEFAULT);
  const [testimonials, setTestimonials] = useState<AppRating[]>([]);
  const [loadedDoc, setLoadedDoc] = useState(false);
  const [loadedRatings, setLoadedRatings] = useState(false);

  useEffect(() => {
    // Live listener to the ONE doc your CMS writes to
    const unsubDoc = onSnapshot(
      doc(db, "landingPageContent", "main"),
      (snap) => {
        if (!snap.exists()) {
          console.warn("[Content] landingPageContent/main missing. Using defaults.");
          setContent(DEFAULT);
          setLoadedDoc(true);
          return;
        }
        const raw = snap.data() as Partial<LandingPageContent>;
        // Normalize arrays so components never crash
        const normalized: LandingPageContent = {
          hero: {
            ...DEFAULT.hero,
            ...(raw.hero || {}),
            mediaType: (raw?.hero?.mediaType as "image" | "video") || "image",
          },
          features: toArray<Feature>(raw.features),
          howItWorks: toArray<Step>(raw.howItWorks),
          pricing: toArray<Plan>(raw.pricing).map((p) => ({
            ...p,
            features: toArray<string>(p?.features),
          })),
          testimonialSettings: raw.testimonialSettings || DEFAULT.testimonialSettings,
        };
        console.log("[Content] live update:", normalized);
        setContent(normalized);
        setLoadedDoc(true);
      },
      (err) => {
        console.error("[Content] Failed to read landingPageContent/main:", err);
        setContent(DEFAULT);
        setLoadedDoc(true);
      }
    );

    // Live listener to public testimonials
    const unsubCol = onCol(
      collection(db, "appRating"),
      (qs) => {
        const list: AppRating[] = qs.docs.map((d) => {
          const x: any = d.data() || {};
          return {
            id: d.id,
            name: x.name || "",
            text: x.text || "",
            rating: x.rating || 0,
            submittedTime:
              x.submittedTime?.toDate?.()?.toISOString?.() ||
              x.submittedTime ||
              new Date().toISOString(),
            photoURL: x.photoURL || "",
            isVisible: x.isVisible !== false, // default true
          };
        });
        console.log("[Content] testimonials update:", list.length);
        setTestimonials(list);
        setLoadedRatings(true);
      },
      (err) => {
        console.error("[Content] Failed to read appRating:", err);
        setTestimonials([]);
        setLoadedRatings(true);
      }
    );

    return () => {
      unsubDoc();
      unsubCol();
    };
  }, []);

  const isLoading = !loadedDoc || !loadedRatings;

  const value = useMemo<ContentContextType>(() => {
    // Apply admin testimonial filters on the client
    const s = content.testimonialSettings || DEFAULT.testimonialSettings!;
    let shown = testimonials
      .filter((t) => t.isVisible !== false)
      .filter((t) => t.rating >= (s.minRating ?? 0))
      .filter((t) => !s.showOnlyWithText || (t.text && t.text.trim() !== ""));

    shown = shown.sort((a, b) => {
      if (s.sortField === "rating") {
        return s.sortDirection === "asc" ? a.rating - b.rating : b.rating - a.rating;
      } else {
        const aT = new Date(a.submittedTime).getTime() || 0;
        const bT = new Date(b.submittedTime).getTime() || 0;
        return s.sortDirection === "asc" ? aT - bT : bT - aT;
      }
    });

    if (s.maxTestimonials && s.maxTestimonials > 0) {
      shown = shown.slice(0, s.maxTestimonials);
    }

    return {
      hero: content.hero,
      features: content.features,
      howItWorks: content.howItWorks,
      pricing: content.pricing,
      testimonials: shown,
      isLoading,
    };
  }, [content, testimonials, isLoading]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within a ContentProvider");
  return ctx;
}
