import { auth, db, firebaseReady, functions } from './firebase-client.js';
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  const dashboard = document.getElementById('adminDashboard');
  const accessStatus = document.getElementById('adminAccessStatus');
  const toggle = document.getElementById('salonToggle');
  const statusText = document.getElementById('adminCurrentStatus');
  const statusDescription = document.getElementById('adminStatusDescription');
  const list = document.getElementById('appointmentList');
  const empty = document.getElementById('appointmentsEmpty');
  const count = document.getElementById('appointmentCount');
  const dataFeedback = document.getElementById('adminDataFeedback');
  const today = document.getElementById('adminToday');
  let stopAppointmentsListener;
  let stopStatusListener;

  dashboard.hidden = false;
  toggle.disabled = true;

  today.textContent = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());

  const enteredCode = sessionStorage.getItem('locksetAdminCode');
  sessionStorage.removeItem('locksetAdminCode');

  if (!enteredCode) {
    accessStatus.textContent = 'Pour accéder au panel, retourne au site et clique sur le nom Lockset Vous dans le footer.';
    dataFeedback.textContent = 'Les rendez-vous seront affichés ici après validation du code administrateur et connexion à Firebase.';
    empty.textContent = 'Les demandes s’afficheront après la connexion sécurisée.';
    return;
  }

  if (!firebaseReady || !auth || !db || !functions) {
    accessStatus.textContent = 'Firebase n’est pas configuré. Complète firebase-config.js pour afficher les demandes et modifier le statut.';
    dataFeedback.textContent = 'Aucune demande ne peut être chargée tant que Firebase n’est pas configuré.';
    empty.textContent = 'Configure Firebase pour charger les rendez-vous.';
    return;
  }

  function setSalonStatus(isOpen) {
    toggle.setAttribute('aria-pressed', String(isOpen));
    toggle.classList.toggle('is-closed', !isOpen);
    statusText.textContent = isOpen ? 'Salon Ouvert' : 'Salon Fermé';
    statusText.classList.toggle('is-closed', !isOpen);
    statusDescription.textContent = isOpen
      ? 'Le salon est indiqué ouvert dans la barre de navigation.'
      : 'Le salon est indiqué fermé dans la barre de navigation.';
  }

  function makeDetail(label, value) {
    const wrapper = document.createElement('div');
    wrapper.className = 'appointment-detail';
    const term = document.createElement('span');
    term.className = 'appointment-detail-label';
    term.textContent = label;
    const detail = document.createElement('span');
    detail.className = 'appointment-detail-value';
    detail.textContent = value || 'Non renseigné';
    wrapper.append(term, detail);
    return wrapper;
  }

  function renderAppointments(documents) {
    const appointments = documents.slice().sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    list.replaceChildren();
    empty.hidden = appointments.length > 0;
    count.textContent = `${appointments.length} ${appointments.length > 1 ? 'demandes' : 'demande'}`;

    appointments.forEach(({ id, ...appointment }) => {
      const card = document.createElement('article');
      card.className = 'appointment-card';
      const heading = document.createElement('div');
      heading.className = 'appointment-card-heading';
      const title = document.createElement('h3');
      title.textContent = appointment.name || 'Client sans nom';
      const badge = document.createElement('span');
      badge.className = `appointment-state${appointment.status === 'Confirmé' ? ' is-confirmed' : ''}`;
      badge.textContent = appointment.status || 'À confirmer';
      heading.append(title, badge);

      const details = document.createElement('div');
      details.className = 'appointment-details';
      details.append(
        makeDetail('Prestation', appointment.service),
        makeDetail('Date souhaitée', appointment.date),
        makeDetail('Moment', appointment.time),
        makeDetail('Téléphone', appointment.phone),
        makeDetail('E-mail', appointment.email)
      );

      const message = document.createElement('p');
      message.className = 'appointment-message';
      message.textContent = appointment.message || 'Aucun message supplémentaire.';
      const actions = document.createElement('div');
      actions.className = 'appointment-actions';
      const emailLink = document.createElement('a');
      emailLink.className = 'appointment-action-link';
      emailLink.href = `mailto:${encodeURIComponent(appointment.email || '')}`;
      emailLink.textContent = 'Écrire au client';

      const confirmButton = document.createElement('button');
      confirmButton.className = 'appointment-action-button';
      confirmButton.type = 'button';
      confirmButton.textContent = appointment.status === 'Confirmé' ? 'Annuler confirmation' : 'Confirmer';
      confirmButton.addEventListener('click', async () => {
        try {
          await updateDoc(doc(db, 'appointments', id), {
            status: appointment.status === 'Confirmé' ? 'À confirmer' : 'Confirmé'
          });
        } catch (error) {
          console.error('Impossible de modifier le rendez-vous :', error);
          dataFeedback.textContent = 'Impossible de modifier le rendez-vous. Vérifie les règles Firestore.';
        }
      });

      const deleteButton = document.createElement('button');
      deleteButton.className = 'appointment-delete-button';
      deleteButton.type = 'button';
      deleteButton.textContent = 'Supprimer';
      deleteButton.addEventListener('click', async () => {
        if (!window.confirm('Supprimer cette demande de rendez-vous ?')) return;
        try {
          await deleteDoc(doc(db, 'appointments', id));
        } catch (error) {
          console.error('Impossible de supprimer le rendez-vous :', error);
          dataFeedback.textContent = 'Impossible de supprimer ce rendez-vous. Vérifie les règles Firestore.';
        }
      });
      actions.append(emailLink, confirmButton, deleteButton);
      card.append(heading, details, message, actions);
      list.append(card);
    });
  }

  function startDashboardListeners() {
    stopAppointmentsListener?.();
    stopStatusListener?.();

    stopAppointmentsListener = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      dataFeedback.textContent = '';
      renderAppointments(snapshot.docs.map((appointmentDoc) => ({
        id: appointmentDoc.id,
        ...appointmentDoc.data()
      })));
    }, (error) => {
      console.error('Impossible de charger les rendez-vous depuis Firestore :', error);
      dataFeedback.textContent = 'Firestore refuse la lecture. Vérifie que firestore.rules est déployé.';
      empty.textContent = 'Impossible de charger les rendez-vous depuis Firestore.';
    });

    stopStatusListener = onSnapshot(doc(db, 'settings', 'salon'), (snapshot) => {
      setSalonStatus(snapshot.exists() ? snapshot.data().isOpen !== false : true);
    }, (error) => {
      console.error('Impossible de charger le statut du salon :', error);
      statusDescription.textContent = 'Impossible de lire le statut Firebase. Vérifie firestore.rules.';
    });
  }

  try {
    accessStatus.textContent = 'Vérification du code…';
    const validateCode = httpsCallable(functions, 'createAdminToken');
    const result = await validateCode({ code: enteredCode });
    await signInWithCustomToken(auth, result.data.token);
  } catch (error) {
    console.error('Impossible d’ouvrir le panel administrateur :', error);
    accessStatus.textContent = error.code === 'functions/permission-denied'
      ? 'Code incorrect. Retourne au site et réessaie.'
      : 'Connexion au serveur Firebase impossible. Vérifie la configuration et le déploiement de la fonction createAdminToken.';
    dataFeedback.textContent = 'Les demandes et la disponibilité s’afficheront après validation de l’accès Firebase.';
    empty.textContent = 'Le panel attend la connexion sécurisée à Firestore.';
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      dashboard.hidden = false;
      accessStatus.hidden = false;
      accessStatus.textContent = 'Session fermée. Retourne au site pour accéder au panel.';
      stopAppointmentsListener?.();
      stopStatusListener?.();
      return;
    }

    const token = await user.getIdTokenResult();
    if (token.claims.admin !== true) {
      await signOut(auth);
      accessStatus.textContent = 'Ce compte n’a pas les droits administrateur.';
      return;
    }

    accessStatus.hidden = true;
    dashboard.hidden = false;
    toggle.disabled = false;
    startDashboardListeners();
  });

  toggle.addEventListener('click', async () => {
    const nextIsOpen = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.disabled = true;
    try {
      await setDoc(doc(db, 'settings', 'salon'), {
        isOpen: nextIsOpen,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Impossible d’enregistrer la disponibilité :', error);
      statusDescription.textContent = 'Modification refusée. Vérifie que firestore.rules est déployé.';
    } finally {
      toggle.disabled = false;
    }
  });
});
