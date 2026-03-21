import { getDayOfYear } from '@/utils/getDayOfYear';

export type PromptCategory =
  | 'On focus'
  | 'On the body'
  | 'On letting go'
  | 'On connection'
  | 'On effort'
  | 'On stillness';

export type ImageAssetKey =
  | 'focus_1' | 'focus_2'
  | 'body_1' | 'body_2'
  | 'letting_1' | 'letting_2'
  | 'connection_1' | 'connection_2'
  | 'effort_1' | 'effort_2'
  | 'stillness_1' | 'stillness_2';

export interface JournalPrompt {
  text: string;
  reflect: string;
  category: PromptCategory;
  imageAsset: ImageAssetKey;
}

const PROMPTS: JournalPrompt[] = [
  {
    category: 'On focus',
    imageAsset: 'focus_1',
    text: 'What is pulling your attention right now, and is that where you want it?',
    reflect: 'Focus is finite. When we name what is taking up our attention, we often discover we have been giving it without choosing to. This prompt invites you to audit your mind — not with judgment, but with curiosity.',
  },
  {
    category: 'On focus',
    imageAsset: 'focus_2',
    text: 'Describe a moment when you were so absorbed in something that time disappeared. What made that possible?',
    reflect: 'Deep engagement — sometimes called flow — tends to emerge when challenge meets skill in just the right proportion. Revisiting these moments can reveal what conditions help you do your best thinking.',
  },
  {
    category: 'On focus',
    imageAsset: 'focus_1',
    text: 'What are you avoiding thinking about? What might happen if you gave it your full attention for ten minutes?',
    reflect: 'Avoidance is exhausting. The mind spends energy steering around things it does not want to face — often more energy than it would take to simply look. This prompt asks you to try, just briefly, to look.',
  },
  {
    category: 'On focus',
    imageAsset: 'focus_2',
    text: 'When does your mind feel clearest? What is true of those moments that is not true of others?',
    reflect: 'Mental clarity is not always a matter of discipline — it often has everything to do with conditions: time of day, body state, environment, the presence or absence of noise. Understanding your patterns is the first step to creating more of them.',
  },
  {
    category: 'On focus',
    imageAsset: 'focus_1',
    text: 'What single thing, if you truly gave your full attention to it today, would make the most difference?',
    reflect: 'Not everything deserves equal weight. This question cuts through the noise of a long to-do list and asks you to make a real choice — not about what is urgent, but about what matters.',
  },
  {
    category: 'On the body',
    imageAsset: 'body_1',
    text: 'Where in your body are you carrying tension right now? What might that tension be trying to tell you?',
    reflect: 'The body keeps a kind of running record of what we have not had time to process. Tightness in the jaw, weight in the chest, a held breath — these are not just physical sensations. They are messages. This prompt asks you to translate them.',
  },
  {
    category: 'On the body',
    imageAsset: 'body_2',
    text: 'Describe how your body feels today — not how you look, but how you feel from the inside.',
    reflect: 'We spend a great deal of time observing how our bodies appear to others, and much less time noticing what they feel like to inhabit. This is an invitation to turn that attention inward.',
  },
  {
    category: 'On the body',
    imageAsset: 'body_1',
    text: 'When did your body last feel genuinely rested? What would it take to feel that way again?',
    reflect: 'Rest is not the same as sleep, and exhaustion is not always cured by it. This question asks you to think honestly about what restoration actually requires — and what you might need to stop or start doing to get there.',
  },
  {
    category: 'On the body',
    imageAsset: 'body_2',
    text: 'Is there something your body has been asking for lately that you have not given it? What would happen if you listened?',
    reflect: 'The body communicates clearly and persistently — through appetite, fatigue, restlessness, sensation. Most of us have learned to override these signals. This prompt invites you to hear them instead.',
  },
  {
    category: 'On the body',
    imageAsset: 'body_1',
    text: 'What physical sensation are you most aware of right now? Stay with it for a moment before you write.',
    reflect: 'Presence begins with sensation. Before thought, there is the body — breathing, pulsing, feeling. This prompt asks you to start there, and see what emerges when you do.',
  },
  {
    category: 'On letting go',
    imageAsset: 'letting_1',
    text: 'What are you holding onto that may have already served its purpose?',
    reflect: 'We often cling to things — identities, habits, relationships, ideas — long after they have stopped serving us. Not out of need, but out of familiarity. This prompt asks you to look honestly at what might be ready to be released.',
  },
  {
    category: 'On letting go',
    imageAsset: 'letting_2',
    text: 'Describe something from the past year that you are still carrying. What would it feel like to set it down?',
    reflect: 'Not everything that has happened to us needs to be carried forward. Some things can simply be acknowledged — held for a moment, then released. This is less about forgetting and more about freeing up space for what is next.',
  },
  {
    category: 'On letting go',
    imageAsset: 'letting_1',
    text: 'Is there a grudge, resentment, or disappointment you have been holding? What has keeping it cost you?',
    reflect: 'Resentment is sometimes described as drinking poison and expecting someone else to suffer. This prompt does not ask you to excuse anything — only to honestly consider what it costs you to keep holding on.',
  },
  {
    category: 'On letting go',
    imageAsset: 'letting_2',
    text: 'What version of yourself are you ready to outgrow?',
    reflect: 'Growth requires release. The person you are becoming cannot fully arrive until you let go of the person you have been. This prompt asks you to name, with some gentleness, what part of your old story might be holding you back.',
  },
  {
    category: 'On letting go',
    imageAsset: 'letting_1',
    text: 'If you could leave one worry behind today — not solve it, just release it — what would you choose?',
    reflect: 'We rarely have permission to simply let something go without resolution. This prompt gives you that permission. Some things do not need to be fixed to be set down — at least for now.',
  },
  {
    category: 'On connection',
    imageAsset: 'connection_1',
    text: 'Who in your life makes you feel most understood? What does that understanding feel like?',
    reflect: 'Feeling truly understood — not agreed with, but seen — is one of the deepest human experiences. Naming the people who offer this, and what it feels like when they do, helps us understand what we most need in our closest relationships.',
  },
  {
    category: 'On connection',
    imageAsset: 'connection_2',
    text: 'Is there a relationship in your life you have been neglecting? What would reaching out look like?',
    reflect: 'Connection requires maintenance, and the relationships we value most can quietly drift when life gets crowded. This prompt is a gentle nudge — not to fix everything at once, but to begin.',
  },
  {
    category: 'On connection',
    imageAsset: 'connection_1',
    text: 'Describe a moment of unexpected kindness from a stranger or acquaintance that stayed with you.',
    reflect: 'Small moments of unexpected warmth can lodge themselves in memory long after larger events have faded. Revisiting them reminds us how much ordinary human contact can matter — and how little it often takes to matter to someone else.',
  },
  {
    category: 'On connection',
    imageAsset: 'connection_2',
    text: 'What do you find difficult to share with the people closest to you? What stops you?',
    reflect: 'We keep things from the people we love for many reasons — protecting them, protecting ourselves, not wanting to seem weak or broken. This prompt asks you to look honestly at what you keep hidden, and what it would mean to let someone in.',
  },
  {
    category: 'On connection',
    imageAsset: 'connection_1',
    text: 'In what ways have you felt most alone lately? In what ways have you felt most connected?',
    reflect: 'Loneliness and connection often coexist. We can feel isolated even in company, and surprisingly connected in solitude. Holding both truths at once — without forcing resolution — is sometimes the most honest place to start.',
  },
  {
    category: 'On effort',
    imageAsset: 'effort_1',
    text: 'Where in your life are you pushing harder than may be necessary? Where might more rest actually serve the work?',
    reflect: 'We live in a culture that equates effort with virtue. But some of the best work — and some of the deepest growth — requires stepping back, not pushing forward. This prompt asks you to consider where effort might be working against you.',
  },
  {
    category: 'On effort',
    imageAsset: 'effort_2',
    text: 'Describe a time when sustained effort led to something you are genuinely proud of. What kept you going?',
    reflect: 'Persistence is not just discipline — it is fueled by something: meaning, stubbornness, love, necessity. Knowing what has kept you going in the past can tell you a great deal about what you truly value.',
  },
  {
    category: 'On effort',
    imageAsset: 'effort_1',
    text: 'What is something you are trying to improve that is not progressing the way you hoped? What might need to change?',
    reflect: 'Effort applied in the same way, repeatedly, does not always produce different results. Sometimes growth requires not more effort but different effort — a shift in approach, a new perspective, or an honest look at whether we are working on the right thing.',
  },
  {
    category: 'On effort',
    imageAsset: 'effort_2',
    text: 'When does striving feel meaningful to you, and when does it feel compulsive? What is the difference?',
    reflect: 'Not all effort comes from the same place. Some striving is purposeful and life-giving. Some is driven by anxiety, comparison, or a feeling of never being enough. Learning to tell them apart is one of the quieter forms of wisdom.',
  },
  {
    category: 'On effort',
    imageAsset: 'effort_1',
    text: 'Is there something you have been putting off because you are afraid it will not be good enough? What would good enough actually look like?',
    reflect: 'Perfectionism is often postponement in disguise. This prompt asks you to name the fear underneath the delay — and to define what a genuine, imperfect, sufficient effort might look like.',
  },
  {
    category: 'On stillness',
    imageAsset: 'stillness_1',
    text: 'When did you last experience genuine quiet — not just silence, but actual stillness inside? What do you remember about it?',
    reflect: 'Silence and stillness are not the same thing. We can be surrounded by quiet and still be internally noisy. This prompt asks you to recall a moment of deeper stillness — and to notice what allowed it to exist.',
  },
  {
    category: 'On stillness',
    imageAsset: 'stillness_2',
    text: 'What happens when you sit with yourself without any distraction? What tends to surface?',
    reflect: 'Distraction is often a way of managing what we might find in the quiet. This prompt does not ask you to fix what surfaces — only to notice it, gently and without judgment.',
  },
  {
    category: 'On stillness',
    imageAsset: 'stillness_1',
    text: 'Describe a place — real or imagined — where you feel completely at rest. What does it offer you that your daily life does not?',
    reflect: 'Our private images of peace can tell us a great deal about what we most need. Whether the place is a memory, a dream, or something entirely invented, the qualities it offers are real and worth seeking out.',
  },
  {
    category: 'On stillness',
    imageAsset: 'stillness_2',
    text: 'What small rituals help you return to yourself when life feels too fast or too loud?',
    reflect: 'Not all restoration requires a retreat or a vacation. Often it lives in small, repeatable acts — a particular tea, a specific walk, a few minutes alone with a window. These rituals are worth naming so you can return to them.',
  },
  {
    category: 'On stillness',
    imageAsset: 'stillness_1',
    text: 'Is there something you are waiting to feel ready for? What might already be enough?',
    reflect: 'Readiness is often a feeling we wait for but rarely notice arriving. This prompt asks whether the waiting itself might be the thing keeping you still — and whether stillness, here, has become a way of staying safe rather than a place of renewal.',
  },
];

