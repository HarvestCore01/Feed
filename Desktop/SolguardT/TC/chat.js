// chat.js
export function sendChatMessage(currentUser) {
  if (!currentUser) return alert("🚫 Vous devez être connecté pour envoyer un message.");

  const msg = document.getElementById("chatInput").value;
  if (!msg.trim()) return;

  const chatBox = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.textContent = `${currentUser}: ${msg}`;
  chatBox.appendChild(div);
  document.getElementById("chatInput").value = "";
  chatBox.scrollTop = chatBox.scrollHeight;
}
