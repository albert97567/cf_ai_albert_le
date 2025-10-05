/**
 * Durable Object for managing conversation state
 * Provides persistent memory across sessions
 */

import { ChatMessage, Env } from "./types";

export interface ConversationState {
  messages: ChatMessage[];
  createdAt: number;
  lastActivity: number;
}

export class Conversation {
  private state: DurableObjectState;
  private messages: ChatMessage[] = [];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Initialize state on first access
    if (this.messages.length === 0) {
      const stored = await this.state.storage.get<ChatMessage[]>("messages");
      this.messages = stored || [];
    }

    // Get conversation history
    if (url.pathname === "/history" && request.method === "GET") {
      return new Response(JSON.stringify({ messages: this.messages }), {
        headers: { "content-type": "application/json" },
      });
    }

    // Add message to conversation
    if (url.pathname === "/message" && request.method === "POST") {
      const { message } = (await request.json()) as { message: ChatMessage };
      this.messages.push(message);

      // Persist to storage
      await this.state.storage.put("messages", this.messages);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    // Clear conversation history
    if (url.pathname === "/clear" && request.method === "POST") {
      this.messages = [];
      await this.state.storage.delete("messages");

      return new Response(JSON.stringify({ success: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}
