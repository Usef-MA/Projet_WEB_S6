const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "aaro_gaming_secret_2026";

// ─── Middleware ───────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origin (ex: curl, Postman, même domaine)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS bloqué : origine non autorisée (${origin})`));
        }
    },
    credentials: true
}));
app.use(express.json());

// ─── MongoDB ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => { console.error("❌ Erreur MongoDB :", err); process.exit(1); });

// ─── Modèles ──────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    prenom:    { type: String, required: true, trim: true },
    nom:       { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true }
}, { timestamps: true });

const scoreSchema = new mongoose.Schema({
    user_id:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    prenom:   { type: String, required: true },
    nom:      { type: String, required: true },
    jeu:      { type: String, required: true },
    score:    { type: Number, required: true }
}, { timestamps: true });

const User  = mongoose.model("User",  userSchema);
const Score = mongoose.model("Score", scoreSchema);

// ─── Auth middleware ──────────────────────────────────────────────────────────
function authRequired(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token manquant" });
    }
    try {
        req.user = jwt.verify(header.slice(7), JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Token invalide" });
    }
}

// ─── Routes auth ─────────────────────────────────────────────────────────────
app.post("/auth/register", async (req, res) => {
    try {
        const { prenom, nom, email, password } = req.body;
        if (!prenom || !nom || !email || !password) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Mot de passe trop court (min. 6 caractères)" });
        }
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ error: "Cette adresse email est déjà utilisée" });
        }
        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({ prenom, nom, email, password: hashed });
        const token = jwt.sign({ id: user._id, prenom: user.prenom, nom: user.nom, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ token, user: { id: user._id, prenom: user.prenom, nom: user.nom, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email et mot de passe requis" });
        }
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }
        const token = jwt.sign({ id: user._id, prenom: user.prenom, nom: user.nom, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user._id, prenom: user.prenom, nom: user.nom, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.get("/auth/me", authRequired, (req, res) => {
    res.json({ user: req.user });
});

// ─── Routes scores ────────────────────────────────────────────────────────────
// Sauvegarder un score
app.post("/scores", authRequired, async (req, res) => {
    try {
        const { jeu, score } = req.body;
        if (!jeu || score === undefined) {
            return res.status(400).json({ error: "jeu et score requis" });
        }
        await Score.create({
            user_id: req.user.id,
            prenom:  req.user.prenom,
            nom:     req.user.nom,
            jeu,
            score:   Math.floor(score)
        });
        res.status(201).json({ message: "Score sauvegardé" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Leaderboard : meilleur score par joueur pour un jeu donné
app.get("/scores/:jeu", async (req, res) => {
    try {
        const leaderboard = await Score.aggregate([
            { $match: { jeu: req.params.jeu } },
            { $sort: { score: -1 } },
            {
                $group: {
                    _id: "$user_id",
                    prenom: { $first: "$prenom" },
                    nom:    { $first: "$nom" },
                    score:  { $max: "$score" }
                }
            },
            { $sort: { score: -1 } },
            { $limit: 20 },
            { $project: { _id: 0, prenom: 1, nom: 1, score: 1 } }
        ]);
        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(port, () => console.log(`🚀 Serveur sur le port ${port}`));
