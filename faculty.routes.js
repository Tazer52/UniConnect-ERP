// backend/routes/faculty.routes.js
const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/faculty.controller');

router.use(verifyToken);
router.get('/',                  requireRole('admin'),           ctrl.getAllFaculty);
router.get('/:id/courses',                                       ctrl.getFacultyCourses);
router.get('/:id/students',      requireRole('admin','faculty'), ctrl.getFacultyStudents);
router.post('/:id/grades',       requireRole('admin','faculty'), ctrl.submitGrades);

module.exports = router;
