"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function RAGPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleAsk = async () => {
    if (!query) return;
    if (!apiKey) {
      setResponse("Please provide your Gemini API Key to use the Medical AI Assistant.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/ask-ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, api_key: apiKey })
      });
      const data = await res.json();
      setResponse(data.answer);
    } catch {
      setResponse("Error connecting to the AI backend. Make sure the FastAPI server is running.");
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-background relative overflow-hidden">
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-highlight opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-4xl mb-8 z-10 flex justify-between items-center">
        <Link href="/" className="text-highlight hover:text-foreground transition-colors font-semibold">&larr; Back to Dashboard</Link>
      </div>
      
      <h1 className="text-4xl font-extrabold mb-6 z-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-foreground to-highlight">
        Medical AI Assistant (Guardrailed RAG)
      </h1>
      <p className="mb-4 text-center max-w-2xl text-foreground/80 z-10">
        Ask questions based strictly on the 6th Consensus Statement and PedsConcussion guidelines. 
        Note: This AI does not provide medical diagnoses.
      </p>

      <div className="w-full max-w-md mb-8 z-10">
        <input 
          type="password" 
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Gemini API Key..."
          className="w-full p-3 bg-background/60 border border-highlight/30 rounded-xl text-foreground outline-none focus:border-highlight transition-all shadow-inner text-sm"
        />
        <p className="text-xs text-foreground/50 mt-2 text-center">Your API key is only sent directly to the backend and is never saved.</p>
      </div>
      
      <div className="w-full max-w-3xl flex flex-col sm:flex-row gap-4 mb-12 z-10">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="E.g., What is the recommended cognitive pacing protocol?"
          className="flex-1 p-4 bg-background/60 border border-highlight/50 rounded-xl text-foreground outline-none focus:border-highlight transition-all shadow-inner"
        />
        <button 
          onClick={handleAsk}
          disabled={loading}
          className="bg-highlight text-background font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-highlight/80 transition-all disabled:opacity-50 min-w-[150px]"
        >
          {loading ? 'Searching...' : 'Ask Database'}
        </button>
      </div>

      {response && (
        <div className="w-full max-w-3xl glass-panel p-8 rounded-2xl border border-highlight/30 shadow-2xl z-10 animate-fade-in">
          <h2 className="text-xl font-bold mb-6 text-highlight uppercase tracking-wider">AI Response</h2>
          <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">{response}</div>
        </div>
      )}
    </main>
  );
}
