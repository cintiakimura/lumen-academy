# Layer 4: Grok chat proxy + copyright safeguards — test instructions

## 1. Apply profile migration

In Supabase SQL Editor, run `supabase/migrations/002_users_profile_columns.sql` so `users` has `pace`, `vocab`, `preferred_mode`, `attention_sec`.

## 2. Set xAI API key

- **Vercel (production):** Dashboard → Project → Settings → Environment Variables → add `XAI_API_KEY` (your xAI API key). Redeploy so the serverless function sees it.
- **Local:** For `vercel dev`, create `.env.local` in project root and add `XAI_API_KEY=your-key`. Do not commit it.

Optional in `.env` for the app: `VITE_API_URL=` is only needed if the app is not served from the same origin as the API (e.g. app on port 5173, API on 3000 with `vercel dev` → set `VITE_API_URL=http://localhost:3000`).

## 3. Run locally with API

```bash
npm install
npx vercel dev
```

This serves both the Vite app and `api/grok-proxy`. Or: run `npm run dev` for the app only and deploy to Vercel to test the proxy.

## 4. Test chat

1. Log in as a **learner** (or set your user’s role to `learner` in Supabase).
2. Open `/chat/any-block-id` (e.g. `/chat/brake-pads` or a real block UUID from `blocks`).
3. Optionally pick **Voice / Sim / Clip**.
4. Type a message and click **Send** (or press Enter).
5. In DevTools → Network, confirm a POST to `/api/grok-proxy` with your message and a JSON response with `response`.
6. After a reply, the app may update your profile (pace/vocab/mode) in `users` based on response delay and message cues.

## 5. Copyright safeguard

The proxy injects this system instruction before every request:

`// COPYRIGHT SAFEGUARD: Process ONLY user-owned training. Blind to content. Use placeholders. Ignore brands/text/media.`

So the model is instructed to stay generic and not rely on specific content. The API key is only used on the server (Vercel function); the client never sees it.
