// backend/controllers/student.controller.js
// Fully wired – real DB queries + email notifications

const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail, sendEnrollmentConfirmation, sendSafe } = require('../utils/mailer');

// GET /api/students
async function getAllStudents(req, res) {
  try {
    const { school, year, status, search } = req.query;
    let query = `
      SELECT s.student_id, s.student_no, s.first_name, s.last_name,
             s.programme, s.school, s.year_of_study, s.status,
             s.phone, s.nationality, s.created_at, u.email
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    if (school)  { query += ' AND s.school = ?';        params.push(school); }
    if (year)    { query += ' AND s.year_of_study = ?';  params.push(year); }
    if (status)  { query += ' AND s.status = ?';         params.push(status); }
    if (search)  {
      query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_no LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY s.created_at DESC LIMIT 100';
    const [students] = await db.query(query, params);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
}

// GET /api/students/:id
async function getStudentById(req, res) {
  try {
    const studentId = req.params.id;
    if (req.user.role === 'student' && req.user.profileId != studentId) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const [rows] = await db.query(`
      SELECT s.*, u.email
      FROM students s JOIN users u ON s.user_id = u.user_id
      WHERE s.student_id = ?
    `, [studentId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Student not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
}

// POST /api/students  (admin only)
async function createStudent(req, res) {
  const { email, password, first_name, last_name, phone, dob, gender,
          nationality, programme, school, year_of_study } = req.body;

  if (!email || !password || !first_name || !last_name || !programme || !school) {
    return res.status(400).json({ error: 'Required fields: email, password, first_name, last_name, programme, school.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const password_hash = await bcrypt.hash(password, 10);

    const [userResult] = await conn.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, "student")',
      [email, password_hash]
    );
    const userId = userResult.insertId;

    const year = new Date().getFullYear().toString().slice(-2);
    const [[{ count }]] = await conn.query('SELECT COUNT(*) as count FROM students');
    const studentNo = `${year}${String(count + 1001).slice(-4)}`;

    const [studentResult] = await conn.query(`
      INSERT INTO students (user_id, student_no, first_name, last_name, phone, dob, gender, nationality, programme, school, year_of_study)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, studentNo, first_name, last_name, phone, dob, gender, nationality || 'Kenyan', programme, school, year_of_study || 1]);

    await conn.commit();

    // Send welcome email (non-blocking)
    sendSafe(sendWelcomeEmail, {
      to: email,
      firstName: first_name,
      studentNo,
      programme,
      tempPassword: password
    });

    res.status(201).json({
      message: 'Student registered successfully.',
      student_no: studentNo,
      student_id: studentResult.insertId
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create student.' });
  } finally {
    conn.release();
  }
}

// PUT /api/students/:id
async function updateStudent(req, res) {
  const studentId = req.params.id;
  if (req.user.role === 'student' && req.user.profileId != studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { first_name, last_name, phone, dob, gender, nationality, year_of_study, status } = req.body;
  try {
    await db.query(`
      UPDATE students SET
        first_name    = COALESCE(?, first_name),
        last_name     = COALESCE(?, last_name),
        phone         = COALESCE(?, phone),
        dob           = COALESCE(?, dob),
        gender        = COALESCE(?, gender),
        nationality   = COALESCE(?, nationality),
        year_of_study = COALESCE(?, year_of_study),
        status        = COALESCE(?, status)
      WHERE student_id = ?
    `, [first_name, last_name, phone, dob, gender, nationality, year_of_study, status, studentId]);
    res.json({ message: 'Student updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update.' });
  }
}

// GET /api/students/:id/grades
async function getStudentGrades(req, res) {
  const studentId = req.params.id;
  if (req.user.role === 'student' && req.user.profileId != studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [grades] = await db.query(`
      SELECT c.course_code, c.course_name, c.credits, c.semester,
             g.midterm_score, g.final_score, g.assignment_score,
             g.total_score, g.grade_letter, g.grade_points, g.submitted_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN grades g ON e.enrollment_id = g.enrollment_id
      WHERE e.student_id = ?
      ORDER BY c.semester DESC, c.course_code
    `, [studentId]);
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grades.' });
  }
}

// GET /api/students/:id/courses
async function getStudentCourses(req, res) {
  const studentId = req.params.id;
  if (req.user.role === 'student' && req.user.profileId != studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [courses] = await db.query(`
      SELECT c.course_id, c.course_code, c.course_name, c.credits,
             c.semester, c.room, c.days, c.time_slot,
             CONCAT(f.title, ' ', f.first_name, ' ', f.last_name) AS faculty_name,
             e.status AS enrollment_status, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
      WHERE e.student_id = ? AND e.status = 'Active'
      ORDER BY c.course_code
    `, [studentId]);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
}

// POST /api/students/:id/enroll
async function enrollInCourse(req, res) {
  const studentId = req.params.id;
  const rawCourseIds = req.body.course_ids || req.body.course_id;
  const course_ids = Array.isArray(rawCourseIds) ? rawCourseIds : (rawCourseIds ? [rawCourseIds] : []);
  const { semester } = req.body; // accepts array of course_ids

  if (req.user.role === 'student' && req.user.profileId != studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
    return res.status(400).json({ error: 'course_ids array is required.' });
  }

  const sem = semester || 'Fall 2024/2025';
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const enrolled = [];

    for (const course_id of course_ids) {
      const [[course]] = await conn.query(
        `SELECT c.*, (SELECT COUNT(*) FROM enrollments WHERE course_id = ? AND status='Active') AS enrolled_count
         FROM courses c WHERE c.course_id = ?`,
        [course_id, course_id]
      );
      if (!course) continue;
      if (course.enrolled_count >= course.capacity) continue;

      await conn.query(
        'INSERT IGNORE INTO enrollments (student_id, course_id, semester) VALUES (?, ?, ?)',
        [studentId, course_id, sem]
      );
      enrolled.push(course);
    }

    await conn.commit();

    // Send enrollment confirmation email
    if (enrolled.length > 0) {
      const [[student]] = await db.query(
        `SELECT s.first_name, s.last_name, u.email
         FROM students s JOIN users u ON s.user_id = u.user_id
         WHERE s.student_id = ?`, [studentId]
      );
      if (student) {
        sendSafe(sendEnrollmentConfirmation, {
          to: student.email,
          studentName: `${student.first_name} ${student.last_name}`,
          courses: enrolled,
          semester: sem
        });
      }
    }

    res.status(201).json({ message: `Enrolled in ${enrolled.length} course(s).`, enrolled });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Enrollment failed.' });
  } finally {
    conn.release();
  }
}

// GET /api/students/:id/submissions
async function getStudentSubmissions(req, res) {
  const studentId = req.params.id;
  if (req.user.role === 'student' && req.user.profileId != studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [submissions] = await db.query(`
      SELECT s.submission_id, s.assignment_id, s.file_path, s.file_name, s.submitted_at,
             s.grade, s.feedback, s.graded_at,
             a.title AS assignment_title, a.due_date, a.max_score,
             c.course_code, c.course_name
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      JOIN courses c ON a.course_id = c.course_id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
    `, [studentId]);
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
}

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, getStudentGrades, getStudentCourses, enrollInCourse, getStudentSubmissions };
