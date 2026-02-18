// ---------------------------------------------------------------------------
// Child-Development – milestone catalogue
// 5 domains (4 core × 9 ages + sensory × 3 baby ages) = 195 milestones
// ---------------------------------------------------------------------------

/* -------------------------------- Types --------------------------------- */

export type DomainId =
  | 'physical'
  | 'speech'
  | 'cognitive'
  | 'social'
  | 'sensory';

export type AgeRangeId =
  | '0-3m'
  | '3-6m'
  | '6-9m'
  | '9-12m'
  | '12-18m'
  | '18-24m'
  | '2-3y'
  | '3-4y'
  | '4-5y';

export interface Milestone {
  /** e.g. "physical-0_3m-01" */
  id: string;
  /** i18n key, e.g. "childDev.ms_physical_0_3m_01" */
  nameKey: string;
  domain: DomainId;
  ageRange: AgeRangeId;
  /** If NOT achieved by the upper end of the age range, warrants discussion */
  isRedFlag: boolean;
}

export interface DomainMeta {
  id: DomainId;
  nameKey: string;
  descKey: string;
  /** Tailwind colour class */
  color: string;
  icon: 'runner' | 'speech-bubble' | 'brain' | 'handshake' | 'baby';
}

export interface AgeRangeMeta {
  id: AgeRangeId;
  labelKey: string;
  /** Inclusive lower bound in months */
  minMonths: number;
  /** Exclusive upper bound in months */
  maxMonths: number;
}

/* ----------------------------- Domain Meta ------------------------------ */

export const DOMAINS: readonly DomainMeta[] = [
  {
    id: 'physical',
    nameKey: 'childDev.domainPhysical',
    descKey: 'childDev.domainPhysicalDesc',
    color: 'bg-blue-500',
    icon: 'runner',
  },
  {
    id: 'speech',
    nameKey: 'childDev.domainSpeech',
    descKey: 'childDev.domainSpeechDesc',
    color: 'bg-purple-500',
    icon: 'speech-bubble',
  },
  {
    id: 'cognitive',
    nameKey: 'childDev.domainCognitive',
    descKey: 'childDev.domainCognitiveDesc',
    color: 'bg-amber-500',
    icon: 'brain',
  },
  {
    id: 'social',
    nameKey: 'childDev.domainSocial',
    descKey: 'childDev.domainSocialDesc',
    color: 'bg-green-500',
    icon: 'handshake',
  },
  {
    id: 'sensory',
    nameKey: 'childDev.domainSensory',
    descKey: 'childDev.domainSensoryDesc',
    color: 'bg-teal-500',
    icon: 'baby',
  },
] as const;

/* --------------------------- Age-Range Meta ----------------------------- */

export const AGE_RANGES: readonly AgeRangeMeta[] = [
  { id: '0-3m', labelKey: 'childDev.ageRange0_3m', minMonths: 0, maxMonths: 3 },
  { id: '3-6m', labelKey: 'childDev.ageRange3_6m', minMonths: 3, maxMonths: 6 },
  { id: '6-9m', labelKey: 'childDev.ageRange6_9m', minMonths: 6, maxMonths: 9 },
  { id: '9-12m', labelKey: 'childDev.ageRange9_12m', minMonths: 9, maxMonths: 12 },
  { id: '12-18m', labelKey: 'childDev.ageRange12_18m', minMonths: 12, maxMonths: 18 },
  { id: '18-24m', labelKey: 'childDev.ageRange18_24m', minMonths: 18, maxMonths: 24 },
  { id: '2-3y', labelKey: 'childDev.ageRange2_3y', minMonths: 24, maxMonths: 36 },
  { id: '3-4y', labelKey: 'childDev.ageRange3_4y', minMonths: 36, maxMonths: 48 },
  { id: '4-5y', labelKey: 'childDev.ageRange4_5y', minMonths: 48, maxMonths: 60 },
] as const;

/* ------------------------------- Helpers -------------------------------- */

/** Build a milestone ID: physical-0_3m-01 */
function msId(domain: DomainId, ageRange: AgeRangeId, seq: number): string {
  const agePart = ageRange.replace(/-/g, '_');
  const seqStr = String(seq).padStart(2, '0');
  return `${domain}-${agePart}-${seqStr}`;
}

/** Build the i18n nameKey from an id */
function nameKey(id: string): string {
  return `childDev.ms_${id.replace(/-/g, '_')}`;
}

/** Shorthand to create a Milestone object */
function ms(
  domain: DomainId,
  ageRange: AgeRangeId,
  seq: number,
  isRedFlag = false,
): Milestone {
  const id = msId(domain, ageRange, seq);
  return { id, nameKey: nameKey(id), domain, ageRange, isRedFlag };
}

