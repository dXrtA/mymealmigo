"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/context/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { defaultHealthProfile, type HealthProfile, type ParqPlus } from "@/types/health";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CONDITIONS = [
  "hypertension","diabetes","heart_disease","asthma","epilepsy","orthopedic_issues","pregnancy","recent_surgery",
];
const ALLERGIES = ["peanut", "penicillin", "shellfish", "pollen", "lactose"];
const INJURIES = ["knee", "ankle", "shoulder", "lower_back", "neck"];

export default function HealthPage() {
  return <ProtectedRoute requireAuth><WizardShell /></ProtectedRoute>;
}

function WizardShell() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [hp, setHp] = useState<HealthProfile>(defaultHealthProfile);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) return;
      const ref = doc(db, `users/${user.uid}/health_profile`);
      const snap = await getDoc(ref);
      if (!active) return;
      if (snap.exists()) setHp({ ...defaultHealthProfile, ...snap.data() } as HealthProfile);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  const risk = useMemo(() => deriveRisk(hp), [hp]);

  async function save(partial?: Partial<HealthProfile>) {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, `users/${user.uid}/health_profile`);
      const payload: HealthProfile = { ...hp, ...(partial||{}), riskLevel: deriveRisk({ ...hp, ...(partial||{}) }), updatedAt: serverTimestamp() as any };
      await setDoc(ref, { ...payload, createdAt: (hp.createdAt ?? serverTimestamp()) as any }, { merge: true });
      setHp(payload);
    } finally { setSaving(false); }
  }
  async function complete() { await save({ completed: true }); }

  if (loading) return <div className="p-6">Loading health profile…</div>;

  return (<div className="max-w-3xl mx-auto p-4 space-y-4">
    <h1 className="text-2xl font-semibold">Health & Safety</h1>
    <p className="text-sm opacity-80">Help us personalize your workouts and keep you safe. You can update this anytime.</p>
    <RiskBanner risk={risk} />
    <Card className="p-4 space-y-6">
      {step===0 && <StepConsent hp={hp} onChange={setHp}/>}
      {step===1 && <StepParq hp={hp} onChange={setHp}/>}
      {step===2 && <StepConditions hp={hp} onChange={setHp}/>}
      {step===3 && <StepMedications hp={hp} onChange={setHp}/>}
      {step===4 && <StepInjuries hp={hp} onChange={setHp}/>}
      {step===5 && <StepEmergency hp={hp} onChange={setHp}/>}
      {step===6 && <StepFitness hp={hp} onChange={setHp}/>}
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-70">Step {step+1} / 7</div>
        <div className="flex gap-2">
          <Button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0||saving} variant="secondary">Back</Button>
          {step<6? <Button onClick={async()=>{await save(); setStep(s=>Math.min(6,s+1));}} disabled={saving}>Save & Continue</Button> :
            <Button onClick={complete} disabled={saving||!hp.consent?.tosAcceptedAt||!hp.consent?.healthConsentAt}>Finish</Button>}
        </div>
      </div>
    </Card>
  </div>);
}

function RiskBanner({ risk }: { risk: "low"|"moderate"|"high" }) {
  const color = risk==="high"?"bg-red-100 text-red-800":risk==="moderate"?"bg-amber-100 text-amber-800":"bg-emerald-100 text-emerald-800";
  const label = risk==="high"?"High":risk==="moderate"?"Moderate":"Low";
  return <div className={`rounded-lg p-3 text-sm ${color}`}>Current risk level: <b>{label}</b>.</div>;
}

function StepConsent({ hp,onChange }:{hp:HealthProfile;onChange:(h:HealthProfile)=>void}){return(<div className="space-y-4">
  <h2 className="text-lg font-semibold">Consent</h2>
  <label className="flex items-center gap-2"><input type="checkbox" checked={!!hp.consent?.tosAcceptedAt} onChange={e=>onChange({...hp,consent:{...hp.consent,tosAcceptedAt:e.target.checked?new Date().toISOString():undefined}})}/>I agree to the Terms</label>
  <label className="flex items-center gap-2"><input type="checkbox" checked={!!hp.consent?.healthConsentAt} onChange={e=>onChange({...hp,consent:{...hp.consent,healthConsentAt:e.target.checked?new Date().toISOString():undefined}})}/>I consent to health processing</label>
  <label className="flex items-center gap-2"><input type="checkbox" checked={!!hp.consent?.shareWithCoach} onChange={e=>onChange({...hp,consent:{...hp.consent,shareWithCoach:e.target.checked}})}/>Allow coach to view</label></div>);}

