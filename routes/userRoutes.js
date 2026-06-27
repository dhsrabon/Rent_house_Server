const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.put('/update-role/:id', userController.updateUserRole);

module.exports = router;