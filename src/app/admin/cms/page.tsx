"use client";

import { useState, useEffect } from "react";
import { Save, Edit, Eye, RefreshCw, Trash, Plus } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, doc, setDoc, getDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { HowItWorks } from "@/components/how-it-works";
import { Pricing } from "@/components/pricing";
import { Testimonials } from "@/components/testimonials";

// ---- helper to normalize unknown JSON into arrays ----
const toArray = <T,>(v: any): T[] =>
  Array.isArray(v) ? v : (v && typeof v === "object" ? (Object.values(v) as T[]) : []);

interface HeroContent {
  title1: string;
  title2: string;
  description: string;
  imageURL?: string;
  videoURL?: string;
  mediaType: "image" | "video";
  imageStoragePath?: string;
  videoStoragePath?: string;
}

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface Step {
  title: string;
  description: string;
  image: string;
  storagePath?: string;
}

interface Plan {
  name: string;
  description: string;
  price: number;
  features: string[];
  buttonText: string;
  featured?: boolean;
}

interface AppRating {
  id: string;
  name: string;
  text: string;
  rating: number;
  submittedTime: string;
  photoURL?: string;
}

interface TestimonialSettings {
  sortField: "rating" | "submittedTime";
  sortDirection: "asc" | "desc";
  minRating: number;
  showOnlyWithText: boolean;
  maxTestimonials: number;
}

interface LandingPageContent {
  hero: HeroContent;
  features: Feature[];
  howItWorks: Step[];
  pricing: Plan[];
  testimonialSettings?: TestimonialSettings;
}

type SectionItem = Feature | Step | Plan | AppRating;

