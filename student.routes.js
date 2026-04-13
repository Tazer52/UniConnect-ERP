// backend/routes/student.routes.js
const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/student.controller');

// All student routes require a valid token
router.use(verifyToken);

router.get('/',                      requireRole('admin'), ctrl.getAllStudents);
router.post('/',                     requireRole('admin'), ctrl.createStudent);
router.get('/:id',                                         ctrl.getStudentById);
router.put('/:id',                                         ctrl.updateStudent);
router.get('/:id/grades',                                  ctrl.getStudentGrades);
router.get('/:id/courses',                                 ctrl.getStudentCourses);
router.post('/:id/enroll',                                 ctrl.enrollInCourse);
router.get('/:id/submissions',                             ctrl.getStudentSubmissions);

module.exports = router;
