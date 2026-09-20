import sauvageImg from "@/assets/watch-sauvage.jpg";
import vampireImg from "@/assets/watch-vampire.jpg";
import classicImg from "@/assets/watch-classic.jpg";
import oceanImg from "@/assets/watch-ocean.jpg";
import roseImg from "@/assets/watch-rose.jpg";
import oudImg from "@/assets/watch-oud.jpg";

export interface ProductVariant {
  size: string;
  price: number;
  bestFor: string;
}

export interface FragranceNotes {
  top: string[];
  middle: string[];
  base: string[];
}

export interface FragranceDetails {
  type: string;
  notes: FragranceNotes;
  longevity: string;
  sillage: string;
  bestTime: string;
}

export interface Review {
  name: string;
  rating: number;
  comment: string;
  verified: boolean;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  description: string;
  badge?: string;
  tagline: string;
  story: string;
  variants: ProductVariant[];
  fragranceDetails: FragranceDetails;
  reviews: Review[];
}

export const products: Product[] = [
  {
    id: "sauvage-elixir",
    name: "Sauvage Elixir",
    brand: "Dior",
    price: 165,
    originalPrice: 195,
    rating: 4.8,
    reviewCount: 2340,
    image: sauvageImg,
    category: "Men",
    description: "A powerful, noble fragrance with concentrated notes of cardamom, sandalwood, and amber.",
    badge: "Bestseller",
    tagline: "Untamed. Refined. Absolutely Magnetic.",
    story: "Born from the raw beauty of the wild desert at dusk, Sauvage Elixir captures the magnetic energy of a man who walks his own path. This concentrated elixir wraps you in waves of warm cardamom and rich sandalwood, anchored by deep amber that lingers like an unforgettable memory. Crafted for the modern gentleman who commands attention without raising his voice — this is confidence, bottled.",
    variants: [
      { size: "5 ml", price: 35, bestFor: "Trial size" },
      { size: "15 ml", price: 85, bestFor: "Travel companion" },
      { size: "30 ml", price: 125, bestFor: "Regular use" },
      { size: "50 ml", price: 165, bestFor: "Best value" },
    ],
    fragranceDetails: {
      type: "Woody Aromatic",
      notes: {
        top: ["Grapefruit", "Cinnamon", "Nutmeg"],
        middle: ["Cardamom", "Lavender", "Licorice"],
        base: ["Sandalwood", "Amber", "Haitian Vetiver"],
      },
      longevity: "12+ hours",
      sillage: "Strong",
      bestTime: "Evening & Night",
    },
    reviews: [
      { name: "James R.", rating: 5, comment: "Absolutely magnetic. I get compliments every single time I wear this.", verified: true, date: "2 weeks ago" },
      { name: "Michael T.", rating: 5, comment: "The longevity is insane — still going strong after 14 hours.", verified: true, date: "1 month ago" },
      { name: "David K.", rating: 4, comment: "Beautiful scent but quite strong. A little goes a very long way.", verified: true, date: "2 months ago" },
    ],
  },
  {
    id: "vampire-blood",
    name: "Vampire Blood",
    brand: "Arch Apothecary",
    price: 120,
    rating: 4.6,
    reviewCount: 890,
    image: vampireImg,
    category: "Unisex",
    description: "Dark, seductive, and mysterious. A bold blend of oud, black rose, and incense for the fearless.",
    badge: "Trending",
    tagline: "Embrace the Darkness Within.",
    story: "For those who find beauty in shadows and elegance in the unconventional, Vampire Blood is a dark love letter to the night. Black rose unfolds against smoky oud and sacred incense, creating an intoxicating aura that's equal parts dangerous and divine. This is not a fragrance for the faint-hearted — it's an invitation to embrace your most enigmatic self.",
    variants: [
      { size: "5 ml", price: 28, bestFor: "Trial size" },
      { size: "15 ml", price: 65, bestFor: "Travel companion" },
      { size: "30 ml", price: 95, bestFor: "Regular use" },
      { size: "50 ml", price: 120, bestFor: "Best value" },
    ],
    fragranceDetails: {
      type: "Oriental Gothic",
      notes: {
        top: ["Blood Orange", "Saffron", "Black Pepper"],
        middle: ["Black Rose", "Incense", "Dark Plum"],
        base: ["Luxury", "Leather", "Smoky Amber"],
      },
      longevity: "10+ hours",
      sillage: "Moderate to Strong",
      bestTime: "Night",
    },
    reviews: [
      { name: "Luna M.", rating: 5, comment: "Unlike anything I've ever smelled. Dark, mysterious, and absolutely addictive.", verified: true, date: "1 week ago" },
      { name: "Alex C.", rating: 4, comment: "Very unique and bold. Not for everyday, but perfect for special nights.", verified: true, date: "3 weeks ago" },
      { name: "Raven S.", rating: 5, comment: "The oud and rose combination is pure art. My signature scent now.", verified: true, date: "1 month ago" },
    ],
  },
  {
    id: "no5-leau",
    name: "N°5 L'Eau",
    brand: "Chanel",
    price: 142,
    rating: 4.9,
    reviewCount: 5120,
    image: classicImg,
    category: "Women",
    description: "The iconic floral aldehyde, reimagined with lemon, mandarin, and a modern freshness.",
    tagline: "Timeless Elegance, Reimagined.",
    story: "A modern interpretation of the world's most famous fragrance, N°5 L'Eau captures the spirit of today's woman — effortlessly chic, fiercely independent, and timelessly beautiful. The bright burst of lemon and mandarin gives way to a heart of ylang-ylang and May rose, settling into a clean, powdery finish. It's the scent of a woman who needs no introduction.",
    variants: [
      { size: "5 ml", price: 32, bestFor: "Trial size" },
      { size: "15 ml", price: 75, bestFor: "Travel companion" },
      { size: "30 ml", price: 110, bestFor: "Regular use" },
      { size: "50 ml", price: 142, bestFor: "Best value" },
    ],
    fragranceDetails: {
      type: "Floral Aldehyde",
      notes: {
        top: ["Lemon", "Mandarin Orange", "Aldehydes"],
        middle: ["Ylang-Ylang", "May Rose", "Jasmine"],
        base: ["White Musk", "Cedar", "Vetiver"],
      },
      longevity: "8–10 hours",
      sillage: "Moderate",
      bestTime: "All-season",
    },
    reviews: [
      { name: "Sophie L.", rating: 5, comment: "Pure elegance in a bottle. Modern yet timeless.", verified: true, date: "4 days ago" },
      { name: "Catherine D.", rating: 5, comment: "My mother wore the original, and I wear this. Some things transcend generations.", verified: true, date: "2 weeks ago" },
      { name: "Emma W.", rating: 5, comment: "Fresh, clean, sophisticated. Perfect for every occasion.", verified: true, date: "1 month ago" },
    ],
  },
  {
    id: "acqua-di-gio",
    name: "Acqua di Giò",
    brand: "Giorgio Armani",
    price: 98,
    originalPrice: 120,
    rating: 4.7,
    reviewCount: 3200,
    image: oceanImg,
    category: "Men",
    description: "A fresh aquatic scent inspired by the Mediterranean sea, with notes of marine accord and citrus.",
    tagline: "The Spirit of the Sea.",
    story: "Inspired by sun-drenched days on the Mediterranean coast, Acqua di Giò is a celebration of the sea's infinite beauty. The initial burst of citrus and marine accord evokes the feeling of diving into crystalline waters, while warm musk and cedar provide a grounding, masculine dry-down. It's summer confidence, all year round.",
    variants: [
      { size: "5 ml", price: 22, bestFor: "Trial size" },
      { size: "15 ml", price: 52, bestFor: "Travel companion" },
      { size: "30 ml", price: 75, bestFor: "Regular use" },
      { size: "50 ml", price: 98, bestFor: "Best value" },
    ],
    fragranceDetails: {
      type: "Fresh Aquatic",
      notes: {
        top: ["Bergamot", "Neroli", "Green Tangerine"],
        middle: ["Marine Accord", "Rosemary", "Jasmine"],
        base: ["White Musk", "Cedar", "Amber"],
      },
      longevity: "6–8 hours",
      sillage: "Moderate",
      bestTime: "Day & Summer",
    },
    reviews: [
      { name: "Marco V.", rating: 5, comment: "The quintessential summer scent. Fresh, clean, and universally loved.", verified: true, date: "1 week ago" },
      { name: "Chris P.", rating: 4, comment: "A classic for a reason. Not the most unique, but always a safe choice.", verified: true, date: "3 weeks ago" },
      { name: "Ryan L.", rating: 5, comment: "I've worn this for 10 years and still get compliments. Timeless.", verified: true, date: "2 months ago" },
    ],
  },
  {
    id: "rose-eternelle",
    name: "Rose Éternelle",
    brand: "Maison Francis",
    price: 215,
    rating: 4.8,
    reviewCount: 1560,
    image: roseImg,
    category: "Women",
    description: "An opulent rose composition enhanced by peony, amber, and a whisper of white musk.",
    badge: "New",
    tagline: "A Rose That Never Fades.",
    story: "Rose Éternelle is an ode to the most romantic of flowers, elevated to new heights of opulence. Imagine a garden at golden hour, where voluptuous roses bloom alongside soft peony, kissed by warm amber and enveloped in a delicate cloud of white musk. This fragrance is for the woman who turns every room into a garden — effortlessly radiant, impossibly beautiful.",
    variants: [
      { size: "5 ml", price: 45, bestFor: "Trial size" },
      { size: "15 ml", price: 110, bestFor: "Travel companion" },
      { size: "30 ml", price: 170, bestFor: "Regular use" },
      { size: "50 ml", price: 215, bestFor: "Best value" },
    ],
    fragranceDetails: {
      type: "Floral Oriental",
      notes: {
        top: ["Pink Pepper", "Lychee", "Bergamot"],
        middle: ["Centifolia Rose", "Peony", "Magnolia"],
        base: ["Amber", "White Musk", "Cashmere Wood"],
      },
      longevity: "10+ hours",
      sillage: "Moderate to Strong",
      bestTime: "Evening & All-season",
    },
    reviews: [
      { name: "Isabelle F.", rating: 5, comment: "The most beautiful rose fragrance I've ever experienced. Pure luxury.", verified: true, date: "3 days ago" },
      { name: "Amara J.", rating: 5, comment: "This lasts forever on my skin. People stop me to ask what I'm wearing.", verified: true, date: "2 weeks ago" },
      { name: "Olivia H.", rating: 4, comment: "Gorgeous but very rich. Best for cooler months and special occasions.", verified: true, date: "1 month ago" },
    ],
  },
  {
    id: "oud-royal",
    name: "Oud Royal",
    brand: "Tom Ford",
    price: 295,
    rating: 4.9,
    reviewCount: 1870,
    image: oudImg,
    category: "Unisex",
    description: "Rare oud wood enveloped in spices, amber, and smoky incense. The ultimate luxury experience.",
    tagline: "The Crown Jewel of Fragrance.",
    story: "Oud Royal is the pinnacle of watch artistry — a majestic composition built around the rarest and most precious oud wood. Layers of exotic spices dance with sacred incense and rich amber, creating a scent that feels like wrapping yourself in liquid gold. Reserved for those who understand that true luxury whispers rather than shouts.",
    variants: [
      { size: "5 ml", price: 65, bestFor: "Trial size" },
      { size: "15 ml", price: 150, bestFor: "Travel companion" },
      { size: "30 ml", price: 230, bestFor: "Regular use" },
      { size: "50 ml", price: 295, bestFor: "Best value" },
    ],
    fragranceDetails: {
      type: "Woody Oriental",
      notes: {
        top: ["Saffron", "Cinnamon", "Cardamom"],
        middle: ["Rose Absolute", "Agarwood (Oud)", "Incense"],
        base: ["Amber", "Sandalwood", "Musk"],
      },
      longevity: "14+ hours",
      sillage: "Strong",
      bestTime: "Evening & Night",
    },
    reviews: [
      { name: "Sheikh A.", rating: 5, comment: "The finest oud fragrance money can buy. Worth every penny.", verified: true, date: "5 days ago" },
      { name: "Victoria R.", rating: 5, comment: "Sophistication in a bottle. This is what luxury smells like.", verified: true, date: "2 weeks ago" },
      { name: "Marcus W.", rating: 5, comment: "Beast mode longevity. Applied in the morning, still going at midnight.", verified: true, date: "1 month ago" },
    ],
  },
];

export const getProductById = (id: string) => products.find((p) => p.id === id);
export const getRelatedProducts = (id: string) => products.filter((p) => p.id !== id).slice(0, 4);
