import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { INITIAL_INVENTORY } from "./src/data/initialInventory";
import { INITIAL_NOTIFICATIONS } from "./src/data/initialNotifications";
import { INITIAL_EMPLOYEES } from "./src/data/initialEmployees";
import { INITIAL_TABLES } from "./src/data/initialTables";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

interface BusinessStore {
  businessId: string;
  businessName: string;
  managerEmail: string;
  managerName?: string;
  managerPhotoURL?: string;
  orders: any[];
  inventory: any[];
  ledgerSales: any[];
  notifications: any[];
  employees: any[];
  tables: any[];
}

// In-memory multi-tenant store keyed by Google Account email / businessId
const businesses = new Map<string, BusinessStore>();

export function findBusinessByNameOrId(nameOrId?: string): BusinessStore | undefined {
  if (!nameOrId) return undefined;
  const clean = nameOrId.toLowerCase().trim();
  if (businesses.has(clean)) {
    return businesses.get(clean);
  }
  for (const b of Array.from(businesses.values())) {
    if (b.businessId.toLowerCase().trim() === clean) return b;
    if (b.businessName && b.businessName.toLowerCase().trim() === clean) return b;
  }
  return undefined;
}

export function getOrCreateBusiness(businessId?: string): BusinessStore {
  const id = (businessId || 'talikdgaf@gmail.com').toLowerCase().trim();
  const existing = findBusinessByNameOrId(id);
  if (existing) {
    return existing;
  }

  const rawName = id.includes('@') ? id.split('@')[0] : id;
  const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const created: BusinessStore = {
    businessId: id,
    businessName: id === 'talikdgaf@gmail.com' ? "Rio's POS" : `${cleanName}'s Rios POS`,
    managerEmail: id.includes('@') ? id : `${id}@gmail.com`,
    managerName: cleanName,
    managerPhotoURL: undefined,
    orders: [],
    inventory: JSON.parse(JSON.stringify(INITIAL_INVENTORY)),
    ledgerSales: [],
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    employees: JSON.parse(JSON.stringify(INITIAL_EMPLOYEES)),
    tables: JSON.parse(JSON.stringify(INITIAL_TABLES)),
  };
  businesses.set(id, created);
  return created;
}

// Initialize default manager account for immediate out-of-the-box readiness
getOrCreateBusiness('talikdgaf@gmail.com');

// Active Server-Sent Event (SSE) clients grouped by business
interface SseClient {
  res: express.Response;
  businessId: string;
}
const sseClients = new Set<SseClient>();

function broadcastBusinessState(businessId: string) {
  const normId = (businessId || 'talikdgaf@gmail.com').toLowerCase().trim();
  const b = getOrCreateBusiness(normId);
  const payload = JSON.stringify({
    businessId: b.businessId,
    businessName: b.businessName,
    managerEmail: b.managerEmail,
    managerName: b.managerName,
    managerPhotoURL: b.managerPhotoURL,
    orders: b.orders,
    inventory: b.inventory,
    ledgerSales: b.ledgerSales,
    notifications: b.notifications,
    employees: b.employees,
    tables: b.tables,
  });

  for (const client of Array.from(sseClients)) {
    if (client.businessId === normId) {
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }
}

function extractBusinessId(req: express.Request): string {
  const fromQuery = req.query.businessId as string;
  const fromHeader = req.headers['x-business-id'] as string;
  const fromBody = req.body && req.body.businessId ? (req.body.businessId as string) : undefined;
  const raw = (fromQuery || fromHeader || fromBody || 'talikdgaf@gmail.com').toLowerCase().trim();
  const matched = findBusinessByNameOrId(raw);
  if (matched) {
    return matched.businessId;
  }
  return raw;
}

// REST API Endpoints

// Get all registered venues/bars in the app for customer selection & suggestions
app.get("/api/venues", (req, res) => {
  const list = Array.from(businesses.values()).map((b) => ({
    businessId: b.businessId,
    businessName: b.businessName || "Rio's POS",
    managerEmail: b.managerEmail,
    tables: b.tables,
  }));
  res.json(list);
});

// Update business / manager profile (bar name, display name, photo)
app.post("/api/business/profile", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { businessName, managerName, managerPhotoURL } = req.body;

  if (businessName && typeof businessName === 'string') {
    b.businessName = businessName.trim();
  }
  if (managerName && typeof managerName === 'string') {
    b.managerName = managerName.trim();
  }
  if (managerPhotoURL !== undefined) {
    b.managerPhotoURL = managerPhotoURL;
  }

  broadcastBusinessState(businessId);
  res.json({
    success: true,
    businessId: b.businessId,
    businessName: b.businessName,
    managerName: b.managerName,
    managerPhotoURL: b.managerPhotoURL,
  });
});

