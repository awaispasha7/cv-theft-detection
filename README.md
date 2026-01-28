# CV Theft Detection - Frontend

Next.js dashboard for the multi-camera theft detection system.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the backend URL:**
   Create `.env.local` from the example:
   ```bash
   copy .env.local.example .env.local
   ```
   
   Edit `.env.local` if your backend runs on a different host/port:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```
   
   Frontend will run at: http://localhost:3000

## Pages

- **`/`** - Home page with navigation
- **`/cameras`** - Live camera wall (40% stats, 60% video with main+thumb layout)
- **`/events`** - Real-time event stream viewer (SSE)

## Backend Connection

The frontend talks to the FastAPI backend via:
- `/cameras/status` - Camera stats (polled every 1s)
- `/cameras/{camera_id}/mjpeg` - MJPEG video streams
- `/events/stream` - Server-Sent Events for real-time alerts

Make sure the FastAPI backend is running before using the frontend:
```bash
cd ../backend
uvicorn services.api.main:app --reload
```

## Deployment

For production:
```bash
npm run build
npm run start
```

Deploy to Vercel (or any Node.js host). Remember to:
- Set `NEXT_PUBLIC_API_BASE_URL` as an environment variable
- Ensure the backend is accessible from the deployed frontend (VPN/Tailscale recommended for remote access)