function StepParq({hp,onChange}:{hp:HealthProfile;onChange:(h:HealthProfile)=>void}){
  const p=hp.parqPlus;
  const PARQ_ITEMS:ReadonlyArray<[keyof Omit<ParqPlus,'notes'>,string]>=[
    ['q1_chestPain','Chest pain during physical activity'],
    ['q2_dizziness','Dizziness or loss of balance'],
    ['q3_boneJointProblem','Bone/joint problems that could be made worse'],
    ['q4_prescriptionMeds','Currently taking prescription medications'],
    ['q5_heartCondition','Diagnosed heart condition'],
    ['q6_bloodPressureIssue','High/low blood pressure issues'],
    ['q7_otherReason','Any other reason you should not do physical activity'],
  ];
  const setBool=(k:keyof Omit<ParqPlus,'notes'>,v:boolean)=>onChange({...hp,parqPlus:{...p,[k]:v}});
  return(<div className="space-y-3"><h2 className="text-lg font-semibold">PAR-Q+</h2>
    {PARQ_ITEMS.map(([k,label])=>(<label key={k as string} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(p[k])} onChange={e=>setBool(k,e.target.checked)}/> {label}</label>))}
    <textarea className="w-full rounded border p-2" placeholder="Notes" value={p.notes||""} onChange={e=>onChange({...hp,parqPlus:{...p,notes:e.target.value}})}/></div>);}

function Pill({active,onClick,children}:any){return(<button type="button" onClick={onClick} className={`px-3 py-1 rounded-full border mr-2 mb-2 ${active?"bg-black text-white":"bg-white"}`}>{children}</button>);}

function StepConditions({hp,onChange}:{hp:HealthProfile;onChange:(h:HealthProfile)=>void}){
  const selected=new Set(hp.conditions.items);const toggle=(v:string)=>{selected.has(v)?selected.delete(v):selected.add(v);onChange({...hp,conditions:{...hp.conditions,items:Array.from(selected)}})};
  return(<div className="space-y-4"><h2 className="text-lg font-semibold">Medical Conditions & Allergies</h2><div><div className="font-medium mb-2">Conditions</div><div>{CONDITIONS.map(c=><Pill key={c} active={selected.has(c)} onClick={()=>toggle(c)}>{c.replace(/_/g," ")}</Pill>)}</div><input className="mt-2 w-full rounded border p-2" placeholder="Other" value={hp.conditions.other||""} onChange={e=>onChange({...hp,conditions:{...hp.conditions,other:e.target.value}})}/></div><div><div className="font-medium mb-2">Allergies</div><div>{ALLERGIES.map(a=><Pill key={a} active={hp.allergies.items.includes(a)} onClick={()=>{const s=new Set(hp.allergies.items);s.has(a)?s.delete(a):s.add(a);onChange({...hp,allergies:{...hp.allergies,items:Array.from(s)}})}}>{a}</Pill>)}</div><input className="mt-2 w-full rounded border p-2" placeholder="Other" value={hp.allergies.other||""} onChange={e=>onChange({...hp,allergies:{...hp.allergies,other:e.target.value}})}/></div></div>);}

function StepMedications({hp,onChange}:{hp:HealthProfile;onChange:(h:HealthProfile)=>void}){
  const meds=hp.medications||[];const setAt=(i:number,k:keyof HealthProfile['medications'][number],v:string)=>{onChange({...hp,medications:meds.map((m,idx)=>idx===i?{...m,[k]:v}:m)})};
  return(<div className="space-y-4"><h2 className="text-lg font-semibold">Medications</h2>{meds.length===0&&<div className="text-sm opacity-70">No medications added.</div>}{meds.map((m,i)=>(<div key={i} className="grid md:grid-cols-3 gap-2 border rounded p-3"><input className="rounded border p-2" placeholder="Name" value={m.name||""} onChange={e=>setAt(i,'name',e.target.value)}/><input className="rounded border p-2" placeholder="Dose" value={m.dose||""} onChange={e=>setAt(i,'dose',e.target.value)}/><input className="rounded border p-2" placeholder="Frequency" value={m.frequency||""} onChange={e=>setAt(i,'frequency',e.target.value)}/><input className="rounded border p-2" placeholder="Purpose" value={m.purpose||""} onChange={e=>setAt(i,'purpose',e.target.value)}/><input className="rounded border p-2" placeholder="Started On" value={m.startedOn||""} onChange={e=>setAt(i,'startedOn',e.target.value)}/><input className="rounded border p-2 md:col-span-3" placeholder="Notes" value={m.notes||""} onChange={e=>setAt(i,'notes',e.target.value)}/><div className="md:col-span-3 flex justify-end"><Button variant="secondary" onClick={()=>onChange({...hp,medications:meds.filter((_,idx)=>idx!==i)})}>Remove</Button></div></div>))}<Button onClick={()=>onChange({...hp,medications:[...meds,{name:""}]})}>Add medication</Button></div>);}

