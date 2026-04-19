# Rapport de conception — AARO Gaming
## Projet Web S6 — Licence MIAGE

---

## 1. Architecture générale du projet

Le projet est organisé en cinq dossiers distincts à la racine du dépôt. Chaque jeu est autonome dans son propre dossier, le frontend est séparé du backend, et un fichier `vercel.json` assure le routage statique pour le déploiement.

```
Projet-WEB/
├── frontend/           ← Page d'accueil AARO, auth, navigation entre jeux
│   ├── index.html
│   ├── script.js       ← Auth JWT, modales, leaderboard, menu utilisateur
│   └── styles.css      ← Thème marocain, zellige SVG, responsive
│
├── backend/            ← API REST Node.js/Express
│   ├── index.js        ← Routes auth + scores, modèles Mongoose, middleware JWT
│   └── package.json
│
├── MarocRunner/        ← Jeu runner, ES6 modules, machine à états
│   ├── js/
│   │   ├── Game.js / main.js
│   │   ├── states/     ← MenuState, PlayState, GameOverState...
│   │   ├── entities/   ← Player, Obstacle + 11 types spécialisés
│   │   ├── config/     ← LevelConfig (5 niveaux)
│   │   └── utils/      ← ScoreManager, AudioManager, InputManager
│   └── assets/
│
├── SoukDash/           ← Jeu Frogger, architecture MVC stricte
│   ├── js/
│   │   ├── controllers/ ← GameController, InputController, ScoreController
│   │   ├── models/      ← Player, Obstacle, Score, Level
│   │   ├── views/       ← GameRenderer
│   │   ├── services/    ← ApiService, SoundService
│   │   └── config/      ← gameConfig.js (niveaux, constantes)
│   └── assets/images/   ← sprites PNG (charrette, moto, voiture...)
│
├── Billard/            ← Jeu billard 8-ball vs IA, canvas 2D
│   ├── js/
│   │   ├── common.js   ← Physique, constantes TABLE/BALL, utilitaires Vec2
│   │   ├── game.js     ← Moteur principal, dessin, IA
│   │   └── scoreManager.js
│   └── css/            ← Thème marocain (menu, game, difficulty)
│
└── vercel.json         ← Routing statique Vercel pour les 4 dossiers
```

Le frontend sert de portail central. Lorsqu'un utilisateur clique "Jouer", son token JWT est copié dans `sessionStorage` avant la redirection vers le jeu concerné, ce qui permet à chaque jeu de s'authentifier sans que l'utilisateur ait à se reconnecter.

---

## 2. Conception du backend

Le backend est un serveur Express 5 minimaliste dans un seul fichier `index.js`. Ce choix de ne pas découper en router/controller séparés a été assumé pour sa simplicité — le projet ne nécessite pas une architecture complexe.

**Modèles MongoDB (Mongoose)**

Deux collections : `User` et `Score`. Le modèle User stocke prénom, nom, email (unique, lowercase), et le mot de passe hashé. Le modèle Score associe un `user_id` à un `jeu` (identifiant textuel) et un `score` numérique, avec les timestamps automatiques de Mongoose.

**Authentification**

L'inscription hash le mot de passe avec bcrypt (12 rounds) avant de créer l'utilisateur. La connexion compare le hash. Dans les deux cas, un JWT est signé avec `{ id, prenom, nom, email }` et une expiration de 7 jours. Le token est retourné au frontend qui le stocke en `localStorage`.

Le middleware `authRequired` vérifie la présence et la validité du token Bearer sur les routes protégées. En cas d'échec, il retourne un 401 JSON — jamais une page HTML.

**Routes**

```
POST /auth/register     → inscription
POST /auth/login        → connexion
GET  /auth/me           → profil (auth requise)
PUT  /auth/password     → changement de mot de passe (auth requise)
POST /scores            → enregistrer un score (auth requise)
GET  /scores/me         → scores personnels par jeu (auth requise)
GET  /scores/:jeu       → leaderboard public (top 20, agrégation MongoDB)
```

Un point technique important : `GET /scores/me` est déclaré **avant** `GET /scores/:jeu`. Express mappe les routes dans l'ordre de déclaration ; si `:jeu` venait en premier, "me" serait capturé comme paramètre dynamique et retournerait un leaderboard vide au lieu des scores de l'utilisateur.

Le leaderboard utilise une agrégation MongoDB en deux passes : d'abord un `$group` par `user_id` pour ne garder que le meilleur score par joueur, puis un second `$sort` par score décroissant, limité à 20 entrées.

