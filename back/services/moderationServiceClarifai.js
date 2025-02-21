const Clarifai = require("clarifai");

// Initialiser Clarifai avec ta clé API
const app = new Clarifai.App({
  apiKey: "a67d62e342934c30aeb2ad29841d171c", // Remplace par ta clé API Clarifai
});

// Fonction de modération d'image
async function moderateImage(imageUrl) {
  try {
    const response = await app.models.predict(
      Clarifai.MODERATION_MODEL,
      imageUrl
    );

    // Récupérer les résultats de la modération
    const concepts = response.outputs[0].data.concepts;

    // Transformer la réponse en un objet plus lisible
    const moderationResult = concepts.reduce((acc, concept) => {
      acc[concept.name] = concept.value;
      return acc;
    }, {});

    console.log("Résultats de la modération d'image :", moderationResult);
    return moderationResult;
  } catch (error) {
    console.error(
      "Erreur lors de la modération d'image avec Clarifai :",
      error
    );
    throw new Error("Erreur lors de la modération de l'image.");
  }
}

module.exports = { moderateImage };
