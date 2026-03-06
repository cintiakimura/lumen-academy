# Layer 7: Voice input + session pause/resume — test steps

## 1. Run migration

In Supabase SQL Editor, run `supabase/migrations/005_chat_sessions.sql` to create `chat_sessions` (user_id, block_id, messages, last_turn_at, mastery) and RLS (learner full access to own rows).

## 2. Voice input

- Open **/chat/:blockId** as a **learner** (Chrome or Edge; Safari has limited support).
- **Browser check:** If the browser doesn’t support the Web Speech API, clicking the voice button (🎙️) shows a toast: "Voice input is not supported in this browser."
- **Use voice:** Click 🎙️ → allow microphone if prompted. Button shows ⏹ (stop) and pulses (red tint) while listening.
- **Interim:** While you speak, the input field shows partial transcript. When you stop, final text stays in the input (or is sent if confidence is high).
- **Send:** If the final result has confidence ≥ 0.85, the message is sent automatically. Otherwise it’s left in the input so you can edit and press Send.
- **Stop:** Click ⏹ or wait ~5s silence → listening stops; toast: "Listening stopped after 5s silence."
- **Errors:** No mic / permission denied → toast "Microphone access denied." No speech → "No speech detected. Try again."

## 3. Pause (save session)

- Have at least one exchange in the chat.
- Click **⏸ (Pause)**. Session is saved to `chat_sessions`: current `messages`, `mastery` flag, `last_turn_at`.
- Toast: "Session saved. Come back anytime."
- Navigate away (e.g. to **Learner dashboard** or another page).

## 4. Resume

- Go back to **/chat/:blockId** (same block).
- On load, the app fetches the session for this user + block. If a row exists:
  - Messages are restored (same order as when you paused).
  - Banner appears: **"Welcome back! Continuing [Block title] from where you left off."**
  - List scrolls to the bottom.
- If you had already reached **mastery** before pausing, the green “Ready for next?” card and Next / Get Certificate buttons show again (derived from restored messages).

## 5. Quick test flow

1. Log in as learner → open a block (e.g. `/chat/<block-uuid>`).
2. Send a few messages (type or voice).
3. Click **⏸** → see "Session saved" toast.
4. Leave the page (e.g. dashboard).
5. Return to the same `/chat/:blockId` URL.
6. Confirm: same messages, "Welcome back! Continuing …" banner, scroll at bottom. If you had mastery, Next/Certificate are visible.

## 6. Technical notes

- **chat_sessions:** One row per (user_id, block_id). Upsert on pause so the latest messages and mastery are stored.
- **useGrok:** Exposes `setMessages` so Chat can hydrate from `chat_sessions.messages` on resume.
- **Voice:** Uses `SpeechRecognition` / `webkitSpeechRecognition`; 5s silence timeout; confidence threshold 0.85 for auto-send.
- **UI:** Voice button pulses when listening; stop icon (⏹) and red styling while active; pause (⏸) saves and shows toast.
