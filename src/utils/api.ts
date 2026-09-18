import { Order, InventoryItem, LedgerSale, ManagerNotification, Employee, RestaurantTable } from '../types';

export interface FullAppState {
  businessId?: string;
  businessName?: string;
  managerEmail?: string;
  orders: Order[];
  inventory: InventoryItem[];
  ledgerSales: LedgerSale[];
  notifications: ManagerNotification[];
  employees: Employee[];
  tables: RestaurantTable[];
}

function getQuery(businessId?: string): string {
  if (!businessId) return '';
  return `?businessId=${encodeURIComponent(businessId)}`;
}

// Fetch full current state from backend server
export async function fetchAppState(businessId?: string): Promise<FullAppState | null> {
  try {
    const res = await fetch(`/api/state${getQuery(businessId)}`);
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    // Gracefully handle transient connection issues without throwing uncaught syntax errors
  }
  return null;
}

// Tables API
export async function apiFetchTables(businessId?: string): Promise<RestaurantTable[]> {
  try {
    const res = await fetch(`/api/tables${getQuery(businessId)}`);
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    // Quietly fallback
  }
  return [];
}

export async function apiSaveTable(table: Partial<RestaurantTable>, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tables${getQuery(businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...table, businessId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save table:', err);
    return false;
  }
}

export async function apiUpdateTables(tables: RestaurantTable[], businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tables${getQuery(businessId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tables),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to update tables:', err);
    return false;
  }
}

export async function apiUpdateTable(tableId: string, updates: Partial<RestaurantTable>, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableId)}${getQuery(businessId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to update table:', err);
    return false;
  }
}

export async function apiDeleteTable(tableId: string, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableId)}${getQuery(businessId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete table:', err);
    return false;
  }
}

// Orders API
export async function apiCreateOrder(order: Order, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/orders${getQuery(businessId || order.businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...order, businessId: businessId || order.businessId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to create order:', err);
    return false;
  }
}

export async function apiUpdateOrder(orderId: string, updates: Partial<Order>, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}${getQuery(businessId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to update order:', err);
    return false;
  }
}

export async function apiDeleteOrder(orderId: string, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}${getQuery(businessId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete order:', err);
    return false;
  }
}

// Inventory API
export async function apiUpdateInventory(inventory: InventoryItem[], businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/inventory${getQuery(businessId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventory),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to update inventory:', err);
    return false;
  }
}

export async function apiAddStock(itemId: string, quantity: number, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/inventory/add-stock${getQuery(businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity, businessId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to add stock:', err);
    return false;
  }
}

// Ledger Sales API
export async function apiAddLedgerSales(sales: LedgerSale[], businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/ledger${getQuery(businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sales),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to add ledger sales:', err);
    return false;
  }
}

// Notifications API
export async function apiAddNotifications(notifications: ManagerNotification[], businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications${getQuery(businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifications),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to add notifications:', err);
    return false;
  }
}

export async function apiMarkNotificationRead(id: string, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read${getQuery(businessId)}`, {
      method: 'PATCH',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to mark notification read:', err);
    return false;
  }
}

export async function apiMarkAllNotificationsRead(businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications/mark-all-read${getQuery(businessId)}`, {
      method: 'POST',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
    return false;
  }
}

export async function apiClearNotifications(businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications${getQuery(businessId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to clear notifications:', err);
    return false;
  }
}

// Employees API
export async function apiFetchEmployees(businessId?: string): Promise<Employee[]> {
  try {
    const res = await fetch(`/api/employees${getQuery(businessId)}`);
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    // Quietly fallback
  }
  return [];
}

export async function apiSaveEmployees(employees: Employee[], businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/employees${getQuery(businessId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employees),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save employees:', err);
    return false;
  }
}

export async function apiDeleteEmployee(employeeId: string, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/employees/${employeeId}${getQuery(businessId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete employee:', err);
    return false;
  }
}

export async function apiRateEmployee(waiterName: string, rating: number, comment?: string, businessId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/employees/rate${getQuery(businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waiterName, rating, comment, businessId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to rate employee:', err);
    return false;
  }
}

export async function apiFetchVenues(): Promise<Array<{ businessId: string; businessName: string; managerEmail: string; tables: RestaurantTable[] }>> {
  try {
    const res = await fetch('/api/venues');
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    // Quietly fallback
  }
  return [];
}

export async function apiUpdateBusinessProfile(
  updates: { businessName?: string; managerName?: string; managerPhotoURL?: string },
  businessId?: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/business/profile${getQuery(businessId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, businessId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to update business profile:', err);
    return false;
  }
}

// Subscribe to real-time cross-device SSE updates for a specific business
export function subscribeToRealtimeStream(
  onStateUpdate: (state: FullAppState) => void,
  businessId?: string
): () => void {
  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`/api/stream${getQuery(businessId)}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data === 'object') {
            onStateUpdate(data);
          }
        } catch (err) {
          console.error('Error parsing SSE stream message:', err);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      };
    } catch (e) {
      console.error('Error connecting to SSE stream:', e);
      if (!isClosed) {
        setTimeout(connect, 3000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
