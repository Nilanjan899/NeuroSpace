"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BCTTPage() {
  const [username, setUsername] = useState('');
  const [age, setAge] = useState(25);
  const [userId, setUserId] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [timer, setTimer] = useState(1200); // 20 minutes
  const [stage] = useState(1);
  const [vas, setVas] = useState(0);
  const [baselineVas, setBaselineVas] = useState(0);
  const [, setHrMax] = useState(0);
  const [targetHR, setTargetHR] = useState(0);
  const [promptVas, setPromptVas] = useState(false);

  const registerUser = async () => {
    try {
      const res = await fetch('http://localhost:8000/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username || `user_${Date.now()}`, age })
      });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.id);
        setHrMax(data.hr_max);
        setTargetHR(Math.floor(data.hr_max * (0.45 + (stage * 0.05))));
      } else {
        // Fallback to local calculation if user exists or error
        setHrMax(220 - age);
        setTargetHR(Math.floor((220 - age) * (0.45 + (stage * 0.05))));
      }
      setBaselineVas(vas); // Store baseline right before starting
      setStarted(true);
    } catch (e) {
      console.error(e);
      // Fallback
      setHrMax(220 - age);
      setTargetHR(Math.floor((220 - age) * (0.45 + (stage * 0.05))));
      setBaselineVas(vas);
      setStarted(true);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (started && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => {
          const newTime = t - 1;
          // Prompt for VAS every 5 minutes (300 seconds)
          if (newTime % 300 === 0 && newTime !== 1200 && newTime !== 0) {
            setPromptVas(true);
          }
          return newTime;
        });
      }, 1000);
    } else if (timer === 0 && started) {
      logSymptom("Completed session");
      alert("Session complete! You may advance to the next stage tomorrow if your symptoms remain stable.");
      setStarted(false);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, timer]);

  const logSymptom = async (context: string) => {
    if (!userId) return;
    try {
      await fetch('http://localhost:8000/symptoms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, context, vas_score: vas, notes: `Stage ${stage}` })
      });
    } catch (e) {
      console.error("Failed to log symptom", e);
    }
  };

  const handleVasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVas(val);
    
    // Hard stop logic: > 2 points increase from baseline
    if (val - baselineVas > 2) {
      alert("HARD STOP: Symptom spike > 2 points from baseline detected. Please cease exercise and rest immediately.");
      logSymptom("Hard Stop Triggered");
      setStarted(false);
      setPromptVas(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-danger opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-2xl mb-8 z-10">
        <Link href="/" className="text-highlight hover:text-foreground transition-colors font-semibold">&larr; Back to Dashboard</Link>
      </div>
      
      <h1 className="text-4xl font-extrabold mb-6 z-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-foreground to-highlight">
        Autonomic Rehabilitation Engine
      </h1>
      
      {!started ? (
        <div className="glass-panel p-8 rounded-2xl w-full max-w-md z-10">
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Username (Optional):</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-background/50 border border-accent rounded text-foreground outline-none focus:border-highlight transition-colors"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-semibold">Enter your Age:</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(parseInt(e.target.value))}
              className="w-full p-3 bg-background/50 border border-accent rounded text-foreground outline-none focus:border-highlight transition-colors"
            />
          </div>
          
          <div className="mb-8">
            <label className="block mb-2 font-semibold text-highlight">Pre-Exercise Baseline VAS (0-10):</label>
            <input 
              type="range" 
              min="0" max="10" 
              value={vas} 
              onChange={(e) => setVas(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm mt-1 text-foreground/70">
              <span>0 (None)</span>
              <span>10 (Severe)</span>
            </div>
            <p className="text-center mt-2 text-2xl font-bold">{vas}</p>
          </div>

          <button 
            onClick={registerUser}
            className="w-full bg-highlight text-background font-bold py-3 px-4 rounded-xl hover:bg-highlight/80 transition-colors shadow-lg"
          >
            Start Stage {stage} Session
          </button>
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-2xl w-full max-w-md text-center z-10 relative">
          {promptVas && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-danger shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 text-danger animate-pulse">5-Minute Check-in</h3>
              <p className="mb-6 text-lg">Update your current symptom severity.</p>
              <input 
                type="range" 
                min="0" max="10" 
                value={vas} 
                onChange={handleVasChange}
                className="w-full mb-4"
              />
              <p className="text-3xl font-bold mb-6">{vas}</p>
              <button 
                onClick={() => { setPromptVas(false); logSymptom("5-min check"); }}
                className="w-full bg-highlight text-background font-bold py-3 px-4 rounded-xl shadow-lg"
              >
                Continue Exercise
              </button>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-2">Exercise in Progress</h2>
          <p className="text-foreground/70 mb-6">Baseline VAS: {baselineVas}</p>
          
          <div className="text-6xl font-mono mb-8 font-light tracking-widest text-highlight">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
          
          <div className="mb-8 p-6 bg-background/40 border border-highlight/50 rounded-xl">
            <h3 className="font-semibold mb-2 uppercase tracking-wider text-sm">Target Heart Rate</h3>
            <p className="text-4xl font-bold text-highlight">{targetHR} BPM</p>
            <p className="text-sm mt-3 text-foreground/80">Maintain light aerobic activity at this threshold.</p>
          </div>

          <button 
            onClick={() => { setStarted(false); logSymptom("Manually Stopped"); }}
            className="w-full bg-danger text-white font-bold py-3 px-4 rounded-xl hover:bg-danger/80 transition-colors shadow-lg"
          >
            Stop Exercise
          </button>
        </div>
      )}
    </main>
  );
}
