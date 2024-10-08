const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

// schema de user
const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Plugin de validation d'unicité du champ email avec message d'erreur plus clair
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
