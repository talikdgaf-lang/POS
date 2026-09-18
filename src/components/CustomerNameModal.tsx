import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, User, Store, QrCode, ChevronDown, Check, Sparkles } from 'lucide-react';
import { RestaurantTable, VenueInfo } from '../types';
import { apiFetchVenues } from '../utils/api';

interface CustomerNameModalProps {
  onClose: () => void;
  onContinue: (customerName: string, selectedTable: string, businessId?: string, businessName?: string) => void;
  initialName?: string;
  table?: string;
  tables?: RestaurantTable[];
  currentBusinessId?: string;
  currentBusinessName?: string;
}

export const CustomerNameModal: React.FC<CustomerNameModalProps> = ({
  onClose,
  onContinue,
  initialName = '',
  table = 'Table 1',
  tables = [],
  currentBusinessId = 'talikdgaf@gmail.com',
  currentBusinessName = "Rio's POS",
}) => {
  const [name, setName] = useState(initialName);
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [barSearchQuery, setBarSearchQuery] = useState(currentBusinessName);
  const [selectedVenue, setSelectedVenue] = useState<VenueInfo | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTable, setSelectedTable] = useState(table);
  const [errorMessage, setErrorMessage] = useState('');
  const barInputRef = useRef<HTMLDivElement>(null);

  // Load all registered bars/venues from server
  useEffect(() => {
    let mounted = true;
    apiFetchVenues().then((list) => {
      if (!mounted) return;
      if (list && list.length > 0) {
        setVenues(list);
        const match = list.find((v) => v.businessId === currentBusinessId) || list[0];
        setSelectedVenue(match);
        if (match) {
          setBarSearchQuery(match.businessName);
        }
      } else {
        // Fallback default venue
        const defaultVenue: VenueInfo = {
          businessId: currentBusinessId || 'talikdgaf@gmail.com',
          businessName: currentBusinessName || "Rio's POS",
          managerEmail: 'talikdgaf@gmail.com',
          tables: tables.length > 0 ? tables : [],
        };
        setVenues([defaultVenue]);
        setSelectedVenue(defaultVenue);
      }
    });

    return () => {
      mounted = false;
    };
  }, [currentBusinessId, currentBusinessName, tables]);

  // Filter suggested bars as customer types
  const filteredVenues = useMemo(() => {
    if (!barSearchQuery.trim()) return venues;
    const q = barSearchQuery.toLowerCase().trim();
    return venues.filter(
      (v) =>
        v.businessName.toLowerCase().includes(q) ||
        v.businessId.toLowerCase().includes(q) ||
        v.managerEmail.toLowerCase().includes(q)
    );
  }, [venues, barSearchQuery]);

  // Determine available tables for selected venue (filter out occupied tables if possible)
  const venueTables = useMemo(() => {
    const list = selectedVenue?.tables && selectedVenue.tables.length > 0 ? selectedVenue.tables : tables;
    return list;
  }, [selectedVenue, tables]);

  // Unoccupied / free tables list
  const availableTables = useMemo(() => {
    if (venueTables.length === 0) return [{ id: 'table-1', name: 'Table 1', status: 'AVAILABLE' }];
    const free = venueTables.filter(
      (t) => !t.status || t.status.toUpperCase() === 'AVAILABLE' || t.activeOrdersCount === 0
    );
    return free.length > 0 ? free : venueTables;
  }, [venueTables]);

  // Sync default table selection when venue changes
  useEffect(() => {
    if (availableTables.length > 0) {
      const exists = availableTables.some((t) => t.name === selectedTable);
      if (!exists) {
        setSelectedTable(availableTables[0].name);
      }
    }
  }, [availableTables, selectedTable]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barInputRef.current && !barInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVenue = (venue: VenueInfo) => {
    setSelectedVenue(venue);
    setBarSearchQuery(venue.businessName);
    setShowSuggestions(false);
    setErrorMessage('');
    if (venue.tables && venue.tables.length > 0) {
      setSelectedTable(venue.tables[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (!selectedVenue) {
      const query = barSearchQuery.toLowerCase().trim();
      if (!query) {
        setErrorMessage('Please enter the bar or venue name.');
        return;
      }
      const matched = venues.find(
        (v) =>
          v.businessName.toLowerCase().trim() === query ||
          v.businessId.toLowerCase().trim() === query ||
          v.managerEmail.toLowerCase().trim() === query
      );
      if (!matched) {
        setErrorMessage(`Bar "${barSearchQuery}" not found. Please enter the exact registered business name so orders reach the waiter.`);
        return;
      }
      onContinue(trimmedName, selectedTable || 'Table 1', matched.businessId, matched.businessName);
      return;
    }

    onContinue(trimmedName, selectedTable || 'Table 1', selectedVenue.businessId, selectedVenue.businessName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-6 sm:p-7 relative flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 text-gray-400 hover:text-black transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Customer Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-2.5 shadow-sm">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-black tracking-tight">Customer Order</h2>
            <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Enter details to start ordering</p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="w-full mb-3.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* OPTION 1: Customer Name */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              1. Your Name
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
              <User className="w-4 h-4 text-gray-600 shrink-0 mr-2.5" />
              <input
                id="customer-name-input"
                type="text"
                placeholder="Enter your name (e.g. John Doe)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMessage('');
                }}
                autoFocus
                required
                className="w-full bg-transparent text-sm font-medium text-black placeholder:text-gray-400 outline-none"
              />
            </div>
          </div>

          {/* OPTION 2: Bar / Restaurant Name with live suggestions */}
          <div ref={barInputRef} className="relative">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              2. Select Bar / Restaurant
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
              <Store className="w-4 h-4 text-gray-600 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Type or select bar name"
                value={barSearchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setBarSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  setErrorMessage('');
                }}
                className="w-full bg-transparent text-sm font-bold text-black placeholder:text-gray-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-gray-400 hover:text-black p-0.5"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Suggested bars dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-gray-100 animate-in fade-in duration-100">
                {filteredVenues.length === 0 ? (
                  <div className="p-3 text-xs text-gray-400 text-center">No registered bars found.</div>
                ) : (
                  filteredVenues.map((v) => {
                    const isSelected = selectedVenue?.businessId === v.businessId;
                    return (
                      <button
                        key={v.businessId}
                        type="button"
                        onClick={() => handleSelectVenue(v)}
                        className={`w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                            {v.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-black">{v.businessName}</div>
                            <div className="text-[10px] text-gray-400">{v.managerEmail}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#FF6A00] flex items-center justify-center text-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* OPTION 3: Select Available Table */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                3. Choose Table (Free)
              </label>
              <span className="text-[10px] text-gray-500 font-medium">
                {availableTables.length} available
              </span>
            </div>

            {/* Tables Grid / Selector */}
            <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
              {availableTables.map((t) => {
                const isSelected = selectedTable === t.name;
                return (
                  <button
                    key={t.id || t.name}
                    type="button"
                    onClick={() => setSelectedTable(t.name)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-black/50'
                    }`}
                  >
                    <div className="truncate">{t.name}</div>
                    <div className={`text-[9px] font-normal ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                      {t.zone || 'Floor'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ORDER NOW BUTTON */}
          <button
            type="submit"
            id="btn-customer-order-now-submit"
            className="w-full mt-2 bg-black hover:bg-neutral-900 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <span>Order Now</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
          </button>
        </form>
      </div>
    </div>
  );
};
