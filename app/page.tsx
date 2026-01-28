import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">CV Theft Detection</h1>
          <p className="text-zinc-400">Multi-camera real-time monitoring system</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-12">
          <Link
            href="/cameras"
            className="block p-6 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">📹 Camera Wall</h2>
            <p className="text-sm text-zinc-400">
              Live video feeds with statistics and click-to-swap layout
            </p>
          </Link>

          <Link
            href="/events"
            className="block p-6 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">⚡ Event Stream</h2>
            <p className="text-sm text-zinc-400">
              Real-time theft detection events and alerts
            </p>
          </Link>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <h3 className="text-sm font-semibold mb-2">System Status</h3>
          <div className="text-xs text-zinc-400 space-y-1">
            <div>Backend: <code className="text-zinc-300">{process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'}</code></div>
            <div>Stack: RT-DETR • ByteTrack • OSNet • FastAPI • Next.js</div>
          </div>
        </div>
      </div>
    </div>
  );
}