function StepInjuries({hp,onChange}:{hp:HealthProfile;onChange:(h:HealthProfile)=>void}){
  const selected=new Set(hp.injuries?.items||[]);const toggle=(v:string)=>{selected.has(v)?selected.delete(v):selected.add(v);onChange({...hp,injuries:{...(hp.injuries||{items:[]}),items:Array.from(selected)}})};
  return(<div className="space-y-4"><h2 className="text-lg font-semibold">Injuries & Constraints</h2><div><div className="font-medium mb-2">Injuries</div>{INJURIES.map(inj=><Pill key={inj} active={selected.has(inj)} onClick={()=>toggle(inj)}>{inj.replace(/_/g," ")}</Pill>)}<input className="mt-2 w-full rounded border p-2" placeholder="Notes" value={hp.injuries?.notes||""} onChange={e=>onChange({...hp,injuries:{...(hp.injuries||{items:[]}),notes:e.target.value}})}/></div><div className="grid md:grid-cols-3 gap-2"><label className="flex items-center gap-2"><input type="checkbox" checked={!!hp.constraints?.hiImpact} onChange={e=>onChange({...hp,constraints:{...hp.constraints,hiImpact:e.target.checked}})}/> Allow high-impact</label><label className="flex items-center gap-2"><input type="checkbox" checked={!!hp.constraints?.overheadLifts} onChange={e=>onChange({...hp,constraints:{...hp.constraints,overheadLifts:e.target.checked}})}/> Allow overhead lifts</label><label className="flex items-center gap-2"><input type="checkbox" checked={!!hp.constraints?.heat} onChange={e=>onChange({...hp,constraints:{...hp.constraints,heat:e.target.checked}})}/> Comfortable with heat</label></div><input className="w-full rounded border p-2" placeholder="Other constraints" value={hp.constraints?.notes||""} onChange={e=>onChange({...hp,constraints:{...hp.constraints,notes:e.target.value}})}/></div>);}

function StepEmergency({hp,onChange}:{hp:HealthProfile;onChange:(h:HealthProfile)=>void}){const em=hp.emergency||{};return(<div className="space-y-3"><h2 className="text-lg font-semibold">Emergency Contact</h2><div className="grid md:grid-cols-2 gap-2"><input className="rounded border p-2" placeholder="Name" value={em.name||""} onChange={e=>onChange({...hp,emergency:{...em,name:e.target.value}})}/><input className="rounded border p-2" placeholder="Relationship" value={em.relationship||""} onChange={e=>onChange({...hp,emergency:{...em,relationship:e.target.value}})}/><input className="rounded border p-2" placeholder="Country Code" value={em.countryCode||""} onChange={e=>onChange({...hp,emergency:{...em,countryCode:e.target.value}})}/><input className="rounded border p-2" placeholder="Phone" value={em.phone||""} onChange={e=>onChange({...hp,emergency:{...em,phone:e.target.value}})}/></div></div>);}

function StepFitness({hp,onChange}:{hp:HealthProfile;onChange:(h:HealthProfile)=>void}){
  const f=hp.fitness||{};const set=(k:keyof NonNullable<HealthProfile['fitness']>,v:any)=>onChange({...hp,fitness:{...f,[k]:v}});
  const EQUIP=["none","mat","dumbbells","resistance_band","barbell","bike","treadmill"];
  const selected=new Set(f.equipment||[]);const toggle=(eq:string)=>{selected.has(eq)?selected.delete(eq):selected.add(eq);set("equipment",Array.from(selected));};
  return(<div className="space-y-4"><h2 className="text-lg font-semibold">Fitness Preferences</h2><div className="grid md:grid-cols-3 gap-2"><select className="rounded border p-2" value={f.goal||""} onChange={e=>set("goal",e.target.value)}><option value="">Select Goal</option><option value="weight_loss">Weight Loss</option><option value="cardio">Cardio</option><option value="strength">Strength</option><option value="mobility">Mobility</option></select><select className="rounded border p-2" value={f.experienceLevel||""} onChange={e=>set("experienceLevel",e.target.value)}><option value="">Experience Level</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select><select className="rounded border p-2" value={f.preferredIntensity||""} onChange={e=>set("preferredIntensity",e.target.value)}><option value="">Intensity</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div><div className="mt-2"><div className="font-medium mb-2">Equipment</div>{EQUIP.map(eq=><Pill key={eq} active={selected.has(eq)} onClick={()=>toggle(eq)}>{eq.replace(/_/g," ")}</Pill>)}</div></div>);}

function deriveRisk(h:HealthProfile):"low"|"moderate"|"high"{const p=h.parqPlus;if(p.q5_heartCondition||p.q1_chestPain)return"high";if(p.q2_dizziness||p.q6_bloodPressureIssue||p.q4_prescriptionMeds)return"moderate";return"low";}
