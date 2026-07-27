import { rupeesToPaise } from '@foodjet/shared';

export interface MenuSeedItem {
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
  imageUrl: string;
  category: string;
  isVegetarian: boolean;
  spiceLevel: number;
  preparationMinutes: number;
  rating: number;
  ratingCount: number;
}

/**
 * The starting catalogue. Kept in its own module so both the seed script and
 * the e2e fixtures can pull from one list instead of drifting apart.
 */
export const MENU_SEED: MenuSeedItem[] = [
  {
    slug: 'butter-chicken',
    name: 'Butter Chicken',
    description:
      'Creamy tomato-based curry with tender chicken pieces, infused with butter and aromatic spices',
    pricePaise: rupeesToPaise(320),
    imageUrl: '/images/butter-chicken.jpg',
    category: 'Main Course',
    isVegetarian: false,
    spiceLevel: 1,
    preparationMinutes: 25,
    rating: 4.8,
    ratingCount: 1284,
  },
  {
    slug: 'biryani',
    name: 'Biryani',
    description:
      'Fragrant basmati rice layered with spiced meat, saffron, and caramelized onions',
    pricePaise: rupeesToPaise(280),
    imageUrl: '/images/biryani.jpg',
    category: 'Main Course',
    isVegetarian: false,
    spiceLevel: 2,
    preparationMinutes: 35,
    rating: 4.9,
    ratingCount: 2140,
  },
  {
    slug: 'masala-dosa',
    name: 'Masala Dosa',
    description:
      'Crispy rice crepe filled with spiced potato filling, served with sambar and chutneys',
    pricePaise: rupeesToPaise(120),
    imageUrl: '/images/masala-dosa.jpg',
    category: 'South Indian',
    isVegetarian: true,
    spiceLevel: 1,
    preparationMinutes: 15,
    rating: 4.7,
    ratingCount: 968,
  },
  {
    slug: 'paneer-tikka',
    name: 'Paneer Tikka',
    description:
      'Marinated cottage cheese cubes grilled in tandoor with bell peppers and onions',
    pricePaise: rupeesToPaise(240),
    imageUrl: '/images/paneer-tikka.jpg',
    category: 'Starters',
    isVegetarian: true,
    spiceLevel: 2,
    preparationMinutes: 20,
    rating: 4.6,
    ratingCount: 754,
  },
  {
    slug: 'chole-bhature',
    name: 'Chole Bhature',
    description: 'Spicy chickpea curry served with deep-fried fluffy bread',
    pricePaise: rupeesToPaise(150),
    imageUrl: '/images/chole-bhature.jpg',
    category: 'North Indian',
    isVegetarian: true,
    spiceLevel: 2,
    preparationMinutes: 20,
    rating: 4.5,
    ratingCount: 612,
  },
  {
    slug: 'pav-bhaji',
    name: 'Pav Bhaji',
    description: 'Mashed vegetable curry served with buttered soft bread rolls',
    pricePaise: rupeesToPaise(130),
    imageUrl: '/images/pav-bhaji.jpg',
    category: 'Street Food',
    isVegetarian: true,
    spiceLevel: 2,
    preparationMinutes: 18,
    rating: 4.6,
    ratingCount: 883,
  },
  {
    slug: 'tandoori-chicken',
    name: 'Tandoori Chicken',
    description: 'Whole chicken marinated in yogurt and spices, roasted in a clay oven',
    pricePaise: rupeesToPaise(350),
    imageUrl: '/images/tandoori-chicken.jpg',
    category: 'Starters',
    isVegetarian: false,
    spiceLevel: 3,
    preparationMinutes: 30,
    rating: 4.8,
    ratingCount: 1520,
  },
  {
    slug: 'vada-pav',
    name: 'Vada Pav',
    description: 'Spiced potato fritter in a soft bun with green and tamarind chutneys',
    pricePaise: rupeesToPaise(50),
    imageUrl: '/images/vada-pav.jpg',
    category: 'Street Food',
    isVegetarian: true,
    spiceLevel: 2,
    preparationMinutes: 10,
    rating: 4.4,
    ratingCount: 1105,
  },
  {
    slug: 'palak-paneer',
    name: 'Palak Paneer',
    description: 'Cottage cheese cubes in a creamy pureed spinach gravy with garlic',
    pricePaise: rupeesToPaise(220),
    imageUrl: '/images/palak-paneer.jpg',
    category: 'Main Course',
    isVegetarian: true,
    spiceLevel: 1,
    preparationMinutes: 22,
    rating: 4.5,
    ratingCount: 497,
  },
  {
    slug: 'samosa',
    name: 'Samosa',
    description: 'Crispy triangular pastry filled with spiced potatoes and peas',
    pricePaise: rupeesToPaise(40),
    imageUrl: '/images/samosa.jpg',
    category: 'Street Food',
    isVegetarian: true,
    spiceLevel: 1,
    preparationMinutes: 12,
    rating: 4.7,
    ratingCount: 1876,
  },
];
