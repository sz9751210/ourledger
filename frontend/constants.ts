import { Category, Ledger, User } from './types';

export const USERS: Record<string, User> = {
  'u1': { id: 'u1', name: 'Alex', avatar: 'https://picsum.photos/100/100', color: 'bg-softblue-500' },
  'u2': { id: 'u2', name: 'Sam', avatar: 'https://picsum.photos/101/101', color: 'bg-clay-500' },
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'cat_Food', icon: 'Utensils', color: 'bg-orange-100 text-orange-600' },
  { id: 'c2', name: 'cat_Transport', icon: 'Bus', color: 'bg-blue-100 text-blue-600' },
  { id: 'c3', name: 'cat_Shopping', icon: 'ShoppingBag', color: 'bg-purple-100 text-purple-600' },
  { id: 'c4', name: 'cat_Entertainment', icon: 'Film', color: 'bg-pink-100 text-pink-600' },
  { id: 'c5', name: 'cat_Housing', icon: 'Home', color: 'bg-green-100 text-green-600' },
  { id: 'c6', name: 'cat_Other', icon: 'MoreHorizontal', color: 'bg-gray-100 text-gray-600' },
];

export const AVAILABLE_ICONS = [
  // Food & Drink
  'Utensils', 'Coffee', 'Beer', 'Pizza', 'Wine', 'IceCream', 'Croissant', 'Sandwich', 'GlassWater',
  // Transport
  'Bus', 'Car', 'Plane', 'Fuel', 'Bike', 'Train', 'Ship', 'ParkingCircle', 'MapPin',
  // Shopping
  'ShoppingBag', 'ShoppingCart', 'Gift', 'Shirt', 'Watch', 'Smartphone', 'Laptop', 'Headphones', 'Tag', 'CreditCard',
  // Entertainment
  'Film', 'Music', 'Ticket', 'Gamepad2', 'Dumbbell', 'PartyPopper', 'Tv', 'Camera', 'Tent',
  // Home & Utilities
  'Home', 'Wifi', 'Zap', 'Droplet', 'Hammer', 'Wrench', 'Trash2', 'Sofa', 'Bed', 'Bath',
  // Health & Family
  'Dog', 'Cat', 'Baby', 'Stethoscope', 'Pill', 'Heart', 'FirstAid',
  // Misc
  'Briefcase', 'Book', 'GraduationCap', 'Landmark', 'PiggyBank', 'DollarSign',
  'Sun', 'Moon', 'Umbrella', 'Mountain', 'Flower2', 'Scissors', 'Paperclip',
  'MoreHorizontal'
];

export const AVAILABLE_COLORS = [
  'bg-stone-100 text-stone-600',
  'bg-red-100 text-red-600',
  'bg-orange-100 text-orange-600',
  'bg-amber-100 text-amber-600',
  'bg-yellow-100 text-yellow-600',
  'bg-lime-100 text-lime-600',
  'bg-green-100 text-green-600',
  'bg-emerald-100 text-emerald-600',
  'bg-teal-100 text-teal-600',
  'bg-cyan-100 text-cyan-600',
  'bg-sky-100 text-sky-600',
  'bg-blue-100 text-blue-600',
  'bg-indigo-100 text-indigo-600',
  'bg-violet-100 text-violet-600',
  'bg-purple-100 text-purple-600',
  'bg-fuchsia-100 text-fuchsia-600',
  'bg-pink-100 text-pink-600',
  'bg-rose-100 text-rose-600',
];

export const MOCK_LEDGERS: Ledger[] = [
  { id: 'l1', name: 'Daily Living', type: 'daily', members: ['u1', 'u2'] },
  { id: 'l2', name: 'Japan Trip 🇯🇵', type: 'trip', members: ['u1', 'u2'] },
  { id: 'l3', name: 'Furniture Fund', type: 'trip', members: ['u1', 'u2'] },
];