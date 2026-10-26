const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/', bookController.list);
router.post('/', authenticate, authorizeRole('vendedor'), bookController.create);
router.post('/:id/buy', authenticate, authorizeRole('comprador'), bookController.buy);

module.exports = router;