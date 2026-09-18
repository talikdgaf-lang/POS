import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  QrCode,
  Wine,
  Search,
  CheckCircle2,
  X,
  Clock,
  BarChart3,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  LogOut,
  MapPin,
  Pencil,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
  Camera,
  Video,
  ChevronDown,
} from 'lucide-react';
import { InventoryItem, Employee } from '../types';
import { BottleVisual } from './BottleVisual';

interface StockManagerPortalProps {
  employee?: Employee;
  inventory: InventoryItem[];
  onAddStock: (itemId: string, quantityToAdd: number) => void;
  onLogout: () => void;
}

interface ScanRecord {
  id: string;
  itemId: string;
  itemName: string;
  barcode: string;
  quantity: number;
  time: string;
  bottleType: string;
}

// Map inventory item IDs/names to bottleType and barcodes matching image.png
const ITEM_META: Record<string, { bottleType: string; barcode: string }> = {
  heineken: { bottleType: 'heineken', barcode: '8712000793874' },
  tusker: { bottleType: 'tusker', barcode: '6001103011283' },
  smirnoff: { bottleType: 'smirnoff', barcode: '6001234567890' },
  baileys: { bottleType: 'baileys', barcode: '5011013934208' },
  johnnie_walker: { bottleType: 'johnnie_walker', barcode: '5000267011706' },
  captain_morgan: { bottleType: 'captain_morgan', barcode: '5000267023105' },
  white_claw: { bottleType: 'white_claw', barcode: '8801056123982' },
  coca_cola: { bottleType: 'coca_cola', barcode: '5449000000996' },
  sprite: { bottleType: 'sprite', barcode: '5449000000997' },
  stoney_tangawizi: { bottleType: 'stoney_tangawizi', barcode: '5449000000998' },
  gordons: { bottleType: 'gordons', barcode: '5000267011809' },
  jack_daniels: { bottleType: 'jack_daniels', barcode: '082184090466' },
};

