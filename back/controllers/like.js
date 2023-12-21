const Sauce = require('../models/sauce');

exports.likeSauce = (req, res, next) => {
    if (req.body.like === 1) {

        Sauce.updateOne(
            { _id: req.params.id },
            { $push: { usersLiked: req.body.userId }, $inc: {likes: +1 }}
        )
        .then(() => res.status(200).json({ message: "Like ajouté !" }))
        .catch((error) => res.status(400).json({ error }));

    } else if (req.body.like === -1) {

        Sauce.updateOne(
            { _id: req.params.id },
            { $push: { usersDisliked: req.body.userId }, $inc: { dislikes: +1 }}
        )
          .then(() => res.status(200).json({ message: "Dislike ajouté !" }))
          .catch((error) => res.status(400).json({ error }));

    } else {

        Sauce.findOne({ _id: req.params.id })
            .then((sauce) => {
    
                if (sauce.usersLiked.includes(req.body.userId)) {
    
                    Sauce.updateOne(
                        { _id: req.params.id },
            
                        { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 }}
                    )
                        .then(() => res.status(200).json({ message: "Like retiré !" }))
                        .catch((error) => res.status(400).json({ error }));
    
                } else if (sauce.usersDisliked.includes(req.body.userId)) {
                    Sauce.updateOne(
                        { _id: req.params.id },
                        { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 }}
                    )
                        .then(() => res.status(200).json({ message: "Dislike retiré !" }))
                        .catch((error) => res.status(400).json({ error }));
                }
                })
            .catch((error) => res.status(400).json({ error }));
    }
};