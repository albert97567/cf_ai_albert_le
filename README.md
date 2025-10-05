# 🎧 Voice Pal - AI Voice Assistant

A voice-powered AI chatbot I built for my Cloudflare AI assignment. Talk to it like a real assistant - it listens, responds, and actually remembers your conversation.

**🚀 Live Demo:** https://cfai.lealbert68172.workers.dev

## What It Does

Voice Pal is basically an AI you can talk to. It uses speech recognition to hear what you're saying, processes it with a powerful language model, and speaks the response back to you. Plus, it saves your entire conversation so you can pick up right where you left off.

**Key Features:**
- 🎤 **Voice Input**: Click the mic, talk, and it transcribes in real-time
- 🤖 **Smart AI Responses**: Powered by Llama 3.3 70B (one of Cloudflare's best models)
- 🔊 **Voice Output**: Speaks responses back to you with a TikTok-style voice
- 💬 **Text Chat**: Type if you don't want to use voice
- 💾 **Conversation Memory**: Remembers everything - even after you reload the page
- 🧹 **Clear History**: Red button to wipe the conversation and start fresh
- ⚡ **Real-time Streaming**: See responses appear word-by-word as the AI thinks

## How I Built It

This was for my Cloudflare assignment, and I had to hit four requirements:

1. ✅ **LLM**: Using Llama 3.3 70B (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`)
2. ✅ **Workflow/Coordination**: Durable Objects manage the conversation flow and state
3. ✅ **User Input**: Voice (Web Speech API) + text chat interface
4. ✅ **Memory/State**: Durable Objects store conversation history persistently

### Tech Stack
- **Backend**: Cloudflare Workers + Durable Objects
- **AI Models**:
  - Llama 3.3 70B for chat
  - Whisper for speech-to-text
- **Frontend**: Vanilla JS with Web Speech API
- **State**: Durable Objects (basically persistent mini-databases)

## Getting Started

### Prerequisites
- Node.js (v18+)
- Cloudflare account with Workers AI access
- Wrangler CLI (`npm install -g wrangler`)

### Installation

1. Clone this repo:
   ```bash
   git clone https://github.com/albert97567/cf_ai_albert_le.git
   cd cfai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run locally:
   ```bash
   npm run dev
   ```
   Open http://localhost:8787

4. Deploy to Cloudflare:
   ```bash
   npm run deploy
   ```

**Note**: Workers AI costs money even in dev mode, so watch your usage.

## How It Works

### The Flow
1. You click the mic and speak
2. Browser's Web Speech API transcribes your voice in real-time (you see it typing!)
3. Your text gets sent to the Worker
4. Worker saves your message to a Durable Object
5. Llama 3.3 generates a response (streaming!)
6. Worker saves the AI's response to the Durable Object
7. Browser speaks the response out loud

### Session Persistence
Each browser gets a unique session ID saved in localStorage. This maps to a specific Durable Object that stores all your messages. Reload the page? Your conversation is still there. Open incognito? Fresh start with a new session.

### API Endpoints
- `POST /api/chat` - Send a message, get AI response (streaming)
- `POST /api/speech-to-text` - Convert audio to text (Whisper)
- `POST /api/session` - Create new conversation session
- `GET /api/session?id={id}` - Get conversation history
- `DELETE /api/session?id={id}` - Clear conversation

## Project Structure

```
/
├── public/
│   ├── index.html      # UI with voice controls
│   └── chat.js         # Frontend logic (voice, chat, sessions)
├── src/
│   ├── index.ts        # Main Worker with API routes
│   ├── conversation.ts # Durable Object for message storage
│   └── types.ts        # TypeScript types
├── wrangler.jsonc      # Cloudflare config
└── package.json
```

## Usage

### Voice Mode (Recommended)
1. Click the green 🎤 microphone button
2. Allow mic permissions
3. Start talking (you'll see your words appear as you speak)
4. Click the mic again to stop
5. AI responds with voice + text

### Text Mode
Just type in the box and hit Send or press Enter.

### Clear Conversation
Hit the red "Clear" button to wipe history and start fresh. It'll ask for confirmation first.

## Customization

### Change AI Personality
Edit `SYSTEM_PROMPT` in `src/index.ts`:
```typescript
const SYSTEM_PROMPT = "You are Voice Pal, a friendly AI voice assistant...";
```

### Switch LLM Model
Change `LLM_MODEL_ID` in `src/index.ts` to any [Workers AI model](https://developers.cloudflare.com/workers-ai/models/).

### Adjust Voice Settings
In `public/chat.js`, tweak the TTS settings:
```javascript
utterance.rate = 1.1;  // Speed
utterance.pitch = 0.8; // Pitch (lower = deeper)
```

## Troubleshooting

**Mic not working?**
- Make sure you're on HTTPS or localhost
- Check browser mic permissions
- Use Chrome/Edge for best results

**Voice not playing?**
- Check your volume
- Refresh to reload browser voices
- Some browsers need you to interact with the page first

**Session not saving?**
- Check localStorage isn't disabled
- Make sure Durable Objects are deployed

**Dev server issues?**
- Use `npm run dev` instead of `wrangler dev` (fixes Windows watch issues)
- Ctrl+C and restart if stuck

## Browser Compatibility

Works best on:
- Chrome/Edge (recommended)
- Firefox
- Safari 14.1+

Requires HTTPS for microphone access (localhost works too).

## Resources

- [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Assignment Requirements](https://developers.cloudflare.com/agents/)

## License

MIT - feel free to use this for your own projects!

---

Built for my Cloudflare AI assignment by Albert 🚀
