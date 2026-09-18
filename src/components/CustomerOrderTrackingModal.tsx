import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Star } from 'lucide-react';
import { Order } from '../types';
import { addCustomerRating } from '../utils/employeeRatings';

interface CustomerOrderTrackingModalProps {
  order: Order;
  onUpdateOrder?: (orderId: string, updatedFields: Partial<Order>) => void;
  onClose: () => void;
  onMinimize?: () => void;
}

export const CustomerOrderTrackingModal: React.FC<CustomerOrderTrackingModalProps> = ({
  order,
  onUpdateOrder,
  onClose,
  onMinimize,
}) => {
  // Local stage tracks progression (1: Placed, 2: Received, 3: Preparing [20s], 4: Incoming [20s] -> Rating)
  const [currentStage, setCurrentStage] = useState<number>(order.trackingStep || 1);
  const [incomingCountdown, setIncomingCountdown] = useState<number>(20);
  const [ratingReady, setRatingReady] = useState<boolean>(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const starsContainerRef = useRef<HTMLDivElement>(null);

  // Sync with order updates from waiter
  useEffect(() => {
    if (order.trackingStep && order.trackingStep > currentStage) {
      setCurrentStage(order.trackingStep);
    }
  }, [order.trackingStep]);

  // Stage 3 (Preparing Order): Runs for 20 seconds with continuous hover animation, no timer displayed
  useEffect(() => {
    if (currentStage === 3) {
      const timer = setTimeout(() => {
        setCurrentStage(4);
        if (onUpdateOrder) {
          onUpdateOrder(order.id, {
            trackingStep: 4,
            status: 'Served',
          });
        }
      }, 20000); // 20 seconds

      return () => clearTimeout(timer);
    }
  }, [currentStage, order.id, onUpdateOrder]);

  // Stage 4 (Order Incoming): Counts down 20 seconds, then reveals rating
  useEffect(() => {
    if (currentStage === 4 && !ratingReady) {
      if (incomingCountdown <= 0) {
        setRatingReady(true);
        if (onUpdateOrder) {
          onUpdateOrder(order.id, {
            status: 'Served' as any,
          });
        }
        return;
      }

      const interval = setInterval(() => {
        setIncomingCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentStage, incomingCountdown, ratingReady, order.id, onUpdateOrder]);

  // Handle star interactions
  const handleSelectRating = (score: number) => {
    setRating(score);
    if (order.waiterName) {
      addCustomerRating(order.waiterName, score, order.id);
    }
  };

  const handleStarInteraction = (clientX: number, isClick = false) => {
    if (!starsContainerRef.current) return;
    const rect = starsContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    if (width <= 0) return;

    const fraction = Math.max(0, Math.min(1, x / width));
    const rawScore = fraction * 5;
    const roundedScore = Math.max(0.5, Math.ceil(rawScore * 2) / 2);

    if (isClick) {
      handleSelectRating(roundedScore);
    } else {
      setHoverRating(roundedScore);
    }
  };

  const handleSubmitRating = () => {
    setIsSubmitting(true);
    if (rating && order.waiterName) {
      addCustomerRating(order.waiterName, rating, order.id);
    }
    setTimeout(() => {
      onClose(); // Returns to "Order Now" customer screen
    }, 400);
  };

  const circleStages = [
    {
      id: 1,
      title: 'Order Placed',
      description: 'Waiting for waiter to accept...',
    },
    {
      id: 2,
      title: 'Order Received',
      description: order.waiterName
        ? `Your server ${order.waiterName} has received your order.`
        : 'Order confirmed by staff.',
    },
    {
      id: 3,
      title: 'Preparing Order',
      description: 'Order is being prepared...',
    },
    {
      id: 4,
      title: ratingReady ? 'Rate your server' : 'Order Incoming',
      description: 'Drinks incoming! Please wait at your table.',
    },
  ];

  const currentConfig = circleStages[Math.min(currentStage, 4) - 1];

  const renderStar = (starIndex: number) => {
    const currentVal = hoverRating ?? rating ?? 0;
    const isFull = currentVal >= starIndex;
    const isHalf = currentVal === starIndex - 0.5;

    return (
      <div
        key={starIndex}
        className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
        onMouseLeave={() => setHoverRating(null)}
      >
        <div
          className="absolute left-0 top-0 w-1/2 h-full z-20 cursor-pointer"
          onMouseEnter={() => setHoverRating(starIndex - 0.5)}
          onClick={() => handleSelectRating(starIndex - 0.5)}
          title={`${starIndex - 0.5} Stars`}
        />
        <div
          className="absolute right-0 top-0 w-1/2 h-full z-20 cursor-pointer"
          onMouseEnter={() => setHoverRating(starIndex)}
          onClick={() => handleSelectRating(starIndex)}
          title={`${starIndex} Stars`}
        />

        {isFull ? (
          <Star className="w-9 h-9 sm:w-10 sm:h-10 text-[#ff5500] fill-[#ff5500]" />
        ) : isHalf ? (
          <div className="relative">
            <Star className="w-9 h-9 sm:w-10 sm:h-10 text-gray-300 fill-gray-100" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-9 h-9 sm:w-10 sm:h-10 text-[#ff5500] fill-[#ff5500]" />
            </div>
          </div>
        ) : (
          <Star className="w-9 h-9 sm:w-10 sm:h-10 text-gray-300 fill-gray-100" />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 bg-white text-black select-none overflow-y-auto">
      {/* Top Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between text-xs sm:text-sm text-gray-600 pt-2">
        <div className="flex items-center gap-3">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="flex items-center gap-1.5 text-black hover:bg-gray-100 px-3 py-1.5 rounded-xl font-bold border border-gray-200 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Store</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5500] animate-pulse" />
            <span className="font-bold text-black">
              {currentStage >= 2 && order.waiterName ? `Server: ${order.waiterName}` : 'Order Tracker'}
            </span>
          </div>
        </div>
        <div className="bg-gray-100 px-3 py-1 rounded-full text-black font-semibold border border-gray-200 text-xs">
          <span>Customer: </span>
          <strong>{order.customerName}</strong>
        </div>
      </div>

      {/* Center Stage: Circles & Dynamic Status */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-2xl py-6">
        {/* 4 Hovering Circles */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8 mb-10 max-w-full px-2">
          {circleStages.map((cfg, index) => {
            const isColored = currentStage >= cfg.id;
            const isCurrentActive = currentStage === cfg.id;

            return (
              <div key={cfg.id} className="flex flex-col items-center justify-center shrink-0">
                <div
                  className={`relative rounded-full transition-all duration-500 flex items-center justify-center animate-circle-hover-${index} ${
                    isColored
                      ? 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-[#ff5500] text-white border-2 border-[#ff5500] shadow-sm'
                      : 'w-10 h-10 sm:w-14 sm:h-14 md:w-18 md:h-18 bg-white border-2 border-gray-200 text-gray-400'
                  }`}
                >
                  {isCurrentActive && (
                    <span className="absolute inset-0 rounded-full border-2 border-[#ff5500] animate-ping opacity-30" />
                  )}
                  <span className="font-black text-sm sm:text-base md:text-lg">
                    {cfg.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Status Text */}
        <div className="text-center min-h-[140px] flex flex-col items-center justify-center px-4">
          <h2 className="text-2xl sm:text-4xl font-black text-black">
            {currentStage >= 4 && ratingReady ? 'Rate your server' : currentConfig.title}
          </h2>

          {/* Stage Specific Views */}
          {currentStage === 3 && (
            /* Stage 3: Preparing order (20s continuous hover, NO timer shown) */
            <p className="text-gray-600 text-sm sm:text-base mt-2 font-medium">
              Order is being prepared...
            </p>
          )}

          {currentStage === 4 && !ratingReady && (
            /* Stage 4: Order Incoming (20s countdown displayed) */
            <div className="flex flex-col items-center mt-3">
              <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 text-black px-4 py-1.5 rounded-full text-xs sm:text-sm font-black my-2">
                <span className="w-2 h-2 rounded-full bg-[#ff5500] animate-ping" />
                <span>{incomingCountdown}s</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                Drinks incoming! Please wait at your table ({incomingCountdown}s)...
              </p>
            </div>
          )}

          {currentStage >= 4 && ratingReady && (
            /* Rating View */
            <div className="flex flex-col items-center mt-3">
              <div
                ref={starsContainerRef}
                className="flex items-center gap-2 py-2 cursor-pointer touch-none"
                onPointerDown={(e) => handleStarInteraction(e.clientX, true)}
                onPointerMove={(e) => {
                  if (e.buttons === 1 || e.pointerType === 'touch') {
                    handleStarInteraction(e.clientX, true);
                  } else {
                    handleStarInteraction(e.clientX, false);
                  }
                }}
                onPointerLeave={() => setHoverRating(null)}
              >
                {[1, 2, 3, 4, 5].map((starIndex) => renderStar(starIndex))}
              </div>

              <div className="mt-2 text-xs sm:text-sm font-bold text-gray-700 min-h-[24px]">
                {rating !== null ? (
                  <span className="text-[#ff5500]">
                    Rated {rating} / 5 Stars • Thank you for rating {order.waiterName || 'your server'}!
                  </span>
                ) : (
                  <span className="text-gray-500">Tap stars to rate your server</span>
                )}
              </div>
            </div>
          )}

          {currentStage <= 2 && (
            /* Stages 1 & 2 descriptions */
            <p className="text-gray-600 text-sm sm:text-base mt-2 font-medium">
              {currentConfig.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer / Submit Rating Button */}
      <div className="w-full max-w-md pb-4">
        {ratingReady ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitRating}
            className="w-full bg-[#ff5500] hover:bg-[#e64d00] text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>{rating !== null ? 'Submit Rating & Order Now' : 'Done • Return to Order Now'}</span>
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-full border-2 border-[#ff5500] border-t-transparent animate-spin" />
            <span>
              {currentStage === 1
                ? 'Waiting for waiter to accept order...'
                : currentStage === 2
                ? 'Order accepted by waiter...'
                : currentStage === 3
                ? 'Preparing your order...'
                : 'Order incoming...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
