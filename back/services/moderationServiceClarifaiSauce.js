const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");

const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", `Key ${process.env.CLARIFAI_API_KEY}`+ process.env.CLARIFAI_PAT);

// Fonction de validation d'image
async function validateSauceImage(imageUrl) {
  return new Promise((resolve, reject) => {
    stub.PostModelOutputs(
      {
        user_app_id: {
          user_id: "clarifai",
          app_id: "main",
        },
        model_id: "general-image-recognition",
        version_id: "aa7f35c01e0642fda5cf400f543e7c40", // Ajouté depuis l'exemple officiel
        inputs: [
          {
            data: {
              image: {
                url: imageUrl,
                allow_duplicate_url: true, // Important si tu testes plusieurs fois la même image
              },
            },
          },
        ],
      },
      metadata,
      (err, response) => {
        if (err) {
          console.error("Erreur lors de la modération d'image :", err);
          reject(err);
          return;
        }

        if (response.status.code !== 10000) {
          console.error("Erreur Clarifai :", response.status.description);
          reject("Erreur Clarifai : " + response.status.description);
          return;
        }

        console.log("Résultats de la reconnaissance d'image :");
        const concepts = response.outputs[0].data.concepts;

        // Validation : Bouteille de sauce détectée ?
        const isSauceBottle = concepts.some(
          (concept) =>
            ["bottle", "sauce", "condiment", "ketchup", "hot sauce"].includes(
              concept.name
            ) && concept.value > 0.8
        );

        resolve(isSauceBottle);
      }
    );
  });
}

module.exports = { validateSauceImage };
