import { InventoryItem } from '../types';
import { PRODUCTS } from './products';

// Default buy margin calculation: ~65-70% of retail price, rounded cleanly
const getEstimatedBuyPrice = (price: number): number => {
  if (price <= 150) return Math.round((price * 0.65) / 5) * 5;
  if (price <= 500) return Math.round((price * 0.7) / 10) * 10;
  return Math.round((price * 0.7) / 50) * 50;
};

// Initial inventory data covering all specific bottles from the customer menu
// Daily sold counters start from 0 each day
export const INITIAL_INVENTORY: InventoryItem[] = PRODUCTS.map((product) => {
  let remaining = 12;

  // Initial stock levels
  switch (product.id) {
    case 'kenya-cane':
      remaining = 0; // 0 (OUT)
      break;
    case 'stoney-tangawizi':
      remaining = 0; // 0 (OUT)
      break;
    case 'gilbeys-gin':
      remaining = 1; // 1 ⚠️
      break;
    case 'captain-morgan':
      remaining = 6;
      break;
    case 'tusker-lager':
      remaining = 18;
      break;
    case 'smirnoff-vodka':
      remaining = 8;
      break;
    case 'coca-cola-original':
      remaining = 24;
      break;
    case 'red-bull':
      remaining = 15;
      break;
    case 'fourth-street-wine':
      remaining = 10;
      break;
    case 'jameson-whiskey':
      remaining = 7;
      break;
    default:
      remaining = Math.floor((product.name.length * 5) % 15) + 6;
      break;
  }

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    volume: product.volume,
    sold: 0, // Starts at 0 for the day
    remaining,
    buyPrice: getEstimatedBuyPrice(product.price),
    sellPrice: product.price,
  };
});