export default PROMPTS;

export const dailyQuotes = [
  { text: 'The present moment is the only moment available to us, and it is the door to all moments.', author: 'Thich Nhat Hanh' },
  { text: 'You cannot always control what goes on outside, but you can always control what goes on inside.', author: 'Wayne Dyer' },
  { text: 'To write is to descend, to excavate, to go underground.', author: 'Anaïs Nin' },
  { text: 'Almost everything will work again if you unplug it for a few minutes — including you.', author: 'Anne Lamott' },
  { text: 'The quieter you become, the more you are able to hear.', author: 'Rumi' },
  { text: 'What we do not make conscious emerges later as fate.', author: 'Carl Jung' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'You are not the darkness you endured. You are the light that refused to surrender.', author: 'John Mark Green' },
  { text: 'Nothing ever goes away until it has taught us what we need to know.', author: 'Pema Chödrön' },
  { text: 'The first step is to know and feel that we are responsible for our choices.', author: 'Viktor Frankl' },
  { text: 'Feelings are just visitors. Let them come and go.', author: 'Mooji' },
  { text: 'To be fully present is to be alive to what is, not what we wish things were.', author: 'Tara Brach' },
  { text: 'You do not need to be fixed. You need to be seen.', author: 'Glennon Doyle' },
  { text: 'The cave you fear to enter holds the treasure you seek.', author: 'Joseph Campbell' },
  { text: 'Between stimulus and response there is a space. In that space is our power.', author: 'Viktor Frankl' },
  { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
  { text: 'Self-compassion is simply giving the same kindness to ourselves that we would give to others.', author: 'Christopher Germer' },
  { text: 'Growth and comfort do not coexist.', author: 'Ginni Rometty' },
  { text: 'You are allowed to be both a masterpiece and a work in progress simultaneously.', author: 'Sophia Bush' },
  { text: 'Whatever you are not changing, you are choosing.', author: 'Laurie Buchanan' },
  { text: 'The curious paradox is that when I accept myself just as I am, then I can change.', author: 'Carl Rogers' },
  { text: 'Do not be afraid of your own depths.', author: 'Kahlil Gibran' },
  { text: 'We repeat what we do not repair.', author: 'Christine Langley-Obaugh' },
  { text: 'Sometimes the bravest thing you can do is feel.', author: 'Brené Brown' },
  { text: 'Rest is not idleness, and to lie sometimes on the grass on a summer day is by no means waste of time.', author: 'John Lubbock' },
  { text: 'The only way out is through.', author: 'Robert Frost' },
  { text: 'You can\'t go back and change the beginning, but you can start where you are and change the ending.', author: 'C.S. Lewis' },
  { text: 'What would you do if you weren\'t afraid?', author: 'Sheryl Sandberg' },
  { text: 'There is no greater agony than bearing an untold story inside you.', author: 'Maya Angelou' },
  { text: 'Tension is who you think you should be. Relaxation is who you are.', author: 'Chinese Proverb' },
];

export function getTodayPrompt(): JournalPrompt {
  return PROMPTS[(getDayOfYear() - 1) % PROMPTS.length];
}

export function getTodayQuote(): typeof dailyQuotes[0] {
  return dailyQuotes[(getDayOfYear() - 1) % dailyQuotes.length];
}

export function getGradientIndex(): number {
  return getDayOfYear() % 6;
}

export function getRandomPromptByCategory(category: PromptCategory): JournalPrompt {
  const filtered = PROMPTS.filter(p => p.category === category);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  'On focus',
  'On the body',
  'On letting go',
  'On connection',
  'On effort',
  'On stillness',
];
