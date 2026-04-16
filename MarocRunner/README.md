# 🎮 Maroc Runner - Jeu Canvas HTML5
### L3 MIAGE 2024-2025 - TP Canvas Game

---

## 👥 Équipe de développement

**Youssef BOUROUDANE** - Développement du jeu principal, gameplay et systèmes de jeu  
**Kelyan SANCHES GOMES** - Développement du jeu principal , gameplay et des pages 
---

## Description du projet

**Maroc Runner** est un jeu de plateforme 2D inspiré de Geometry Dash, avec une identité visuelle marocaine authentique. Le joueur contrôle un cube de zellige marocain qui doit éviter des obstacles tout en progressant à travers 4 niveaux de difficulté croissante.

### Concept
Le jeu mêle gameplay nerveux et patrimoine culturel marocain. Chaque élément visuel (personnage, obstacles, décors) s'inspire des motifs traditionnels du zellige et de l'architecture marocaine.

---

## Fonctionnalités implémentées

###  Gameplay
- **5 niveaux progressifs** avec difficulté croissante
- **Système de vies** (3 vies de départ + 1 vie bonus a chaque passage de niveau)
- **Système de score** avec sauvegarde du meilleur score
- **Mécanique de saut** : saut simple et saut chargé selon la durée d'appui
- **Accélération progressive** de la vitesse du jeu
- **types d'obstacles différents** (pics, murs mobiles, etc.)

### Interface utilisateur
- **Menu principal** point d'entrée avec navigation interactive
- **Écran de jeu** avec HUD (score, niveau, vies)
- **Écran Game Over** avec affichage des scores
- **Écran des meilleurs scores (High Scores)**
- **Transitions fluides** entre les niveaux avec animations

### Audio
- **Musique de fond** en boucle continue
- **Effets sonores** pour les sauts
- **Système audio centralisé** avec contrôle du volume

### Effets visuels
- **Système de particules** pour les traînées du joueur
- **Rotation dynamique** du personnage pendant les sauts
- **Backgrounds animés** défilants pour chaque niveau
- **Transitions visuelles** entre les niveaux
---

## Architecture et bonnes pratiques

### Structure du projet
```
TP-BUFFA-JS-L3MIAGE/
│   .DS_Store                    # Fichier système macOS (à ignorer)
│   .gitignore                   # Liste des fichiers à exclure de Git
│   game.html                    # Page principale du jeu (canvas + gameplay)
│   menu.html                    # Page du menu principal
│   options.html                 # Page des paramètres (son activé/désactivé)
│   README.md                    # Documentation du projet
│   tutorial.html                # Page tutoriel (comment jouer)
│
├───assets                       # Ressources multimédias
│       .DS_Store
│       background.mp3           # Musique de fond du jeu
│       carre.png                # Image du joueur (carré)
│       gameover-bg.png          # Fond d'écran Game Over
│       imagebouclier.png        # Image du bouclier (tutoriel)
│       level1-bg.png            # Fond niveau 1
│       level2-bg.png            # Fond niveau 2
│       level3-bg.png            # Fond niveau 3
│       menu-bg.png              # Fond du menu
│       obstacle.png             # Image d'obstacle
│       saut.mp3                 # Son de saut
│
├───css                          # Feuilles de style
│       game.css                 # Style du jeu (canvas, HUD, animations)
│       menu.css                 # Style du menu principal
│       options.css              # Style de la page paramètres
│       tutorial.css             # Style de la page tutoriel
│
└───js                           # Code JavaScript
    │   .DS_Store
    │   Game.js                  # Classe principale (gestion des états, boucle de jeu)
    │   main.js                  # Point d'entrée (initialisation du jeu)
    │
    ├───config                   # Configuration du jeu
    │       LevelConfig.js       # Paramètres des niveaux (vitesse, obstacles, scores)
    │       options.js           # Logique de la page paramètres
    │
    ├───effects                  # Effets visuels
    │       ParticleSystem.js    # Système de particules (charge du saut)
    │
    ├───entities                 # Entités du jeu (joueur, obstacles)
    │       Entity.js            # Classe de base (position, hitbox, collision)
    │       Obstacle.js          # Obstacle basique (spike au sol)
    │       ObstacleCeilingSpike.js      # Spike tombant du plafond
    │       ObstacleDoubleSpike.js       # Deux spikes (haut et bas)
    │       ObstacleFlying.js            # Obstacle volant
    │       ObstacleFlyingCarpet.js      # Tapis volant
    │       ObstacleGravityPortal.js     # Portail donnant un bouclier
    │       ObstacleInvertedSpike.js     # Spike inversé (plafond)
    │       ObstacleMirage.js            # Mirage (obstacle faux)
    │       ObstacleMovingWall.js        # Mur avec trou mobile
    │       ObstaclePendulumLantern.js   # Lanterne pendule
    │       ObstacleRotatingSword.js     # Obstacle qui tourne
    │       ObstacleSandstorm.js         # Tempête de sable
    │       ObstacleSpeedZone.js         # Zone qui accélère/ralentit
    │       Player.js            # Joueur (saut, saut chargé, bouclier)
    │
    ├───states                   # États du jeu (pattern State)
    │       GameOverState.js     # État Game Over (affichage score, rejouer)
    │       GameState.js         # Classe abstraite de base pour tous les états
    │       MenuState.js         # État Menu principal
    │       PlayState.js         # État de jeu (gameplay, collisions, spawn)
    │
    └───utils                    # Utilitaires
            AudioManager.js      # Gestion du son (musique, effets)
            InputManager.js      # Gestion des entrées clavier (saut, charge)
            ScoreManager.js      # Gestion des score
```

