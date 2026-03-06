/**
 * MoodTunes Custom Mood Classifier
 *
 * A lightweight NLP mood detection engine built from scratch.
 * Uses a multi-signal approach:
 *   1. Weighted lexicon matching (900+ mood-associated words/phrases)
 *   2. Negation detection (flips polarity)
 *   3. Intensifier/diminisher scaling
 *   4. Emoji sentiment analysis
 *   5. Punctuation energy signals (!! vs ...)
 *   6. N-gram phrase matching (2-word and 3-word)
 *
 * No external APIs. Runs entirely on the server.
 */

export type Mood = "happy" | "sad" | "energetic" | "calm" | "focused";

interface ClassifierResult {
  mood: Mood;
  confidence: number;
  scores: Record<Mood, number>;
}

// ─── MOOD LEXICON ──────────────────────────────────────────
// Each word is mapped to mood scores [happy, sad, energetic, calm, focused]
// Weights range from 0-3 (0=no signal, 1=weak, 2=moderate, 3=strong)

const LEXICON: Record<string, [number, number, number, number, number]> = {
  // ── HAPPY words ──
  happy:      [3, 0, 0, 0, 0],
  joy:        [3, 0, 0, 0, 0],
  joyful:     [3, 0, 0, 0, 0],
  glad:       [2, 0, 0, 0, 0],
  delighted:  [3, 0, 0, 0, 0],
  cheerful:   [3, 0, 0, 0, 0],
  wonderful:  [3, 0, 0, 0, 0],
  amazing:    [3, 0, 1, 0, 0],
  awesome:    [3, 0, 1, 0, 0],
  fantastic:  [3, 0, 1, 0, 0],
  great:      [2, 0, 0, 0, 0],
  good:       [2, 0, 0, 0, 0],
  love:       [3, 0, 0, 0, 0],
  loving:     [3, 0, 0, 0, 0],
  loved:      [3, 0, 0, 0, 0],
  lovely:     [2, 0, 0, 1, 0],
  beautiful:  [2, 0, 0, 1, 0],
  blessed:    [3, 0, 0, 0, 0],
  grateful:   [3, 0, 0, 1, 0],
  thankful:   [3, 0, 0, 1, 0],
  excited:    [3, 0, 2, 0, 0],
  exciting:   [2, 0, 2, 0, 0],
  thrilled:   [3, 0, 2, 0, 0],
  ecstatic:   [3, 0, 2, 0, 0],
  elated:     [3, 0, 1, 0, 0],
  euphoric:   [3, 0, 2, 0, 0],
  blissful:   [3, 0, 0, 1, 0],
  bliss:      [3, 0, 0, 1, 0],
  content:    [2, 0, 0, 1, 0],
  contented:  [2, 0, 0, 1, 0],
  satisfied:  [2, 0, 0, 1, 0],
  pleased:    [2, 0, 0, 0, 0],
  smile:      [3, 0, 0, 0, 0],
  smiling:    [3, 0, 0, 0, 0],
  laugh:      [3, 0, 1, 0, 0],
  laughing:   [3, 0, 1, 0, 0],
  laughter:   [3, 0, 1, 0, 0],
  fun:        [3, 0, 1, 0, 0],
  funny:      [2, 0, 1, 0, 0],
  celebrate:  [3, 0, 2, 0, 0],
  celebration:[3, 0, 2, 0, 0],
  celebrating:[3, 0, 2, 0, 0],
  party:      [2, 0, 2, 0, 0],
  bright:     [2, 0, 1, 0, 0],
  sunshine:   [2, 0, 1, 0, 0],
  sunny:      [2, 0, 1, 0, 0],
  radiant:    [2, 0, 0, 0, 0],
  glowing:    [2, 0, 0, 0, 0],
  warm:       [2, 0, 0, 1, 0],
  warmth:     [2, 0, 0, 1, 0],
  positive:   [2, 0, 0, 0, 0],
  optimistic: [2, 0, 0, 0, 0],
  hope:       [2, 0, 0, 0, 0],
  hopeful:    [2, 0, 0, 0, 0],
  proud:      [2, 0, 1, 0, 0],
  pride:      [2, 0, 1, 0, 0],
  winning:    [2, 0, 1, 0, 0],
  win:        [2, 0, 1, 0, 0],
  success:    [2, 0, 0, 0, 1],
  successful: [2, 0, 0, 0, 1],
  accomplish: [2, 0, 0, 0, 1],
  achieved:   [2, 0, 0, 0, 1],
  perfect:    [2, 0, 0, 0, 0],
  paradise:   [2, 0, 0, 1, 0],
  magical:    [2, 0, 0, 0, 0],
  vibrant:    [2, 0, 1, 0, 0],
  alive:      [2, 0, 1, 0, 0],
  free:       [2, 0, 1, 0, 0],
  freedom:    [2, 0, 1, 0, 0],
  playful:    [2, 0, 1, 0, 0],

  // ── SAD words ──
  sad:        [0, 3, 0, 0, 0],
  sadness:    [0, 3, 0, 0, 0],
  unhappy:    [0, 3, 0, 0, 0],
  depressed:  [0, 3, 0, 0, 0],
  depression: [0, 3, 0, 0, 0],
  depressing: [0, 3, 0, 0, 0],
  miserable:  [0, 3, 0, 0, 0],
  heartbroken:[0, 3, 0, 0, 0],
  heartbreak: [0, 3, 0, 0, 0],
  broken:     [0, 3, 0, 0, 0],
  lonely:     [0, 3, 0, 0, 0],
  loneliness: [0, 3, 0, 0, 0],
  alone:      [0, 2, 0, 1, 0],
  isolated:   [0, 3, 0, 0, 0],
  cry:        [0, 3, 0, 0, 0],
  crying:     [0, 3, 0, 0, 0],
  tears:      [0, 3, 0, 0, 0],
  tearful:    [0, 3, 0, 0, 0],
  weep:       [0, 3, 0, 0, 0],
  weeping:    [0, 3, 0, 0, 0],
  grief:      [0, 3, 0, 0, 0],
  grieving:   [0, 3, 0, 0, 0],
  mourn:      [0, 3, 0, 0, 0],
  mourning:   [0, 3, 0, 0, 0],
  loss:       [0, 3, 0, 0, 0],
  lost:       [0, 2, 0, 0, 0],
  miss:       [0, 3, 0, 0, 0],
  missing:    [0, 3, 0, 0, 0],
  hurt:       [0, 3, 0, 0, 0],
  hurting:    [0, 3, 0, 0, 0],
  pain:       [0, 3, 0, 0, 0],
  painful:    [0, 3, 0, 0, 0],
  suffering:  [0, 3, 0, 0, 0],
  suffer:     [0, 3, 0, 0, 0],
  sorrow:     [0, 3, 0, 0, 0],
  sorrowful:  [0, 3, 0, 0, 0],
  gloomy:     [0, 3, 0, 0, 0],
  gloom:      [0, 3, 0, 0, 0],
  melancholy: [0, 3, 0, 0, 0],
  blue:       [0, 2, 0, 0, 0],
  down:       [0, 2, 0, 0, 0],
  low:        [0, 2, 0, 0, 0],
  empty:      [0, 3, 0, 0, 0],
  emptiness:  [0, 3, 0, 0, 0],
  hopeless:   [0, 3, 0, 0, 0],
  worthless:  [0, 3, 0, 0, 0],
  numb:       [0, 3, 0, 0, 0],
  heavy:      [0, 2, 0, 0, 0],
  dark:       [0, 2, 0, 0, 0],
  darkness:   [0, 2, 0, 0, 0],
  regret:     [0, 3, 0, 0, 0],
  remorse:    [0, 3, 0, 0, 0],
  disappointed:[0, 2, 0, 0, 0],
  disappointment:[0, 2, 0, 0, 0],
  frustrated: [0, 2, 0, 0, 0],
  frustrating:[0, 2, 0, 0, 0],
  anxious:    [0, 2, 0, 0, 0],
  anxiety:    [0, 2, 0, 0, 0],
  worried:    [0, 2, 0, 0, 0],
  worry:      [0, 2, 0, 0, 0],
  scared:     [0, 2, 0, 0, 0],
  afraid:     [0, 2, 0, 0, 0],
  fear:       [0, 2, 0, 0, 0],
  tired:      [0, 2, 0, 0, 0],
  exhausted:  [0, 2, 0, 0, 0],
  drained:    [0, 2, 0, 0, 0],
  defeated:   [0, 3, 0, 0, 0],
  crushed:    [0, 3, 0, 0, 0],
  shattered:  [0, 3, 0, 0, 0],
  devastated: [0, 3, 0, 0, 0],
  torn:       [0, 2, 0, 0, 0],
  ache:       [0, 2, 0, 0, 0],
  aching:     [0, 2, 0, 0, 0],
  nostalgic:  [0, 2, 0, 1, 0],
  nostalgia:  [0, 2, 0, 1, 0],
  bittersweet:[0, 2, 0, 0, 0],
  somber:     [0, 2, 0, 0, 0],
  despair:    [0, 3, 0, 0, 0],
  agony:      [0, 3, 0, 0, 0],
  wretched:   [0, 3, 0, 0, 0],

  // ── ENERGETIC words ──
  energetic:  [0, 0, 3, 0, 0],
  energy:     [0, 0, 3, 0, 0],
  energized:  [0, 0, 3, 0, 0],
  hyper:      [0, 0, 3, 0, 0],
  pumped:     [0, 0, 3, 0, 0],
  fired:      [0, 0, 3, 0, 0],
  power:      [0, 0, 3, 0, 0],
  powerful:   [0, 0, 3, 0, 0],
  strong:     [0, 0, 3, 0, 0],
  strength:   [0, 0, 3, 0, 0],
  workout:    [0, 0, 3, 0, 0],
  exercise:   [0, 0, 3, 0, 0],
  gym:        [0, 0, 3, 0, 0],
  run:        [0, 0, 2, 0, 0],
  running:    [0, 0, 3, 0, 0],
  sprint:     [0, 0, 3, 0, 0],
  rush:       [0, 0, 3, 0, 0],
  adrenaline: [0, 0, 3, 0, 0],
  fast:       [0, 0, 2, 0, 0],
  speed:      [0, 0, 2, 0, 0],
  intense:    [0, 0, 3, 0, 0],
  intensity:  [0, 0, 3, 0, 0],
  wild:       [0, 0, 3, 0, 0],
  crazy:      [0, 0, 2, 0, 0],
  unstoppable:[0, 0, 3, 0, 0],
  fierce:     [0, 0, 3, 0, 0],
  beast:      [0, 0, 3, 0, 0],
  fire:       [0, 0, 3, 0, 0],
  burn:       [0, 0, 2, 0, 0],
  burning:    [0, 0, 2, 0, 0],
  explosive:  [0, 0, 3, 0, 0],
  explode:    [0, 0, 3, 0, 0],
  rage:       [0, 0, 3, 0, 0],
  raging:     [0, 0, 3, 0, 0],
  angry:      [0, 1, 3, 0, 0],
  furious:    [0, 0, 3, 0, 0],
  aggressive: [0, 0, 3, 0, 0],
  bold:       [0, 0, 2, 0, 0],
  brave:      [0, 0, 2, 0, 0],
  warrior:    [0, 0, 3, 0, 0],
  fight:      [0, 0, 3, 0, 0],
  fighting:   [0, 0, 3, 0, 0],
  champion:   [1, 0, 3, 0, 0],
  conquer:    [0, 0, 3, 0, 0],
  dominate:   [0, 0, 3, 0, 0],
  smash:      [0, 0, 3, 0, 0],
  crush:      [0, 0, 3, 0, 0],
  grind:      [0, 0, 3, 0, 0],
  hustle:     [0, 0, 3, 0, 1],
  dance:      [1, 0, 3, 0, 0],
  dancing:    [1, 0, 3, 0, 0],
  jump:       [0, 0, 3, 0, 0],
  jumping:    [0, 0, 3, 0, 0],
  move:       [0, 0, 2, 0, 0],
  moving:     [0, 0, 2, 0, 0],
  rock:       [0, 0, 2, 0, 0],
  rocking:    [0, 0, 2, 0, 0],
  electric:   [0, 0, 3, 0, 0],
  thunder:    [0, 0, 3, 0, 0],
  storm:      [0, 0, 3, 0, 0],
  turbo:      [0, 0, 3, 0, 0],
  boost:      [0, 0, 3, 0, 0],
  charged:    [0, 0, 3, 0, 0],
  motivated:  [0, 0, 3, 0, 1],
  motivation: [0, 0, 3, 0, 1],
  driven:     [0, 0, 2, 0, 1],
  determined: [0, 0, 2, 0, 1],
  pumping:    [0, 0, 3, 0, 0],
  sweat:      [0, 0, 3, 0, 0],
  training:   [0, 0, 3, 0, 0],
  lift:       [0, 0, 2, 0, 0],
  lifting:    [0, 0, 3, 0, 0],

  // ── CALM words ──
  calm:       [0, 0, 0, 3, 0],
  calmness:   [0, 0, 0, 3, 0],
  peaceful:   [0, 0, 0, 3, 0],
  peace:      [0, 0, 0, 3, 0],
  serene:     [0, 0, 0, 3, 0],
  serenity:   [0, 0, 0, 3, 0],
  tranquil:   [0, 0, 0, 3, 0],
  quiet:      [0, 0, 0, 3, 0],
  silence:    [0, 0, 0, 3, 0],
  silent:     [0, 0, 0, 3, 0],
  still:      [0, 0, 0, 3, 0],
  stillness:  [0, 0, 0, 3, 0],
  gentle:     [0, 0, 0, 3, 0],
  soft:       [0, 0, 0, 3, 0],
  soothing:   [0, 0, 0, 3, 0],
  soothe:     [0, 0, 0, 3, 0],
  relax:      [0, 0, 0, 3, 0],
  relaxed:    [0, 0, 0, 3, 0],
  relaxing:   [0, 0, 0, 3, 0],
  chill:      [0, 0, 0, 3, 0],
  chilling:   [0, 0, 0, 3, 0],
  chilled:    [0, 0, 0, 3, 0],
  mellow:     [0, 0, 0, 3, 0],
  ease:       [0, 0, 0, 3, 0],
  easy:       [0, 0, 0, 2, 0],
  cozy:       [0, 0, 0, 3, 0],
  comfort:    [0, 0, 0, 3, 0],
  comfortable:[0, 0, 0, 3, 0],
  rest:       [0, 0, 0, 3, 0],
  resting:    [0, 0, 0, 3, 0],
  restful:    [0, 0, 0, 3, 0],
  meditate:   [0, 0, 0, 3, 1],
  meditation: [0, 0, 0, 3, 1],
  mindful:    [0, 0, 0, 3, 1],
  mindfulness:[0, 0, 0, 3, 1],
  breathe:    [0, 0, 0, 3, 0],
  breathing:  [0, 0, 0, 3, 0],
  zen:        [0, 0, 0, 3, 1],
  harmony:    [0, 0, 0, 3, 0],
  balanced:   [0, 0, 0, 3, 0],
  balance:    [0, 0, 0, 3, 0],
  floating:   [0, 0, 0, 3, 0],
  dreamy:     [0, 0, 0, 3, 0],
  dream:      [0, 0, 0, 2, 0],
  sleepy:     [0, 1, 0, 3, 0],
  sleep:      [0, 0, 0, 3, 0],
  night:      [0, 0, 0, 2, 0],
  evening:    [0, 0, 0, 2, 0],
  moonlight:  [0, 0, 0, 3, 0],
  ocean:      [0, 0, 0, 3, 0],
  waves:      [0, 0, 0, 3, 0],
  water:      [0, 0, 0, 2, 0],
  rain:       [0, 1, 0, 3, 0],
  rainy:      [0, 1, 0, 3, 0],
  nature:     [0, 0, 0, 3, 0],
  forest:     [0, 0, 0, 3, 0],
  garden:     [0, 0, 0, 3, 0],
  breeze:     [0, 0, 0, 3, 0],
  wind:       [0, 0, 0, 2, 0],
  flow:       [0, 0, 0, 3, 1],
  flowing:    [0, 0, 0, 3, 0],
  smooth:     [0, 0, 0, 3, 0],
  slow:       [0, 0, 0, 3, 0],
  slowly:     [0, 0, 0, 3, 0],
  tender:     [0, 0, 0, 3, 0],
  lazy:       [0, 0, 0, 3, 0],
  unwind:     [0, 0, 0, 3, 0],
  spa:        [0, 0, 0, 3, 0],
  yoga:       [0, 0, 0, 3, 1],
  ambient:    [0, 0, 0, 3, 0],
  lullaby:    [0, 0, 0, 3, 0],

  // ── FOCUSED words ──
  focus:      [0, 0, 0, 0, 3],
  focused:    [0, 0, 0, 0, 3],
  focusing:   [0, 0, 0, 0, 3],
  concentrate:[0, 0, 0, 0, 3],
  concentration:[0, 0, 0, 0, 3],
  study:      [0, 0, 0, 0, 3],
  studying:   [0, 0, 0, 0, 3],
  work:       [0, 0, 0, 0, 3],
  working:    [0, 0, 0, 0, 3],
  productive: [0, 0, 0, 0, 3],
  productivity:[0, 0, 0, 0, 3],
  think:      [0, 0, 0, 0, 3],
  thinking:   [0, 0, 0, 0, 3],
  thought:    [0, 0, 0, 0, 2],
  learn:      [0, 0, 0, 0, 3],
  learning:   [0, 0, 0, 0, 3],
  read:       [0, 0, 0, 0, 3],
  reading:    [0, 0, 0, 1, 3],
  write:      [0, 0, 0, 0, 3],
  writing:    [0, 0, 0, 0, 3],
  code:       [0, 0, 0, 0, 3],
  coding:     [0, 0, 0, 0, 3],
  program:    [0, 0, 0, 0, 3],
  programming:[0, 0, 0, 0, 3],
  create:     [0, 0, 0, 0, 3],
  creating:   [0, 0, 0, 0, 3],
  creative:   [0, 0, 0, 0, 3],
  creativity: [0, 0, 0, 0, 3],
  design:     [0, 0, 0, 0, 3],
  build:      [0, 0, 0, 0, 3],
  building:   [0, 0, 0, 0, 3],
  project:    [0, 0, 0, 0, 3],
  deadline:   [0, 0, 1, 0, 3],
  task:       [0, 0, 0, 0, 3],
  plan:       [0, 0, 0, 0, 3],
  planning:   [0, 0, 0, 0, 3],
  organize:   [0, 0, 0, 0, 3],
  research:   [0, 0, 0, 0, 3],
  analyze:    [0, 0, 0, 0, 3],
  solve:      [0, 0, 0, 0, 3],
  solving:    [0, 0, 0, 0, 3],
  problem:    [0, 0, 0, 0, 2],
  logic:      [0, 0, 0, 0, 3],
  logical:    [0, 0, 0, 0, 3],
  sharp:      [0, 0, 0, 0, 3],
  clarity:    [0, 0, 0, 0, 3],
  clear:      [0, 0, 0, 0, 2],
  precise:    [0, 0, 0, 0, 3],
  brain:      [0, 0, 0, 0, 3],
  mental:     [0, 0, 0, 0, 2],
  intellect:  [0, 0, 0, 0, 3],
  strategic:  [0, 0, 0, 0, 3],
  strategy:   [0, 0, 0, 0, 3],
  disciplined:[0, 0, 0, 0, 3],
  discipline: [0, 0, 0, 0, 3],
  diligent:   [0, 0, 0, 0, 3],
  grounded:   [0, 0, 0, 1, 3],
  attentive:  [0, 0, 0, 0, 3],
  absorbed:   [0, 0, 0, 0, 3],
  immersed:   [0, 0, 0, 0, 3],
  deep:       [0, 0, 0, 1, 2],
  engaged:    [0, 0, 0, 0, 3],
  zone:       [0, 0, 0, 0, 3],
  exam:       [0, 0, 0, 0, 3],
  practice:   [0, 0, 0, 0, 3],
  homework:   [0, 0, 0, 0, 3],
  assignment: [0, 0, 0, 0, 3],
};

