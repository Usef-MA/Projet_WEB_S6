export default class LevelConfig {
    static LEVELS = {
        1: {
            name: "DÉSERT CALME",
            speed: 280,
            spawnDelayMin: 1.5,
            spawnDelayMax: 2.5,
            scoreThreshold: 0,
            obstacles: ['spike', 'lowBlock']
        },
        2: {
            name: "OASIS AGITÉE",
            speed: 350,
            spawnDelayMin: 1.2,
            spawnDelayMax: 2.0,
            scoreThreshold: 1800,
            obstacles: ['spike', 'doubleSpike', 'ceilingSpike', 'flyingCarpet']
        },
        3: {
            name: "MÉDINA PÉRILLEUSE",
            speed: 420,
            spawnDelayMin: 0.9,
            spawnDelayMax: 1.6,
            scoreThreshold: 4500,
            obstacles: ['spike', 'rotatingSword', 'pendulumLantern', 'invertedSpike']
        },
        4: {
            name: "PALAIS MYSTIQUE",
            speed: 500,
            spawnDelayMin: 0.7,
            spawnDelayMax: 1.3,
            scoreThreshold: 6700,
            obstacles: ['spike', 'gravityPortal', 'movingWall']
        },
        5: {
            name: "TEMPÊTE FINALE",
            speed: 580,
            spawnDelayMin: 0.5,
            spawnDelayMax: 1.0,
            scoreThreshold: 9000,
            obstacles: ['sandstorm', 'mirage', 'speedZone', 'doubleSpike', 'gravityPortal', 'rotatingSword', 'flyingCarpet','lowBlock', 'spike']
        }
    };

    static getLevelByScore(score) {
        if (score >= this.LEVELS[5].scoreThreshold) return 5;
        if (score >= this.LEVELS[4].scoreThreshold) return 4;
        if (score >= this.LEVELS[3].scoreThreshold) return 3;
        if (score >= this.LEVELS[2].scoreThreshold) return 2;
        return 1;
    }

    static getConfig(level) {
        return this.LEVELS[level] || this.LEVELS[1];
    }
}
