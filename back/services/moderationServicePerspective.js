const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function moderateText(text) {
  const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_TOKEN}`;

  const body = {
    comment: { text: text },
    languages: ["fr"], // Langue du texte
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {},
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erreur lors de l'analyse du commentaire :", error.message);
    throw new Error("Erreur lors de la modération de contenu");
  }
}

module.exports = { moderateText };
