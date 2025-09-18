// File: src/app/onboarding/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { defaultHealthProfile, type HealthProfile } from '@/types/health';
import { Button } from '@/components/ui/button';
import { getClientAuth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const LS_KEY = 'onboarding_health_profile_v1';

type Quiz = {
  heightCm?: number;
  weightKg?: number;
  birthday?: string; // yyyy-mm-dd
  goal?: 'weight_loss'|'muscle_gain'|'balanced'|'maintenance';
  dietPreference?: 'no_preference'|'vegetarian'|'vegan'|'pescatarian'|'halal'|'kosher';
  cuisineLikes?: string[];   // e.g. ['asian','mediterranean']
  foodsToAvoid?: string;     // free text
  cookingTime?: '5-10'|'10-20'|'20-30'|'30+';
  budget?: 'low'|'medium'|'high';
  activityLevel?: 'sedentary'|'light'|'moderate'|'active'|'very_active';
};

const CUISINES = ['asian','mediterranean','mexican','indian','italian','american','middle_eastern','japanese','korean'] as const;
const GOALS = ['weight_loss','muscle_gain','balanced','maintenance'] as const;
const DIETS = ['no_preference','vegetarian','vegan','pescatarian','halal','kosher'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // read sex from URL once (male|female), use it to prefill demographics.sexAtBirth
  const sexParam = (sp.get('sex') as 'male'|'female'|null) ?? null;

  // start from default profile (optionally from localStorage), then apply sexParam
  const [hp, setHp] = useState<HealthProfile>(() => {
    let base = defaultHealthProfile;
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        try { base = { ...defaultHealthProfile, ...(JSON.parse(raw) as Partial<HealthProfile>) }; } catch {}
      }
    }
    if (sexParam) {
      base = {
        ...base,
        demographics: { ...(base.demographics || {}), sexAtBirth: sexParam }
      };
    }
    return base;
  });

  const [quiz, setQuiz] = useState<Quiz>(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LS_KEY + '_quiz');
      if (raw) { try { return JSON.parse(raw) as Quiz; } catch {} }
    }
    return {};
  });

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  // mirror to localStorage so refresh doesn’t lose progress
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, JSON.stringify(hp));
      localStorage.setItem(LS_KEY + '_quiz', JSON.stringify(quiz));
    }
  }, [hp, quiz]);

  const bmi = useMemo(() => {
    if (!quiz.heightCm || !quiz.weightKg) return null;
    const h = quiz.heightCm / 100;
    return +(quiz.weightKg / (h*h)).toFixed(1);
  }, [quiz.heightCm, quiz.weightKg]);

  function next() { setStep((s) => Math.min(4, s + 1)); }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Let’s personalize your plan</h1>
      <p className="text-sm opacity-80">Answer a few quick questions. You’ll create your account at the end to save your plan.</p>

      <div className="rounded-xl border p-4 space-y-6 bg-white">
        {step === 0 && <SectionBasics quiz={quiz} setQuiz={setQuiz} />}
        {step === 1 && <SectionGoals quiz={quiz} setQuiz={setQuiz} />}
        {step === 2 && <SectionPreferences quiz={quiz} setQuiz={setQuiz} />}
        {step === 3 && <SectionConsent hp={hp} setHp={setHp} />}
        {step === 4 && <SectionSummary quiz={quiz} bmi={bmi} sexAtBirth={hp.demographics?.sexAtBirth} />}

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm opacity-70">Step {step + 1} / 5</div>
          <div className="flex gap-2">
            <Button onClick={back} disabled={step === 0 || saving} variant="secondary">Back</Button>
            {step < 4 ? (
              <Button onClick={next} disabled={saving}>Continue</Button>
            ) : (
              <Button
                onClick={() => setSignupOpen(true)}
                disabled={saving}
              >
                Finish & Create Account
              </Button>
            )}
          </div>
        </div>
      </div>

      {signupOpen && (
        <SignupInline
          onClose={() => setSignupOpen(false)}
          onSubmit={async (name, email, password) => {
            setSaving(true);
            try {
              // build the health profile we’ll save
              const final: HealthProfile = {
                ...hp,
                completed: true, // finished quiz
                riskLevel: deriveRisk(hp),
                demographics: {
                  ...(hp.demographics || {}),
                  // ensure sexAtBirth survives even if local state changed
                  sexAtBirth: hp.demographics?.sexAtBirth,
                  heightCm: quiz.heightCm,
                  weightKg: quiz.weightKg,
                  birthYear: quiz.birthday ? new Date(quiz.birthday).getFullYear() : hp.demographics?.birthYear,
                },
                fitness: {
                  ...(hp.fitness || {}),
                  goal: quiz.goal,
                  preferredIntensity: mapActivityToIntensity(quiz.activityLevel),
                  equipment: hp.fitness?.equipment || [],
                },
                constraints: {
                  ...(hp.constraints || {}),
                  notes: [hp.constraints?.notes, summarizePreferences(quiz)].filter(Boolean).join(' • '),
                },
                updatedAt: serverTimestamp() as any,
                createdAt: hp.createdAt || (serverTimestamp() as any),
              };

              // create account now
              const auth = getClientAuth();
              const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
              const created = cred.user;
              if (name.trim()) await updateProfile(created, { displayName: name.trim() });

              // users/{uid}
              await setDoc(
                doc(db, 'users', created.uid),
                {
                  name: name.trim() || null,
                  email: created.email,
                  role: 'free',
                  accountStatus: 'Active',
                  createdAt: serverTimestamp(),
                },
                { merge: true }
              );

              // users/{uid}/private/health_profile
              await setDoc(
                doc(db, 'users', created.uid, 'private', 'health_profile'),
                final,
                { merge: true }
              );

              await sendEmailVerification(created);

              // cleanup local
              if (typeof window !== 'undefined') {
                localStorage.removeItem(LS_KEY);
                localStorage.removeItem(LS_KEY + '_quiz');
              }

              // verify → app
              router.push('/verify-email?next=/app');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </main>
  );
}

/* ── Sections ─────────────────────────────────────────────── */

function SectionBasics({ quiz, setQuiz }: { quiz: Quiz; setQuiz: (q: Quiz) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your basics</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <input className="rounded border p-2" placeholder="Height (cm)" type="number"
               value={quiz.heightCm ?? ''} onChange={(e)=>setQuiz({ ...quiz, heightCm: +e.target.value || undefined })}/>
        <input className="rounded border p-2" placeholder="Weight (kg)" type="number"
               value={quiz.weightKg ?? ''} onChange={(e)=>setQuiz({ ...quiz, weightKg: +e.target.value || undefined })}/>
        <input className="rounded border p-2" placeholder="Birthday" type="date"
               value={quiz.birthday ?? ''} onChange={(e)=>setQuiz({ ...quiz, birthday: e.target.value || undefined })}/>
      </div>
    </div>
  );
}

function SectionGoals({ quiz, setQuiz }: { quiz: Quiz; setQuiz: (q: Quiz) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your goal</h2>
      <div className="grid md:grid-cols-4 gap-2">
        {GOALS.map(g => (
          <button key={g} type="button"
            onClick={()=>setQuiz({ ...quiz, goal: g })}
            className={`px-3 py-2 rounded border ${quiz.goal===g?'bg-black text-white':''}`}>
            {g.replace('_',' ')}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <div className="text-sm opacity-75">Activity level</div>
        <select className="rounded border p-2" value={quiz.activityLevel||''}
          onChange={(e)=>setQuiz({ ...quiz, activityLevel: (e.target.value || undefined) as any })}>
          <option value="">Select</option>
          <option value="sedentary">Sedentary</option>
          <option value="light">Light</option>
          <option value="moderate">Moderate</option>
          <option value="active">Active</option>
          <option value="very_active">Very active</option>
        </select>
      </div>
    </div>
  );
}

function SectionPreferences({ quiz, setQuiz }: { quiz: Quiz; setQuiz: (q: Quiz) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Food preferences</h2>
      <div>
        <div className="text-sm opacity-75 mb-1">Diet preference</div>
        <div className="grid md:grid-cols-3 gap-2">
          {DIETS.map(d => (
            <button key={d} type="button"
              onClick={()=>setQuiz({ ...quiz, dietPreference: d })}
              className={`px-3 py-2 rounded border ${quiz.dietPreference===d?'bg-black text-white':''}`}>
              {d.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm opacity-75 mb-1">Cuisines you like</div>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map(c => {
            const set = new Set(quiz.cuisineLikes || []);
            const active = set.has(c);
            return (
              <button key={c} type="button"
                onClick={()=>{ active ? set.delete(c) : set.add(c); setQuiz({ ...quiz, cuisineLikes: Array.from(set) }); }}
                className={`px-3 py-1 rounded-full border ${active?'bg-black text-white':''}`}>
                {c.replace('_',' ')}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-sm opacity-75 mb-1">Foods to avoid (dislikes/intolerances)</div>
        <input className="w-full rounded border p-2" placeholder="e.g. mushrooms, spicy, lactose"
               value={quiz.foodsToAvoid||''} onChange={(e)=>setQuiz({ ...quiz, foodsToAvoid: e.target.value })}/>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <div>
          <div className="text-sm opacity-75 mb-1">Typical cooking time (per meal)</div>
          <select className="rounded border p-2" value={quiz.cookingTime||''}
            onChange={(e)=>setQuiz({ ...quiz, cookingTime: (e.target.value || undefined) as any })}>
            <option value="">Select</option>
            <option value="5-10">5–10 min</option>
            <option value="10-20">10–20 min</option>
            <option value="20-30">20–30 min</option>
            <option value="30+">30+ min</option>
          </select>
        </div>
        <div>
          <div className="text-sm opacity-75 mb-1">Food budget</div>
          <select className="rounded border p-2" value={quiz.budget||''}
            onChange={(e)=>setQuiz({ ...quiz, budget: (e.target.value || undefined) as any })}>
            <option value="">Select</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function SectionConsent({ hp, setHp }:{ hp: HealthProfile; setHp: (h: HealthProfile)=>void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">A few health checks</h2>
      <label className="flex items-center gap-2">
        <input type="checkbox"
          checked={!!hp.consent?.healthConsentAt}
          onChange={(e)=>setHp({ ...hp, consent: { ...hp.consent, healthConsentAt: e.target.checked ? new Date().toISOString() : undefined } })}
        />
        I consent to processing of my health information to personalize my plan.
      </label>
    </div>
  );
}

function SectionSummary({ quiz, bmi, sexAtBirth }:{ quiz: Quiz; bmi: number|null; sexAtBirth?: 'male'|'female'|'intersex'|'prefer_not_to_say' }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Summary</h2>
      <div className="text-sm opacity-80">
        {sexAtBirth ? <>Sex: <b>{sexAtBirth}</b> • </> : null}
        {quiz.heightCm ? <>Height: <b>{quiz.heightCm} cm</b> • </> : null}
        {quiz.weightKg ? <>Weight: <b>{quiz.weightKg} kg</b> • </> : null}
        {bmi ? <>BMI: <b>{bmi}</b> • </> : null}
        {quiz.goal ? <>Goal: <b>{quiz.goal.replace('_',' ')}</b> • </> : null}
        {quiz.dietPreference ? <>Diet: <b>{quiz.dietPreference.replace('_',' ')}</b> • </> : null}
        {quiz.cuisineLikes?.length ? <>Cuisines: <b>{quiz.cuisineLikes.join(', ')}</b> • </> : null}
        {quiz.cookingTime ? <>Time: <b>{quiz.cookingTime} min</b> • </> : null}
        {quiz.budget ? <>Budget: <b>{quiz.budget}</b> • </> : null}
        {quiz.foodsToAvoid ? <>Avoid: <b>{quiz.foodsToAvoid}</b></> : null}
      </div>
      <p className="text-sm opacity-70">Create your account next to save and get your personalized plan.</p>
    </div>
  );
}

function SignupInline({ onClose, onSubmit }:{ onClose: ()=>void; onSubmit: (name:string,email:string,password:string)=>Promise<void> }) {
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [err,setErr]=useState<string|null>(null); const [loading,setLoading]=useState(false);
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
        <h3 className="text-lg font-semibold mb-3">Create your account</h3>
        <div className="space-y-3">
          <input className="w-full rounded border p-2" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Password (min 6 chars)" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose}>Back</Button>
            <Button
              onClick={async ()=>{ setErr(null); setLoading(true); try{ await onSubmit(name,email,password); } catch(e:any){ setErr(e?.message||'Could not create account'); } finally{ setLoading(false); } }}
              disabled={loading}
            >
              {loading?'Creating…':'Create account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────── */

function deriveRisk(h: HealthProfile): 'low'|'moderate'|'high' {
  const p = h.parqPlus;
  if (p.q5_heartCondition || p.q1_chestPain) return 'high';
  if (p.q2_dizziness || p.q6_bloodPressureIssue || p.q4_prescriptionMeds) return 'moderate';
  return 'low';
}
function mapActivityToIntensity(a?: Quiz['activityLevel']) {
  if (a === 'sedentary' || a === 'light') return 'low';
  if (a === 'moderate') return 'medium';
  if (a === 'active' || a === 'very_active') return 'high';
  return undefined;
}
function summarizePreferences(q: Quiz) {
  const parts = [
    q.dietPreference && `Diet: ${q.dietPreference}`,
    q.cuisineLikes?.length ? `Cuisines: ${q.cuisineLikes.join(', ')}` : '',
    q.foodsToAvoid ? `Avoid: ${q.foodsToAvoid}` : '',
    q.cookingTime && `Cooking time: ${q.cookingTime}`,
    q.budget && `Budget: ${q.budget}`,
  ].filter(Boolean);
  return parts.join(' | ');
}
