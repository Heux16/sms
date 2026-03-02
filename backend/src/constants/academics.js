export function calculateMonthlyGrade(scoreOutOf25) {
  const score = Number(scoreOutOf25 || 0);
  if (score >= 23) return 'A+';
  if (score >= 21) return 'A';
  if (score >= 18) return 'B+';
  if (score >= 16) return 'B';
  if (score >= 13) return 'C+';
  if (score >= 11) return 'C';
  if (score >= 9) return 'D';
  return 'E';
}

export function calculateTermGrade(scoreOutOf100) {
  const score = Number(scoreOutOf100 || 0);
  if (score >= 91) return 'A+';
  if (score >= 81) return 'A';
  if (score >= 71) return 'B+';
  if (score >= 61) return 'B';
  if (score >= 51) return 'C+';
  if (score >= 41) return 'C';
  if (score >= 33) return 'D';
  return 'E';
}

export function calculateGrade(scoreOutOf100) {
  const score = Number(scoreOutOf100 || 0);
  if (score >= 91) return 'A+';
  if (score >= 81) return 'A';
  if (score >= 71) return 'B+';
  if (score >= 61) return 'B';
  if (score >= 51) return 'C+';
  if (score >= 41) return 'C';
  if (score >= 33) return 'D';
  return 'E';
}

export function calculateExamGrade(examName, totalScore) {
  const normalizedType = String(examName || '').toLowerCase();
  if (normalizedType === 'monthly') {
    return calculateMonthlyGrade(totalScore);
  }

  return calculateTermGrade(totalScore);
}