###  Bonnes pratiques respectées

####  Architecture orientée objet
- **Hiérarchie de classes** : `Entity` → `Player`, `Obstacle`, sous-classes d'obstacles
- **Pattern State** pour gérer les différents écrans (Menu, Play, GameOver)
- **Managers centralisés** : `InputManager`, `ScoreManager`, `AudioManager`
- **Séparation des responsabilités** : chaque classe a un rôle unique et bien défini

#### Gestion du Canvas
- **`ctx.save()` et `ctx.restore()`** systématiques pour isoler les contextes graphiques
- **`ctx.translate()` et `ctx.rotate()`** pour les transformations géométriques (rotation du joueur)
- **Animation avec `requestAnimationFrame()`** (pas de `setInterval()`)
- **DeltaTime** pour une animation fluide indépendante du framerate

#### Gestion des événements
- **Écouteurs centralisés** dans `InputManager`
- **Support multi-plateformes** : clavier (Space, Arrow Up), souris, tactile
- **Système de saut variable** : détection d'appui court vs long

#### Code propre et maintenable
- **Modules ES6** : `import`/`export` pour tous les fichiers
- **Configuration externalisée** : `LevelConfig.js` centralise tous les paramètres de niveaux
- **Commentaires pertinents** sur les parties complexes
- **Nommage explicite** des variables et fonctions

---

## Ressources et outils utilisés

###  Intelligence Artificielle (Gemini)

**Assets graphiques générés par IA :**
- **Personnage** : Cube inspiré des motifs de zellige marocain
- **Obstacles** : Pics, murs, objets avec style marocain
- **Backgrounds** : 5 arrière-plans progressifs avec thème désert/nuit marocaine

**Prompts utilisés (exemples) :**
```
"Génère un cube avec des motifs de zellige marocain traditionnel, 
style pixel art, fond transparent"

"Crée un arrière-plan de désert marocain la nuit avec étoiles et 
croissant de lune, style minimaliste pour jeu vidéo"

"Design un obstacle en forme de pic avec motifs géométriques marocains"
```

**Code généré par IA :**
- **AudioManager** : Classe de gestion audio créée avec assistance de Claude (Anthropic)
- Tous les autres systèmes ont été développés manuellement en suivant les bonnes pratiques du cours

### Audio
- **Musique de fond** : `background.mp3` 
- **Son de saut** : `saut.mp3` 

###  Références du cours
- **GitHub du cours** : https://github.com/micbuffa/L3MiageIntroJS2025_2026
- **Jeu développé en classe** : Structure des états, gestion des collisions
- **MOOC HTML5 Coding Essentials** : Chapitre sur les transformations géométriques

---

