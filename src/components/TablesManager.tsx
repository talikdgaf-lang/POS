import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Plus, QrCode, Edit2, Trash2, Search, X } from 'lucide-react';
import { RestaurantTable, Employee } from '../types';
import { TableQRModal } from './TableQRModal';

interface TablesManagerProps {
  tables: RestaurantTable[];
  employees: Employee[];
  businessId: string;
  businessName?: string;
  onSaveTable: (table: Partial<RestaurantTable>) => void;
  onDeleteTable: (tableId: string) => void;
  onOpenCustomerView?: (table: RestaurantTable) => void;
}

export const TablesManager: React.FC<TablesManagerProps> = ({
  tables,
  employees,
  businessId,
  businessName = "Rio's POS",
  onSaveTable,
  onDeleteTable,
  onOpenCustomerView,
}) => {
  const [selectedTableForQR, setSelectedTableForQR] = useState<RestaurantTable | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [formName, setFormName] = useState<string>('');

  // Pre-rendered thumbnail QR codes cache
  const [qrThumbnails, setQrThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    tables.forEach((t) => {
      const url = `${window.location.origin}/?businessId=${encodeURIComponent(businessId)}&table=${encodeURIComponent(t.name)}&mode=customer`;
      QRCode.toDataURL(url, {
        width: 220,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((data) => {
          setQrThumbnails((prev) => ({ ...prev, [t.id]: data }));
        })
        .catch((e) => console.error(e));
    });
  }, [tables, businessId]);

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingTable(null);
    const nextNum = tables.length + 1;
    setFormName(`Table ${nextNum}`);
    setShowAddModal(true);
  };

  const handleOpenEdit = (t: RestaurantTable) => {
    setEditingTable(t);
    setFormName(t.name);
    setShowAddModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const tableData: Partial<RestaurantTable> = {
      id: editingTable ? editingTable.id : `table-${Date.now()}`,
      name: formName.trim(),
      number: formName.replace(/[^0-9]/g, '') || '1',
      zone: editingTable?.zone || 'Main',
      capacity: editingTable?.capacity || 4,
      status: editingTable ? editingTable.status : 'AVAILABLE',
      createdAt: editingTable ? editingTable.createdAt : new Date().toISOString(),
    };

    onSaveTable(tableData);
    setShowAddModal(false);
    setEditingTable(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-black tracking-tight">Tables</h2>
          <span className="text-xs bg-black text-white font-medium px-2 py-0.5 rounded-full">
            {tables.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Simple Search */}
          <div className="relative w-36 sm:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-black"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-orange-500" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const qrThumb = qrThumbnails[table.id];

          return (
            <div
              key={table.id}
              className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col items-center text-center justify-between relative group hover:border-neutral-400 transition-colors"
            >
              {/* Subtle Edit / Delete in top corners */}
              <div className="w-full flex items-center justify-between mb-1">
                {/* Table Name */}
                <h3 className="text-base font-bold text-black tracking-tight">
                  {table.name}
                </h3>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(table)}
                    className="p-1 text-neutral-400 hover:text-black rounded transition-colors cursor-pointer"
                    title="Edit name"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ${table.name}?`)) {
                        onDeleteTable(table.id);
                      }
                    }}
                    className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="my-3 p-2 bg-white border border-neutral-200 rounded-xl flex items-center justify-center">
                {qrThumb ? (
                  <img
                    src={qrThumb}
                    alt={table.name}
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 bg-neutral-100 animate-pulse rounded" />
                )}
              </div>

              {/* Scan to order */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 mb-3">
                <QrCode className="w-3.5 h-3.5 text-orange-500" />
                <span>Scan to order</span>
              </div>

              {/* View QR code button */}
              <button
                type="button"
                onClick={() => setSelectedTableForQR(table)}
                className="w-full py-2 px-3 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-orange-500" />
                <span>View QR code</span>
              </button>
            </div>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-neutral-600 mb-3">No tables found</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Add Table
          </button>
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-neutral-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-black">
                {editingTable ? 'Edit Table' : 'Add Table'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-neutral-400 hover:text-black rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Table Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Table 1"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-xl cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code View & Download Modal */}
      {selectedTableForQR && (
        <TableQRModal
          table={selectedTableForQR}
          businessId={businessId}
          businessName={businessName}
          onClose={() => setSelectedTableForQR(null)}
          onOpenCustomerView={onOpenCustomerView}
        />
      )}
    </div>
  );
};
