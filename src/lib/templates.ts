export interface Field {
  id: string
  q: string
  hint?: string
  rows?: number
}

export interface Template {
  id: string
  name: string
  blurb: string
  fields: Field[]
}

/**
 * Journaling templates. The reflective ones are for the end of a day; the
 * problem-solving ones are for when something specific is stuck.
 */
export const TEMPLATES: Template[] = [
  {
    id: 'daily',
    name: 'Daily reflection',
    blurb: 'The default end-of-day pass. Short answers are fine.',
    fields: [
      { id: 'started', q: 'What did I actually start today?', hint: 'Starting counts. Finishing is a separate skill.' },
      { id: 'derail', q: 'What pulled me off track, and when?', hint: 'Name the trigger, not the character flaw.' },
      { id: 'easy', q: 'What felt easier than expected?', hint: 'Clues about when your brain cooperates.' },
      { id: 'body', q: 'How did sleep, food, and movement land?', hint: 'Regulation sits upstream of focus.' },
      { id: 'tomorrow', q: 'What is the one thing for tomorrow?', hint: 'One. So morning-you does not negotiate.' },
    ],
  },
  {
    id: 'datadrop',
    name: 'Data drop',
    blurb: 'Dump the raw material before trying to solve anything.',
    fields: [
      { id: 'dd-what', q: 'Word by word, instance by instance — what is happening?', rows: 6 },
      { id: 'dd-effect', q: 'How is it affecting you?', rows: 4 },
      { id: 'dd-anxiety', q: 'What specific things cause the anxiety?', hint: 'Moments, events, instances, people — be specific.', rows: 4 },
      { id: 'dd-objective', q: 'Strip the story out. What is the objective data?', rows: 3 },
    ],
  },
  {
    id: 'problem',
    name: 'Problem breakdown',
    blurb: 'Triggers, roots, extent, and how often this has repeated.',
    fields: [
      { id: 'pb-name', q: 'Name the problem in one line.', rows: 2 },
      { id: 'pb-triggers', q: 'Triggers — what sets it off?', rows: 3 },
      { id: 'pb-roots', q: 'Roots — where does this actually come from?', rows: 3 },
      { id: 'pb-extent', q: 'Extent — how much of your day/week does it eat?', rows: 3 },
      { id: 'pb-repeat', q: 'How many times have you repeated this pattern before?', rows: 3 },
      { id: 'pb-similar', q: 'What is similar between past instances and this one?', rows: 3 },
    ],
  },
  {
    id: 'solve',
    name: 'Solve it',
    blurb: 'Conclusion first, then the smallest next action.',
    fields: [
      { id: 'sv-real', q: 'Is this a real problem or a moving cloud?', hint: 'If it passes on its own in 48 hours, it was weather.' },
      { id: 'sv-control', q: 'What part of this is actually in your control?', rows: 3 },
      { id: 'sv-conclusion', q: 'What is the conclusion you are choosing?', hint: '“I don’t need this”, or “this resolves once X happens”.', rows: 3 },
      { id: 'sv-cost', q: 'What does it cost to keep carrying this?', rows: 3 },
      { id: 'sv-next', q: 'What is the first 2-minute piece of the fix?', rows: 2 },
      { id: 'sv-busy', q: 'What will you be busy with instead?', hint: 'The background is chosen by what you put in the foreground.', rows: 2 },
    ],
  },
  {
    id: 'whys',
    name: '5 whys',
    blurb: 'Chase one thread down to the actual cause.',
    fields: [
      { id: 'w0', q: 'What went wrong?', rows: 2 },
      { id: 'w1', q: 'Why? (1)', rows: 2 },
      { id: 'w2', q: 'Why? (2)', rows: 2 },
      { id: 'w3', q: 'Why? (3)', rows: 2 },
      { id: 'w4', q: 'Why? (4)', rows: 2 },
      { id: 'w5', q: 'Why? (5) — the one worth fixing', rows: 3 },
    ],
  },
  {
    id: 'prevent',
    name: 'Preventive measures',
    blurb: 'Turn a pattern you just spotted into a rule for next time.',
    fields: [
      { id: 'pv-pattern', q: 'What self-destructive pattern showed up?', rows: 3 },
      { id: 'pv-signal', q: 'What is the earliest signal it is starting?', hint: 'The earlier you catch it, the cheaper it is.', rows: 3 },
      { id: 'pv-clever', q: 'How do you cleverly prevent it in the moment?', hint: 'Change the environment, not the willpower.', rows: 4 },
      { id: 'pv-rule', q: 'Write it as a one-line rule for the New Me page.', rows: 2 },
    ],
  },
  {
    id: 'kind',
    name: 'Self-compassion',
    blurb: 'For the days that went badly.',
    fields: [
      { id: 'k-facts', q: 'What actually happened, without the commentary?', rows: 3 },
      { id: 'k-friend', q: 'What would you say to a friend who had this exact day?', rows: 4 },
      { id: 'k-say', q: 'Now say it to yourself, in writing.', rows: 3 },
      { id: 'k-keep', q: 'What are you keeping from today?', rows: 2 },
    ],
  },
]

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
