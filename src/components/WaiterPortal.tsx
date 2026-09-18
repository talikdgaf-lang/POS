import React, { useState, useEffect, useRef } from 'react';
import { 
  Wine, 
  Search, 
  Bell, 
  ClipboardList, 
  LayoutGrid, 
  User as UserIcon, 
  Settings, 
  HelpCircle, 
  Clock, 
  UtensilsCrossed, 
  Check, 
  X, 
  ChevronRight,
  LogOut,
  Star,
  Award,
  Phone,
  Shield,
  IdCard,
  UserCheck
} from 'lucide-react';
import { BottleVisual } from './BottleVisual';
import { Employee, Order } from '../types';
import { getEmployeesSortedByRating, EMPLOYEES_UPDATED_EVENT, getCurrentMonthInfo } from '../utils/employeeRatings';

interface WaiterPortalProps {
  waiter?: Employee;
  orders: Order[];
  onUpdateOrder: (orderId: string, updatedFields: Partial<Order>) => void;
  onLogout: () => void;
}

export const WaiterPortal: React.FC<WaiterPortalProps> = ({ waiter, orders, onUpdateOrder, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState<'incoming' | 'my_orders' | 'table_view' | 'profile' | 'settings'>('incoming');
  const [selectedAcceptedOrder, setSelectedAcceptedOrder] = useState<Order | null>(null);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const servedTimersRef = useRef<{ [orderId: string]: number }>({});

  // Auto-remove served orders after 6 seconds
  useEffect(() => {
    orders.forEach((order) => {
      if (order.status === 'Served' && !servedTimersRef.current[order.id]) {
        servedTimersRef.current[order.id] = window.setTimeout(() => {
          onUpdateOrder(order.id, { status: 'Completed' });
          delete servedTimersRef.current[order.id];
        }, 6000); // 6 seconds
      }
    });

    return () => {
      (Object.values(servedTimersRef.current) as number[]).forEach((id) => clearTimeout(id));
    };
  }, [orders, onUpdateOrder]);

  const handleAction = (orderId: string, newStatus: 'Accepted' | 'Declined') => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    if (newStatus === 'Accepted') {
      const partialUpdate: Partial<Order> = {
        status: 'Accepted',
        trackingStep: 2,
        waiterName: waiter?.name || 'Waiter',
      };
      onUpdateOrder(orderId, partialUpdate);
      setSelectedAcceptedOrder({ ...targetOrder, ...partialUpdate });
    } else {
      onUpdateOrder(orderId, {
        status: 'Declined',
      });
    }
  };

  const handleAdvanceOrderStep = (orderId: string, nextStep: number, nextStatus: string) => {
    onUpdateOrder(orderId, {
      status: nextStatus as any,
      trackingStep: nextStep,
    });
  };

  const handleReadyOrder = () => {
    if (!selectedAcceptedOrder) return;
    onUpdateOrder(selectedAcceptedOrder.id, {
      status: 'Preparing',
      trackingStep: 3,
    });
    setSelectedAcceptedOrder(null);
  };

  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const sortedOrders = [...orders].sort((a, b) => b.minutesAgo - a.minutesAgo);
  const filteredOrders = sortedOrders.filter(
    (o) =>
      o.status !== 'Completed' &&
      (o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const waiterName = waiter ? waiter.name : 'Staff';
  const waiterRole = waiter ? waiter.role : 'Waiter';

  const [allEmployees, setAllEmployees] = useState<Employee[]>(() => getEmployeesSortedByRating());

  useEffect(() => {
    const handleSync = () => {
      setAllEmployees(getEmployeesSortedByRating());
    };
    window.addEventListener(EMPLOYEES_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(EMPLOYEES_UPDATED_EVENT, handleSync);
  }, []);

  const currentEmp = allEmployees.find((e) => e.name.toLowerCase() === waiterName.toLowerCase()) || waiter;
  const rankIndex = allEmployees.findIndex((e) => e.name.toLowerCase() === waiterName.toLowerCase());
  const rankNumber = rankIndex !== -1 ? rankIndex + 1 : 1;
  const currentAvg = currentEmp?.averageRating || 0;
  const currentCount = currentEmp?.totalRatingsCount || currentEmp?.ratings?.length || 0;
  const monthInfo = getCurrentMonthInfo();

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#f8fafc] flex flex-col font-sans select-none text-gray-900 w-full max-w-full">
      {/* Top Header Bar - Non-scrolling fixed header */}
      <header className="min-h-16 shrink-0 bg-white border-b border-gray-200 px-3 sm:px-6 py-2.5 flex items-center justify-between z-30 shadow-2xs gap-2 sm:gap-4 w-full max-w-full overflow-x-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#f97316] flex items-center justify-center text-white shadow-xs">
            <Wine className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">BeverageHub</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl px-1 sm:px-4 min-w-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50/80 border border-gray-200/90 rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
            />
          </div>
        </div>

        {/* Date & Time (Desktop) + Logout */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-right">
          <div className="text-xs hidden md:block">
            <div className="font-bold text-gray-900">Today, 14:32</div>
            <div className="text-gray-500 font-medium">Sat, 14 Jun 2025</div>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar (Only visible on mobile / tablet) */}
      <div className="md:hidden bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveNav('incoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeNav === 'incoming'
                ? 'bg-orange-50 text-orange-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Orders</span>
            {pendingOrders.length > 0 && (
              <span className="bg-[#f97316] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('profile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeNav === 'profile'
                ? 'bg-orange-50 text-orange-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate max-w-[100px]">{waiterName}</span>
        </div>
      </div>

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden w-full max-w-full">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col justify-between p-4 shrink-0">
          <div>
            {/* User Profile Card */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-500 text-orange-700 font-bold flex items-center justify-center text-sm shadow-2xs">
                {waiterName.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-gray-900 truncate">{waiterName}</h4>
                <p className="text-xs font-medium text-gray-500 capitalize">{waiterRole}</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveNav('incoming')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  activeNav === 'incoming'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4" />
                  <span>Incoming Orders</span>
                </div>
                {pendingOrders.length > 0 && (
                  <span className="bg-[#f97316] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    {pendingOrders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveNav('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  activeNav === 'profile'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </button>
            </nav>
          </div>

          {/* Need Help Footer */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-2xs shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h5 className="text-xs font-bold text-gray-900">Need Help?</h5>
              <p className="text-[11px] text-gray-500 truncate">Contact your manager</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-full overflow-x-hidden">
          {activeNav === 'profile' ? (
            <div className="max-w-3xl w-full mx-auto space-y-6 animate-in fade-in duration-200 py-2">
              {/* Profile Card Header */}
              <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-orange-100 border-2 border-orange-500 flex items-center justify-center text-orange-700 text-2xl font-black shrink-0 shadow-2xs">
                    {currentEmp?.avatarUrl ? (
                      <img src={currentEmp.avatarUrl} alt={waiterName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{waiterName.split(' ').map((n) => n[0]).join('')}</span>
                    )}
                  </div>

                  <div className="text-center sm:text-left flex-1 space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h2 className="text-2xl font-black text-gray-900">{waiterName}</h2>
                      <span className="font-mono text-xs bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-0.5 rounded-md font-extrabold">
                        {currentEmp?.staffId || 'EMP-101'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-500 capitalize">{currentEmp?.role || 'Waiter'}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>On Duty</span>
                      </span>
                      {currentEmp?.phone && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{currentEmp.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Current Rating & Standings */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                        Customer Service Rating
                      </h3>
                      <span className="bg-orange-50 text-orange-800 border border-orange-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                        {monthInfo.label} Cycle
                      </span>
                    </div>
                    <span className="bg-orange-50 text-orange-900 border border-orange-200 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-orange-600" />
                      <span>Rank #{rankNumber} Top Server</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Score & Stars */}
                    <div>
                      <div className="text-3xl sm:text-4xl font-black text-gray-900 leading-none">
                        {currentAvg > 0 ? currentAvg.toFixed(1) : '0.0'}
                        <span className="text-base font-bold text-gray-400 ml-1">/ 5.0</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((starIndex) => {
                          const isFilled = currentAvg >= starIndex;
                          const isHalf = currentAvg >= starIndex - 0.5 && currentAvg < starIndex;
                          return (
                            <Star
                              key={starIndex}
                              className={`w-5 h-5 ${
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

                    {/* Stats details */}
                    <div className="text-center sm:text-right text-xs text-gray-600 space-y-1">
                      <div className="font-bold text-gray-900 text-sm">
                        {currentCount > 0 ? `${currentCount} Customer Evaluations (${monthInfo.monthName})` : `0 Evaluations (${monthInfo.monthName})`}
                      </div>
                      <p className="text-gray-500 max-w-xs text-[11px] leading-relaxed">
                        Ratings accumulate daily throughout {monthInfo.monthName}. At the end of the month, scores automatically reset to 0 for the new month.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Left Orders Feed */
            <div className="flex-1 space-y-4">
              {/* Header Title */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-gray-900">Incoming Orders</h1>
                <span className="bg-[#f97316] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                  <p className="text-sm font-medium">No orders found matching your search.</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
                  >
                    {/* Left Order Info & Items */}
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6">
                      {/* Order Meta */}
                      <div className="w-40 shrink-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-orange-600 font-mono">{order.customerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-gray-400" />
                          <span>{order.table}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{order.timeAgo}</span>
                        </div>
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              order.status === 'Pending'
                                ? 'bg-orange-50 text-orange-700 border border-orange-200/60'
                                : order.status === 'Accepted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : 'bg-red-50 text-red-700 border border-red-200/60'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Order Items Horizontal Cards */}
                      <div className="flex items-center gap-3 flex-1 overflow-x-auto pb-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50/80 border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center w-28 h-28 text-center relative shrink-0"
                          >
                            <div className="h-14 flex items-center justify-center mb-1">
                              <BottleVisual type={item.bottleType} className="h-12 max-w-[44px]" />
                            </div>
                            <span className="text-[11px] font-bold text-gray-800 truncate w-full px-1">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Total & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-6 shrink-0 gap-3">
                      <div className="text-left sm:text-right">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</div>
                        <div className="text-base font-extrabold text-orange-600">
                          KSh {order.total.toLocaleString()}
                        </div>
                      </div>

                      {order.status === 'Pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(order.id, 'Accepted')}
                            className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleAction(order.id, 'Declined')}
                            className="bg-[#18181b] hover:bg-black text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Decline</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          {order.status === 'Accepted' && (
                            <button
                              onClick={() => setSelectedAcceptedOrder(order)}
                              className="bg-black hover:bg-zinc-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                            >
                              <span>View Order & Ready</span>
                              <ChevronRight className="w-3.5 h-3.5 text-[#f97316]" />
                            </button>
                          )}

                          {order.status === 'Preparing' && (
                            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3.5 py-2 rounded-xl text-xs font-bold text-[#ea580c]">
                              <span className="w-2 h-2 rounded-full bg-[#f97316] animate-ping" />
                              <span>Preparing</span>
                            </div>
                          )}

                          {order.status === 'Served' && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700">
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                              <span>Served</span>
                            </div>
                          )}

                          {order.paymentMethod === 'cash' && !order.paymentConfirmed && (
                            <button
                              onClick={() => onUpdateOrder(order.id, { paymentConfirmed: true })}
                              className="bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Confirm Cash Received
                            </button>
                          )}

                          <div className="text-[11px] font-bold text-gray-500">
                            Status: <span className="text-[#f97316] font-extrabold">{order.status}</span>
                            {order.waiterName && <span className="ml-1 text-gray-400">({order.waiterName})</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Accepted Order Modal */}
      {selectedAcceptedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-orange-600 font-mono">{selectedAcceptedOrder.id}</span>
                <h3 className="text-lg font-extrabold text-gray-900">Order Accepted ({selectedAcceptedOrder.table})</h3>
              </div>
              <button
                onClick={() => setSelectedAcceptedOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
              {selectedAcceptedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-1">
                      <BottleVisual type={item.bottleType} className="h-8 max-w-[28px]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">Quantity: {item.quantity}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-6">
              <span className="text-sm font-bold text-gray-500">Total Amount</span>
              <span className="text-xl font-extrabold text-orange-600">KSh {selectedAcceptedOrder.total.toLocaleString()}</span>
            </div>

            <button
              onClick={handleReadyOrder}
              className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer text-center text-sm uppercase tracking-wider"
            >
              Ready
            </button>
          </div>
        </div>
      )}

      {/* Cash Payment Modal */}
      {selectedPaymentOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black">KSh</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">Confirm Cash Payment</h3>
            <p className="text-sm text-gray-500 mb-6">
              Collect <span className="font-bold text-gray-900">KSh {selectedPaymentOrder.total.toLocaleString()}</span> from {selectedPaymentOrder.customerName}.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onUpdateOrder(selectedPaymentOrder.id, { paymentConfirmed: true, status: 'Completed' });
                  setSelectedPaymentOrder(null);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer text-center text-sm uppercase tracking-wider"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => setSelectedPaymentOrder(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-center text-sm tracking-wider"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
