CREATE DATABASE IF NOT EXISTS uniconnect_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE uniconnect_db;

CREATE TABLE IF NOT EXISTS users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','faculty','student') NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  student_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL UNIQUE,
  student_no    VARCHAR(20) NOT NULL UNIQUE,
  first_name    VARCHAR(60) NOT NULL,
  last_name     VARCHAR(60) NOT NULL,
  phone         VARCHAR(20),
  dob           DATE,
  gender        ENUM('Male','Female','Other'),
  nationality   VARCHAR(60) DEFAULT 'Kenyan',
  programme     VARCHAR(120) NOT NULL,
  school        VARCHAR(10) NOT NULL,
  year_of_study TINYINT DEFAULT 1,
  status        ENUM('Active','Probation','Suspended','Graduated','Deferred') DEFAULT 'Active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faculty (
  faculty_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL UNIQUE,
  employee_no   VARCHAR(20) NOT NULL UNIQUE,
  first_name    VARCHAR(60) NOT NULL,
  last_name     VARCHAR(60) NOT NULL,
  phone         VARCHAR(20),
  department    VARCHAR(100) NOT NULL,
  school        VARCHAR(10) NOT NULL,
  title         VARCHAR(40) DEFAULT 'Lecturer',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  course_id     INT AUTO_INCREMENT PRIMARY KEY,
  course_code   VARCHAR(15) NOT NULL UNIQUE,
  course_name   VARCHAR(120) NOT NULL,
  credits       TINYINT NOT NULL DEFAULT 3,
  school        VARCHAR(10) NOT NULL,
  faculty_id    INT,
  semester      VARCHAR(40) NOT NULL,
  capacity      INT DEFAULT 45,
  room          VARCHAR(20),
  days          VARCHAR(40),
  time_slot     VARCHAR(30),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id    INT NOT NULL,
  course_id     INT NOT NULL,
  semester      VARCHAR(40) NOT NULL,
  status        ENUM('Active','Dropped','Completed','Incomplete') DEFAULT 'Active',
  enrolled_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollment (student_id, course_id, semester),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id)  REFERENCES courses(course_id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grades (
  grade_id          INT AUTO_INCREMENT PRIMARY KEY,
  enrollment_id     INT NOT NULL UNIQUE,
  midterm_score     DECIMAL(5,2) DEFAULT 0,
  final_score       DECIMAL(5,2) DEFAULT 0,
  assignment_score  DECIMAL(5,2) DEFAULT 0,
  total_score       DECIMAL(5,2) DEFAULT 0,
  grade_letter      CHAR(2),
  grade_points      DECIMAL(3,2),
  submitted_by      INT,
  submitted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by)  REFERENCES faculty(faculty_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id     INT NOT NULL,
  title         VARCHAR(150) NOT NULL,
  description   TEXT,
  due_date      DATETIME,
  max_score     INT DEFAULT 100,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
  submission_id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id    INT NOT NULL,
  file_path     VARCHAR(255) NOT NULL,
  file_name     VARCHAR(255) NOT NULL,
  submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade         DECIMAL(5,2),
  feedback      TEXT,
  graded_by     INT,
  graded_at     TIMESTAMP NULL,
  FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES faculty(faculty_id) ON DELETE SET NULL,
  UNIQUE KEY uq_submission (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS schedules (
  schedule_id   INT AUTO_INCREMENT PRIMARY KEY,
  course_id     INT NOT NULL,
  day_of_week   ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  room          VARCHAR(20),
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);
