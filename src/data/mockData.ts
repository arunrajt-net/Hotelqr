import type { MenuItem, TableInfo, Order, OrderStatus } from '../types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dish-1',
    category_id: 'cat-2',
    categoryName: 'Mains',
    name: 'Truffle Mushroom Risotto',
    price: 24,
    description: 'Creamy Arborio rice slow-cooked with wild forest mushrooms, black truffle butter, and aged Parmigiano Reggiano crisp.',
    image_url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true,
    inStock: true,
    is_bestseller: true,
    rating: 4.9,
    reviewsCount: 142,
    calories: 580,
    prepTimeMinutes: 18,
    ingredients: ['Arborio Rice', 'Black Truffle', 'Wild Mushrooms', 'Parmesan', 'Shallots', 'White Wine'],
    customizations: [
      {
        name: 'Extra Toppings',
        options: [
          { label: 'Fresh Truffle Shavings', extraPrice: 6 },
          { label: 'Grilled Chicken Breast', extraPrice: 5 },
          { label: 'Extra Parmesan', extraPrice: 2 }
        ]
      }
    ]
  },
  {
    id: 'dish-2',
    category_id: 'cat-2',
    categoryName: 'Mains',
    name: 'Smoked Wagyu Smash Burger',
    price: 22,
    description: 'Double Wagyu beef patty, double sharp cheddar, caramelized balsamic onions, house smoky aioli on toasted brioche.',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    is_veg: false,
    is_available: true,
    inStock: true,
    is_bestseller: true,
    rating: 4.8,
    reviewsCount: 230,
    calories: 840,
    prepTimeMinutes: 14,
    ingredients: ['Wagyu Beef', 'Brioche Bun', 'Cheddar', 'Caramelized Onion', 'Smokey Sauce'],
    customizations: [
      {
        name: 'Bun Style',
        options: [
          { label: 'Brioche Bun', extraPrice: 0 },
          { label: 'Gluten-Free Bun', extraPrice: 3 },
          { label: 'Lettuce Wrap', extraPrice: 0 }
        ]
      },
      {
        name: 'Sides',
        options: [
          { label: 'Truffle Fries', extraPrice: 4 },
          { label: 'Sweet Potato Fries', extraPrice: 3 }
        ]
      }
    ]
  },
  {
    id: 'dish-3',
    category_id: 'cat-1',
    categoryName: 'Starters',
    name: 'Burrata & Heirloom Tomato Tartine',
    price: 16,
    description: 'Fresh Puglia burrata, organic heirloom tomatoes, aged balsamic reduction, basil oil on sourdough crust.',
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true,
    inStock: true,
    is_bestseller: false,
    rating: 4.7,
    reviewsCount: 98,
    calories: 420,
    prepTimeMinutes: 10,
    ingredients: ['Burrata Cheese', 'Heirloom Tomato', 'Sourdough', 'Balsamic Glaze', 'Fresh Basil']
  },
  {
    id: 'dish-4',
    category_id: 'cat-2',
    categoryName: 'Mains',
    name: 'Fiery Pan-Seared Salmon',
    price: 28,
    description: 'Crispy skin Norwegian salmon, sriracha glazed baby carrots, crushed purple potato puree, citrus velouté.',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    is_veg: false,
    spice_level: 'spicy',
    is_available: true,
    inStock: true,
    is_bestseller: false,
    rating: 4.9,
    reviewsCount: 88,
    calories: 610,
    prepTimeMinutes: 20,
    ingredients: ['Salmon Fillet', 'Citrus Veloute', 'Purple Potato', 'Baby Carrots', 'Sriracha']
  },
  {
    id: 'dish-5',
    category_id: 'cat-2',
    categoryName: 'Mains',
    name: 'Artisanal Wood-Fired Margherita',
    price: 19,
    description: 'San Marzano tomato base, Fior di Latte mozzarella, fresh sweet basil, cold-pressed Extra Virgin Olive Oil.',
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true,
    inStock: true,
    is_bestseller: true,
    rating: 4.8,
    reviewsCount: 310,
    calories: 720,
    prepTimeMinutes: 12,
    ingredients: ['San Marzano Tomatoes', 'Fior di Latte', 'EVOO', 'Fresh Basil']
  },
  {
    id: 'dish-6',
    category_id: 'cat-3',
    categoryName: 'Chef Specials',
    name: 'Charcoal Grilled Lamb Chops',
    price: 34,
    description: 'Grass-fed New Zealand lamb, rosemary garlic rub, mint chimichurri, roasted baby zucchini.',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    is_veg: false,
    spice_level: 'mild',
    is_available: true,
    inStock: true,
    is_bestseller: true,
    rating: 4.95,
    reviewsCount: 76,
    calories: 780,
    prepTimeMinutes: 22,
    ingredients: ['NZ Lamb Chops', 'Rosemary', 'Garlic', 'Mint Chimichurri', 'Zucchini']
  },
  {
    id: 'dish-7',
    category_id: 'cat-1',
    categoryName: 'Starters',
    name: 'Crispy Truffle Parmesan Fries',
    price: 11,
    description: 'Hand-cut Idaho potatoes tossed in white truffle oil, grated parmesan cheese, parsley, chive dip.',
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true,
    inStock: true,
    is_bestseller: true,
    rating: 4.85,
    reviewsCount: 190,
    calories: 450,
    prepTimeMinutes: 8,
    ingredients: ['Idaho Potatoes', 'White Truffle Oil', 'Parmesan', 'Fresh Parsley']
  },
  {
    id: 'dish-8',
    category_id: 'cat-4',
    categoryName: 'Beverages',
    name: 'Yuzu Dragonfruit Sparkler',
    price: 8,
    description: 'Fresh Japanese yuzu juice, red dragonfruit puree, sparkling mineral water, crushed mint leaves.',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true,
    inStock: true,
    is_bestseller: true,
    rating: 4.9,
    reviewsCount: 112,
    calories: 140,
    prepTimeMinutes: 4,
    ingredients: ['Yuzu Juice', 'Dragonfruit', 'Sparkling Water', 'Mint']
  },
  {
    id: 'dish-9',
    category_id: 'cat-4',
    categoryName: 'Beverages',
    name: 'Iced Smoked Vanilla Latte',
    price: 7,
    description: 'Double espresso shot, artisanal smoked Madagascar vanilla syrup, oat milk, cold foam topping.',
    image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true,
    inStock: true,
    is_bestseller: false,
    rating: 4.8,
    reviewsCount: 145,
    calories: 180,
    prepTimeMinutes: 5,
    ingredients: ['Espresso', 'Smoked Vanilla', 'Oat Milk', 'Cold Foam']
  },
  {
    id: 'dish-10',
    category_id: 'cat-5',
    categoryName: 'Desserts',
    name: 'Valrhona Chocolate Lava Dome',
    price: 14,
    description: 'Warm molten dark chocolate cake, Madagascar vanilla bean gelato, raspberry coulis drizzle.',
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true,
    inStock: true,
    is_bestseller: true,
    rating: 4.95,
    reviewsCount: 280,
    calories: 520,
    prepTimeMinutes: 12,
    ingredients: ['Valrhona 70% Dark Chocolate', 'Vanilla Gelato', 'Butter', 'Raspberry Coulis']
  },
  {
    id: 'dish-11',
    category_id: 'cat-5',
    categoryName: 'Desserts',
    name: 'Pistachio Milk Cake',
    price: 12,
    description: 'Ultra-light sponge cake soaked in saffron pistachio three-milk syrup, topped with cardamom chantilly cream.',
    image_url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80',
    is_veg: true,
    is_available: true,
    inStock: true,
    is_bestseller: false,
    rating: 4.75,
    reviewsCount: 94,
    calories: 460,
    prepTimeMinutes: 6,
    ingredients: ['Sponge Cake', 'Pistachio Milk', 'Saffron', 'Chantilly Cream']
  }
];

