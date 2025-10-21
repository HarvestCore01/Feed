// === navigation.js ===
export function goToDashboard() {
  document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
  document.getElementById('dashboard').classList.remove('hidden');
}
