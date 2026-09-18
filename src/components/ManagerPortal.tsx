import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Package,
  Bell,
  LogOut,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Search,
  X,
  ShoppingBag,
  Info,
  Check,
  ArrowUpDown,
  Users,
  UserPlus,
  Phone,
  Clock,
  Shield,
  Trash2,
  Camera,
  User,
  CreditCard,
  RotateCcw,
  History,
  Calendar,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Star,
  Award,
  AlertCircle,
  MessageSquare,
  QrCode,
} from 'lucide-react';
import { InventoryItem, LedgerSale, ManagerNotification, Employee, EmployeeRole, DailyLedgerRecord, RestaurantTable, ManagerAccount } from '../types';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';
import { getEmployeesSortedByRating, EMPLOYEES_UPDATED_EVENT, saveEmployees } from '../utils/employeeRatings';
import { TablesManager } from './TablesManager';
import { apiDeleteEmployee, apiUpdateBusinessProfile } from '../utils/api';

interface ManagerPortalProps {
  inventory: InventoryItem[];
  ledgerSales: LedgerSale[];
  notifications: ManagerNotification[];
  tables?: RestaurantTable[];
  employees?: Employee[];
  managerAccount?: ManagerAccount | null;
  onUpdateManagerProfile?: (account: Partial<ManagerAccount>) => void;
  onSaveTable?: (table: Partial<RestaurantTable>) => void;
  onDeleteTable?: (tableId: string) => void;
  onSaveEmployees?: (employees: Employee[]) => void;
  businessId?: string;
  businessName?: string;
  onOpenCustomerView?: (table: RestaurantTable) => void;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onRefreshInventory?: () => void;
  onResetDailySold?: () => void;
  onLogout: () => void;
}

type ManagerTab = 'REPORT' | 'INVENTORY' | 'TABLES' | 'EMPLOYEES' | 'NOTIFICATIONS';

