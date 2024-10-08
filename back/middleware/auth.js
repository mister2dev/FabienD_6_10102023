const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; //On récupère le token de l'en-tête Authorization en supprimant Bearer
    const decodedToken = jwt.verify(token, "RANDOM_TOKEN_SECRET");
    const userId = decodedToken.userId;
    req.auth = { userId: userId }; //On attache l'ID de l'utilisateur authentifié à l'objet req.auth pour les fonctions suivantes
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
