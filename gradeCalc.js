// backend/utils/gradeCalc.js
// Converts a total percentage score to a letter grade and GPA points

function calcGrade(total) {
  if (total >= 85) return { letter: 'A',  points: 4.0 };
  if (total >= 80) return { letter: 'A-', points: 3.7 };
  if (total >= 75) return { letter: 'B+', points: 3.3 };
  if (total >= 70) return { letter: 'B',  points: 3.0 };
  if (total >= 65) return { letter: 'B-', points: 2.7 };
  if (total >= 60) return { letter: 'C+', points: 2.3 };
  if (total >= 55) return { letter: 'C',  points: 2.0 };
  if (total >= 50) return { letter: 'C-', points: 1.7 };
  if (total >= 45) return { letter: 'D+', points: 1.3 };
  if (total >= 40) return { letter: 'D',  points: 1.0 };
  return               { letter: 'F',  points: 0.0 };
}

// Calculate GPA from an array of { points, credits } objects
function calcGPA(gradesArray) {
  if (!gradesArray || gradesArray.length === 0) return 0;
  const totalPoints  = gradesArray.reduce((sum, g) => sum + g.points * g.credits, 0);
  const totalCredits = gradesArray.reduce((sum, g) => sum + g.credits, 0);
  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
}

module.exports = { calcGrade, calcGPA };
