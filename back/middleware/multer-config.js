// const multer = require("multer");

// const MIME_TYPES = {
//   "image/jpg": "jpg",
//   "image/jpeg": "jpg",
//   "image/png": "png",
// };

// const storage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, "images"); // nom du dossier de destination
//   },
//   filename: (req, file, callback) => {
//     const name = file.originalname.split(" ").join("_"); // remplacement des espaces par des _
//     const extension = MIME_TYPES[file.mimetype];
//     callback(null, name + Date.now() + "." + extension); // Nom de sortie du fichier
//   },
// });

// module.exports = multer({ storage: storage }).single("image");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../services/cloudinaryConfig");

// Définir le stockage sur Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hot-takes", // Dossier où stocker les images sur Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp"], // Formats autorisés
    transformation: [{ width: 500, height: 500, crop: "limit" }], // Redimensionnement optionnel
  },
});

// Initialisation de Multer

module.exports = multer({ storage: storage }).single("image");
