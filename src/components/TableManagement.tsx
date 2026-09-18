import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Plus,
  Printer,
  Download,
  ExternalLink,
  Trash2,
  Edit2,
  Users,
  CheckCircle2,
  Copy,
  Check,
  X,
  Sparkles,
  Search,
  Maximize2
} from 'lucide-react';
import { TableConfig, ManagerAccount } from '../types';

interface TableManagementProps {
  tables: TableConfig[];
  managerAccount?: ManagerAccount | null;
  onSaveTable: (table: Partial<TableConfig>) => void;
  onDeleteTable: (tableId: string) => void;
  onOpenCustomerOrderForTable: (tableName: string) => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  tables,
  managerAccount,
  onSaveTable,
  onDeleteTable,
  onOpenCustomerOrderForTable,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [qrCodes, setQrCodes] = useState<{ [tableId: string]: string }>({});
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableConfig | null>(null);
  const [activePrintTable, setActivePrintTable] = useState<TableConfig | null>(null);
  const [showPrintAllModal, setShowPrintAllModal] = useState(false);
  const [deletingTable, setDeletingTable] = useState<TableConfig | null>(null);

  // Form State
  const [tableName, setTableName] = useState('');
  const [tableSection, setTableSection] = useState('Main Hall');
  const [tableCapacity, setTableCapacity] = useState(4);

  const businessVenueId = managerAccount?.email || 'talikdgaf@gmail.com';
  const venueTitle = managerAccount?.venueName || "Rio's POS";

