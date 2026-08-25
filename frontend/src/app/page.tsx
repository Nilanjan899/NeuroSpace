import Link from 'next/link';

export default function Home() {
  const dailyMotivation = "You're making great progress. Listen to your body and take it one step at a time today.";

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-background text-foreground overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-highlight opacity-10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent opacity-20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-highlight">
        NeuroPace
      </h1>
      <p className="text-xl mb-8 text-center max-w-2xl text-foreground/80 font-light">
        Your structured pacing and active rehabilitation companion for concussion recovery.
      </p>

      {/* Daily Spark of Support */}
      <div className="mb-12 glass-panel p-6 rounded-xl w-full max-w-3xl text-center shadow-lg border-l-4 border-l-highlight transition-transform hover:scale-[1.01]">
        <h3 className="text-sm uppercase tracking-widest text-highlight mb-2 font-bold">Daily Spark of Support</h3>
        <p className="italic text-lg">&quot;{dailyMotivation}&quot;</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl z-10">
        <Link href="/bctt" className="glass-panel p-8 rounded-2xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
          <h2 className="text-2xl font-bold mb-3 group-hover:text-highlight transition-colors">BCTT Treadmill Test &rarr;</h2>
          <p className="text-foreground/70">Guided sub-threshold aerobic rehabilitation tracking.</p>
        </Link>
        
        <Link href="/voms" className="glass-panel p-8 rounded-2xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
          <h2 className="text-2xl font-bold mb-3 group-hover:text-highlight transition-colors">VOMS Screening &rarr;</h2>
          <p className="text-foreground/70">Edge-compute gaze tracking for ocular motor screening.</p>
        </Link>

        <Link href="/pacing" className="glass-panel p-8 rounded-2xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
          <h2 className="text-2xl font-bold mb-3 group-hover:text-highlight transition-colors">Cognitive Pacing &rarr;</h2>
          <p className="text-foreground/70">Pomodoro-style timer for safe return-to-learn.</p>
        </Link>
        
        <Link href="/rag" className="glass-panel p-8 rounded-2xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
          <h2 className="text-2xl font-bold mb-3 group-hover:text-highlight transition-colors">AI Assistant &rarr;</h2>
          <p className="text-foreground/70">Ask questions based on clinical consensus statements.</p>
        </Link>
      </div>
    </main>
  );
}
