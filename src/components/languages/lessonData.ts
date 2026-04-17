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

export interface Achievement {
  id: string
  name: string
  desc: string
  icon: 'star' | 'fire' | 'lightning' | 'trophy' | 'book' | 'crown' | 'heart' | 'globe'
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_lesson',  name: 'First Step',      desc: 'Complete your first lesson',               icon: 'star'      },
  { id: 'flawless',      name: 'Flawless',         desc: 'Finish a lesson without losing a heart',   icon: 'heart'     },
  { id: 'xp_50',         name: 'Dedicated',        desc: 'Earn 50 XP total',                         icon: 'fire'      },
  { id: 'xp_100',        name: 'Scholar',          desc: 'Earn 100 XP total',                        icon: 'book'      },
  { id: 'lessons_5',     name: 'Word Collector',   desc: 'Complete 5 lessons',                       icon: 'lightning' },
  { id: 'polyglot',      name: 'Polyglot',         desc: 'Study 2 different languages',              icon: 'globe'     },
  { id: 'spanish_u1',    name: '¡Hola!',           desc: 'Complete all of Spanish Unit 1',           icon: 'trophy'    },
  { id: 'french_u1',     name: 'Bonjour!',         desc: 'Complete all of French Unit 1',            icon: 'crown'     },
  { id: 'german_u1',     name: 'Hallo!',           desc: 'Complete all of German Unit 1',            icon: 'trophy'    },
]

/** Distractor word pools used by the word-bank exercise mode */
export const DISTRACTORS: Record<string, string[]> = {
  es: ['el', 'la', 'un', 'es', 'de', 'y', 'no', 'sí', 'muy', 'bien', 'hola', 'qué', 'con'],
  fr: ['le', 'la', 'un', 'est', 'de', 'et', 'non', 'oui', 'très', 'bien', 'avec', 'ou'],
  de: ['der', 'die', 'das', 'ein', 'ist', 'und', 'nicht', 'ja', 'sehr', 'gut', 'mit', 'oder'],
}

