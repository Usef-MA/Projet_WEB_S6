// Classe de base abstraite pour tous les états du jeu
// BONNE PRATIQUE : Pattern State pour gérer Menu/Play/GameOver
export default class GameState {
    constructor(game) {
        this.game = game;
    }

    // Méthodes à implémenter par les classes filles
    enter() {
        // Appelé quand on entre dans cet état
    }

    exit() {
        // Appelé quand on quitte cet état
    }

    update(deltaTime) {
        // Logique de mise à jour
    }

    draw(ctx) {
        // Logique de dessin
    }

    handleInput(inputManager) {
        // Gestion des inputs spécifiques à l'état
    }
}