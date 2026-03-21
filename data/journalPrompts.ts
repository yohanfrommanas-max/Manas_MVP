import { getDayOfYear } from '@/utils/getDayOfYear';

export type PromptCategory =
  | 'Gratitude'
  | 'Self-Reflection'
  | 'Growth'
  | 'Emotion'
  | 'Relationships'
  | 'Creativity'
  | 'Purpose';

export interface JournalPrompt {
  text: string;
  category: PromptCategory;
}

const PROMPTS: JournalPrompt[] = [
  { category: 'Gratitude', text: 'What is something small that happened today that you are genuinely glad occurred?' },
  { category: 'Gratitude', text: 'Who in your life makes difficult things easier? What would you want them to know?' },
  { category: 'Gratitude', text: 'Describe a place you have been that made you feel immediately at home. What was it about that place?' },
  { category: 'Gratitude', text: 'What is something about your body — the way it works, something it can do — that you rarely think to appreciate?' },
  { category: 'Self-Reflection', text: 'What belief have you quietly held for years that you have recently started to question?' },
  { category: 'Self-Reflection', text: 'When do you feel most like yourself — most at ease, most present, most alive?' },
  { category: 'Self-Reflection', text: 'Describe a version of yourself from five years ago. What would that person be surprised by?' },
  { category: 'Self-Reflection', text: 'What is something you keep putting off, and what is the real reason you are avoiding it?' },
  { category: 'Self-Reflection', text: 'Where in your life are you spending energy in ways that do not align with what matters to you?' },
  { category: 'Growth', text: 'What is one thing you want to be different in your life a year from now? What would the first step look like?' },
  { category: 'Growth', text: 'Describe a failure or setback that, looking back, taught you something important.' },
  { category: 'Growth', text: 'What skill or quality do you admire in others that you would like to develop in yourself?' },
  { category: 'Growth', text: 'What would you do with your time if you were not afraid of being judged for it?' },
  { category: 'Emotion', text: 'What emotion have you been carrying most this week? Where do you feel it in your body?' },
  { category: 'Emotion', text: 'Describe the last time you cried, or felt close to it. What was happening?' },
  { category: 'Emotion', text: 'When did you last feel genuinely calm — not distracted, not busy, just calm? What were you doing?' },
  { category: 'Emotion', text: 'Is there something you are angry about that you have not let yourself fully acknowledge?' },
  { category: 'Relationships', text: 'Describe someone in your life who consistently shows up for you. What does that mean to you?' },
  { category: 'Relationships', text: 'Is there a relationship in your life that has changed recently — grown closer, or more distant? What do you think drove that?' },
  { category: 'Relationships', text: 'Is there something you wish you could say to someone but have not? What holds you back?' },
  { category: 'Relationships', text: 'What does a good friendship look like to you? Are you giving that to the people you care about?' },
  { category: 'Relationships', text: 'Think of someone you have lost touch with. What do you remember most clearly about them?' },
  { category: 'Creativity', text: 'What is something you have been curious about lately — something you want to understand better?' },
  { category: 'Creativity', text: 'If you had an entire day with no obligations and no devices, what would you do with the time?' },
  { category: 'Creativity', text: 'Describe something you made — with your hands, your words, your actions — that you felt proud of.' },
  { category: 'Creativity', text: 'What is a question you have been living with recently — one you keep turning over without an answer?' },
  { category: 'Purpose', text: 'What are you doing, even in small ways, that feels meaningful to you right now?' },
  { category: 'Purpose', text: 'If you could spend the rest of your working life doing one thing, knowing it would matter, what would it be?' },
  { category: 'Purpose', text: 'What do you want to be remembered for — not by history, but by the people who knew you?' },
  { category: 'Purpose', text: 'At the end of a good day, what is it that made it good? What does that tell you about your values?' },
];

export default PROMPTS;

export function getTodayPrompt(): JournalPrompt {
  return PROMPTS[(getDayOfYear() - 1) % PROMPTS.length];
}

export function getGradientIndex(): number {
  return getDayOfYear() % 6;
}
