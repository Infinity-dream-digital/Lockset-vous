import { db, firebaseReady } from './firebase-client.js';
import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookingForm');
  const dateInput = document.getElementById('bookingDate');
  const year = document.getElementById('bookingYear');
  const feedback = document.getElementById('bookingFeedback');
  const submitButton = form?.querySelector('button[type="submit"]');

  if (year) year.textContent = new Date().getFullYear();
  if (dateInput) {
    const today = new Date();
    dateInput.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  }

  if (!form) return;

  const serviceFromLink = new URLSearchParams(window.location.search).get('service');
  const serviceSelect = document.getElementById('bookingService');
  const serviceAliases = {
    creation: 'Création & Départ',
    entretien: 'Entretien & Retwist',
    detox: 'Détox & Soin Profond'
  };
  if (serviceFromLink && serviceSelect) {
    serviceSelect.value = serviceAliases[serviceFromLink] || serviceFromLink;
  }

  if (!firebaseReady) {
    if (feedback) feedback.textContent = 'Firebase n’est pas encore configuré : ajoute les identifiants du projet dans firebase-config.js pour activer les réservations.';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!firebaseReady || !db) {
      if (feedback) feedback.textContent = 'La demande ne peut pas être envoyée tant que Firebase n’est pas configuré.';
      return;
    }

    const formData = new FormData(form);
    const appointment = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      service: String(formData.get('service') || ''),
      date: String(formData.get('date') || ''),
      time: String(formData.get('time') || ''),
      message: String(formData.get('message') || '').trim(),
      status: 'À confirmer',
      createdAt: serverTimestamp()
    };

    submitButton.disabled = true;
    if (feedback) feedback.textContent = 'Envoi de votre demande…';

    try {
      await addDoc(collection(db, 'appointments'), appointment);
      form.reset();
      if (serviceFromLink && serviceSelect) serviceSelect.value = serviceAliases[serviceFromLink] || '';
      if (feedback) feedback.textContent = 'Votre demande a bien été envoyée. Le salon vous recontactera pour confirmer le rendez-vous.';
    } catch (error) {
      console.error('Erreur lors de l’enregistrement de la réservation :', error);
      if (feedback) feedback.textContent = 'Impossible d’enregistrer votre demande pour le moment. Vérifie ta connexion ou contacte le salon par e-mail.';
    } finally {
      submitButton.disabled = false;
    }
  });
});
