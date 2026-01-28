'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getEventStreamUrl } from '@/lib/api';

interface EventMessage {
  seq?: number;
  ts_ms?: number;
  camera_id?: string;
  type?: string;
  subject_id?: string;
  payload?: Record<string, unknown>;
  msg?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventMessage[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [mixedContentWarning, setMixedContentWarning] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

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

    const url = getEventStreamUrl();
    const es = new EventSource(url);

    es.onopen = () => {
      setStatus('connected');
    };

    es.onerror = () => {
      setStatus('error');
    };

    es.onmessage = (evt) => {
      try {
        const data: EventMessage = JSON.parse(evt.data);
        setEvents((prev) => [...prev, data].slice(-500)); // keep last 500
      } catch (err) {
        console.error('Failed to parse event:', err);
      }
    };

    return () => {
      es.close();
    };
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  const statusColors = {
    connecting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    connected: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const statusText = {
    connecting: 'Connecting...',
    connected: 'Connected',
    error: 'Disconnected / error',
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-zinc-100 transition-colors">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">Event Stream</h1>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusColors[status]}`}
          >
            {statusText[status]}
          </div>
          <Link 
            href="/cameras"
            className="text-sm px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Cameras →
          </Link>
        </div>
      </header>

      {/* Event log */}
      <div className="flex-1 overflow-hidden p-6">
        {mixedContentWarning && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            Your dashboard is loaded over <b>HTTPS</b>, but the API is <b>HTTP</b> (<code>{API_BASE_URL}</code>).
            Browsers block this (mixed content). Use a Tailscale HTTPS URL and update Vercel
            <code className="mx-1">NEXT_PUBLIC_API_BASE_URL</code>.
          </div>
        )}
        <div
          ref={logRef}
          className="h-full overflow-auto bg-zinc-900 rounded-xl border border-zinc-800 p-4 font-mono text-sm"
        >
          {events.length === 0 && (
            <div className="text-zinc-500 text-center py-8">
              {status === 'connected' ? 'Waiting for events...' : 'Connecting to event stream...'}
            </div>
          )}

          {events.map((evt, idx) => {
            // Info message (like "connected")
            if (evt.msg) {
              return (
                <div key={idx} className="text-zinc-500 py-1">
                  [info] {evt.msg}
                </div>
              );
            }

            // Actual event
            return (
              <div key={idx} className="py-2 border-b border-zinc-800/50 last:border-0">
                <div className="flex items-start gap-3">
                  <span className="text-zinc-600 shrink-0">#{evt.seq}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          evt.type === 'theft_risk'
                            ? 'bg-red-500/20 text-red-400'
                            : evt.type === 'pick'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : evt.type === 'return'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {evt.type}
                      </span>
                      <span className="text-zinc-500 text-xs">
                        {evt.camera_id}
                      </span>
                      {evt.subject_id && (
                        <span className="text-zinc-500 text-xs">
                          person:{evt.subject_id}
                        </span>
                      )}
                      <span className="text-zinc-600 text-xs ml-auto">
                        {evt.ts_ms ? new Date(evt.ts_ms).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    {evt.payload && Object.keys(evt.payload).length > 0 && (
                      <div className="text-xs text-zinc-400 mt-1">
                        {JSON.stringify(evt.payload)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

