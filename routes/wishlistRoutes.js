const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

router.post('/toggle', wishlistController.toggleWishlist);
router.get('/:userId', wishlistController.getMyWishlist);
router.delete('/remove/:id', wishlistController.removeFromWishlist);

module.exports = router;