const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  // Hashage du password en 10 passes
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      // Enregistrement du user avec le mail et le password hashé
      user
        .save()
        .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  // Recherche du mail avec la méthode findOne
  console.log("req.body", req.body);

  User.findOne({ email: req.body.email })
    .then((user) => {
      // Si introuvable, envoie d'un message d'erreur 401
      if (!user) {
        return res
          .status(401)
          .json({ message: "Paire login/mot de passe incorrecte" });
      }
      // Comparaison du password entré avec le password hashé decrypté par bcrypt
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          // Si invalide, envoie d'un message d'erreur 401
          if (!valid) {
            return res
              .status(401)
              .json({ message: "Paire login/mot de passe incorrecte" });
          }

          // Création du token avec jwt et RANDOM_TOKEN_SECRET
          const token = jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
            expiresIn: "24h",
          });

          // Affichage du token dans la console
          console.log("Token JWT généré : ", token);

          // Envoi de la réponse avec l'userId et le token
          res.status(200).json({
            userId: user._id,
            token: token,
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
