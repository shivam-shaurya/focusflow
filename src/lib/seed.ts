import type { Block, BlockItem, DailyGoal } from './types'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

const items = (...texts: string[]): BlockItem[] =>
  texts.map((text) => ({ id: uid(), text }))

const checks = (...texts: string[]): BlockItem[] =>
  texts.map((text) => ({ id: uid(), text, done: false }))

export const DEFAULT_GOAL_NAMES: string[] = [
  'Meditation',
  'Interpersonal skills',
  'Reading',
  'Sales',
  'Studying',
  'Workout',
  'Running',
]

export const seedGoals = (): DailyGoal[] =>
  DEFAULT_GOAL_NAMES.map((name, order) => ({
    id: uid(),
    name,
    emoji: '',
    description: '',
    notes: {},
    history: [],
    order,
  }))

/**
 * The "New Me" page ships with the user's own re-read-daily material as the
 * starting content. Every line is editable and every block can be deleted.
 */
export const seedBlocks = (): Block[] => {
  let order = 0
  const b = (
    title: string,
    subtitle: string,
    kind: Block['kind'],
    tone: Block['tone'],
    blockItems: BlockItem[],
    open = false,
  ): Block => ({
    id: uid(), title, subtitle, kind, tone, items: blockItems, order: order++, open,
  })

  return [
    b(
      'Read everyday',
      'RULES that need to be drummed into your head as default codes',
      'bullets',
      'neutral',
      items(
        'Failures are data points to learn from. Learn. Apply. Adapt immediately. And pivot.',
        'Most of your doubts are temporary noise. If you ignore them, you will forget they even came.',
        'Your self-doubts may be triggered by specific stressors: sad music, a certain kind of reel at a certain time of day. This is not real. These are shadows of things that existed. Let them pass — and once they do, don’t look back.',
        'You will be discouraged. It is normal.',
        'Dropout rate is highest at the beginning; frustration will be highest. It is normal.',
      ),
      true,
    ),
    b(
      'Read everyday or whenever in doubt',
      'The long-form reminders that stop a spiral',
      'bullets',
      'neutral',
      items(
        'Time will solve the emotions of your problems. You will waste a lot of time if you believe you can solve everything by problem-solving alone. A lot of the time all you need is a conclusion — “I don’t need this”, or “this happens once that is achieved”. The brain will still bring it up. That is when you have to become extremely busy. You cannot choose to put it in the background; it gets placed there by actions toward what you put in the foreground.',
        'If you have a solution or conclusion, stick with it. It may take 3 months to apply. Impatience to make it happen instantly will make it 3 years.',
        'Be a train that has set off to its destination. There is no point stopping once you know what you know.',
        'One of the best ways to end overthinking is staying busy. Decide what to do and do exactly that.',
        'Your moods and ideas swing back like a pendulum. Allow it. Feeling something does not mean it reveals a grand truth. “I miss my ex, therefore she was the one” is a logical fallacy. (a) It is temporary. (b) There is no grand revelation. (c) No need to overthink — stick to the plan. (d) In time it stops completely.',
      ),
    ),
    b(
      'Learnings about you',
      'Things that expose you · self-destructive patterns',
      'bullets',
      'danger',
      items(
        'Self-awareness',
        'Self-knowledge',
        'You can’t betray yourself anymore',
        'Action → self-destructive → repeating the same pattern',
      ),
    ),
    b(
      'Preventive measures',
      'What is destructive, and how to cleverly stop it in the moment',
      'bullets',
      'warn',
      items(
        'Thing you found out about yourself that is destructive: …',
        'How to cleverly prevent it from happening in the moment: …',
      ),
    ),
    b(
      'Everything about your behavior',
      'Data drop — objective, unflattering, specific',
      'bullets',
      'neutral',
      items(
        'Objective data: what actually happened, not what it meant.',
        'Mujhe lagta hai (nahi chahiye): …',
      ),
    ),
    b(
      'A specific problem',
      'Triggers · roots · extent · how often repeated · similarities to the past',
      'prompts',
      'danger',
      items(
        'Triggers',
        'Roots',
        'Extent',
        'Past mein kitni baar repeat kiya hai',
        'Kitni similarities hain from past experiences and current',
      ),
    ),
    b(
      'My purpose',
      'Concrete, dated, checkable',
      'checklist',
      'gold',
      checks(
        '6 months mein ye skill seekhna hai: …',
        'Ghar mein itna paisa transfer karna hai: …',
        'Itna invest karna hai: …',
        'Weight gain / lose karna hai: …',
        'College mein something specific: …',
      ),
    ),
    b(
      'Visualization',
      'Things I need to buy — paste a link and an image',
      'links',
      'blue',
      [
        { id: uid(), text: 'Car', url: '', image: '' },
        { id: uid(), text: 'House', url: '', image: '' },
      ],
    ),
    b(
      'Data drop',
      'Run this on anything that keeps pulling at you',
      'prompts',
      'neutral',
      items(
        'Word by word, instance by instance — what is happening?',
        'How is it affecting you?',
        'What specific things cause the anxiety? (moments, events, instances, people)',
      ),
    ),
  ]
}
