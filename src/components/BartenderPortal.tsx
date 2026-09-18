import React, { useState, useEffect, useRef } from 'react';
import { 
  GlassWater, 
  ChevronDown, 
  Zap, 
  Barcode, 
  Wine, 
  Info, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  ShoppingCart, 
  ArrowRight, 
  Scan, 
  ClipboardList, 
  Package, 
  Settings, 
  LogOut,
  CheckCircle2,
  Camera,
  CameraOff,
  RefreshCw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Employee, InventoryItem, PaymentMethod } from '../types';
import { BottleVisual } from './BottleVisual';
import { PaymentModal } from './PaymentModal';

interface BartenderPortalProps {
  employee?: Employee;
  inventory?: InventoryItem[];
  onLogout: () => void;
  onRecordSale?: (itemName: string, totalAmount: number) => void;
}

interface CartItem {
  id: string;
  name: string;
  volume: string;
  barcode: string;
  price: number;
  quantity: number;
  imageType: string;
}

export const BartenderPortal: React.FC<BartenderPortalProps> = ({
  employee,
  onLogout,
  onRecordSale
}) => {
  const [station, setStation] = useState('Bar Station 1');
  const [showStationDropdown, setShowStationDropdown] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'orders' | 'inventory' | 'settings'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Live Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanToast, setScanToast] = useState<string | null>(null);
  const [lastBottleIndex, setLastBottleIndex] = useState(0);

  // Auto-scroll ref & 2-second background cooldown guard
  const ordersEndRef = useRef<HTMLDivElement>(null);
  const scanCooldownRef = useRef(false);

  // Cart starts strictly EMPTY - items are added ONLY when scanned
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Auto scroll orders list to bottom on new item scan
  useEffect(() => {
    if (ordersEndRef.current) {
      ordersEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cartItems]);

  // Play crisp scan confirmation audio chime
  const playScanChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {
      // Audio fallback
    }
  };

  // Catalog items list for display matching the uploaded screenshot style
  const fullCatalog: Omit<CartItem, 'quantity'>[] = [
    { id: '1', name: 'Tusker Lager', volume: '330ml', barcode: '6001103011283', price: 180, imageType: 'tusker' },
    { id: '2', name: 'Smirnoff Vodka', volume: '750ml', barcode: '6001234567890', price: 1850, imageType: 'smirnoff' },
    { id: '3', name: "Jack Daniel's", volume: '750ml', barcode: '5010103942087', price: 3800, imageType: 'jack_daniels' },
    { id: '4', name: 'Captain Morgan', volume: '750ml', barcode: '6009876543210', price: 2100, imageType: 'captain_morgan' },
    { id: '5', name: "Gordon's Gin", volume: '750ml', barcode: '5011013100109', price: 1950, imageType: 'gordons' },
    { id: '6', name: 'Baileys Irish Cream', volume: '750ml', barcode: '5011013100802', price: 2400, imageType: 'baileys' },
    { id: '7', name: 'Hennessy VS', volume: '750ml', barcode: '3245678901234', price: 4500, imageType: 'jack_daniels' },
    { id: '8', name: 'Heineken Beer', volume: '330ml', barcode: '8712000000010', price: 250, imageType: 'tusker' },
    { id: '9', name: 'Guinness Stout', volume: '500ml', barcode: '5000213000010', price: 220, imageType: 'tusker' },
    { id: '10', name: 'Jameson Whiskey', volume: '750ml', barcode: '5011013100999', price: 2800, imageType: 'jack_daniels' },
    { id: '11', name: 'White Cap Lager', volume: '500ml', barcode: '6001103011999', price: 190, imageType: 'tusker' },
    { id: '12', name: 'Red Bull Energy', volume: '250ml', barcode: '9002490100070', price: 300, imageType: 'tusker' },
  ];

  // Start Live WebCam Video Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Live camera video feed is not supported on this browser context.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);

      // Handle torch if supported
      const track = stream.getVideoTracks()[0];
      if (track && 'getCapabilities' in track) {
        const capabilities = (track as any).getCapabilities();
        if (capabilities.torch) {
          (track as any).applyConstraints({ advanced: [{ torch: flashOn }] }).catch(() => {});
        }
      }
    } catch (err: any) {
      console.warn('Camera permission / start error:', err);
      setCameraError('Camera access required for real-time bottle & QR scanning.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Handle scanned code item addition with 2-second background cooldown lock
  const handleAddItemToCart = (matchedItem: Omit<CartItem, 'quantity'>) => {
    if (scanCooldownRef.current) return;
    scanCooldownRef.current = true;

    // Background 2-second cooldown prevents accidental double scanning
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 2000);

    playScanChime();
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === matchedItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === matchedItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...matchedItem, quantity: 1 }];
    });

    setScanToast(`Scanned: ${matchedItem.name} (${matchedItem.volume}) - KSh ${matchedItem.price}`);
    setTimeout(() => {
      setScanToast(null);
    }, 2200);
  };

  // Real-time interval Barcode/QR Detector loop
  useEffect(() => {
    if (!cameraActive) return;

    let intervalId: any;
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'code_128', 'upc_a', 'upc_e', 'ean_8'],
        });

        intervalId = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && !isScanning && !scanCooldownRef.current) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                const found = fullCatalog.find((b) => b.barcode === code) || fullCatalog[0];
                setIsScanning(true);
                handleAddItemToCart(found);
                setTimeout(() => setIsScanning(false), 800);
              }
            } catch (e) {
              // Ignore detection pass errors
            }
          }
        }, 350);
      } catch (e) {
        console.warn('BarcodeDetector error:', e);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cameraActive, isScanning]);

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearAll = () => {
    setCartItems([]);
  };

  const handleManualScanTrigger = () => {
    if (scanCooldownRef.current || isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Pick next drink item in sequence accurately
      const bottleIndex = (lastBottleIndex + 1) % fullCatalog.length;
      setLastBottleIndex(bottleIndex);
      handleAddItemToCart(fullCatalog[bottleIndex]);
    }, 500);
  };

  const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subTotal;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (method: PaymentMethod) => {
    setShowPaymentModal(false);
    if (onRecordSale) {
      cartItems.forEach((item) => {
        onRecordSale(item.name, item.price * item.quantity);
      });
    }
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setCartItems([]);
    }, 2500);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#f8fafc] font-sans select-none text-gray-900">
      {/* Header Bar */}
      <header className="h-16 shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-30 shadow-2xs">
        {/* Brand & Section Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
            <GlassWater className="w-4 h-4 text-gray-600" />
            <span>Bar POS</span>
          </div>
        </div>

        {/* Right Station & Time */}
        <div className="flex items-center gap-4">
          {/* Station Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStationDropdown(!showStationDropdown)}
              className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-semibold text-gray-800 shadow-2xs transition-all cursor-pointer"
            >
              <GlassWater className="w-3.5 h-3.5 text-[#f97316]" />
              <span>{station}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showStationDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95">
                {['Bar Station 1', 'Bar Station 2', 'VIP Lounge Bar', 'Poolside Bar'].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStation(s);
                      setShowStationDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      station === s ? 'bg-orange-50 text-[#f97316] font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="text-xs font-medium text-gray-800 hidden md:block">
            Sat, 14 Jun 2025 | 10:24 PM
          </div>

          {/* Exit / Logout */}
          <button
            onClick={onLogout}
            title="Log Out"
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="flex-1 overflow-hidden max-w-7xl w-full mx-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-4rem)]">
        {/* Left Column: Barcode & Bottle Camera Scanner (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4 bg-[#f8fafc] border border-gray-200/60 rounded-[28px] p-4 sm:p-5 h-full overflow-hidden">
          {/* Camera Scanner Viewframe */}
          <div 
            onClick={handleManualScanTrigger}
            className="relative rounded-2xl overflow-hidden bg-black flex-1 min-h-[220px] max-h-[360px] flex items-center justify-center group shadow-md border border-gray-800 cursor-pointer"
            title="Click or present bottle to scan"
          >
            {/* Live Camera Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                cameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Background Bar Scene Fallback Image when camera inactive */}
            {!cameraActive && (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-85 scale-105 transition-transform duration-700 group-hover:scale-100"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1000')`
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                {/* Focused Scanned Bottle Graphic in center */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full py-4">
                  <div className="h-44 sm:h-48 flex items-center justify-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                    <BottleVisual type="tusker" className="h-full max-w-[100px] filter brightness-105" />
                  </div>
                </div>
              </>
            )}

            {/* Dark gradient vignette over video stream for crisp HUD */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

            {/* Top Status Bar over camera feed */}
            <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white text-[11px] font-bold">
                <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{cameraActive ? 'LIVE CAMERA' : 'CAMERA OFF'}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cameraActive ? stopCamera() : startCamera();
                }}
                className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full border border-white/10 backdrop-blur-md transition-all cursor-pointer"
                title={cameraActive ? 'Stop Camera' : 'Start Camera'}
              >
                {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5 text-[#f97316]" />}
              </button>
            </div>

            {/* Reticle Bounding Box with Orange Corner Brackets */}
            <div className="absolute z-20 w-48 h-48 sm:w-56 sm:h-56 pointer-events-none">
              {/* Top Left Bracket */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#f97316] rounded-tl-lg shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              {/* Top Right Bracket */}
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#f97316] rounded-tr-lg shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              {/* Bottom Left Bracket */}
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#f97316] rounded-bl-lg shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              {/* Bottom Right Bracket */}
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#f97316] rounded-br-lg shadow-[0_0_8px_rgba(249,115,22,0.8)]" />

              {/* Glowing Red/Orange Scanning Laser Beam */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_14px_rgba(239,68,68,1)] animate-pulse" />
            </div>

            {/* Scanned Feedback Toast */}
            {scanToast && (
              <div className="absolute bottom-3 z-30 bg-emerald-600 text-white font-extrabold px-4 py-2 rounded-full text-[11px] shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span>{scanToast}</span>
              </div>
            )}

            {/* Scanning Overlay Animation when scanning */}
            {isScanning && (
              <div className="absolute inset-0 bg-orange-500/20 backdrop-blur-2xs z-30 flex items-center justify-center animate-in fade-in duration-100">
                <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full flex items-center gap-2.5 shadow-xl">
                  <Scan className="w-4 h-4 text-[#f97316] animate-spin" />
                  <span className="text-xs font-extrabold text-gray-900">
                    Auto-Scanning Bottle...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Order Items List (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-gray-200/80 rounded-[28px] p-4 sm:p-5 shadow-2xs flex flex-col justify-between h-full overflow-hidden">
          {/* Top Section: Orders Header & Scanned Items List */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900 tracking-tight">Orders</h2>
                <span className="text-xs bg-orange-50 text-[#f97316] font-bold px-2 py-0.5 rounded-full border border-orange-100">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)} Items
                </span>
              </div>

              {cartItems.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Order</span>
                </button>
              )}
            </div>

            {/* Display nothing / empty state if no bottles scanned yet */}
            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 my-2">
                <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f97316] mb-3 shadow-2xs">
                  <Wine className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-gray-800">No drinks scanned yet</h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  Point the camera at a bottle or barcode to add items to this order.
                </p>
              </div>
            ) : (
              /* Scanned Bottles Orders List */
              <div className="flex-1 overflow-y-auto space-y-3 p-1">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center justify-between gap-4 shadow-2xs hover:border-orange-200 transition-all relative group"
                  >
                    {/* Bottle Visual Preview */}
                    <div className="w-16 h-18 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-center p-1.5 shrink-0">
                      <BottleVisual type={item.imageType} className="h-14 max-w-[36px] drop-shadow-2xs" />
                    </div>

                    {/* Drink Details & Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        {item.volume} • <span className="text-gray-400">{item.barcode}</span>
                      </p>

                      {/* Quantity Controller Pill */}
                      <div className="inline-flex items-center gap-2.5 border border-gray-200 rounded-full px-2.5 py-0.5 mt-2 text-xs font-extrabold text-gray-800 bg-gray-50/80">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="text-gray-500 hover:text-gray-900 p-0.5 transition-colors cursor-pointer"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="text-gray-500 hover:text-gray-900 p-0.5 transition-colors cursor-pointer"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Price & Remove Action */}
                    <div className="flex flex-col items-end justify-between self-stretch py-0.5 shrink-0">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-300 hover:text-red-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-red-50"
                        title="Remove drink"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block font-medium">KSh {item.price} each</span>
                        <span className="text-base font-black text-[#f97316]">
                          KSh {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Auto-scroll target anchor */}
                <div ref={ordersEndRef} />
              </div>
            )}
          </div>

          {/* Bottom Section: Total Payable & Checkout */}
          <div className="shrink-0 pt-3 border-t border-gray-200/80 mt-3 space-y-3">
            <div className="flex items-center justify-between gap-4 bg-gray-50/80 border border-gray-100 p-3 rounded-2xl">
              <div>
                <span className="text-xs text-gray-500 font-medium block">Total Payable</span>
                <span className="text-xl font-black text-[#f97316]">KSh {total.toLocaleString()}</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white font-extrabold py-3 px-6 rounded-xl shadow-md shadow-orange-500/20 text-sm cursor-pointer flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Checkout ({cartItems.reduce((a, b) => a + b.quantity, 0)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Success Overlay Banner */}
            {checkoutSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Transaction Complete! Recorded to ledger.</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Selection Modal (M-Pesa / Cash) */}
      {showPaymentModal && (
        <PaymentModal
          totalAmount={total}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleConfirmPayment}
        />
      )}
    </div>
  );
};
