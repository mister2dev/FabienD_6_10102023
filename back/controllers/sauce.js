const Sauce = require("../models/sauce");
const fs = require("fs");

// CRUD des sauces
//-----------------------------------------

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id; // Suppression de l'id car mongodb va recréer un nouvel id pour la nouvelle sauvegarde
  delete sauceObject.userId; // Suppression du userId envoyé dans la requête (pour éviter des modifications non autorisées)
  
  console.log("URL de l'image Cloudinary :", req.file); 
  
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    // Définition de l'adresse de l'image
    // imageUrl: `https://${req.get("host")}/images/${req.file.filename}`, version local
    imageUrl: req.file.path,
    // Initialisation des likes
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
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
      // Vérification si l'utilisateur authentifié est bien le propriétaire de la sauce
      if (sauce.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Action non autorisée." });
      }
      console.log("URL de l'image Cloudinary :", req.file); 

      const sauceObject = req.file
        ? // Si req.file existe alors on crée l'url de celui ci dans un nouvel objet pour le mettre dans la base de donnée
          {
            ...JSON.parse(req.body.sauce),
            // imageUrl: `https://${req.get("host")}/images/${req.file.filename}`, version local
            imageUrl: req.file.path,
          }
        : // Sinon on recupére le reste des informations de sauce
          { ...req.body };

      // Suppression du userId envoyé dans la requête (pour éviter des modifications non autorisées)
      delete sauceObject.userId;

      // Si une nouvelle image est fournie, supprimer l'ancienne image
      // if (req.file) {
      //   // On isole le nom du fichier à supprimer du dossier images
      //   const filename = sauce.imageUrl.split("/images/")[1];
      //   fs.unlink(`images/${filename}`, (err) => {
      //     if (err) console.log(err);
      //   });
      // }

            // Si une nouvelle image est fournie, supprimer l'ancienne image
      if (req.file) {
        // On isole le nom du fichier à supprimer du dossier images
        const imageUrl = sauce.imageUrl;
        const publicId =  imageUrl.split("/").slice(-2).join("/").split(".")[0];

        console.log("Suppression de l'image Cloudinary:", publicId);
        cloudinary.uploader.destroy(publicId);
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
      // Vérifier si l'utilisateur authentifié est le propriétaire de la sauce
      if (sauce.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Action non autorisée." });
      }

      // Suppression de l'image et suppression de la sauce dans mongodb
      // const filename = sauce.imageUrl.split("/images/")[1];
      // fs.unlink(`images/${filename}`, () => {
      //   Sauce.deleteOne({ _id: req.params.id })
      //     .then(() => res.status(200).json({ message: "Sauce supprimé !" }))
      //     .catch((error) => res.status(400).json({ error }));
      // });
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