export const ManagerPortal: React.FC<ManagerPortalProps> = ({
  inventory,
  ledgerSales,
  notifications,
  tables = [],
  employees: employeesProp,
  managerAccount,
  onUpdateManagerProfile,
  onSaveTable,
  onDeleteTable,
  onSaveEmployees,
  businessId = 'talikdgaf@gmail.com',
  businessName = "Rio's POS",
  onOpenCustomerView,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearNotifications,
  onRefreshInventory,
  onResetDailySold,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<ManagerTab>('REPORT');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showRefreshToast, setShowRefreshToast] = useState<boolean>(false);

  // Manager & Bar Profile State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileBarName, setProfileBarName] = useState<string>(managerAccount?.venueName || businessName || "Rio's POS");
  const [profileManagerName, setProfileManagerName] = useState<string>(managerAccount?.displayName || 'Talik');
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>(managerAccount?.photoURL || '');
  const [profilePin, setProfilePin] = useState<string>(managerAccount?.pin || '');
  const [profileNewPin, setProfileNewPin] = useState<string>('');
  const [profileConfirmNewPin, setProfileConfirmNewPin] = useState<string>('');
  const [profileSecurityQuestion, setProfileSecurityQuestion] = useState<string>(
    managerAccount?.securityQuestion || "What is your mother's maiden name?"
  );
  const [profileSecurityAnswer, setProfileSecurityAnswer] = useState<string>(managerAccount?.securityAnswer || '');
  const [profilePinError, setProfilePinError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);

  // Daily History State & Compilation
  const [showDailyHistoryModal, setShowDailyHistoryModal] = useState<boolean>(false);
  const [historySearchDate, setHistorySearchDate] = useState<string>('');
  const [expandedHistoryDays, setExpandedHistoryDays] = useState<Set<string>>(new Set());
  const [savedDailyLedgers, setSavedDailyLedgers] = useState<DailyLedgerRecord[]>(() => {
    try {
      const stored = localStorage.getItem('beverage_hub_saved_daily_ledgers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Toggle day details accordion in Daily History
  const toggleDayExpanded = (dayId: string) => {
    setExpandedHistoryDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  // Search & Filter in Inventory
  const [inventorySearch, setInventorySearch] = useState<string>('');

  // Employees Management State sorted by top ratings with LocalStorage Persistence
  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (employeesProp && employeesProp.length > 0) return employeesProp;
    return getEmployeesSortedByRating();
  });

  useEffect(() => {
    if (employeesProp && employeesProp.length > 0) {
      setEmployees(employeesProp);
    }
  }, [employeesProp]);

  // Listen for customer ratings submission events and re-sort
  useEffect(() => {
    const handleSyncEmployees = () => {
      setEmployees(getEmployeesSortedByRating());
    };

    window.addEventListener(EMPLOYEES_UPDATED_EVENT, handleSyncEmployees);
    return () => {
      window.removeEventListener(EMPLOYEES_UPDATED_EVENT, handleSyncEmployees);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('beverage_hub_employees', JSON.stringify(employees));
    } catch (e) {
      console.error('Error saving employees:', e);
    }
  }, [employees]);

  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);
  const [showRatingsModal, setShowRatingsModal] = useState<boolean>(false);
  const [ratingsSearchQuery, setRatingsSearchQuery] = useState<string>('');
  const [ratingsFilterRole, setRatingsFilterRole] = useState<string>('ALL');
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [isConfirmingFire, setIsConfirmingFire] = useState<boolean>(false);
  const [empFormName, setEmpFormName] = useState<string>('');
  const [empFormRole, setEmpFormRole] = useState<EmployeeRole>('Bartender');
  const [empFormPin, setEmpFormPin] = useState<string>('1234');
  const [empFormPhone, setEmpFormPhone] = useState<string>('');
  const [empFormNationalId, setEmpFormNationalId] = useState<string>('');
  const [empFormAvatarUrl, setEmpFormAvatarUrl] = useState<string>('');
  const [empFormStatus, setEmpFormStatus] = useState<'ON_DUTY' | 'OFF_DUTY' | 'ABSENT'>('ON_DUTY');

  // Currently active selected employee for modal
  const selectedEmployee = useMemo(() => {
    if (!editingEmployeeId) return null;
    return employees.find((e) => e.id === editingEmployeeId) || null;
  }, [employees, editingEmployeeId]);

  // Compiled customer ratings data out of 5 stars for the selected employee
  const ratingStats = useMemo(() => {
    if (!selectedEmployee) {
      return {
        average: 0,
        totalCount: 0,
        hasRatings: false,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
        ratings: [] as any[],
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const allRatings = selectedEmployee.ratings || [];
    const ratings = allRatings.filter((r) => {
      if (!r.timestamp) return false;
      const d = new Date(r.timestamp);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const totalCount = ratings.length;
    if (totalCount === 0) {
      const explicitAvg = selectedEmployee.averageRating || 0;
      const explicitCount = selectedEmployee.totalRatingsCount || 0;
      const hasExplicit = explicitCount > 0;
      return {
        average: hasExplicit ? explicitAvg : 0,
        totalCount: explicitCount,
        hasRatings: hasExplicit,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
        ratings: [],
      };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = Number((sum / totalCount).toFixed(1));
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      breakdown[star] = (breakdown[star] || 0) + 1;
    });

    return {
      average,
      totalCount,
      hasRatings: true,
      breakdown,
      ratings,
    };
  }, [selectedEmployee]);

  // Open modal for adding a new employee
  const handleOpenAddEmployee = () => {
    setEditingEmployeeId(null);
    setIsConfirmingFire(false);
    setEmpFormName('');
    setEmpFormRole('Bartender');
    setEmpFormPin('1234');
    setEmpFormPhone('');
    setEmpFormNationalId('');
    setEmpFormAvatarUrl('');
    setEmpFormStatus('ON_DUTY');
    setShowEmployeeModal(true);
  };

  // Open modal for viewing/editing an existing employee's profile
  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setIsConfirmingFire(false);
    setEmpFormName(emp.name);
    setEmpFormRole(emp.role);
    setEmpFormPin(emp.pin || '1234');
    setEmpFormPhone(emp.phone);
    setEmpFormNationalId(emp.nationalId || '');
    setEmpFormAvatarUrl(emp.avatarUrl || '');
    setEmpFormStatus(emp.status);
    setShowEmployeeModal(true);
  };

  // Handle firing / terminating an employee
  const handleFireEmployee = () => {
    if (!editingEmployeeId) return;
    const firedId = editingEmployeeId;
    const updated = employees.filter((emp) => emp.id !== firedId);
    setEmployees(updated);
    saveEmployees(updated, businessId);
    apiDeleteEmployee(firedId, businessId).catch(() => {});
    if (onSaveEmployees) onSaveEmployees(updated);
    setIsConfirmingFire(false);
    setShowEmployeeModal(false);
    setEditingEmployeeId(null);
  };

  // Handle profile image upload
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image file smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEmpFormAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit add / edit employee
  const handleSaveEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFormName.trim()) return;

    let updated: Employee[];
    if (editingEmployeeId) {
      // Update existing employee
      updated = employees.map((emp) =>
        emp.id === editingEmployeeId
          ? {
              ...emp,
              name: empFormName.trim(),
              role: empFormRole,
              pin: empFormPin.trim() || emp.pin || '1234',
              phone: empFormPhone.trim() || emp.phone,
              nationalId: empFormNationalId.trim() || undefined,
              avatarUrl: empFormAvatarUrl.trim() || undefined,
              status: empFormStatus,
            }
          : emp
      );
    } else {
      // Create new employee
      const newStaffId = `EMP-${100 + employees.length + 1}`;
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: empFormName.trim(),
        role: empFormRole,
        staffId: newStaffId,
        pin: empFormPin.trim() || '1234',
        phone: empFormPhone.trim() || '+254 700 000 000',
        nationalId: empFormNationalId.trim() || undefined,
        avatarUrl: empFormAvatarUrl.trim() || undefined,
        status: empFormStatus,
        shiftStart: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        salesToday: 0,
        ratings: [],
        averageRating: 0,
        totalRatingsCount: 0,
      };
      updated = [newEmp, ...employees];
    }

    setEmployees(updated);
    saveEmployees(updated, businessId);
    if (onSaveEmployees) onSaveEmployees(updated);
    setShowEmployeeModal(false);
  };

  // Filter in Notifications Page
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'ORDERS'>('ALL');


  // Today's date formatted as YYYY-MM-DD
  const todayDate = new Date().toISOString().split('T')[0];

  // Ledger calculations: Bottles sold count & financials
  const totalBottlesSold = inventory.reduce((acc, item) => acc + item.sold, 0);
  const grossRevenue =
    ledgerSales.length > 0
      ? ledgerSales.reduce((acc, sale) => acc + sale.sold, 0)
      : inventory.reduce((acc, item) => acc + item.sold * item.sellPrice, 0);
  const costOfGoods =
    ledgerSales.length > 0
      ? ledgerSales.reduce((acc, sale) => acc + sale.cost, 0)
      : inventory.reduce((acc, item) => acc + item.sold * item.buyPrice, 0);
  const netProfit = grossRevenue - costOfGoods;

  // Live current day compiled record
  const currentDayRecord: DailyLedgerRecord = useMemo(() => {
    const todayDateObj = new Date();
    const formattedDate = todayDateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return {
      id: `day-${todayDate}`,
      date: todayDate,
      formattedDate: `Today (${formattedDate})`,
      totalBottlesSold,
      grossRevenue,
      costOfGoods,
      netProfit,
      sales: ledgerSales,
    };
  }, [todayDate, totalBottlesSold, grossRevenue, costOfGoods, netProfit, ledgerSales]);

  // Combined compiled daily ledgers (Current active day + historical saved days)
  const compiledDailyLedgers = useMemo(() => {
    const others = savedDailyLedgers.filter((r) => r.date !== todayDate);
    return [currentDayRecord, ...others];
  }, [currentDayRecord, savedDailyLedgers, todayDate]);

  // Filtered daily history based on search
  const filteredDailyLedgers = useMemo(() => {
    if (!historySearchDate.trim()) return compiledDailyLedgers;
    const q = historySearchDate.toLowerCase().trim();
    return compiledDailyLedgers.filter(
      (day) =>
        day.date.toLowerCase().includes(q) ||
        day.formattedDate.toLowerCase().includes(q)
    );
  }, [compiledDailyLedgers, historySearchDate]);

  // Cumulative historical totals across all compiled days
  const historicalTotalRevenue = compiledDailyLedgers.reduce((acc, d) => acc + d.grossRevenue, 0);
  const historicalTotalProfit = compiledDailyLedgers.reduce((acc, d) => acc + d.netProfit, 0);
  const historicalTotalBottles = compiledDailyLedgers.reduce((acc, d) => acc + d.totalBottlesSold, 0);

  // Inventory calculations
  const totalItemsCount = inventory.length;
  const lowStockCount = inventory.filter((item) => item.remaining <= 2).length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Inventory sorting: arranged according to bottles almost running out of stock!
  // Remaining = 0 first, then remaining = 1, 2, 3... ascending
  const sortedAndFilteredInventory = useMemo(() => {
    let list = [...inventory];

    // Search query filter
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.volume.toLowerCase().includes(q)
      );
    }

    // Sort by bottles almost running out of stock (lowest remaining first)
    list.sort((a, b) => {
      // 0 (OUT) first
      if (a.remaining !== b.remaining) {
        return a.remaining - b.remaining;
      }
      // If same remaining, sort by highest sold first
      if (b.sold !== a.sold) {
        return b.sold - a.sold;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [inventory, inventorySearch]);

  // Notifications filtering
  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'CRITICAL') {
      return notifications.filter((n) => n.severity === 'critical' || n.type === 'OUT_OF_STOCK');
    }
    if (notificationFilter === 'WARNING') {
      return notifications.filter((n) => n.severity === 'warning' || n.type === 'LOW_STOCK');
    }
    if (notificationFilter === 'ORDERS') {
      return notifications.filter((n) => n.type === 'ORDER_PLACED');
    }
    return notifications;
  }, [notifications, notificationFilter]);

  // Employee filtering & actions
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase().trim();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.staffId.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q)
    );
  }, [employees, employeeSearch]);

  const handleToggleEmployeeStatus = (empId: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== empId) return emp;
        const nextStatus =
          emp.status === 'ON_DUTY'
            ? 'OFF_DUTY'
            : emp.status === 'OFF_DUTY'
            ? 'ABSENT'
            : 'ON_DUTY';
        return { ...emp, status: nextStatus };
      })
    );
  };

  const handleDeleteEmployee = (empId: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== empId));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshInventory) onRefreshInventory();
    setTimeout(() => {
      setIsRefreshing(false);
      setShowRefreshToast(true);
      setTimeout(() => setShowRefreshToast(false), 2500);
    }, 400);
  };

  const handleGoToInventoryItem = (itemName?: string) => {
    setActiveTab('INVENTORY');
    if (itemName) {
      setInventorySearch(itemName);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#f3f4f8] text-gray-900 flex flex-col font-sans select-none w-full max-w-full">
      {/* Top Header Navigation Bar - Non-scrolling fixed header */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-40 px-3 sm:px-8 py-2 sm:py-3 w-full max-w-full">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo / Name */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <span className="text-lg sm:text-2xl font-black text-[#0f172a] tracking-tight">
              RIO P.O.S
            </span>
            <span className="sm:hidden text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Manager
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto justify-start sm:justify-end">
            {/* Report Button (Upload 1) */}
            <button
              type="button"
              id="nav-btn-report"
              onClick={() => setActiveTab('REPORT')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'REPORT'
                  ? 'bg-[#101828] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Report</span>
            </button>

            {/* Inventory Button (Upload 2) */}
            <button
              type="button"
              id="nav-btn-inventory"
              onClick={() => setActiveTab('INVENTORY')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'INVENTORY'
                  ? 'bg-[#101828] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-50'
              }`}
            >
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Inventory</span>
            </button>

            {/* Tables Button (User Request) */}
            <button
              type="button"
              id="nav-btn-tables"
              onClick={() => setActiveTab('TABLES')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'TABLES'
                  ? 'bg-[#101828] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Tables</span>
            </button>

            {/* Employees Button */}
            <button
              type="button"
              id="nav-btn-employees"
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'EMPLOYEES'
                  ? 'bg-[#101828] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Staff</span>
            </button>

            {/* Notifications Button (Icon ONLY, without text) */}
            <button
              type="button"
              id="nav-btn-notifications"
              onClick={() => setActiveTab('NOTIFICATIONS')}
              title="Notifications"
              aria-label="Notifications"
              className={`p-2 sm:px-3 sm:py-2 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer relative ${
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-[#101828] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-50'
              }`}
            >
              <Bell className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center leading-tight shadow-xs ${
                    activeTab === 'NOTIFICATIONS'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Profile Button on top right */}
            <button
              type="button"
              id="nav-btn-profile"
              onClick={() => {
                setProfileBarName(managerAccount?.venueName || businessName || "Rio's POS");
                setProfileManagerName(managerAccount?.displayName || 'Talik');
                setProfilePhotoURL(managerAccount?.photoURL || '');
                setProfilePin(managerAccount?.pin || '');
                setProfileNewPin('');
                setProfileConfirmNewPin('');
                setProfileSecurityQuestion(managerAccount?.securityQuestion || "What is your mother's maiden name?");
                setProfileSecurityAnswer(managerAccount?.securityAnswer || '');
                setProfilePinError(null);
                setProfileSaveSuccess(false);
                setShowProfileModal(true);
              }}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-gray-200 hover:border-black bg-white hover:bg-gray-50 transition-all cursor-pointer shrink-0 ml-1"
              title="Edit Bar & Manager Profile"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                {profilePhotoURL ? (
                  <img src={profilePhotoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (profileManagerName || 'M').charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-black leading-tight truncate max-w-[100px]">
                  {profileManagerName || 'Manager'}
                </span>
                <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                  {profileBarName || "Rio's POS"}
                </span>
              </div>
            </button>

            {/* Logout Button (Returns to Role Selection) */}
            <button
              type="button"
              id="nav-btn-logout"
              onClick={onLogout}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-xl transition-colors shrink-0 cursor-pointer ml-1"
              title="Logout from Manager"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 lg:p-8 overflow-y-auto">
        {/* TAB 1: REPORT (UPLOAD 1: Today's Ledger) */}
        {activeTab === 'REPORT' && (
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 sm:p-8">
            {/* Ledger Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Today's Ledger
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                  {todayDate} — newest first
                </p>
              </div>

              {/* Daily Ledger History Button */}
              <button
                type="button"
                id="btn-toggle-hide-totals"
                onClick={() => setShowDailyHistoryModal(true)}
                className="self-start sm:self-auto border border-gray-200/90 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 text-gray-800 transition-colors shadow-2xs cursor-pointer"
                title="View compiled daily ledgers and past history results"
              >
                <History className="w-4 h-4 text-gray-700" />
                <span>Daily History</span>
              </button>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              {/* Card 1: BOTTLES SOLD */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  BOTTLES SOLD
                </span>
                <span className="text-3xl sm:text-4xl font-black text-gray-900 mt-2 block tracking-tight">
                  {totalBottlesSold.toLocaleString()}
                </span>
              </div>

              {/* Card 2: GROSS REVENUE */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  GROSS REVENUE
                </span>
                <span className="text-3xl sm:text-4xl font-black text-gray-900 mt-2 block tracking-tight">
                  KSh {grossRevenue.toLocaleString()}
                </span>
              </div>

              {/* Card 3: COST OF GOODS */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  COST OF GOODS
                </span>
                <span className="text-3xl sm:text-4xl font-black text-gray-900 mt-2 block tracking-tight">
                  KSh {costOfGoods.toLocaleString()}
                </span>
              </div>

              {/* Card 4: NET PROFIT (Dark Styled) */}
              <div className="bg-[#0f172a] text-white rounded-2xl p-5 shadow-sm">
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                  NET PROFIT
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white mt-2 block tracking-tight">
                  KSh {netProfit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/90 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3">Item</th>
                    <th className="py-3 px-3">Cost</th>
                    <th className="py-3 px-3">Sold</th>
                    <th className="py-3 px-3">Profit</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {ledgerSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-sm text-gray-400 font-medium">
                        No sales recorded today.
                      </td>
                    </tr>
                  ) : (
                    ledgerSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-3 font-mono text-xs text-gray-500">{sale.time}</td>
                        <td className="py-3.5 px-3 font-semibold text-gray-900">{sale.item}</td>
                        <td className="py-3.5 px-3 text-gray-600">
                          KSh {sale.cost.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 text-gray-600">
                          KSh {sale.sold.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-emerald-600">
                          KSh {sale.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY (UPLOAD 2 + SEARCH + RUNNING-OUT-OF-STOCK ARRANGEMENT) */}
        {activeTab === 'INVENTORY' && (
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 sm:p-8">
            {/* Inventory Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Inventory
                  </h1>
                </div>

                {/* Items Badge */}
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                  {totalItemsCount} items
                </span>

                {/* Low Stock Badge */}
                <span className="bg-[#e11d48] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                  {lowStockCount} low
                </span>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                id="btn-refresh-inventory"
                onClick={handleRefresh}
                className="self-start sm:self-auto border border-gray-200/90 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 text-gray-700 transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Refresh Toast Notification */}
            {showRefreshToast && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Inventory stock counts refreshed successfully.</span>
              </div>
            )}

            {/* Search Bar & Stock Urgency Sorter Banner */}
            <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Field */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="input-inventory-search"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search inventory by bottle name, volume, category (e.g. Kenya Cane, Tusker, Gin)..."
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                />
                {inventorySearch && (
                  <button
                    type="button"
                    onClick={() => setInventorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sorting Status Chip (Showing that it's sorted by stock running out) */}
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-xl border border-gray-200/70 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-red-500" />
                <span>
                  Sorted by: <strong className="text-gray-800">Running out first</strong> (0 remaining → low stock → high)
                </span>
              </div>
            </div>

            {/* Search result count if filtering */}
            {inventorySearch && (
              <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <span>
                  Showing <strong>{sortedAndFilteredInventory.length}</strong> of {inventory.length} bottles for "{inventorySearch}"
                </span>
                <button
                  type="button"
                  onClick={() => setInventorySearch('')}
                  className="text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Inventory Table matching Upload 2 */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/90 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Item</th>
                    <th className="py-3 px-3">Volume</th>
                    <th className="py-3 px-3" title="Bottles sold today (resets daily from 0)">Sold (Today)</th>
                    <th className="py-3 px-3">Remaining</th>
                    <th className="py-3 px-3">Buy</th>
                    <th className="py-3 px-3">Sell</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100 font-medium">
                  {sortedAndFilteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-gray-400 font-medium">
                        No bottles found matching "{inventorySearch}".
                      </td>
                    </tr>
                  ) : (
                    sortedAndFilteredInventory.map((item) => {
                      const isOutOfStock = item.remaining === 0;
                      const isLow = item.remaining > 0 && item.remaining <= 2;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isOutOfStock
                              ? 'bg-red-50/30 hover:bg-red-50/60'
                              : isLow
                              ? 'bg-amber-50/20 hover:bg-amber-50/50'
                              : 'hover:bg-gray-50/60'
                          }`}
                        >
                          {/* Item Name */}
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-gray-900 block">{item.name}</span>
                            <span className="text-[11px] text-gray-400 font-normal">{item.category}</span>
                          </td>

                          {/* Volume (Blue font like Upload 2) */}
                          <td className="py-3.5 px-3 text-[#0284c7] font-semibold text-xs sm:text-sm">
                            {item.volume || '—'}
                          </td>

                          {/* Sold */}
                          <td className="py-3.5 px-3 text-gray-700">
                            <span className="font-semibold">{item.sold}</span>
                          </td>

                          {/* Remaining: 0 (OUT) or X ⚠️ or normal number */}
                          <td className="py-3.5 px-3">
                            {isOutOfStock ? (
                              <span className="font-extrabold text-red-600 bg-red-100/80 px-2 py-0.5 rounded-md inline-block">
                                0 (OUT)
                              </span>
                            ) : isLow ? (
                              <span className="font-extrabold text-red-600 flex items-center gap-1">
                                <span>{item.remaining}</span>
                                <span>⚠️</span>
                              </span>
                            ) : (
                              <span className="text-gray-900 font-semibold">{item.remaining}</span>
                            )}
                          </td>

                          {/* Buy (Wholesale) */}
                          <td className="py-3.5 px-3 text-gray-700">
                            KSh {item.buyPrice.toLocaleString()}
                          </td>

                          {/* Sell (Retail menu price) */}
                          <td className="py-3.5 px-3 text-gray-900 font-bold">
                            KSh {item.sellPrice.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TABLES & QR MANAGEMENT */}
        {activeTab === 'TABLES' && (
          <TablesManager
            tables={tables}
            employees={employees}
            businessId={businessId}
            businessName={businessName}
            onSaveTable={onSaveTable || (() => {})}
            onDeleteTable={onDeleteTable || (() => {})}
            onOpenCustomerView={onOpenCustomerView}
          />
        )}

        {/* TAB 3: EMPLOYEES MANAGEMENT */}
        {activeTab === 'EMPLOYEES' && (
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 sm:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Staff & Employees
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                  Manage employee shifts, roles, and real-time station status.
                </p>
              </div>

              {/* Add Employee Button */}
              <button
                type="button"
                id="btn-add-employee"
                onClick={handleOpenAddEmployee}
                className="bg-[#101828] hover:bg-[#1e293b] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            </div>

            {/* Quick Metrics & Search Bar */}
            <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                  Total: {employees.length}
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-200/60">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  On Duty ({employees.filter((e) => e.status === 'ON_DUTY').length})
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-gray-200">
                  <X className="w-3.5 h-3.5 text-gray-500 stroke-[2.5]" />
                  Off Duty ({employees.filter((e) => e.status === 'OFF_DUTY').length})
                </span>
                <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-red-200/60">
                  <X className="w-3.5 h-3.5 text-red-600 stroke-[3]" />
                  Did Not Come ({employees.filter((e) => e.status === 'ABSENT').length})
                </span>
              </div>

              {/* Search Bar & Ratings Button */}
              <div className="flex flex-col items-stretch md:items-end gap-2.5 w-full md:w-80">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="employee-search-input"
                    placeholder="Search staff, role, ID, National ID..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl pl-9.5 pr-8 py-2 text-xs sm:text-sm font-medium outline-none transition-all"
                  />
                  {employeeSearch && (
                    <button
                      type="button"
                      onClick={() => setEmployeeSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Ratings Button below search bar */}
                <button
                  type="button"
                  id="btn-open-ratings-compilation"
                  onClick={() => setShowRatingsModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100/90 text-amber-950 border border-amber-300/80 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer group self-stretch md:self-end"
                  title="View compiled customer ratings and calculation details for all workers"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 group-hover:rotate-12 transition-transform" />
                  <span>Ratings</span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md">
                    {employees.length} Staff
                  </span>
                </button>
              </div>
            </div>

            {/* Employees Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Employee Profile</th>
                    <th className="py-3 px-3">Staff ID</th>
                    <th className="py-3 px-3">PIN</th>
                    <th className="py-3 px-3">National ID</th>
                    <th className="py-3 px-3">Role / Position</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Shift Start</th>
                    <th className="py-3 px-3">Duty Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-3 text-gray-300 stroke-[1.5]" />
                        <p className="text-sm font-semibold text-gray-700">
                          {employees.length === 0
                            ? 'No employees registered yet'
                            : 'No matching employees found'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                          {employees.length === 0
                            ? 'Click "Add Employee" above to register your staff members with their photos, national IDs, and roles.'
                            : 'Try adjusting your search query.'}
                        </p>
                        {employees.length === 0 && (
                          <button
                            type="button"
                            onClick={handleOpenAddEmployee}
                            className="mt-4 inline-flex items-center gap-2 bg-[#101828] hover:bg-[#1e293b] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add First Employee</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Profile & Name with photo click trigger */}
                          <td className="py-3.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleOpenEditEmployee(emp)}
                              className="flex items-center gap-3 text-left group cursor-pointer"
                              title="Click to view/edit employee profile & picture"
                            >
                              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-blue-500/30 transition-all shadow-2xs">
                                {emp.avatarUrl ? (
                                  <img
                                    src={emp.avatarUrl}
                                    alt={emp.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {emp.name}
                                </div>
                                <div className="text-[11px] text-gray-400 group-hover:text-blue-500 transition-colors font-medium">
                                  Click to edit profile
                                </div>
                              </div>
                            </button>
                          </td>

                          {/* Staff ID */}
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">
                              {emp.staffId}
                            </span>
                          </td>

                          {/* PIN */}
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                              {emp.pin || '1234'}
                            </span>
                          </td>

                          {/* National ID */}
                          <td className="py-3.5 px-3 text-gray-700">
                            {emp.nationalId ? (
                              <span className="font-mono text-xs bg-gray-50 border border-gray-200 text-gray-800 px-2 py-0.5 rounded-md font-medium">
                                {emp.nationalId}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">—</span>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-gray-800 bg-gray-100/80 px-2.5 py-1 rounded-lg text-xs">
                              {emp.role === 'Bartender'
                                ? 'The bartender'
                                : emp.role === 'Cashier'
                                ? 'The cashier'
                                : emp.role === 'Waiter'
                                ? 'The waiter'
                                : 'The stock manager'}
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-3 text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs">{emp.phone}</span>
                            </div>
                          </td>

                          {/* Shift Start */}
                          <td className="py-3.5 px-3 text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs">{emp.shiftStart || 'Morning'}</span>
                            </div>
                          </td>

                          {/* Duty Status */}
                          <td className="py-3.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleToggleEmployeeStatus(emp.id)}
                              aria-label={
                                emp.status === 'ON_DUTY'
                                  ? 'On Duty'
                                  : emp.status === 'OFF_DUTY'
                                  ? 'Off Duty'
                                  : 'Did Not Come'
                              }
                              title={`Status: ${
                                emp.status === 'ON_DUTY'
                                  ? 'On Duty'
                                  : emp.status === 'OFF_DUTY'
                                  ? 'Off Duty'
                                  : 'Did Not Come'
                              } (Click to change)`}
                              className={`w-7 h-7 rounded-full inline-flex items-center justify-center cursor-pointer transition-all border ${
                                emp.status === 'ON_DUTY'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                                  : emp.status === 'OFF_DUTY'
                                  ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 hover:border-gray-300'
                                  : 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:border-red-400'
                              }`}
                            >
                              {emp.status === 'ON_DUTY' ? (
                                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                              ) : emp.status === 'OFF_DUTY' ? (
                                <X className="w-4 h-4 text-gray-500 stroke-[2.5]" />
                              ) : (
                                <X className="w-4 h-4 text-red-600 stroke-[3]" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DEDICATED NOTIFICATIONS PAGE */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 sm:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="w-6 h-6 text-gray-900" />
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Notifications & Stock Alerts
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                  Real-time activity on customer orders, depleted stock, and low bottle warnings.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {unreadNotificationsCount > 0 && onMarkAllNotificationsRead && (
                  <button
                    type="button"
                    id="btn-mark-all-read"
                    onClick={onMarkAllNotificationsRead}
                    className="border border-gray-200/90 bg-white hover:bg-gray-50 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 text-gray-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark all read</span>
                  </button>
                )}
                {notifications.length > 0 && onClearNotifications && (
                  <button
                    type="button"
                    id="btn-clear-notifications"
                    onClick={onClearNotifications}
                    className="border border-gray-200/90 bg-white hover:bg-red-50 hover:text-red-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 text-gray-600 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Clear all</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 my-5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setNotificationFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  notificationFilter === 'ALL'
                    ? 'bg-[#101828] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setNotificationFilter('CRITICAL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  notificationFilter === 'CRITICAL'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Out of Stock ({notifications.filter((n) => n.severity === 'critical').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setNotificationFilter('WARNING')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  notificationFilter === 'WARNING'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock ({notifications.filter((n) => n.severity === 'warning').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setNotificationFilter('ORDERS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  notificationFilter === 'ORDERS'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Orders Placed ({notifications.filter((n) => n.type === 'ORDER_PLACED').length})</span>
              </button>
            </div>

            {/* Notification Cards List */}
            <div className="space-y-3 mt-4">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-[1.5]" />
                  <p className="text-sm font-medium">No notifications in this view.</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isOut = notif.type === 'OUT_OF_STOCK' || notif.severity === 'critical';
                  const isLow = notif.type === 'LOW_STOCK' || notif.severity === 'warning';
                  const isOrder = notif.type === 'ORDER_PLACED' || notif.severity === 'success';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => onMarkNotificationRead && onMarkNotificationRead(notif.id)}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                        !notif.read
                          ? isOut
                            ? 'bg-red-50/50 border-red-200/90 shadow-2xs'
                            : isLow
                            ? 'bg-amber-50/50 border-amber-200/90 shadow-2xs'
                            : 'bg-blue-50/30 border-blue-200/80 shadow-2xs'
                          : 'bg-white border-gray-200/70 hover:bg-gray-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Status Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isOut
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : isOrder
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isOut ? (
                            <AlertOctagon className="w-5 h-5" />
                          ) : isLow ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : isOrder ? (
                            <ShoppingBag className="w-5 h-5" />
                          ) : (
                            <Info className="w-5 h-5" />
                          )}
                        </div>

                        {/* Title & Message */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900">
                              {notif.title}
                            </h3>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 font-medium">
                            <span>{notif.timestamp}</span>
                            <span>•</span>
                            <span>{notif.date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Quick Jump to Inventory if item-related */}
                      {notif.relatedItemId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const matched = inventory.find((i) => i.id === notif.relatedItemId);
                            handleGoToInventoryItem(matched ? matched.name : '');
                          }}
                          className="self-start sm:self-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-2xs cursor-pointer shrink-0"
                        >
                          Inspect Inventory
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Employee Profile Modal with Customer Rating Compilation & Fire Action */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xl w-full max-w-2xl my-6 relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-800 shadow-2xs">
                  {editingEmployeeId ? <User className="w-5 h-5 text-gray-700" /> : <UserPlus className="w-5 h-5 text-gray-700" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                    {editingEmployeeId ? 'Employee Profile & Customer Rating' : 'Register New Employee'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingEmployeeId
                      ? 'Customer satisfaction evaluation, station credentials & staff controls'
                      : 'Add a new team member to the station roster.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEmployeeModal(false);
                  setIsConfirmingFire(false);
                }}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* If editing an existing employee, render minimal Customer Rating summary */}
              {editingEmployeeId && selectedEmployee && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex items-center justify-between gap-4">
                  {/* Left: Profile Icon & Name */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 shadow-2xs">
                      {selectedEmployee.avatarUrl ? (
                        <img
                          src={selectedEmployee.avatarUrl}
                          alt={selectedEmployee.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 text-base">
                      {selectedEmployee.name}
                    </h4>
                  </div>

                  {/* Right at the farthest end: Ratings (Score + 5 Stars below) */}
                  <div className="text-right shrink-0">
                    <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                      {ratingStats.hasRatings ? ratingStats.average.toFixed(1) : '0.0'}
                      <span className="text-xs font-bold text-gray-400 ml-1">/ 5.0</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((starIndex) => {
                        const avg = ratingStats.hasRatings ? ratingStats.average : 0;
                        const isFilled = avg >= starIndex;
                        const isHalf = avg >= starIndex - 0.5 && avg < starIndex;
                        return (
                          <Star
                            key={starIndex}
                            className={`w-4 h-4 ${
                              isFilled
                                ? 'fill-amber-400 text-amber-400'
                                : isHalf
                                ? 'fill-amber-300/60 text-amber-400'
                                : 'text-gray-300 fill-gray-100'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Employee Form Details */}
              <form id="emp-profile-form" onSubmit={handleSaveEmployeeSubmit} className="space-y-4">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Employee Information
                </div>

                {/* Profile Picture Uploader */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4 bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                    <input
                      type="file"
                      id="emp-avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="emp-avatar-upload"
                      className="relative w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-dashed border-gray-300 hover:border-gray-900 flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 group shadow-2xs"
                      title="Click to select or change photo"
                    >
                      {empFormAvatarUrl ? (
                        <>
                          <img
                            src={empFormAvatarUrl}
                            alt="Employee profile"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                          <span className="text-[9px] font-semibold text-gray-500 group-hover:text-gray-900 transition-colors mt-0.5">
                            Upload
                          </span>
                        </>
                      )}
                    </label>

                    <div className="flex-1">
                      <label
                        htmlFor="emp-avatar-upload"
                        className="inline-block text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        {empFormAvatarUrl ? 'Change profile picture' : 'Upload employee photo'}
                      </label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Tap the avatar circle to choose an image (PNG, JPG up to 5MB).
                      </p>
                      {empFormAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEmpFormAvatarUrl('')}
                          className="text-[11px] text-red-600 hover:text-red-700 font-semibold mt-1 cursor-pointer block"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Employee Name"
                      value={empFormName}
                      onChange={(e) => setEmpFormName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-all"
                    />
                  </div>

                  {/* Worker PIN */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Worker PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="PIN"
                      value={empFormPin}
                      onChange={(e) => setEmpFormPin(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-all font-mono"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Required for worker POS login verification.
                    </p>
                  </div>

                  {/* National Identity Card Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      National Identity Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="National ID"
                      value={empFormNationalId}
                      onChange={(e) => setEmpFormNationalId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Role / Position */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Role / Position
                    </label>
                    <select
                      value={empFormRole}
                      onChange={(e) => setEmpFormRole(e.target.value as EmployeeRole)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-all cursor-pointer"
                    >
                      <option value="Bartender">The bartender</option>
                      <option value="Cashier">The cashier</option>
                      <option value="Waiter">The waiter</option>
                      <option value="Stock Manager">The stock manager</option>
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={empFormPhone}
                      onChange={(e) => setEmpFormPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-all"
                    />
                  </div>
                </div>
              </form>

              {/* Bottom Fire Employee Section (When editing an existing employee) */}
              {editingEmployeeId && (
                <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-4 sm:p-5 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-900">
                        Staff Termination & Fire Control
                      </h4>
                      <p className="text-xs text-red-700/90 mt-0.5">
                        Do you want to fire this employee? Firing will revoke their POS station access and permanently remove them from the active staff list.
                      </p>

                      {!isConfirmingFire ? (
                        <button
                          type="button"
                          onClick={() => setIsConfirmingFire(true)}
                          className="mt-3 inline-flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Fire Employee</span>
                        </button>
                      ) : (
                        <div className="mt-3.5 p-3.5 bg-white rounded-xl border border-red-300 shadow-2xs space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>
                              Are you sure you want to fire <strong className="underline">{empFormName || 'this employee'}</strong>?
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500">
                            This action cannot be undone. All assigned shifts and access tokens will be terminated immediately.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleFireEmployee}
                              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Yes, Confirm & Fire</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsConfirmingFire(false)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Sticky Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/70 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => {
                  setShowEmployeeModal(false);
                  setIsConfirmingFire(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="emp-profile-form"
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#101828] hover:bg-[#1e293b] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                {editingEmployeeId ? 'Save Changes' : 'Register Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAILY LEDGER HISTORY SCREEN / MODAL */}
      {showDailyHistoryModal && (
        <div
          id="modal-daily-history"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#101828] text-white shadow-2xs">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                    Daily Ledger History
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Chronological archive and breakdown of daily ledger results
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-daily-history"
                onClick={() => setShowDailyHistoryModal(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-200/50 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compiled Daily Ledgers List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredDailyLedgers.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-gray-700">No daily records found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Daily ledgers are compiled and saved automatically.
                  </p>
                </div>
              ) : (
                filteredDailyLedgers.map((day) => {
                  const isToday = day.date === todayDate;
                  const isExpanded = expandedHistoryDays.has(day.id);
                  const marginPct =
                    day.grossRevenue > 0
                      ? Math.round((day.netProfit / day.grossRevenue) * 100)
                      : 0;

                  return (
                    <div
                      key={day.id}
                      className="border border-gray-200 rounded-2xl p-5 bg-white hover:border-gray-300 transition-all shadow-2xs"
                    >
                      {/* Day Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-gray-100 text-gray-700">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                {day.formattedDate}
                              </h3>
                              {isToday ? (
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Live Shift
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Archived
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                              Date: {day.date} • {day.sales.length} logged sales
                            </p>
                          </div>
                        </div>

                        {/* Expand / Collapse items button */}
                        <button
                          type="button"
                          onClick={() => toggleDayExpanded(day.id)}
                          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Transactions' : `View ${day.sales.length} Transactions`}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Day Financial Metrics Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Bottles Sold
                          </span>
                          <span className="text-base font-extrabold text-gray-900 mt-0.5 block">
                            {day.totalBottlesSold}
                          </span>
                        </div>
                        <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Gross Revenue
                          </span>
                          <span className="text-base font-extrabold text-gray-900 mt-0.5 block">
                            KSh {day.grossRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Cost of Goods
                          </span>
                          <span className="text-base font-extrabold text-gray-900 mt-0.5 block">
                            KSh {day.costOfGoods.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-100">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                            Net Profit ({marginPct}%)
                          </span>
                          <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">
                            KSh {day.netProfit.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Line-item Ledger Table for this day */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-gray-200 text-gray-400 uppercase font-bold text-[10px] tracking-wider">
                                  <th className="py-2 px-2">Time</th>
                                  <th className="py-2 px-2">Item</th>
                                  <th className="py-2 px-2">Cost</th>
                                  <th className="py-2 px-2">Sold</th>
                                  <th className="py-2 px-2">Profit</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 font-medium">
                                {day.sales.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="py-6 text-center text-gray-400 italic">
                                      No itemized sales recorded for this shift.
                                    </td>
                                  </tr>
                                ) : (
                                  day.sales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50/60">
                                      <td className="py-2 px-2 font-mono text-gray-500">{sale.time}</td>
                                      <td className="py-2 px-2 font-semibold text-gray-900">{sale.item}</td>
                                      <td className="py-2 px-2 text-gray-600">KSh {sale.cost.toLocaleString()}</td>
                                      <td className="py-2 px-2 text-gray-600">KSh {sale.sold.toLocaleString()}</td>
                                      <td className="py-2 px-2 font-bold text-emerald-600">
                                        KSh {sale.profit.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Showing {filteredDailyLedgers.length} of {compiledDailyLedgers.length} compiled ledger day(s)
              </span>
              <button
                type="button"
                onClick={() => setShowDailyHistoryModal(false)}
                className="py-2 px-4 rounded-xl bg-[#101828] hover:bg-[#1e293b] text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL EMPLOYEES RATINGS MODAL */}
      {showRatingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xl w-full max-w-2xl my-6 relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Employee Ratings
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRatingsModal(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-white">
              {employees.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-bold text-gray-700">No employees found</p>
                </div>
              ) : (
                employees.map((emp, index) => {
                  const ratings = emp.ratings || [];
                  const totalRatings = ratings.length > 0 ? ratings.length : (emp.totalRatingsCount || 0);
                  const sumStars = ratings.length > 0
                    ? ratings.reduce((acc, r) => acc + r.rating, 0)
                    : (emp.averageRating || 0) * (emp.totalRatingsCount || 0);
                  const average = totalRatings > 0 ? Number((sumStars / totalRatings).toFixed(1)) : 0;
                  const hasWorked = totalRatings > 0;

                  return (
                    <div
                      key={emp.id}
                      className="bg-white rounded-2xl border border-gray-200/90 p-4 transition-all shadow-2xs flex items-center justify-between gap-4"
                    >
                      {/* Left: Profile Icon & Name */}
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 shadow-2xs">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">
                          {emp.name}
                        </h4>
                      </div>

                      {/* Right at the farthest end: Ratings & Employee Number */}
                      <div className="flex items-center gap-3 text-right shrink-0">
                        <div>
                          <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                            {hasWorked ? average.toFixed(1) : '0.0'}
                            <span className="text-xs font-bold text-gray-400 ml-1">/ 5.0</span>
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((starIndex) => {
                              const isFilled = hasWorked && average >= starIndex;
                              const isHalf = hasWorked && average >= starIndex - 0.5 && average < starIndex;
                              return (
                                <Star
                                  key={starIndex}
                                  className={`w-4 h-4 ${
                                    isFilled
                                      ? 'fill-amber-400 text-amber-400'
                                      : isHalf
                                      ? 'fill-amber-300/60 text-amber-400'
                                      : 'text-gray-300 fill-gray-100'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Employee Number on Right Hand Side */}
                        <div className="bg-gray-100 border border-gray-200 text-gray-700 font-extrabold font-mono text-sm px-2.5 py-1 rounded-xl shadow-2xs">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowRatingsModal(false)}
                className="py-2 px-5 rounded-xl bg-[#101828] hover:bg-[#1e293b] text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER & BAR PROFILE MODAL (Top Right Profile) */}
      {showProfileModal && (
        <div
          id="manager-profile-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            id="manager-profile-modal-card"
            className="w-full max-w-[440px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-7 relative flex flex-col border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-bold text-black tracking-tight">Manager & Bar Profile</h2>
                  <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
                </div>
                <p className="text-xs text-gray-500">Edit bar details, PIN, and security question</p>
              </div>
            </div>

            {profileSaveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-gray-900 border border-black text-white text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF6A00] stroke-[3]" />
                <span>Profile & Security settings saved successfully!</span>
              </div>
            )}

            {profilePinError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {profilePinError}
              </div>
            )}

            {/* Profile Picture Section */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="relative w-16 h-16 rounded-2xl bg-black text-white font-bold text-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-300 shadow-xs group">
                {profilePhotoURL ? (
                  <img src={profilePhotoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (profileManagerName || 'M').charAt(0).toUpperCase()
                )}
                <label
                  htmlFor="manager-avatar-upload"
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white"
                  title="Change photo"
                >
                  <Camera className="w-5 h-5" />
                </label>
                <input
                  id="manager-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setProfilePhotoURL(ev.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <label
                  htmlFor="manager-avatar-upload"
                  className="text-xs font-bold text-black hover:text-[#FF6A00] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{profilePhotoURL ? 'Change Picture' : 'Upload Picture'}</span>
                </label>
                <p className="text-[11px] text-gray-400 mt-0.5">Click photo to select an image from your device.</p>
                {profilePhotoURL && (
                  <button
                    type="button"
                    onClick={() => setProfilePhotoURL('')}
                    className="text-[10px] text-red-500 hover:underline mt-1 font-semibold cursor-pointer block"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProfilePinError(null);

                // If user wants to reset PIN
                if (profileNewPin || profileConfirmNewPin) {
                  if (profileNewPin.length !== 4 || !/^\d{4}$/.test(profileNewPin)) {
                    setProfilePinError('New PIN must be exactly 4 digits');
                    return;
                  }
                  if (profileNewPin !== profileConfirmNewPin) {
                    setProfilePinError('New PINs do not match');
                    return;
                  }
                }

                setProfileSaving(true);
                const updatedBarName = profileBarName.trim() || "Rio's POS";
                const updatedManagerName = profileManagerName.trim() || 'Talik';
                const finalPin = profileNewPin || profilePin || managerAccount?.pin || '1234';

                await apiUpdateBusinessProfile(
                  {
                    businessName: updatedBarName,
                    managerName: updatedManagerName,
                    managerPhotoURL: profilePhotoURL || undefined,
                  },
                  businessId
                );

                if (onUpdateManagerProfile) {
                  onUpdateManagerProfile({
                    venueName: updatedBarName,
                    displayName: updatedManagerName,
                    photoURL: profilePhotoURL || undefined,
                    pin: finalPin,
                    securityQuestion: profileSecurityQuestion,
                    securityAnswer: profileSecurityAnswer.trim(),
                  });
                }

                setProfileSaveSuccess(true);
                setProfileSaving(false);
                setTimeout(() => {
                  setShowProfileModal(false);
                  setProfileSaveSuccess(false);
                }, 900);
              }}
              className="space-y-4"
            >
              {/* 1. Bar / Restaurant Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Bar / Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={profileBarName}
                  onChange={(e) => setProfileBarName(e.target.value)}
                  placeholder="e.g. Rio's POS, Skyline Bar & Grill"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-all text-black"
                />
              </div>

              {/* 2. Manager Display Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Your Name (Manager)
                </label>
                <input
                  type="text"
                  required
                  value={profileManagerName}
                  onChange={(e) => setProfileManagerName(e.target.value)}
                  placeholder="e.g. Talik"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-all text-black"
                />
              </div>

              {/* 3. PIN & Security Section */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-black uppercase tracking-wider">Manager PIN & Security</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
                  </div>
                  {managerAccount?.pin && (
                    <span className="text-[10px] text-gray-500 font-semibold">PIN is active</span>
                  )}
                </div>

                {/* Reset PIN fields */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      New 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      value={profileNewPin}
                      onChange={(e) => setProfileNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Leave blank to keep"
                      className="w-full px-3 py-2 text-center text-xs font-bold tracking-widest rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-black transition-all text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      value={profileConfirmNewPin}
                      onChange={(e) => setProfileConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Confirm PIN"
                      className="w-full px-3 py-2 text-center text-xs font-bold tracking-widest rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-black transition-all text-black"
                    />
                  </div>
                </div>

                {/* Security Question */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Security Question (For Recovery)
                  </label>
                  <select
                    value={profileSecurityQuestion}
                    onChange={(e) => setProfileSecurityQuestion(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-black transition-all text-black"
                  >
                    <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    <option value="What was the name of your first school?">What was the name of your first school?</option>
                    <option value="What city were you born in?">What city were you born in?</option>
                    <option value="What is your favorite beverage brand?">What is your favorite beverage brand?</option>
                    <option value="What was your first pet's name?">What was your first pet's name?</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Security Answer
                  </label>
                  <input
                    type="text"
                    value={profileSecurityAnswer}
                    onChange={(e) => setProfileSecurityAnswer(e.target.value)}
                    placeholder="Enter answer for recovery"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-black transition-all text-black"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-900 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>{profileSaving ? 'Saving...' : 'Save Profile'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
