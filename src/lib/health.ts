// Shared health-domain types, math and suggestion data

export interface FoodEntry {
  id: string
  date: string
  name: string
  mealType: string
  time: string
  calories: number
  createdAt: string
}

export interface WalkEntry {
  id: string
  date: string
  steps: number
  minutes: number
  distanceKm: number
  createdAt: string
}

export interface ActivityEntry {
  id: string
  date: string
  name: string
  minutes: number
  caloriesBurned: number
  createdAt: string
}

export interface DaySummary {
  date: string
  caloriesIn: number
  caloriesBurned: number
  steps: number
  walkMinutes: number
  activityMinutes: number
  meals: number
}

export interface SummaryResponse {
  today: string
  todayStats: DaySummary
  mealBreakdown: { meal: string; calories: number }[]
  topFoods: { name: string; mealType: string; calories: number; time: string }[]
  weekly: DaySummary[]
}

export interface Profile {
  name: string
  age: number
  gender: 'male' | 'female'
  weightKg: number
  heightCm: number
  goal: 'lose' | 'maintain' | 'gain'
  activityLevel: 'sedentary' | 'light' | 'moderate'
}

export const DEFAULT_PROFILE: Profile = {
  name: '',
  age: 28,
  gender: 'male',
  weightKg: 70,
  heightCm: 172,
  goal: 'maintain',
  activityLevel: 'light',
}

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEALS)[number]

export const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}

export const MEAL_COLORS: Record<string, string> = {
  breakfast: '#10b981', // emerald
  lunch: '#f59e0b', // amber
  dinner: '#f97316', // orange
  snack: '#ef4444', // red/rose
}

// ---------- Date helpers ----------

