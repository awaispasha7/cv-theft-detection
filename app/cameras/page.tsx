'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getCameraStatus, getMjpegUrl, type CameraStatus } from '@/lib/api';

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [mixedContentWarning, setMixedContentWarning] = useState(false);
  const [streamNonce, setStreamNonce] = useState(0);
  
  // Camera slots: main, t1, t2
  const [slots, setSlots] = useState<{ main: string; t1: string; t2: string }>({
    main: '',
    t1: '',
    t2: '',
  });

  // Fetch camera status on mount and poll every second
  useEffect(() => {
    // If the dashboard is loaded over https (Vercel), browsers will block http API calls (mixed content).
    try {
      const isHttps = window.location.protocol === 'https:';
      const isHttpApi = API_BASE_URL.startsWith('http://');
      const isLocalApi =
        API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
      if (isHttps && isHttpApi && !isLocalApi) setMixedContentWarning(true);
    } catch {
      // ignore
    }

    const fetchStatus = async () => {
      try {
        const data = await getCameraStatus();
        setCameras(data);
        
        // Initialize slots only once on first successful fetch
        if (!initialized && data.length >= 3) {
          setSlots({
            main: data[0].camera_id,
            t1: data[1].camera_id,
            t2: data[2].camera_id,
          });
          setInitialized(true);
        }
      } catch (err) {
        // Browser fetch() network failures often surface as a generic "Failed to fetch".
        const msg = err instanceof Error ? err.message : 'Failed to fetch cameras';
        setError(msg);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, [initialized]);

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
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-3 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm sm:text-base">
            ← Back
          </Link>
          <h1 className="text-base sm:text-lg font-semibold">Camera Wall</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStreamNonce((n) => n + 1)}
            className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            title="If a stream stalls after sleep/tab suspend, click to restart MJPEG streams."
          >
            Refresh
          </button>
          <Link
            href="/events"
            className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Events →
          </Link>
        </div>
      </header>

      {/* Main content: 40% stats, 60% video (desktop). Stacks on mobile. */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[0.4fr_0.6fr] gap-3 p-3 overflow-hidden min-h-0">
        {/* Stats panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="font-semibold">Camera Statistics</h3>
            <p className="text-xs text-zinc-400 mt-1">Live counters from backend</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              API: <code className="text-zinc-400">{API_BASE_URL}</code>
            </p>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {mixedContentWarning && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                Your dashboard is loaded over <b>HTTPS</b>, but the API is <b>HTTP</b>. Browsers block this (mixed
                content).
                <div className="text-xs text-amber-200/80 mt-2">
                  Fix: expose the backend over HTTPS via Tailscale (recommended) and set Vercel
                  <code className="mx-1">NEXT_PUBLIC_API_BASE_URL</code>
                  to that <b>https://…</b> URL.
                </div>
              </div>
            )}
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

        {/* Video wall */}
        <div className="grid grid-rows-[3.5fr_1fr] grid-cols-2 gap-3 min-h-0">
          {/* Main camera (spans both columns) */}
          <div className="col-span-2 relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 min-h-0">
            <div className="absolute left-2 sm:left-3 top-2 sm:top-3 z-10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs sm:text-sm font-medium">
              {slots.main || 'main'}
            </div>
            <div className="absolute right-2 sm:right-3 top-2 sm:top-3 z-10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] sm:text-xs text-zinc-300">
              click to swap
            </div>
            {slots.main ? (
              <img
                src={getMjpegUrl(slots.main, 10, 75, streamNonce)}
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
            className="relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors min-h-0"
            onClick={() => swapMainWith('t1')}
          >
              <div className="absolute left-2 top-2 z-10 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium">
                {slots.t1 || 'cam2'}
              </div>
              {slots.t1 ? (
                <img
                  src={getMjpegUrl(slots.t1, 10, 75, streamNonce)}
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
            className="relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors min-h-0"
            onClick={() => swapMainWith('t2')}
          >
              <div className="absolute left-2 top-2 z-10 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium">
                {slots.t2 || 'cam3'}
              </div>
              {slots.t2 ? (
                <img
                  src={getMjpegUrl(slots.t2, 10, 75, streamNonce)}
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

