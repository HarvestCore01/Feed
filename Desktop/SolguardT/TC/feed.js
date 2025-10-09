const socket = new WebSocket("ws://localhost:8080"); // ➜ change plus tard par ton domaine Cloud Run

const log = document.getElementById("chat-log");
const input = document.getElementById("message");
const sendBtn = document.getElementById("send");

function appendMessage(user, text) {
  const msgEl = document.createElement("div");
  msgEl.className = "message new";
  msgEl.innerHTML = `<strong>${user} :</strong> ${text}`;
  log.appendChild(msgEl);
  log.scrollTop = log.scrollHeight;
}

socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === "message") {
    appendMessage(msg.data.user, msg.data.text);
  }
};

sendBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) return;
  const user = localStorage.getItem("username") || "User";
  socket.send(JSON.stringify({ type: "new_message", user, text }));
  input.value = "";
});
