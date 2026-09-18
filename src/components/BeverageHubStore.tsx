import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  X,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  LayoutGrid,
  Beer,
  Wine,
  GlassWater,
  Flame,
  Sparkles,
  CupSoda,
  Martini,
  User,
  ArrowLeft,
} from 'lucide-react';
import { Category, Product, CartItem, InventoryItem } from '../types';
import { PRODUCTS } from '../data/products';
import { BottleVisual } from './BottleVisual';

interface BeverageHubStoreProps {
  customerName: string;
  inventory?: InventoryItem[];
  hasActiveOrder?: boolean;
  onOpenTracking?: () => void;
  onProceedToCheckout: (cart: CartItem[], total: number, clearCart: () => void) => void;
  onBackToRoles: () => void;
}

export const BeverageHubStore: React.FC<BeverageHubStoreProps> = ({
  customerName,
  inventory = [],
  hasActiveOrder,
  onOpenTracking,
  onProceedToCheckout,
  onBackToRoles,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Popular');

  // Start with an empty cart so it always displays "No items selected" until customer chooses an item
  const [cart, setCart] = useState<CartItem[]>([]);

  const getProductStock = (productId: string): number => {
    const item = inventory.find((i) => i.id === productId);
    return item ? item.remaining : 10;
  };

  const handleAddToCart = (product: Product) => {
    const available = getProductStock(product.id);
    if (available <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= available) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const available = getProductStock(productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > available) return item;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Calculations
  const subTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const total = subTotal;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Filter products
  const filteredProducts = PRODUCTS.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.origin && item.origin.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const categoriesList: { name: Category; icon: React.ReactNode }[] = [
    { name: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
    { name: 'Beer', icon: <Beer className="w-4 h-4" /> },
    { name: 'Whiskey', icon: <Flame className="w-4 h-4" /> },
    { name: 'Vodka', icon: <Sparkles className="w-4 h-4" /> },
    { name: 'Rum', icon: <GlassWater className="w-4 h-4" /> },
    { name: 'Gin', icon: <GlassWater className="w-4 h-4" /> },
    { name: 'Wine', icon: <Wine className="w-4 h-4" /> },
    { name: 'Cocktails', icon: <Martini className="w-4 h-4" /> },
    { name: 'Soda', icon: <CupSoda className="w-4 h-4" /> },
    { name: 'Non-Alcoholic', icon: <GlassWater className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#f8f9fb] text-gray-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200/80 shrink-0 z-40 px-4 sm:px-6 py-3 select-none">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
          {/* Back & Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              id="btn-back-to-roles"
              onClick={onBackToRoles}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Return to Manager, Worker & Customer selection"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Roles</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-xl font-extrabold text-[#111827] tracking-tight">
              BeverageHub
            </span>
          </div>

          {/* Right Area / Quick Cart View Badge */}
          <div className="flex items-center gap-3">
            {hasActiveOrder && (
              <button
                onClick={onOpenTracking}
                className="flex items-center gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-emerald-200"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Track Order</span>
                <span className="sm:hidden">Track</span>
              </button>
            )}
            <button
              onClick={() => {
                if (cart.length > 0) onProceedToCheckout(cart, total, handleClearCart);
              }}
              className="md:hidden flex items-center gap-2 bg-[#ff5500] text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{totalItemsCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-hidden min-h-0">
        {/* Left Sidebar (Categories & User Profile) - Non scrolling */}
        <aside className="lg:col-span-2 hidden lg:flex flex-col gap-3 shrink-0 select-none overflow-hidden h-fit">
          {/* User Profile Card */}
          <div className="bg-white rounded-2xl p-3 border border-gray-200/80 flex items-center justify-between gap-3 shadow-2xs shrink-0 overflow-hidden">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-gray-900 truncate">
                  {customerName || 'Customer'}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">Ordering</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToRoles}
              className="text-[10px] font-semibold text-gray-500 hover:text-black hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Return to choose Manager, Worker, or Customer"
            >
              Exit
            </button>
          </div>

          {/* Categories Nav */}
          <div className="bg-white rounded-2xl p-2 border border-gray-200/80 shadow-2xs shrink-0 overflow-hidden">
            <nav className="space-y-0.5">
              {categoriesList.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#fff1eb] text-[#ff5500] font-semibold'
                        : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-900'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-[#ff5500]' : 'text-gray-500'}`}>
                      {cat.icon}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Center Content Section */}
        <main className="lg:col-span-7 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-8 scrollbar-thin">
          {/* Header Row: Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Alcohol & Drinks
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Premium drinks, delivered to you
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Beverages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-sm text-gray-900 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200/90 outline-none focus:border-gray-400 transition-colors shadow-2xs"
              />
            </div>
          </div>

          {/* Quick Category Pills for Mobile & Quick Access */}
          <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'bg-[#ff5500] text-white shadow-xs'
                      : 'bg-white border border-gray-200/90 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200/80 p-8 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-[#ff5500] flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">No beverages found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                No drinks matched "{searchQuery}". Try searching for Tusker, Whiskey, Vodka, Gin, or clear your search query.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => {
              const remaining = getProductStock(prod.id);
              const inCartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
              const isOutOfStock = remaining <= 0;
              const isInsufficient = isOutOfStock || inCartQty >= remaining;

              return (
                <div
                  key={prod.id}
                  className={`bg-white border rounded-2xl p-3.5 flex flex-col justify-between transition-shadow relative group ${
                    isOutOfStock ? 'border-gray-200/60 opacity-85' : 'border-gray-200/90 hover:shadow-md'
                  }`}
                >
                  {/* Top Badge: Alcohol Content */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        prod.abv === '0.0%'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-[#fff1eb] text-[#ff5500]'
                      }`}
                    >
                      {prod.abv === '0.0%' ? '0.0% Non-Alc' : `${prod.abv} ABV`}
                    </span>
                  </div>

                  {/* Bottle Visual */}
                  <div className="h-36 sm:h-40 flex items-center justify-center my-2 p-1 overflow-hidden relative">
                    <BottleVisual
                      type={prod.imageType}
                      alt={prod.name}
                      className={`h-full max-w-full object-contain transition-opacity ${
                        isOutOfStock ? 'opacity-55 grayscale-[20%]' : ''
                      }`}
                    />
                  </div>

                  {/* Details */}
                  <div className="pt-2">
                    <h3 className="font-bold text-gray-900 text-sm truncate" title={prod.name}>
                      {prod.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 mb-2">
                      {prod.volume} • {prod.category}
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-[#ff5500]">
                      KSh {prod.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      disabled={isInsufficient}
                      onClick={() => handleAddToCart(prod)}
                      className={`w-full text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center transition-colors ${
                        isInsufficient
                          ? 'bg-gray-100 text-gray-400 border border-gray-200/90 cursor-not-allowed'
                          : 'bg-[#ff5500] hover:bg-[#e64d00] text-white cursor-pointer'
                      }`}
                    >
                      {isInsufficient ? 'Insufficient Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </main>

        {/* Right Sidebar ("Your Order" Cart) - Non scrolling container */}
        <aside className="lg:col-span-3 flex flex-col gap-4 shrink-0 h-full max-h-full overflow-hidden select-none">
          <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex flex-col h-fit max-h-full overflow-hidden shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-gray-100 shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Your Order</h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-xs text-[#ff5500] hover:text-[#d44700] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cart</span>
                </button>
              )}
            </div>

            {/* Cart Items List - Sized for 3 bottles with internal scrolling when needed */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[170px] max-h-[220px] cart-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-3 border-2 border-dashed border-gray-100 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-orange-50 text-[#ff5500] flex items-center justify-center mb-1.5">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">No items selected</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 max-w-[190px]">
                    Space reserved for 3 bottles. Select beverages from the catalog to add.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-gray-100 last:border-b-0"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-10 h-12 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100 p-1">
                      <BottleVisual type={item.product.imageType} alt={item.product.name} className="h-10 object-contain" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                          aria-label="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-500 mt-0.5">
                        <span>{item.product.volume}</span>
                        <span>•</span>
                        <span className="text-[#ff5500] font-medium">{item.product.abv}</span>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="text-gray-600 hover:text-black cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-gray-900 w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="text-gray-600 hover:text-black cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs sm:text-sm font-extrabold text-[#ff5500]">
                          KSh {(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Summary */}
            {cart.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-gray-200/90 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span>Sub Total</span>
                  <span>KSh {subTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-[#ff5500] font-extrabold">
                    KSh {total.toLocaleString()}
                  </span>
                </div>

                {/* Proceed to Checkout Button */}
                <button
                  type="button"
                  id="btn-proceed-to-checkout"
                  onClick={() => onProceedToCheckout(cart, total, handleClearCart)}
                  className="w-full mt-2.5 bg-[#121c2d] hover:bg-[#1a283e] text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors text-sm shrink-0"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 18+ Warning Notice Box */}
            <div className="mt-2.5 bg-[#f0f4f9] rounded-xl p-2.5 flex items-start gap-2 shrink-0">
              <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-snug text-slate-600 font-medium">
                <span className="font-bold text-slate-800">18+:</span> You must be 18+ to purchase alcohol. ID may be required upon delivery.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
