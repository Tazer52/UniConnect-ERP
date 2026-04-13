// backend/controllers/report.controller.js

const db = require('../config/db');
const { calcGPA } = require('../utils/gradeCalc');
const { sendTranscriptEmail, sendSafe } = require('../utils/mailer');

async function getTranscript(req, res) {
  const studentId = req.params.studentId;
  if (req.user.role === 'student' && req.user.profileId != studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [[student]] = await db.query(`
      SELECT s.student_no, s.first_name, s.last_name,
             s.programme, s.school, s.year_of_study, s.status, u.email
      FROM students s JOIN users u ON s.user_id = u.user_id
      WHERE s.student_id = ?
    `, [studentId]);

    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const [gradeRows] = await db.query(`
      SELECT c.course_code, c.course_name, c.credits, c.semester,
             g.grade_letter, g.grade_points, g.total_score
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN grades g ON e.enrollment_id = g.enrollment_id
      WHERE e.student_id = ? AND g.grade_letter IS NOT NULL
      ORDER BY c.semester DESC, c.course_code
    `, [studentId]);

    const semesterMap = {};
    for (const row of gradeRows) {
      if (!semesterMap[row.semester]) semesterMap[row.semester] = [];
      semesterMap[row.semester].push(row);
    }

    const cgpa = calcGPA(gradeRows.map(g => ({ points: g.grade_points, credits: g.credits })));
    const totalCredits = gradeRows.reduce((sum, g) => sum + g.credits, 0);

    res.json({ student, semesters: semesterMap, cgpa, totalCredits, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate transcript.' });
  }
}

// POST /api/reports/transcript/:studentId/email  – emails the transcript request
async function emailTranscriptRequest(req, res) {
  const studentId = req.params.studentId;
  if (req.user.role === 'student' && req.user.profileId != studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [[student]] = await db.query(`
      SELECT s.student_no, s.first_name, s.last_name, s.programme, u.email
      FROM students s JOIN users u ON s.user_id = u.user_id WHERE s.student_id = ?
    `, [studentId]);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const [gradeRows] = await db.query(`
      SELECT g.grade_points, c.credits FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN grades g ON e.enrollment_id = g.enrollment_id
      WHERE e.student_id = ? AND g.grade_letter IS NOT NULL
    `, [studentId]);

    const cgpa = calcGPA(gradeRows.map(g => ({ points: g.grade_points, credits: g.credits })));

    await sendTranscriptEmail({
      to: student.email,
      studentName: `${student.first_name} ${student.last_name}`,
      studentNo: student.student_no,
      programme: student.programme,
      cgpa
    });

    res.json({ message: `Transcript request confirmation sent to ${student.email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send transcript email.' });
  }
}

async function getEnrollmentStats(req, res) {
  try {
    const [[totals]] = await db.query(`
      SELECT COUNT(*) AS total_students,
        SUM(status='Active') AS active,
        SUM(status='Probation') AS probation,
        SUM(status='Suspended') AS suspended,
        SUM(status='Graduated') AS graduated
      FROM students
    `);
    const [bySchool] = await db.query(`SELECT school, COUNT(*) AS count FROM students GROUP BY school ORDER BY count DESC`);
    const [byYear]   = await db.query(`SELECT year_of_study, COUNT(*) AS count FROM students GROUP BY year_of_study ORDER BY year_of_study`);
    const [byCourse] = await db.query(`
      SELECT c.course_code, c.course_name, c.capacity,
        COUNT(e.enrollment_id) AS enrolled
      FROM courses c LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status='Active'
      GROUP BY c.course_id ORDER BY enrolled DESC
    `);
    res.json({ totals, bySchool, byYear, byCourse });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
}

async function getGPAReport(req, res) {
  const studentId = req.params.studentId;
  if (req.user.role === 'student' && req.user.profileId != studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [rows] = await db.query(`
      SELECT c.semester, AVG(g.grade_points) AS semester_gpa
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN grades g ON e.enrollment_id = g.enrollment_id
      WHERE e.student_id = ?
      GROUP BY c.semester ORDER BY c.semester
    `, [studentId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch GPA.' });
  }
}

module.exports = { getTranscript, emailTranscriptRequest, getEnrollmentStats, getGPAReport };
