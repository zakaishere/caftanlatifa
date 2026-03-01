export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  inStock: boolean;
  specs?: Record<string, string>;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
  date: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export const categories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', count: 120 },
  { id: '2', name: 'Home & Office', slug: 'home-office', count: 85 },
  { id: '3', name: 'Beauty & Health', slug: 'beauty', count: 45 },
  { id: '4', name: 'Fashion', slug: 'fashion', count: 230 },
  { id: '5', name: 'Toys & Games', slug: 'toys', count: 32 },
];

export const products: Product[] = [
  {
    id: '101',
    name: 'Pro Wireless Headphones',
    price: 450,
    category: 'Electronics',
    description: 'High-fidelity audio with active noise cancellation and 30-hour battery life.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    inStock: true,
    specs: { 'Battery': '30h', 'Connection': 'Bluetooth 5.2', 'Weight': '250g' }
  },
  {
    id: '102',
    name: 'Ergonomic Office Chair',
    price: 1200,
    category: 'Home & Office',
    description: 'Adjustable lumbar support and breathable mesh back for all-day comfort.',
    image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80',
    inStock: true,
    specs: { 'Material': 'Mesh/Steel', 'Max Load': '120kg', 'Warranty': '2 Years' }
  },
  {
    id: '103',
    name: 'Smart Fitness Watch',
    price: 350,
    category: 'Electronics',
    description: 'Track your heart rate, steps, and sleep with this water-resistant smartwatch.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    inStock: true,
    specs: { 'Waterproof': '5ATM', 'Sensors': 'HR, SpO2', 'Battery': '7 Days' }
  },
  {
    id: '104',
    name: 'Minimalist Desk Lamp',
    price: 180,
    category: 'Home & Office',
    description: 'Dimmable LED lamp with wireless charging base.',
    image: 'https://images.unsplash.com/photo-1534073828943-f801091a7d58?w=800&q=80',
    inStock: false,
    specs: { 'Power': '10W', 'Light': '3 Color Modes', 'Feature': 'Qi Charging' }
  },
  {
    id: '105',
    name: 'Organic Face Serum',
    price: 220,
    category: 'Beauty & Health',
    description: 'Vitamin C enriched serum for glowing and healthy skin.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
    inStock: true,
    specs: { 'Volume': '30ml', 'Skin Type': 'All', 'Ingredients': 'Organic' }
  },
  {
    id: '106',
    name: 'Mechanical Keyboard',
    price: 850,
    category: 'Electronics',
    description: 'Tactile switches with customizable RGB lighting and aluminum frame.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=800&q=80',
    inStock: true,
    specs: { 'Switches': 'Blue/Red', 'Layout': 'QWERTY', 'Material': 'Aluminum' }
  },
  {
    id: '107',
    name: 'Leather Weekend Bag',
    price: 990,
    category: 'Fashion',
    description: 'Premium full-grain leather bag perfect for short trips.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    inStock: true,
    specs: { 'Material': 'Leather', 'Size': '45L', 'Color': 'Brown' }
  },
  {
    id: '108',
    name: 'Ceramic Coffee Set',
    price: 280,
    category: 'Home & Office',
    description: 'Handcrafted ceramic mugs and pour-over dripper set.',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80',
    inStock: true,
    specs: { 'Pieces': '4 Mugs + Dripper', 'Material': 'Ceramic', 'Dishwasher Safe': 'Yes' }
  }
];

export const orders: Order[] = [
  {
    id: 'ORD-7782-XJ',
    customerName: 'Karim Benali',
    phone: '+212 661 23 45 67',
    city: 'Casablanca',
    total: 1350,
    status: 'Pending',
    date: '2023-10-25T10:30:00Z',
    items: [
      { name: 'Pro Wireless Headphones', quantity: 1, price: 450 },
      { name: 'Mechanical Keyboard', quantity: 1, price: 850 },
      { name: 'Shipping', quantity: 1, price: 50 }
    ]
  },
  {
    id: 'ORD-9921-MC',
    customerName: 'Sara Alami',
    phone: '+212 663 98 76 54',
    city: 'Rabat',
    total: 220,
    status: 'Confirmed',
    date: '2023-10-24T14:15:00Z',
    items: [
      { name: 'Organic Face Serum', quantity: 1, price: 220 }
    ]
  },
  {
    id: 'ORD-3345-KL',
    customerName: 'Youssef Tazi',
    phone: '+212 660 11 22 33',
    city: 'Marrakech',
    total: 1250,
    status: 'Delivered',
    date: '2023-10-20T09:00:00Z',
    items: [
      { name: 'Ergonomic Office Chair', quantity: 1, price: 1200 },
      { name: 'Shipping', quantity: 1, price: 50 }
    ]
  },
  {
    id: 'ORD-5562-OP',
    customerName: 'Amina El Fassi',
    phone: '+212 665 44 33 22',
    city: 'Tanger',
    total: 350,
    status: 'Cancelled',
    date: '2023-10-22T16:45:00Z',
    items: [
      { name: 'Smart Fitness Watch', quantity: 1, price: 350 }
    ]
  }
];

export const kpiStats = [
  { label: 'Total Revenue', value: '45,200 MAD', change: '+12%', trend: 'up' },
  { label: 'Total Orders', value: '1,240', change: '+5%', trend: 'up' },
  { label: 'Pending', value: '12', change: '-2%', trend: 'down' },
  { label: 'Out of Stock', value: '4', change: '0%', trend: 'neutral' },
];