  // Generate QR code data URLs for all tables
  useEffect(() => {
    let isSubscribed = true;

    async function generateCodes() {
      const generated: { [tableId: string]: string } = {};
      for (const table of tables) {
        const orderUrl = `${window.location.origin}/?venue=${encodeURIComponent(businessVenueId)}&table=${encodeURIComponent(table.name)}`;
        try {
          const dataUrl = await QRCode.toDataURL(orderUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          generated[table.id] = dataUrl;
        } catch (err) {
          console.error('Failed to generate QR for table:', table.name, err);
        }
      }
      if (isSubscribed) {
        setQrCodes(generated);
      }
    }

    generateCodes();
    return () => {
      isSubscribed = false;
    };
  }, [tables, businessVenueId]);

  const getTableOrderUrl = (table: TableConfig) => {
    return `${window.location.origin}/?venue=${encodeURIComponent(businessVenueId)}&table=${encodeURIComponent(table.name)}`;
  };

  const handleCopyLink = (table: TableConfig) => {
    const url = getTableOrderUrl(table);
    navigator.clipboard.writeText(url);
    setCopiedTableId(table.id);
    setTimeout(() => setCopiedTableId(null), 2000);
  };

  const handleDownloadQr = (table: TableConfig) => {
    const dataUrl = qrCodes[table.id];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `RiosPOS-${table.name.replace(/\s+/g, '_')}-QR.png`;
    a.click();
  };

  const handleOpenAddModal = () => {
    setEditingTable(null);
    setTableName(`Table ${tables.length + 1}`);
    setTableSection('Main Hall');
    setTableCapacity(4);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (table: TableConfig) => {
    setEditingTable(table);
    setTableName(table.name);
    setTableSection(table.section || table.zone || 'Main Hall');
    setTableCapacity(table.capacity || 4);
    setShowAddModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    if (editingTable) {
      onSaveTable({
        ...editingTable,
        name: tableName.trim(),
        section: tableSection,
        zone: tableSection,
        capacity: Number(tableCapacity) || 4,
      });
    } else {
      const newId = `table-${Date.now()}`;
      onSaveTable({
        id: newId,
        number: String(tables.length + 1),
        name: tableName.trim(),
        section: tableSection,
        zone: tableSection,
        capacity: Number(tableCapacity) || 4,
        status: 'Available',
      });
    }
    setShowAddModal(false);
  };

  const filteredTables = tables.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.section && t.section.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.zone && t.zone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <QrCode className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Table & QR Code Management
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
            Each table has its own unique QR code linked directly to your manager account ({businessVenueId}). When customers scan the code, orders go directly to your hired staff.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowPrintAllModal(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Cards</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-[#101828] hover:bg-black text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by table name or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 px-1">
          <span className="font-semibold text-gray-900">{tables.length} Total Tables</span>
          <span>•</span>
          <span className="text-emerald-700 font-medium">All QR Codes Active</span>
        </div>
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {filteredTables.map((table) => {
          const qrDataUrl = qrCodes[table.id];
          const isCopied = copiedTableId === table.id;

          return (
            <div
              key={table.id}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between relative group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>{table.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {table.section || table.zone || 'Main Hall'}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Seats {table.capacity || 4} guests</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(table)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit Table"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingTable(table)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Permanently Delete Table"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* QR Code Center Display */}
              <div className="my-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center relative">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${table.name}`}
                    className="w-40 h-40 object-contain rounded-lg shadow-xs bg-white p-1.5 border border-gray-200"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded-lg text-xs text-gray-400">
                    Generating QR...
                  </div>
                )}
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mt-2">
                  Scan to Order at {table.name}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-2">
                {/* Print Tent Card Button */}
                <button
                  type="button"
                  onClick={() => setActivePrintTable(table)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Table Card</span>
                </button>

                {/* Secondary Actions Row */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadQr(table)}
                    className="py-1.5 px-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Download PNG"
                  >
                    <Download className="w-3 h-3" />
                    <span>PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(table)}
                    className="py-1.5 px-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Copy Order Link"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCustomerOrderForTable(table.name)}
                    className="py-1.5 px-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Test Customer Order"
                  >
                    <ExternalLink className="w-3 h-3 text-blue-600" />
                    <span>Test</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {editingTable ? 'Edit Table' : 'Add New Table'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Create a table number or name. A unique QR code will be generated instantly for customers to scan and place orders.
            </p>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Table Name or Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 5, VIP Booth 2"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Venue Section / Area
                </label>
                <select
                  value={tableSection}
                  onChange={(e) => setTableSection(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-1 focus:ring-black focus:border-black bg-white"
                >
                  <option value="Main Hall">Main Hall</option>
                  <option value="VIP Section">VIP Section</option>
                  <option value="Bar Counter">Bar Counter</option>
                  <option value="Terrace / Outdoor">Terrace / Outdoor</option>
                  <option value="Balcony Lounge">Balcony Lounge</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Guest Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-black hover:bg-gray-800 rounded-xl shadow-xs"
                >
                  {editingTable ? 'Save Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Table Printable Tent Card Preview Modal */}
      {activePrintTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActivePrintTable(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Tent Card Area */}
            <div
              id="printable-tent-card"
              className="w-full border-2 border-dashed border-amber-500/40 rounded-2xl p-6 bg-linear-to-b from-white via-slate-50 to-amber-50/30 flex flex-col items-center"
            >
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-1">
                {venueTitle}
              </span>
              <h1 className="text-3xl font-black text-gray-950 tracking-tight mb-1">
                {activePrintTable.name}
              </h1>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Scan with your phone to order drinks
              </p>

              {/* Large High-Res QR Code */}
              <div className="p-3 bg-white border-2 border-gray-900 rounded-2xl shadow-md mb-4">
                {qrCodes[activePrintTable.id] ? (
                  <img
                    src={qrCodes[activePrintTable.id]}
                    alt={`Scan to order at ${activePrintTable.name}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-gray-100 text-xs">
                    Loading QR...
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-600 font-medium space-y-1">
                <p>1. Open your phone camera & point at the QR code</p>
                <p>2. Select your drinks & checkout via M-PESA or Cash</p>
                <p className="text-amber-700 font-bold">
                  ⚡ Orders deliver directly to {activePrintTable.name}!
                </p>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex items-center gap-3 mt-5 w-full">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table Tent Card</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadQr(activePrintTable)}
                className="py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Print All Cards Modal */}
      {showPrintAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Print All Venue Table Cards ({tables.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Ready-to-print grid for table display stands, acrylic holders, or stickers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintAllModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Cards Grid */}
            <div className="overflow-y-auto py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className="border-2 border-gray-900 rounded-2xl p-5 bg-white flex flex-col items-center text-center shadow-xs page-break-inside-avoid"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                    {venueTitle}
                  </span>
                  <h4 className="text-2xl font-black text-gray-900 mt-0.5 mb-2">
                    {t.name}
                  </h4>
                  {qrCodes[t.id] && (
                    <img
                      src={qrCodes[t.id]}
                      alt={`QR ${t.name}`}
                      className="w-40 h-40 object-contain p-1 border border-gray-300 rounded-xl mb-3"
                    />
                  )}
                  <p className="text-[11px] font-bold text-gray-800">
                    SCAN TO ORDER & PAY
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Orders deliver right to this table
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {deletingTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Permanently Delete Table?</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900">{deletingTable.name}</strong>? This action cannot be undone and will remove its QR code and access.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onDeleteTable(deletingTable.id);
                  setDeletingTable(null);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider shadow-md"
              >
                Permanently Delete
              </button>
              <button
                type="button"
                onClick={() => setDeletingTable(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all cursor-pointer text-xs tracking-wider"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
