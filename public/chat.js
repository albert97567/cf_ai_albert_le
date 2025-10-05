/**
 * LLM Chat App Frontend
 *
 * Handles the chat UI interactions and communication with the backend API.
 */

// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const voiceButton = document.getElementById("voice-button");
const clearButton = document.getElementById("clear-button");
const typingIndicator = document.getElementById("typing-indicator");

// Chat state
let chatHistory = [
  {
    role: "assistant",
    content:
      "Hey! I'm Voice Pal, your AI voice assistant. Click the microphone to start talking, or type a message below!",
  },
];
let isProcessing = false;
let sessionId = null;

// Voice recording state
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recognition = null;
let recognizedText = "";

// Load speech synthesis voices
if ('speechSynthesis' in window) {
  // Load voices (needed for some browsers)
  speechSynthesis.getVoices();
  // Some browsers need this event
  speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}

// Initialize Web Speech Recognition for real-time transcription
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    recognizedText += finalTranscript;
    userInput.value = recognizedText + interimTranscript;
    userInput.style.height = "auto";
    userInput.style.height = userInput.scrollHeight + "px";
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };
}

// Initialize session on page load
async function initializeSession() {
  // Check if we have a session ID in localStorage
  sessionId = localStorage.getItem('voicepal_session_id');

  if (!sessionId) {
    // Create new session
    const response = await fetch('/api/session', { method: 'POST' });
    const data = await response.json();
    sessionId = data.sessionId;
    localStorage.setItem('voicepal_session_id', sessionId);
  } else {
    // Load existing conversation history
    const response = await fetch(`/api/session?id=${sessionId}`);
    const data = await response.json();

    if (data.messages && data.messages.length > 0) {
      chatHistory = data.messages;

      // Display conversation history
      chatMessages.innerHTML = '';
      chatHistory.forEach(msg => {
        if (msg.role !== 'system') {
          addMessageToChat(msg.role, msg.content);
        }
      });
    }
  }
}

// Initialize session when page loads
initializeSession();

// Auto-resize textarea as user types
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// Send message on Enter (without Shift)
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Send button click handler
sendButton.addEventListener("click", sendMessage);

// Voice button click handler
voiceButton.addEventListener("click", toggleVoiceRecording);

// Clear button click handler
clearButton.addEventListener("click", clearConversation);

/**
 * Sends a message to the chat API and processes the response
 */
async function sendMessage() {
  const message = userInput.value.trim();

  // Don't send empty messages
  if (message === "" || isProcessing) return;

  // Disable input while processing
  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  // Add user message to chat
  addMessageToChat("user", message);

  // Add message to history
  chatHistory.push({ role: "user", content: message });

  // Clear input immediately
  userInput.value = "";
  userInput.style.height = "auto";

  // Show typing indicator
  typingIndicator.classList.add("visible");

  try {
    // Create new assistant response element
    const assistantMessageEl = document.createElement("div");
    assistantMessageEl.className = "message assistant-message";
    assistantMessageEl.innerHTML = "<p></p>";
    chatMessages.appendChild(assistantMessageEl);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Send request to API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory,
        sessionId: sessionId,
      }),
    });

    // Handle errors
    if (!response.ok) {
      throw new Error("Failed to get response");
    }

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode chunk
      const chunk = decoder.decode(value, { stream: true });

      // Process SSE format
      const lines = chunk.split("\n");
      for (const line of lines) {
        try {
          const jsonData = JSON.parse(line);
          if (jsonData.response) {
            // Append new content to existing text
            responseText += jsonData.response;
            assistantMessageEl.querySelector("p").textContent = responseText;

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }
    }

    // Add completed response to chat history
    chatHistory.push({ role: "assistant", content: responseText });
  } catch (error) {
    console.error("Error:", error);
    addMessageToChat(
      "assistant",
      "Sorry, there was an error processing your request.",
    );
  } finally {
    // Hide typing indicator
    typingIndicator.classList.remove("visible");

    // Re-enable input
    isProcessing = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

/**
 * Helper function to add message to chat
 */
function addMessageToChat(role, content) {
  const messageEl = document.createElement("div");
  messageEl.className = `message ${role}-message`;
  messageEl.innerHTML = `<p>${content}</p>`;
  chatMessages.appendChild(messageEl);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Toggle voice recording on/off
 */
async function toggleVoiceRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
}

/**
 * Start recording audio from microphone
 */
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Start real-time speech recognition
    recognizedText = '';
    if (recognition) {
      recognition.start();
      userInput.classList.add('listening');
      userInput.value = '';
      userInput.placeholder = 'Listening...';
    }

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

      // Stop recognition
      if (recognition) {
        recognition.stop();
        userInput.classList.remove('listening');
        userInput.placeholder = 'Type your message here...';
      }

      await processVoiceInput(audioBlob);

      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    isRecording = true;
    voiceButton.classList.add("recording");
    voiceButton.title = "Click to stop recording";
  } catch (error) {
    console.error("Error accessing microphone:", error);
    alert("Could not access microphone. Please check permissions.");
  }
}

