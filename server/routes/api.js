const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const requestController = require('../controllers/requestController');
const { Team, User } = require('../models');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Auth Routes
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getMe);


// Equipment Routes
router.get('/equipment', equipmentController.getAllEquipment);
router.post('/equipment', equipmentController.createEquipment);
router.get('/equipment/:id', equipmentController.getEquipmentById);
router.get('/equipment/:id/defaults', equipmentController.getEquipmentDefaults);
router.get('/equipment/:id/open-requests-count', equipmentController.getOpenRequestCount);

// Request Routes
router.get('/requests', protect, requestController.getAllRequests);
router.post('/requests', protect, requestController.createRequest);
router.put('/requests/:id/status', protect, requestController.updateRequestStage);

// Simple Team/User Routes for dropdowns
router.get('/teams', async (req, res) => {
    const teams = await Team.find();
    res.json(teams);
});
router.post('/teams', protect, async (req, res) => res.json(await Team.create(req.body)));

router.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});
router.post('/users', protect, async (req, res) => res.json(await User.create(req.body)));

module.exports = router;
