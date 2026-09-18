import { Employee, CustomerRating } from '../types';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';
import { apiRateEmployee, apiSaveEmployees } from './api';

export const LOCAL_STORAGE_EMPLOYEES_KEY = 'beverage_hub_employees';
export const EMPLOYEES_UPDATED_EVENT = 'beverage_hub_employees_updated';

/**
 * Helper to get current month name, year, and formatted period identifier.
 */
export function getCurrentMonthInfo(): { monthName: string; year: number; label: string } {
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[now.getMonth()];
  const year = now.getFullYear();
  return {
    monthName,
    year,
    label: `${monthName} ${year}`,
  };
}

/**
 * Get all registered employees with recalculated average ratings and counts strictly for the current calendar month.
 * Ratings accumulate daily throughout the month and automatically reset to zero immediately when a new month begins.
 */
export function getEmployees(): Employee[] {
  let list: Employee[] = [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_EMPLOYEES_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out legacy mock employees if present
        list = parsed.filter(
          (emp) =>
            !['emp-1', 'emp-2', 'emp-3', 'emp-4'].includes(emp.id) &&
            !['Daniel K.', 'Alex Mercer', 'Sarah Jenkins', 'Michael Scott'].includes(emp.name)
        );
      }
    }
  } catch (err) {
    console.error('Failed to load employees from localStorage:', err);
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Recalculate employee ratings strictly for the active calendar month
  return list.map((emp) => {
    const allRatings = emp.ratings || [];
    
    // Filter ratings received within the current year and current month
    const currentMonthRatings = allRatings.filter((r) => {
      if (!r.timestamp) return false;
      const d = new Date(r.timestamp);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const count = currentMonthRatings.length;
    const sum = count > 0 ? currentMonthRatings.reduce((acc, r) => acc + r.rating, 0) : 0;
    const averageRating = count > 0 ? Number((sum / count).toFixed(1)) : 0;

    return {
      ...emp,
      ratings: allRatings,
      averageRating,
      totalRatingsCount: count,
    };
  });
}

/**
 * Save employees list to localStorage and trigger sync event.
 */
export function saveEmployees(employees: Employee[], businessId?: string) {
  try {
    localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(employees));
    window.dispatchEvent(new CustomEvent(EMPLOYEES_UPDATED_EVENT));
    apiSaveEmployees(employees, businessId).catch(() => {});
  } catch (err) {
    console.error('Failed to save employees:', err);
  }
}

/**
 * Add a new customer rating for a specific employee by name or ID.
 */
export function addCustomerRating(employeeNameOrId: string, ratingValue: number, orderId?: string): Employee | null {
  if (!employeeNameOrId || ratingValue <= 0) return null;

  const list = getEmployees();
  const searchKey = employeeNameOrId.trim().toLowerCase();

  // Match by id or staffId or name
  const empIndex = list.findIndex(
    (e) =>
      e.id.toLowerCase() === searchKey ||
      e.staffId.toLowerCase() === searchKey ||
      e.name.toLowerCase() === searchKey ||
      e.name.toLowerCase().includes(searchKey) ||
      searchKey.includes(e.name.toLowerCase())
  );

  let targetIndex = empIndex;
  // Fallback to first Waiter if no name matched
  if (targetIndex === -1) {
    targetIndex = list.findIndex((e) => e.role === 'Waiter');
  }

  if (targetIndex === -1 && list.length > 0) {
    targetIndex = 0;
  }

  if (targetIndex === -1) return null;

  const target = list[targetIndex];
  const newRatingObj: CustomerRating = {
    id: `rating-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    rating: ratingValue,
    orderId,
    timestamp: new Date().toISOString(),
  };

  const updatedRatings = [...(target.ratings || []), newRatingObj];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthRatings = updatedRatings.filter((r) => {
    if (!r.timestamp) return false;
    const d = new Date(r.timestamp);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const newCount = currentMonthRatings.length;
  const newSum = currentMonthRatings.reduce((acc, r) => acc + r.rating, 0);
  const newAverage = Number((newSum / newCount).toFixed(1));

  const updatedTarget: Employee = {
    ...target,
    ratings: updatedRatings,
    totalRatingsCount: newCount,
    averageRating: newAverage,
  };

  list[targetIndex] = updatedTarget;
  saveEmployees(list);

  return updatedTarget;
}

/**
 * Get employees sorted by current month rating descending (top rated first).
 */
export function getEmployeesSortedByRating(): Employee[] {
  const list = getEmployees();
  return list.sort((a, b) => {
    const avgA = a.averageRating || 0;
    const avgB = b.averageRating || 0;
    if (avgB !== avgA) {
      return avgB - avgA; // Higher current month rating first
    }
    const countA = a.totalRatingsCount || 0;
    const countB = b.totalRatingsCount || 0;
    if (countB !== countA) {
      return countB - countA; // More ratings this month first
    }
    return (b.salesToday || 0) - (a.salesToday || 0);
  });
}