export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function nowTimeStr(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function prettyDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

// ---------- Calorie math ----------

const KCAL_PER_STEP = 0.04

export function stepsToCalories(steps: number): number {
  return Math.round(steps * KCAL_PER_STEP)
}

export function estimateWalkDistance(steps: number): number {
  // average stride ~0.000762 km per step (~0.76 m)
  return Math.round(steps * 0.000762 * 10) / 10
}

export function estimateStepsFromDistance(km: number): number {
  return Math.round(km / 0.000762)
}

// MET (Metabolic Equivalent of Task) values for common exercises
export const EXERCISE_TYPES: { name: string; met: number; icon: string }[] = [
  { name: 'Brisk Walking', met: 4.3, icon: '🚶' },
  { name: 'Jogging', met: 7.0, icon: '🏃' },
  { name: 'Running', met: 9.8, icon: '⚡' },
  { name: 'Cycling', met: 7.5, icon: '🚴' },
  { name: 'Swimming', met: 8.0, icon: '🏊' },
  { name: 'Yoga', met: 3.0, icon: '🧘' },
  { name: 'Weight Training', met: 5.0, icon: '🏋️' },
  { name: 'HIIT', met: 8.0, icon: '🔥' },
  { name: 'Dancing', met: 5.0, icon: '💃' },
  { name: 'Stretching', met: 2.3, icon: '🤸' },
]

export function exerciseCalories(name: string, minutes: number, weightKg: number): number {
  const match = EXERCISE_TYPES.find(
    (e) => e.name.toLowerCase() === name.toLowerCase().trim()
  )
  const met = match?.met ?? 5.0
  return Math.round((met * 3.5 * weightKg) / 200 * minutes)
}

// Mifflin-St Jeor BMR + TDEE
export function computeCalorieTarget(p: Profile): number {
  const bmr =
    p.gender === 'female'
      ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161
      : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + 5
  const factor =
    p.activityLevel === 'sedentary' ? 1.2 : p.activityLevel === 'light' ? 1.375 : 1.55
  let target = bmr * factor
  if (p.goal === 'lose') target -= 300
  if (p.goal === 'gain') target += 250
  return Math.round(target)
}

export function computeBmi(p: Profile): { bmi: number; label: string } {
  const meters = p.heightCm / 100
  const bmi = p.weightKg / (meters * meters)
  let label = 'Normal'
  if (bmi < 18.5) label = 'Underweight'
  else if (bmi >= 25 && bmi < 30) label = 'Overweight'
  else if (bmi >= 30) label = 'Obese'
  return { bmi: Math.round(bmi * 10) / 10, label }
}

// ---------- Food suggestions database (healthy options, kcal per serving) ----------

export const FOOD_SUGGESTIONS: Record<MealType, { name: string; kcal: number; note: string }[]> = {
  breakfast: [
    { name: 'Oatmeal with banana & chia seeds', kcal: 300, note: 'Fiber-rich, keeps you full' },
    { name: 'Greek yogurt with berries & honey', kcal: 200, note: 'Protein + probiotics' },
    { name: 'Vegetable omelette + whole-grain toast', kcal: 350, note: 'High protein start' },
    { name: 'Banana peanut-butter smoothie', kcal: 280, note: 'Quick energy' },
    { name: 'Vegetable poha / upma', kcal: 250, note: 'Light & easy to digest' },
    { name: '2 boiled eggs + avocado toast', kcal: 320, note: 'Healthy fats + protein' },
  ],
  lunch: [
    { name: 'Grilled chicken salad with olive oil', kcal: 400, note: 'Lean protein + greens' },
    { name: 'Brown rice + dal + sautéed veggies', kcal: 450, note: 'Balanced plate' },
    { name: 'Quinoa chickpea bowl with feta', kcal: 430, note: 'Plant protein powerhouse' },
    { name: 'Paneer tikka wrap (whole wheat)', kcal: 400, note: 'Vegetarian protein' },
    { name: 'Lentil soup + whole-grain bread', kcal: 350, note: 'Warm & filling' },
    { name: 'Grilled fish + roasted vegetables', kcal: 380, note: 'Omega-3 boost' },
  ],
  dinner: [
    { name: 'Stir-fried tofu + brown rice', kcal: 400, note: 'Light plant protein' },
    { name: 'Vegetable soup + garden salad', kcal: 300, note: 'Low-calorie, easy on digestion' },
    { name: 'Chicken curry (light) + 2 rotis', kcal: 420, note: 'Homely & balanced' },
    { name: 'Khichdi with vegetables', kcal: 350, note: 'Gut-friendly comfort food' },
    { name: 'Grilled salmon + steamed broccoli', kcal: 380, note: 'Healthy fats for the night' },
    { name: 'Whole-wheat pasta primavera', kcal: 420, note: 'Veggie-loaded carbs' },
  ],
  snack: [
    { name: 'Apple + a handful of almonds', kcal: 180, note: 'Crunchy fiber + good fats' },
    { name: 'Carrot sticks + hummus', kcal: 150, note: 'Vitamin A rich' },
    { name: 'Greek yogurt cup', kcal: 120, note: 'Protein snack' },
    { name: 'Roasted chana / chickpeas', kcal: 110, note: 'Crunchy protein' },
    { name: 'Fruit bowl (seasonal)', kcal: 130, note: 'Natural sugars + vitamins' },
    { name: 'Green tea + 2 dark chocolate squares', kcal: 100, note: 'Antioxidant treat' },
  ],
}

export const HEALTH_TIPS: { icon: string; title: string; text: string }[] = [
  { icon: '💧', title: 'Stay hydrated', text: 'Drink at least 8 glasses (2 L) of water a day. Mild dehydration is often mistaken for hunger.' },
  { icon: '🚶', title: 'Move every hour', text: 'Take a 5-minute walk break for every hour you sit. It boosts circulation and burns extra calories.' },
  { icon: '😴', title: 'Sleep 7–9 hours', text: 'Poor sleep increases hunger hormones and cravings. A consistent sleep schedule helps weight control.' },
  { icon: '🥗', title: 'Eat the rainbow', text: 'Fill half your plate with colorful vegetables and fruits to maximize vitamins and antioxidants.' },
  { icon: '⏱️', title: 'Eat slowly', text: 'It takes ~20 minutes for your brain to register fullness. Slow eating naturally reduces overeating.' },
  { icon: '🌅', title: 'Morning sunlight', text: '10–15 minutes of early sunlight supports vitamin D levels and a healthy sleep-wake cycle.' },
  { icon: '🧘', title: 'Breathe 4-7-8', text: 'Inhale 4s, hold 7s, exhale 8s. A quick way to lower stress and blood pressure.' },
  { icon: '📵', title: 'Screens off before bed', text: 'Avoid screens 30 minutes before sleep — blue light delays melatonin release.' },
  { icon: '💪', title: 'Protein every meal', text: 'Including protein in each meal keeps you fuller longer and protects muscle mass.' },
  { icon: '🚭', title: 'Limit late-night snacks', text: 'Late eating is linked to poorer digestion and weight gain. Try to finish dinner 2–3 hours before bed.' },
]

export function tipOfTheDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000
  )
  return HEALTH_TIPS[dayOfYear % HEALTH_TIPS.length]
}

