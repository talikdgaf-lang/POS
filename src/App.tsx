import { useState, useEffect } from 'react';
import logoImg from './assets/images/rios_pos_logo_1789649347478.jpg';
import {
  ViewState,
  ModalState,
  InventoryItem,
  LedgerSale,
  CartItem,
  ManagerNotification,
  DailyLedgerRecord,
  Employee,
  Order,
  RestaurantTable,
  ManagerAccount
} from './types';
import { INITIAL_INVENTORY } from './data/initialInventory';
import { INITIAL_NOTIFICATIONS } from './data/initialNotifications';
import { INITIAL_TABLES } from './data/initialTables';
import { INITIAL_EMPLOYEES } from './data/initialEmployees';
import { EMPLOYEES_UPDATED_EVENT } from './utils/employeeRatings';
import { ManagerModal } from './components/ManagerModal';
import { WorkerModal } from './components/WorkerModal';
import { CustomerScreen } from './components/CustomerScreen';
import { CustomerNameModal } from './components/CustomerNameModal';
import { BeverageHubStore } from './components/BeverageHubStore';
import { PaymentModal } from './components/PaymentModal';
import { MpesaModal } from './components/MpesaModal';
import { CashModal } from './components/CashModal';
import { ManagerPortal } from './components/ManagerPortal';
import { WaiterPortal } from './components/WaiterPortal';
import { BartenderPortal } from './components/BartenderPortal';
import { StockManagerPortal } from './components/StockManagerPortal';
import { CustomerOrderTrackingModal } from './components/CustomerOrderTrackingModal';
import { BrandSplashIntro } from './components/BrandSplashIntro';
import { GoogleLoginModal } from './components/GoogleLoginModal';
import {
  fetchAppState,
  subscribeToRealtimeStream,
  apiCreateOrder,
  apiUpdateOrder,
  apiUpdateInventory,
  apiAddStock,
  apiAddLedgerSales,
  apiAddNotifications,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
  apiClearNotifications,
  apiFetchTables,
  apiSaveTable,
  apiDeleteTable,
  apiSaveEmployees
} from './utils/api';
import { QrCode, Smartphone, LogOut, Sparkles, UserCheck } from 'lucide-react';