// Get full server state for a business
app.get("/api/state", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  res.json({
    businessId: b.businessId,
    businessName: b.businessName,
    managerEmail: b.managerEmail,
    managerName: b.managerName,
    managerPhotoURL: b.managerPhotoURL,
    orders: b.orders,
    inventory: b.inventory,
    ledgerSales: b.ledgerSales,
    notifications: b.notifications,
    employees: b.employees,
    tables: b.tables,
  });
});

// SSE endpoint for instant live updates across devices for a specific account
app.get("/api/stream", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Send current state on connection
  const initialPayload = JSON.stringify({
    businessId: b.businessId,
    businessName: b.businessName,
    managerEmail: b.managerEmail,
    orders: b.orders,
    inventory: b.inventory,
    ledgerSales: b.ledgerSales,
    notifications: b.notifications,
    employees: b.employees,
    tables: b.tables,
  });
  res.write(`data: ${initialPayload}\n\n`);

  const client: SseClient = { res, businessId };
  sseClients.add(client);

  req.on("close", () => {
    sseClients.delete(client);
  });
});

// Tables API
app.get("/api/tables", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  res.json(b.tables);
});

app.post("/api/tables", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const newTable = req.body;

  if (!newTable || !newTable.name) {
    return res.status(400).json({ error: "Table name is required" });
  }

  const tableToSave = {
    id: newTable.id || `table-${Date.now()}`,
    number: newTable.number || String(b.tables.length + 1),
    name: newTable.name,
    zone: newTable.zone || "Main Hall",
    capacity: Number(newTable.capacity) || 4,
    assignedWaiterId: newTable.assignedWaiterId || undefined,
    assignedWaiterName: newTable.assignedWaiterName || undefined,
    status: newTable.status || "AVAILABLE",
    activeOrdersCount: newTable.activeOrdersCount || 0,
    createdAt: newTable.createdAt || new Date().toISOString(),
  };

  // Upsert table
  const existingIdx = b.tables.findIndex((t) => t.id === tableToSave.id);
  if (existingIdx >= 0) {
    b.tables[existingIdx] = { ...b.tables[existingIdx], ...tableToSave };
  } else {
    b.tables.push(tableToSave);
  }

  broadcastBusinessState(businessId);
  res.json({ success: true, table: tableToSave, tables: b.tables });
});

app.put("/api/tables", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  if (Array.isArray(req.body)) {
    b.tables = req.body;
    broadcastBusinessState(businessId);
    return res.json({ success: true, tables: b.tables });
  }
  res.status(400).json({ error: "Expected array of tables" });
});

app.patch("/api/tables/:id", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { id } = req.params;
  const updates = req.body;

  let found = false;
  b.tables = b.tables.map((t) => {
    if (t.id === id || t.number === id) {
      found = true;
      return { ...t, ...updates };
    }
    return t;
  });

  if (found) {
    broadcastBusinessState(businessId);
    res.json({ success: true, tables: b.tables });
  } else {
    res.status(404).json({ error: "Table not found" });
  }
});

app.delete("/api/tables/:id", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { id } = req.params;
  b.tables = b.tables.filter((t) => t.id !== id && t.number !== id);
  broadcastBusinessState(businessId);
  res.json({ success: true, tables: b.tables });
});

// Orders API
app.get("/api/orders", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  res.json(b.orders);
});

app.post("/api/orders", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const newOrder = req.body;
  if (!newOrder || !newOrder.id) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const orderWithBusiness = {
    ...newOrder,
    businessId,
  };

  // Prepend new order
  b.orders = [orderWithBusiness, ...b.orders.filter((o) => o.id !== newOrder.id)];

  // Update associated table's active orders and status
  if (newOrder.table) {
    b.tables = b.tables.map((t) => {
      if (t.name.toLowerCase() === newOrder.table.toLowerCase() || t.number === newOrder.table) {
        return {
          ...t,
          status: 'OCCUPIED',
          activeOrdersCount: (t.activeOrdersCount || 0) + 1,
        };
      }
      return t;
    });
  }

  // Create notification for manager and staff
  const notif = {
    id: `notif-${Date.now()}`,
    type: 'ORDER_PLACED' as const,
    title: `New Order: ${newOrder.table}`,
    message: `${newOrder.customerName} placed order for ${newOrder.items?.length || 1} item(s) (KES ${(newOrder.total || 0).toLocaleString()})`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toISOString().split('T')[0],
    read: false,
    severity: 'info' as const,
  };
  b.notifications = [notif, ...b.notifications];

  broadcastBusinessState(businessId);
  res.json({ success: true, order: orderWithBusiness, orders: b.orders });
});

app.patch("/api/orders/:id", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { id } = req.params;
  const updates = req.body;

  let found = false;
  b.orders = b.orders.map((o) => {
    if (o.id === id) {
      found = true;
      return { ...o, ...updates };
    }
    return o;
  });

  if (found) {
    broadcastBusinessState(businessId);
    res.json({ success: true, orders: b.orders });
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

app.delete("/api/orders/:id", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { id } = req.params;
  b.orders = b.orders.filter((o) => o.id !== id);
  broadcastBusinessState(businessId);
  res.json({ success: true, orders: b.orders });
});

// Inventory API
app.get("/api/inventory", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  res.json(b.inventory);
});

