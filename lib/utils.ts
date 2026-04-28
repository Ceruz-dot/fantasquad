export function calculateAge(date: Date) {
  return Math.floor(
    (Date.now() - new Date(date).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );
}

export function getRenewalCost(value: number, age: number) {
  if (age <= 23) return { cost: 0, isFree: true };
  return { cost: Math.round(value * 0.1), isFree: false };
}