/* ------------------------------ Milestones ------------------------------ */

export const MILESTONES: readonly Milestone[] = [
  // ========================================================================
  // PHYSICAL DOMAIN (45 milestones)
  // ========================================================================

  // -- 0-3m --
  ms('physical', '0-3m', 1),        // Raises head briefly when on tummy
  ms('physical', '0-3m', 2),        // Moves arms and legs actively
  ms('physical', '0-3m', 3),        // Brings hands to mouth
  ms('physical', '0-3m', 4),        // Pushes up on arms during tummy time
  ms('physical', '0-3m', 5),        // Opens and closes hands

  // -- 3-6m --
  ms('physical', '3-6m', 1),        // Rolls from tummy to back
  ms('physical', '3-6m', 2, true),  // Holds head steady without support
  ms('physical', '3-6m', 3),        // Pushes up to elbows during tummy time
  ms('physical', '3-6m', 4),        // Reaches for and grasps toys
  ms('physical', '3-6m', 5),        // Brings objects to mouth

  // -- 6-9m --
  ms('physical', '6-9m', 1, true),  // Sits without support
  ms('physical', '6-9m', 2),        // Rolls in both directions
  ms('physical', '6-9m', 3),        // Begins to crawl or scoot
  ms('physical', '6-9m', 4),        // Transfers objects between hands
  ms('physical', '6-9m', 5),        // Rakes food toward self with fingers

  // -- 9-12m --
  ms('physical', '9-12m', 1),       // Pulls to stand holding furniture
  ms('physical', '9-12m', 2),       // Crawls on hands and knees
  ms('physical', '9-12m', 3),       // Cruises along furniture
  ms('physical', '9-12m', 4),       // Uses pincer grasp (thumb and finger)
  ms('physical', '9-12m', 5),       // Picks up small objects with thumb and finger

  // -- 12-18m --
  ms('physical', '12-18m', 1, true), // Walks independently
  ms('physical', '12-18m', 2),       // Stoops to pick up a toy
  ms('physical', '12-18m', 3),       // Stacks two blocks
  ms('physical', '12-18m', 4),       // Begins to use a spoon
  ms('physical', '12-18m', 5),       // Scribbles with a crayon

  // -- 18-24m --
  ms('physical', '18-24m', 1),       // Runs with some stumbling
  ms('physical', '18-24m', 2),       // Kicks a ball forward
  ms('physical', '18-24m', 3),       // Walks up stairs holding a railing
  ms('physical', '18-24m', 4),       // Stacks four or more blocks
  ms('physical', '18-24m', 5),       // Uses a spoon with minimal spilling

  // -- 2-3y --
  ms('physical', '2-3y', 1),        // Runs confidently without falling
  ms('physical', '2-3y', 2),        // Jumps with both feet off the ground
  ms('physical', '2-3y', 3),        // Pedals a tricycle
  ms('physical', '2-3y', 4),        // Walks up and down stairs alternating feet
  ms('physical', '2-3y', 5),        // Turns pages of a book one at a time

  // -- 3-4y --
  ms('physical', '3-4y', 1),        // Hops on one foot
  ms('physical', '3-4y', 2),        // Catches a bounced ball most of the time
  ms('physical', '3-4y', 3),        // Draws a circle when shown how
  ms('physical', '3-4y', 4),        // Uses scissors to cut paper
  ms('physical', '3-4y', 5),        // Dresses and undresses with little help

  // -- 4-5y --
  ms('physical', '4-5y', 1),        // Skips and hops on one foot for several seconds
  ms('physical', '4-5y', 2),        // Catches a small ball with hands only
  ms('physical', '4-5y', 3),        // Draws a person with at least six body parts
  ms('physical', '4-5y', 4),        // Prints some letters and numbers
  ms('physical', '4-5y', 5),        // Uses fork and knife with some help

  // ========================================================================
  // SPEECH / LANGUAGE DOMAIN (45 milestones)
  // ========================================================================

  // -- 0-3m --
  ms('speech', '0-3m', 1, true),  // Startles to loud sounds
  ms('speech', '0-3m', 2),        // Makes cooing and gurgling sounds
  ms('speech', '0-3m', 3),        // Quiets or smiles when spoken to
  ms('speech', '0-3m', 4),        // Cries differently for different needs
  ms('speech', '0-3m', 5),        // Turns head toward sounds

  // -- 3-6m --
  ms('speech', '3-6m', 1),        // Babbles with consonant sounds (ba, da, ma)
  ms('speech', '3-6m', 2),        // Laughs out loud
  ms('speech', '3-6m', 3),        // Responds to own name
  ms('speech', '3-6m', 4),        // Makes sounds to express pleasure and displeasure
  ms('speech', '3-6m', 5),        // Begins to imitate some sounds

  // -- 6-9m --
  ms('speech', '6-9m', 1),        // Babbles strings of consonants (bababa, mamama)
  ms('speech', '6-9m', 2),        // Understands "no"
  ms('speech', '6-9m', 3),        // Responds to name consistently
  ms('speech', '6-9m', 4),        // Uses gestures like reaching to be picked up
  ms('speech', '6-9m', 5),        // Imitates speech sounds

  // -- 9-12m --
  ms('speech', '9-12m', 1, true), // Says "mama" or "dada" with meaning
  ms('speech', '9-12m', 2),       // Understands simple instructions like "give me"
  ms('speech', '9-12m', 3),       // Waves bye-bye
  ms('speech', '9-12m', 4),       // Uses exclamations like "oh-oh!"
  ms('speech', '9-12m', 5),       // Tries to imitate words

  // -- 12-18m --
  ms('speech', '12-18m', 1, true), // Says several single words
  ms('speech', '12-18m', 2),       // Points to show something interesting
  ms('speech', '12-18m', 3),       // Points to one or more body parts when asked
  ms('speech', '12-18m', 4),       // Follows simple spoken instructions
  ms('speech', '12-18m', 5),       // Shakes head "no" and nods "yes"

  // -- 18-24m --
  ms('speech', '18-24m', 1, true), // Uses at least 50 words
  ms('speech', '18-24m', 2),       // Begins to combine two words ("more milk")
  ms('speech', '18-24m', 3),       // Points to things in a book when named
  ms('speech', '18-24m', 4),       // Follows two-step instructions ("pick up the toy and put it on the table")
  ms('speech', '18-24m', 5),       // Names items in a picture book

  // -- 2-3y --
  ms('speech', '2-3y', 1, true),  // Speaks in 2-3 word sentences
  ms('speech', '2-3y', 2),        // Uses pronouns (I, you, me)
  ms('speech', '2-3y', 3),        // Strangers can understand most words
  ms('speech', '2-3y', 4),        // Asks "what" and "where" questions
  ms('speech', '2-3y', 5),        // Follows two-step unrelated instructions

  // -- 3-4y --
  ms('speech', '3-4y', 1),        // Tells a story with a beginning, middle, and end
  ms('speech', '3-4y', 2, true),  // Speaks clearly enough for strangers to understand
  ms('speech', '3-4y', 3),        // Uses four- to five-word sentences
  ms('speech', '3-4y', 4),        // Asks "why" and "how" questions
  ms('speech', '3-4y', 5),        // Knows some basic rules of grammar

  // -- 4-5y --
  ms('speech', '4-5y', 1),        // Uses future tense ("I will go")
  ms('speech', '4-5y', 2),        // Tells a longer story with details
  ms('speech', '4-5y', 3),        // Says full name and address
  ms('speech', '4-5y', 4),        // Speaks in complete sentences of five or more words
  ms('speech', '4-5y', 5),        // Understands rhyming words

  // ========================================================================
  // COGNITIVE DOMAIN (45 milestones)
  // ========================================================================

  // -- 0-3m --
  ms('cognitive', '0-3m', 1),        // Watches faces intently
  ms('cognitive', '0-3m', 2, true),  // Follows moving objects with eyes
  ms('cognitive', '0-3m', 3),        // Recognizes familiar people at a distance
  ms('cognitive', '0-3m', 4),        // Begins to act bored if activity doesn't change
  ms('cognitive', '0-3m', 5),        // Shows preference for familiar faces

  // -- 3-6m --
  ms('cognitive', '3-6m', 1),        // Explores objects by putting them in mouth
  ms('cognitive', '3-6m', 2),        // Reaches for nearby objects
  ms('cognitive', '3-6m', 3),        // Shows curiosity and looks around
  ms('cognitive', '3-6m', 4),        // Begins to pass things from one hand to the other
  ms('cognitive', '3-6m', 5),        // Watches a toy as it falls to the floor

  // -- 6-9m --
  ms('cognitive', '6-9m', 1),        // Looks for hidden objects (object permanence emerging)
  ms('cognitive', '6-9m', 2),        // Bangs two objects together
  ms('cognitive', '6-9m', 3),        // Explores objects in many ways (shaking, throwing)
  ms('cognitive', '6-9m', 4),        // Finds partially hidden objects easily
  ms('cognitive', '6-9m', 5),        // Watches the path of a falling object

  // -- 9-12m --
  ms('cognitive', '9-12m', 1),       // Finds hidden objects easily
  ms('cognitive', '9-12m', 2),       // Looks at correct picture when named
  ms('cognitive', '9-12m', 3),       // Imitates gestures
  ms('cognitive', '9-12m', 4),       // Begins to use objects correctly (cup, hairbrush)
  ms('cognitive', '9-12m', 5),       // Explores objects by poking with index finger

  // -- 12-18m --
  ms('cognitive', '12-18m', 1),       // Explores cause and effect (push button, hear sound)
  ms('cognitive', '12-18m', 2, true), // Points to get attention of others
  ms('cognitive', '12-18m', 3),       // Identifies one or more body parts
  ms('cognitive', '12-18m', 4),       // Follows simple one-step verbal commands
  ms('cognitive', '12-18m', 5),       // Shows interest in a doll by feeding it

  // -- 18-24m --
  ms('cognitive', '18-24m', 1),       // Sorts shapes and colors
  ms('cognitive', '18-24m', 2),       // Completes simple puzzles (2-3 pieces)
  ms('cognitive', '18-24m', 3, true), // Begins make-believe play
  ms('cognitive', '18-24m', 4),       // Finds things hidden under two or three layers
  ms('cognitive', '18-24m', 5),       // Follows two-step instructions

  // -- 2-3y --
  ms('cognitive', '2-3y', 1),        // Sorts objects by shape and color
  ms('cognitive', '2-3y', 2),        // Completes 3-4 piece puzzles
  ms('cognitive', '2-3y', 3),        // Understands concept of "two"
  ms('cognitive', '2-3y', 4, true),  // Engages in multi-step pretend play
  ms('cognitive', '2-3y', 5),        // Names some colors and numbers

  // -- 3-4y --
  ms('cognitive', '3-4y', 1),        // Understands the concept of counting and knows a few numbers
  ms('cognitive', '3-4y', 2),        // Draws a person with 2-4 body parts
  ms('cognitive', '3-4y', 3),        // Begins to understand the concept of time
  ms('cognitive', '3-4y', 4, true),  // Follows three-part instructions
  ms('cognitive', '3-4y', 5),        // Recalls parts of a story

  // -- 4-5y --
  ms('cognitive', '4-5y', 1),        // Counts ten or more objects
  ms('cognitive', '4-5y', 2),        // Correctly names at least four colors
  ms('cognitive', '4-5y', 3),        // Understands concepts like "same" and "different"
  ms('cognitive', '4-5y', 4),        // Draws recognizable pictures
  ms('cognitive', '4-5y', 5),        // Tells you what they think is going to happen next in a story

  // ========================================================================
  // SOCIAL / EMOTIONAL DOMAIN (45 milestones)
  // ========================================================================

  // -- 0-3m --
  ms('social', '0-3m', 1, true),  // Makes eye contact
  ms('social', '0-3m', 2),        // Begins to smile at people (social smile)
  ms('social', '0-3m', 3),        // Can briefly calm self (may suck on hand)
  ms('social', '0-3m', 4),        // Enjoys playing with people
  ms('social', '0-3m', 5),        // Shows interest in faces

  // -- 3-6m --
  ms('social', '3-6m', 1),        // Smiles spontaneously, especially at people
  ms('social', '3-6m', 2),        // Enjoys playing during feeding
  ms('social', '3-6m', 3),        // Responds to others' emotions
  ms('social', '3-6m', 4),        // Reaches for familiar people
  ms('social', '3-6m', 5),        // Likes to look at self in a mirror

  // -- 6-9m --
  ms('social', '6-9m', 1),        // Knows familiar vs. unfamiliar faces
  ms('social', '6-9m', 2),        // Shows anxiety around strangers
  ms('social', '6-9m', 3),        // Enjoys playing peek-a-boo
  ms('social', '6-9m', 4),        // Clings to familiar adults
  ms('social', '6-9m', 5),        // Has favorite toys

  // -- 9-12m --
  ms('social', '9-12m', 1),       // Shows separation anxiety with caregiver
  ms('social', '9-12m', 2),       // Shy or anxious with strangers
  ms('social', '9-12m', 3),       // Repeats sounds or actions to get attention
  ms('social', '9-12m', 4),       // Plays pat-a-cake and other social games
  ms('social', '9-12m', 5),       // Extends arm or leg to help with dressing

  // -- 12-18m --
  ms('social', '12-18m', 1),       // Hands you a book when wants a story
  ms('social', '12-18m', 2),       // May have temper tantrums
  ms('social', '12-18m', 3, true), // Shows affection to familiar people
  ms('social', '12-18m', 4),       // Plays simple pretend (feeding a doll)
  ms('social', '12-18m', 5),       // Shows fear in some situations

  // -- 18-24m --
  ms('social', '18-24m', 1),       // Copies others, especially adults
  ms('social', '18-24m', 2),       // Gets excited around other children
  ms('social', '18-24m', 3),       // Shows increasing independence
  ms('social', '18-24m', 4),       // Plays mainly beside (not with) other children
  ms('social', '18-24m', 5),       // Shows defiant behavior (doing what told not to)

  // -- 2-3y --
  ms('social', '2-3y', 1),        // Imitates adults and playmates
  ms('social', '2-3y', 2, true),  // Shows a wide range of emotions
  ms('social', '2-3y', 3),        // Takes turns in games
  ms('social', '2-3y', 4),        // Shows concern for a crying friend
  ms('social', '2-3y', 5),        // Separates easily from parents

  // -- 3-4y --
  ms('social', '3-4y', 1),        // Cooperates with other children
  ms('social', '3-4y', 2),        // Negotiates solutions to conflicts
  ms('social', '3-4y', 3, true),  // Engages in interactive play with peers
  ms('social', '3-4y', 4),        // Shows concern for others' feelings
  ms('social', '3-4y', 5),        // Can identify as boy or girl

  // -- 4-5y --
  ms('social', '4-5y', 1),        // Wants to please friends
  ms('social', '4-5y', 2),        // More likely to agree with rules
  ms('social', '4-5y', 3),        // Likes to sing, dance, and act
  ms('social', '4-5y', 4, true),  // Can distinguish fantasy from reality
  ms('social', '4-5y', 5),        // Shows more independence

  // ========================================================================
  // SENSORY DOMAIN (15 milestones — baby ages only: 0-3m, 3-6m, 6-9m)
  // ========================================================================

  // -- 0-3m --
  ms('sensory', '0-3m', 1, true),  // Focuses on faces 8-12 inches away
  ms('sensory', '0-3m', 2),        // Follows moving objects with eyes briefly
  ms('sensory', '0-3m', 3),        // Recognizes caregiver's voice
  ms('sensory', '0-3m', 4),        // Startles at sudden loud noises
  ms('sensory', '0-3m', 5),        // Prefers high-contrast patterns

  // -- 3-6m --
  ms('sensory', '3-6m', 1),        // Tracks objects smoothly in all directions
  ms('sensory', '3-6m', 2, true),  // Turns head toward sound source
  ms('sensory', '3-6m', 3),        // Explores textures with hands and mouth
  ms('sensory', '3-6m', 4),        // Enjoys different visual patterns and colors
  ms('sensory', '3-6m', 5),        // Distinguishes between familiar and unfamiliar voices

  // -- 6-9m --
  ms('sensory', '6-9m', 1),        // Looks at objects that are far away
  ms('sensory', '6-9m', 2, true),  // Responds to own name by looking
  ms('sensory', '6-9m', 3),        // Enjoys textured toys and different surfaces
  ms('sensory', '6-9m', 4),        // Explores objects by mouthing, touching, shaking
  ms('sensory', '6-9m', 5),        // Shows preference for certain tastes
] as const;

/* ----------------------------- Query helpers ----------------------------- */

/** All milestones for a given domain */
export function getMilestonesByDomain(domain: DomainId): Milestone[] {
  return MILESTONES.filter((m) => m.domain === domain);
}

/** All milestones for a given age range */
export function getMilestonesByAgeRange(ageRange: AgeRangeId): Milestone[] {
  return MILESTONES.filter((m) => m.ageRange === ageRange);
}

/** All milestones for a given domain AND age range (returns 0 or 5) */
export function getMilestonesByDomainAndAge(
  domain: DomainId,
  ageRange: AgeRangeId,
): Milestone[] {
  return MILESTONES.filter(
    (m) => m.domain === domain && m.ageRange === ageRange,
  );
}

/** Return the AgeRangeMeta whose [minMonths, maxMonths) contains the given month */
export function getAgeRangeForMonths(months: number): AgeRangeMeta | undefined {
  return AGE_RANGES.find(
    (ar) => months >= ar.minMonths && months < ar.maxMonths,
  );
}

/** Return DomainMeta for a given DomainId */
export function getDomainMeta(domain: DomainId): DomainMeta | undefined {
  return DOMAINS.find((d) => d.id === domain);
}
