const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const sauceCtrl = require('../controllers/sauce');
const likeCtrl = require('../controllers/like');

router.post('/', auth, multer, sauceCtrl.createSauce);
router.post('/:id/like', auth, likeCtrl.likeSauce);
router.put('/:id', auth, multer, sauceCtrl.updateSauce);
router.delete('/:id', auth, sauceCtrl.deleteSauce);
router.get('/:id',auth, sauceCtrl.getOneSauce);
router.get('/', auth, sauceCtrl.getAllSauce);

module.exports = router;