// Personalized exercise suggestions based on today's numbers
export function suggestExercises(
  profile: Profile,
  todayStats: DaySummary,
  calorieTarget: number
): { icon: string; name: string; minutes: number; burn: number; reason: string }[] {
  const suggestions: { icon: string; name: string; minutes: number; burn: number; reason: string }[] = []
  const totalActivityMinutes = todayStats.walkMinutes + todayStats.activityMinutes
  const netSurplus = todayStats.caloriesIn - todayStats.caloriesBurned - calorieTarget

  const add = (name: string, minutes: number, reason: string) => {
    const ex = EXERCISE_TYPES.find((e) => e.name === name)!
    suggestions.push({
      icon: ex.icon,
      name,
      minutes,
      burn: exerciseCalories(name, minutes, profile.weightKg),
      reason,
    })
  }

  if (todayStats.steps < 6000) {
    add('Brisk Walking', todayStats.steps < 3000 ? 30 : 20, `You're at ${todayStats.steps.toLocaleString()} steps — aim for 8,000+ today.`)
  }
  if (totalActivityMinutes < 30) {
    add('Yoga', 15, 'Only ' + totalActivityMinutes + ' active minutes so far — gentle movement counts.')
  }
  if (netSurplus > 200) {
    add('Jogging', 20, `You're about ${Math.round(netSurplus)} kcal above target — a short jog balances it.`)
  }
  if (profile.goal === 'lose') {
    add('HIIT', 15, 'Short HIIT sessions are efficient for fat loss on your current goal.')
  } else if (profile.goal === 'gain') {
    add('Weight Training', 30, 'Strength training supports healthy muscle gain for your goal.')
  } else {
    add('Cycling', 25, 'A moderate ride fits your maintenance goal nicely.')
  }
  if (profile.activityLevel === 'sedentary') {
    add('Stretching', 10, 'Being mostly seated today — stretch to loosen tight muscles.')
  }

  return suggestions.slice(0, 4)
}

// Diet suggestions: what the user should still eat today
export function suggestDiet(
  foods: FoodEntry[],
  todayStr_: string,
  calorieTarget: number
): {
  nextMeal: MealType
  remaining: number
  message: string
  options: { name: string; kcal: number; note: string }[]
} {
  const loggedMeals = new Set(foods.filter((f) => f.date === todayStr_).map((f) => f.mealType))
  const totalIn = foods.filter((f) => f.date === todayStr_).reduce((s, f) => s + f.calories, 0)
  const remaining = Math.max(0, calorieTarget - totalIn)
  const hour = new Date().getHours()

  let nextMeal: MealType
  if (!loggedMeals.has('breakfast')) nextMeal = 'breakfast'
  else if (!loggedMeals.has('lunch')) nextMeal = 'lunch'
  else if (!loggedMeals.has('dinner')) nextMeal = 'dinner'
  else nextMeal = 'snack'

  // Time-aware override
  if (hour >= 11 && hour < 16 && !loggedMeals.has('lunch')) nextMeal = 'lunch'
  else if (hour >= 16 && hour < 22 && !loggedMeals.has('dinner')) nextMeal = 'dinner'
  else if (hour >= 22 || hour < 6) nextMeal = 'snack'

  let message: string
  if (totalIn === 0) {
    message = `You haven't logged any food yet. Start with a healthy ${nextMeal} — around ${Math.min(500, Math.round(calorieTarget * 0.3))} kcal.`
  } else if (remaining <= 0) {
    message = `You've reached your ${calorieTarget.toLocaleString()} kcal target. If hungry, pick a light, low-calorie snack.`
  } else {
    message = `You have about ${remaining} kcal left today. A balanced ${nextMeal} of 300–500 kcal fits your budget.`
  }

  const options = FOOD_SUGGESTIONS[nextMeal]
  return { nextMeal, remaining, message, options }
}