## Difficultés rencontrées et solutions

### Gestion des collisions et hitbox
**Problème :** Les collisions entre le joueur et les obstacles étaient imprécises, causant des détections erronées.

**Solution :**
- Implémentation d'une méthode `collidesWith()` dans la classe `Entity`
- Utilisation de hitbox rectangulaires (AABB - Axis-Aligned Bounding Box)
- Ajout d'une marge de tolérance pour améliorer le gameplay
```javascript
collidesWith(other) {
    return this.x < other.x + other.width &&
           this.x + this.width > other.x &&
           this.y < other.y + other.height &&
           this.y + this.height > other.y;
}
```

### Système de niveaux progressifs
**Problème :** Gérer la transition fluide entre les niveaux tout en changeant vitesse, types d'obstacles et background.

**Solution :**
- Création d'un fichier `LevelConfig.js` centralisant toute la configuration
- Système de transition avec timer et animation de fondu
- Changement progressif de la vitesse et des types d'obstacles
```javascript
// Exemple de configuration de niveau
{
    level: 1,
    name: "Niveau 1",
    speed: 280,
    obstacles: ['spike', 'lowBlock'],
    scoreThreshold: 0
}
```

### Synchronisation audio avec le gameplay
**Problème :** Le son de saut ne se déclenchait pas systématiquement.

**Solution :**
- Création d'une classe `AudioManager` dédiée
- Passage de l'`audioManager` au `Player` via le constructeur
- Réinitialisation du `currentTime` du son pour permettre les sauts rapides successifs

---

##  Comment jouer

###  Contrôles
- **Saut simple** : Appui court sur `ESPACE` / `FLÈCHE HAUT` / `CLIC SOURIS` / `TACTILE`
- **Saut chargé** : Maintenir `ESPACE` / `FLÈCHE HAUT` (jusqu'à 400ms) pour un saut plus haut

### Système de jeu
- **Score** : Augmente automatiquement en fonction de la distance parcourue et des obstacles évités
- **Vies** : 3 vies au départ + 1 vie bonus tous les 2 niveaux (max 5 vies)
- **Niveaux** : Déblocage automatique selon le score atteint
- **Game Over** : Quand toutes les vies sont perdues

###  Objectif
Survivre le plus longtemps possible et atteindre le score le plus élevé en évitant tous les obstacles !

---


## Points forts du projet

### Identité visuelle unique
- **Thème culturel cohérent** : Tous les éléments visuels respectent l'esthétique marocaine
- **Animations fluides** : Particules, rotations, transitions de niveaux

###  Architecture solide
- **Pattern State** bien implémenté pour la gestion des écrans
- **Hiérarchie de classes** claire et extensible

###  Gameplay travaillé
- **Mécanique de saut variable** inspirée de Celeste
- **Difficulté progressive** équilibrée sur des niveaux
- **Système de vies** qui récompense la progression

### Expérience immersive
- **Musique de fond** atmosphérique
- **Effets sonores** réactifs
- **Système de particules** pour le feedback visuel

---

---

##  Installation et lancement

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Serveur local (ex: Live Server de VSCode) pour éviter les erreurs CORS

### Lancement
1. Cloner le repository
```bash
git clone [URL_DU_REPO]
cd TP-BUFFA-JS-L3MIAGE
```

2. Lancer avec un serveur local
```bash
# Avec Python 3
python -m http.server 8000

# Avec Node.js (http-server)
npx http-server

# Ou utiliser l'extension Live Server de VSCode
```

3. Ouvrir dans le navigateur
```
http://localhost:8000/menu.html
```

---

## 📄 Licence

Projet académique - L3 MIAGE 2024-2025  
Université Côte d'Azur

---

---

## 📧 Contact

**Youssef BOUROUDANE**  
Étudiant L3 MIAGE - Université Côte d'Azur  
youssef.bouroudane@etu.unice.fr

**Kelyan SANCHES GOMES**  
Étudiant L3 MIAGE - Université Côte d'Azur  
kelyan.sanches-gomes@etu.univ-cotedazur.fr
---

**Date de rendu :** 15 février 2025  
**Cours :** HTML5 Coding & Canvas - Michel Buffa