app.put("/api/inventory", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  if (Array.isArray(req.body)) {
    b.inventory = req.body;
    broadcastBusinessState(businessId);
    return res.json({ success: true, inventory: b.inventory });
  }
  res.status(400).json({ error: "Expected an array of inventory items" });
});

app.post("/api/inventory/add-stock", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { itemId, quantity } = req.body;
  b.inventory = b.inventory.map((item) => {
    if (item.id === itemId) {
      return { ...item, remaining: item.remaining + (Number(quantity) || 0) };
    }
    return item;
  });
  broadcastBusinessState(businessId);
  res.json({ success: true, inventory: b.inventory });
});

// Ledger API
app.get("/api/ledger", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  res.json(b.ledgerSales);
});

app.post("/api/ledger", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const newSales = req.body;
  if (Array.isArray(newSales)) {
    b.ledgerSales = [...newSales, ...b.ledgerSales];
  } else if (newSales) {
    b.ledgerSales = [newSales, ...b.ledgerSales];
  }
  broadcastBusinessState(businessId);
  res.json({ success: true, ledgerSales: b.ledgerSales });
});

// Notifications API
app.get("/api/notifications", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  res.json(b.notifications);
});

app.post("/api/notifications", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const newNotifs = req.body;
  if (Array.isArray(newNotifs)) {
    b.notifications = [...newNotifs, ...b.notifications];
  } else if (newNotifs) {
    b.notifications = [newNotifs, ...b.notifications];
  }
  broadcastBusinessState(businessId);
  res.json({ success: true, notifications: b.notifications });
});

app.patch("/api/notifications/:id/read", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { id } = req.params;
  b.notifications = b.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  broadcastBusinessState(businessId);
  res.json({ success: true, notifications: b.notifications });
});

app.post("/api/notifications/mark-all-read", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  b.notifications = b.notifications.map((n) => ({ ...n, read: true }));
  broadcastBusinessState(businessId);
  res.json({ success: true, notifications: b.notifications });
});

app.delete("/api/notifications", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  b.notifications = [];
  broadcastBusinessState(businessId);
  res.json({ success: true, notifications: b.notifications });
});

// Employees API
app.get("/api/employees", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  res.json(b.employees);
});

app.post("/api/employees", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const newEmp = req.body;
  b.employees = [newEmp, ...b.employees.filter((e) => e.id !== newEmp.id)];
  broadcastBusinessState(businessId);
  res.json({ success: true, employees: b.employees });
});

app.put("/api/employees", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  if (Array.isArray(req.body)) {
    b.employees = req.body;
    broadcastBusinessState(businessId);
    return res.json({ success: true, employees: b.employees });
  }
  res.status(400).json({ error: "Expected array of employees" });
});

app.patch("/api/employees/:id", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { id } = req.params;
  const updates = req.body;
  b.employees = b.employees.map((e) => (e.id === id ? { ...e, ...updates } : e));
  broadcastBusinessState(businessId);
  res.json({ success: true, employees: b.employees });
});

app.delete("/api/employees/:id", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { id } = req.params;
  b.employees = b.employees.filter((e) => e.id !== id);
  broadcastBusinessState(businessId);
  res.json({ success: true, employees: b.employees });
});

// Submit Rating API for rating employees across devices
app.post("/api/employees/rate", (req, res) => {
  const businessId = extractBusinessId(req);
  const b = getOrCreateBusiness(businessId);
  const { waiterName, rating, comment } = req.body;
  if (!waiterName || !rating) {
    return res.status(400).json({ error: "Waiter name and rating required" });
  }

  const currentMonthStr = new Date().toISOString().slice(0, 7);

  b.employees = b.employees.map((emp) => {
    if (emp.name.toLowerCase() === waiterName.toLowerCase()) {
      const monthRatings = emp.monthlyRatings?.[currentMonthStr] || { sum: 0, count: 0, history: [] };
      const newSum = monthRatings.sum + rating;
      const newCount = monthRatings.count + 1;
      const newAvg = Number((newSum / newCount).toFixed(1));

      const newHistory = [
        {
          id: `rating-${Date.now()}`,
          rating,
          date: new Date().toISOString(),
          comment: comment || undefined,
        },
        ...(monthRatings.history || []),
      ];

      return {
        ...emp,
        rating: newAvg,
        ratingsCount: (emp.ratingsCount || 0) + 1,
        monthlyRatings: {
          ...(emp.monthlyRatings || {}),
          [currentMonthStr]: {
            sum: newSum,
            count: newCount,
            history: newHistory,
          },
        },
      };
    }
    return emp;
  });

  broadcastBusinessState(businessId);
  res.json({ success: true, employees: b.employees });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rios POS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