export const SPEECH_LANG: Record<string, string> = {
  es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ja: 'ja-JP',
  ko: 'ko-KR', zh: 'zh-CN', pt: 'pt-PT', it: 'it-IT',
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const mc = (
  question: string,
  options: string[],
  correctIndex: number,
): Extract<Exercise, { type: 'multipleChoice' }> => ({
  type: 'multipleChoice', question, options, correctIndex,
})

const tr = (
  prompt: string,
  promptLang: 'en' | 'target',
  answer: string,
  alternatives?: string[],
): Extract<Exercise, { type: 'translate' }> => ({
  type: 'translate', prompt, promptLang, answer, alternatives,
})

const mp = (
  pairs: [string, string][],
): Extract<Exercise, { type: 'matchPairs' }> => ({
  type: 'matchPairs', pairs,
})

// ─── answer checking ──────────────────────────────────────────────────────────
export function normalizeAnswer(s: string): string {
  return s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function checkTranslateAnswer(
  userAnswer: string,
  correct: string,
  alternatives?: string[],
): boolean {
  const norm = normalizeAnswer(userAnswer)
  if (!norm) return false
  return [correct, ...(alternatives ?? [])].map(normalizeAnswer).includes(norm)
}

// ─── Spanish data ─────────────────────────────────────────────────────────────
const esLessons: Lesson[] = [
  {
    id: 'es-greetings', title: 'Greetings', icon: 'greeting', xpReward: 10,
    exercises: [
      mc('How do you say "Hello" in Spanish?', ['Hola', 'Adiós', 'Gracias', 'Por favor'], 0),
      tr('Thank you', 'en', 'Gracias', ['gracias']),
      mc('What does "Buenos días" mean?', ['Good night', 'Good afternoon', 'Good morning', 'Goodbye'], 2),
      tr('Goodbye', 'en', 'Adiós', ['adios', 'adiós']),
      mp([['Hello', 'Hola'], ['Goodbye', 'Adiós'], ['Thank you', 'Gracias'], ['Please', 'Por favor']]),
      mc('What does "Buenas noches" mean?', ['Good morning', 'Good evening', 'Good night', 'See you later'], 2),
      tr('Please', 'en', 'Por favor', ['por favor']),
      mc('"De nada" means…', ['Thank you', 'Sorry', "You're welcome", 'Hello'], 2),
      tr('Buenas tardes', 'target', 'Good afternoon'),
      mp([['Good morning', 'Buenos días'], ['Good afternoon', 'Buenas tardes'], ['Good night', 'Buenas noches'], ["You're welcome", 'De nada']]),
      mc('How do you say "How are you?" in Spanish?', ['¿Qué tal?', '¿Cómo estás?', '¿Dónde estás?', 'Both A and B'], 3),
      tr('Excuse me', 'en', 'Perdón', ['perdon', 'disculpe', 'disculpa']),
      mc('"Mucho gusto" means…', ['Thank you very much', 'Nice to meet you', 'See you later', 'Take care'], 1),
      tr('Hasta luego', 'target', 'See you later', ['see you']),
      mp([['Nice to meet you', 'Mucho gusto'], ['How are you?', '¿Cómo estás?'], ['Excuse me', 'Perdón'], ['See you later', 'Hasta luego']]),
    ],
  },
  {
    id: 'es-numbers', title: 'Numbers', icon: 'numbers', xpReward: 10,
    exercises: [
      mc('What does "uno" mean?', ['0', '1', '2', '3'], 1),
      tr('three', 'en', 'tres'),
      mc('How do you say "five"?', ['cuatro', 'cinco', 'seis', 'siete'], 1),
      mp([['one', 'uno'], ['two', 'dos'], ['eight', 'ocho'], ['ten', 'diez']]),
      tr('siete', 'target', 'seven'),
      mc('What is "nueve" in English?', ['six', 'seven', 'eight', 'nine'], 3),
      tr('four', 'en', 'cuatro'),
      mc('"Veinte" means…', ['12', '15', '20', '30'], 2),
      tr('seis', 'target', 'six'),
      mp([['three', 'tres'], ['five', 'cinco'], ['nine', 'nueve'], ['seven', 'siete']]),
      mc('How do you say "zero"?', ['uno', 'cero', 'nada', 'nulo'], 1),
      tr('fifteen', 'en', 'quince'),
      mc('"Cien" means…', ['10', '50', '100', '1000'], 2),
      tr('once', 'target', 'eleven'),
      mp([['twenty', 'veinte'], ['thirty', 'treinta'], ['forty', 'cuarenta'], ['fifty', 'cincuenta']]),
    ],
  },
  {
    id: 'es-colors', title: 'Colors', icon: 'colors', xpReward: 10,
    exercises: [
      mc('"Rojo" means…', ['Blue', 'Green', 'Red', 'Yellow'], 2),
      tr('blue', 'en', 'azul'),
      mp([['red', 'rojo'], ['blue', 'azul'], ['green', 'verde'], ['yellow', 'amarillo']]),
      mc('"Verde" means…', ['Purple', 'Orange', 'Green', 'Gray'], 2),
      tr('negro', 'target', 'black'),
      mc('How do you say "white"?', ['blanco', 'negro', 'gris', 'marrón'], 0),
      tr('orange', 'en', 'naranja'),
      mc('"Morado" means…', ['Brown', 'Pink', 'Purple', 'Gray'], 2),
      tr('rosa', 'target', 'pink'),
      mp([['white', 'blanco'], ['black', 'negro'], ['brown', 'marrón'], ['gray', 'gris']]),
      mc('How do you say "gold"?', ['plata', 'dorado', 'bronce', 'cobre'], 1),
      tr('purple', 'en', 'morado', ['púrpura', 'violeta']),
      mp([['orange', 'naranja'], ['pink', 'rosa'], ['purple', 'morado'], ['gold', 'dorado']]),
    ],
  },
  {
    id: 'es-family', title: 'Family', icon: 'family', xpReward: 12,
    exercises: [
      mc('"Madre" means…', ['Father', 'Sister', 'Mother', 'Brother'], 2),
      tr('father', 'en', 'padre'),
      mp([['mother', 'madre'], ['father', 'padre'], ['brother', 'hermano'], ['sister', 'hermana']]),
      mc('How do you say "grandmother"?', ['abuela', 'tía', 'prima', 'sobrina'], 0),
      tr('abuela', 'target', 'grandmother'),
      mc('"Tío" means…', ['Cousin', 'Uncle', 'Nephew', 'Grandfather'], 1),
      tr('daughter', 'en', 'hija'),
      mc('How do you say "son"?', ['hija', 'hijo', 'hermano', 'primo'], 1),
      tr('esposo', 'target', 'husband', ['marido']),
      mp([['uncle', 'tío'], ['aunt', 'tía'], ['cousin (m)', 'primo'], ['cousin (f)', 'prima']]),
      mc('"Suegra" means…', ['Daughter-in-law', 'Mother-in-law', 'Sister-in-law', 'Grandmother'], 1),
      tr('grandchildren', 'en', 'nietos'),
      mp([['son', 'hijo'], ['daughter', 'hija'], ['grandfather', 'abuelo'], ['grandmother', 'abuela']]),
    ],
  },
  {
    id: 'es-descriptions', title: 'Descriptions', icon: 'conversation', xpReward: 12,
    exercises: [
      mc('"Alto" means…', ['Short', 'Fat', 'Tall', 'Thin'], 2),
      tr('young', 'en', 'joven'),
      mc('How do you say "beautiful"?', ['feo', 'alto', 'hermoso', 'viejo'], 2),
      mp([['tall', 'alto'], ['short', 'bajo'], ['old', 'viejo'], ['young', 'joven']]),
      tr('inteligente', 'target', 'intelligent', ['smart', 'clever']),
      mc('"Delgado" means…', ['Fat', 'Thin', 'Strong', 'Weak'], 1),
      tr('ugly', 'en', 'feo'),
      mc('How do you say "fast"?', ['lento', 'rápido', 'fuerte', 'débil'], 1),
      tr('pequeño', 'target', 'small', ['little']),
      mp([['big', 'grande'], ['small', 'pequeño'], ['fast', 'rápido'], ['slow', 'lento']]),
      mc('"Fuerte" means…', ['Weak', 'Thin', 'Strong', 'Fast'], 2),
      tr('happy', 'en', 'feliz', ['contento', 'alegre']),
      mp([['happy', 'feliz'], ['sad', 'triste'], ['angry', 'enojado'], ['tired', 'cansado']]),
    ],
  },
  {
    id: 'es-food', title: 'Food', icon: 'food', xpReward: 15,
    exercises: [
      mc('"Manzana" means…', ['Banana', 'Apple', 'Orange', 'Grape'], 1),
      tr('bread', 'en', 'pan'),
      mp([['apple', 'manzana'], ['bread', 'pan'], ['water', 'agua'], ['milk', 'leche']]),
      mc('How do you say "egg"?', ['huevo', 'pollo', 'carne', 'pescado'], 0),
      tr('arroz', 'target', 'rice'),
      mc('"Queso" means…', ['Butter', 'Cream', 'Cheese', 'Yogurt'], 2),
      tr('chicken', 'en', 'pollo'),
      mc('How do you say "fish"?', ['carne', 'pollo', 'cerdo', 'pescado'], 3),
      tr('verduras', 'target', 'vegetables'),
      mp([['meat', 'carne'], ['fish', 'pescado'], ['chicken', 'pollo'], ['rice', 'arroz']]),
      mc('"Fresa" means…', ['Grape', 'Strawberry', 'Cherry', 'Peach'], 1),
      tr('butter', 'en', 'mantequilla'),
      mp([['egg', 'huevo'], ['cheese', 'queso'], ['strawberry', 'fresa'], ['banana', 'plátano']]),
    ],
  },
  {
    id: 'es-restaurant', title: 'Restaurant', icon: 'restaurant', xpReward: 15,
    exercises: [
      mc('How do you ask for the menu?', ['La cuenta', 'El menú', 'La mesa', 'La propina'], 1),
      tr('the bill', 'en', 'la cuenta', ['cuenta']),
      mc('"Tengo hambre" means…', ['I am thirsty', 'I am full', 'I am hungry', 'I want dessert'], 2),
      mp([["I'm hungry", 'Tengo hambre'], ["I'm thirsty", 'Tengo sed'], ['the check', 'la cuenta'], ['delicious', 'delicioso']]),
      tr('camarero', 'target', 'waiter', ['server']),
      mc('How do you say "a table for two"?', ['una mesa para dos', 'dos sillas', 'dos platos', 'dos personas'], 0),
      tr('dessert', 'en', 'postre'),
      mc('"Propina" means…', ['Menu', 'Receipt', 'Tip', 'Reservation'], 2),
      tr('Quisiera pedir', 'target', "I'd like to order", ["I would like to order"]),
      mp([['waiter', 'camarero'], ['menu', 'menú'], ['tip', 'propina'], ['dessert', 'postre']]),
      mc('How do you say "Can I have…?"?', ['¿Me da...?', '¿Dónde está...?', '¿Cuánto cuesta...?', '¿Qué es...?'], 0),
      tr('reservation', 'en', 'reservación', ['reserva']),
    ],
  },
  {
    id: 'es-travel', title: 'Travel', icon: 'travel', xpReward: 15,
    exercises: [
      mc('"Aeropuerto" means…', ['Hotel', 'Airport', 'Station', 'Port'], 1),
      tr('where is the hotel?', 'en', '¿Dónde está el hotel?', ['donde esta el hotel']),
      mp([['airport', 'aeropuerto'], ['hotel', 'hotel'], ['beach', 'playa'], ['museum', 'museo']]),
      mc('How do you say "ticket"?', ['boleto', 'pasaporte', 'maleta', 'mapa'], 0),
      tr('maleta', 'target', 'suitcase', ['luggage', 'bag']),
      mc('"Estación de tren" means…', ['Bus stop', 'Train station', 'Airport', 'Taxi stand'], 1),
      tr('passport', 'en', 'pasaporte'),
      mp([['ticket', 'boleto'], ['passport', 'pasaporte'], ['suitcase', 'maleta'], ['map', 'mapa']]),
      mc('How do you say "I need help"?', ['Necesito ayuda', 'Tengo hambre', 'Estoy perdido', 'No entiendo'], 0),
      tr('playa', 'target', 'beach'),
      mc('"Estoy perdido" means…', ["I'm hungry", "I'm tired", "I'm lost", "I'm late"], 2),
      tr('how much does it cost?', 'en', '¿Cuánto cuesta?', ['cuanto cuesta']),
    ],
  },
]

const esUnits: Unit[] = [
  { id: 'es-u1', title: 'Unit 1', subtitle: 'Basics & Greetings', color: '#58CC02', darkColor: '#46A302', lessons: esLessons.slice(0, 3) },
  { id: 'es-u2', title: 'Unit 2', subtitle: 'People & Family',    color: '#1CB0F6', darkColor: '#0E8FCC', lessons: esLessons.slice(3, 5) },
  { id: 'es-u3', title: 'Unit 3', subtitle: 'Food & Dining',      color: '#FF9600', darkColor: '#CC7800', lessons: esLessons.slice(5, 7) },
  { id: 'es-u4', title: 'Unit 4', subtitle: 'Travel & Places',    color: '#CE82FF', darkColor: '#A366CC', lessons: esLessons.slice(7, 8) },
]

// ─── French data ──────────────────────────────────────────────────────────────
const frLessons: Lesson[] = [
  {
    id: 'fr-greetings', title: 'Greetings', icon: 'greeting', xpReward: 10,
    exercises: [
      mc('How do you say "Hello" in French?', ['Bonjour', 'Au revoir', 'Merci', "S'il vous plaît"], 0),
      tr('Thank you', 'en', 'Merci', ['merci']),
      mp([['Hello', 'Bonjour'], ['Goodbye', 'Au revoir'], ['Please', "S'il vous plaît"], ['Thank you', 'Merci']]),
      mc('"Bonsoir" means…', ['Good morning', 'Good evening', 'Goodbye', 'Thank you'], 1),
      tr('Excuse me', 'en', 'Excusez-moi', ['excusez-moi', 'excusez moi']),
      mc('"De rien" means…', ['Thank you', "You're welcome", 'Hello', 'Please'], 1),
      tr('How are you?', 'en', 'Comment allez-vous?', ['comment allez-vous', 'comment vas-tu', 'ca va']),
      mp([['Good morning', 'Bonjour'], ['Good evening', 'Bonsoir'], ["You're welcome", 'De rien'], ['See you later', 'À bientôt']]),
      mc('How do you say "Nice to meet you"?', ['Au revoir', 'Enchanté', 'Merci beaucoup', 'Excusez-moi'], 1),
      tr('À bientôt', 'target', 'See you soon', ['see you later']),
      mc('"Salut" is an informal way to say…', ['Thank you', 'Sorry', 'Hi / Bye', 'Please'], 2),
      tr('sorry', 'en', 'Désolé', ['desole', 'pardon']),
      mp([['Nice to meet you', 'Enchanté'], ['Sorry', 'Désolé'], ['Hi (informal)', 'Salut'], ['Goodbye', 'Au revoir']]),
    ],
  },
  {
    id: 'fr-numbers', title: 'Numbers', icon: 'numbers', xpReward: 10,
    exercises: [
      mc('What does "deux" mean?', ['1', '2', '3', '4'], 1),
      tr('ten', 'en', 'dix'),
      mp([['one', 'un'], ['three', 'trois'], ['five', 'cinq'], ['ten', 'dix']]),
      mc('How do you say "eight"?', ['sept', 'huit', 'neuf', 'six'], 1),
      tr('quatre', 'target', 'four'),
      mc('"Vingt" means…', ['12', '15', '20', '30'], 2),
      tr('seven', 'en', 'sept'),
      mc('What is "zéro" in English?', ['one', 'zero', 'none', 'ten'], 1),
      tr('neuf', 'target', 'nine'),
      mp([['six', 'six'], ['seven', 'sept'], ['eight', 'huit'], ['nine', 'neuf']]),
      mc('How do you say "eleven"?', ['dix', 'onze', 'douze', 'treize'], 1),
      tr('twenty', 'en', 'vingt'),
      mc('"Cent" means…', ['10', '50', '100', '1000'], 2),
      mp([['twenty', 'vingt'], ['thirty', 'trente'], ['forty', 'quarante'], ['fifty', 'cinquante']]),
    ],
  },
  {
    id: 'fr-colors', title: 'Colors', icon: 'colors', xpReward: 10,
    exercises: [
      mc('"Rouge" means…', ['Blue', 'Green', 'Red', 'Yellow'], 2),
      tr('blue', 'en', 'bleu', ['bleue']),
      mp([['red', 'rouge'], ['blue', 'bleu'], ['green', 'vert'], ['white', 'blanc']]),
      mc('"Jaune" means…', ['Pink', 'Yellow', 'Orange', 'Purple'], 1),
      tr('noir', 'target', 'black'),
      mc('How do you say "gray"?', ['brun', 'gris', 'blanc', 'beige'], 1),
      tr('orange', 'en', 'orange'),
      mp([['black', 'noir'], ['white', 'blanc'], ['gray', 'gris'], ['brown', 'brun']]),
      mc('"Violet" means…', ['Green', 'Pink', 'Purple', 'Blue'], 2),
      tr('rose', 'target', 'pink'),
      mc('How do you say "gold"?', ['argent', 'or', 'bronze', 'cuivre'], 1),
      tr('green', 'en', 'vert', ['verte']),
      mp([['orange', 'orange'], ['pink', 'rose'], ['purple', 'violet'], ['gold', 'or']]),
    ],
  },
  {
    id: 'fr-family', title: 'Family', icon: 'family', xpReward: 12,
    exercises: [
      mc('"Mère" means…', ['Father', 'Grandmother', 'Mother', 'Sister'], 2),
      tr('father', 'en', 'père', ['pere']),
      mp([['mother', 'mère'], ['father', 'père'], ['brother', 'frère'], ['sister', 'sœur']]),
      tr('children', 'en', 'enfants'),
      mc('"Grand-père" means…', ['Uncle', 'Grandfather', 'Cousin', 'Brother'], 1),
      mc('How do you say "daughter"?', ['fils', 'fille', 'nièce', 'cousine'], 1),
      tr('uncle', 'en', 'oncle'),
      mp([['son', 'fils'], ['daughter', 'fille'], ['uncle', 'oncle'], ['aunt', 'tante']]),
      mc('"Petit-fils" means…', ['Nephew', 'Grandson', 'Cousin', 'Son-in-law'], 1),
      tr('mari', 'target', 'husband'),
      mc('How do you say "wife"?', ['mère', 'sœur', 'femme', 'fille'], 2),
      tr('grandparents', 'en', 'grands-parents', ['grands parents']),
      mp([['grandfather', 'grand-père'], ['grandmother', 'grand-mère'], ['grandson', 'petit-fils'], ['husband', 'mari']]),
    ],
  },
  {
    id: 'fr-food', title: 'Food', icon: 'food', xpReward: 15,
    exercises: [
      mc('"Pomme" means…', ['Banana', 'Pear', 'Apple', 'Grape'], 2),
      tr('bread', 'en', 'pain'),
      mp([['apple', 'pomme'], ['bread', 'pain'], ['water', 'eau'], ['milk', 'lait']]),
      tr('fromage', 'target', 'cheese'),
      mc("How do you say \"I'm hungry\"?", ["J'ai soif", "J'ai faim", "J'ai chaud", "J'ai froid"], 1),
      mc('"Poulet" means…', ['Fish', 'Beef', 'Chicken', 'Pork'], 2),
      tr('egg', 'en', 'œuf', ['oeuf']),
      mp([['meat', 'viande'], ['fish', 'poisson'], ['chicken', 'poulet'], ['rice', 'riz']]),
      mc('How do you say "vegetables"?', ['fruits', 'légumes', 'viandes', 'fromages'], 1),
      tr('beurre', 'target', 'butter'),
      mc('"Fraise" means…', ['Cherry', 'Strawberry', 'Raspberry', 'Blueberry'], 1),
      tr('sugar', 'en', 'sucre'),
      mp([['egg', 'œuf'], ['cheese', 'fromage'], ['butter', 'beurre'], ['sugar', 'sucre']]),
    ],
  },
  {
    id: 'fr-restaurant', title: 'Restaurant', icon: 'restaurant', xpReward: 15,
    exercises: [
      mc('How do you ask for the menu?', ["L'addition", 'Le menu', 'La table', 'Le pourboire'], 1),
      tr('the bill', 'en', "l'addition", ['addition']),
      mc('"J\'ai faim" means…', ['I am thirsty', 'I am full', 'I am hungry', 'I want dessert'], 2),
      mp([["I'm hungry", "J'ai faim"], ["I'm thirsty", "J'ai soif"], ['the bill', "L'addition"], ['delicious', 'Délicieux']]),
      tr('serveur', 'target', 'waiter', ['server']),
      mc('How do you say "a table for two"?', ['une table pour deux', 'deux chaises', 'deux assiettes', 'deux personnes'], 0),
      tr('dessert', 'en', 'dessert'),
      mc('"Pourboire" means…', ['Menu', 'Receipt', 'Tip', 'Reservation'], 2),
      tr("Je voudrais commander", 'target', "I'd like to order", ["I would like to order"]),
      mp([['waiter', 'serveur'], ['menu', 'menu'], ['tip', 'pourboire'], ['dessert', 'dessert']]),
      mc("How do you say \"Can I have…?\"?", ["Puis-je avoir...?", "Où est...?", "Combien coûte...?", "Qu'est-ce que c'est...?"], 0),
      tr('reservation', 'en', 'réservation', ['reservation']),
    ],
  },
  {
    id: 'fr-travel', title: 'Travel', icon: 'travel', xpReward: 15,
    exercises: [
      mc('"Aéroport" means…', ['Hotel', 'Airport', 'Station', 'Port'], 1),
      tr("where is the hotel?", 'en', "Où est l'hôtel?", ["ou est l'hotel"]),
      mp([['airport', 'aéroport'], ['hotel', 'hôtel'], ['beach', 'plage'], ['museum', 'musée']]),
      mc('How do you say "ticket"?', ['billet', 'passeport', 'valise', 'carte'], 0),
      tr('valise', 'target', 'suitcase', ['luggage', 'bag']),
      mc('"Gare" means…', ['Bus stop', 'Train station', 'Airport', 'Taxi stand'], 1),
      tr('passport', 'en', 'passeport'),
      mp([['ticket', 'billet'], ['passport', 'passeport'], ['suitcase', 'valise'], ['map', 'carte']]),
      mc("How do you say \"I need help\"?", ["J'ai besoin d'aide", "J'ai faim", "Je suis perdu", "Je ne comprends pas"], 0),
      tr('plage', 'target', 'beach'),
      mc('"Je suis perdu" means…', ["I'm hungry", "I'm tired", "I'm lost", "I'm late"], 2),
      tr("how much does it cost?", 'en', "Combien ça coûte?", ["combien ca coute"]),
    ],
  },
]

const frUnits: Unit[] = [
  { id: 'fr-u1', title: 'Unit 1', subtitle: 'Basics & Greetings', color: '#58CC02', darkColor: '#46A302', lessons: frLessons.slice(0, 3) },
  { id: 'fr-u2', title: 'Unit 2', subtitle: 'People & Family',    color: '#1CB0F6', darkColor: '#0E8FCC', lessons: frLessons.slice(3, 5) },
  { id: 'fr-u3', title: 'Unit 3', subtitle: 'Food & Dining',      color: '#FF9600', darkColor: '#CC7800', lessons: frLessons.slice(5, 7) },
]

// ─── German data ──────────────────────────────────────────────────────────────
const deLessons: Lesson[] = [
  {
    id: 'de-greetings', title: 'Greetings', icon: 'greeting', xpReward: 10,
    exercises: [
      mc('How do you say "Hello" in German?', ['Hallo', 'Tschüss', 'Danke', 'Bitte'], 0),
      tr('Thank you', 'en', 'Danke', ['danke', 'danke schön', 'danke schon']),
      mp([['Hello', 'Hallo'], ['Goodbye', 'Tschüss'], ['Thank you', 'Danke'], ['Please', 'Bitte']]),
      mc('"Guten Morgen" means…', ['Good night', 'Good afternoon', 'Good morning', 'Goodbye'], 2),
      tr('Goodbye', 'en', 'Auf Wiedersehen', ['auf wiedersehen', 'tschuss', 'tschüss']),
      mc('"Guten Abend" means…', ['Good morning', 'Good evening', 'Good night', 'See you later'], 1),
      tr('Please', 'en', 'Bitte', ['bitte']),
      mc('"Bitte schön" means…', ['Thank you', 'Sorry', "You're welcome", 'Hello'], 2),
      tr('Guten Tag', 'target', 'Good day', ['hello', 'good afternoon']),
      mp([['Good morning', 'Guten Morgen'], ['Good evening', 'Guten Abend'], ['Good night', 'Gute Nacht'], ["You're welcome", 'Bitte schön']]),
      mc('How do you say "How are you?" in German?', ['Wie heißt du?', 'Wie geht es Ihnen?', 'Wo bist du?', 'Was machst du?'], 1),
      tr('Excuse me', 'en', 'Entschuldigung', ['entschuldigung', 'entschuldigen sie']),
      mc('"Freut mich" means…', ['Thank you very much', 'Nice to meet you', 'See you later', 'Take care'], 1),
      tr('Bis später', 'target', 'See you later', ['see you']),
      mp([['Nice to meet you', 'Freut mich'], ['How are you?', 'Wie geht es dir?'], ['Excuse me', 'Entschuldigung'], ['See you later', 'Bis später']]),
    ],
  },
  {
    id: 'de-numbers', title: 'Numbers', icon: 'numbers', xpReward: 10,
    exercises: [
      mc('What does "eins" mean?', ['0', '1', '2', '3'], 1),
      tr('three', 'en', 'drei'),
      mc('How do you say "five"?', ['vier', 'fünf', 'sechs', 'sieben'], 1),
      mp([['one', 'eins'], ['two', 'zwei'], ['eight', 'acht'], ['ten', 'zehn']]),
      tr('sieben', 'target', 'seven'),
      mc('What is "neun" in English?', ['six', 'seven', 'eight', 'nine'], 3),
      tr('four', 'en', 'vier'),
      mc('"Zwanzig" means…', ['12', '15', '20', '30'], 2),
      tr('sechs', 'target', 'six'),
      mp([['three', 'drei'], ['five', 'fünf'], ['nine', 'neun'], ['seven', 'sieben']]),
      mc('How do you say "zero"?', ['eins', 'null', 'nichts', 'nein'], 1),
      tr('fifteen', 'en', 'fünfzehn', ['funfzehn']),
      mc('"Hundert" means…', ['10', '50', '100', '1000'], 2),
      tr('elf', 'target', 'eleven'),
      mp([['twenty', 'zwanzig'], ['thirty', 'dreißig'], ['forty', 'vierzig'], ['fifty', 'fünfzig']]),
    ],
  },
  {
    id: 'de-colors', title: 'Colors', icon: 'colors', xpReward: 10,
    exercises: [
      mc('"Rot" means…', ['Blue', 'Green', 'Red', 'Yellow'], 2),
      tr('blue', 'en', 'blau'),
      mp([['red', 'rot'], ['blue', 'blau'], ['green', 'grün'], ['yellow', 'gelb']]),
      mc('"Grün" means…', ['Purple', 'Orange', 'Green', 'Gray'], 2),
      tr('schwarz', 'target', 'black'),
      mc('How do you say "white"?', ['weiß', 'schwarz', 'grau', 'braun'], 0),
      tr('orange', 'en', 'orange'),
      mc('"Lila" means…', ['Brown', 'Pink', 'Purple', 'Gray'], 2),
      tr('rosa', 'target', 'pink'),
      mp([['white', 'weiß'], ['black', 'schwarz'], ['brown', 'braun'], ['gray', 'grau']]),
      mc('How do you say "gold"?', ['silber', 'gold', 'bronze', 'kupfer'], 1),
      tr('purple', 'en', 'lila', ['violett']),
      mp([['orange', 'orange'], ['pink', 'rosa'], ['purple', 'lila'], ['gold', 'gold']]),
    ],
  },
  {
    id: 'de-family', title: 'Family', icon: 'family', xpReward: 12,
    exercises: [
      mc('"Mutter" means…', ['Father', 'Sister', 'Mother', 'Brother'], 2),
      tr('father', 'en', 'Vater', ['vater']),
      mp([['mother', 'Mutter'], ['father', 'Vater'], ['brother', 'Bruder'], ['sister', 'Schwester']]),
      mc('How do you say "grandmother"?', ['Großmutter', 'Tante', 'Cousine', 'Nichte'], 0),
      tr('Großmutter', 'target', 'grandmother', ['grandma']),
      mc('"Onkel" means…', ['Cousin', 'Uncle', 'Nephew', 'Grandfather'], 1),
      tr('daughter', 'en', 'Tochter', ['tochter']),
      mc('How do you say "son"?', ['Tochter', 'Sohn', 'Bruder', 'Cousin'], 1),
      tr('Ehemann', 'target', 'husband', ['mann']),
      mp([['uncle', 'Onkel'], ['aunt', 'Tante'], ['cousin (m)', 'Cousin'], ['cousin (f)', 'Cousine']]),
      mc('"Schwiegermutter" means…', ['Daughter-in-law', 'Mother-in-law', 'Sister-in-law', 'Grandmother'], 1),
      tr('grandchildren', 'en', 'Enkelkinder', ['enkelkinder']),
      mp([['son', 'Sohn'], ['daughter', 'Tochter'], ['grandfather', 'Großvater'], ['grandmother', 'Großmutter']]),
    ],
  },
  {
    id: 'de-food', title: 'Food', icon: 'food', xpReward: 15,
    exercises: [
      mc('"Apfel" means…', ['Banana', 'Apple', 'Orange', 'Grape'], 1),
      tr('bread', 'en', 'Brot', ['brot']),
      mp([['apple', 'Apfel'], ['bread', 'Brot'], ['water', 'Wasser'], ['milk', 'Milch']]),
      mc('How do you say "egg"?', ['Ei', 'Huhn', 'Fleisch', 'Fisch'], 0),
      tr('Reis', 'target', 'rice'),
      mc('"Käse" means…', ['Butter', 'Cream', 'Cheese', 'Yogurt'], 2),
      tr('chicken', 'en', 'Hähnchen', ['huhn', 'hahnchen', 'hühnchen']),
      mp([['meat', 'Fleisch'], ['fish', 'Fisch'], ['chicken', 'Hähnchen'], ['rice', 'Reis']]),
      mc('How do you say "vegetables"?', ['Obst', 'Gemüse', 'Fleisch', 'Käse'], 1),
      tr('Butter', 'target', 'butter'),
      mc('"Erdbeere" means…', ['Cherry', 'Strawberry', 'Raspberry', 'Blueberry'], 1),
      tr('sugar', 'en', 'Zucker', ['zucker']),
      mp([['egg', 'Ei'], ['cheese', 'Käse'], ['butter', 'Butter'], ['sugar', 'Zucker']]),
    ],
  },
  {
    id: 'de-restaurant', title: 'Restaurant', icon: 'restaurant', xpReward: 15,
    exercises: [
      mc('How do you ask for the menu?', ['Die Rechnung', 'Die Speisekarte', 'Der Tisch', 'Das Trinkgeld'], 1),
      tr('the bill', 'en', 'die Rechnung', ['rechnung']),
      mc('"Ich habe Hunger" means…', ['I am thirsty', 'I am full', 'I am hungry', 'I want dessert'], 2),
      mp([["I'm hungry", 'Ich habe Hunger'], ["I'm thirsty", 'Ich habe Durst'], ['the bill', 'die Rechnung'], ['delicious', 'lecker']]),
      tr('Kellner', 'target', 'waiter', ['server']),
      mc('How do you say "a table for two"?', ['einen Tisch für zwei', 'zwei Stühle', 'zwei Teller', 'zwei Personen'], 0),
      tr('dessert', 'en', 'Nachtisch', ['dessert', 'nachspeise']),
      mc('"Trinkgeld" means…', ['Menu', 'Receipt', 'Tip', 'Reservation'], 2),
      tr('Ich möchte bestellen', 'target', "I'd like to order", ["I would like to order"]),
      mp([['waiter', 'Kellner'], ['menu', 'Speisekarte'], ['tip', 'Trinkgeld'], ['dessert', 'Nachtisch']]),
      mc("How do you say \"Can I have…?\"?", ["Kann ich ... haben?", "Wo ist...?", "Was kostet...?", "Was ist das?"], 0),
      tr('reservation', 'en', 'Reservierung', ['reservierung']),
    ],
  },
  {
    id: 'de-travel', title: 'Travel', icon: 'travel', xpReward: 15,
    exercises: [
      mc('"Flughafen" means…', ['Hotel', 'Airport', 'Station', 'Port'], 1),
      tr('where is the hotel?', 'en', 'Wo ist das Hotel?', ['wo ist das hotel']),
      mp([['airport', 'Flughafen'], ['hotel', 'Hotel'], ['beach', 'Strand'], ['museum', 'Museum']]),
      mc('How do you say "ticket"?', ['Fahrkarte', 'Reisepass', 'Koffer', 'Karte'], 0),
      tr('Koffer', 'target', 'suitcase', ['luggage', 'bag']),
      mc('"Bahnhof" means…', ['Bus stop', 'Train station', 'Airport', 'Taxi stand'], 1),
      tr('passport', 'en', 'Reisepass', ['reisepass']),
      mp([['ticket', 'Fahrkarte'], ['passport', 'Reisepass'], ['suitcase', 'Koffer'], ['map', 'Karte']]),
      mc('How do you say "I need help"?', ['Ich brauche Hilfe', 'Ich habe Hunger', 'Ich bin verloren', 'Ich verstehe nicht'], 0),
      tr('Strand', 'target', 'beach'),
      mc('"Ich bin verloren" means…', ["I'm hungry", "I'm tired", "I'm lost", "I'm late"], 2),
      tr('how much does it cost?', 'en', 'Was kostet das?', ['was kostet das', 'wie viel kostet das']),
    ],
  },
]

const deUnits: Unit[] = [
  { id: 'de-u1', title: 'Unit 1', subtitle: 'Basics & Greetings', color: '#58CC02', darkColor: '#46A302', lessons: deLessons.slice(0, 3) },
  { id: 'de-u2', title: 'Unit 2', subtitle: 'People & Family',    color: '#1CB0F6', darkColor: '#0E8FCC', lessons: deLessons.slice(3, 5) },
  { id: 'de-u3', title: 'Unit 3', subtitle: 'Food & Dining',      color: '#FF9600', darkColor: '#CC7800', lessons: deLessons.slice(5, 7) },
  { id: 'de-u4', title: 'Unit 4', subtitle: 'Travel & Places',    color: '#CE82FF', darkColor: '#A366CC', lessons: deLessons.slice(7, 8) },
]

// ─── All languages ─────────────────────────────────────────────────────────────
export const LANGUAGES: LanguageMeta[] = [
  { id: 'es', name: 'Spanish',    nativeName: 'Español',   color: '#FF4B4B', darkColor: '#CC3C3C', description: '2nd most spoken language worldwide', learners: '42M learners', available: true,  units: esUnits },
  { id: 'fr', name: 'French',     nativeName: 'Français',  color: '#1CB0F6', darkColor: '#0E8FCC', description: 'Spoken on 5 continents',              learners: '19M learners', available: true,  units: frUnits },
  { id: 'de', name: 'German',     nativeName: 'Deutsch',   color: '#FFD900', darkColor: '#CCA600', description: 'Most spoken language in the EU',       learners: '8M learners',  available: true,  units: deUnits },
  { id: 'ja', name: 'Japanese',   nativeName: '日本語',     color: '#FF9600', darkColor: '#CC7800', description: 'Key language of East Asia',            learners: '13M learners', available: false, units: [] },
  { id: 'ko', name: 'Korean',     nativeName: '한국어',     color: '#CE82FF', darkColor: '#A366CC', description: 'Rising global influence',              learners: '7M learners',  available: false, units: [] },
  { id: 'zh', name: 'Mandarin',   nativeName: '中文',       color: '#FF4B4B', darkColor: '#CC3C3C', description: 'Most spoken language on Earth',        learners: '5M learners',  available: false, units: [] },
  { id: 'pt', name: 'Portuguese', nativeName: 'Português', color: '#58CC02', darkColor: '#46A302', description: 'Spoken across 4 continents',           learners: '11M learners', available: false, units: [] },
  { id: 'it', name: 'Italian',    nativeName: 'Italiano',  color: '#58CC02', darkColor: '#46A302', description: 'Language of art and culture',          learners: '6M learners',  available: false, units: [] },
]