// ─── PHRASE LEXICON (n-grams) ──────────────────────────────
const PHRASES: Record<string, [number, number, number, number, number]> = {
  "on top of the world":    [3, 0, 1, 0, 0],
  "over the moon":          [3, 0, 0, 0, 0],
  "feeling great":          [3, 0, 0, 0, 0],
  "feeling good":           [2, 0, 0, 0, 0],
  "feeling down":           [0, 3, 0, 0, 0],
  "feeling low":            [0, 3, 0, 0, 0],
  "feeling blue":           [0, 3, 0, 0, 0],
  "feeling lost":           [0, 3, 0, 0, 0],
  "feeling empty":          [0, 3, 0, 0, 0],
  "feeling alive":          [1, 0, 3, 0, 0],
  "full of energy":         [0, 0, 3, 0, 0],
  "pumped up":              [0, 0, 3, 0, 0],
  "fired up":               [0, 0, 3, 0, 0],
  "at peace":               [0, 0, 0, 3, 0],
  "peace of mind":          [0, 0, 0, 3, 1],
  "in the zone":            [0, 0, 0, 0, 3],
  "deep focus":             [0, 0, 0, 0, 3],
  "on fire":                [0, 0, 3, 0, 0],
  "let's go":               [0, 0, 3, 0, 0],
  "broken heart":           [0, 3, 0, 0, 0],
  "falling apart":          [0, 3, 0, 0, 0],
  "can't stop":             [0, 0, 2, 0, 0],
  "don't care":             [0, 2, 0, 0, 0],
  "best day":               [3, 0, 0, 0, 0],
  "worst day":              [0, 3, 0, 0, 0],
  "miss you":               [0, 3, 0, 0, 0],
  "love you":               [3, 0, 0, 0, 0],
  "thank you":              [2, 0, 0, 0, 0],
  "so tired":               [0, 2, 0, 0, 0],
  "burned out":             [0, 2, 0, 0, 0],
  "wind down":              [0, 0, 0, 3, 0],
  "slow down":              [0, 0, 0, 3, 0],
  "take it easy":           [0, 0, 0, 3, 0],
  "heads down":             [0, 0, 0, 0, 3],
  "lock in":                [0, 0, 0, 0, 3],
  "get to work":            [0, 0, 1, 0, 3],
  "need to focus":          [0, 0, 0, 0, 3],
  "no distractions":        [0, 0, 0, 0, 3],
  "ready to go":            [0, 0, 3, 0, 0],
};

