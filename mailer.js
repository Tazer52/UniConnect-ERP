// backend/utils/mailer.js
// Email notifications using nodemailer
// Run: npm install nodemailer

const nodemailer = require('nodemailer');

// Create transporter – uses Gmail by default
// For production, swap to SendGrid / Mailgun / SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,   // your Gmail: uniconnect.usiu@gmail.com
    pass: process.env.MAIL_PASS,   // Gmail App Password (not your normal password)
  }
});

// ── BASE TEMPLATE ─────────────────────────────────────────────
function baseTemplate(title, bodyHtml) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #F4F6FA; margin: 0; padding: 0; }
      .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,59,122,0.10); }
      .header { background: linear-gradient(135deg, #003B7A 0%, #005BB5 100%); padding: 32px 40px; }
      .header-logo { display: flex; align-items: center; gap: 12px; }
      .logo-icon { width: 40px; height: 40px; background: #C9922A; border-radius: 8px; display: inline-block; text-align: center; line-height: 40px; font-size: 20px; }
      .logo-text { color: #fff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
      .logo-sub { color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
      .header-title { color: #fff; font-size: 24px; font-weight: 700; margin-top: 24px; }
      .body { padding: 36px 40px; }
      .body p { color: #3A5070; font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
      .info-box { background: #EEF2F8; border-left: 4px solid #003B7A; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
      .info-box p { margin: 0; color: #0D1F3C; font-size: 14px; }
      .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #D8E0EE; font-size: 14px; }
      .info-row:last-child { border-bottom: none; }
      .info-label { color: #7A90B0; }
      .info-value { color: #0D1F3C; font-weight: 600; }
      .btn { display: inline-block; background: #003B7A; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 0; }
      .grade-pill { display: inline-block; padding: 3px 12px; border-radius: 6px; font-weight: 700; font-size: 14px; }
      .grade-A { background: #D1FAE5; color: #065F46; }
      .grade-B { background: #DBEAFE; color: #1D4ED8; }
      .grade-C { background: #FEF3C7; color: #92400E; }
      .grade-F { background: #FEE2E2; color: #991B1B; }
      .footer { background: #F4F6FA; padding: 24px 40px; text-align: center; }
      .footer p { color: #AAB8CE; font-size: 12px; margin: 4px 0; }
      .footer a { color: #003B7A; text-decoration: none; }
      table.grades-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
      table.grades-table th { background: #EEF2F8; padding: 10px 12px; text-align: left; color: #7A90B0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
      table.grades-table td { padding: 10px 12px; border-bottom: 1px solid #EEF2F8; color: #0D1F3C; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <div class="header-logo">
          <div class="logo-icon">🎓</div>
          <div>
            <div class="logo-text">UniConnect</div>
            <div class="logo-sub">USIU-Africa ERP</div>
          </div>
        </div>
        <div class="header-title">${title}</div>
      </div>
      <div class="body">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>United States International University – Africa</p>
        <p>USIU Road, Off Thika Road, P.O. Box 14634-00800, Nairobi, Kenya</p>
        <p><a href="https://www.usiu.ac.ke">www.usiu.ac.ke</a> · registrar@usiu.ac.ke · +254 730 116 000</p>
        <p style="margin-top:12px;color:#D8E0EE">This is an automated message from UniConnect ERP. Do not reply to this email.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// ── EMAIL SENDERS ─────────────────────────────────────────────

// 1. Welcome email on student registration
async function sendWelcomeEmail({ to, firstName, studentNo, programme, tempPassword }) {
  const html = baseTemplate('Welcome to USIU-Africa UniConnect', `
    <p>Dear <strong>${firstName}</strong>,</p>
    <p>Welcome to United States International University – Africa! Your student account has been created on the UniConnect ERP portal.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Student Number</span><span class="info-value">${studentNo}</span></div>
      <div class="info-row"><span class="info-label">Programme</span><span class="info-value">${programme}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${to}</span></div>
      <div class="info-row"><span class="info-label">Temporary Password</span><span class="info-value">${tempPassword}</span></div>
    </div>
    <p>Please log in and change your password immediately.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}" class="btn">Login to UniConnect →</a>
    <p style="margin-top:24px;font-size:13px;color:#AAB8CE">If you did not expect this email, please contact the Registrar's Office.</p>
  `);

  return transporter.sendMail({
    from: `"UniConnect USIU-Africa" <${process.env.MAIL_USER}>`,
    to,
    subject: `Welcome to USIU-Africa – Your UniConnect Account`,
    html
  });
}

// 2. Grade posted notification to student
async function sendGradeNotification({ to, studentName, courseName, courseCode, gradePoints, gradeLetter, semester }) {
  const gradeClass = gradeLetter.startsWith('A') ? 'grade-A' : gradeLetter.startsWith('B') ? 'grade-B' : gradeLetter.startsWith('C') ? 'grade-C' : 'grade-F';
  const html = baseTemplate('Grade Posted – UniConnect', `
    <p>Dear <strong>${studentName}</strong>,</p>
    <p>Your grade has been posted for the following course. Please log in to view your full results.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Course</span><span class="info-value">${courseCode} – ${courseName}</span></div>
      <div class="info-row"><span class="info-label">Semester</span><span class="info-value">${semester}</span></div>
      <div class="info-row"><span class="info-label">Grade</span><span class="info-value"><span class="grade-pill ${gradeClass}">${gradeLetter}</span></span></div>
      <div class="info-row"><span class="info-label">Grade Points</span><span class="info-value">${gradePoints}</span></div>
    </div>
    <p>If you believe there is an error in your grade, please contact your lecturer or visit the Registrar's Office within 7 days.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}" class="btn">View My Grades →</a>
  `);

  return transporter.sendMail({
    from: `"UniConnect USIU-Africa" <${process.env.MAIL_USER}>`,
    to,
    subject: `Grade Posted: ${courseCode} – ${gradeLetter} | USIU-Africa`,
    html
  });
}

// 3. Enrollment confirmation email
async function sendEnrollmentConfirmation({ to, studentName, courses, semester }) {
  const courseRows = courses.map(c => `
    <tr>
      <td>${c.course_code}</td>
      <td>${c.course_name}</td>
      <td>${c.credits}</td>
      <td>${c.days || '–'} ${c.time_slot || ''}</td>
      <td>${c.room || '–'}</td>
    </tr>
  `).join('');

  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

  const html = baseTemplate('Enrollment Confirmed – UniConnect', `
    <p>Dear <strong>${studentName}</strong>,</p>
    <p>Your course enrollment for <strong>${semester}</strong> has been confirmed. Below are the courses you are enrolled in:</p>
    <table class="grades-table">
      <thead>
        <tr>
          <th>Code</th><th>Course Name</th><th>Credits</th><th>Schedule</th><th>Room</th>
        </tr>
      </thead>
      <tbody>${courseRows}</tbody>
    </table>
    <div class="info-box">
      <p>Total Credits: <strong>${totalCredits}</strong> | Semester: <strong>${semester}</strong></p>
    </div>
    <p>Please ensure you attend the first lecture for all courses. Contact your academic advisor if you need to make changes.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}" class="btn">View My Schedule →</a>
  `);

  return transporter.sendMail({
    from: `"UniConnect USIU-Africa" <${process.env.MAIL_USER}>`,
    to,
    subject: `Enrollment Confirmed: ${semester} | USIU-Africa`,
    html
  });
}

// 4. Assignment due reminder
async function sendAssignmentReminder({ to, studentName, assignments }) {
  const rows = assignments.map(a => `
    <tr>
      <td>${a.course_code || ''}</td>
      <td>${a.title}</td>
      <td style="color:#B45309;font-weight:600">${new Date(a.due_date).toLocaleDateString('en-KE', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}</td>
    </tr>
  `).join('');

  const html = baseTemplate('⏰ Assignment Due Reminder', `
    <p>Dear <strong>${studentName}</strong>,</p>
    <p>This is a reminder that you have assignments due soon. Please ensure you submit them on time to avoid penalties.</p>
    <table class="grades-table">
      <thead><tr><th>Course</th><th>Assignment</th><th>Due Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p>Late submissions may not be accepted. Log in to UniConnect to submit your work.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}" class="btn">Go to My Courses →</a>
  `);

  return transporter.sendMail({
    from: `"UniConnect USIU-Africa" <${process.env.MAIL_USER}>`,
    to,
    subject: `Reminder: You have ${assignments.length} assignment(s) due soon | USIU-Africa`,
    html
  });
}

// 5. Transcript request confirmation
async function sendTranscriptEmail({ to, studentName, studentNo, programme, cgpa }) {
  const html = baseTemplate('Transcript Request Received', `
    <p>Dear <strong>${studentName}</strong>,</p>
    <p>Your request for an official academic transcript has been received and is being processed by the Registrar's Office.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Student Number</span><span class="info-value">${studentNo}</span></div>
      <div class="info-row"><span class="info-label">Programme</span><span class="info-value">${programme}</span></div>
      <div class="info-row"><span class="info-label">CGPA</span><span class="info-value">${cgpa}</span></div>
      <div class="info-row"><span class="info-label">Processing Time</span><span class="info-value">3–5 working days</span></div>
      <div class="info-row"><span class="info-label">Collection</span><span class="info-value">Registrar's Office, Main Campus</span></div>
    </div>
    <p>You will receive another email when your transcript is ready for collection. For urgent requests, contact the Registrar directly.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}" class="btn">View Unofficial Transcript →</a>
  `);

  return transporter.sendMail({
    from: `"UniConnect USIU-Africa" <${process.env.MAIL_USER}>`,
    to,
    subject: `Transcript Request Received | USIU-Africa`,
    html
  });
}

// Safe wrapper – logs errors but doesn't crash the server
async function sendSafe(fn, ...args) {
  try {
    await fn(...args);
    console.log(`📧 Email sent: ${fn.name}`);
  } catch (err) {
    console.error(`⚠️  Email failed (${fn.name}):`, err.message);
    // Don't throw – email failure should never block the main API response
  }
}

module.exports = {
  sendWelcomeEmail,
  sendGradeNotification,
  sendEnrollmentConfirmation,
  sendAssignmentReminder,
  sendTranscriptEmail,
  sendSafe
};
