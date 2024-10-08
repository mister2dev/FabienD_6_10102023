const Sauce = require("../models/sauce");
const fs = require("fs");

// CRUD des sauces
//-----------------------------------------

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id; // Suppression de l'id car mongodb va recréer un nouvel id pour la nouvelle sauvegarde
  const sauce = new Sauce({
    ...sauceObject,
    // Définition de l'adresse de l'image
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
    // Initialisation des likes
    likes: 0,
    dislikes: 0,
    usersLiked: [" "],
    usersdisLiked: [" "],
  });
  // Enregistrement de la nouvelle instance sauce dans la collection sauces de la bdd grâce à mongoose
  sauce
    .save()
    .then(() => res.status(201).json({ message: "Sauce enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

//------------------------------------------

exports.updateSauce = (req, res, next) => {
  // Recherche de la sauce avec l'id
  Sauce.findOne({ _id: req.params.id })
    // On crée l'objet sauce à mettre à jour
    .then((sauce) => {
      //   // Vérification si l'utilisateur authentifié est bien le créateur de la sauce
      //   if (sauce.userId !== req.auth.userId) {
      //     return res.status(403).json({ message: "Requête non autorisée" }); // L'utilisateur n'est pas le créateur
      //   }
      //   // Procéder à la mise à jour si c'est bien le créateur
      console.log("req.auth.userId :", req.auth.userId);
      const sauceObject = req.file
        ? // Si req.file existe alors on crée l'url de celui ci dans un nouvel objet pour le mettre dans la base de donnée
          {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get("host")}/images/${
              req.file.filename
            }`,
          }
        : // Sinon on recupére le reste des informations de sauce
          { ...req.body };

      // Si une nouvelle image est fournie, supprimer l'ancienne image
      if (req.file) {
        // On isole le nom du fichier à supprimer du dossier images
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, (err) => {
          if (err) console.log(err);
        });
      }

      Sauce.updateOne(
        // Les propriétés de sauceObject sont copiées dans un nouvel objet pour procéder à la mise à jour
        { _id: req.params.id },
        { ...sauceObject, _id: req.params.id }
      )
        .then(() => res.status(200).json({ message: "Sauce modifiée !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};

//---------------------------------------------

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      // Suppression de l'image et suppression de la sauce dans mongodb
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Sauce supprimé !" }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

//-------------------------------------------

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => res.status(404).json({ error }));
};

//--------------------------------------------

exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((sauces) => res.status(200).json(sauces))
    .catch((error) => res.status(400).json({ error }));
};
