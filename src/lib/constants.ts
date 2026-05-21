export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/dining", label: "Dining" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const ROOMS = [
  {
    id: "royal-suite",
    title: "Royal Suite",
    tagline: "Where majesty meets the desert",
    description:
      "A sprawling 2,500 sq ft sanctuary with panoramic dune views, a private plunge pool, and butler service available around the clock.",
    price: 2500,
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200",
    ],
    amenities: [
      "Private plunge pool",
      "Panoramic dune views",
      "King-sized bed",
      "Marble bathroom",
      "Walk-in wardrobe",
      "24/7 butler service",
    ],
    size: "2,500 sq ft",
    capacity: "2 Adults + 2 Children",
  },
  {
    id: "desert-villa",
    title: "Desert Villa",
    tagline: "Your private oasis in the sands",
    description:
      "Standalone villa with a private garden, outdoor shower, and a dedicated chef to curate your dining experience under the stars.",
    price: 1800,
    images: [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
    ],
    amenities: [
      "Private garden",
      "Outdoor shower",
      "Dedicated chef",
      "Outdoor dining",
      "Fire pit",
      "Sun deck",
    ],
    size: "3,000 sq ft",
    capacity: "4 Adults + 2 Children",
  },
  {
    id: "oasis-room",
    title: "Oasis Room",
    tagline: "Serenity in the heart of luxury",
    description:
      "Elegantly appointed room with bespoke furnishings, a deep soaking tub, and a private terrace overlooking the lush courtyard gardens.",
    price: 800,
    images: [
      "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200",
    ],
    amenities: [
      "Courtyard view",
      "Deep soaking tub",
      "Private terrace",
      "Bespoke furnishings",
      "Mini bar",
      "Smart room controls",
    ],
    size: "650 sq ft",
    capacity: "2 Adults",
  },
  {
    id: "penthouse",
    title: "The Penthouse",
    tagline: "Crowning the desert skyline",
    description:
      "Perched at the top of the main building, this two-story penthouse features a rooftop infinity pool, a grand piano, and 360-degree desert views.",
    price: 3500,
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1200",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7c3ad6?w=1200",
    ],
    amenities: [
      "Rooftop infinity pool",
      "Grand piano",
      "360° desert views",
      "Private elevator",
      "Wine cellar",
      "Personal concierge",
    ],
    size: "4,000 sq ft",
    capacity: "6 Adults",
  },
] as const;

export const AMENITIES = [
  {
    title: "Infinity Pools",
    description: "Three temperature-controlled infinity pools overlooking the dunes",
    icon: "Droplets",
  },
  {
    title: "Spa & Wellness",
    description: "Traditional hammam, massage suites, and a state-of-the-art fitness center",
    icon: "Sparkles",
  },
  {
    title: "Fine Dining",
    description: "Three restaurants helmed by Michelin-starred chefs",
    icon: "UtensilsCrossed",
  },
  {
    title: "Desert Safari",
    description: "Guided dune bashing, camel trekking, and sunset champagne tours",
    icon: "Sun",
  },
  {
    title: "Private Beach",
    description: "Exclusive white-sand beach with cabana service",
    icon: "Umbrella",
  },
  {
    title: "Astronomy Deck",
    description: "State-of-the-art observatory for stargazing in the clear desert sky",
    icon: "Telescope",
  },
] as const;

export const DINING_ITEMS = [
  {
    id: "lobster",
    name: "Gold Leaf Lobster",
    description: "Charred Atlantic lobster with gold leaf, saffron beurre blanc",
    price: 85,
    category: "Signature",
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600",
  },
  {
    id: "wagyu",
    name: "A5 Wagyu Tasting",
    description: "Japanese A5 Kobe seared tableside with truffle jus",
    price: 120,
    category: "Signature",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600",
  },
  {
    id: "caviar",
    name: "Osetra Caviar Service",
    description: "Beluga caviar with blinis, crème fraîche, and chilled vodka",
    price: 150,
    category: "Starter",
    image: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=600",
  },
  {
    id: "tartare",
    name: "Tuna Tartare",
    description: "Yellowfin tuna with avocado mousse and sesame crisp",
    price: 45,
    category: "Starter",
    image: "https://images.unsplash.com/photo-1534256958595-7fe685e204a1?w=600",
  },
  {
    id: "risotto",
    name: "Black Truffle Risotto",
    description: "Carnaroli risotto with black truffle and aged parmesan",
    price: 65,
    category: "Main",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600",
  },
  {
    id: "lamb",
    name: "Rack of Lamb",
    description: "Herb-crusted lamb rack with roasted vegetables and jus",
    price: 75,
    category: "Main",
    image: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=600",
  },
  {
    id: "souffle",
    name: "Gold Soufflé",
    description: "Grand Marnier soufflé with gold dust and vanilla cream",
    price: 35,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=600",
  },
  {
    id: "cheese",
    name: "Artisan Cheese Board",
    description: "Selection of aged cheeses with honeycomb and nuts",
    price: 40,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1544470929-5f28bd209992?w=600",
  },
] as const;

export const TESTIMONIALS = [
  {
    name: "Victoria Chen",
    role: "Travel & Leisure",
    quote:
      "Oasis Royale redefines luxury. Every detail from the gold-leaf ceilings to the personal butler service whispers excellence.",
    rating: 5,
  },
  {
    name: "Marcus Adeyemi",
    role: "Conde Nast Traveler",
    quote:
      "An architectural marvel rising from the dunes. The Royal Suite alone is worth the journey across continents.",
    rating: 5,
  },
  {
    name: "Sophie Laurent",
    role: "Vogue Living",
    quote:
      "Where Arabian hospitality meets modern opulence. The spa experience is nothing short of transformative.",
    rating: 5,
  },
] as const;

export const GALLERY_IMAGES = [
  { src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800", title: "Royal Suite Living" },
  { src: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800", title: "Master Bedroom" },
  { src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800", title: "Marble Bathroom" },
  { src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800", title: "Desert Villa Exterior" },
  { src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", title: "Infinity Pool" },
  { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", title: "Penthouse Views" },
  { src: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800", title: "Signature Dining" },
  { src: "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800", title: "Gold Soufflé" },
] as const;
