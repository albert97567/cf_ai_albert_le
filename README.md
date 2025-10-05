# 🎧 Voice Pal - AI Voice Assistant

An AI-powered voice assistant built on Cloudflare infrastructure that enables real-time voice conversations.

## Features

- 🎤 **Voice Input**: Click-to-record voice messages using browser's MediaRecorder API
- 🗣️ **Speech-to-Text**: Powered by Workers AI Whisper model
- 🤖 **LLM Processing**: Uses Llama 3.3 70B for conversational AI responses
- 🔊 **Text-to-Speech**: Browser's Web Speech API for natural voice responses
- 💬 **Text Chat**: Traditional text-based chat interface as fallback
- ⚡ **Real-time Streaming**: Server-Sent Events for streaming LLM responses
- 📱 **Responsive UI**: Clean, modern interface optimized for voice interactions
- 🔄 **Conversation Memory**: Maintains chat history throughout the session

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Cloudflare account with Workers AI access

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/cloudflare/templates.git
   cd templates/llm-chat-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Generate Worker type definitions:
   ```bash
   npm run cf-typegen
   ```

### Development

Start a local development server:

```bash
npm run dev
```

This will start a local server at http://localhost:8787.

Note: Using Workers AI accesses your Cloudflare account even during local development, which will incur usage charges.

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

### Monitor

View real-time logs associated with any deployed Worker:

```bash
npm wrangler tail
```

## Project Structure

```
/
├── public/             # Static assets
│   ├── index.html      # Chat UI HTML
│   └── chat.js         # Chat UI frontend script
├── src/
│   ├── index.ts        # Main Worker entry point
│   ├── conversation.ts # Durable Object for state management
│   └── types.ts        # TypeScript type definitions
├── test/               # Test files
├── wrangler.jsonc      # Cloudflare Worker configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This documentation
```

## How It Works

### Voice Conversation Flow

1. **User speaks** → Browser captures audio via MediaRecorder API
2. **Audio → Text** → Workers AI Whisper model converts speech to text
3. **Text → LLM** → Llama 3.3 generates conversational response (streaming)
4. **LLM → Speech** → Web Speech API speaks the response aloud

### Backend (Cloudflare Workers + Durable Objects)

- **`POST /api/chat`**: LLM chat completion with streaming responses
- **`POST /api/speech-to-text`**: Audio transcription using Workers AI Whisper
- **`POST /api/session`**: Create new conversation session
- **`GET /api/session?id={sessionId}`**: Retrieve conversation history
- **Durable Objects**: Persistent conversation state storage
- **Workers AI Binding**: Connects to Cloudflare's AI service
- **AI Models**:
  - LLM: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
  - STT: `@cf/openai/whisper`

### Frontend

- **Voice Recording**: MediaRecorder API captures microphone input
- **Speech-to-Text**: Sends audio to Workers AI for transcription
- **LLM Chat**: Streaming responses displayed in real-time
- **Text-to-Speech**: Browser's Web Speech API for voice output
- **Chat History**: Maintains conversation context

## Usage

### Voice Mode (Primary Interaction)

1. Click the green microphone button 🎤
2. Grant microphone permissions when prompted
3. Speak your message
4. Click the microphone again to stop recording (turns red while recording)
5. Voice Pal will:
   - Transcribe your speech
   - Generate an AI response
   - Speak the response back to you

### Text Mode (Fallback)

- Type your message in the text box
- Press Enter or click "Send"
- Receive text responses (no voice output)

## Browser Compatibility

- **Microphone Access**: Requires HTTPS (or localhost for dev)
- **MediaRecorder API**: Chrome, Firefox, Edge, Safari 14.1+
- **Web Speech API**: Most modern browsers
- **Recommended**: Chrome/Edge for best voice quality

## Customization

### Changing the LLM Model

Update `LLM_MODEL_ID` in `src/index.ts`. Available models: [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/).

### Modifying Voice Assistant Personality

Change `SYSTEM_PROMPT` in `src/index.ts`:
```typescript
const SYSTEM_PROMPT = "You are Voice Pal, a friendly AI voice assistant...";
```

### Styling

Modify CSS variables in `public/index.html`:
```css
:root {
  --primary-color: #f6821f;
  --primary-hover: #e67e22;
  /* ... */
}
```

### Using AI Gateway

Uncomment gateway configuration in `src/index.ts` for caching, rate limiting, and analytics.

## Assignment Requirements ✅

This project fulfills **ALL** requirements for the Cloudflare AI assignment:

- ✅ **LLM**: Llama 3.3 70B (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) on Workers AI
- ✅ **Workflow/Coordination**: Cloudflare Workers + **Durable Objects** orchestrate STT → LLM → TTS pipeline
- ✅ **User Input**: Voice (microphone via MediaRecorder API) + text chat interface
- ✅ **Memory/State**: **Durable Objects** provide persistent conversation storage across sessions

## Troubleshooting

### Microphone not working
- Ensure you're on HTTPS (or localhost)
- Check browser permissions for microphone access
- Try a different browser (Chrome/Edge recommended)

### Voice not playing
- Check browser volume settings
- Ensure Web Speech API is supported in your browser
- Try refreshing the page to reload voices

### Wrangler dev stuck on reload
- Stop with Ctrl+C and restart
- Use `npm run dev` (includes `--legacy-watch` flag for Windows)

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