export default function ContentEditor() {
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [appRatings, setAppRatings] = useState<AppRating[]>([]);
  const [activeSection, setActiveSection] = useState<keyof LandingPageContent | "appRating" | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [previewMode, setPreviewMode] = useState(true);
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [sortField, setSortField] = useState<"rating" | "submittedTime">("rating");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [minRating, setMinRating] = useState<number>(0);
  const [showOnlyWithText, setShowOnlyWithText] = useState<boolean>(false);
  const [maxTestimonials, setMaxTestimonials] = useState<number>(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemIndexToDelete, setItemIndexToDelete] = useState<number | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState<{ [key: string]: boolean }>({});

  const sectionOrder: (keyof LandingPageContent | "appRating")[] = ["hero", "features", "howItWorks", "pricing", "appRating"];

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) router.push("/login");
  }, [user, authLoading, isAdmin, router]);

  // One-shot loaders (no listeners)
  useEffect(() => {
    let cancelled = false;
    if (!user || !isAdmin) return;

    const loadContent = async () => {
      try {
        const mainRef = doc(db, "landingPageContent", "main");
        const snap = await getDoc(mainRef);
        if (cancelled) return;

        if (snap.exists()) {
          const raw = snap.data() as any;
          // normalize arrays here to avoid map() crashes
          const normalized: LandingPageContent = {
            hero: raw.hero || { title1: "", title2: "", description: "", imageURL: "", videoURL: "", mediaType: "image", imageStoragePath: "", videoStoragePath: "" },
            features: toArray<Feature>(raw.features),
            howItWorks: toArray<Step>(raw.howItWorks),
            pricing: toArray<Plan>(raw.pricing),
            testimonialSettings: raw.testimonialSettings || {
              sortField: "rating",
              sortDirection: "desc",
              minRating: 0,
              showOnlyWithText: false,
              maxTestimonials: 0,
            },
          };
          setContent(normalized);

          const ts = normalized.testimonialSettings!;
          setSortField(ts.sortField);
          setSortDirection(ts.sortDirection);
          setMinRating(ts.minRating);
          setShowOnlyWithText(ts.showOnlyWithText);
          setMaxTestimonials(ts.maxTestimonials);
        } else {
          const defaultContent: LandingPageContent = {
            hero: { title1: "", title2: "", description: "", imageURL: "", videoURL: "", mediaType: "image", imageStoragePath: "", videoStoragePath: "" },
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
          setContent(defaultContent);
          await setDoc(mainRef, defaultContent, { merge: true });
        }
      } catch (error: any) {
        console.error("Error fetching landingPageContent:", error);
        setSaveMessage(`Error: ${error.message}. Check Firestore rules.`);
      }
    };

    const loadRatings = async () => {
      try {
        const snap = await getDocs(collection(db, "appRating"));
        if (cancelled) return;

        const ratings = snap.docs.map((d) => {
          const data: any = d.data() || {};
          const submittedTime =
            data.submittedTime?.toDate?.().toISOString?.() ||
            data.submittedTime ||
            new Date().toISOString();
          return {
            id: d.id,
            name: data.name || "",
            text: data.text || "",
            rating: data.rating || 0,
            submittedTime,
            photoURL: data.photoURL || "",
          } as AppRating;
        });
        setAppRatings(ratings);
      } catch (error: any) {
        console.error("Error fetching appRating:", error);
        setSaveMessage(`Error: ${error.message}. Check Firestore rules.`);
      }
    };

    loadContent();
    loadRatings();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  // Keep editedContent in sync when selecting sections or when data loads
  useEffect(() => {
    if (!activeSection) return;

    if (activeSection === "appRating") {
      setEditedContent(JSON.stringify(appRatings, null, 2));
    } else if (content) {
      const val = content[activeSection];
      const arrayish =
        activeSection === "features" || activeSection === "howItWorks" || activeSection === "pricing"
          ? toArray(val)
          : val;
      setEditedContent(JSON.stringify(arrayish, null, 2));
    }
  }, [activeSection, appRatings, content]);

  const handleEditSection = (section: keyof LandingPageContent | "appRating") => {
    setActiveSection(section);
    setPreviewMode(true);
  };

  const handleMediaUpload = async (file: File, path: string, section: keyof LandingPageContent, index?: number, isVideo: boolean = false) => {
    if (!file) return null;

    const allowedImageTypes = ["image/png", "image/jpeg"];
    const allowedVideoTypes = ["video/mp4"];
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB

    if (isVideo && !allowedVideoTypes.includes(file.type)) {
      setSaveMessage("Error: Only MP4 videos are allowed.");
      return null;
    }
    if (!isVideo && !allowedImageTypes.includes(file.type)) {
      setSaveMessage("Error: Only PNG or JPEG files are allowed.");
      return null;
    }
    if (file.size > (isVideo ? maxVideoSize : maxImageSize)) {
      setSaveMessage(`Error: File must be smaller than ${isVideo ? "50MB" : "5MB"}.`);
      return null;
    }

    setUploadingMedia((prev) => ({ ...prev, [path]: true }));
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = (await getDownloadURL(storageRef)).trimEnd();

      if (section === "hero" && content) {
        const updatedHero: HeroContent = {
          ...content.hero,
          [isVideo ? "videoURL" : "imageURL"]: url,
          [isVideo ? "videoStoragePath" : "imageStoragePath"]: path,
          mediaType: isVideo ? "video" : "image",
        };
        const updatedContent: LandingPageContent = { ...content, hero: updatedHero };
        await setDoc(doc(db, "landingPageContent", "main"), updatedContent, { merge: true });
        setContent(updatedContent);
        setEditedContent(JSON.stringify(updatedHero, null, 2));
      } else if (section === "howItWorks" && content && index !== undefined) {
        const updatedSteps = [...content.howItWorks];
        updatedSteps[index] = { ...updatedSteps[index], image: url, storagePath: path };
        const updatedContent: LandingPageContent = { ...content, howItWorks: updatedSteps };
        await setDoc(doc(db, "landingPageContent", "main"), updatedContent, { merge: true });
        setContent(updatedContent);
        setEditedContent(JSON.stringify(updatedSteps, null, 2));
      }

      setSaveMessage(`${isVideo ? "Video" : "Image"} uploaded successfully!`);
      setTimeout(() => setSaveMessage(""), 3000);
      return url;
    } catch (error: any) {
      console.error(`${isVideo ? "Video" : "Image"} upload failed:`, error);
      setSaveMessage(`Error: ${error.message}`);
      return null;
    } finally {
      setUploadingMedia((prev) => ({ ...prev, [path]: false }));
    }
  };

  const handleRemoveMedia = async (
    section: keyof LandingPageContent,
    index?: number,
    mediaType?: "image" | "video"
  ) => {
    try {
      const docRef = doc(db, "landingPageContent", "main");
      const snap = await getDoc(docRef);
      const data = snap.data() as LandingPageContent | undefined;
      if (!data) throw new Error("landingPageContent/main not found");

      // helper: turn a storage path OR a full https/gs URL into a StorageReference
      const getRef = (pathOrUrl?: string) => {
        try {
          if (!pathOrUrl) return null;
          return ref(storage, pathOrUrl); // works with "websiteImages/..." or full https/gs URL
        } catch {
          return null;
        }
      };

      if (section === "hero") {
        const hero = data.hero || ({} as any);

        const pathOrUrl =
          mediaType === "video"
            ? (hero.videoStoragePath || hero.videoURL)
            : (hero.imageStoragePath || hero.imageURL);

        const delRef = getRef(pathOrUrl);
        if (delRef) {
          try { await deleteObject(delRef); }
          catch (e) { console.warn("Skipping deleteObject:", e); }
        }

        // Clear hero fields regardless of delete outcome
        const updatedHero: HeroContent = {
          ...(data.hero ?? { title1: "", title2: "", description: "", mediaType: "image" }),
          [mediaType === "video" ? "videoURL" : "imageURL"]: "",
          [mediaType === "video" ? "videoStoragePath" : "imageStoragePath"]: "",
          mediaType: mediaType === "video" ? "image" : (data.hero?.mediaType ?? "image"),
        };

        await setDoc(docRef, { hero: updatedHero }, { merge: true });
        setContent((c) => c ? { ...c, hero: updatedHero } : ({ hero: updatedHero } as any));
        setEditedContent(JSON.stringify(updatedHero, null, 2));
      }

      if (section === "howItWorks" && typeof index === "number") {
        const steps = Array.isArray(data.howItWorks) ? [...data.howItWorks] : [];
        const step = steps[index] || ({} as any);

        const delRef = getRef(step.storagePath || step.image);
        if (delRef) {
          try { await deleteObject(delRef); }
          catch (e) { console.warn("Skipping deleteObject:", e); }
        }

        steps[index] = { ...step, image: "", storagePath: "" };
        await setDoc(docRef, { howItWorks: steps }, { merge: true });
        setContent((c) => c ? { ...c, howItWorks: steps } : ({ howItWorks: steps } as any));
        setEditedContent(JSON.stringify(steps, null, 2));
      }

      setSaveMessage(`${mediaType || "Image"} removed successfully!`);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      console.error(`${mediaType || "Image"} removal failed:`, error);
      setSaveMessage(`Error: ${error.message}`);
    }
  };



  const handleSaveSection = async () => {
    if (!activeSection || (!content && activeSection !== "appRating")) return;
    setIsSaving(true);
    try {
      if (activeSection === "appRating") {
        const parsedRatings = JSON.parse(editedContent) as AppRating[];
        const testimonialSettings: TestimonialSettings = {
          sortField,
          sortDirection,
          minRating,
          showOnlyWithText,
          maxTestimonials,
        };
        const updatedContent: LandingPageContent = {
          ...(content || {
            hero: { title1: "", title2: "", description: "", imageURL: "", videoURL: "", mediaType: "image", imageStoragePath: "", videoStoragePath: "" },
            features: [],
            howItWorks: [],
            pricing: [],
          }),
          testimonialSettings,
        };
        await setDoc(doc(db, "landingPageContent", "main"), updatedContent, { merge: true });
        setAppRatings(parsedRatings);
        setEditedContent(JSON.stringify(parsedRatings, null, 2));
      } else {
        const parsed = JSON.parse(editedContent);
        const normalized =
          activeSection === "features"
            ? toArray<Feature>(parsed)
            : activeSection === "howItWorks"
            ? toArray<Step>(parsed)
            : activeSection === "pricing"
            ? toArray<Plan>(parsed)
            : parsed;

        const defaultContent: LandingPageContent = {
          hero: { title1: "", title2: "", description: "", imageURL: "", videoURL: "", mediaType: "image", imageStoragePath: "", videoStoragePath: "" },
          features: [],
          howItWorks: [],
          pricing: [],
        };
        const updatedContent: LandingPageContent = {
          ...defaultContent,
          ...content,
          [activeSection]: normalized,
        };
        await setDoc(doc(db, "landingPageContent", "main"), updatedContent, { merge: true });
        setContent(updatedContent);
        setEditedContent(JSON.stringify(normalized, null, 2));
      }
      setSaveMessage("Content saved successfully!");
      setPreviewMode(true);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      console.error("Error saving content:", error);
      setSaveMessage(`Error: ${error.message}. Check JSON or Firestore rules.`);
    } finally {
      setIsSaving(false);
    }
  };

  const sortAppRatings = (ratings: AppRating[]): AppRating[] => {
    let sorted = [...ratings]
      .filter((r) => r.rating >= minRating)
      .filter((r) => !showOnlyWithText || (r.text && r.text.trim() !== ""))
      .sort((a, b) => {
        if (sortField === "rating") {
          return sortDirection === "asc" ? a.rating - b.rating : b.rating - a.rating;
        } else {
          const aT = a.submittedTime ? new Date(a.submittedTime).getTime() : 0;
          const bT = b.submittedTime ? new Date(b.submittedTime).getTime() : 0;
          return sortDirection === "asc" ? aT - bT : bT - aT;
        }
      });

    if (maxTestimonials > 0) {
      sorted = sorted.slice(0, maxTestimonials);
    }
    return sorted;
  };

  const handleDeleteItem = () => {
    if (itemIndexToDelete === null || !activeSection) return;
    try {
      const parsed = JSON.parse(editedContent);
      const arr = toArray<SectionItem>(parsed);
      const updated = arr.filter((_, i) => i !== itemIndexToDelete);
      setEditedContent(JSON.stringify(updated, null, 2));
      setIsDeleteModalOpen(false);
      setItemIndexToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      setSaveMessage("Error: Failed to delete item. Check JSON.");
    }
  };

  const handleOpenModal = (role?: "free" | "premium") => {
    console.log(`Preview mode: Opening signup modal for role ${role || "none"}`);
  };

  const renderVisualEditor = () => {
    if (!activeSection || (!content && activeSection !== "appRating")) return <p>Select a section to edit</p>;
    try {
      const sectionContent = JSON.parse(editedContent);

      if (activeSection === "hero") {
        const hero = sectionContent as HeroContent;
        return (
          <div className="space-y-4">
            {/* text fields */}
            <input
              type="text"
              value={hero.title1}
              onChange={(e) => setEditedContent(JSON.stringify({ ...hero, title1: e.target.value }, null, 2))}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-#58e221]"
              placeholder="Title Line 1"
            />
            <input
              type="text"
              value={hero.title2}
              onChange={(e) => setEditedContent(JSON.stringify({ ...hero, title2: e.target.value }, null, 2))}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-#58e221]"
              placeholder="Title Line 2"
            />
            <textarea
              value={hero.description}
              onChange={(e) => setEditedContent(JSON.stringify({ ...hero, description: e.target.value }, null, 2))}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-#58e221]"
              rows={4}
              placeholder="Description"
            />

            {/* media type */}
            <div>
              <label className="block text-sm font-medium">Media Type</label>
              <select
                value={hero.mediaType}
                onChange={(e) => setEditedContent(JSON.stringify({ ...hero, mediaType: e.target.value as "image" | "video" }, null, 2))}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-#58e221]"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* media uploaders */}
            {hero.mediaType === "image" ? (
              <div>
                <label className="block text-sm capitalize font-medium">Hero Image</label>
                {hero.imageURL ? (
                  <div className="mt-2 space-y-2">
                    <Image
                      src={hero.imageURL.trimEnd()}
                      alt="Hero Image"
                      width={200}
                      height={150}
                      className="object-cover rounded-md"
                      unoptimized
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMedia("hero", undefined, "image")}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const path = `websiteImages/hero_image_${Date.now()}`;
                        handleMediaUpload(file, path, "hero", undefined, false);
                      }
                    }}
                    className="w-full p-2 border rounded-md"
                  />
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm capitalize font-medium">Hero Video</label>
                {hero.videoURL ? (
                  <div className="mt-2 space-y-2">
                    <video src={hero.videoURL.trimEnd()} controls width={200} className="rounded-md" />
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveMedia("hero", undefined, "video")}>
                      Remove Video
                    </Button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const path = `websiteImages/hero_video_${Date.now()}`;
                        handleMediaUpload(file, path, "hero", undefined, true);
                      }
                    }}
                    className="w-full p-2 border rounded-md"
                  />
                )}
              </div>
            )}
          </div>
        );
      }

      if (activeSection === "features" || activeSection === "howItWorks" || activeSection === "pricing") {
        const items =
          activeSection === "features"
            ? toArray<Feature>(sectionContent)
            : activeSection === "howItWorks"
            ? toArray<Step>(sectionContent)
            : toArray<Plan>(sectionContent);

        return (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span>Item {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setItemIndexToDelete(index); setIsDeleteModalOpen(true); }}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                {Object.entries(item as any).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <label className="block text-sm capitalize">{key}</label>

                    {typeof value === "string" && key !== "features" && key !== "image" && key !== "storagePath" ? (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const updated = [...items] as any[];
                          updated[index] = { ...updated[index], [key]: e.target.value };
                          setEditedContent(JSON.stringify(updated, null, 2));
                        }}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-#58e221]"
                      />
                    ) : key === "price" ? (
                      <input
                        type="number"
                        value={value as number}
                        onChange={(e) => {
                          const updated = [...items] as any[];
                          updated[index] = { ...updated[index], [key]: Number(e.target.value) };
                          setEditedContent(JSON.stringify(updated, null, 2));
                        }}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#58e221]"
                      />
                    ) : key === "features" ? (
                      <textarea
                        value={(value as string[]).join("\n")}
                        onChange={(e) => {
                          const updated = [...items] as any[];
                          updated[index] = { ...updated[index], [key]: e.target.value.split("\n") };
                          setEditedContent(JSON.stringify(updated, null, 2));
                        }}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#58e221]"
                        rows={4}
                      />
                    ) : key === "image" ? (
                      <div>
                        {(value as string) ? (
                          <div className="mt-2 space-y-2">
                            <Image
                              src={(value as string).trimEnd()}
                              alt={`Step ${index + 1} Image`}
                              width={200}
                              height={150}
                              className="object-cover rounded-md"
                              unoptimized
                            />
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveMedia("howItWorks", index)}>
                              Remove Image
                            </Button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleMediaUpload(file, `websiteImages/step${index}_${Date.now()}`, "howItWorks", index, false);
                            }}
                            className="w-full p-2 border rounded-md"
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                const newItem =
                  activeSection === "features"
                    ? { title: "", description: "", icon: "" }
                    : activeSection === "howItWorks"
                    ? { title: "", description: "", image: "", storagePath: "" }
                    : { name: "", description: "", price: 0, features: [""], buttonText: "", featured: false };
                const updated = ([...items, newItem] as any[]);
                setEditedContent(JSON.stringify(updated, null, 2));
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
        );
      }

      if (activeSection === "appRating") {
        const ratings = toArray<AppRating>(sectionContent);
        const sortedRatings = sortAppRatings(ratings);
        return (
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block text-sm mb-1">Sort By</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as "rating" | "submittedTime")}
                  className="w-[180px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#58e221]"
                >
                  <option value="rating">Rating</option>
                  <option value="submittedTime">Date</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Direction</label>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as "asc" | "desc")}
                  className="w-[180px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#58e221]"
                >
                  {sortField === "rating" ? (
                    <>
                      <option value="asc">Low to High</option>
                      <option value="desc">High to Low</option>
                    </>
                  ) : (
                    <>
                      <option value="asc">Oldest First</option>
                      <option value="desc">Newest First</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Minimum Rating</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-[180px]"
                />
                <span className="ml-2 text-sm">{minRating} stars</span>
              </div>
              <div>
                <label className="block text-sm mb-1">Max Testimonials (0 for unlimited)</label>
                <input
                  type="number"
                  min="0"
                  value={maxTestimonials}
                  onChange={(e) => setMaxTestimonials(Number(e.target.value))}
                  className="w-[180px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#58e221]"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showOnlyWithText}
                    onChange={(e) => setShowOnlyWithText(e.target.checked)}
                    className="h-4 w-4 text-[#58e221] border-gray-300 rounded focus:ring-[#58e221]"
                  />
                  <span>Show only testimonials with text</span>
                </label>
              </div>
            </div>

            {sortedRatings.length > 0 ? (
              sortedRatings.map((item) => (
                <div key={item.id} className="border p-4 rounded-md">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm capitalize font-medium">Name</label>
                      <p className="text-sm text-gray-600">{item.name || "No name provided"}</p>
                    </div>
                    <div>
                      <label className="block text-sm capitalize font-medium">Text</label>
                      <p className="text-sm text-gray-600">{item.text || "No text provided"}</p>
                    </div>
                    <div>
                      <label className="block text-sm capitalize font-medium">Rating</label>
                      <p className="text-sm text-gray-600">{item.rating} / 5</p>
                    </div>
                    <div>
                      <label className="block text-sm capitalize font-medium">Submitted Time</label>
                      <p className="text-sm text-gray-600">{new Date(item.submittedTime).toLocaleString()}</p>
                    </div>
                    {item.photoURL && (
                      <div>
                        <label className="block text-sm capitalize font-medium">Photo</label>
                        <Image
                          src={item.photoURL.trimEnd()}
                          alt={item.name || "User photo"}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No testimonials match the current filters.</p>
            )}
          </div>
        );
      }

      return null;
    } catch {
      return <p>Invalid JSON content. Please check the data structure.</p>;
    }
  };

  const renderPreview = () => {
    if (!activeSection || (!content && activeSection !== "appRating")) return <p>Select a section to preview</p>;
    try {
      if (activeSection === "appRating") {
        const sortedRatings = sortAppRatings(appRatings);
        const testimonials = sortedRatings.map((rating) => ({
          name: rating.name,
          text: rating.text,
          rating: rating.rating,
          submittedTime: new Date(isNaN(new Date(rating.submittedTime).getTime()) ? Date.now() : new Date(rating.submittedTime).getTime()),
          photoURL: rating.photoURL,
        }));
        return <Testimonials testimonials={testimonials} />;
      }

      const sectionContent = JSON.parse(editedContent);

      if (activeSection === "hero") {
        const hero = sectionContent as HeroContent;
        return (
          <div className="w-full">
            <Hero
              title1={hero.title1 || "Title 1"}
              title2={hero.title2 || "Title 2"}
              description={hero.description || "Description goes here"}
              imageURL={hero.imageURL ? hero.imageURL.trimEnd() : undefined}
              videoURL={hero.videoURL ? hero.videoURL.trimEnd() : undefined}
              mediaType={hero.mediaType || "image"}
            >
              <button
                className="btn btn-primary btn-lg"
                onClick={() => console.log("Get Started clicked in preview")}
              >
                Get Started
              </button>
              <a
                href="#howitworks"
                className="mt-3 sm:mt-0 sm:ml-3 w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-#58e221] bg-white hover:bg-gray-100 md:py-4 md:text-lg md:px-10"
              >
                Learn More
              </a>
              <button
                className="mt-3 sm:mt-0 sm:ml-3 w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-#58e221] bg-white hover:bg-gray-100 md:py-4 md:text-lg md:px-10"
                onClick={() => console.log("About Project clicked in preview")}
              >
                About Project
              </button>
            </Hero>
          </div>
        );
      }

      if (activeSection === "features") {
        const features = toArray<Feature>(sectionContent);
        return <Features features={features} />;
      }
      if (activeSection === "howItWorks") {
        const steps = toArray<Step>(sectionContent);
        return <HowItWorks steps={steps} />;
      }
      if (activeSection === "pricing") {
        const plans = toArray<Plan>(sectionContent);
        return <Pricing plans={plans} onOpenModal={handleOpenModal} />;
      }

      return null;
    } catch {
      return <p>Invalid JSON content in preview. Check data structure.</p>;
    }
  };

  if (authLoading || (!content && !appRatings.length)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-#58e221]" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="p-6">
      {saveMessage && (
        <Alert className="mb-6" variant={saveMessage.includes("Error") ? "destructive" : "default"}>
          <AlertTitle>{saveMessage.includes("Error") ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Sections</CardTitle>
          </CardHeader>
          <CardContent>
            {sectionOrder.map((section) => (
              <div
                key={section}
                onClick={() => handleEditSection(section)}
                className={`flex justify-between items-center p-3 rounded-md cursor-pointer ${activeSection === section ? "bg-#58e221]/10" : "hover:bg-gray-50"}`}
              >
                <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
                <Edit className="h-4 w-4 text-gray-500" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{activeSection ? `Editing: ${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}` : "Select a Section"}</CardTitle>
              {activeSection && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
                    <Eye className="h-4 w-4 mr-1" /> {previewMode ? "Edit" : "Preview"}
                  </Button>
                  {!previewMode && (
                    <Button onClick={handleSaveSection} disabled={isSaving}>
                      {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeSection ? (
              previewMode ? (
                renderPreview()
              ) : (
                <>
                  {renderVisualEditor()}
                  <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => { setIsDeleteModalOpen(false); setItemIndexToDelete(null); }}
                    onConfirm={handleDeleteItem}
                    itemName={activeSection === "features" ? "feature" : activeSection === "howItWorks" ? "step" : "plan"}
                  />
                </>
              )
            ) : (
              <p className="text-gray-500 text-center">Select a section to begin editing</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
