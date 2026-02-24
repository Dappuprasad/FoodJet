import { v4 as uuidv4 } from 'uuid';

// 40 most popular Indian foods with high-quality Unsplash images
const menuItems = [
  { id: 1, name: 'Butter Chicken', description: 'Creamy tomato-based curry with tender chicken pieces, infused with butter and aromatic spices', price: 320, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 2, name: 'Biryani', description: 'Fragrant basmati rice layered with spiced meat, saffron, and caramelized onions', price: 280, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 3, name: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potato filling, served with sambar and chutneys', price: 120, image: 'https://images.unsplash.com/photo-1668236543090-82eb5eade89a?w=400&h=300&fit=crop', category: 'South Indian' },
  { id: 4, name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled in tandoor with bell peppers and onions', price: 240, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop', category: 'Starters' },
  { id: 5, name: 'Chole Bhature', description: 'Spicy chickpea curry served with deep-fried fluffy bread', price: 150, image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400&h=300&fit=crop', category: 'North Indian' },
  { id: 6, name: 'Pav Bhaji', description: 'Mashed vegetable curry served with buttered soft bread rolls', price: 130, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400&h=300&fit=crop', category: 'Street Food' },
  { id: 7, name: 'Tandoori Chicken', description: 'Whole chicken marinated in yogurt and spices, roasted in clay oven', price: 350, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop', category: 'Starters' },
  { id: 8, name: 'Vada Pav', description: 'Spiced potato fritter in a soft bun with green and tamarind chutneys', price: 50, image: 'https://images.unsplash.com/photo-1606755456206-b25206cde27e?w=400&h=300&fit=crop', category: 'Street Food' },
  { id: 9, name: 'Palak Paneer', description: 'Cottage cheese cubes in a creamy pureed spinach gravy with garlic', price: 220, image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 10, name: 'Samosa', description: 'Crispy triangular pastry filled with spiced potatoes and peas', price: 40, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop', category: 'Street Food' },
  { id: 11, name: 'Dal Makhani', description: 'Creamy black lentils slow-cooked overnight with butter and cream', price: 200, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 12, name: 'Chicken Tikka Masala', description: 'Grilled chicken chunks in a rich, spiced tomato-cream sauce', price: 300, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 13, name: 'Gulab Jamun', description: 'Soft milk-solid dumplings soaked in rose-flavored sugar syrup', price: 100, image: 'https://images.unsplash.com/photo-1666190077189-2a65f823e1ab?w=400&h=300&fit=crop', category: 'Desserts' },
  { id: 14, name: 'Aloo Gobi', description: 'Dry-style cauliflower and potato curry with turmeric and cumin', price: 160, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 15, name: 'Naan', description: 'Soft leavened bread baked in tandoor, brushed with butter', price: 40, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&q=80', category: 'Breads' },
  { id: 16, name: 'Pani Puri', description: 'Hollow crispy puris filled with spiced water, tamarind, and chickpeas', price: 60, image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400&h=300&fit=crop', category: 'Street Food' },
  { id: 17, name: 'Mutton Rogan Josh', description: 'Aromatic slow-cooked mutton curry from Kashmir with whole spices', price: 380, image: 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 18, name: 'Idli Sambar', description: 'Steamed rice cakes served with lentil soup and coconut chutney', price: 80, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop', category: 'South Indian' },
  { id: 19, name: 'Rajma Chawal', description: 'Red kidney bean curry served over steamed basmati rice', price: 150, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=80', category: 'North Indian' },
  { id: 20, name: 'Fish Curry', description: 'Tangy and spicy coastal-style fish curry with coconut and tamarind', price: 260, image: 'https://images.unsplash.com/photo-1626509653291-18d9a934b9db?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 21, name: 'Bhel Puri', description: 'Crunchy puffed rice tossed with vegetables, chutneys, and sev', price: 70, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400&h=300&fit=crop&q=80', category: 'Street Food' },
  { id: 22, name: 'Malai Kofta', description: 'Fried cottage cheese and potato balls in a creamy cashew gravy', price: 240, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 23, name: 'Dahi Vada', description: 'Soft lentil dumplings soaked in creamy yogurt with sweet and tangy chutneys', price: 90, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop&q=80', category: 'Street Food' },
  { id: 24, name: 'Chicken 65', description: 'Spicy deep-fried chicken bites from Hyderabad with curry leaves', price: 220, image: 'https://images.unsplash.com/photo-1610057099443-fde6c99db9e1?w=400&h=300&fit=crop', category: 'Starters' },
  { id: 25, name: 'Uttapam', description: 'Thick rice pancake topped with onions, tomatoes, and green chilies', price: 100, image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop', category: 'South Indian' },
  { id: 26, name: 'Jalebi', description: 'Crispy spiral-shaped deep-fried sweet soaked in saffron sugar syrup', price: 80, image: 'https://images.unsplash.com/photo-1666190077189-2a65f823e1ab?w=400&h=300&fit=crop&q=80', category: 'Desserts' },
  { id: 27, name: 'Keema Pav', description: 'Spiced minced meat curry served with buttered bread rolls', price: 180, image: 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&h=300&fit=crop&q=80', category: 'Street Food' },
  { id: 28, name: 'Hyderabadi Dum Biryani', description: 'Slow-cooked layered rice and meat sealed with dough, Hyderabad style', price: 320, image: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400&h=300&fit=crop', category: 'Main Course' },
  { id: 29, name: 'Rasmalai', description: 'Soft paneer discs in cardamom-flavored sweet milk garnished with pistachios', price: 120, image: 'https://images.unsplash.com/photo-1571006917203-3d5613b76c40?w=400&h=300&fit=crop', category: 'Desserts' },
  { id: 30, name: 'Paratha', description: 'Flaky layered whole wheat flatbread stuffed with aloo or paneer', price: 60, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&q=70', category: 'Breads' },
  { id: 31, name: 'Prawn Masala', description: 'Juicy prawns cooked in a spiced tomato and onion gravy', price: 340, image: 'https://images.unsplash.com/photo-1626509653291-18d9a934b9db?w=400&h=300&fit=crop&q=80', category: 'Main Course' },
  { id: 32, name: 'Mysore Pak', description: 'Rich and melt-in-mouth sweet made from gram flour, ghee, and sugar', price: 110, image: 'https://images.unsplash.com/photo-1571006917203-3d5613b76c40?w=400&h=300&fit=crop&q=80', category: 'Desserts' },
  { id: 33, name: 'Poha', description: 'Flattened rice tempered with mustard seeds, onions, and turmeric', price: 60, image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop&q=80', category: 'Breakfast' },
  { id: 34, name: 'Medu Vada', description: 'Crispy on the outside, soft lentil doughnuts served with sambar and chutney', price: 70, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop&q=80', category: 'South Indian' },
  { id: 35, name: 'Paneer Butter Masala', description: 'Cottage cheese in a velvety tomato-butter sauce with kasuri methi', price: 250, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop&q=80', category: 'Main Course' },
  { id: 36, name: 'Kathi Roll', description: 'Flaky paratha wrapped around spiced grilled chicken or paneer filling', price: 140, image: 'https://images.unsplash.com/photo-1606755456206-b25206cde27e?w=400&h=300&fit=crop&q=80', category: 'Street Food' },
  { id: 37, name: 'Rava Dosa', description: 'Thin crispy semolina crepe with onions, served with chutneys', price: 110, image: 'https://images.unsplash.com/photo-1668236543090-82eb5eade89a?w=400&h=300&fit=crop&q=80', category: 'South Indian' },
  { id: 38, name: 'Mango Lassi', description: 'Refreshing yogurt-based mango smoothie with a hint of cardamom', price: 90, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&h=300&fit=crop', category: 'Beverages' },
  { id: 39, name: 'Kulfi', description: 'Traditional dense Indian ice cream in malai and pistachio flavors', price: 80, image: 'https://images.unsplash.com/photo-1571006917203-3d5613b76c40?w=400&h=300&fit=crop&q=70', category: 'Desserts' },
  { id: 40, name: 'Thali', description: 'Complete Indian meal platter with dal, sabzi, rice, roti, raita, and dessert', price: 250, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&q=80', category: 'Main Course' },
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

  // Simulate real-time status progression
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
        const delay = 8000 + Math.random() * 7000; // 8-15 seconds
        setTimeout(progressStatus, delay);
      }
    }
  };

  // First transition after 5-10 seconds
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
