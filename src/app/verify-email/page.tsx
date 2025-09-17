import { Suspense } from 'react';
import VerifyEmailClient from './verifyEmailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
