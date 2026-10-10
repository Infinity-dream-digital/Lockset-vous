# Configuration Firebase Lockset Vous

## Préparer le projet

1. Crée un projet Firebase et une application Web.
2. Active **Cloud Firestore** et **Firebase Authentication** (aucun formulaire e-mail/mot de passe n’est nécessaire dans le panel).
3. Copie les identifiants Web dans `firebase-config.js`, à la place des valeurs `VOTRE_...`.
4. Le formulaire ajoute chaque demande à `appointments`. Le tableau de bord écoute cette collection en temps réel. La disponibilité est enregistrée dans `settings/salon` sous le champ `isOpen`.

## Activer l’accès sans écran de connexion dans le panel

Le code saisi en cliquant sur le nom du footer est vérifié côté serveur par `functions/index.js`. Le serveur remet un jeton Firebase admin; le panneau n’affiche donc pas de formulaire e-mail/mot de passe.

1. Installe Firebase CLI, connecte-toi et sélectionne ton projet (`firebase login`, puis `firebase use --add`).
2. Depuis la racine du projet, définis le code du panel comme secret Firebase avec `firebase functions:secrets:set ADMIN_PANEL_CODE`, puis saisis le code demandé dans le terminal.
3. Déploie la fonction et les règles : `firebase deploy --only functions,firestore:rules`.
4. Les fonctions Cloud nécessitent généralement le forfait Blaze (facturation activée) même si l’usage du projet reste dans les quotas gratuits.

Les règles autorisent les visiteurs à créer des rendez-vous, mais seulement le jeton admin signé par la fonction à lire/modifier/supprimer. Ne rends pas la lecture de `appointments` publique : cette collection contient les coordonnées des clients.

## Hébergement

Les pages sont des modules JavaScript Firebase : ouvre-les via un serveur local HTTP ou un hébergement HTTPS, pas en double-cliquant sur les fichiers. Après configuration et déploiement, les réservations apparaissent dans le panneau sans passer par le stockage local.
