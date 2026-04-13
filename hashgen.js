// hashgen.js
// Run this once to generate correct password hashes for the seed file
// Usage: node hashgen.js

const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);

  console.log('\n✅ Generated hash for "password123":\n');
  console.log(hash);
  console.log('\n📋 Copy the SQL below and run it in MySQL:\n');

  console.log(`-- ============================================================
--  Run this in MySQL to fix the user passwords
--  mysql -u root -p uniconnect_db
--  Then paste this SQL and press Enter
-- ============================================================

USE uniconnect_db;

-- Delete existing users and re-insert with correct hashes
DELETE FROM grades;
DELETE FROM enrollments;
DELETE FROM assignments;
DELETE FROM schedules;
DELETE FROM courses;
DELETE FROM students;
DELETE FROM faculty;
DELETE FROM users;

-- Re-insert users with real bcrypt hash for "password123"
INSERT INTO users (email, password_hash, role) VALUES
('admin@usiu.ac.ke',       '${hash}', 'admin'),
('s.odhiambo@usiu.ac.ke',  '${hash}', 'faculty'),
('p.ngugi@usiu.ac.ke',     '${hash}', 'faculty'),
('a.mwenda@usiu.ac.ke',    '${hash}', 'faculty'),
('l.nduta@usiu.ac.ke',     '${hash}', 'faculty'),
('e.wambui@usiu.ac.ke',    '${hash}', 'faculty'),
('j.mwangi@usiu.ac.ke',    '${hash}', 'student'),
('b.otieno@usiu.ac.ke',    '${hash}', 'student'),
('f.hassan@usiu.ac.ke',    '${hash}', 'student'),
('k.kariuki@usiu.ac.ke',   '${hash}', 'student'),
('d.achieng@usiu.ac.ke',   '${hash}', 'student'),
('m.kimani@usiu.ac.ke',    '${hash}', 'student'),
('a.ali@usiu.ac.ke',       '${hash}', 'student'),
('m.oduor@usiu.ac.ke',     '${hash}', 'student'),
('e.kioko@usiu.ac.ke',     '${hash}', 'student'),
('n.murage@usiu.ac.ke',    '${hash}', 'student'),
('r.kinoti@usiu.ac.ke',    '${hash}', 'student'),
('s.nyambura@usiu.ac.ke',  '${hash}', 'student'),
('l.njoroge@usiu.ac.ke',   '${hash}', 'faculty'),
('b.mutua@usiu.ac.ke',     '${hash}', 'faculty'),
('p.mwangi@usiu.ac.ke',    '${hash}', 'student'),
('l.wanjiru@usiu.ac.ke',   '${hash}', 'student'),
('d.ouma@usiu.ac.ke',      '${hash}', 'student');

-- Faculty
INSERT INTO faculty (user_id, employee_no, first_name, last_name, phone, department, school, title) VALUES
(2, 'FAC-0042', 'Samuel',   'Odhiambo', '+254711000001', 'Computer Science',    'SST', 'Dr.'),
(3, 'FAC-0031', 'Patricia', 'Ngugi',    '+254711000002', 'Data Science',        'SST', 'Dr.'),
(4, 'FAC-0018', 'Albert',   'Mwenda',   '+254711000003', 'Information Systems', 'SST', 'Prof.'),
(5, 'FAC-0025', 'Grace',    'Nduta',    '+254711000004', 'Management',          'CSB', 'Dr.'),
(6, 'FAC-0072', 'Emily',    'Wambui',   '+254711000005', 'Psychology',          'HSS', 'Dr.'),
(7, 'FAC-0083', 'Lucy',     'Njoroge',  '+254711000006', 'Marketing',           'CSB', 'Dr.'),
(8, 'FAC-0090', 'Brian',    'Mutua',    '+254711000007', 'Media Studies',       'CCA', 'Dr.');

-- Students
INSERT INTO students (user_id, student_no, first_name, last_name, phone, dob, gender, nationality, programme, school, year_of_study, status) VALUES
(7,  '162458', 'Jane',      'Mwangi',  '+254712345678', '2002-03-14', 'Female', 'Kenyan', 'BSc Software Engineering',        'SST', 3, 'Active'),
(8,  '161901', 'Brian',     'Otieno',  '+254723456789', '2003-07-22', 'Male',   'Kenyan', 'BSc Data Science & Analytics',    'SST', 2, 'Active'),
(9,  '163210', 'Fatuma',    'Hassan',  '+254734567890', '2001-11-05', 'Female', 'Somali', 'BA International Relations',       'HSS', 4, 'Active'),
(10, '160055', 'Kevin',     'Kariuki', '+254745678901', '2004-01-18', 'Male',   'Kenyan', 'BSc Finance',                      'CSB', 1, 'Active'),
(11, '161744', 'Diana',     'Achieng', '+254756789012', '2002-09-30', 'Female', 'Kenyan', 'MA Clinical Psychology',           'HSS', 2, 'Active'),
(12, '162003', 'Moses',     'Kimani',  '+254767890123', '2002-05-12', 'Male',   'Kenyan', 'BSc Applied Computer Technology', 'SST', 3, 'Probation'),
(13, '163412', 'Aisha',     'Ali',     '+254712345679', '2003-05-26', 'Female', 'Kenyan', 'BSc Business Analytics',           'CSB', 2, 'Active'),
(14, '163821', 'Michael',   'Oduor',   '+254723456780', '2002-12-14', 'Male',   'Kenyan', 'BSc Information Systems',          'SST', 4, 'Active'),
(15, '164200', 'Evelyn',   'Kioko',   '+254798001234', '2003-04-16', 'Female', 'Kenyan', 'BSc Computer Science',             'SST', 2, 'Active'),
(16, '164321', 'Nancy',    'Murage',  '+254798002345', '2004-02-02', 'Female', 'Kenyan', 'BA Journalism',                    'CCA', 1, 'Active'),
(17, '164502', 'Richard',  'Kinoti',  '+254798003456', '2003-08-09', 'Male',   'Kenyan', 'BSc Pharmaceutical Sciences',      'SPHS', 2, 'Active'),
(18, '164623', 'Susan',    'Nyambura', '+254798004567','2003-10-19', 'Female', 'Kenyan', 'BSc Business Analytics',           'CSB', 3, 'Active'),
(19, '165000',  'Peter',    'Mwangi',  '+254712345680', '2002-08-12', 'Male',   'Kenyan', 'BBA Marketing',                   'CSB', 2, 'Active'),
(20, '165121',  'Lilian',   'Wanjiru', '+254712345681', '2003-02-07', 'Female', 'Kenyan', 'BA Media & Communication',         'CCA', 3, 'Active'),
(21, '165232',  'David',    'Ouma',    '+254712345682', '2002-10-31', 'Male',   'Kenyan', 'BSc Global Health and Development','SPHS', 3, 'Active');

-- Courses
INSERT INTO courses (course_code, course_name, credits, school, faculty_id, semester, capacity, room, days, time_slot) VALUES
('CS3020',  'Data Structures & Algorithms',      3, 'SST', 1, 'Fall 2024/2025', 45, 'LH-204', 'Mon/Wed', '08:00-09:30'),
('CS3041',  'Database Management Systems',       3, 'SST', 2, 'Fall 2024/2025', 45, 'LH-101', 'Tue/Thu', '10:00-11:30'),
('CS3055',  'Software Engineering',              3, 'SST', 1, 'Fall 2024/2025', 40, 'CB-302', 'Fri',     '13:00-14:00'),
('CS2010',  'Operating Systems',                 3, 'SST', 3, 'Fall 2024/2025', 50, 'LH-205', 'Tue/Thu', '14:00-15:30'),
('BUS2050', 'Business Communication',            3, 'CSB', NULL, 'Fall 2024/2025', 70, 'CB-101', 'Fri',     '11:00-12:00'),
('IR3010',  'African International Relations',   3, 'HSS', NULL, 'Fall 2024/2025', 35, 'HB-205', 'Tue/Thu', '08:00-09:30'),
('CS3070',  'Software Testing',                 3, 'SST', 2, 'Fall 2024/2025', 35, 'LH-206', 'Fri',     '10:00-11:30'),
('BUS2100', 'Organizational Behaviour',         3, 'CSB', NULL, 'Fall 2024/2025', 60, 'CB-103', 'Sat',     '09:00-11:00'),
('CS3080',  'Cloud Computing Fundamentals',      3, 'SST', 1, 'Fall 2024/2025', 30, 'LH-103', 'Mon/Wed', '09:00-10:30'),
('BUS2200', 'Strategic Management',             3, 'CSB', 5,    'Fall 2024/2025', 50, 'CB-201', 'Tue/Thu', '11:00-12:30'),
('PSY3010', 'Workplace Psychology',             3, 'HSS', 6,    'Fall 2024/2025', 40, 'HB-101', 'Fri',     '09:00-11:00'),
('CS3090', 'Cloud Security',                   3, 'SST', 2, 'Fall 2024/2025', 30, 'LH-303', 'Thu',     '14:00-15:30'),
('MKT3010','Marketing Management',            3, 'CSB', 5,    'Fall 2024/2025', 50, 'CB-202', 'Mon',     '14:00-15:30'),
('CCA2100','Media Writing & Production',      3, 'CCA', NULL, 'Fall 2024/2025', 35, 'CR-101', 'Wed',     '10:00-12:00'),
('PHR3100','Introduction to Pharmacology',    3, 'SPHS', NULL, 'Fall 2024/2025', 30, 'PH-201', 'Fri',     '09:00-10:30'),
('CS4010','Machine Learning',                3, 'SST', 2,     'Fall 2024/2025', 35, 'LH-304', 'Mon/Wed', '11:00-12:30'),
('MKT3015','Marketing Strategy',             3, 'CSB', 5,     'Fall 2024/2025', 45, 'CB-203', 'Tue/Thu', '09:00-10:30'),
('ACC3020','Financial Accounting II',         3, 'CSB', 5,     'Fall 2024/2025', 40, 'CB-204', 'Mon/Wed', '10:00-11:30'),
('JOU3100','Media Ethics & Practice',         3, 'CCA', 8,     'Fall 2024/2025', 30, 'CR-102', 'Tue/Thu', '13:00-14:30'),
('PHR3200','Global Health Systems',           3, 'SPHS', NULL, 'Fall 2024/2025', 30, 'PH-202', 'Fri',     '11:00-12:30'),
('IR3100','Peace & Conflict Studies',         3, 'HSS', 6,     'Fall 2024/2025', 35, 'HB-206', 'Fri',     '11:00-12:30');

-- Enrollments
INSERT INTO enrollments (student_id, course_id, semester) VALUES
(1, 1, 'Fall 2024/2025'),
(1, 2, 'Fall 2024/2025'),
(1, 3, 'Fall 2024/2025'),
(1, 4, 'Fall 2024/2025'),
(1, 5, 'Fall 2024/2025'),
(2, 1, 'Fall 2024/2025'),
(2, 3, 'Fall 2024/2025'),
(3, 6, 'Fall 2024/2025'),
(4, 5, 'Fall 2024/2025'),
(5, 2, 'Fall 2024/2025'),
(5, 9, 'Fall 2024/2025'),
(6, 1, 'Fall 2024/2025'),
(6, 8, 'Fall 2024/2025'),
(7, 1, 'Fall 2024/2025'),
(7, 12, 'Fall 2024/2025'),
(8, 14, 'Fall 2024/2025'),
(8, 6, 'Fall 2024/2025'),
(9, 15, 'Fall 2024/2025'),
(9, 9, 'Fall 2024/2025'),
(10, 13, 'Fall 2024/2025'),
(10, 10, 'Fall 2024/2025'),
(10, 5, 'Fall 2024/2025'),
(19, 17, 'Fall 2024/2025'),
(19, 13, 'Fall 2024/2025'),
(20, 19, 'Fall 2024/2025'),
(20, 14, 'Fall 2024/2025'),
(21, 20, 'Fall 2024/2025'),
(21, 6,  'Fall 2024/2025');

-- Grades
INSERT INTO grades (enrollment_id, midterm_score, final_score, assignment_score, total_score, grade_letter, grade_points, submitted_by) VALUES
(1, 82, 85, 88, 84.6, 'A-', 3.7, 1),
(2, 78, 80, 82, 79.6, 'B+', 3.3, 2),
(3, 75, 78, 80, 77.0, 'B+', 3.3, 1),
(4, 70, 72, 75, 71.8, 'B',  3.0, 3),
(14, 88, 90, 92, 89.8, 'A', 4.0, 2),
(15, 74, 77, 73, 74.4, 'B', 3.0, 1),
(16, 82, 84, 86, 84.6, 'A-', 3.7, 2),
(22, 82, 86, 84, 84.0, 'A',  4.0, 7),
(23, 88, 87, 90, 88.3, 'A',  4.0, 7),
(24, 77, 79, 82, 79.3, 'A-', 3.7, 8),
(25, 81, 83, 85, 83.0, 'A',  4.0, 8),
(26, 91, 89, 92, 90.7, 'A',  4.0, 7),
(27, 73, 75, 78, 75.3, 'A-', 3.7, 7);

-- Assignments
INSERT INTO assignments (course_id, title, description, due_date, max_score) VALUES
(1, 'Algorithm Analysis Report',  'Analyze time complexity of 3 sorting algorithms', '2024-11-22 23:59:00', 100),
(2, 'SQL Lab Exercise 4',         'Write queries for the hospital database schema',   '2024-11-18 23:59:00', 100),
(3, 'Project Proposal Document',  'Submit a 5-page proposal for your SE project',     '2024-11-15 23:59:00', 100),
(12, 'Cloud Threat Assessment',   'Review cloud security controls and incident scenarios', '2024-11-29 23:59:00', 100),
(13, 'Marketing Strategy Plan',   'Develop a digital marketing strategy for a new product',  '2024-11-25 23:59:00', 100),
(15, 'Pharmacology Case Study',   'Analyze a clinical drug interaction scenario',            '2024-11-20 23:59:00', 100),
(16, 'Machine Learning Model Report', 'Build and evaluate a classification model using Python.', '2024-11-25 23:59:00', 100),
(17, 'Marketing Strategy Plan',    'Create a branding and go-to-market strategy for a new product.', '2024-11-20 23:59:00', 100),
(18, 'Accounting Case Analysis',  'Prepare financial statements and comment on key ratios.', '2024-11-21 23:59:00', 100),
(19, 'Ethics and Media Commentary','Write an essay on ethical choices in digital journalism.', '2024-11-24 23:59:00', 100),
(20, 'Global Health Systems Brief','Assess a public health system and recommend improvements.', '2024-11-26 23:59:00', 100);

-- Schedules
INSERT INTO schedules (course_id, day_of_week, start_time, end_time, room) VALUES
(1, 'Monday',    '08:00:00', '09:30:00', 'LH-204'),
(1, 'Wednesday', '08:00:00', '09:30:00', 'LH-204'),
(2, 'Tuesday',   '10:00:00', '11:30:00', 'LH-101'),
(2, 'Thursday',  '10:00:00', '11:30:00', 'LH-101'),
(3, 'Friday',    '13:00:00', '14:00:00', 'CB-302'),
(4, 'Tuesday',   '14:00:00', '15:30:00', 'LH-205'),
(4, 'Thursday',  '14:00:00', '15:30:00', 'LH-205'),
(7, 'Friday',    '10:00:00', '11:30:00', 'LH-206'),
(8, 'Saturday',  '09:00:00', '11:00:00', 'CB-103'),
(12, 'Thursday', '14:00:00', '15:30:00', 'LH-303'),
(13, 'Monday',   '14:00:00', '15:30:00', 'CB-202'),
(14, 'Wednesday','10:00:00', '12:00:00', 'CR-101'),
(15, 'Friday',   '09:00:00', '10:30:00', 'PH-201'),
(16, 'Monday',    '11:00:00', '12:30:00', 'LH-304'),
(16, 'Wednesday', '11:00:00', '12:30:00', 'LH-304'),
(17, 'Tuesday',   '09:00:00', '10:30:00', 'CB-203'),
(17, 'Thursday',  '09:00:00', '10:30:00', 'CB-203'),
(18, 'Monday',    '10:00:00', '11:30:00', 'CB-204'),
(18, 'Wednesday', '10:00:00', '11:30:00', 'CB-204'),
(19, 'Tuesday',   '13:00:00', '14:30:00', 'CR-102'),
(19, 'Thursday',  '13:00:00', '14:30:00', 'CR-102'),
(20, 'Friday',    '11:00:00', '12:30:00', 'PH-202'),
(21, 'Friday',    '11:00:00', '12:30:00', 'HB-206');
`);
}

generateHashes();