/**
 * Stop recording audio
 */
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    // Stop recognition first to finalize text
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        // Already stopped
      }
      userInput.classList.remove('listening');
      userInput.placeholder = 'Type your message here...';
    }

    mediaRecorder.stop();
    isRecording = false;
    voiceButton.classList.remove("recording");
    voiceButton.title = "Click to speak";
  }
}

/**
 * Process voice input: STT -> LLM -> TTS
 */
async function processVoiceInput(audioBlob) {
  if (isProcessing) return;

  isProcessing = true;
  voiceButton.disabled = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  // Get the transcribed text from the textbox preview
  const transcribedText = userInput.value.trim();

  // Clear the textbox preview
  userInput.value = "";
  userInput.style.height = "auto";

  typingIndicator.classList.add("visible");

  try {
    // Use the recognized text if available, otherwise fallback to STT API
    let text = transcribedText;

    if (!text) {
      // Step 1: Speech-to-Text (fallback if recognition didn't work)
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const sttResponse = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!sttResponse.ok) {
        throw new Error("Speech-to-text failed");
      }

      const sttData = await sttResponse.json();
      text = sttData.text;
    }

    if (!text || text.trim() === "") {
      throw new Error("No speech detected");
    }

    // Add user message to chat
    addMessageToChat("user", text);
    chatHistory.push({ role: "user", content: text });

    // Step 2: Get LLM response
    const chatResponse = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory,
        sessionId: sessionId,
      }),
    });

    if (!chatResponse.ok) {
      throw new Error("Failed to get LLM response");
    }

    // Process streaming response
    const reader = chatResponse.body.getReader();
    const decoder = new TextDecoder();
    let responseText = "";

    const assistantMessageEl = document.createElement("div");
    assistantMessageEl.className = "message assistant-message";
    assistantMessageEl.innerHTML = "<p></p>";
    chatMessages.appendChild(assistantMessageEl);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        try {
          const jsonData = JSON.parse(line);
          if (jsonData.response) {
            responseText += jsonData.response;
            assistantMessageEl.querySelector("p").textContent = responseText;
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        } catch (e) {
          // Ignore parsing errors for incomplete chunks
        }
      }
    }

    chatHistory.push({ role: "assistant", content: responseText });

    // Step 3: Text-to-Speech using Web Speech API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(responseText);

      // TikTok-style voice settings (deeper, more animated)
      utterance.rate = 1.1;  // Slightly faster, more energetic
      utterance.pitch = 0.8; // Lower pitch for deeper male voice
      utterance.volume = 1.0;

      // Find best male voice (similar to TikTok Adam/Daniel)
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice =>
        voice.lang.startsWith('en') &&
        (voice.name.includes('Male') ||
         voice.name.includes('Daniel') ||
         voice.name.includes('Aaron') ||
         voice.name.includes('Google US English') && !voice.name.includes('Female'))
      ) || voices.find(voice =>
        voice.lang.startsWith('en-US') && !voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => voice.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      speechSynthesis.speak(utterance);
    }

  } catch (error) {
    console.error("Error processing voice:", error);
    addMessageToChat(
      "assistant",
      "Sorry, there was an error processing your voice input."
    );
  } finally {
    typingIndicator.classList.remove("visible");
    isProcessing = false;
    voiceButton.disabled = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

/**
 * Clear conversation history
 */
async function clearConversation() {
  if (!confirm("Are you sure you want to clear the conversation history?")) {
    return;
  }

  try {
    // Clear the UI
    chatMessages.innerHTML = '<div class="message assistant-message"><p>Hey! I\'m Voice Pal, your AI voice assistant. Click the microphone to start talking, or type a message below!</p></div>';

    // Reset chat history
    chatHistory = [
      {
        role: "assistant",
        content: "Hey! I'm Voice Pal, your AI voice assistant. Click the microphone to start talking, or type a message below!",
      },
    ];

    // Clear the conversation in Durable Object
    if (sessionId) {
      await fetch(`/api/session?id=${sessionId}`, {
        method: 'DELETE'
      });
    }

    // Create a new session
    const response = await fetch('/api/session', { method: 'POST' });
    const data = await response.json();
    sessionId = data.sessionId;
    localStorage.setItem('voicepal_session_id', sessionId);

  } catch (error) {
    console.error("Error clearing conversation:", error);
    alert("Failed to clear conversation. Please try again.");
  }
}