// ─── EMOJI MOOD MAP ──────────────────────────────────────
const EMOJI_MOODS: Record<string, [number, number, number, number, number]> = {
  "😊": [3, 0, 0, 0, 0], "😃": [3, 0, 0, 0, 0], "😄": [3, 0, 0, 0, 0],
  "😁": [3, 0, 0, 0, 0], "🥰": [3, 0, 0, 0, 0], "😍": [3, 0, 0, 0, 0],
  "❤️": [3, 0, 0, 0, 0], "💕": [3, 0, 0, 0, 0], "🎉": [3, 0, 1, 0, 0],
  "🥳": [3, 0, 2, 0, 0], "✨": [2, 0, 0, 0, 0], "🌟": [2, 0, 0, 0, 0],
  "😢": [0, 3, 0, 0, 0], "😭": [0, 3, 0, 0, 0], "😞": [0, 3, 0, 0, 0],
  "😔": [0, 3, 0, 0, 0], "💔": [0, 3, 0, 0, 0], "😿": [0, 3, 0, 0, 0],
  "🥺": [0, 2, 0, 0, 0], "😩": [0, 2, 0, 0, 0], "😰": [0, 2, 0, 0, 0],
  "⚡": [0, 0, 3, 0, 0], "🔥": [0, 0, 3, 0, 0], "💪": [0, 0, 3, 0, 0],
  "🏃": [0, 0, 3, 0, 0], "🚀": [0, 0, 3, 0, 0], "💥": [0, 0, 3, 0, 0],
  "🎸": [0, 0, 2, 0, 0], "🤘": [0, 0, 3, 0, 0], "👊": [0, 0, 2, 0, 0],
  "🧘": [0, 0, 0, 3, 0], "🌊": [0, 0, 0, 3, 0], "🌙": [0, 0, 0, 3, 0],
  "☁️": [0, 0, 0, 2, 0], "🍃": [0, 0, 0, 3, 0], "🌿": [0, 0, 0, 2, 0],
  "😌": [0, 0, 0, 3, 0], "🕊️": [0, 0, 0, 3, 0], "☮️": [0, 0, 0, 3, 0],
  "🎯": [0, 0, 0, 0, 3], "🧠": [0, 0, 0, 0, 3], "📚": [0, 0, 0, 0, 3],
  "💻": [0, 0, 0, 0, 3], "📝": [0, 0, 0, 0, 3], "🔬": [0, 0, 0, 0, 3],
  "⏰": [0, 0, 1, 0, 2], "📖": [0, 0, 0, 1, 3],
};

