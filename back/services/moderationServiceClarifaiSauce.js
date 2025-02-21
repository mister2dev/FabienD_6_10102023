const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");

const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key a67d62e342934c30aeb2ad29841d171c");

// Fonction de validation d'image
async function validateSauceImage(imageUrl) {
  return new Promise((resolve, reject) => {
    stub.PostModelOutputs(
      {
        model_id: "general-image-recognition",
        inputs: [{ data: { image: { url: imageUrl } } }],
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
