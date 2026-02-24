import { v4 as uuidv4 } from 'uuid';

// 10 popular Indian foods with locally generated images
const menuItems = [
  {
    id: 1,
    name: 'Butter Chicken',
    description: 'Creamy tomato-based curry with tender chicken pieces, infused with butter and aromatic spices',
    price: 320,
    image: '/images/butter chicken.jpg',
    category: 'Main Course',
  },
  {
    id: 2,
    name: 'Biryani',
    description: 'Fragrant basmati rice layered with spiced meat, saffron, and caramelized onions',
    price: 280,
    image: '/images/biryani.jpg',
    category: 'Main Course',
  },
  {
    id: 3,
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato filling, served with sambar and chutneys',
    price: 120,
    image: '/images/masala dosa.jpg',
    category: 'South Indian',
  },
  {
    id: 4,
    name: 'Paneer Tikka',
    description: 'Marinated cottage cheese cubes grilled in tandoor with bell peppers and onions',
    price: 240,
    image: '/images/paneer tikka.jpg',
    category: 'Starters',
  },
  {
    id: 5,
    name: 'Chole Bhature',
    description: 'Spicy chickpea curry served with deep-fried fluffy bread',
    price: 150,
    image: '/images/chole bhature.jpg',
    category: 'North Indian',
  },
  {
    id: 6,
    name: 'Pav Bhaji',
    description: 'Mashed vegetable curry served with buttered soft bread rolls',
    price: 130,
    image: '/images/pav bhaji.jpg',
    category: 'Street Food',
  },
  {
    id: 7,
    name: 'Tandoori Chicken',
    description: 'Whole chicken marinated in yogurt and spices, roasted in clay oven',
    price: 350,
    image: '/images/tandoori chicken.jpg',
    category: 'Starters',
  },
  {
    id: 8,
    name: 'Vada Pav',
    description: 'Spiced potato fritter in a soft bun with green and tamarind chutneys',
    price: 50,
    image: '/images/vada pav.jpg',
    category: 'Street Food',
  },
  {
    id: 9,
    name: 'Palak Paneer',
    description: 'Cottage cheese cubes in a creamy pureed spinach gravy with garlic',
    price: 220,
    image: '/images/palak paneer.jpg',
    category: 'Main Course',
  },
  {
    id: 10,
    name: 'Samosa',
    description: 'Crispy triangular pastry filled with spiced potatoes and peas',
    price: 40,
    image: '/images/samosa.jpg',
    category: 'Street Food',
  },
];

// In-memory order store
const orders = new Map();

// Status progression
const STATUS_FLOW = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'];

function getMenu() {
  return menuItems;
}

function getMenuItemById(id) {
  return menuItems.find(item => item.id === id);
}

function createOrder(orderData) {
  const id = uuidv4();
  const order = {
    id,
    items: orderData.items,
    customer: {
      name: orderData.name,
      address: orderData.address,
      phone: orderData.phone,
    },
    status: STATUS_FLOW[0],
    statusIndex: 0,
    totalAmount: orderData.items.reduce((sum, item) => {
      const menuItem = getMenuItemById(item.id);
      return sum + (menuItem ? menuItem.price * item.quantity : 0);
    }, 0),
    createdAt: new Date().toISOString(),
  };

  orders.set(id, order);
  simulateStatusProgression(id);
  return order;
}

function simulateStatusProgression(orderId) {
  let currentIndex = 0;

  const progressStatus = () => {
    currentIndex++;
    if (currentIndex < STATUS_FLOW.length) {
      const order = orders.get(orderId);
      if (order) {
        order.status = STATUS_FLOW[currentIndex];
        order.statusIndex = currentIndex;
        orders.set(orderId, order);
      }
      if (currentIndex < STATUS_FLOW.length - 1) {
        const delay = 8000 + Math.random() * 7000;
        setTimeout(progressStatus, delay);
      }
    }
  };

  setTimeout(progressStatus, 5000 + Math.random() * 5000);
}

function getOrder(id) {
  return orders.get(id) || null;
}

function updateOrderStatus(id, status) {
  const order = orders.get(id);
  if (!order) return null;
  const statusIndex = STATUS_FLOW.indexOf(status);
  if (statusIndex === -1) return null;
  order.status = status;
  order.statusIndex = statusIndex;
  orders.set(id, order);
  return order;
}

function getAllOrders() {
  return Array.from(orders.values());
}

function clearOrders() {
  orders.clear();
}

export {
  menuItems,
  getMenu,
  getMenuItemById,
  createOrder,
  getOrder,
  updateOrderStatus,
  getAllOrders,
  clearOrders,
  STATUS_FLOW,
};
