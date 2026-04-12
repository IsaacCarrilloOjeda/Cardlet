export type Exercise =
  | { type: 'multipleChoice'; question: string; options: string[]; correctIndex: number }
  | { type: 'translate'; prompt: string; promptLang: 'en' | 'target'; answer: string; alternatives?: string[] }
  | { type: 'matchPairs'; pairs: [string, string][] }

export interface Lesson {
  id: string
  title: string
  icon: LessonIconType
  xpReward: number
  exercises: Exercise[]
}

export type LessonIconType =
  | 'greeting'
  | 'numbers'
  | 'colors'
  | 'family'
  | 'food'
  | 'travel'
  | 'conversation'
  | 'restaurant'
  | 'animals'
  | 'time'
  | 'weather'

export interface Unit {
  id: string
  title: string
  subtitle: string
  color: string
  darkColor: string
  locked?: boolean
  lessons: Lesson[]
}

export interface LanguageMeta {
  id: string
  name: string
  nativeName: string
  color: string
  darkColor: string
  description: string
  learners: string
  available: boolean
  units: Unit[]
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const mc = (
  question: string,
  options: string[],
  correctIndex: number,
): Extract<Exercise, { type: 'multipleChoice' }> => ({
  type: 'multipleChoice',
  question,
  options,
  correctIndex,
})

const tr = (
  prompt: string,
  promptLang: 'en' | 'target',
  answer: string,
  alternatives?: string[],
): Extract<Exercise, { type: 'translate' }> => ({
  type: 'translate',
  prompt,
  promptLang,
  answer,
  alternatives,
})

const mp = (
  pairs: [string, string][],
): Extract<Exercise, { type: 'matchPairs' }> => ({
  type: 'matchPairs',
  pairs,
})

// ─── answer checking ──────────────────────────────────────────────────────────
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function checkTranslateAnswer(
  userAnswer: string,
  correct: string,
  alternatives?: string[],
): boolean {
  const norm = normalizeAnswer(userAnswer)
  if (!norm) return false
  const all = [correct, ...(alternatives ?? [])].map(normalizeAnswer)
  return all.includes(norm)
}

// ─── Spanish data ─────────────────────────────────────────────────────────────
const esLessons: Lesson[] = [
  // Unit 1
  {
    id: 'es-greetings',
    title: 'Greetings',
    icon: 'greeting',
    xpReward: 10,
    exercises: [
      mc('How do you say "Hello" in Spanish?', ['Hola', 'Adiós', 'Gracias', 'Por favor'], 0),
      tr('Thank you', 'en', 'Gracias', ['gracias']),
      mc('What does "Buenos días" mean?', ['Good night', 'Good afternoon', 'Good morning', 'Goodbye'], 2),
      tr('Goodbye', 'en', 'Adiós', ['adios', 'adiós']),
      mp([['Hello', 'Hola'], ['Goodbye', 'Adiós'], ['Thank you', 'Gracias'], ['Please', 'Por favor']]),
    ],
  },
  {
    id: 'es-numbers',
    title: 'Numbers',
    icon: 'numbers',
    xpReward: 10,
    exercises: [
      mc('What does "uno" mean?', ['0', '1', '2', '3'], 1),
      tr('three', 'en', 'tres'),
      mc('How do you say "five"?', ['cuatro', 'cinco', 'seis', 'siete'], 1),
      mp([['one', 'uno'], ['two', 'dos'], ['eight', 'ocho'], ['ten', 'diez']]),
      tr('siete', 'target', 'seven'),
    ],
  },
  {
    id: 'es-colors',
    title: 'Colors',
    icon: 'colors',
    xpReward: 10,
    exercises: [
      mc('"rojo" means…', ['Blue', 'Green', 'Red', 'Yellow'], 2),
      tr('blue', 'en', 'azul'),
      mp([['red', 'rojo'], ['blue', 'azul'], ['green', 'verde'], ['yellow', 'amarillo']]),
      mc('"verde" means…', ['Purple', 'Orange', 'Green', 'Gray'], 2),
      tr('negro', 'target', 'black'),
    ],
  },
  // Unit 2
  {
    id: 'es-family',
    title: 'Family',
    icon: 'family',
    xpReward: 12,
    exercises: [
      mc('"madre" means…', ['Father', 'Sister', 'Mother', 'Brother'], 2),
      tr('father', 'en', 'padre'),
      mp([['mother', 'madre'], ['father', 'padre'], ['brother', 'hermano'], ['sister', 'hermana']]),
      mc('How do you say "grandmother"?', ['abuela', 'tía', 'prima', 'sobrina'], 0),
      tr('abuela', 'target', 'grandmother'),
    ],
  },
  {
    id: 'es-descriptions',
    title: 'Descriptions',
    icon: 'conversation',
    xpReward: 12,
    exercises: [
      mc('"alto" means…', ['Short', 'Fat', 'Tall', 'Thin'], 2),
      tr('young', 'en', 'joven'),
      mc('How do you say "beautiful"?', ['feo', 'alto', 'hermoso', 'viejo'], 2),
      mp([['tall', 'alto'], ['short', 'bajo'], ['old', 'viejo'], ['young', 'joven']]),
      tr('inteligente', 'target', 'intelligent', ['smart', 'clever']),
    ],
  },
  // Unit 3
  {
    id: 'es-food',
    title: 'Food',
    icon: 'food',
    xpReward: 15,
    exercises: [
      mc('"manzana" means…', ['Banana', 'Apple', 'Orange', 'Grape'], 1),
      tr('bread', 'en', 'pan'),
      mp([['apple', 'manzana'], ['bread', 'pan'], ['water', 'agua'], ['milk', 'leche']]),
      mc('How do you say "egg"?', ['huevo', 'pollo', 'carne', 'pescado'], 0),
      tr('arroz', 'target', 'rice'),
    ],
  },
  {
    id: 'es-restaurant',
    title: 'Restaurant',
    icon: 'restaurant',
    xpReward: 15,
    exercises: [
      mc('How do you ask for the menu?', ['La cuenta', 'El menú', 'La mesa', 'La propina'], 1),
      tr('the bill', 'en', 'la cuenta', ['cuenta']),
      mc('"Tengo hambre" means…', ['I am thirsty', 'I am full', 'I am hungry', 'I want dessert'], 2),
      mp([['I\'m hungry', 'Tengo hambre'], ['I\'m thirsty', 'Tengo sed'], ['the check', 'la cuenta'], ['delicious', 'delicioso']]),
      tr('camarero', 'target', 'waiter', ['server', 'waiter']),
    ],
  },
]

const esUnits: Unit[] = [
  {
    id: 'es-u1', title: 'Unit 1', subtitle: 'Basics & Greetings',
    color: '#58CC02', darkColor: '#46A302',
    lessons: esLessons.slice(0, 3),
  },
  {
    id: 'es-u2', title: 'Unit 2', subtitle: 'People & Family',
    color: '#1CB0F6', darkColor: '#0E8FCC',
    lessons: esLessons.slice(3, 5),
  },
  {
    id: 'es-u3', title: 'Unit 3', subtitle: 'Food & Dining',
    color: '#FF9600', darkColor: '#CC7800',
    lessons: esLessons.slice(5, 7),
  },
  {
    id: 'es-u4', title: 'Unit 4', subtitle: 'Travel & Places',
    color: '#CE82FF', darkColor: '#A366CC',
    locked: true,
    lessons: [],
  },
]

// ─── French data ──────────────────────────────────────────────────────────────
const frLessons: Lesson[] = [
  {
    id: 'fr-greetings',
    title: 'Greetings',
    icon: 'greeting',
    xpReward: 10,
    exercises: [
      mc('How do you say "Hello" in French?', ['Bonjour', 'Au revoir', 'Merci', 'S\'il vous plaît'], 0),
      tr('Thank you', 'en', 'Merci', ['merci']),
      mp([['Hello', 'Bonjour'], ['Goodbye', 'Au revoir'], ['Please', 'S\'il vous plaît'], ['Thank you', 'Merci']]),
      mc('"Bonsoir" means…', ['Good morning', 'Good evening', 'Goodbye', 'Thank you'], 1),
      tr('Excuse me', 'en', 'Excusez-moi', ['excusez-moi', 'excusez moi']),
    ],
  },
  {
    id: 'fr-numbers',
    title: 'Numbers',
    icon: 'numbers',
    xpReward: 10,
    exercises: [
      mc('What does "deux" mean?', ['1', '2', '3', '4'], 1),
      tr('ten', 'en', 'dix'),
      mp([['one', 'un'], ['three', 'trois'], ['five', 'cinq'], ['ten', 'dix']]),
      mc('How do you say "eight"?', ['sept', 'huit', 'neuf', 'six'], 1),
      tr('quatre', 'target', 'four'),
    ],
  },
  {
    id: 'fr-colors',
    title: 'Colors',
    icon: 'colors',
    xpReward: 10,
    exercises: [
      mc('"rouge" means…', ['Blue', 'Green', 'Red', 'Yellow'], 2),
      tr('blue', 'en', 'bleu', ['bleue']),
      mp([['red', 'rouge'], ['blue', 'bleu'], ['green', 'vert'], ['white', 'blanc']]),
      mc('"jaune" means…', ['Pink', 'Yellow', 'Orange', 'Purple'], 1),
      tr('noir', 'target', 'black'),
    ],
  },
  {
    id: 'fr-family',
    title: 'Family',
    icon: 'family',
    xpReward: 12,
    exercises: [
      mc('"mère" means…', ['Father', 'Grandmother', 'Mother', 'Sister'], 2),
      tr('father', 'en', 'père', ['pere']),
      mp([['mother', 'mère'], ['father', 'père'], ['brother', 'frère'], ['sister', 'sœur']]),
      tr('children', 'en', 'enfants'),
      mc('"grand-père" means…', ['Uncle', 'Grandfather', 'Cousin', 'Brother'], 1),
    ],
  },
  {
    id: 'fr-food',
    title: 'Food',
    icon: 'food',
    xpReward: 15,
    exercises: [
      mc('"pomme" means…', ['Banana', 'Pear', 'Apple', 'Grape'], 2),
      tr('bread', 'en', 'pain'),
      mp([['apple', 'pomme'], ['bread', 'pain'], ['water', 'eau'], ['milk', 'lait']]),
      tr('fromage', 'target', 'cheese'),
      mc('How do you say "I\'m hungry"?', ['J\'ai soif', 'J\'ai faim', 'J\'ai chaud', 'J\'ai froid'], 1),
    ],
  },
]

const frUnits: Unit[] = [
  {
    id: 'fr-u1', title: 'Unit 1', subtitle: 'Basics & Greetings',
    color: '#58CC02', darkColor: '#46A302',
    lessons: frLessons.slice(0, 3),
  },
  {
    id: 'fr-u2', title: 'Unit 2', subtitle: 'People & Family',
    color: '#1CB0F6', darkColor: '#0E8FCC',
    lessons: frLessons.slice(3, 5),
  },
  {
    id: 'fr-u3', title: 'Unit 3', subtitle: 'Food & Dining',
    color: '#FF9600', darkColor: '#CC7800',
    locked: true,
    lessons: [],
  },
]

// ─── All languages ─────────────────────────────────────────────────────────────
export const LANGUAGES: LanguageMeta[] = [
  {
    id: 'es', name: 'Spanish', nativeName: 'Español',
    color: '#FF4B4B', darkColor: '#CC3C3C',
    description: '2nd most spoken language worldwide',
    learners: '42M learners',
    available: true,
    units: esUnits,
  },
  {
    id: 'fr', name: 'French', nativeName: 'Français',
    color: '#1CB0F6', darkColor: '#0E8FCC',
    description: 'Spoken on 5 continents',
    learners: '19M learners',
    available: true,
    units: frUnits,
  },
  {
    id: 'de', name: 'German', nativeName: 'Deutsch',
    color: '#FFD900', darkColor: '#CCA600',
    description: 'Most spoken language in the EU',
    learners: '8M learners',
    available: false,
    units: [],
  },
  {
    id: 'ja', name: 'Japanese', nativeName: '日本語',
    color: '#FF9600', darkColor: '#CC7800',
    description: 'Key language of East Asia',
    learners: '13M learners',
    available: false,
    units: [],
  },
  {
    id: 'ko', name: 'Korean', nativeName: '한국어',
    color: '#CE82FF', darkColor: '#A366CC',
    description: 'Rising global influence',
    learners: '7M learners',
    available: false,
    units: [],
  },
  {
    id: 'zh', name: 'Mandarin', nativeName: '中文',
    color: '#FF4B4B', darkColor: '#CC3C3C',
    description: 'Most spoken language on Earth',
    learners: '5M learners',
    available: false,
    units: [],
  },
  {
    id: 'pt', name: 'Portuguese', nativeName: 'Português',
    color: '#58CC02', darkColor: '#46A302',
    description: 'Spoken across 4 continents',
    learners: '11M learners',
    available: false,
    units: [],
  },
  {
    id: 'it', name: 'Italian', nativeName: 'Italiano',
    color: '#58CC02', darkColor: '#46A302',
    description: 'Language of art and culture',
    learners: '6M learners',
    available: false,
    units: [],
  },
]
