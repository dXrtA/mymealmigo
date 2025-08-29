"use client";

import Image from "next/image";

export type Step = {
  title: string;
  description: string;
  image?: string; // optional is safer
};

export function HowItWorks({ steps }: { steps: Step[] }) {
  const list = Array.isArray(steps) ? steps : [];

  return (
    <section id="howitworks" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">How it works</h2>

        <div className="grid gap-8 md:grid-cols-3">
          {list.map((s, i) => (
            <div key={i} className="rounded-xl border p-6">
              {s.image ? (
                <div className="mb-4">
                  <Image
                    src={s.image.trim()}
                    alt={
                      s.title && s.title.trim().length > 0
                        ? `${s.title} illustration`
                        : `How it works step ${i + 1}`
                    }
                    width={640}
                    height={360}
                    className="w-full h-auto rounded-lg object-cover"
                    unoptimized
                  />
                </div>
              ) : null}

              {s.title ? (
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              ) : null}

              {s.description ? (
                <p className="text-gray-600">{s.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
