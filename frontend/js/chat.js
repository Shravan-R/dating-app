const user1 = localStorage.getItem("userId");
const user2 = new URLSearchParams(window.location.search).get("user");

const statusText = document.getElementById("status");
const msgInput = document.getElementById("msg");

fetch(`http://localhost:3000/api/isMatched/${user1}/${user2}`)
  .then(res => res.json())
  .then(data => {
    if (!data.matched) {
      statusText.innerText = "❌ Not matched yet";
      msgInput.disabled = true;
    } else {
      statusText.innerText = "✅ You are matched";
      loadMessages();
    }
  });

function loadMessages() {
  fetch(`http://localhost:3000/api/messages/${user1}/${user2}`)
    .then(res => res.json())
    .then(msgs => {
      const box = document.getElementById("chatBox");
      box.innerHTML = "";

      msgs.forEach(m => {
        const p = document.createElement("p");
        p.innerText =
          (m.sender == user1 ? "You: " : "Them: ") + m.message;
        box.appendChild(p);
      });
    });
}

function sendMessage() {
  if (!msgInput.value) return;

  fetch("http://localhost:3000/api/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: user1,
      receiver: user2,
      message: msgInput.value
    })
  }).then(() => {
    msgInput.value = "";
    loadMessages();
  });
}