export const StockManagerPortal: React.FC<StockManagerPortalProps> = ({
  employee,
  inventory,
  onAddStock,
  onLogout,
}) => {
  const stockClerkName = employee ? employee.name : 'Stock Manager';

  // Scanner state
  const [scanMode, setScanMode] = useState<'barcode' | 'bottle'>('barcode');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [detectedItem, setDetectedItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemForManual, setSelectedItemForManual] = useState<InventoryItem | null>(null);
  const [manualAddQty, setManualAddQty] = useState<number>(12);

  // Modal State
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Live Camera Stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>({
    title: 'Item Added Successfully',
    body: 'Heineken 330ml has been added to inventory.',
  });

  // Pre-populated Recent Scans matching image.png
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([
    {
      id: 'scan-1',
      itemId: 'heineken',
      itemName: 'Heineken 330ml',
      barcode: '8712000793874',
      quantity: 12,
      time: '10:23 PM',
      bottleType: 'heineken',
    },
    {
      id: 'scan-2',
      itemId: 'tusker',
      itemName: 'Tusker Lager 330ml',
      barcode: '6001103011283',
      quantity: 18,
      time: '10:20 PM',
      bottleType: 'tusker',
    },
    {
      id: 'scan-3',
      itemId: 'smirnoff',
      itemName: 'Smirnoff Vodka 750ml',
      barcode: '6001234567890',
      quantity: 6,
      time: '10:15 PM',
      bottleType: 'smirnoff',
    },
    {
      id: 'scan-4',
      itemId: 'baileys',
      itemName: 'Baileys Irish Cream 750ml',
      barcode: '5011013934208',
      quantity: 4,
      time: '10:12 PM',
      bottleType: 'baileys',
    },
    {
      id: 'scan-5',
      itemId: 'johnnie_walker',
      itemName: 'Johnnie Walker Black Label 750ml',
      barcode: '5000267011706',
      quantity: 3,
      time: '10:07 PM',
      bottleType: 'johnnie_walker',
    },
  ]);

  // Live Current Date & Time
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentTime(`${dateStr}  ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Web Camera Stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
          });
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setIsCameraActive(true);
          setCameraError(null);
        }
      } catch (err) {
        console.warn('Real camera not accessible, falling back to simulated scanner overlay:', err);
        setIsCameraActive(false);
        setCameraError('Camera stream active in auto-scan mode');
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Filter inventory for Quick Add Search
  const filteredInventory = inventory.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const meta = ITEM_META[item.id] || { barcode: '6000000000' };
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      meta.barcode.includes(q)
    );
  });

  // Calculate Inventory Summary Stats
  const totalItems = inventory.reduce((acc, i) => acc + i.remaining, 0);
  const totalValue = inventory.reduce((acc, i) => acc + i.remaining * i.sellPrice, 0);
  const lowStockCount = inventory.filter((i) => i.remaining > 0 && i.remaining <= 2).length;
  const outOfStockCount = inventory.filter((i) => i.remaining === 0).length;

  // Execute Stock Addition
  const handlePerformAddStock = (item: InventoryItem, qty: number) => {
    if (qty <= 0) return;

    onAddStock(item.id, qty);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const meta = ITEM_META[item.id] || { bottleType: 'heineken', barcode: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}` };

    const newRecord: ScanRecord = {
      id: `scan-${Date.now()}`,
      itemId: item.id,
      itemName: `${item.name} ${item.volume}`,
      barcode: meta.barcode,
      quantity: qty,
      time: timeStr,
      bottleType: meta.bottleType,
    };

    setRecentScans((prev) => [newRecord, ...prev]);

    setToastMessage({
      title: 'Item Added Successfully',
      body: `${item.name} (${item.volume}) has been added to inventory (+${qty}).`,
    });

    setSearchQuery('');
    setSelectedItemForManual(null);
    setDetectedItem(null);
  };

  // Detect bottle/barcode presented to camera (NO auto add)
  const handleScanBottleOrBarcode = (mode: 'barcode' | 'bottle') => {
    setIsScanning(true);
    setScanMode(mode);

    setTimeout(() => {
      setIsScanning(false);
      // Pick target item automatically to present to clerk for verification
      const target = inventory[Math.floor(Math.random() * inventory.length)] || inventory[0];
      if (target) {
        setDetectedItem(target);
      }
    }, 700);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#f8fafc] text-gray-900 flex flex-col font-sans select-none">
      {/* Top Header Navigation Bar - Non-scrolling fixed header */}
      <header className="bg-white border-b border-gray-200/80 shrink-0 z-30 px-6 py-2.5 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-2xs">
              <Wine className="w-4 h-4" />
            </div>
            <span className="text-base font-black text-gray-900 tracking-tight">BeverageHub</span>
            <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200 ml-1 hidden sm:inline-block">
              Stock Clerk Portal
            </span>
          </div>

          {/* Right: Top Inventory Summary Button & Time & Logout */}
          <div className="flex items-center gap-3">
            {/* Top Inventory Summary Pop-up Button */}
            <button
              type="button"
              onClick={() => setShowSummaryModal(true)}
              className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <span>Inventory Summary</span>
              <span className="bg-orange-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                {totalItems}
              </span>
            </button>

            {/* Time display */}
            <div className="hidden lg:block text-[11px] font-bold text-gray-600 font-mono tracking-tight">
              {currentTime || 'Sat, 14 Jun 2025 10:24 PM'}
            </div>

            {/* User Logout */}
            <div className="flex items-center border-l border-gray-200 pl-2.5">
              <button
                type="button"
                onClick={onLogout}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-700 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Logout / Change Role"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout - Designed to fit seamlessly with non-scrolling header */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-y-auto">
        {/* Left Column: Compact Camera Scanner & Quick Add (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Square Camera Viewport Frame */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-gray-900">Live Camera Scanner</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setScanMode('barcode')}
                  className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    scanMode === 'barcode' ? 'bg-orange-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <QrCode className="w-3 h-3" />
                  <span>Barcode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('bottle')}
                  className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    scanMode === 'bottle' ? 'bg-orange-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Wine className="w-3 h-3" />
                  <span>Bottle</span>
                </button>
              </div>
            </div>

            {/* Square Viewfinder Box */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 aspect-square rounded-3xl overflow-hidden shadow-lg border-2 border-stone-800 bg-stone-950 flex items-center justify-center mx-auto group">
              {/* Real-time HTML5 Camera Video Feed */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraActive ? 'opacity-100' : 'hidden'}`}
                />

                {!isCameraActive && (
                  <div className="relative w-full h-full flex items-center justify-center bg-stone-950">
                    <BottleVisual type="heineken" className="h-48 object-contain filter brightness-105 contrast-110 opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                  </div>
                )}
              </div>

              {/* Active Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className="bg-emerald-500/90 text-white backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-2xs border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Live Camera Feed
                </span>
              </div>

              {/* Square Viewfinder Corner Brackets */}
              <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-2xl border-2 border-transparent flex items-center justify-center z-10">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-xl" />

                {/* Laser line */}
                <div
                  className={`absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_12px_#f97316] ${
                    isScanning ? 'animate-bounce' : 'animate-pulse'
                  }`}
                  style={{ top: '50%' }}
                />
              </div>

              {/* Overlay Instruction */}
              <div className="absolute bottom-3 z-20 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white max-w-[90%] text-center">
                {isScanning ? (
                  <span className="text-orange-400 animate-pulse flex items-center justify-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Detecting bottle or QR code...
                  </span>
                ) : (
                  <span>Hold item in front of lens, then click "Scan Presented Item"</span>
                )}
              </div>
            </div>

            {/* Present Item Button */}
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={() => handleScanBottleOrBarcode(scanMode)}
                disabled={isScanning}
                className="w-full max-w-xs bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Presented Item ({scanMode === 'barcode' ? 'QR/Barcode' : 'Bottle'})</span>
              </button>
            </div>

            {/* Detected Item Verification Card - Wait for clerk confirmation */}
            {detectedItem && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black text-gray-900">Item Detected in Camera</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetectedItem(null)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-orange-200">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center p-1 border border-gray-100 shrink-0">
                    <BottleVisual type={ITEM_META[detectedItem.id]?.bottleType || 'heineken'} className="h-8 max-w-[24px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">
                      {detectedItem.name} ({detectedItem.volume})
                    </div>
                    <div className="text-[10px] font-mono text-gray-500">
                      Barcode: {ITEM_META[detectedItem.id]?.barcode || '8712000793874'}
                    </div>
                    <div className="text-[10px] text-gray-600 font-medium">
                      Current Stock: <strong className="text-gray-900">{detectedItem.remaining} bottles</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePerformAddStock(detectedItem, 12)}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs py-2 px-4 rounded-xl shadow-2xs transition-all cursor-pointer flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Confirm Add +12 Bottles</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePerformAddStock(detectedItem, 6)}
                    className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer"
                  >
                    +6
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add (Manual) Compact Section */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 text-orange-600" />
                <h3 className="text-xs font-bold text-gray-900">Quick Add (Manual)</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Search by item name or barcode</span>
            </div>

            {/* Compact Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type item name or barcode..."
                className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Product Search Results Dropdown List */}
            {searchQuery && (
              <div className="border border-gray-200 rounded-xl p-2 bg-gray-50/50 max-h-48 overflow-y-auto space-y-1.5">
                {filteredInventory.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">
                    No products found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredInventory.map((item) => {
                    const meta = ITEM_META[item.id] || { bottleType: 'heineken', barcode: '6000000000' };
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200/80 rounded-lg p-2 flex items-center justify-between gap-2 hover:border-orange-300 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center p-0.5 border border-gray-100 shrink-0">
                            <BottleVisual type={meta.bottleType} className="h-6 max-w-[20px]" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">{item.name} {item.volume}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              Barcode: {meta.barcode} • Stock: <span className="font-bold text-gray-700">{item.remaining}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePerformAddStock(item, 12)}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+12</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedItemForManual(item)}
                            className="border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-[10px] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            Custom
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Custom Quantity Form for Selected Product */}
            {selectedItemForManual && (
              <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">
                    Add stock to: <strong className="text-orange-700">{selectedItemForManual.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedItemForManual(null)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-300 bg-white rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setManualAddQty(Math.max(1, manualAddQty - 1))}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={manualAddQty}
                      onChange={(e) => setManualAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center font-bold text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setManualAddQty(manualAddQty + 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePerformAddStock(selectedItemForManual, manualAddQty)}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer flex-1"
                  >
                    Confirm Add +{manualAddQty}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Green Success Toast Banner */}
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">{toastMessage.title}</h4>
                  <p className="text-[11px] text-emerald-800 font-medium">{toastMessage.body}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Internal Scrolling Recent Scans */}
        <div className="space-y-4">
          {/* Recent Scans Card with Internal Scrollbar */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-700" />
                <h2 className="text-xs font-bold text-gray-900">Recent Scans Log</h2>
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {recentScans.length} items logged
              </span>
            </div>

            {/* Internal Scrollable Scans Container */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-gray-200">
              {recentScans.map((scan) => (
                <div key={scan.id} className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between gap-2 hover:bg-gray-100/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    {/* Bottle Thumbnail */}
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200/80 flex items-center justify-center p-0.5 shrink-0">
                      <BottleVisual type={scan.bottleType} className="h-7 max-w-[22px]" />
                    </div>

                    {/* Name & Barcode */}
                    <div>
                      <div className="text-xs font-bold text-gray-900 line-clamp-1">{scan.itemName}</div>
                      <div className="text-[10px] font-mono text-gray-400">{scan.barcode}</div>
                      <div className="text-[10px] font-extrabold text-orange-700">
                        +{scan.quantity} bottles <span className="text-gray-400 font-normal ml-2">{scan.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Added Tag Pill */}
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Added</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Modal: Inventory Summary */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Inventory Summary</h3>
                  <p className="text-xs text-gray-500 font-medium">Real-time stock totals and valuation breakdown</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* 4 Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Package className="w-3 h-3 text-gray-400" /> Total Items
                  </div>
                  <div className="text-2xl font-black text-gray-900">{totalItems}</div>
                  <div className="text-[10px] font-bold text-emerald-600">Active Stock</div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-gray-400" /> Total Value
                  </div>
                  <div className="text-base font-black text-gray-900 truncate">
                    KSh {totalValue.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600">Valuation</div>
                </div>

                <div className="bg-red-50/60 border border-red-200 rounded-2xl p-3 space-y-1">
                  <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500" /> Low Stock
                  </div>
                  <div className="text-2xl font-black text-red-700">{lowStockCount}</div>
                  <div className="text-[10px] font-bold text-red-600">Reorder Soon</div>
                </div>

                <div className="bg-red-50/60 border border-red-200 rounded-2xl p-3 space-y-1">
                  <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3 text-red-500" /> Out of Stock
                  </div>
                  <div className="text-2xl font-black text-red-700">{outOfStockCount}</div>
                  <div className="text-[10px] font-bold text-red-600">Critical</div>
                </div>
              </div>

              {/* Detailed Item List Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Itemized Stock Status</h4>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {inventory.map((item) => {
                    const meta = ITEM_META[item.id] || { bottleType: 'heineken', barcode: '8712000793874' };
                    const isLow = item.remaining > 0 && item.remaining <= 2;
                    const isOut = item.remaining === 0;

                    return (
                      <div key={item.id} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center p-1 shrink-0">
                            <BottleVisual type={meta.bottleType} className="h-7 max-w-[22px]" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">{item.name} {item.volume}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {item.category} • KSh {item.sellPrice}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-black text-gray-900">{item.remaining} in stock</div>
                            <div className="text-[10px] text-gray-400 font-mono">{meta.barcode}</div>
                          </div>
                          <div>
                            {isOut ? (
                              <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                Low Stock
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
