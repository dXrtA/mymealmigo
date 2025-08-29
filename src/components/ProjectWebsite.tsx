
export function ProjectWebsite({ onClose }: { onClose: () => void }) {
  return (
    <div className="project-website bg-white p-8 rounded-lg max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4 border-[#80e259]">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#58e221] to-[#80e259] text-transparent bg-clip-text">
          FYP-25-S3-09 : MyMealMigo
        </h1>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gradient-to-r from-[#58e221] to-[#80e259] text-white rounded-md hover:opacity-90 transition shadow-md"
        >
          Back
        </button>
      </div>

      {/* Introduction Section */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-3xl font-semibold mb-4 border-l-4 border-[#58e221] pl-3">Our Service</h2>
        <p className="text-lg mb-4 text-gray-700">
          MyMealMigo is an innovative diet and nutrition app that helps you manage eating habits effectively. It offers personalized meal recommendations based on your health goals—such as daily calorie targets—and suggests recipes aligned to those goals.
        </p>
        <p className="text-lg mb-4 text-gray-700">
          Track calories per meal, view clear daily/weekly/monthly intake reports, and discover nutritionally informed recipes to support your progress.
        </p>
        <p className="text-lg text-gray-700">
          Start free, and upgrade to Premium anytime for more advanced features.
        </p>
      </section>

      {/* Team Members Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 border-l-4 border-[#58e221] pl-3">Meet Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Bryce Nicolas Fernandez",
              role: "Project Leader",
              bio: "TBC",
            },
            {
              name: "Ridhwan Putra",
              role: "Software Developer",
              bio: "TBC",
            },
            {
              name: "Gabriel Leu Jun Yang",
              role: "Software Developer",
              bio: "TBC",
            },
            {
              name: "D'Atagnan Kong Yih Ferng",
              role: "Software Developer",
              bio: "TBC",
            },
            {
              name: "Kenneth Chua Yi Sheng",
              role: "Software Developer",
              bio: "TBC",
            },
          ].map((member, index) => (
            <div
              key={index}
              className="team-member p-6 border rounded-lg shadow-md hover:shadow-lg transition bg-white"
            >
              <div className="w-32 h-32 bg-gradient-to-r from-[#58e221] to-[#80e259] opacity-80 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <h3 className="text-xl font-medium text-center text-gray-900">{member.name}</h3>
              <p className="text-center text-gray-600 font-medium">{member.role}</p>
              <p className="mt-2 text-center text-gray-700">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project Mentors Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 border-l-4 border-[#58e221] pl-3">Our Project Mentors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { name: "Mr Ee Kiam Keong", role: "Supervisor" },
            { name: "Mr Japit Sionggo", role: "Assessor" },
          ].map((mentor, index) => (
            <div
              key={index}
              className="mentor p-6 border rounded-lg shadow-md hover:shadow-lg transition bg-white"
            >
              <div className="w-32 h-32 bg-gradient-to-r from-[#58e221] to-[#80e259] opacity-80 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                {mentor.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <h3 className="text-xl font-medium text-center text-gray-900">{mentor.name}</h3>
              <p className="text-center text-gray-600 font-medium">{mentor.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
    
)}