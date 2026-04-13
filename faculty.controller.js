// backend/controllers/faculty.controller.js

const db = require('../config/db');
const { calcGrade } = require('../utils/gradeCalc');
const { sendGradeNotification, sendSafe } = require('../utils/mailer');

async function getAllFaculty(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT f.*, u.email,
        (SELECT COUNT(*) FROM courses WHERE faculty_id = f.faculty_id AND is_active = TRUE) AS course_count
      FROM faculty f JOIN users u ON f.user_id = u.user_id
      ORDER BY f.last_name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch faculty.' });
  }
}

async function getFacultyCourses(req, res) {
  const facultyId = req.params.id;
  if (req.user.role === 'faculty' && req.user.profileId != facultyId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [courses] = await db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.course_id AND status = 'Active') AS enrolled_count
      FROM courses c
      WHERE c.faculty_id = ? AND c.is_active = TRUE
      ORDER BY c.course_code
    `, [facultyId]);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
}

// POST /api/faculty/:id/grades
async function submitGrades(req, res) {
  const facultyId = req.params.id;
  if (req.user.role === 'faculty' && req.user.profileId != facultyId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { course_id, grades } = req.body;
  if (!course_id || !grades || !Array.isArray(grades)) {
    return res.status(400).json({ error: 'course_id and grades array required.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get course info for email
    const [[course]] = await conn.query(
      'SELECT course_code, course_name, semester FROM courses WHERE course_id = ?',
      [course_id]
    );

    for (const g of grades) {
      const { student_id, midterm_score, final_score, assignment_score } = g;

      const [[enrollment]] = await conn.query(
        'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [student_id, course_id]
      );
      if (!enrollment) continue;

      const total = midterm_score * 0.4 + final_score * 0.4 + assignment_score * 0.2;
      const { letter, points } = calcGrade(total);

      await conn.query(`
        INSERT INTO grades (enrollment_id, midterm_score, final_score, assignment_score, total_score, grade_letter, grade_points, submitted_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          midterm_score    = VALUES(midterm_score),
          final_score      = VALUES(final_score),
          assignment_score = VALUES(assignment_score),
          total_score      = VALUES(total_score),
          grade_letter     = VALUES(grade_letter),
          grade_points     = VALUES(grade_points),
          submitted_by     = VALUES(submitted_by),
          updated_at       = CURRENT_TIMESTAMP
      `, [enrollment.enrollment_id, midterm_score, final_score, assignment_score, total.toFixed(2), letter, points, facultyId]);

      // Send grade email to student (non-blocking)
      const [[studentInfo]] = await conn.query(
        `SELECT CONCAT(s.first_name,' ',s.last_name) AS name, u.email
         FROM students s JOIN users u ON s.user_id = u.user_id
         WHERE s.student_id = ?`, [student_id]
      );
      if (studentInfo && course) {
        sendSafe(sendGradeNotification, {
          to: studentInfo.email,
          studentName: studentInfo.name,
          courseName: course.course_name,
          courseCode: course.course_code,
          gradeLetter: letter,
          gradePoints: points,
          semester: course.semester
        });
      }
    }

    await conn.commit();
    res.json({ message: `Grades submitted for ${grades.length} students.` });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to submit grades.' });
  } finally {
    conn.release();
  }
}

// GET /api/faculty/:id/students  – all students across faculty's courses
async function getFacultyStudents(req, res) {
  const facultyId = req.params.id;
  if (req.user.role === 'faculty' && req.user.profileId != facultyId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [students] = await db.query(`
  SELECT
    s.student_id,
    s.student_no,
    s.last_name,
    CONCAT(COALESCE(s.first_name,''), ' ', COALESCE(s.last_name,'')) AS name,
    COALESCE(s.programme, 'Unknown') AS programme,
    COALESCE(s.status, 'Active') AS status,
    c.course_code,
    c.course_name,
    COALESCE(g.grade_letter, NULL) AS grade_letter,
    COALESCE(g.total_score, NULL) AS total_score
  FROM courses c
  JOIN enrollments e ON c.course_id = e.course_id
  JOIN students s ON e.student_id = s.student_id
  LEFT JOIN grades g ON e.enrollment_id = g.enrollment_id
  WHERE c.faculty_id = ?
  AND c.is_active = TRUE
  GROUP BY
    s.student_id, s.student_no, s.last_name,
    s.first_name, s.programme, s.status,
    c.course_code, c.course_name,
    g.grade_letter, g.total_score
  ORDER BY s.last_name, c.course_code
`, [facultyId]);

    res.json(students);
  } catch (err) {
    console.error('getFacultyStudents error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllFaculty, getFacultyCourses, submitGrades, getFacultyStudents };
