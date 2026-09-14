import { parseISO } from './date'

export interface Quote {
  text: string
  author?: string
}

/**
 * Bundled so the quote works offline like everything else. Attributed lines are
 * from public-domain writers; the unattributed ones are house lines written for
 * this app. Chosen for ADHD-shaped problems — starting, finishing, and being
 * unkind to yourself — rather than generic hustle.
 */
export const QUOTES: Quote[] = [
  { text: 'Well begun is half done.', author: 'Aristotle' },
  { text: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca' },
  { text: 'You could leave life right now. Let that determine what you do and say and think.', author: 'Marcus Aurelius' },
  { text: 'No man ever steps in the same river twice, for it is not the same river and he is not the same man.', author: 'Heraclitus' },
  { text: 'It does not matter how slowly you go so long as you do not stop.', author: 'Confucius' },
  { text: 'The beginning is the most important part of the work.', author: 'Plato' },
  { text: 'First say to yourself what you would be; then do what you have to do.', author: 'Epictetus' },
  { text: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche' },
  { text: 'Whatever you can do, or dream you can, begin it. Boldness has genius, power and magic in it.', author: 'Goethe' },
  { text: 'That which we persist in doing becomes easier — not that the nature of the task has changed, but our ability to do has increased.', author: 'Ralph Waldo Emerson' },
  { text: 'It is not enough to be busy. The question is: what are we busy about?', author: 'Henry David Thoreau' },
  { text: 'Nothing is particularly hard if you divide it into small jobs.', author: 'Henry Ford' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Continuous effort — not strength or intelligence — is the key to unlocking our potential.', author: 'Winston Churchill' },
  { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
  { text: 'Order and simplification are the first steps toward mastery.', author: 'Thomas Mann' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act but a habit.', author: 'Will Durant' },
  { text: 'Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.', author: 'Antoine de Saint-Exupéry' },
  { text: 'How does a project get to be a year late? One day at a time.', author: 'Fred Brooks' },
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'Do not wait to strike till the iron is hot; make it hot by striking.', author: 'William Butler Yeats' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { text: 'Little by little, a little becomes a lot.', author: 'Tanzanian proverb' },
  { text: 'The best time to plant a tree was twenty years ago. The second best time is now.', author: 'Proverb' },

  { text: 'Starting badly still counts. Finishing is a separate skill you can learn later.' },
  { text: 'You do not need motivation. You need the first two minutes.' },
  { text: 'A messy hour of work beats a perfect plan you never opened.' },
  { text: 'The task is not as big as the dread of the task.' },
  { text: 'Missing a day is a gap. Missing the day after is a habit. Come back tomorrow.' },
  { text: 'Pick the one thing. The other twelve will still be there, and most of them do not matter.' },
  { text: 'Your brain is not broken. It just runs on interest and urgency instead of importance — so make it interesting, or make it small.' },
  { text: 'Write it down. Working memory is not storage, and yours is being asked to do a filing cabinet’s job.' },
  { text: 'Deadlines do not care how you feel. But you can care how you feel and still open the file.' },
  { text: 'Doing it imperfectly today beats doing it properly never.' },
  { text: 'Shrink the task until it stops being scary, then shrink it once more.' },
  { text: 'Progress you did not record feels like no progress at all. Log it.' },
  { text: 'You are allowed to stop when the timer ends. That is the whole deal.' },
  { text: 'The hardest part of the day is the ten minutes before you start.' },
  { text: 'Compare today to yesterday, not to the person you imagine you should be.' },
  { text: 'Boredom is the tax on the work that pays. Pay it and move on.' },
  { text: 'A plan that assumes a perfect week is not a plan; it is a wish.' },
  { text: 'Three hours today is worth more than a heroic twelve next Sunday that never happens.' },
  { text: 'Guilt is not a strategy. Adjust the number and carry on.' },
  { text: 'You cannot decide what your brain puts in the background. You can decide what you put in the foreground.' },
]

/**
 * Stable within a day, different the next. Derived from the date so every device
 * shows the same quote, with no storage and no randomness to persist.
 */
export function quoteOfTheDay(dateISO: string): Quote {
  const d = parseISO(dateISO)
  // Days since epoch, so consecutive days step through the list rather than
  // hashing to the same bucket twice in a row.
  const day = Math.floor(d.getTime() / 86_400_000)
  // A stride coprime with the list length walks the whole set before repeating.
  const stride = 17
  return QUOTES[((day * stride) % QUOTES.length + QUOTES.length) % QUOTES.length]
}
