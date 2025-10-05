/**
 * Voice Pal - AI Voice Assistant
 *
 * A voice-powered chat application using Cloudflare Workers AI with Durable Objects.
 * Features persistent conversation state and real-time voice interactions.
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";
export { Conversation } from "./conversation";

// Model IDs for Workers AI models
// https://developers.cloudflare.com/workers-ai/models/
const LLM_MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const STT_MODEL_ID = "@cf/openai/whisper";
const TTS_MODEL_ID = "@cf/openai/whisper-tiny-en";

// Default system prompt
const SYSTEM_PROMPT =
  "You are Voice Pal, a friendly AI voice assistant. Keep responses concise and conversational, as they will be spoken aloud.";

export default {
  /**
   * Main request handler for the Worker
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle static assets (frontend)
    if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // API Routes
    if (url.pathname === "/api/chat") {
      if (request.method === "POST") {
        return handleChatRequest(request, env, ctx);
      }
      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/api/speech-to-text") {
      if (request.method === "POST") {
        return handleSpeechToText(request, env);
      }
      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/api/text-to-speech") {
      if (request.method === "POST") {
        return handleTextToSpeech(request, env);
      }
      return new Response("Method not allowed", { status: 405 });
    }

    // Session management endpoints
    if (url.pathname === "/api/session") {
      if (request.method === "POST") {
        return handleCreateSession(request, env);
      } else if (request.method === "GET") {
        return handleGetSession(request, env);
      } else if (request.method === "DELETE") {
        return handleDeleteSession(request, env);
      }
      return new Response("Method not allowed", { status: 405 });
    }

    // Handle 404 for unmatched routes
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests with Durable Object state
 */
async function handleChatRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  try {
    // Parse JSON request body
    const { messages = [], sessionId } = (await request.json()) as {
      messages: ChatMessage[];
      sessionId?: string;
    };

    // Store messages in Durable Object if sessionId provided
    if (sessionId) {
      const id = env.CONVERSATION.idFromName(sessionId);
      const stub = env.CONVERSATION.get(id);

      // Store user message
      const userMessage = messages[messages.length - 1];
      if (userMessage) {
        await stub.fetch("http://do/message", {
          method: "POST",
          body: JSON.stringify({ message: userMessage }),
        });
      }
    }

    // Add system prompt if not present
    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT });
    }

    const response = await env.AI.run(
      LLM_MODEL_ID,
      {
        messages,
        max_tokens: 1024,
      },
      {
        returnRawResponse: true,
      }
    );

    // If we have a session, intercept the stream to save assistant response
    if (sessionId && response.ok && response.body) {
      const id = env.CONVERSATION.idFromName(sessionId);
      const stub = env.CONVERSATION.get(id);
      let assistantMessage = "";

      // Create a new readable stream that intercepts and saves
      const reader = response.body.getReader();
      const newStream = new ReadableStream({
        async start(controller) {
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // Try to parse any remaining buffer
                if (buffer.trim()) {
                  try {
                    const json = JSON.parse(buffer);
                    if (json.response) {
                      assistantMessage += json.response;
                    }
                  } catch (e) {
                    // Ignore parse errors on final buffer
                  }
                }

                // Save the complete assistant message after stream ends
                console.log("Stream done. Assistant message:", assistantMessage);
                if (assistantMessage) {
                  try {
                    const saveResponse = await stub.fetch("http://do/message", {
                      method: "POST",
                      body: JSON.stringify({
                        message: { role: "assistant", content: assistantMessage },
                      }),
                    });
                    console.log("Save response status:", saveResponse.status);
                  } catch (err) {
                    console.error("Failed to save message:", err);
                  }
                }
                controller.close();
                break;
              }

              // Accumulate chunks into buffer
              buffer += decoder.decode(value, { stream: true });

              // Try to parse complete JSON from buffer
              try {
                const json = JSON.parse(buffer);
                if (json.response) {
                  assistantMessage += json.response;
                }
                buffer = ""; // Clear buffer after successful parse
              } catch (e) {
                // Not complete JSON yet, keep accumulating
              }

              // Pass the chunk through unchanged
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(newStream, {
        headers: response.headers,
        status: response.status,
      });
    }

    // Return streaming response
    return response;
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

/**
 * Handles speech-to-text conversion
 */
async function handleSpeechToText(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Convert audio to array buffer
    const audioBuffer = await audioFile.arrayBuffer();
    const audioArray = new Uint8Array(audioBuffer);

    // Run Whisper model for speech-to-text
    const response = await env.AI.run(STT_MODEL_ID, {
      audio: [...audioArray],
    });

    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing speech-to-text:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process speech-to-text" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

/**
 * Handles text-to-speech conversion
 */
async function handleTextToSpeech(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const { text } = (await request.json()) as { text: string };

    if (!text) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // For TTS, we'll use a third-party service or browser's built-in TTS
    // Workers AI doesn't currently have native TTS, so we'll return the text
    // and let the browser handle TTS using Web Speech API
    return new Response(JSON.stringify({ text }), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing text-to-speech:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process text-to-speech" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

/**
 * Create a new session
 */
async function handleCreateSession(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const sessionId = crypto.randomUUID();
    return new Response(JSON.stringify({ sessionId }), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create session" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

/**
 * Get session history
 */
async function handleGetSession(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("id");

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID required" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Get conversation from Durable Object
    const id = env.CONVERSATION.idFromName(sessionId);
    const stub = env.CONVERSATION.get(id);
    const response = await stub.fetch("http://do/history");

    return response;
  } catch (error) {
    console.error("Error getting session:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get session" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

/**
 * Delete session (clear conversation)
 */
async function handleDeleteSession(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("id");

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID required" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Clear conversation in Durable Object
    const id = env.CONVERSATION.idFromName(sessionId);
    const stub = env.CONVERSATION.get(id);
    await stub.fetch("http://do/clear", { method: "POST" });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete session" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
