import { differenceInMonths, parseISO } from 'date-fns';

export function getStudentPaidStatus(student: { joinDate: string; payments?: Record<string, any> }) {
  const today = new Date();
  let joinDate: Date;
  try {
    joinDate = parseISO(student.joinDate);
    if (isNaN(joinDate.getTime())) throw new Error();
  } catch {
    return 'Paid';
  }
  const monthsSinceJoin = differenceInMonths(today, joinDate);
  if (monthsSinceJoin === 0) {
    return 'Paid';
  } else {
    const currentMonth = today.toISOString().slice(0, 7);
    if (
      student.payments &&
      typeof student.payments === 'object' &&
      student.payments[currentMonth] &&
      student.payments[currentMonth].status === 'paid'
    ) {
      return 'Paid';
    } else {
      return 'Unpaid';
    }
  }
} 