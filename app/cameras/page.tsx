'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCameraStatus, getMjpegUrl, type CameraStatus } from '@/lib/api';

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Camera slots: main, t1, t2
  const [slots, setSlots] = useState<{ main: string; t1: string; t2: string }>({
    main: '',
    t1: '',
    t2: '',
  });

  // Fetch camera status on mount and poll every second
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getCameraStatus();
        setCameras(data);
        
        // Initialize slots if empty
        if (!slots.main && data.length >= 3) {
          setSlots({
            main: data[0].camera_id,
            t1: data[1].camera_id,
            t2: data[2].camera_id,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cameras');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const swapMainWith = (thumbSlot: 't1' | 't2') => {
    setSlots((prev) => ({
      ...prev,
      main: prev[thumbSlot],
      [thumbSlot]: prev.main,
    }));
  };

  const formatNumber = (n: number | undefined) => {
    return n?.toLocaleString() ?? '-';
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-zinc-100 transition-colors">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">Camera Wall</h1>
        </div>
        <Link 
          href="/events"
          className="text-sm px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          Events →
        </Link>
      </header>

      {/* Main content: 40% stats, 60% video */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        {/* Left: Stats panel (40%) */}
        <div className="w-[40%] min-w-[320px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="font-semibold">Camera Statistics</h3>
            <p className="text-xs text-zinc-400 mt-1">Live counters from backend</p>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {!error && cameras.length === 0 && (
              <div className="p-3 rounded-lg bg-zinc-800/50 text-zinc-400 text-sm text-center">
                Waiting for cameras...
              </div>
            )}

            {cameras.map((cam) => (
              <div
                key={cam.camera_id}
                className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{cam.camera_id}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      cam.enabled
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {cam.enabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span className="text-zinc-500">Decoded:</span>
                  <span className="text-zinc-300 text-right">
                    {formatNumber(cam.stats?.frames_decoded)}
                  </span>
                  <span className="text-zinc-500">Emitted:</span>
                  <span className="text-zinc-300 text-right">
                    {formatNumber(cam.stats?.frames_emitted)}
                  </span>
                  <span className="text-zinc-500">Last TS:</span>
                  <span className="text-zinc-300 text-right font-mono text-[10px]">
                    {formatNumber(cam.stats?.last_ts_ms)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Video wall (60%) */}
        <div className="flex-1 grid grid-rows-[3.5fr_1fr] grid-cols-2 gap-2">
          {/* Main camera (spans both columns) */}
          <div className="col-span-2 relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
            <div className="absolute left-3 top-3 z-10 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-sm font-medium">
              {slots.main || 'main'}
            </div>
            <div className="absolute right-3 top-3 z-10 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-zinc-300">
              click a small view to swap
            </div>
            {slots.main ? (
              <img
                src={getMjpegUrl(slots.main)}
                alt={slots.main}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                No camera selected
              </div>
            )}
          </div>

          {/* Thumbnail 1 */}
          <div
            className="relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors"
            onClick={() => swapMainWith('t1')}
          >
            <div className="absolute left-2 top-2 z-10 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium">
              {slots.t1 || 'cam2'}
            </div>
            {slots.t1 ? (
              <img
                src={getMjpegUrl(slots.t1)}
                alt={slots.t1}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                No camera
              </div>
            )}
          </div>

          {/* Thumbnail 2 */}
          <div
            className="relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors"
            onClick={() => swapMainWith('t2')}
          >
            <div className="absolute left-2 top-2 z-10 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium">
              {slots.t2 || 'cam3'}
            </div>
            {slots.t2 ? (
              <img
                src={getMjpegUrl(slots.t2)}
                alt={slots.t2}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                No camera
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

