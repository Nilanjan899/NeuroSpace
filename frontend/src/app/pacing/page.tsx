"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PacingPage() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'work' | 'rest'>('work');
  const [timer, setTimer] = useState(0); 
  const [isActive, setIsActive] = useState(false);
  const [vas, setVas] = useState(0);
  const [preVas, setPreVas] = useState<number | null>(null);

  // Initialize timer based on step
  useEffect(() => {
    setIsActive(false);
    if (step === 1) {
      setTimer(48 * 60 * 60); // 48 hours for relative rest
    } else if (step === 2) {
      setTimer(mode === 'work' ? 15 * 60 : 30 * 60);
    } else if (step === 3) {
      setTimer(30 * 60); // 30 min work blocks
      setPreVas(null); // Reset VAS check
    }
  }, [step, mode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && isActive) {
      if (step === 1) {
        alert("48-hour relative rest period completed. You may advance to Step 2.");
        setIsActive(false);
      } else if (step === 2) {
        if (mode === 'work') {
          alert("Work block complete. Please evaluate your symptoms.");
          setMode('rest');
        } else {
          alert("Rest block complete.");
          setMode('work');
        }
        setIsActive(false);
      } else if (step === 3) {
        alert("Study block complete. Please perform a post-block VAS symptom check.");
        setIsActive(false);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timer, mode, step]);

  const toggleTimer = () => {
    if (step === 3 && mode === 'work' && preVas === null) {
      alert("Please log your Pre-Block VAS score first.");
      return;
    }
    setIsActive(!isActive);
  };

  const handleVasLog = () => {
    if (preVas === null) {
      setPreVas(vas);
      alert(`Pre-block VAS of ${vas} logged.`);
    } else {
      if (vas - preVas > 2) {
        alert(`Post-block VAS of ${vas} logged. Symptom spike detected! Rest immediately.`);
      } else {
        alert(`Post-block VAS of ${vas} logged. Tolerance maintained.`);
      }
      setPreVas(null); // Reset for next session
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-[-10%] w-96 h-96 bg-highlight opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-4xl mb-8 z-10 flex justify-between items-center">
        <Link href="/" className="text-highlight hover:text-foreground transition-colors font-semibold">&larr; Back to Dashboard</Link>
      </div>
      
      <h1 className="text-4xl font-extrabold mb-6 z-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-foreground to-highlight">
        Cognitive Pacing & Return-to-Learn
      </h1>
      <p className="mb-8 text-center max-w-2xl text-foreground/80 z-10">
        Structured pediatric protocol. Progress slowly to avoid unmanageable symptom spikes.
      </p>

      {/* Protocol Steps Tracker */}
      <div className="flex gap-2 w-full max-w-4xl mb-12 z-10">
        {[1, 2, 3, 4, 5].map((s) => (
          <button 
            key={s} 
            onClick={() => setStep(s)}
            className={`flex-1 py-3 text-center rounded-xl font-bold transition-all ${step === s ? 'bg-highlight text-background shadow-lg scale-105' : 'glass-panel text-foreground/70 hover:bg-highlight/20'}`}
          >
            Step {s}
          </button>
        ))}
      </div>
      
      <div className="glass-panel p-10 rounded-3xl w-full max-w-2xl flex flex-col items-center z-10">
        {step === 1 && (
          <div className="text-center w-full">
            <h2 className="text-2xl font-bold mb-4">Relative Rest at Home</h2>
            <p className="mb-8 text-foreground/70">Intensive cognitive features are locked out. Limit screen time.</p>
            <div className="text-6xl font-mono mb-8 text-highlight tracking-widest">{formatTime(timer)}</div>
            <button onClick={toggleTimer} className="bg-highlight text-background font-bold py-3 px-8 rounded-xl w-full max-w-xs shadow-lg">
              {isActive ? 'Pause Rest Timer' : 'Start 48hr Countdown'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center w-full">
            <h2 className="text-2xl font-bold mb-4">Light Cognitive Activities</h2>
            <p className="mb-8 text-foreground/70">5-15 minutes of reading/drawing followed by 30 minutes rest.</p>
            
            <div className={`mx-auto flex flex-col items-center justify-center w-64 h-64 rounded-full border-4 mb-8 ${mode === 'work' ? 'border-highlight text-highlight shadow-[0_0_30px_rgba(179,145,105,0.4)]' : 'border-accent text-accent'}`}>
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2">{mode}</h3>
              <div className="text-5xl font-mono">{formatTime(timer)}</div>
            </div>

            <button onClick={toggleTimer} className="bg-highlight text-background font-bold py-3 px-8 rounded-xl w-full max-w-xs shadow-lg">
              {isActive ? 'Pause Timer' : 'Start Block'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center w-full">
            <h2 className="text-2xl font-bold mb-4">Light School Work</h2>
            <p className="mb-6 text-foreground/70">Work up to 60 minutes in two 30-minute intervals. VAS check mandated.</p>

            <div className="flex flex-col md:flex-row gap-6 w-full mb-8">
              <div className="flex-1 bg-background/50 p-6 rounded-2xl border border-highlight/30">
                <h3 className="font-bold mb-4 text-highlight">{preVas === null ? "Pre-Block Check" : "Post-Block Check"}</h3>
                <input 
                  type="range" min="0" max="10" 
                  value={vas} onChange={(e) => setVas(parseInt(e.target.value))}
                  className="w-full mb-4"
                />
                <p className="text-2xl font-bold mb-4">{vas}</p>
                <button onClick={handleVasLog} className="w-full border border-highlight text-highlight font-bold py-2 px-4 rounded-xl hover:bg-highlight hover:text-background transition-colors">
                  Log VAS Score
                </button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-5xl font-mono text-highlight mb-4">{formatTime(timer)}</div>
                <button onClick={toggleTimer} className="bg-highlight text-background font-bold py-3 px-8 rounded-xl w-full shadow-lg">
                  {isActive ? 'Pause' : 'Start 30m Block'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center w-full">
            <h2 className="text-2xl font-bold mb-4">Part-Time School</h2>
            <p className="mb-8 text-foreground/70">Half days with strict academic accommodations.</p>
            <div className="bg-background/40 p-8 rounded-2xl border border-highlight/30 flex flex-col items-center">
              <div className="w-16 h-16 bg-highlight rounded-full flex items-center justify-center text-background mb-4 text-2xl">PDF</div>
              <p className="mb-6">Generate an export of your symptom logs to justify medical accommodations with your school nurse or teachers.</p>
              <button className="bg-highlight text-background font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-highlight/80">
                Download Accommodation Report
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center w-full">
            <h2 className="text-2xl font-bold mb-4">Full-Time School</h2>
            <p className="mb-8 text-foreground/70">Gradual return to full days and homework.</p>
            <div className="bg-background/40 p-8 rounded-2xl border border-highlight/30 flex flex-col items-center">
              <h3 className="text-xl font-bold text-highlight mb-2">Cognitive Tracking Dashboard Unlocked</h3>
              <p className="text-sm">Long-term endurance and dual-task degradation monitoring is now available.</p>
              {/* Placeholder for dashboard charts */}
              <div className="w-full h-32 mt-6 flex items-end justify-between px-4">
                {[40, 70, 50, 90, 60, 30, 80].map((h, i) => (
                  <div key={i} className="w-8 bg-highlight/50 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