**CORS**

La configuration `cors({ origin: true, credentials: true })` reflète dynamiquement l'origine de chaque requête dans le header `Access-Control-Allow-Origin`. C'est compatible avec tous les domaines de déploiement sans avoir à maintenir une liste d'origines, et fonctionne avec les headers `Authorization` Bearer (JWT) sans nécessiter de cookies.

---

## 3. Conception des trois jeux

### 3.1 MarocRunner

MarocRunner est un runner horizontal à défilement automatique avec 5 niveaux de difficulté progressive. Le code est organisé en ES6 modules avec une machine à états explicite (`MenuState`, `PlayState`, `GameOverState`, etc.) pilotée par la classe `Game`.

Le gameplay repose sur un saut chargé : un appui court déclenche un saut normal, un appui long produit un saut plus puissant proportionnel au temps de charge. La vitesse du jeu augmente progressivement au cours du niveau et s'accélère encore à chaque palier.

Les 5 niveaux sont définis dans `LevelConfig` : de "Désert Calme" (280px/s, 2 types d'obstacles) à "Tempête Finale" (580px/s, 9 types possibles). Entre chaque niveau, une transition animée affiche le nom du niveau avec un effet de scale. La progression est basée sur le score : niveau 2 à 1800 pts, niveau 3 à 4500, niveau 4 à 6700, niveau 5 à 9000.

Il y a 11 types d'obstacles distincts, chacun dans sa propre classe héritant de `Obstacle` : spike, doubleSpike, ceilingSpike, flyingCarpet, pendulumLantern, rotatingSword, invertedSpike, gravityPortal, movingWall, sandstorm, mirage, speedZone. Chaque type a son propre comportement de mouvement et de hitbox.

### 3.2 SoukDash

SoukDash est un jeu de type Frogger se déroulant dans une médina marocaine. Le joueur traverse une grille 10×10 du bas vers le haut en évitant les obstacles sur 7 couloirs actifs, avec une zone sûre au milieu et une zone d'arrivée en haut.

L'architecture suit un patron MVC strict. Le `GameController` orchestre tout : il délègue les entrées à `InputController`, le rendu à `GameRenderer`, les scores à `ScoreController`, et le son à `SoundService`. Les modèles (`Player`, `Obstacle`, `Score`, `Level`) ne contiennent que des données et de la logique métier, sans aucune référence au DOM ni au canvas.

Le jeu comporte 3 niveaux de difficulté croissante. Au niveau 1 (Médina), les obstacles sont des charrettes, vélos et passants à vitesse modérée. Au niveau 2 (Souk), des motos et porteurs accélèrent la cadence. Au niveau 3 (Traversée), des voitures et foules denses requièrent un timing précis. Le système de score récompense la rapidité (bonus temps décroissant) et les vies conservées.

Les sprites sont des PNG avec transparence. Un point important de l'implémentation : les `drawImage()` ne sont pas précédés de `clearRect()`, contrairement à une idée reçue. Le `clearRect()` global en début de frame suffit — ajouter un `clearRect()` avant chaque sprite effaçait les tuiles de fond déjà dessinées, rendant visibles les pixels transparents des sprites sur le fond HTML.

### 3.3 Billard Marocain

Le billard est un jeu de 8-ball complet contre une IA, dessiné entièrement en Canvas 2D. La table fait 900×500px avec un couloir de 40px de bords. Le moteur physique gère les collisions bille-bille (résolution par vecteur normal) et bille-bords, avec un coefficient de friction de 0.988 par frame et une restitution de 0.92 aux rebonds.

La puissance de frappe maximale est de 32 pixels/frame. Le joueur oriente le tir à la souris, vise avec une ligne directrice, et ajuste la puissance avec un clic maintenu. L'IA existe en trois niveaux : facile (direction aléatoire avec imprécision), moyen (vise la bille la plus proche du trou optimal), difficile (calcul de l'angle de rebond pour la mise optimale).

La sélection de difficulté se fait sur une page dédiée (`difficulty.html`) qui enregistre le choix dans `localStorage.billardDifficulty`, lu au démarrage par `common.js`. Le canvas est rendu responsive via `transform: scale()` CSS sur le wrapper, sans modifier le moteur physique — la fonction `getCanvasPos()` corrige les coordonnées en appliquant le ratio `getBoundingClientRect().width / 900`.

L'identité visuelle marocaine est portée par le tapis bordeaux (`#5c1010`), les bords en bois sombre (`#3b1a00`), des bordures or et un motif de diamants zellige sur les rails.

