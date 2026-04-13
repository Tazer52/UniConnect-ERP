// backend/controllers/course.controller.js

const db = require('../config/db');

// GET /api/courses
async function getAllCourses(req, res) {
  try {
    const { semester, school } = req.query;
    let query = `
      SELECT c.*,
        CONCAT(f.title, ' ', f.first_name, ' ', f.last_name) AS faculty_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.course_id AND status = 'Active') AS enrolled_count
      FROM courses c
      LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
      WHERE c.is_active = TRUE
    `;
    const params = [];
    if (semester) { query += ' AND c.semester = ?'; params.push(semester); }
    if (school)   { query += ' AND c.school = ?';   params.push(school); }
    query += ' ORDER BY c.course_code';

    const [courses] = await db.query(query, params);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
}

// GET /api/courses/:id
async function getCourseById(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT c.*,
        CONCAT(f.title, ' ', f.first_name, ' ', f.last_name) AS faculty_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.course_id AND status = 'Active') AS enrolled_count
      FROM courses c
      LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
      WHERE c.course_id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Course not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
}

// POST /api/courses  (admin only)
async function createCourse(req, res) {
  const { course_code, course_name, school, faculty_id, semester, capacity, room, days, time_slot } = req.body;
  if (!course_code || !course_name || !school || !semester || !days) {
    return res.status(400).json({ error: 'course_code, course_name, school, semester and days are required.' });
  }

  const allowedDays = ['Mon/Wed', 'Tue/Thu', 'Fri', 'Sat'];
  const normalizedDays = String(days).trim();
  if (!allowedDays.includes(normalizedDays)) {
    return res.status(400).json({ error: 'Days must be one of: Mon/Wed, Tue/Thu, Fri, Sat.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO courses (course_code, course_name, credits, school, faculty_id, semester, capacity, room, days, time_slot) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [course_code, course_name, 3, school, faculty_id || null, semester, capacity || 45, room, normalizedDays, time_slot]
    );
    res.status(201).json({ message: 'Course created.', course_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Course code already exists.' });
    res.status(500).json({ error: 'Failed to create course.' });
  }
}

// PUT /api/courses/:id  (admin only)
async function updateCourse(req, res) {
  const { course_name, faculty_id, capacity, room, days, time_slot, is_active } = req.body;

  if (days !== undefined && days !== null) {
    const allowedDays = ['Mon/Wed', 'Tue/Thu', 'Fri', 'Sat'];
    const normalizedDays = String(days).trim();
    if (!allowedDays.includes(normalizedDays)) {
      return res.status(400).json({ error: 'Days must be one of: Mon/Wed, Tue/Thu, Fri, Sat.' });
    }
    req.body.days = normalizedDays;
  }

  let query = `
      UPDATE courses SET
        course_name = COALESCE(?, course_name),
        credits     = 3,
        capacity    = COALESCE(?, capacity),
        room        = COALESCE(?, room),
        days        = COALESCE(?, days),
        time_slot   = COALESCE(?, time_slot),
        is_active   = COALESCE(?, is_active)`;
  const params = [course_name, capacity, room, req.body.days, time_slot, is_active];

  if (Object.prototype.hasOwnProperty.call(req.body, 'faculty_id')) {
    query += ', faculty_id = ?';
    params.push(faculty_id || null);
  }

  query += ' WHERE course_id = ?';
  params.push(req.params.id);

  try {
    await db.query(query, params);
    res.json({ message: 'Course updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course.' });
  }
}

// GET /api/courses/:id/students  (faculty or admin)
async function getCourseStudents(req, res) {
  try {
    const [students] = await db.query(`
      SELECT s.student_id, s.student_no,
             CONCAT(s.first_name, ' ', s.last_name) AS name,
             s.programme, e.status AS enrollment_status, e.enrolled_at,
             g.total_score, g.grade_letter
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      LEFT JOIN grades g ON e.enrollment_id = g.enrollment_id
      WHERE e.course_id = ?
      ORDER BY s.last_name
    `, [req.params.id]);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
}

// GET /api/courses/:id/assignments
async function getCourseAssignments(req, res) {
  try {
    const [assignments] = await db.query(
      'SELECT * FROM assignments WHERE course_id = ? ORDER BY due_date',
      [req.params.id]
    );
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
}

// POST /api/courses/assignments/:assignmentId/submit
async function submitAssignment(req, res) {
  const { assignmentId } = req.params;
  const studentId = req.user.profileId; // profileId is student_id for students

  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can submit assignments.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    // Check if assignment exists and get course_id
    const [assignment] = await db.query('SELECT course_id FROM assignments WHERE assignment_id = ?', [assignmentId]);
    if (assignment.length === 0) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    const courseId = assignment[0].course_id;

    // Check if student is enrolled in the course
    const [enrollment] = await db.query(
      'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ? AND status = "Active"',
      [studentId, courseId]
    );
    if (enrollment.length === 0) {
      return res.status(403).json({ error: 'You are not enrolled in this course.' });
    }

    // Check if already submitted
    const [existing] = await db.query(
      'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already submitted this assignment.' });
    }

    // Insert submission
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const [result] = await db.query(
      'INSERT INTO submissions (assignment_id, student_id, file_path, file_name) VALUES (?, ?, ?, ?)',
      [assignmentId, studentId, filePath, fileName]
    );

    res.status(201).json({ message: 'Assignment submitted successfully.', submission_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit assignment.' });
  }
}

// GET /api/courses/:courseId/assignments/:assignmentId/submissions
async function getAssignmentSubmissions(req, res) {
  const { courseId, assignmentId } = req.params;

  try {
    // Verify assignment belongs to course
    const [assignment] = await db.query(
      'SELECT * FROM assignments WHERE assignment_id = ? AND course_id = ?',
      [assignmentId, courseId]
    );
    if (assignment.length === 0) {
      return res.status(404).json({ error: 'Assignment not found for this course.' });
    }

    // Get submissions with student info
    const [submissions] = await db.query(`
      SELECT s.submission_id, s.file_path, s.file_name, s.submitted_at, s.grade, s.feedback,
             st.student_no, CONCAT(st.first_name, ' ', st.last_name) AS student_name
      FROM submissions s
      JOIN students st ON s.student_id = st.student_id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC
    `, [assignmentId]);

    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
}

// POST /api/courses/submissions/:submissionId/grade
async function gradeSubmission(req, res) {
  const { submissionId } = req.params;
  const { grade, feedback } = req.body;
  const gradedBy = req.user.profileId; // profileId is faculty_id for faculty

  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only faculty can grade submissions.' });
  }

  if (grade !== undefined && (grade < 0 || grade > 100)) {
    return res.status(400).json({ error: 'Grade must be between 0 and 100.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE submissions SET grade = ?, feedback = ?, graded_by = ?, graded_at = NOW() WHERE submission_id = ?',
      [grade, feedback, gradedBy, submissionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    res.json({ message: 'Submission graded successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to grade submission.' });
  }
}

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, getCourseStudents, getCourseAssignments, submitAssignment, getAssignmentSubmissions, gradeSubmission };