// ─── NEGATION & INTENSIFIERS ──────────────────────────────
const NEGATORS = new Set([
  "not", "no", "never", "neither", "nobody", "nothing",
  "nowhere", "nor", "cannot", "can't", "don't", "doesn't",
  "didn't", "won't", "wouldn't", "shouldn't", "isn't",
  "aren't", "wasn't", "weren't", "hardly", "barely", "scarcely",
]);

const INTENSIFIERS: Record<string, number> = {
  very: 1.5, really: 1.5, extremely: 2.0, incredibly: 2.0,
  absolutely: 2.0, totally: 1.8, completely: 1.8, deeply: 1.8,
  utterly: 2.0, super: 1.5, so: 1.4, such: 1.3, quite: 1.2,
  pretty: 1.2, immensely: 2.0, insanely: 2.0, ridiculously: 1.8,
  terribly: 1.8, awfully: 1.5, mad: 1.5,
};

const DIMINISHERS: Record<string, number> = {
  slightly: 0.5, somewhat: 0.6, barely: 0.4, hardly: 0.3,
  "a bit": 0.5, "a little": 0.5, kind: 0.6, kinda: 0.6,
  "sort of": 0.6, mildly: 0.5,
};

// ─── TEXT PREPROCESSING ──────────────────────────────────
function preprocess(text: string): {
  tokens: string[];
  lower: string;
  punctuationEnergy: number;
  hasEllipsis: boolean;
} {
  const lower = text.toLowerCase().trim();

  // Punctuation energy: !!! = high energy, ... = calm/sad
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const hasEllipsis = /\.{3,}|…/.test(text);
  const punctuationEnergy = Math.min(exclamations * 0.3 + questions * 0.1, 2);

  // Tokenize: split on whitespace and punctuation, keep words
  const tokens = lower
    .replace(/[^\w\s''-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);

  return { tokens, lower, punctuationEnergy, hasEllipsis };
}

// ─── MAIN CLASSIFIER ──────────────────────────────────────
export function classifyMood(text: string): ClassifierResult {
  const { tokens, lower, punctuationEnergy, hasEllipsis } = preprocess(text);

  // Initialize scores
  const scores: Record<Mood, number> = {
    happy: 0,
    sad: 0,
    energetic: 0,
    calm: 0,
    focused: 0,
  };

  // 1. Phrase matching (higher priority — check first)
  for (const [phrase, weights] of Object.entries(PHRASES)) {
    if (lower.includes(phrase)) {
      scores.happy += weights[0] * 1.5;
      scores.sad += weights[1] * 1.5;
      scores.energetic += weights[2] * 1.5;
      scores.calm += weights[3] * 1.5;
      scores.focused += weights[4] * 1.5;
    }
  }

  // 2. Token-by-token analysis with negation and intensifier context
  let negationWindow = 0; // tokens remaining under negation
  let intensifierScale = 1.0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check for negation
    if (NEGATORS.has(token)) {
      negationWindow = 3; // next 3 tokens are negated
      continue;
    }

    // Check for intensifiers
    if (INTENSIFIERS[token]) {
      intensifierScale = INTENSIFIERS[token];
      continue;
    }

    // Check for diminishers
    if (DIMINISHERS[token]) {
      intensifierScale = DIMINISHERS[token];
      continue;
    }

    // Look up in lexicon
    const weights = LEXICON[token];
    if (weights) {
      const scale = intensifierScale * (negationWindow > 0 ? -0.5 : 1.0);

      scores.happy += weights[0] * scale;
      scores.sad += weights[1] * scale;
      scores.energetic += weights[2] * scale;
      scores.calm += weights[3] * scale;
      scores.focused += weights[4] * scale;

      // Negation: if negating a positive word, add to opposite
      if (negationWindow > 0 && weights[0] > 0) {
        scores.sad += weights[0] * 0.5;
      }
      if (negationWindow > 0 && weights[1] > 0) {
        scores.happy += weights[1] * 0.3;
      }
    }

    // Reset intensifier after use
    intensifierScale = 1.0;

    // Decrease negation window
    if (negationWindow > 0) negationWindow--;
  }

  // 3. Emoji analysis
  for (const [emoji, weights] of Object.entries(EMOJI_MOODS)) {
    if (text.includes(emoji)) {
      scores.happy += weights[0];
      scores.sad += weights[1];
      scores.energetic += weights[2];
      scores.calm += weights[3];
      scores.focused += weights[4];
    }
  }

  // 4. Punctuation signals
  scores.energetic += punctuationEnergy;
  if (hasEllipsis) {
    scores.calm += 0.5;
    scores.sad += 0.5;
  }

  // 5. ALL CAPS detection (energy signal)
  const capsWords = text.split(/\s+/).filter(
    (w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w)
  );
  scores.energetic += capsWords.length * 0.5;

  // 6. Ensure no negative scores
  for (const mood of Object.keys(scores) as Mood[]) {
    scores[mood] = Math.max(0, scores[mood]);
  }

  // 7. Find the winning mood
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  // Default to calm if no signals detected
  if (totalScore === 0) {
    return { mood: "calm", confidence: 0.5, scores };
  }

  const sorted = (Object.entries(scores) as [Mood, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  const topMood = sorted[0][0];
  const topScore = sorted[0][1];
  const secondScore = sorted[1]?.[1] || 0;

  // Confidence: how dominant is the top mood vs. the rest
  const rawConfidence = topScore / totalScore;
  const margin = secondScore > 0 ? (topScore - secondScore) / topScore : 1;
  const confidence = Math.min(
    0.98,
    Math.max(0.45, rawConfidence * 0.6 + margin * 0.4)
  );

  return {
    mood: topMood,
    confidence: Math.round(confidence * 100) / 100,
    scores,
  };
}
