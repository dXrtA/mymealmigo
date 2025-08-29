import type { Feature } from "@/types/landingPage";
import { iconMap } from "@/lib/iconMap"; // Import icon mapping

interface FeaturesProps {
  features: Feature[];
}

export function Features({ features }: FeaturesProps) {
  return (
    <div id="features" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything In One Place For Your Wellness Journey
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Smart tools designed to help you stay on top of your health and nutrition.
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const IconComponent = typeof feature.icon === "string" ? iconMap[feature.icon] : feature.icon;
              return (
                <div key={index} className="feature-card pt-6">
                  <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-md">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-[#58e221] to-[#80e259] rounded-md shadow-lg">
                          {IconComponent ? (
                            <IconComponent className="h-6 w-6 text-white" />
                          ) : (
                            <span>Icon Missing</span> // Fallback
                          )}
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.title}</h3>
                      <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}