export const INITIAL_TABLES: TableInfo[] = Array.from({ length: 12 }, (_, i) => {
  const num = i + 1;
  const tableId = `T-${num < 10 ? '0' + num : num}`;
  return {
    id: tableId,
    table_number: num,
    capacity: num % 2 === 0 ? 4 : 2,
    qr_url: `${window.location.origin}/?table=${tableId}`,
    status: (i === 1 || i === 3 || i === 7) ? 'occupied' : 'available',
    active_order_id: i === 3 ? 'ORD-7821' : null
  };
});

const todayStart = new Date();
todayStart.setHours(0,0,0,0);
const startMs = todayStart.getTime();

export const INITIAL_ORDERS: Order[] = ([
  {
    id: 'ORD-1001',
    orderNumber: '1001',
    table_id: 'T-01',
    table_number: 1,
    customerName: 'Anoop Kumar',
    items: [
      { menu_item_id: 'dish-8', name: 'Yuzu Dragonfruit Sparkler', qty: 2, price: 8, is_veg: true },
      { menu_item_id: 'dish-9', name: 'Iced Smoked Vanilla Latte', qty: 1, price: 7, is_veg: true }
    ],
    subtotal: 23,
    discount: 0,
    tax: 1.84,
    total: 24.84,
    status: 'completed',
    created_at: startMs + 9.5 * 3600 * 1000, // 9:30 AM
    updated_at: startMs + 10 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 9.5 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 10 * 3600 * 1000 }]
  },
  {
    id: 'ORD-1002',
    orderNumber: '1002',
    table_id: 'T-05',
    table_number: 5,
    customerName: 'Deepa Nair',
    items: [
      { menu_item_id: 'dish-3', name: 'Burrata & Heirloom Tomato Tartine', qty: 1, price: 16, is_veg: true },
      { menu_item_id: 'dish-7', name: 'Crispy Truffle Parmesan Fries', qty: 1, price: 11, is_veg: true }
    ],
    subtotal: 27,
    discount: 5.4,
    tax: 1.728,
    total: 23.328,
    status: 'completed',
    created_at: startMs + 10.25 * 3600 * 1000, // 10:15 AM
    updated_at: startMs + 10.75 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 10.25 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 10.75 * 3600 * 1000 }],
    couponApplied: 'SAVOUR20'
  },
  {
    id: 'ORD-1003',
    orderNumber: '1003',
    table_id: 'T-02',
    table_number: 2,
    customerName: 'Rohan Sharma',
    items: [
      { menu_item_id: 'dish-2', name: 'Smoked Wagyu Smash Burger', qty: 2, price: 22, is_veg: false, options: [{ categoryName: 'Sides', optionLabel: 'Truffle Fries', extraPrice: 4 }] },
      { menu_item_id: 'dish-8', name: 'Yuzu Dragonfruit Sparkler', qty: 2, price: 8, is_veg: true }
    ],
    subtotal: 68,
    discount: 0,
    tax: 5.44,
    total: 73.44,
    status: 'completed',
    created_at: startMs + 11.5 * 3600 * 1000, // 11:30 AM
    updated_at: startMs + 12 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 11.5 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 12 * 3600 * 1000 }]
  },
  {
    id: 'ORD-1004',
    orderNumber: '1004',
    table_id: 'T-03',
    table_number: 3,
    customerName: 'Rahul Pillai',
    items: [
      { menu_item_id: 'dish-1', name: 'Truffle Mushroom Risotto', qty: 2, price: 24, is_veg: true },
      { menu_item_id: 'dish-5', name: 'Artisanal Wood-Fired Margherita', qty: 1, price: 19, is_veg: true }
    ],
    subtotal: 67,
    discount: 13.4,
    tax: 4.288,
    total: 57.888,
    status: 'completed',
    created_at: startMs + 12.2 * 3600 * 1000, // 12:12 PM
    updated_at: startMs + 12.8 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 12.2 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 12.8 * 3600 * 1000 }],
    couponApplied: 'SAVOUR20'
  },
  {
    id: 'ORD-1005',
    orderNumber: '1005',
    table_id: 'T-07',
    table_number: 7,
    customerName: 'Sneha George',
    items: [
      { menu_item_id: 'dish-6', name: 'Charcoal Grilled Lamb Chops', qty: 2, price: 34, is_veg: false },
      { menu_item_id: 'dish-10', name: 'Valrhona Chocolate Lava Dome', qty: 2, price: 14, is_veg: true }
    ],
    subtotal: 96,
    discount: 0,
    tax: 7.68,
    total: 103.68,
    status: 'completed',
    created_at: startMs + 13.1 * 3600 * 1000, // 1:06 PM
    updated_at: startMs + 13.7 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 13.1 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 13.7 * 3600 * 1000 }]
  },
  {
    id: 'ORD-1006',
    orderNumber: '1006',
    table_id: 'T-10',
    table_number: 10,
    customerName: 'Vikram Bose',
    items: [
      { menu_item_id: 'dish-2', name: 'Smoked Wagyu Smash Burger', qty: 3, price: 22, is_veg: false }
    ],
    subtotal: 66,
    discount: 10,
    tax: 4.48,
    total: 60.48,
    status: 'completed',
    created_at: startMs + 14.4 * 3600 * 1000, // 2:24 PM
    updated_at: startMs + 15 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 14.4 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 15 * 3600 * 1000 }],
    couponApplied: 'WELCOME10'
  },
  {
    id: 'ORD-1007',
    orderNumber: '1007',
    table_id: 'T-09',
    table_number: 9,
    customerName: 'Karthik Raja',
    items: [
      { menu_item_id: 'dish-11', name: 'Pistachio Milk Cake', qty: 2, price: 12, is_veg: true },
      { menu_item_id: 'dish-9', name: 'Iced Smoked Vanilla Latte', qty: 2, price: 7, is_veg: true }
    ],
    subtotal: 38,
    discount: 0,
    tax: 3.04,
    total: 41.04,
    status: 'completed',
    created_at: startMs + 15.6 * 3600 * 1000, // 3:36 PM
    updated_at: startMs + 16 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 15.6 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 16 * 3600 * 1000 }]
  },
  {
    id: 'ORD-1008',
    orderNumber: '1008',
    table_id: 'T-06',
    table_number: 6,
    customerName: 'Arjun Das',
    items: [
      { menu_item_id: 'dish-5', name: 'Artisanal Wood-Fired Margherita', qty: 2, price: 19, is_veg: true },
      { menu_item_id: 'dish-7', name: 'Crispy Truffle Parmesan Fries', qty: 1, price: 11, is_veg: true }
    ],
    subtotal: 49,
    discount: 9.8,
    tax: 3.136,
    total: 42.336,
    status: 'completed',
    created_at: startMs + 17.2 * 3600 * 1000, // 5:12 PM
    updated_at: startMs + 17.8 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 17.2 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 17.8 * 3600 * 1000 }],
    couponApplied: 'SAVOUR20'
  },
  {
    id: 'ORD-1009',
    orderNumber: '1009',
    table_id: 'T-12',
    table_number: 12,
    customerName: 'Meera Sen',
    items: [
      { menu_item_id: 'dish-1', name: 'Truffle Mushroom Risotto', qty: 2, price: 24, is_veg: true },
      { menu_item_id: 'dish-10', name: 'Valrhona Chocolate Lava Dome', qty: 2, price: 14, is_veg: true }
    ],
    subtotal: 76,
    discount: 0,
    tax: 6.08,
    total: 82.08,
    status: 'completed',
    created_at: startMs + 18.4 * 3600 * 1000, // 6:24 PM
    updated_at: startMs + 19 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 18.4 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 19 * 3600 * 1000 }]
  },
  {
    id: 'ORD-1010',
    orderNumber: '1010',
    table_id: 'T-04',
    table_number: 4,
    customerName: 'Sanjay Dutt',
    items: [
      { menu_item_id: 'dish-6', name: 'Charcoal Grilled Lamb Chops', qty: 2, price: 34, is_veg: false },
      { menu_item_id: 'dish-8', name: 'Yuzu Dragonfruit Sparkler', qty: 3, price: 8, is_veg: true }
    ],
    subtotal: 92,
    discount: 18.4,
    tax: 5.888,
    total: 79.488,
    status: 'completed',
    created_at: startMs + 19.8 * 3600 * 1000, // 7:48 PM
    updated_at: startMs + 20.4 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 19.8 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 20.4 * 3600 * 1000 }],
    couponApplied: 'SAVOUR20'
  },
  {
    id: 'ORD-1011',
    orderNumber: '1011',
    table_id: 'T-11',
    table_number: 11,
    customerName: 'Priya Mani',
    items: [
      { menu_item_id: 'dish-2', name: 'Smoked Wagyu Smash Burger', qty: 2, price: 22, is_veg: false },
      { menu_item_id: 'dish-10', name: 'Valrhona Chocolate Lava Dome', qty: 1, price: 14, is_veg: true }
    ],
    subtotal: 58,
    discount: 0,
    tax: 4.64,
    total: 62.64,
    status: 'completed',
    created_at: startMs + 20.5 * 3600 * 1000, // 8:30 PM
    updated_at: startMs + 21 * 3600 * 1000,
    status_history: [{ status: 'placed', changed_at: startMs + 20.5 * 3600 * 1000 }, { status: 'completed', changed_at: startMs + 21 * 3600 * 1000 }]
  },
  {
    id: 'ORD-7821',
    orderNumber: '7821',
    table_id: 'T-04',
    table_number: 4,
    customerName: 'Alex Rivera',
    items: [
      { menu_item_id: 'dish-1', name: 'Truffle Mushroom Risotto', qty: 1, price: 24, is_veg: true, options: [{ categoryName: 'Extra Toppings', optionLabel: 'Fresh Truffle Shavings', extraPrice: 6 }] },
      { menu_item_id: 'dish-8', name: 'Yuzu Dragonfruit Sparkler', qty: 2, price: 8, is_veg: true }
    ],
    subtotal: 44,
    discount: 8.8,
    tax: 3.52,
    tip: 5,
    total: 43.72,
    status: 'completed',
    created_at: Date.now() - 1000 * 60 * 7,
    updated_at: Date.now() - 1000 * 60 * 2,
    status_history: [
      { status: 'placed', changed_at: Date.now() - 1000 * 60 * 7 },
      { status: 'accepted', changed_at: Date.now() - 1000 * 60 * 5 },
      { status: 'preparing', changed_at: Date.now() - 1000 * 60 * 2 },
      { status: 'completed', changed_at: Date.now() - 1000 * 60 * 1 }
    ],
    specialInstructions: 'Make risotto extra creamy please! No garlic in sparkler.',
    couponApplied: 'SAVOUR20'
  },
  {
    id: 'ORD-7822',
    orderNumber: '7822',
    table_id: 'T-02',
    table_number: 2,
    customerName: 'Maya Lin',
    items: [
      { menu_item_id: 'dish-2', name: 'Smoked Wagyu Smash Burger', qty: 2, price: 22, is_veg: false, options: [{ categoryName: 'Sides', optionLabel: 'Truffle Fries', extraPrice: 4 }] },
      { menu_item_id: 'dish-9', name: 'Iced Smoked Vanilla Latte', qty: 1, price: 7, is_veg: true }
    ],
    subtotal: 55,
    discount: 0,
    tax: 4.4,
    tip: 6,
    total: 65.4,
    status: 'completed',
    created_at: Date.now() - 1000 * 60 * 3,
    updated_at: Date.now() - 1000 * 60 * 3,
    status_history: [
      { status: 'placed', changed_at: Date.now() - 1000 * 60 * 3 },
      { status: 'completed', changed_at: Date.now() - 1000 * 60 * 1 }
    ],
    specialInstructions: 'Medium well burgers.'
  }
]).map((o) => ({
  ...o,
  isMock: true,
  status: o.status as OrderStatus,
  status_history: o.status_history.map((sh) => ({ ...sh, status: sh.status as OrderStatus }))
}));

