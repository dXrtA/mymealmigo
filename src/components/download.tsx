'use client';

import Image from 'next/image';

export function Download() {
  return (
    <section id="download" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-14">
      <div className="rounded-2xl border border-border p-6 bg-card grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h2 className="text-2xl font-semibold">Download the app</h2>
          <p className="text-muted-foreground mt-2">
            Track on the go. Available for iOS & Android soon — subscribe and be first to know.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#" className="rounded-xl border border-border px-5 py-3 hover:bg-accent hover:text-accent-foreground">
              App Store (coming soon)
            </a>
            <a href="#" className="rounded-xl border border-border px-5 py-3 hover:bg-accent hover:text-accent-foreground">
              Google Play (coming soon)
            </a>
          </div>
        </div>
        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-muted">
          <Image src="/mymealmigoLogo.svg" alt="Download preview" fill className="object-cover" />
        </div>
      </div>
    </section>
  );
}
