const Sauce = require('../models/sauce');
const fs = require('fs');

//-----------------------------------------

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [' '],
        usersdisLiked: [' '],
        });
    sauce.save()
        .then(() => res.status(201).json({ message: "Sauce enregistré !" }))
        .catch((error) => res.status(400).json({ error }));
};

//------------------------------------------

exports.updateSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            const filename = sauce.imageUrl.split("/images/")[1];
            fs.unlink(`images/${filename}`, () => {
                const sauceObject = req.file ?{
                    ...JSON.parse(req.body.sauce),
                    imageUrl: `${req.protocol}://${req.get("host")}/images/${ req.file.filename }`,
                    } : { ...req.body };

            Sauce.updateOne({ _id: req.params.id },{ ...sauceObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: "Sauce modifié !" }))
                .catch((error) => res.status(400).json({ error }));
            });
        })
        .catch((error) => res.status(400).json({ error }));
};

//---------------------------------------------

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
              const filename = sauce.imageUrl.split("/images/")[1];
              fs.unlink(`images/${filename}`, () => {
                  Sauce.deleteOne({ _id: req.params.id })
                      .then(() => res.status(200).json({ message: "Sauce supprimé !" }))
                      .catch((error) => res.status(400).json({ error }));
              });  
        })
        .catch((error) => res.status(500).json({ error }));
};

//-------------------------------------------

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }));
}

//--------------------------------------------

exports.getAllSauce = (req, res, next) => {
    Sauce.find()
      .then(sauces => res.status(200).json(sauces))
      .catch(error => res.status(400).json({ error }));
  }