export default function App() {
  // Authentication & Venue Scoping State
  const [managerAccount, setManagerAccount] = useState<ManagerAccount | null>(() => {
    try {
      const saved = localStorage.getItem('beverage_hub_manager_account');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default manager account if not set
    return {
      uid: 'google-talikdgaf@gmail.com',
      email: 'talikdgaf@gmail.com',
      displayName: 'Talik',
      venueName: "Rio's POS",
    };
  });

  const [businessId, setBusinessId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const venueParam = urlParams.get('venue') || urlParams.get('businessId');
    if (venueParam) return venueParam.toLowerCase().trim();

    try {
      const saved = localStorage.getItem('beverage_hub_manager_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) return parsed.email.toLowerCase().trim();
      }
    } catch (e) {}
    return 'talikdgaf@gmail.com';
  });

  // Table assigned for customer ordering (e.g. from QR scan)
  const [customerTable, setCustomerTable] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('table') || 'Table 1';
  });

  const [view, setView] = useState<ViewState>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    const venueParam = urlParams.get('venue') || urlParams.get('businessId');

    // If opened via Table QR Code, land directly in Customer view
    if (tableParam || venueParam) {
      return 'CUSTOMER_LANDING';
    }

    // Start on the loading splash screen when opening the app
    return 'WELCOME_SLIDER';
  });

  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState<boolean>(false);
  const [googleLoginRoleMode, setGoogleLoginRoleMode] = useState<'MANAGER' | 'WORKER'>('MANAGER');
  const [modal, setModal] = useState<ModalState>('NONE');
  const [customerName, setCustomerName] = useState<string>('');
  const [checkoutTotal, setCheckoutTotal] = useState<number>(0);
  const [checkoutCart, setCheckoutCart] = useState<CartItem[]>([]);
  const [clearCartFn, setClearCartFn] = useState<(() => void) | null>(null);
  const [waiterEmployee, setWaiterEmployee] = useState<Employee | null>(() => {
    try {
      const saved = localStorage.getItem('beverage_hub_active_worker');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed;
      }
    } catch (e) {}
    return null;
  });
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState<boolean>(false);

  // Real-Time App State (Scoped by businessId)
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [ledgerSales, setLedgerSales] = useState<LedgerSale[]>([]);
  const [notifications, setNotifications] = useState<ManagerNotification[]>(INITIAL_NOTIFICATIONS);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('beverage_hub_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (emp) =>
              !['emp-1', 'emp-2', 'emp-3', 'emp-4'].includes(emp.id) &&
              !['Daniel K.', 'Alex Mercer', 'Sarah Jenkins', 'Michael Scott'].includes(emp.name)
          );
        }
      }
    } catch (e) {}
    return [];
  });
  const [tables, setTables] = useState<RestaurantTable[]>(INITIAL_TABLES);

  // Sync employees if updated anywhere (e.g. ManagerPortal or ratings)
  useEffect(() => {
    const handleSyncEmployees = () => {
      try {
        const saved = localStorage.getItem('beverage_hub_employees');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(
              (emp) =>
                !['emp-1', 'emp-2', 'emp-3', 'emp-4'].includes(emp.id) &&
                !['Daniel K.', 'Alex Mercer', 'Sarah Jenkins', 'Michael Scott'].includes(emp.name)
            );
            setEmployees(cleaned);
          }
        }
      } catch (e) {}
    };
    window.addEventListener(EMPLOYEES_UPDATED_EVENT, handleSyncEmployees);
    return () => window.removeEventListener(EMPLOYEES_UPDATED_EVENT, handleSyncEmployees);
  }, []);

  // Load and subscribe to real-time updates for the current businessId
  useEffect(() => {
    let isSubscribed = true;

    const loadData = () => {
      fetchAppState(businessId).then((state) => {
        if (!isSubscribed || !state) return;
        if (state.orders) setOrders(state.orders);
        if (state.inventory && state.inventory.length > 0) setInventory(state.inventory);
        if (state.ledgerSales) setLedgerSales(state.ledgerSales);
        if (state.notifications) setNotifications(state.notifications);
        if (Array.isArray(state.employees)) {
          setEmployees(state.employees);
        }
        if (state.tables && state.tables.length > 0) setTables(state.tables);
      });
    };

    loadData();

    // Subscribe to SSE real-time cross-device stream
    const unsubscribe = subscribeToRealtimeStream((data) => {
      if (!isSubscribed || !data) return;
      if (data.orders) setOrders(data.orders);
      if (data.inventory && data.inventory.length > 0) setInventory(data.inventory);
      if (data.ledgerSales) setLedgerSales(data.ledgerSales);
      if (data.notifications) setNotifications(data.notifications);
      if (Array.isArray(data.employees)) {
        setEmployees(data.employees);
      }
      if (data.tables && data.tables.length > 0) setTables(data.tables);
    }, businessId);

    // Fallback polling every 2.5 seconds
    const pollInterval = setInterval(loadData, 2500);

    return () => {
      isSubscribed = false;
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [businessId]);

  // Sync active tracking order with latest status from server
  useEffect(() => {
    if (activeTrackingOrder) {
      const found = orders.find((o) => o.id === activeTrackingOrder.id);
      if (found) {
        setActiveTrackingOrder(found);
      }
    }
  }, [orders]);

  // Daily Reset check
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('beverage_hub_last_date');
    if (savedDate && savedDate !== todayStr) {
      const updatedInv = inventory.map((item) => ({ ...item, sold: 0 }));
      setInventory(updatedInv);
      setLedgerSales([]);
      apiUpdateInventory(updatedInv, businessId);
    }
    localStorage.setItem('beverage_hub_last_date', todayStr);
  }, [businessId]);

  const handleResetDailySold = () => {
    const updatedInv = inventory.map((item) => ({ ...item, sold: 0 }));
    setInventory(updatedInv);
    setLedgerSales([]);
    apiUpdateInventory(updatedInv, businessId);
  };

  const handleAddStock = (itemId: string, quantityToAdd: number) => {
    setInventory((prevInventory) =>
      prevInventory.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            remaining: item.remaining + quantityToAdd,
          };
        }
        return item;
      })
    );
    apiAddStock(itemId, quantityToAdd, businessId);
  };

  // Google Login Completion Handler
  const handleGoogleLoginSuccess = (account: ManagerAccount, roleMode: 'MANAGER' | 'WORKER') => {
    // Preserve existing PIN and security questions if already stored for this email
    let finalAccount = { ...account };
    try {
      const stored = localStorage.getItem('beverage_hub_manager_account');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email === account.email && parsed.pin) {
          finalAccount = { ...finalAccount, pin: parsed.pin, securityQuestion: parsed.securityQuestion, securityAnswer: parsed.securityAnswer };
        }
      }
    } catch (e) {}

    setManagerAccount(finalAccount);
    setBusinessId(finalAccount.email);
    localStorage.setItem('beverage_hub_manager_account', JSON.stringify(finalAccount));
    sessionStorage.setItem('beverage_hub_intro_seen', 'true');
    setShowGoogleLoginModal(false);

    if (roleMode === 'MANAGER') {
      setModal('MANAGER_PIN');
    } else {
      setModal('WORKER_LOGIN');
    }
  };

  // Table Management Handlers
  const handleSaveTable = async (table: Partial<RestaurantTable>) => {
    await apiSaveTable(table, businessId);
    const updated = await apiFetchTables(businessId);
    if (updated && updated.length > 0) {
      setTables(updated);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    await apiDeleteTable(tableId, businessId);
    const updated = await apiFetchTables(businessId);
    if (updated) {
      setTables(updated);
    }
  };

  // Order Placement Handler (Scoped by current businessId and table)
  const handleOrderSuccess = (method: 'M-PESA' | 'Cash') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = 'Today';

    let updatedInventory = [...inventory];
    const newAlerts: ManagerNotification[] = [];
    let newSales: LedgerSale[] = [];
    let orderAlert: ManagerNotification | null = null;

    if (checkoutCart.length > 0) {
      // 1. Deduct bottles from inventory
      updatedInventory = inventory.map((item) => {
        const ordered = checkoutCart.find((c) => c.product.id === item.id);
        if (!ordered) return item;

        const qty = ordered.quantity;
        const updatedSold = item.sold + qty;
        const updatedRemaining = Math.max(0, item.remaining - qty);

        if (updatedRemaining === 0 && item.remaining > 0) {
          newAlerts.push({
            id: `notif-out-${item.id}-${Date.now()}`,
            type: 'OUT_OF_STOCK',
            title: `${item.name} Depleted!`,
            message: `${item.name} (${item.volume}) reached 0 remaining bottles following order by ${customerName || 'Customer'}.`,
            timestamp: timeStr,
            date: todayStr,
            read: false,
            relatedItemId: item.id,
            severity: 'critical',
          });
        } else if (updatedRemaining <= 2 && updatedRemaining > 0 && item.remaining > 2) {
          newAlerts.push({
            id: `notif-low-${item.id}-${Date.now()}`,
            type: 'LOW_STOCK',
            title: `Low Stock: ${item.name}`,
            message: `${item.name} (${item.volume}) is running low (${updatedRemaining} remaining).`,
            timestamp: timeStr,
            date: todayStr,
            read: false,
            relatedItemId: item.id,
            severity: 'warning',
          });
        }

        return {
          ...item,
          sold: updatedSold,
          remaining: updatedRemaining,
        };
      });

      setInventory(updatedInventory);

      // 2. Add an Order Placed notification
      const itemsSummary = checkoutCart
        .map((c) => `${c.quantity}x ${c.product.name}`)
        .join(', ');

      orderAlert = {
        id: `notif-order-${Date.now()}`,
        type: 'ORDER_PLACED',
        title: `New Order (${method} - ${customerTable})`,
        message: `${customerName || 'Customer'} at ${customerTable} ordered ${itemsSummary} • KSh ${checkoutTotal.toLocaleString()}`,
        timestamp: timeStr,
        date: todayStr,
        read: false,
        severity: 'success',
      };

      setNotifications((prev) => [orderAlert!, ...newAlerts, ...prev]);

      // 3. Add to Ledger Sales (per item)
      newSales = checkoutCart.map((c, index) => {
        const inv = inventory.find((i) => i.id === c.product.id);
        const buyPrice = inv ? inv.buyPrice : Math.round(c.product.price * 0.68);
        const cost = buyPrice * c.quantity;
        const sold = c.product.price * c.quantity;
        const profit = sold - cost;

        return {
          id: `sale-${Date.now()}-${index}`,
          time: timeStr,
          item: `${c.product.name} (x${c.quantity}) - ${customerName || 'Customer'} (${customerTable})`,
          cost,
          sold,
          profit,
        };
      });

      setLedgerSales((prev) => [...newSales, ...prev]);
    } else if (checkoutTotal > 0) {
      const cost = Math.round(checkoutTotal * 0.68);
      const profit = checkoutTotal - cost;

      const singleSale: LedgerSale = {
        id: `sale-${Date.now()}`,
        time: timeStr,
        item: `Customer Order (${method} - ${customerName || 'Walk-in'} at ${customerTable})`,
        cost,
        sold: checkoutTotal,
        profit,
      };

      newSales = [singleSale];
      setLedgerSales((prev) => [singleSale, ...prev]);
    }

    // 4. Create new Order for Tracking & Waiter Portal
    const newOrder: Order = {
      id: `#OH-${Math.floor(1000 + Math.random() * 9000)}`,
      businessId: businessId,
      customerName: customerName || 'Customer',
      table: customerTable || 'Table 1',
      timeAgo: 'Just now',
      minutesAgo: 0,
      status: 'Pending',
      trackingStep: 1,
      paymentMethod: method === 'Cash' ? 'cash' : 'mpesa',
      paymentConfirmed: method !== 'Cash',
      items:
        checkoutCart.length > 0
          ? checkoutCart.map((c, i) => ({
              id: String(i + 1),
              name: c.product.name,
              bottleType: c.product.imageType,
              quantity: c.quantity,
            }))
          : [{ id: '1', name: 'Beverage Order', bottleType: 'tusker', quantity: 1 }],
      total: checkoutTotal,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveTrackingOrder(newOrder);
    setShowTrackingModal(true);

    // Call server API scoped by businessId for instant multi-device sync
    apiCreateOrder(newOrder, businessId);
    if (newSales.length > 0) apiAddLedgerSales(newSales, businessId);
    if (orderAlert || newAlerts.length > 0) {
      const allNotifs = orderAlert ? [orderAlert, ...newAlerts] : newAlerts;
      apiAddNotifications(allNotifs, businessId);
    }
    apiUpdateInventory(updatedInventory, businessId);

    if (clearCartFn) clearCartFn();
    setCheckoutCart([]);
    setModal('NONE');
  };

  const handleUpdateOrder = (orderId: string, updatedFields: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updatedFields } : o)));
    apiUpdateOrder(orderId, updatedFields, businessId);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    apiMarkNotificationRead(id, businessId);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    apiMarkAllNotificationsRead(businessId);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    apiClearNotifications(businessId);
  };

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-white">
      {/* 1. BRAND LOADING SCREEN */}
      {view === 'WELCOME_SLIDER' && (
        <BrandSplashIntro
          onContinue={() => {
            setView('ROLE_SELECTION');
          }}
        />
      )}

      {/* 2. MANAGER PORTAL */}
      {view === 'MANAGER_PORTAL' && (
        <ManagerPortal
          inventory={inventory}
          ledgerSales={ledgerSales}
          notifications={notifications}
          tables={tables}
          employees={employees}
          managerAccount={managerAccount}
          onUpdateManagerProfile={(updatedFields) => {
            setManagerAccount((prev) => {
              if (!prev) return null;
              const updated = { ...prev, ...updatedFields };
              localStorage.setItem('beverage_hub_manager_account', JSON.stringify(updated));
              return updated;
            });
          }}
          businessId={businessId}
          businessName={managerAccount?.venueName || "Rio's POS"}
          onSaveTable={handleSaveTable}
          onDeleteTable={handleDeleteTable}
          onSaveEmployees={(newEmps) => {
            setEmployees(newEmps);
            apiSaveEmployees(newEmps, businessId);
          }}
          onOpenCustomerView={(tbl) => {
            setCustomerTable(tbl.name);
            setView('CUSTOMER_LANDING');
          }}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onClearNotifications={handleClearNotifications}
          onRefreshInventory={() => {
            setInventory([...inventory]);
          }}
          onResetDailySold={handleResetDailySold}
          onLogout={() => setView('ROLE_SELECTION')}
        />
      )}

      {/* 3. WAITER PORTAL */}
      {view === 'WAITER_PORTAL' && (
        <WaiterPortal
          waiter={waiterEmployee || undefined}
          orders={orders}
          onUpdateOrder={handleUpdateOrder}
          onLogout={() => setView('ROLE_SELECTION')}
        />
      )}

      {/* 4. BARTENDER PORTAL */}
      {view === 'BARTENDER_PORTAL' && (
        <BartenderPortal
          employee={waiterEmployee || undefined}
          inventory={inventory}
          onLogout={() => setView('ROLE_SELECTION')}
          onRecordSale={(itemName, totalAmount) => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const newSale: LedgerSale = {
              id: `sale-${Date.now()}`,
              time: timeStr,
              item: itemName,
              cost: Math.round(totalAmount * 0.6),
              sold: totalAmount,
              profit: Math.round(totalAmount * 0.4),
            };
            setLedgerSales((prev) => [newSale, ...prev]);
            apiAddLedgerSales([newSale], businessId);
          }}
        />
      )}

      {/* 5. STOCK MANAGER PORTAL */}
      {view === 'STOCK_MANAGER_PORTAL' && (
        <StockManagerPortal
          employee={waiterEmployee || undefined}
          inventory={inventory}
          onAddStock={handleAddStock}
          onLogout={() => setView('ROLE_SELECTION')}
        />
      )}

      {/* Customer Order Tracking Modal */}
      {activeTrackingOrder && showTrackingModal && (
        <CustomerOrderTrackingModal
          order={activeTrackingOrder}
          onUpdateOrder={handleUpdateOrder}
          onClose={() => {
            setActiveTrackingOrder(null);
            setShowTrackingModal(false);
            setView('CUSTOMER_LANDING');
          }}
          onMinimize={() => setShowTrackingModal(false)}
        />
      )}

      {/* 6. CUSTOMER LANDING SCREEN */}
      {view === 'CUSTOMER_LANDING' && (
        <div className="relative w-full max-w-full overflow-x-hidden">
          {/* Top Banner indicating Table and Venue */}
          <div className="bg-slate-900 text-white px-3 sm:px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                Ordering for <strong className="text-amber-400 font-bold">{customerTable}</strong> • {managerAccount?.venueName || "Rio's POS"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setView('ROLE_SELECTION')}
              className="text-gray-400 hover:text-white underline cursor-pointer shrink-0"
            >
              Staff Switch
            </button>
          </div>
          <CustomerScreen
            onOrderNow={() => setModal('CUSTOMER_NAME')}
            onBack={() => setView('ROLE_SELECTION')}
          />
        </div>
      )}

      {/* 7. BEVERAGEHUB STORE SCREEN */}
      {view === 'STORE' && (
        <div className="relative w-full max-w-full overflow-x-hidden">
          {/* Top table indicator */}
          <div className="bg-amber-500 text-slate-950 font-semibold px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <QrCode className="w-4 h-4 shrink-0" />
              <span className="truncate">Ordering for Table: <strong>{customerTable}</strong></span>
            </div>
            <span className="text-[11px] font-bold opacity-80 uppercase tracking-wider shrink-0">
              {managerAccount?.venueName || "Rio's POS"}
            </span>
          </div>

          <BeverageHubStore
            customerName={customerName}
            inventory={inventory}
            hasActiveOrder={!!activeTrackingOrder}
            onOpenTracking={() => setShowTrackingModal(true)}
            onProceedToCheckout={(cart, total, clearCart) => {
              setCheckoutCart(cart);
              setCheckoutTotal(total);
              setClearCartFn(() => clearCart);
              setModal('PAYMENT_METHOD');
            }}
            onBackToRoles={() => setView('ROLE_SELECTION')}
          />
        </div>
      )}

      {/* 8. MAIN ROLE SELECTION SCREEN (With Direct Multi-Device Sync) */}
      {view === 'ROLE_SELECTION' && (
        <div
          id="pos-entry-screen"
          className="min-h-screen bg-white flex flex-col items-center justify-between px-4 py-6 sm:py-8 select-none w-full max-w-full overflow-x-hidden"
        >
          <div className="w-full max-w-4xl flex flex-col items-center justify-center my-auto">
            {/* Logo Section */}
            <div className="mb-6 sm:mb-12 flex justify-center items-center w-full px-2">
              <img
                src={logoImg}
                alt="Rio's POS"
                id="brand-logo"
                className="w-full max-w-[280px] sm:max-w-[420px] md:max-w-[460px] object-contain drop-shadow-none"
              />
            </div>

            {/* Roles Selection Cards */}
            <div
              id="roles-container"
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-7 w-full max-w-4xl px-2"
            >
              {/* Manager Role Card */}
              <button
                type="button"
                id="role-manager"
                onClick={() => {
                  if (managerAccount) {
                    setModal('MANAGER_PIN');
                  } else {
                    setGoogleLoginRoleMode('MANAGER');
                    setShowGoogleLoginModal(true);
                  }
                }}
                className="w-full max-w-[320px] sm:max-w-none sm:w-[220px] md:w-[245px] lg:w-[260px] h-[170px] sm:h-[195px] md:h-[205px] flex flex-col items-center justify-center bg-white border border-[#D0D5DD] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 transition-all duration-200 hover:border-black/50 hover:shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <div className="h-16 sm:h-20 flex items-center justify-center mb-2 sm:mb-3">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-14 h-14 sm:w-[72px] sm:h-[72px]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="50" cy="22" r="14.5" fill="#000000" />
                    <path
                      d="M17 80 C17 62 25 49 39 46 L50 63 L61 46 C75 49 83 62 83 80 Z"
                      fill="#000000"
                    />
                    <polygon points="40,46 50,63 60,46" fill="#FFFFFF" />
                    <polygon points="36,46 43,58 39,60 32,49" fill="#000000" />
                    <polygon points="64,46 57,58 61,60 68,49" fill="#000000" />
                    <polygon points="47.5,46 52.5,46 53.5,50 50,52.5 46.5,50" fill="#000000" />
                    <polygon points="47.5,52.5 52.5,52.5 54,69 50,74 46,69" fill="#000000" />
                  </svg>
                </div>
                <span className="text-[18px] sm:text-[22px] font-semibold text-black tracking-tight">
                  Manager
                </span>
              </button>

              {/* Worker Role Card */}
              <button
                type="button"
                id="role-worker"
                onClick={() => {
                  if (waiterEmployee) {
                    if (waiterEmployee.role === 'Waiter') {
                      setView('WAITER_PORTAL');
                    } else if (waiterEmployee.role === 'Bartender') {
                      setView('BARTENDER_PORTAL');
                    } else if (waiterEmployee.role === 'Stock Manager') {
                      setView('STOCK_MANAGER_PORTAL');
                    } else {
                      setView('WAITER_PORTAL');
                    }
                  } else {
                    setModal('WORKER_LOGIN');
                  }
                }}
                className="w-full max-w-[320px] sm:max-w-none sm:w-[220px] md:w-[245px] lg:w-[260px] h-[170px] sm:h-[195px] md:h-[205px] flex flex-col items-center justify-center bg-white border border-[#D0D5DD] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 transition-all duration-200 hover:border-black/50 hover:shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <div className="h-16 sm:h-20 flex items-center justify-center mb-2 sm:mb-3">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-14 h-14 sm:w-[72px] sm:h-[72px]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="43" cy="22" r="13" fill="#000000" />
                    <path
                      d="M19 80 C19 62 26 49 37 45 L43 57 L49 45 C55 47 60 51 63 56 L63 80 Z"
                      fill="#000000"
                    />
                    <polygon points="37,45 43,57 49,45" fill="#FFFFFF" />
                    <rect x="41.5" y="55" width="3" height="15" fill="#FFFFFF" />
                    <circle cx="43" cy="59" r="1" fill="#000000" />
                    <circle cx="43" cy="65" r="1" fill="#000000" />
                    <polygon points="38,44 43,46 38,48" fill="#000000" />
                    <polygon points="48,44 43,46 48,48" fill="#000000" />
                    <circle cx="43" cy="46" r="1.5" fill="#000000" />
                    <path
                      d="M56 49 C62 49 67 54 70 61 L64 63 C62 58 59 55 55 55 Z"
                      fill="#000000"
                    />
                    <path d="M69 61 L79 57 L78 53 L68 56 Z" fill="#000000" />
                    <circle cx="79" cy="54" r="3" fill="#000000" />
                    <rect x="67" y="50" width="24" height="2.5" rx="1.25" fill="#000000" />
                    <path d="M69 50 C69 38 89 38 89 50 Z" fill="#000000" />
                    <circle cx="79" cy="36" r="2.5" fill="#000000" />
                  </svg>
                </div>
                <span className="text-[18px] sm:text-[22px] font-semibold text-black tracking-tight">
                  Worker
                </span>
              </button>

              {/* Customer Role Card */}
              <button
                type="button"
                id="role-customer"
                onClick={() => setView('CUSTOMER_LANDING')}
                className="w-full max-w-[320px] sm:max-w-none sm:w-[220px] md:w-[245px] lg:w-[260px] h-[170px] sm:h-[195px] md:h-[205px] flex flex-col items-center justify-center bg-white border border-[#D0D5DD] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 transition-all duration-200 hover:border-black/50 hover:shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <div className="h-16 sm:h-20 flex items-center justify-center mb-2 sm:mb-3">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-14 h-14 sm:w-[72px] sm:h-[72px]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="40" cy="24" r="14.5" fill="#000000" />
                    <path
                      d="M16 80 C16 62 25 48 40 48 C49 48 56 52 61 58 L57 80 Z"
                      fill="#000000"
                    />
                    <path
                      d="M57 48 L79 48 L80 54 L77 82 L59 82 L56 54 Z"
                      fill="#FFFFFF"
                    />
                    <line
                      x1="67"
                      y1="50"
                      x2="78"
                      y2="34"
                      stroke="#000000"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <rect x="58" y="50" width="18" height="3.5" rx="1.75" fill="#000000" />
                    <polygon points="59.5,53.5 74.5,53.5 72.5,78 61.5,78" fill="#000000" />
                    <line
                      x1="62"
                      y1="61"
                      x2="72"
                      y2="61"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <span className="text-[18px] sm:text-[22px] font-semibold text-black tracking-tight">
                  Customer
                </span>
              </button>
            </div>
          </div>

          <footer className="w-full max-w-4xl text-center text-xs text-gray-400 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 px-2">
            <span>Rios POS Cloud Bar & Club Management</span>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Real-time cross-device sync active</span>
            </div>
          </footer>
        </div>
      )}

      {/* GOOGLE LOGIN MODAL (For Manager and Worker) */}
      {showGoogleLoginModal && (
        <GoogleLoginModal
          currentAccount={managerAccount}
          roleMode={googleLoginRoleMode}
          onClose={() => {
            setShowGoogleLoginModal(false);
            if (view === 'WELCOME_SLIDER') setView('ROLE_SELECTION');
          }}
          onLoginSuccess={handleGoogleLoginSuccess}
        />
      )}

      {/* 1ST UPLOAD: Manager PIN Modal */}
      {modal === 'MANAGER_PIN' && (
        <ManagerModal
          onClose={() => setModal('NONE')}
          managerAccount={managerAccount}
          onUpdateManagerAccount={(updatedFields) => {
            setManagerAccount((prev) => {
              const updated = {
                ...(prev || {
                  uid: 'manager-default',
                  email: 'talikdgaf@gmail.com',
                  displayName: 'Talik',
                  venueName: "Rio's POS",
                }),
                ...updatedFields,
              };
              try {
                localStorage.setItem('beverage_hub_manager_account', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }}
          onLogin={() => {
            setModal('NONE');
            setView('MANAGER_PORTAL');
          }}
        />
      )}

      {/* 2ND UPLOAD: Worker Login Modal */}
      {modal === 'WORKER_LOGIN' && (
        <WorkerModal
          employees={employees}
          onClose={() => setModal('NONE')}
          onLogin={(employee) => {
            setModal('NONE');
            if (employee) {
              setWaiterEmployee(employee);
              try {
                localStorage.setItem('beverage_hub_active_worker', JSON.stringify(employee));
              } catch (e) {}
              if (employee.role === 'Waiter') {
                setView('WAITER_PORTAL');
              } else if (employee.role === 'Bartender') {
                setView('BARTENDER_PORTAL');
              } else if (employee.role === 'Stock Manager') {
                setView('STOCK_MANAGER_PORTAL');
              } else {
                setView('WAITER_PORTAL');
              }
            }
          }}
        />
      )}

      {/* 4TH UPLOAD: Customer Name & Bar Selection Modal */}
      {modal === 'CUSTOMER_NAME' && (
        <CustomerNameModal
          initialName={customerName}
          table={customerTable}
          tables={tables}
          currentBusinessId={businessId}
          currentBusinessName={managerAccount?.venueName || "Rio's POS"}
          onClose={() => setModal('NONE')}
          onContinue={(name, selectedTable, chosenBusinessId, chosenBusinessName) => {
            setCustomerName(name);
            if (selectedTable) setCustomerTable(selectedTable);
            if (chosenBusinessId) {
              setBusinessId(chosenBusinessId);
            }
            if (chosenBusinessName) {
              setManagerAccount((prev) => ({
                uid: prev?.uid || `venue-${chosenBusinessId || 'default'}`,
                email: chosenBusinessId || prev?.email || 'talikdgaf@gmail.com',
                displayName: prev?.displayName || 'Manager',
                venueName: chosenBusinessName,
                photoURL: prev?.photoURL,
              }));
            }
            setModal('NONE');
            setView('STORE');
          }}
        />
      )}

      {/* 6TH UPLOAD: Payment Method Modal */}
      {modal === 'PAYMENT_METHOD' && (
        <PaymentModal
          totalAmount={checkoutTotal}
          onClose={() => setModal('NONE')}
          onConfirm={(method) => {
            if (method === 'mpesa') {
              setModal('MPESA_PHONE');
            } else {
              setModal('CASH_CONFIRM');
            }
          }}
        />
      )}

      {/* 7TH STEP: M-PESA Phone Number & Confirmation Pop-up */}
      {modal === 'MPESA_PHONE' && (
        <MpesaModal
          totalAmount={checkoutTotal}
          customerName={customerName}
          onClose={() => setModal('NONE')}
          onBackToMethods={() => setModal('PAYMENT_METHOD')}
          onSuccess={() => handleOrderSuccess('M-PESA')}
        />
      )}

      {/* Cash On Delivery Modal */}
      {modal === 'CASH_CONFIRM' && (
        <CashModal
          totalAmount={checkoutTotal}
          customerName={customerName}
          onClose={() => setModal('NONE')}
          onBackToMethods={() => setModal('PAYMENT_METHOD')}
          onSuccess={() => handleOrderSuccess('Cash')}
        />
      )}
    </div>
  );
}
