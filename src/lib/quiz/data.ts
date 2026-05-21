import type { Quiz } from "./types"

export const quizzes: Quiz[] = [
  {
    id: "culinary-classics",
    title: "Culinary Classics",
    description: "Test your knowledge of fine dining, ingredients, and culinary techniques from around the world.",
    difficulty: "medium",
    questionCount: 8,
    timeLimitPerQuestion: 15,
    questions: [
      {
        id: "cc-1",
        question: "Which of these is considered the most expensive spice in the world by weight?",
        options: ["Saffron", "Vanilla", "Cardamom", "Cinnamon"],
        correctAnswer: 0,
        explanation: "Saffron, derived from the Crocus sativus flower, is the world's most expensive spice, often costing more than its weight in gold.",
      },
      {
        id: "cc-2",
        question: "What is the key ingredient in a classic Béarnaise sauce?",
        options: ["Tomatoes", "Egg yolks", "Cream", "Cheese"],
        correctAnswer: 1,
        explanation: "Béarnaise is an emulsion of egg yolks, clarified butter, and flavored with tarragon, chervil, and shallots.",
      },
      {
        id: "cc-3",
        question: "Which country is credited with originating the dish 'Sushi'?",
        options: ["China", "Korea", "Thailand", "Japan"],
        correctAnswer: 3,
        explanation: "While its origins trace back to Southeast Asia, modern sushi as we know it originated in Japan during the Edo period.",
      },
      {
        id: "cc-4",
        question: "What does 'al dente' literally translate to in Italian?",
        options: ["To the tooth", "Soft as silk", "Golden brown", "Perfectly cooked"],
        correctAnswer: 0,
        explanation: "Al dente means 'to the tooth' in Italian, describing pasta that is cooked to be firm when bitten.",
      },
      {
        id: "cc-5",
        question: "Which French term describes a bundle of herbs tied together for flavoring soups and stocks?",
        options: ["Mirepoix", "Bouquet Garni", "Fines Herbes", "Roux"],
        correctAnswer: 1,
        explanation: "A Bouquet Garni is a bundle of herbs (typically parsley, thyme, and bay leaf) tied together and used to flavor stocks, soups, and stews.",
      },
      {
        id: "cc-6",
        question: "What type of chocolate has the highest cocoa content?",
        options: ["Milk chocolate", "White chocolate", "Dark chocolate", "Ruby chocolate"],
        correctAnswer: 2,
        explanation: "Dark chocolate typically contains 50-90% cocoa solids, while milk chocolate contains 10-50% and white chocolate contains no cocoa solids at all.",
      },
      {
        id: "cc-7",
        question: "Which cooking method involves submerging food in hot fat at temperatures between 325-375°F?",
        options: ["Sautéing", "Deep frying", "Poaching", "Braising"],
        correctAnswer: 1,
        explanation: "Deep frying involves fully submerging food in hot oil, typically between 325-375°F (163-190°C).",
      },
      {
        id: "cc-8",
        question: "What is the traditional base of a classic Margherita pizza?",
        options: ["BBQ sauce", "Pesto", "Tomato sauce", "Olive oil"],
        correctAnswer: 2,
        explanation: "A classic Margherita pizza features tomato sauce, fresh mozzarella, basil, and olive oil on a thin crust.",
      },
    ],
  },
  {
    id: "wine-and-dine",
    title: "Wine & Dine",
    description: "From grape varieties to food pairings — challenge your wine expertise.",
    difficulty: "hard",
    questionCount: 6,
    timeLimitPerQuestion: 20,
    questions: [
      {
        id: "wd-1",
        question: "Which grape variety is used to make Champagne?",
        options: ["Chardonnay, Pinot Noir, and Pinot Meunier", "Cabernet Sauvignon and Merlot", "Sauvignon Blanc and Sémillon", "Syrah and Grenache"],
        correctAnswer: 0,
        explanation: "Champagne is made primarily from Chardonnay, Pinot Noir, and Pinot Meunier grapes in the Champagne region of France.",
      },
      {
        id: "wd-2",
        question: "What does 'terroir' refer to in winemaking?",
        options: ["The aging process", "The environmental factors affecting grapes", "The type of oak barrel used", "The alcohol content of wine"],
        correctAnswer: 1,
        explanation: "Terroir encompasses all environmental factors that affect a crop — including soil, climate, topography, and local traditions.",
      },
      {
        id: "wd-3",
        question: "Which wine is traditionally paired with oysters?",
        options: ["Bold Cabernet Sauvignon", "Dry Muscadet", "Rich Port", "Sweet Riesling"],
        correctAnswer: 1,
        explanation: "Dry, crisp white wines like Muscadet, Chablis, or Sauvignon Blanc are classic pairings with oysters due to their high acidity and mineral notes.",
      },
      {
        id: "wd-4",
        question: "What does 'Brut' mean on a bottle of Champagne?",
        options: ["Sweet", "Dry", "Sparkling", "Aged"],
        correctAnswer: 1,
        explanation: "Brut indicates a dry Champagne with less than 12 grams of residual sugar per liter.",
      },
      {
        id: "wd-5",
        question: "Which Italian red wine is known as the 'King of Wines and Wine of Kings'?",
        options: ["Chianti", "Barolo", "Brunello di Montalcino", "Amarone"],
        correctAnswer: 1,
        explanation: "Barolo, made from Nebbiolo grapes in Piedmont, Italy, earned this title for its powerful structure, complexity, and exceptional aging potential.",
      },
      {
        id: "wd-6",
        question: "What is the proper serving temperature for a full-bodied red wine?",
        options: ["45-50°F (7-10°C)", "55-60°F (13-16°C)", "60-68°F (15-20°C)", "35-40°F (2-4°C)"],
        correctAnswer: 2,
        explanation: "Full-bodied red wines are best served slightly below room temperature at 60-68°F (15-20°C) to allow their aromas and flavors to fully express.",
      },
    ],
  },
  {
    id: "desert-noir",
    title: "Desert Noir",
    description: "How well do you know Oasis Royale? Take our signature restaurant quiz.",
    difficulty: "easy",
    questionCount: 5,
    questions: [
      {
        id: "dn-1",
        question: "What does the name 'Oasis Royale' evoke in the dining experience?",
        options: ["A royal feast in a desert sanctuary", "A fast-food chain", "A coffee shop", "A food truck"],
        correctAnswer: 0,
        explanation: "Oasis Royale is designed as a cinematic desert noir dining experience — a luxurious sanctuary in the desert.",
      },
      {
        id: "dn-2",
        question: "Which color palette defines the Oasis Royale aesthetic?",
        options: ["Neon pink and green", "Dark tones with gold and teal accents", "Pastel blues and whites", "Bright yellow and orange"],
        correctAnswer: 1,
        explanation: "The Oasis Royale brand uses a sophisticated palette of deep dark tones (#050505) with gold (#D4AF37) and teal (#114B5F) accents.",
      },
      {
        id: "dn-3",
        question: "What is the signature font used for headings at Oasis Royale?",
        options: ["Times New Roman", "Comic Sans", "Lexend Tera", "Arial"],
        correctAnswer: 2,
        explanation: "Lexend Tera is used as the heading font, creating a bold and luxurious typographic presence.",
      },
      {
        id: "dn-4",
        question: "Which technology does Oasis Royale use for its 3D menu experience?",
        options: ["Flash", "Unity", "Google Model Viewer", "Blender Web"],
        correctAnswer: 2,
        explanation: "Oasis Royale uses Google's <model-viewer> web component to deliver immersive 3D and AR dining previews.",
      },
      {
        id: "dn-5",
        question: "What smooth scrolling library powers the Oasis Royale website?",
        options: ["ScrollMagic", "Lenis", "AOS", "SmoothScroll.js"],
        correctAnswer: 1,
        explanation: "Lenis provides the smooth, cinematic scrolling experience throughout the Oasis Royale website.",
      },
    ],
  },
]

export function getQuizById(id: string): Quiz | undefined {
  return quizzes.find((quiz) => quiz.id === id)
}

export function getAllQuizzes(): Quiz[] {
  return quizzes
}
