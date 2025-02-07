const express = require('express');
const router = express.Router();
const { 
  signup, 
  login, 
  logout, 
  protect 
} = require('../controllers/userController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.get('/protected', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router; 