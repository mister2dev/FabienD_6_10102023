const multer = require("multer");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images"); // nom du dossier de destination
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(" ").join("_"); // remplacement des espaces par des _
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + "." + extension); // Nom de sortie du fichier
  },
});

module.exports = multer({ storage: storage }).single("image");
