// backend/controllers/auth.controller.js

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// POST /api/auth/login
// Body: { email, password }
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 1. Find user by email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // 2. Compare password with stored hash
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Get the role-specific profile (student_id or faculty_id)
    let profileId = null;
    let profileData = {};

    if (user.role === 'student') {
      const [rows] = await db.query(
        'SELECT student_id, student_no, first_name, last_name, programme, school, year_of_study, status FROM students WHERE user_id = ?',
        [user.user_id]
      );
      if (rows.length > 0) {
        profileId = rows[0].student_id;
        profileData = rows[0];
      }
    } else if (user.role === 'faculty') {
      const [rows] = await db.query(
        'SELECT faculty_id, employee_no, first_name, last_name, department, school, title FROM faculty WHERE user_id = ?',
        [user.user_id]
      );
      if (rows.length > 0) {
        profileId = rows[0].faculty_id;
        profileData = rows[0];
      }
    } else if (user.role === 'admin') {
      profileData = { first_name: 'Admin', last_name: 'User' };
    }

    // 4. Sign JWT
    const token = jwt.sign(
      { userId: user.user_id, role: user.role, profileId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // 5. Respond – never send password_hash to the client
    res.json({
      message: 'Login successful',
      token,
      user: {
        userId:    user.user_id,
        email:     user.email,
        role:      user.role,
        profileId,
        ...profileData
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

// GET /api/auth/me  – returns current user profile from token
async function getMe(req, res) {
  try {
    const [users] = await db.query(
      'SELECT user_id, email, role, is_active, created_at FROM users WHERE user_id = ?',
      [req.user.userId]
    );
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = { login, getMe };
