"use client";

import React from "react";

type Plan = {
  name?: string;
  description?: string;
  price?: number;          // 0 or undefined means free
  features?: string[];     // may be missing -> we normalize
  buttonText?: string;
  featured?: boolean;
};

type PricingProps = {
  plans: Plan[] | any; // tolerate odd shapes from CMS
  onOpenModal: (role?: "free" | "premium") => void;
};

const toArray = <T,>(v: any): T[] =>
  Array.isArray(v) ? v : (v && typeof v === "object" ? (Object.values(v) as T[]) : []);

export function Pricing({ plans, onOpenModal }: PricingProps) {
  // Normalize plans + features to arrays so we never crash on .map
  const list: Plan[] = toArray<Plan>(plans).map((p) => ({
    ...p,
    features: Array.isArray(p?.features) ? p.features.filter(Boolean) : [],
  }));

  if (!list.length) {
    return (
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Pricing</h2>
          <p className="text-gray-600">No plans configured yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Pricing</h2>

        <div className="grid gap-6 md:grid-cols-3">
          {list.map((plan, idx) => {
            const isPremium =
              (plan.name || "").toLowerCase().includes("premium") ||
              (typeof plan.price === "number" && plan.price > 0);

            const priceLabel =
              typeof plan.price === "number"
                ? plan.price === 0
                  ? "Free"
                  : `$${plan.price}`
                : isPremium
                ? "$—"
                : "Free";

            const btnLabel =
              plan.buttonText || (isPremium ? "Go Premium" : "Get Started");

            return (
              <div
                key={idx}
                className={`rounded-xl border p-6 ${
                  plan.featured ? "border-[#58e221] shadow-md" : "border-gray-200"
                }`}
              >
                <h3 className="text-xl font-semibold">{plan.name || "Plan"}</h3>
                {plan.description ? (
                  <p className="text-gray-600 mt-1">{plan.description}</p>
                ) : null}

                <div className="mt-4">
                  <span className="text-3xl font-bold">{priceLabel}</span>
                  {typeof plan.price === "number" && plan.price > 0 ? (
                    <span className="text-gray-500"> / mo</span>
                  ) : null}
                </div>

                {plan.features && plan.features.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
                    {plan.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">No features listed.</p>
                )}

                <button
                  onClick={() => onOpenModal(isPremium ? "premium" : "free")}
                  className={`mt-6 w-full rounded-md py-2 text-white ${
                    isPremium
                      ? "bg-[#58e221] hover:opacity-90"
                      : "bg-gray-800 hover:opacity-90"
                  }`}
                >
                  {btnLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
