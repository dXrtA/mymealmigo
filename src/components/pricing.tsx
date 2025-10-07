// src/components/pricing.tsx
"use client";

import React from "react";

type Plan = {
  name?: string;
  description?: string;
  price?: number;
  features?: string[];
  buttonText?: string;
  featured?: boolean;
};

type PricingProps = {
  plans: unknown;
  onOpenModal?: (role?: "free" | "premium") => void; // remains optional
  hideButtons?: boolean; // <- NEW
};

export function Pricing({ plans, onOpenModal, hideButtons = false }: PricingProps) {
  const normalizedPlans: Plan[] = Array.isArray(plans) ? (plans as Plan[]) : [];

  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Pricing</h2>

        <div className="grid gap-6 md:grid-cols-3">
          {normalizedPlans.map((plan, idx) => {
            const {
              name = "Plan",
              description = "",
              price,
              features = [],
              buttonText = "Select",
              featured = false,
            } = plan;

            const btnLabel = buttonText || "Select";

            return (
              <div
                key={idx}
                className={`rounded-xl border p-6 flex flex-col justify-between ${
                  featured ? "border-[#58e221]" : "border-gray-200"
                }`}
              >
                <div>
                  <h3 className="text-xl font-semibold">{name}</h3>
                  <p className="text-gray-600 mt-2">{description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {typeof price === "number" ? `$${price}` : "Free"}
                    </span>
                    <span className="text-gray-500"> / month</span>
                  </div>
                  <ul className="mt-6 space-y-2">
                    {features.map((f, i) => (
                      <li key={i} className="text-sm text-gray-700">• {f}</li>
                    ))}
                  </ul>
                </div>

                {/* Hide CTA if display-only */}
                {!hideButtons && (
                  <div className="mt-8">
                    <button
                      onClick={() =>
                        onOpenModal
                          ? onOpenModal(btnLabel.toLowerCase().includes("premium") ? "premium" : "free")
                          : (window.location.href = "/#download")
                      }
                      className={`w-full md:w-auto px-6 py-3 rounded-md text-white ${
                        featured ? "bg-[#58e221] hover:opacity-90" : "bg-gray-800 hover:opacity-90"
                      }`}
                    >
                      {btnLabel}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
