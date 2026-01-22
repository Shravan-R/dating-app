const user1 = localStorage.getItem("userId");

if (!user1) {
  window.location.href = "index.html";
}

const user2 = new URLSearchParams(window.location.search).get("user");

if (!user2) {
  window.location.href = "matches.html";
}

const statusText = document.getElementById("status");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("sendBtn");
let isMatched = false;
let lastMessageId = null;
let messageInterval = null;
let isLoadingMessages = false;
let eventSource = null;

// Load user info
fetch(`${API_URL}/users/${user2}`)
  .then(res => res.json())
  .then(user => {
    document.getElementById("chatUserName").textContent = user.name || "Chat";
  })
  .catch(error => {
    console.error("Error loading user:", error);
  });

// Check match status
fetch(`${API_URL}/isMatched/${user1}/${user2}`)
  .then(res => res.json())
  .then(data => {
    isMatched = data.matched;
    
    if (!isMatched) {
      statusText.innerHTML = '<i class="fas fa-times-circle"></i> Not matched yet. You need to match before chatting.';
      statusText.className = "alert alert-warning text-center mb-3";
      statusText.style.cssText = "background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; color: #ffc107; border-radius: 10px;";
      msgInput.disabled = true;
      sendBtn.disabled = true;
      sendBtn.style.opacity = "0.5";
    } else {
      statusText.innerHTML = '<i class="fas fa-check-circle"></i> You are matched!';
      statusText.className = "alert alert-success text-center mb-3";
      statusText.style.cssText = "background: rgba(74, 222, 128, 0.1); border: 1px solid #4ade80; color: #4ade80; border-radius: 10px;";
      loadMessages(true); // Initial load
      startSSE(); // Start real-time updates
    }
  })
  .catch(error => {
    console.error("Error checking match:", error);
    statusText.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error loading chat.';
    statusText.className = "alert alert-danger text-center mb-3";
  });

function loadMessages(initialLoad = false) {
  if (isLoadingMessages && !initialLoad) return;
  isLoadingMessages = true;

  const url = initialLoad
    ? `${API_URL}/messages/${user1}/${user2}`
    : `${API_URL}/messages/${user1}/${user2}?since=${lastMessageId || ''}`;

  fetch(url)
    .then(res => res.json())
    .then(msgs => {
      const box = document.getElementById("chatBox");

      if (initialLoad) {
        box.innerHTML = "";
      }

      if (msgs.length === 0 && initialLoad) {
        box.innerHTML = `
          <div class="text-center text-muted p-5">
            <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
            <p>No messages yet. Start the conversation!</p>
          </div>
        `;
        isLoadingMessages = false;
        return;
      }

      msgs.forEach(m => {
        const isSent = m.sender == user1;
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${isSent ? "sent" : "received"}`;

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = m.message;

        // Add timestamp
        const timestamp = document.createElement("div");
        timestamp.className = "message-timestamp";
        const messageTime = new Date(m.created_at);
        const now = new Date();
        const diffMs = now - messageTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeString;
        if (diffMins < 1) {
          timeString = "now";
        } else if (diffMins < 60) {
          timeString = `${diffMins}m`;
        } else if (diffHours < 24) {
          timeString = `${diffHours}h`;
        } else if (diffDays < 7) {
          timeString = `${diffDays}d`;
        } else {
          timeString = messageTime.toLocaleDateString();
        }
        timestamp.textContent = timeString;

        messageDiv.appendChild(bubble);
        messageDiv.appendChild(timestamp);
        box.appendChild(messageDiv);

        // Update last message ID
        if (m.id > (lastMessageId || 0)) {
          lastMessageId = m.id;
        }
      });

      // Scroll to bottom only for initial load or if user is near bottom
      if (initialLoad || box.scrollHeight - box.scrollTop - box.clientHeight < 100) {
        box.scrollTop = box.scrollHeight;
      }

      isLoadingMessages = false;
    })
    .catch(error => {
      console.error("Error loading messages:", error);
      isLoadingMessages = false;
    });
}

function sendMessage() {
  if (!msgInput.value.trim() || !isMatched) return;

  const message = msgInput.value.trim();
  const originalValue = msgInput.value;
  msgInput.value = "";
  msgInput.disabled = true;
  sendBtn.disabled = true;

  // Optimistic update - add message immediately
  const tempMessageId = Date.now(); // temporary ID
  addMessageToUI({
    id: tempMessageId,
    sender: user1,
    receiver: user2,
    message: message,
    created_at: new Date().toISOString(),
    isOptimistic: true
  });

  fetch(`${API_URL}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: user1,
      receiver: user2,
      message: message
    })
  })
    .then(res => res.json())
    .then(data => {
      msgInput.disabled = false;
      sendBtn.disabled = false;

      // Remove optimistic message - SSE will handle adding the real message
      setTimeout(() => removeOptimisticMessage(tempMessageId), 100);
      if (data.messageId) {
        lastMessageId = data.messageId;
      }
    })
    .catch(error => {
      console.error("Error sending message:", error);
      msgInput.disabled = false;
      sendBtn.disabled = false;
      msgInput.value = originalValue;

      // Remove failed optimistic message
      removeOptimisticMessage(tempMessageId);
      alert("Failed to send message. Please try again.");
    });
}

function addMessageToUI(message) {
  const box = document.getElementById("chatBox");
  const isSent = message.sender == user1;
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isSent ? "sent" : "received"}`;
  if (message.isOptimistic) {
    messageDiv.classList.add("optimistic");
    messageDiv.dataset.tempId = message.id;
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = message.message;

  // Add timestamp
  const timestamp = document.createElement("div");
  timestamp.className = "message-timestamp";
  timestamp.textContent = "now";

  messageDiv.appendChild(bubble);
  messageDiv.appendChild(timestamp);
  box.appendChild(messageDiv);

  // Scroll to bottom
  box.scrollTop = box.scrollHeight;
}

function removeOptimisticMessage(tempId) {
  const optimisticMessage = document.querySelector(`[data-temp-id="${tempId}"]`);
  if (optimisticMessage) {
    optimisticMessage.remove();
  }
}

function startSSE() {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource(`${API_URL}/messages/stream/${user1}/${user2}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'new_message') {
      // Only add if it's not from current user (to avoid duplicate from optimistic update)
      if (data.message.sender != user1) {
        addMessageToUI(data.message);
        lastMessageId = data.message.id;
      }
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    // Fallback to polling if SSE fails
    if (!messageInterval) {
      messageInterval = setInterval(() => loadMessages(false), 3000);
    }
  };

  // Fallback polling for safety (less frequent)
  messageInterval = setInterval(() => loadMessages(false), 10000);
}

function stopSSE() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  stopSSE();
});
