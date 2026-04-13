// backend/routes/report.routes.js
const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/report.controller');

router.use(verifyToken);
router.get('/transcript/:studentId',        ctrl.getTranscript);
router.post('/transcript/:studentId/email', ctrl.emailTranscriptRequest);
router.get('/enrollment',                   requireRole('admin'), ctrl.getEnrollmentStats);
router.get('/gpa/:studentId',               ctrl.getGPAReport);

module.exports = router;