---

## 4. Système de scores mutualisé

Les trois jeux partagent le même protocole pour envoyer les scores au backend. Chacun dispose de son propre `scoreManager` (ou équivalent), mais ils suivent tous la même logique :

1. Récupérer le token JWT depuis `sessionStorage.aaroToken` ou, en fallback, `localStorage.aaroToken`
2. Si aucun token n'est présent, ne rien envoyer (le joueur n'est pas connecté)
3. Si un token existe, faire un `POST /scores` avec `{ jeu: '<identifiant>', score: <nombre> }` et le header `Authorization: Bearer <token>`
4. En cas d'erreur réseau, afficher un warning en console et continuer sans interrompre le jeu

Les identifiants de jeu sont `"marocrunner"`, `"soukdash"` et `"billard"`. Le score local est toujours sauvegardé dans `localStorage` indépendamment de la connexion, ce qui garantit que le highscore local persiste même hors ligne.

Le token est transmis du frontend vers les jeux via `sessionStorage.setItem('aaroToken', ...)` juste avant la redirection, ce qui évite de redemander les identifiants à l'utilisateur à chaque lancement de jeu.

---

## 5. Déploiement

**Frontend — Vercel**

Vercel a été choisi pour le frontend car il prend en charge les sites statiques avec une configuration minimale. Un fichier `vercel.json` à la racine définit les builds (un par dossier de jeu) et les routes de rerouting. Toute URL non matchée par MarocRunner, SoukDash ou Billard est redirigée vers le dossier `frontend/`. Vercel se redéploie automatiquement à chaque push sur la branche `main` du dépôt GitHub.

**Backend — Render**

Le backend Express est hébergé sur Render en tant que service Web. Render est connecté au même dépôt GitHub et redéploie automatiquement le dossier `backend/` à chaque push. Le plan gratuit de Render met le serveur en veille après 15 minutes d'inactivité, ce qui peut provoquer un délai de démarrage à froid sur la première requête.

Les variables d'environnement (`MONGO_URL`, `JWT_SECRET`, `PORT`) sont configurées directement dans le dashboard Render et ne sont jamais versionnées. Un fichier `backend/.env.example` documente les variables nécessaires sans exposer les valeurs réelles.

**Base de données — MongoDB Atlas**

MongoDB Atlas héberge la base de données dans le cloud (cluster M0 gratuit). La connexion se fait via une URI avec authentification incluse. Un point d'attention en production : Render utilise des adresses IP variables (pas d'IP fixe sur le plan gratuit), il faut donc configurer Atlas pour autoriser toutes les IPs (`0.0.0.0/0`) ou utiliser un plan Render avec IP statique.

---

## 6. Utilisation de l'IA dans la conception

Claude Code (Anthropic) a été utilisé comme assistant de développement. Son rôle n'a pas été de générer du code de façon autonome, mais d'accélérer certaines tâches précises à partir de spécifications détaillées.

**Exemples concrets d'utilisation**

Premier exemple : la configuration du thème marocain CSS. Le prompt donné était du type "voici les variables CSS existantes (bordeaux `#8B1A1A`, or `#D4AF37`, fond `#1a0a00`), génère le CSS pour un motif zellige en SVG inline utilisable comme `background-image`, avec deux polygones imbriqués en losange". L'output a été un data URI SVG intégré directement dans le CSS, relu et ajusté pour correspondre exactement à la densité et l'opacité voulues.

Deuxième exemple : la détection du bug de routing Express. En soumettant les deux routes problématiques (`GET /scores/me` et `GET /scores/:jeu`) avec leur ordre de déclaration, l'IA a immédiatement identifié que Express capturerait "me" comme paramètre `:jeu`. La correction (inverser l'ordre) a été appliquée et vérifiée.

Troisième exemple : l'intégration du canvas Billard en responsive. Le problème posé était "le canvas est fixé à 900×500px pour la physique, comment le rendre responsive sans modifier le moteur". L'IA a proposé l'approche `transform: scale()` sur le wrapper CSS, et expliqué pourquoi `getBoundingClientRect()` dans `getCanvasPos()` compensait automatiquement le scaling pour les événements souris — ce qui a évité d'avoir à modifier toute la couche de détection d'input.

Dans tous les cas, le code généré a été relu ligne par ligne, testé en local, et parfois corrigé (notamment sur la gestion des edge cases et sur certains comportements de timing). L'IA a servi d'accélérateur technique, pas de substitut à la compréhension du code.
