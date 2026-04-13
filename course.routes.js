// backend/routes/course.routes.js
const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/course.controller');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.use(verifyToken);
router.get('/',         ctrl.getAllCourses);
router.post('/',        requireRole('admin'), ctrl.createCourse);
router.get('/:id',      ctrl.getCourseById);
router.put('/:id',      requireRole('admin'), ctrl.updateCourse);
router.get('/:id/students',    requireRole('admin','faculty'), ctrl.getCourseStudents);
router.get('/:id/assignments', ctrl.getCourseAssignments);

// New routes for submissions
router.post('/assignments/:assignmentId/submit', upload.single('file'), ctrl.submitAssignment);
router.get('/courses/:courseId/assignments/:assignmentId/submissions', requireRole('admin','faculty'), ctrl.getAssignmentSubmissions);
router.post('/submissions/:submissionId/grade', requireRole('admin','faculty'), ctrl.gradeSubmission);

module.exports = router;
