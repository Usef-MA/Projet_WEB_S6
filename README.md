# AARO Gaming — Plateforme de jeux marocains

## Présentation du projet

AARO Gaming est une plateforme web de jeux vidéo développée dans le cadre du projet S6 de licence MIAGE. L'idée de départ était simple : créer des jeux classiques (runner, Frogger, billard) en les ancrant dans un univers visuel et culturel marocain — médinas, souks, couleurs chaudes, motifs zellige. Le tout accessible directement dans le navigateur, sans installation, avec un système de comptes et de classements en ligne.

La plateforme regroupe trois jeux jouables, un backend Node.js hébergé sur Render, et un frontend déployé sur Vercel. Les scores sont sauvegardés dans MongoDB Atlas et consultables par tous les joueurs en temps réel.

## Accès au projet

Plateforme en ligne : https://projet-web-s6.vercel.app/

Vidéo de présentation : [À AJOUTER]

## Répartition du travail

Ce projet a été réalisé à deux : Youssef et Kelyan. La répartition finale est estimée à environ 65% / 35%.

**Youssef (65%)** a pris en charge la majorité de l'architecture et de l'intégration. Concrètement : la page d'accueil AARO avec son thème marocain complet (palette bordeaux/or, motif zellige en SVG, responsive), le système d'authentification JWT de bout en bout (inscription, connexion, session partagée entre la page d'accueil et les jeux via sessionStorage), le backend Express avec toutes ses routes (auth, scores, mot de passe), le déploiement sur Render et Vercel, et l'intégration du Billard Marocain dans la plateforme — ce qui a demandé un important travail de refonte visuelle (thème marocain sur le canvas, écran de sélection de difficulté, responsive avec CSS transform:scale). Il a aussi développé le menu utilisateur avec dropdown dans le header, construit l'ensemble du système de scores mutualisé entre les trois jeux, et corrigé plusieurs bugs critiques de production (CORS, routing Express, URL backend).

**Kelyan (35%)** a principalement travaillé sur MarocRunner — la structure du jeu (machine à états, boucle de jeu, système de niveaux avec LevelConfig), les différents types d'obstacles (11 types : épées rotatives, portails de gravité, tempête de sable, mirage, etc.), et la mécanique de saut chargé. Il a aussi contribué à la base de code du Billard avant la refonte thématique. Kelyan n'a pas travaillé sur SoukDash, qui a été entièrement développé séparément.

## Difficultés rencontrées

Le premier vrai problème technique qu'on a eu à résoudre, c'est un bug subtil dans Express. La route `GET /scores/me` (pour les scores personnels d'un utilisateur) était définie après la route `GET /scores/:jeu` dans le fichier backend. Express matchant les routes dans l'ordre, toute requête vers `/scores/me` était interceptée par `:jeu` avec la valeur `"me"`, ce qui retournait le classement vide d'un jeu qui n'existait pas. La correction était triviale une fois le bug identifié — inverser l'ordre des deux routes — mais trouver la cause a pris du temps.

Le CORS a aussi posé des problèmes en production. Localement tout fonctionnait, mais une fois le frontend déployé sur Vercel et le backend sur Render, les requêtes `PUT` avec header `Authorization` étaient bloquées silencieusement par le navigateur. La configuration initiale utilisait une liste d'origines autorisées codée en dur, avec `FRONTEND_URL=*` dans le `.env` qui était traité comme une chaîne littérale et non comme un wildcard. La solution a été de passer à `cors({ origin: true })`, qui reflète dynamiquement l'origine de la requête — compatible avec JWT sans nécessiter `credentials: true` côté cookie.

L'intégration du canvas Billard en responsive a aussi demandé de la réflexion. Le canvas est fixé à 900×500px pour que la physique reste stable, mais il devait s'adapter aux petits écrans. Plutôt que de modifier le moteur physique, on a appliqué un `transform: scale()` via CSS sur le wrapper, et la fonction `getCanvasPos()` utilise `getBoundingClientRect()` pour compenser le scaling lors de la détection des clics.

Enfin, la gestion des sprites PNG transparents dans SoukDash a révélé un bug moins évident : un `clearRect()` avant chaque `drawImage()` effaçait les tuiles de fond déjà dessinées, faisant apparaître le fond HTML à travers les pixels transparents des sprites. La suppression de ces `clearRect()` superflus a suffi à régler le problème, la composition `source-over` par défaut du canvas gérant correctement la transparence.

## Pourquoi ces trois jeux

Le runner, le Frogger et le billard sont trois genres bien distincts qui couvrent des expériences de jeu différentes : réflexes purs, stratégie de timing, et précision tactique. Le contexte marocain leur donne une cohérence visuelle et narrative — on court dans un désert qui se transforme en médina, on traverse les ruelles d'un souk animé, on joue au billard sur un tapis bordeaux aux motifs de zellige. Ce n'était pas juste une décision esthétique : ça nous a obligés à penser les univers visuels de façon originale au lieu d'utiliser des assets génériques.

## Utilisation de l'intelligence artificielle

On a utilisé Claude Code (Anthropic) comme assistant tout au long du développement. Ce qui est important de préciser, c'est que ça n'a pas fonctionné comme "génère-moi un jeu". Chaque interaction partait d'une spécification précise : "voici le fichier common.js actuel, voici la physique existante, modifie uniquement FRICTION et MAX_SHOT_POWER pour que les billes soient plus rapides", ou "voici le backend complet, ajoute une route PUT /auth/password qui vérifie l'ancien mot de passe avec bcrypt avant de hasher le nouveau". Les outputs étaient systématiquement relus, testés, et souvent corrigés.

L'IA a été utile principalement sur trois types de tâches : la génération de CSS complexe (le motif zellige en SVG inline, les animations d'arabesque), la détection de bugs croisés (comme le routing Express ou le clearRect du canvas), et la mise en place d'une structure de code cohérente entre les trois jeux (le pattern ScoreManager partagé). Tout le raisonnement de conception, les choix d'architecture, et la compréhension du code sont restés du côté humain.
