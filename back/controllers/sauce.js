const Sauce = require("../models/sauce");
const cloudinary = require("../services/cloudinaryConfig");
const { moderateText } = require("../services/moderationServicePerspective");
const {
  validateSauceImage,
} = require("../services/moderationServiceClarifaiSauce");

// 🔥 Fonction utilitaire pour supprimer une image sur Cloudinary
async function deleteImage(imageUrl) {
  const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
  await cloudinary.uploader.destroy(publicId);
}

// ✨ Fonction réutilisable de modération du texte avec Perspective API
async function moderateTextContent(sauceObject, imageUrl, res) {
  try {
    const moderationResult = await moderateText(
      `${sauceObject.name} ${sauceObject.manufacturer} ${sauceObject.description} ${sauceObject.mainPepper}`
    );

    console.log("Résultat de la modération :", moderationResult);
    const toxicity =
      moderationResult.attributeScores.TOXICITY.summaryScore.value;

    if (toxicity > 0.3) {
      console.log("Score de toxicité :", toxicity);
      await deleteImage(imageUrl);
      res.status(400).json({
        message: "Le contenu texte est inapproprié et ne peut pas être publié.",
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("Erreur lors de la modération du texte :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la modération du contenu." });
    return false;
  }
}

// ✨ Fonction réutilisable de modération de l'image avec Clarifai
async function moderateImageContent(imageUrl, res) {
  try {
    const isValidImage = await validateSauceImage(imageUrl);

    if (!isValidImage) {
      await deleteImage(imageUrl);
      res.status(400).json({
        message: "L'image doit contenir uniquement une bouteille de sauce.",
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("Erreur lors de la validation de l'image :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la validation de l'image." });
    return false;
  }
}

// 🚀 Fonction principale pour créer une nouvelle sauce
exports.createSauce = async (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject.userId;

  const imageUrl = req.file.path;
  console.log("Image temporaire locale :", imageUrl);

  // 🕵️ Modération du texte
  const isTextValid = await moderateTextContent(sauceObject, imageUrl, res);
  if (!isTextValid) return;

  // 🌟 Modération de l'image
  const isImageValid = await moderateImageContent(imageUrl, res);
  if (!isImageValid) return;

  // 💾 Sauvegarde de la sauce après validation
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: imageUrl,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });

  try {
    await sauce.save();
    res.status(201).json({ message: "Sauce enregistrée avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la sauce :", error);
    res.status(400).json({ error });
  }
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

    const sauceObject = req.file
      ? {
          ...JSON.parse(req.body.sauce),
          imageUrl: req.file.path,
        }
      : { ...req.body };

    delete sauceObject.userId; // Suppression du userId envoyé dans la requête

    const imageUrl = req.file ? req.file.path : sauce.imageUrl;
    console.log("URL de l'image Cloudinary :", imageUrl);

    // 🕵️ Modération du texte (uniquement si texte mis à jour)
    const isTextValid = await moderateTextContent(sauceObject, imageUrl, res);
    if (!isTextValid) return;

    // 🌟 Modération de l'image (si une nouvelle image est envoyée)
    if (req.file) {
      const isImageValid = await moderateImageContent(imageUrl, res);
      if (!isImageValid) return;

      // Suppression de l'ancienne image sur Cloudinary
      await deleteImage(sauce.imageUrl);
    }

    // Mise à jour de la sauce dans la base de données
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

//--------------------------------------------------------------------------

exports.deleteSauce = async (req, res, next) => {
  try {
    // Récupération de la sauce par son ID
    const sauce = await Sauce.findOne({ _id: req.params.id });

    if (!sauce) {
      return res.status(404).json({ message: "Sauce non trouvée." });
    }

    // Vérification si l'utilisateur est bien le propriétaire de la sauce
    if (sauce.userId !== req.auth.userId) {
      return res.status(403).json({ message: "Action non autorisée." });
    }

    // Suppression de l'image sur Cloudinary
    const imageUrl = sauce.imageUrl;
    await deleteImage(imageUrl);
    console.log("Image supprimée sur Cloudinary :", imageUrl);

    // Suppression de la sauce dans la base de données
    await Sauce.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Sauce supprimée avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la sauce :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la sauce." });
  }
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
