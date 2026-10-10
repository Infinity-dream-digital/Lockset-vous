import { db, firebaseReady } from './firebase-client.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const statusBadge = document.querySelector('.status-badge');
const statusText = document.getElementById('salonStatusText');

function displaySalonStatus(isOpen) {
  if (!statusBadge || !statusText) return;
  statusBadge.classList.toggle('is-closed', !isOpen);
  statusText.textContent = isOpen ? 'Salon Ouvert' : 'Salon Fermé';
}

if (firebaseReady && db) {
  onSnapshot(doc(db, 'settings', 'salon'), (snapshot) => {
    displaySalonStatus(snapshot.exists() ? snapshot.data().isOpen !== false : true);
  }, (error) => {
    console.error('Impossible de charger le statut du salon depuis Firebase :', error);
  });
}
