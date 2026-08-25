"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function VOMSPage() {
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Gaze and Target states
  const [gazeDot, setGazeDot] = useState({ x: 0, y: 0 });
  const gazeHistoryRef = useRef<{x: number, y: number}[]>([]);
  const targetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-Calibration Feature
  const [autoCalibrate, setAutoCalibrate] = useState(true);
  const autoCalRef = useRef(true); // Sync for requestAnimationFrame closure

  const toggleAutoCalibrate = () => {
    setAutoCalibrate(prev => {
      autoCalRef.current = !prev;
      return !prev;
    });
  };
  
  useEffect(() => {
    if (tracking) {
      // 1. Block physical mouse movements so WebGazer doesn't learn from the mouse cursor
      const blockRealMouse = (e: MouseEvent) => {
        if (e.isTrusted) {
          e.stopPropagation();
        }
      };
      window.addEventListener('mousemove', blockRealMouse, true);

      let animationFrameId: number;
      let lastTime: number;
      let phase = 0;
      
      // Saccade Engine State
      const saccadePoints = [
        {x: 10, y: 10}, {x: 50, y: 10}, {x: 90, y: 10},
        {x: 10, y: 50}, {x: 50, y: 50}, {x: 90, y: 50},
        {x: 10, y: 90}, {x: 50, y: 90}, {x: 90, y: 90}
      ];
      let saccadeIndex = 0;
      let saccadeTimer = 0;
      let injectionsDone = 0;

      const animate = (timestamp: number) => {
        if (!lastTime) lastTime = timestamp;
        const dtMs = timestamp - lastTime;
        const dt = dtMs / 1000;
        lastTime = timestamp;
        
        if (targetRef.current && containerRef.current) {
          
          if (autoCalRef.current) {
             // MODE 1: Guided Saccade Calibration (Matrix Stabilization)
             if (saccadeIndex < saccadePoints.length) {
                const targetNode = saccadePoints[saccadeIndex];
                const px = targetNode.x;
                const py = targetNode.y;
                
                targetRef.current.style.left = `${px}%`;
                targetRef.current.style.top = `${py}%`;

                saccadeTimer += dtMs;
                
                // Target stays stationary for 1500ms total.
                // Wait 500ms for eyes to lock on, then inject 5 clean points.
                if (saccadeTimer > 500 && injectionsDone < 5) {
                   const timePerInjection = 1000 / 5; // 200ms
                   if (saccadeTimer > 500 + injectionsDone * timePerInjection) {
                      injectionsDone++;
                      
                      const rect = containerRef.current.getBoundingClientRect();
                      const absoluteX = rect.left + (px / 100) * rect.width;
                      const absoluteY = rect.top + (py / 100) * rect.height;
                      
                      const webgazer = (window as any).webgazer;
                      if (webgazer && typeof webgazer.recordScreenPosition === 'function') {
                        webgazer.recordScreenPosition(absoluteX, absoluteY, 'click');
                      } else {
                        document.dispatchEvent(new MouseEvent('click', { clientX: absoluteX, clientY: absoluteY, bubbles: true }));
                      }
                   }
                }

                // Move to next point
                if (saccadeTimer >= 1500) {
                   saccadeIndex++;
                   saccadeTimer = 0;
                   injectionsDone = 0;
                }
             } else {
                // Calibration Complete! Automatically switch to Smooth Pursuit.
                setAutoCalibrate(false);
                autoCalRef.current = false;
                saccadeIndex = 0; 
             }
          } else {
             // MODE 2: Standard VOMS Smooth Pursuit Exercise
             const speed = 1.5;
             phase += dt * speed;

             const px = 50 + Math.sin(phase) * 40;
             const py = 50 + Math.cos(phase * 0.5) * 30;
             
             targetRef.current.style.left = `${px}%`;
             targetRef.current.style.top = `${py}%`;
          }
        }
        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', blockRealMouse, true);
      };
    }
  }, [tracking]);

  const startTracking = async () => {
    setLoading(true);
    try {
      const webgazer = (await import('webgazer')).default;
      webgazer.clearData();
      webgazer.setRegression('weightedRidge');
      
      gazeHistoryRef.current = [];
      
      await webgazer.setGazeListener((data: Record<string, number> | null) => {
        if (data == null) return;
        setGazeDot({ x: data.x, y: data.y });
      }).begin();
      
      webgazer.applyKalmanFilter(true);
      webgazer.showVideoPreview(true).showPredictionPoints(true);

      setTracking(true);
      setAutoCalibrate(true);
      autoCalRef.current = true;
    } catch (err) {
      console.error("Error initializing WebGazer: ", err);
      alert("Could not initialize gaze tracking. Please ensure camera permissions are granted.");
    }
    setLoading(false);
  };

  const stopTracking = async () => {
    try {
      const webgazer = (await import('webgazer')).default;
      webgazer.end();
      setTracking(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    return () => {
      if (tracking) stopTracking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking]);

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-background relative overflow-hidden">
      {/* 4. Global CSS to lock WebGazer's injected video feed to the top-left corner */}
      <style dangerouslySetInnerHTML={{__html: `
        #webgazerVideoContainer {
          position: fixed !important;
          top: 24px !important;
          left: 24px !important;
          width: 320px !important;
          height: 240px !important;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          z-index: 9999 !important;
          display: block !important;
          border: 2px solid var(--highlight);
        }
        #webgazerVideoFeed, #webgazerFaceOverlay {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}} />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-highlight opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl mb-4 z-10 flex justify-between items-end relative">
        <div className="flex-1"></div>
        {tracking && (
          <div className="flex gap-4 items-center z-50">
            <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-3 border border-highlight/50">
              <span className="text-sm font-bold tracking-wide">AUTO-CALIBRATE ML</span>
              <button 
                onClick={toggleAutoCalibrate}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${autoCalibrate ? 'bg-green-500' : 'bg-gray-500'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${autoCalibrate ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>
            <button onClick={stopTracking} className="bg-danger text-white px-4 py-3 rounded-lg hover:bg-danger/80 transition-colors shadow-lg font-bold">
              End Screening
            </button>
          </div>
        )}
      </div>

      <div className="absolute top-12 right-12 z-50">
        <Link href="/" className="text-highlight hover:text-foreground transition-colors font-semibold">&larr; Back to Dashboard</Link>
      </div>
      
      <h1 className="text-4xl font-extrabold mb-6 z-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-foreground to-highlight relative">
        VOMS Screening (Edge-Compute)
      </h1>
      <p className="mb-8 text-center max-w-2xl text-foreground/80 z-10 relative">
        Follow the moving target with your eyes. Your webcam will track your gaze locally. No video data ever leaves your browser.
      </p>

      {/* The main screening area */}
      <div ref={containerRef} className="relative w-full max-w-5xl aspect-[16/9] glass-panel rounded-2xl overflow-hidden border-2 border-highlight/30 z-10 shadow-2xl bg-black/40">
        
        {!tracking && (
          <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center absolute inset-0 z-20 bg-background/90">
            <h2 className="text-2xl font-bold mb-4">Initialize Model</h2>
            <button 
              onClick={startTracking}
              disabled={loading}
              className="bg-highlight text-background font-bold py-4 px-8 rounded-xl hover:bg-highlight/80 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Initializing AI Models...' : 'Enable Camera & Start'}
            </button>
          </div>
        )}

        {/* VOMS Exercise (Smooth Pursuit) */}
        {tracking && (
          <>
            {autoCalibrate && (
               <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-green-500/20 text-green-400 border border-green-500/50 px-6 py-2 rounded-full font-bold tracking-widest text-sm animate-pulse whitespace-nowrap">
                  ML TRAINING ACTIVE: STARE AT THE TARGET
               </div>
            )}

            <div 
              ref={targetRef}
              className="absolute w-8 h-8 bg-highlight rounded-full shadow-[0_0_20px_rgba(179,145,105,0.8)] -translate-x-1/2 -translate-y-1/2"
              style={{ left: '50%', top: '50%' }}
            >
              <div className="w-2 h-2 bg-background rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* The User's Predicted Gaze (Smoothed and Viewport-Mapped) */}
            <div 
              className="fixed w-12 h-12 border-4 border-danger/60 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 z-[9999]"
              style={{ 
                left: gazeDot.x > 0 ? `${gazeDot.x}px` : '50vw', 
                top: gazeDot.y > 0 ? `${gazeDot.y}px` : '50vh',
                opacity: autoCalibrate ? 0.3 : 1 // Dim the predictor while training
              }}
            ></div>
          </>
        )}
      </div>

      <div className="mt-8 glass-panel p-6 rounded-xl w-full max-w-4xl text-center z-10 relative">
        <h3 className="font-bold text-highlight mb-2">Privacy Assurance: Edge Computing</h3>
        <p className="text-sm text-foreground/80">
          This module uses TensorFlow.js to process raw video streams entirely on your device. 
          Mathematical coordinate outputs are generated locally, ensuring absolute data safety and mitigating biometric privacy liabilities.
        </p>
      </div>
    </main>
  );
}
