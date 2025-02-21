// const fs = require("fs");
const Sauce = require("../models/sauce");
const cloudinary = require("../services/cloudinaryConfig");
const { moderateText } = require("../services/moderationServicePerspective"); // Import du service Perspective
const {
  validateSauceImage,
} = require("../services/moderationServiceClarifaiSauce");

// CRUD des sauces
//-----------------------------------------

exports.createSauce = async (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id; // Suppression de l'id car mongodb va recréer un nouvel id pour la nouvelle sauvegarde
  delete sauceObject.userId; // Suppression du userId envoyé dans la requête (pour éviter des modifications non autorisées)
  const imageUrl = req.file.path;

  console.log("URL de l'image Cloudinary :", req.file);

  // Modération du texte avec Perspective API----------------------------
  try {
    const moderationResult = await moderateText(
      sauceObject.name +
        " " +
        sauceObject.manufacturer +
        " " +
        sauceObject.description +
        " " +
        sauceObject.mainPepper
    );
    console.log("Résultat de la modération :", moderationResult);

    // Analyse du score de toxicité
    const toxicity =
      moderationResult.attributeScores.TOXICITY.summaryScore.value;
    if (toxicity > 0.3) {
      console.log("Score de toxicité :", toxicity);

      // Supprimer l'image sur Cloudinary si la modération échoue
      const imageUrl = req.file.path;
      const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);

      return res.status(400).json({
        message: "Le contenu est inapproprié et ne peut pas être publié.",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur lors de la modération du contenu." });
  }

  // 🌟 Validation de l'image avec Clarifai
  try {
    const isValidImage = await validateSauceImage(imageUrl);

    if (!isValidImage) {
      const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);

      return res.status(400).json({
        message: "L'image doit contenir uniquement une bouteille de sauce.",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur lors de la validation de l'image." });
  }

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

exports.updateSauce = async (req, res, next) => {
  try {
    // Recherche de la sauce avec l'id
    const sauce = await Sauce.findOne({ _id: req.params.id });

    // Vérification si l'utilisateur authentifié est bien le propriétaire de la sauce
    if (sauce.userId !== req.auth.userId) {
      return res.status(403).json({ message: "Action non autorisée." });
    }

    console.log("URL de l'image Cloudinary :", req.file);

    const sauceObject = req.file
      ? {
          ...JSON.parse(req.body.sauce),
          imageUrl: req.file.path,
        }
      : { ...req.body };

    delete sauceObject.userId; // Suppression du userId envoyé dans la requête

    // 🌟 **Validation de l'image avec Clarifai** 🌟
    if (req.file) {
      const imageUrl = req.file.path;

      try {
        const isValidImage = await validateSauceImage(imageUrl);

        if (!isValidImage) {
          // Supprimer l'image sur Cloudinary si la validation échoue
          const publicId = imageUrl
            .split("/")
            .slice(-2)
            .join("/")
            .split(".")[0];
          await cloudinary.uploader.destroy(publicId);

          return res.status(400).json({
            message: "L'image doit contenir uniquement une bouteille de sauce.",
          });
        }
      } catch (error) {
        console.error("Erreur lors de la validation de l'image :", error);
        return res
          .status(500)
          .json({ message: "Erreur lors de la validation de l'image." });
      }
    }

    // Modération du texte avec Perspective API-----------------------------------
    try {
      const moderationResult = await moderateText(
        sauceObject.name +
          " " +
          sauceObject.manufacturer +
          " " +
          sauceObject.description +
          " " +
          sauceObject.mainPepper
      );

      console.log("Résultat de la modération :", moderationResult);

      if (moderationResult && moderationResult.attributeScores) {
        const toxicity =
          moderationResult.attributeScores.TOXICITY.summaryScore.value;

        console.log("Score de toxicité :", toxicity);

        if (toxicity > 0.3) {
          return res.status(400).json({
            message: "Le contenu est inapproprié et ne peut pas être publié.",
          });
        }
      } else {
        console.error("Réponse de modération inattendue :", moderationResult);
        return res.status(500).json({
          message:
            "Erreur lors de la modération du contenu : réponse inattendue.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la modération du contenu :", error);
      return res
        .status(500)
        .json({ message: "Erreur lors de la modération du contenu." });
    }

    // Si une nouvelle image est fournie, supprimer l'ancienne image
    if (req.file) {
      const imageUrl = sauce.imageUrl;
      const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Sauce.updateOne(
      { _id: req.params.id },
      { ...sauceObject, _id: req.params.id }
    );

    res.status(200).json({ message: "Sauce modifiée !" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la sauce :", error);
    res.status(400).json({ error });
  }
};

//---------------------------------------------

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      // Vérifier si l'utilisateur authentifié est le propriétaire de la sauce
      if (sauce.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Action non autorisée." });
      }

      // Récupération de l'identifiant public de l'image sur Cloudinary
      const imageUrl = sauce.imageUrl;
      const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
      console.log("Suppression de l'image Cloudinary :", publicId);

      // Suppression de l'image sur Cloudinary
      cloudinary.uploader.destroy(publicId, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Sauce supprimée !" }))
          .catch((error) => res.status(400).json({ error }));
      });

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
