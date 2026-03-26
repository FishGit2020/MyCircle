import type { FlashCard } from '../types';

export type TechniqueCategory =
  | 'algorithms'
  | 'two-pointers'
  | 'python-syntax'
  | 'bugs'
  | 'data-structures'
  | 'trees-graphs'
  | 'dynamic-programming'
  | 'sorting-searching';

export interface TechniqueCard {
  id: string;
  front: string;
  back: string;
  category: TechniqueCategory;
  difficulty: 1 | 2 | 3;
}

export const techniques: TechniqueCard[] = [

  // ─── Interview Process & Frameworks ───────────────────────────────────────

  { id: 'fw-01', front: 'What are the 6 steps of the interview checklist?', back: '1. Understand the Problem (read twice, ask clarifying questions, edge cases, input/output format, scale constraints)\n2. Design the Algorithm (sketch naive, find upper/lower bounds, look for triggers, employ boosters)\n3. Explain the Solution (examples, indented English, name & justify)\n4. Get Buy-In ("The Magic Question")\n5. Code the Solution (main logic, helper functions, stop if lost)\n6. Verify the Solution (top-to-bottom pass, tricky expressions, run tiny input, check edge cases, verify analysis)', category: 'algorithms', difficulty: 1 },

  { id: 'fw-02', front: 'What is the "Magic Question" (Buy-In)?', back: '"I\'d like to use [approach] with time O(x) and space O(y) to solve this — can I start coding, or should I keep thinking?" Always get buy-in before writing code.', category: 'algorithms', difficulty: 1 },

  { id: 'fw-03', front: 'What does M.I.K.E. stand for?', back: '[M] Minimally sketch the brute force\n[I] Infer boundaries (task, output, brute force, constrain)\n[K] Keywords / Triggers\n[E] Employ boosters', category: 'algorithms', difficulty: 1 },

  { id: 'fw-04', front: 'What are the 5 boosters (H.D.C.A. + Brute Force)?', back: '1. Brute Force Optimization — Preprocessing, Data Structure, Skip Unnecessary Work\n2. Hunt for Properties — DIY, Case Analysis, Reverse Engineer Output, Sketch Diagram, Reframe\n3. Decrease the Difficulty — Tackle easier version, Break down\n4. Cycle Through the Catalog — "Could ___ be useful?"\n5. Articulate Your Blocker — Don\'t say "Hint"; Show Your Work', category: 'algorithms', difficulty: 2 },

  { id: 'fw-05b', front: 'What is the B.H.D.C.A. mnemonic for boosters?', back: 'B — Brute Force Optimization (Preprocessing, Data Structure, Skip Unnecessary Work)\nH — Hunt for Properties (DIY, Case Analysis, Reverse Engineer Output, Sketch Diagram, Reframe)\nD — Decrease the Difficulty (Easier Version, Break Down)\nC — Cycle Through the Catalog (Could ___ be useful?)\nA — Articulate Your Blocker (Don\'t say "Hint"; Show Your Work)\n\nMemory hook: "Boosters Help Developers Crack Algorithms"', category: 'algorithms', difficulty: 1 },

  { id: 'fw-05c', front: 'What is the ideal time budget for a 40-min coding interview?', back: '5 min: Understand the problem — restate it, ask clarifying questions, list edge cases\n10 min: Discuss approach — trace 2-3 examples by hand until pattern is clear\n20 min: Code the solution — implement your validated approach once\n5-10 min: Test & complexity — run examples, check edge cases, state Big-O\n\nNever start coding without buy-in. Time-box debugging: if stuck 15+ min, re-read the problem.', category: 'algorithms', difficulty: 1 },

  { id: 'fw-05d', front: 'When your solution has 8 different cases, what should you ask?', back: '"Is there a simpler rule that captures ALL these cases?"\n\nSpiral example: Instead of 8 directional cases → ONE rule: "turn when next cell is blocked or out of bounds"\nRotation example: Instead of many swap cases → "rotation = transpose + reflection"\nBackwards trick: Filling from the end is often simpler than filling forwards (spiral, reversal, valley sort)\n\nIf logic feels complex, step back: "What is the simplest possible rule?" Simpler = fewer bugs + clearer code.', category: 'algorithms', difficulty: 2 },

  { id: 'fw-05e', front: 'How to enumerate edge cases systematically before coding?', back: 'When writing high-level algorithm, EXPLICITLY list edge cases:\n1. Empty input (empty array, empty string, 0, None)\n2. Single element\n3. No valid answer exists\n4. All elements are identical\n5. Boundary values (min/max of constraints)\n6. Problem-specific (e.g., "What about the queen\'s own cell? Board with no queens? String ends with delimiter?")\n\nDo this BEFORE coding. Verbalizing edge cases earns Verification rubric points.', category: 'algorithms', difficulty: 1 },

  { id: 'fw-05', front: 'What are the 4 interview rubric categories?', back: '1. Problem Solving — correct algorithm, tradeoffs, right data structures\n2. Coding — correct code, no over-complication, good hygiene (clear names, helpers, consistent style)\n3. Verification — clarifying questions, edge cases, tested/argued correctness, spot bugs\n4. Communication — clear even when technical, open to feedback, articulate confusion', category: 'algorithms', difficulty: 1 },

  { id: 'fw-06', front: 'Two common verification mistakes?', back: '1. Testing the concept, not the actual code\n2. Not thinking as you go (work through examples line-by-line, not just mentally)', category: 'algorithms', difficulty: 1 },

  { id: 'fw-07', front: 'What are the 4 types of boundary thinking?', back: '1. Task boundary — what exactly must be done?\n2. Output boundary — what does the result look like?\n3. Brute force boundary — what is the naive worst case?\n4. Constrain boundary — what constraints tighten the space?', category: 'algorithms', difficulty: 2 },

  // ─── Big-O ────────────────────────────────────────────────────────────────

  { id: 'bigo-01', front: 'Big-O: max feasible n for each complexity (10^8 ops/sec, 1-2s limit)', back: 'O(n!) → ~12\nO(2^n) → ~25\nO(n^4) → ~100\nO(n^3) → ~500\nO(n^2 log n) → ~3,000\nO(n^2) → ~10,000\nO(n√n) → ~100,000\nO(n log n) → ~5,000,000\nO(n) → ~100,000,000\nO(√n) → ~10^16\nO(log n) → ~10^18', category: 'algorithms', difficulty: 2 },

  { id: 'bigo-02', front: 'What growth rate does O(n log n) have?', back: 'Linearithmic — slightly faster than linear. When input doubles, value grows a bit more than double. Examples: 7n * 3log₂(n), n * log₂(n) + n', category: 'algorithms', difficulty: 1 },

  { id: 'bigo-03', front: 'When you see "redundant work" in complexity analysis, what question to ask?', back: '"What is the MAX number of times a single element can be processed?" — This leads to amortized analysis. Used in queens reach (each cell marked at most 8 times → O(n²) not O(n³)).', category: 'algorithms', difficulty: 3 },

  { id: 'bigo-04', front: 'Big-O: max feasible n — LOW end vs HIGH end', back: 'O(n!)      LOW: 11           HIGH: 9\nO(2^n)     LOW: 27           HIGH: 20\nO(n^3)     LOW: 584          HIGH: 125\nO(n^2)     LOW: 14,142       HIGH: 1,414\nO(n log n) LOW: 8,677,239    HIGH: 118,649\nO(n)       LOW: 200,000,000  HIGH: 2,000,000\nO(log n)   → Super high (both)\nO(1)       → Infinite (both)\n\nLOW end = looser n constraint (larger input ok)\nHIGH end = tighter n constraint (smaller input)', category: 'algorithms', difficulty: 2 },

  { id: 'bigo-05', front: 'Name the 9 standard complexity classes and their growth behavior', back: 'Constant O(1): growth rate does not depend on input. e.g. min(n, 10)\nLogarithmic O(log n): input doubles → value increases by a constant. e.g. log₂(n)\nLinear O(n): input doubles → value at most doubles. e.g. n + log₂(n)\nLinearithmic O(n log n): input doubles → value grows a bit more than double. e.g. 7n*3log₂(n)\nQuadratic O(n²): input doubles → value at most quadruples. e.g. n(n-1)/2\nCubic O(n³): input doubles → value at most 8-fold. e.g. n³ + n²*log₂(n)\nExponential O(2^n): input +1 → value doubles. e.g. 2^(n+1), 2^(n+4)\nExponential O(3^n): input +1 → value triples. e.g. 3^n, 3^(n+4), 3^n + 2^n\nFactorial O(n!): input +1 → multiplied by increasing factor. e.g. n! + n', category: 'algorithms', difficulty: 2 },

  // ─── Patterns / Triggers ──────────────────────────────────────────────────

  { id: 'pat-01', front: 'Trigger: sorted array + finding pairs → what approach?', back: 'Two pointers from opposite ends, O(n). Immediately jump to this pattern. Do NOT start with binary search for pair-finding.', category: 'algorithms', difficulty: 1 },

  { id: 'pat-02', front: 'Trigger: in-place O(1) space requirement → what approach?', back: 'Two pointers. O(1) space constraint almost always means in-place modification with pointer(s) rather than extra storage.', category: 'algorithms', difficulty: 1 },

  { id: 'pat-03', front: 'Trigger: sorted array + find something (not pairs) → what approach?', back: 'Binary search, O(log n). Define your is_before() predicate and transition point.', category: 'algorithms', difficulty: 1 },

  { id: 'pat-04', front: 'Trigger: only K distinct values (small K) → what O(1) space trick?', back: 'If K is small and constant, you can build a hashmap/counter with O(1) space (only K keys).\n\nDutch Flag example (3 colors): count R, G, B then overwrite array — simpler than two-pointer:\n  r_count = sum(1 for c in arr if c == \'R\')\n  # repeat for G and B, then reconstruct\n\nDon\'t default to two-pointers. Ask: "What\'s special about the constraints?" Small K → counting often beats general algorithms.', category: 'algorithms', difficulty: 2 },

  { id: 'pat-05', front: 'Trigger: grid traversal with 8 directions → what pattern?', back: 'Direction array: write 4 cardinals (up/down/left/right) then 4 diagonals systematically. Use (r, c) not (x, y). For queen: use while loop per direction so it stops at blocked cells.', category: 'algorithms', difficulty: 2 },

  { id: 'pat-06', front: 'Trigger: linear constraint (e.g., intervals, two sorted arrays) → what approach?', back: 'Two pointers — one per array/sequence. Move the pointer with the smaller/earlier value. O(m+n). Key interval questions: Do they overlap? If not, which is earlier? If so, what is [max(s1,s2), min(e1,e2)]?', category: 'algorithms', difficulty: 2 },

  { id: 'pat-07', front: 'Trigger: connected components in a grid → what approach?', back: 'Grid graph DFS/BFS + connected component loop. Need multiple DFS calls (one per unvisited island). Use the "grid graph DFS" recipe and the "connected component loop" recipe.', category: 'algorithms', difficulty: 2 },

  { id: 'pat-07b', front: 'Amortized analysis: queens reach — per-ELEMENT vs per-OPERATION', back: 'Trap: "Each cell checked from each queen" → O(queens * n²) looks like O(n³).\n\nCorrect amortized thinking:\nAsk: "What is the MAX times a SINGLE ELEMENT can be processed across ALL operations?"\nAnswer: Each cell can be MARKED unsafe at most 8 times (8 directions from any queen).\nSo total_work = 8 × n² = O(n²), not O(n³).\n\nFormula: total_work = max_times_per_element × total_elements\nApplies to: queens reach, sliding window, amortized array ops.', category: 'algorithms', difficulty: 3 },

  { id: 'pat-07c', front: 'Trigger: string matching — what algorithms exist beyond O(mn) brute force?', back: 'Brute force O(m*n): slide pattern over text, compare at each position.\n\nOptimal O(m+n) algorithms to know exist:\n1. Rolling Hash — hash the window, compare hashes O(1) per shift\n2. KMP (Knuth-Morris-Pratt) — precompute failure function, never re-compare matched prefix chars\n\nInterview strategy: implement brute force first, then mention these as optimizations.\nTrigger: ASCII input (limited charset) → counting-based optimization may help too.', category: 'algorithms', difficulty: 3 },

  { id: 'pat-08', front: 'Trigger: backwards traversal / spiral / rotation → what to consider?', back: 'Think backwards — sometimes filling from the end or reversing direction is simpler. Rotation = transpose + reflection. Spiral: "turn when next cell is blocked or out of bounds" — find ONE simple rule instead of 8 cases.', category: 'algorithms', difficulty: 3 },

  { id: 'pat-08b', front: 'Backwards calculation DP: why iterate in reverse?', back: 'When iterating in reverse (i from n-1 down to 0), previously computed values at [i+1], [j+1] etc. are already available — enables O(1) lookup instead of recomputation.\n\nPattern: "Fill from the end so future positions are already resolved."\n\nUsed in:\n- Subgrid Maximums: compute suffix max row-by-row from bottom\n- Subgrid Sums: compute suffix sums column-by-column from right\n- Knapsack-style DP where item i depends on item i+1\n\nWhen you see "each subproblem depends on larger indices" → try reverse iteration first.', category: 'algorithms', difficulty: 3 },

  { id: 'pat-09', front: 'Binary search loop invariant technique (CCTV Footage)', back: 'Define invariants FIRST: "l is always [not stolen], r is always [stolen]." Design loop to preserve them: while r-l>1: mid=(l+r)//2; if not_stolen(mid): l=mid else r=mid. When adjacent, answer is at l or r directly — no extra checks needed.', category: 'algorithms', difficulty: 3 },

  { id: 'pat-10', front: 'What is the "Of all pointer directions, which makes my life easiest?" technique?', back: 'When using two pointers, enumerate all pointer movement combinations: both inward, both outward, same direction (slow/fast). Ask which one gives you the simplest loop invariant. Used for Sort Valley Shaped Array and interval problems.', category: 'algorithms', difficulty: 2 },

  // ─── Two Pointers ─────────────────────────────────────────────────────────

  { id: 'tp-01', front: 'Two-pointer guidelines (5 rules)', back: '1. Avoid nested loops\n2. Each loop makes ONE single step towards exit\n3. Each loop breaks down into a case analysis\n4. Each case contains a simple action (skip, compare, swap, write)\n5. Every action should move towards the exit condition', category: 'two-pointers', difficulty: 1 },

  { id: 'tp-02', front: 'After a two-pointer loop exits, what 3 things to check?', back: '1. Is there any "wrap-up" work after exit?\n2. When one pointer reaches the end, what happens to the other?\n3. What happens when inward pointers meet?', category: 'two-pointers', difficulty: 2 },

  { id: 'tp-03', front: 'Seeker/Writer recipe (in-place duplicate removal)', back: 'seeker, writer = 0, 0\nwhile seeker < len(arr):\n  if we need to keep arr[seeker]:\n    arr[writer] = arr[seeker]\n    advance writer and seeker\n  else:\n    only advance seeker', category: 'two-pointers', difficulty: 2 },

  { id: 'tp-04', front: 'Binary search transition-point recipe', back: 'def transition_point(arr):\n  define is_before(val)  # returns True if val is "before" the boundary\n  l, r = first, last\n  # Edge cases: empty range, l is "after", r is "before"\n  while r - l > 1:\n    mid = (l + r) // 2\n    if is_before(mid): l = mid\n    else: r = mid\n  return l  # last "before"\n  # or r (first "after"), depending on problem', category: 'two-pointers', difficulty: 3 },

  { id: 'tp-05', front: 'Naming convention for two-pointer problems', back: 'Use descriptive names:\n- slow / fast (for seeker/writer style)\n- p1, p2, p3 (for multi-array merges)\n- left / right or l, r (for inward pointers)\nAvoid single letters s, f — they are non-descriptive and lose points on Coding rubric.', category: 'two-pointers', difficulty: 1 },

  { id: 'tp-06', front: 'Two-pointer visualization technique', back: 'Draw a simple diagram on the editor/paper:\n- Visualize every case (what is true when entering each branch)\n- Visualize every possible way to EXIT the loop\nThis almost always reveals the pattern faster than theorizing.', category: 'two-pointers', difficulty: 1 },

  { id: 'tp-07', front: 'Loop invariant for "merge two sorted arrays"', back: '"res contains the sorted merge of every element in arr1 before p1 and every element in arr2 before p2." — State this before coding. When loop exits, append remaining elements from whichever pointer hasn\'t finished.', category: 'two-pointers', difficulty: 2 },

  { id: 'tp-08', front: 'Loop invariant for "interval intersection"', back: '"res contains the intersection of every interval in arr1 before p1 and every interval in arr2 before p2." — Move the pointer whose interval ends first. Compute overlap as [max(s1,s2), min(e1,e2)] when they overlap.', category: 'two-pointers', difficulty: 3 },

  { id: 'tp-09', front: 'In-place swap trigger + anatomy of the coding interview steps', back: 'Trigger: in-place swap = two pointers.\n\nAnatomy steps:\n1. Understand the question\n2. Design algo\n3. Explain solution\n4. Get buy-in: "I\'d like to use two pointers with time O(n) space O(1), can I start coding?"\n5. Code solution\n6. Verify solution', category: 'two-pointers', difficulty: 1 },

  // ─── Python Syntax ────────────────────────────────────────────────────────

  { id: 'py-01', front: 'Python: swap, ternary, multi-compare', back: 'Swap: a, b = b, a\nTernary: a if cond else b\nMulti-compare: if a <= b <= c:\nInline ternary in arg: (dir_king if piece == "king" else dir_queen)', category: 'python-syntax', difficulty: 1 },

  { id: 'py-02', front: 'Python: integer division, exponentiation, walrus operator', back: 'Integer (floor) division: //\nExponentiation: x**y\nWalrus (assign + test): if (n := len(arr)) > 10: ...\nUseful for while loops: while (chunk := read()) != ""', category: 'python-syntax', difficulty: 1 },

  { id: 'py-03', front: 'Python: init variables, check empty, infinity', back: 'Init multiple to same: sum_1 = sum_2 = 0\nOr unpack: sum_1, sum_2 = 0, 0\nCheck empty: if not arr:\nInfinity: float("inf") and float("-inf")\nInit many: i, j = 0, 10', category: 'python-syntax', difficulty: 1 },

  { id: 'py-04', front: 'Python: create 2D grid, copy grid', back: 'Create grid (C cols, R rows): [[None] * C for _ in range(R)]\n⚠️ NEVER: [[None]*C]*R — creates R refs to SAME list!\nCopy grid: grid_copy = [r.copy() for r in grid]\nmax with multiple values: max(1,2,3,4)', category: 'python-syntax', difficulty: 2 },

  { id: 'py-05', front: 'Python: string methods to remember', back: '"".join(arr)  # O(len(arr))\ns.split(",")  # split by delimiter\ns[slow:fast]  # slice (colon! not comma)\n"S".lower() | "s".upper()\n"S".islower() | "s".isupper()\n"a".isalpha()  # True if letter\nord("a")  # → int (ASCII)\nchr(96)  # → char', category: 'python-syntax', difficulty: 1 },

  { id: 'py-06', front: 'Python: set operations, sum, extend, reverse', back: 'Set: a_set = set()\n"a" in a_set  # membership\na_set.add("a")\nDuplicate removal: arr = list(set(arr))\nConditional sum: sum(1 for c in arr if c == "R")\nExtend: arr.extend([1,2,3,4])\nReverse (in-place): arr.reverse()\nUnpack: [i, j] = [1, 2]  # or i, j = 1, 2', category: 'python-syntax', difficulty: 1 },

  { id: 'py-07', front: 'Python: class, raise, assert, formatted strings, comments', back: 'Class: class Matrix: \\n  def __init__(self, xxx):\nRaise: raise Exception("message")  # NOT throw!\nAssert: assert condition, "message"\nFormatted string: f"result is {result}"\nSingle-line comment: # this is a comment\nMulti-line comment: """xxx"""\nElse-if: elif (not else if)', category: 'python-syntax', difficulty: 1 },

  { id: 'py-07b', front: 'Python: string immutability, letter comparison, isalpha, assert', back: 'Strings are IMMUTABLE — you cannot modify characters in place.\n\nLetter comparison works directly:\n  "a" < "p"  # True\n  "a" < "p" == (ord("a") < ord("p"))  # same result\n\nCheck character type:\n  "a".isalpha()  # True if letter\n  "3".isdigit()  # True if digit\n\nMulti-line comment / docstring: """xxx"""\n\nAssert with message:\n  assert condition, "message"\n  assert False, "this fails with this message"', category: 'python-syntax', difficulty: 1 },

  { id: 'py-07c', front: 'Big-O with multiple input variables — common mistake', back: 'When a problem has multiple input variables, Big-O MUST include ALL relevant ones.\n\nExample — join string:\n  k = total length of all strings combined\n  m = separator string length\n  n = number of strings in array\n  Time: O(k + m*n) — NOT just O(n)\n\nExample — string matching:\n  m = pattern length, n = text length\n  Time: O(m*n) brute force, O(m+n) optimal\n\nAlways ask: "Are there hidden size variables in this input?" Reporting O(n) when there are k, m, n variables loses Problem-Solving points.', category: 'algorithms', difficulty: 2 },

  { id: 'py-08', front: 'Python: common operators that differ from other languages', back: '== compares VALUES (array items too)\nis compares MEMORY LOCATION (identity)\nTrue / False (capitalized, not true/false)\n++ and -- do NOT exist — use += 1 and -= 1\nor / and (not || and &&)\nnot (not !)   # logical not', category: 'python-syntax', difficulty: 2 },

  { id: 'py-09', front: 'Python: direction array for grid (8 directions)', back: 'dirs = [\n  (-1,0),(1,0),(0,-1),(0,1),   # 4 cardinals\n  (-1,-1),(-1,1),(1,-1),(1,1)  # 4 diagonals\n]\n# Use r, c — not x, y\n# King/Knight: O(1) fixed moves\n# Queen: while loop per direction, stop at blocked', category: 'python-syntax', difficulty: 2 },

  { id: 'py-10', front: 'Python: extending range, res.extend with range', back: 'res.extend(range(p2, high + 1))  # adds all ints from p2 to high\n# This is O(high - p2) — factor into complexity!\n# Use for "Missing Numbers in Range" pattern', category: 'python-syntax', difficulty: 2 },

  // ─── Bugs (Personal Bug List) ─────────────────────────────────────────────

  { id: 'bug-01', front: 'Bug: string slice — most common syntax mistake', back: '❌ WRONG: s[slow,fast]  (comma)\n✅ RIGHT:  s[slow:fast]  (colon)\n\nAlso: s[slow:fast] already returns a string — you do NOT need to build a temp list and join it. That adds complexity and introduces variable shadowing bugs.', category: 'bugs', difficulty: 1 },

  { id: 'bug-02', front: 'Bug: variable shadowing in string split loop', back: 'If your function parameter is named `c` (the delimiter), and you write:\n  for c in s[slow:fast]:  # ← overwrites c with last char of substring!\nFix: use a different variable name like `char`.\nResult: subsequent comparisons s[fast] == c check the WRONG character.', category: 'bugs', difficulty: 2 },

  { id: 'bug-03', front: 'Bug: missing trailing segment in two-pointer split', back: '❌ WRONG: if slow != fast: → fails when string ends with delimiter (/home/)\n  because slow == fast == len(s), so trailing "" is never appended.\n\n✅ FIX: if len(s) > 0: → always appends the final segment', category: 'bugs', difficulty: 2 },

  { id: 'bug-04', front: 'Bug: dynamic array capacity check order', back: 'The capacity check for shrinking must happen BEFORE shrinking, not after.\n❌ Wrong: shrink first, then check if capacity >= 10\n✅ Right: check capacity condition FIRST, then decide to shrink\n\nAlso: init array with [None] * 4, NOT [None] * 4.0 (no float sizes)', category: 'bugs', difficulty: 2 },

  { id: 'bug-05', front: 'Bug: grid initialization — shallow copy trap', back: '❌ WRONG: [[0] * n] * n → all rows are the SAME list object!\n  Modifying row 0 modifies ALL rows.\n\n✅ RIGHT: [[0] * n for _ in range(n)] → each row is a new list\n\nAlways use list comprehension for 2D structures.', category: 'bugs', difficulty: 2 },

  { id: 'bug-06', front: 'Bug: binary search — loop invariant not maintained (CCTV Footage)', back: 'Symptom: extra conditional checks that don\'t simplify cleanly.\nRoot cause: invariant not defined upfront.\n\nFix: State invariants first ("l is always [not stolen], r is always [stolen]"), then the loop writes itself. When l and r are adjacent, return directly — no extra checks needed.', category: 'bugs', difficulty: 3 },

  { id: 'bug-07', front: 'Bug: using wrong index to append (dynamic array)', back: 'Using capacity index instead of size index when appending → overwrites the LAST value.\n\n✅ Always use self.size as the insert index, not self.capacity.\nWhen copying during resize: copy range(self.size), not range(self.capacity).', category: 'bugs', difficulty: 2 },

  { id: 'bug-08', front: 'Bug: forgetting self.xxx in Python class methods', back: 'Calling method() instead of self.method()\nAccessing field instead of self.field\nNot passing self when needed\nusing enumerate with the same variable name as an outer variable → overwrites it\n\nAlways prefix class attributes and methods with self.', category: 'bugs', difficulty: 1 },

  { id: 'bug-09', front: 'Bug: quicksort — overcomplicating equal-to-pivot handling', back: 'You do NOT need to specially place elements equal to pivot. They can go on either side.\n\nRoot cause: not clarifying requirements upfront. Before coding, ASK:\n"For elements equal to pivot, do they need a specific position, or can they go either side?"\n\nSimple approach always wins — only add complexity when the simple version fails.', category: 'bugs', difficulty: 3 },

  { id: 'bug-10', front: 'Bug: counting logic in two-pointer pair problems', back: 'When counting valid pairs with two inward pointers:\n- If arr[l] + arr[r] > target: ALL pairs (l, r), (l, r-1), ..., (l, l+1) are valid\n  → add (r - l) to count, then r -= 1\n- If sum <= target: l += 1\n\nAlways DRAW the array and walk through counting logic on paper before coding.', category: 'bugs', difficulty: 3 },

  { id: 'bug-11', front: 'Top 5 Python syntax errors from post-mortem practice', back: '1. s[slow,fast] → should be s[slow:fast]\n2. True/False capitalization (not true/false)\n3. ++ / -- do not exist → use += 1\n4. "else if" → should be "elif"\n5. Forgot "in" in for loop: for i arr → for i in arr', category: 'bugs', difficulty: 1 },

  { id: 'bug-12', front: 'Bug: "looks good" trap — code review checklist', back: 'Before saying "looks good", mentally check:\n1. if conditions — are they correct?\n2. while loop exit condition\n3. off-by-one errors\n4. initialization values\n5. is there any wrap-up after the loop?\n6. variable naming conflicts (shadowing)\n7. check both bounds: not just < n, also >= 0', category: 'bugs', difficulty: 1 },

  // ─── Data Structures (Tier 1 & 2) ──────────────────────────────────────────

  { id: 'ds-01', front: 'Trigger: Last-In First-Out (LIFO) processing → what data structure?', back: 'Stack. Use for:\n- Matching parentheses/brackets\n- Undo operations\n- DFS (iterative)\n- Monotonic stack (next greater/smaller element)\n- Expression evaluation (postfix/infix)\n\nPython: use list as stack — append() to push, pop() to pop. O(1) amortized.', category: 'data-structures', difficulty: 1 },

  { id: 'ds-02', front: 'Trigger: First-In First-Out (FIFO) processing → what data structure?', back: 'Queue. Use for:\n- BFS (level-order traversal)\n- Sliding window maximum (deque)\n- Task scheduling / round-robin\n- Stream processing\n\nPython: from collections import deque. Use append() and popleft(). O(1) both. Never use list as queue — popleft from list is O(n).', category: 'data-structures', difficulty: 1 },

  { id: 'ds-03', front: 'Trigger: need fast lookup + insertion + deletion → what data structure?', back: 'Hash Map (dict) or Hash Set (set).\n- Lookup/insert/delete: O(1) average\n- Use dict for key→value mapping\n- Use set for membership testing, deduplication\n\nTrigger phrases: "find if exists", "count occurrences", "group by", "two-sum pattern", "seen before"', category: 'data-structures', difficulty: 1 },

  { id: 'ds-04', front: 'Trigger: need min/max repeatedly from a changing collection → what?', back: 'Heap (Priority Queue).\n- Get min/max: O(1)\n- Insert: O(log n)\n- Remove min/max: O(log n)\n\nPython: import heapq (MIN heap by default).\nFor max heap: negate values or use heapq.nlargest().\n\nUse for: K-th largest/smallest, merge K sorted lists, Dijkstra, task scheduling by priority.', category: 'data-structures', difficulty: 2 },

  { id: 'ds-05', front: 'Trigger: need to track running sum of a subarray → what technique?', back: 'Prefix Sums. Precompute prefix[i] = sum(arr[0..i]).\nSubarray sum from i to j = prefix[j+1] - prefix[i].\n\nVariants:\n- 1D prefix sum → O(n) precompute, O(1) range query\n- 2D prefix sum → O(m*n) precompute, O(1) subgrid sum\n- Prefix XOR for XOR-based problems\n\nTrigger: "sum of subarray", "range sum query", "subarray with given sum"', category: 'data-structures', difficulty: 2 },

  { id: 'ds-06', front: 'What is a Monotonic Stack and when to use it?', back: 'A stack that maintains elements in increasing or decreasing order.\n\nUse when you need:\n- Next Greater Element (NGE)\n- Next Smaller Element\n- Largest rectangle in histogram\n- Stock span / daily temperatures\n\nPattern: for each element, pop all stack elements that violate monotonicity. The element being popped found its answer. O(n) total — each element pushed and popped at most once.', category: 'data-structures', difficulty: 2 },

  { id: 'ds-07', front: 'Linked List: what operations and when to use it?', back: 'Insert/delete at head: O(1)\nInsert/delete at tail: O(1) with tail pointer\nSearch: O(n)\n\nUse when: frequent insertions/deletions at both ends, LRU cache (with hash map), polynomial math\n\nTechniques:\n- Dummy head node to avoid edge cases\n- Fast/slow pointers (cycle detection, middle finding)\n- Reverse in-place: prev/curr/next pattern\n\nPython: implement with class Node(val, next).', category: 'data-structures', difficulty: 1 },

  { id: 'ds-08', front: 'Trigger: sliding window on array/string → what technique?', back: 'Sliding Window (Two Pointers variant).\n\nFixed window: size K, slide by 1 each step.\nVariable window: expand right until condition met, shrink left until condition breaks.\n\nTemplate:\n  left = 0\n  for right in range(n):\n    add arr[right] to window\n    while window invalid:\n      remove arr[left], left += 1\n    update answer\n\nUse for: max/min subarray of size K, longest substring without repeats, minimum window substring.', category: 'data-structures', difficulty: 2 },

  // ─── Trees & Graphs ─────────────────────────────────────────────────────────

  { id: 'tg-01', front: 'Tree traversals: what are the 4 types and when to use each?', back: 'Preorder (root → left → right): copy tree, serialize\nInorder (left → root → right): BST gives sorted order\nPostorder (left → right → root): delete tree, calculate heights\nLevel-order (BFS): shortest path in unweighted tree, level-by-level processing\n\nAll DFS traversals are O(n) time, O(h) space (h = height).\nBFS is O(n) time, O(w) space (w = max width).', category: 'trees-graphs', difficulty: 1 },

  { id: 'tg-02', front: 'Trigger: shortest path in unweighted graph → what algorithm?', back: 'BFS. Always use BFS for unweighted shortest path — never DFS.\n\nTemplate:\n  queue = deque([(start, 0)])  # (node, distance)\n  visited = {start}\n  while queue:\n    node, dist = queue.popleft()\n    if node == target: return dist\n    for neighbor in adj[node]:\n      if neighbor not in visited:\n        visited.add(neighbor)\n        queue.append((neighbor, dist + 1))', category: 'trees-graphs', difficulty: 1 },

  { id: 'tg-03', front: 'Trigger: shortest path in weighted graph → what algorithm?', back: 'Dijkstra (no negative weights) or Bellman-Ford (with negative weights).\n\nDijkstra template:\n  dist = {start: 0}\n  heap = [(0, start)]\n  while heap:\n    d, u = heappop(heap)\n    if d > dist.get(u, inf): continue\n    for v, w in adj[u]:\n      if d + w < dist.get(v, inf):\n        dist[v] = d + w\n        heappush(heap, (d + w, v))\n\nTime: O((V + E) log V) with binary heap.', category: 'trees-graphs', difficulty: 2 },

  { id: 'tg-04', front: 'Trigger: detect cycle in directed graph → what approach?', back: 'DFS with 3-state coloring:\n- WHITE (unvisited)\n- GRAY (in current DFS path)\n- BLACK (fully processed)\n\nCycle exists if you visit a GRAY node.\n\nAlternative: Topological sort (Kahn\'s algorithm) — if result has fewer nodes than graph, there\'s a cycle.\n\nFor undirected graphs: DFS with parent tracking — cycle if neighbor is visited AND not parent.', category: 'trees-graphs', difficulty: 2 },

  { id: 'tg-05', front: 'What is Topological Sort and when to use it?', back: 'Linear ordering of vertices where for every edge u→v, u comes before v. Only works on DAGs (Directed Acyclic Graphs).\n\nKahn\'s Algorithm (BFS-based):\n1. Count in-degrees for all nodes\n2. Add all 0 in-degree nodes to queue\n3. Process queue: for each node, decrement in-degree of neighbors; add newly 0-degree nodes\n\nUse for: course prerequisites, build order, task scheduling with dependencies.', category: 'trees-graphs', difficulty: 2 },

  { id: 'tg-06', front: 'Trigger: find connected components → what approach?', back: 'Iterate all nodes. For each unvisited node, run DFS/BFS to mark all reachable nodes as one component.\n\nCount components:\n  visited = set()\n  count = 0\n  for node in all_nodes:\n    if node not in visited:\n      count += 1\n      dfs(node, visited)\n\nAlternative: Union-Find (Disjoint Set Union) — O(α(n)) per operation, nearly O(1).', category: 'trees-graphs', difficulty: 1 },

  { id: 'tg-07', front: 'BST property and common operations', back: 'Binary Search Tree: left < root < right (for all subtrees).\n\nSearch/Insert/Delete: O(h) where h = height.\nBalanced BST: h = O(log n). Worst case (skewed): h = O(n).\n\nInorder traversal gives sorted order.\nTo validate BST: pass min/max bounds down recursively.\n\nCommon interview patterns: validate BST, find kth smallest (inorder), LCA in BST, convert sorted array to balanced BST.', category: 'trees-graphs', difficulty: 1 },

  { id: 'tg-08', front: 'Recursion: how to think about tree problems', back: 'For any tree problem, ask:\n1. What info do I need from left and right subtrees?\n2. What do I compute at the current node?\n3. What do I return to my parent?\n\nBase case: null node → return identity value (0, True, -inf, etc.)\n\nCommon patterns:\n- Height: 1 + max(left_h, right_h)\n- Count: 1 + left_c + right_c\n- Path sum: pass remaining sum down\n- Diameter: track max(left_h + right_h) as side effect', category: 'trees-graphs', difficulty: 1 },

  // ─── Dynamic Programming ────────────────────────────────────────────────────

  { id: 'dp-01', front: 'What are the 3 signs a problem needs Dynamic Programming?', back: '1. Optimal substructure — optimal solution built from optimal sub-solutions\n2. Overlapping subproblems — same subproblem solved multiple times\n3. Counting/optimization language — "how many ways", "minimum cost", "maximum profit"\n\nIf you see these, think DP. Start with recursion + memoization (top-down), then optionally convert to tabulation (bottom-up).', category: 'dynamic-programming', difficulty: 1 },

  { id: 'dp-02', front: 'DP: top-down (memoization) vs bottom-up (tabulation)', back: 'Top-down: write recursive solution, add cache/memo dict.\n  @cache or memo = {}\n  Pros: natural to think about, only computes needed states.\n\nBottom-up: fill table iteratively from base cases.\n  dp = [0] * (n+1)\n  for i in range(1, n+1): dp[i] = ...\n  Pros: no recursion overhead, can optimize space.\n\nStart with top-down in interviews (easier to code correctly), optimize to bottom-up if interviewer asks.', category: 'dynamic-programming', difficulty: 1 },

  { id: 'dp-03', front: 'DP: common patterns and their state definitions', back: '1. Linear DP: dp[i] = best answer using first i elements\n   (climbing stairs, house robber, longest increasing subsequence)\n\n2. Two-string DP: dp[i][j] = answer for s1[:i] and s2[:j]\n   (edit distance, LCS, regex matching)\n\n3. Knapsack: dp[i][w] = best value using first i items with capacity w\n   (0/1 knapsack, subset sum, coin change)\n\n4. Interval DP: dp[i][j] = answer for subarray arr[i..j]\n   (matrix chain, palindrome partitioning)', category: 'dynamic-programming', difficulty: 2 },

  { id: 'dp-04', front: 'Trigger: "minimum number of coins to make amount" → what DP?', back: 'Unbounded Knapsack / Coin Change.\n\ndp[amount] = min coins to make that amount.\ndp[0] = 0, dp[i] = inf for i > 0.\n\nFor each coin c:\n  for i in range(c, amount + 1):\n    dp[i] = min(dp[i], dp[i - c] + 1)\n\nTime: O(amount * num_coins), Space: O(amount).\nReturn dp[amount] if != inf, else -1.', category: 'dynamic-programming', difficulty: 2 },

  { id: 'dp-05', front: 'Trigger: "longest common subsequence" → what DP?', back: 'Two-string DP.\n\ndp[i][j] = LCS length of s1[:i] and s2[:j]\n\nBase: dp[0][j] = dp[i][0] = 0\nTransition:\n  if s1[i-1] == s2[j-1]: dp[i][j] = dp[i-1][j-1] + 1\n  else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n\nTime: O(m*n), Space: O(m*n) or O(min(m,n)) with rolling array.', category: 'dynamic-programming', difficulty: 2 },

  { id: 'dp-06', front: 'Backtracking template and when to use it', back: 'Use when exploring ALL possible combinations/permutations/subsets.\n\ndef backtrack(path, choices):\n  if is_solution(path):\n    result.append(path.copy())\n    return\n  for choice in choices:\n    if is_valid(choice):\n      path.append(choice)     # choose\n      backtrack(path, next_choices)\n      path.pop()              # un-choose\n\nUse for: permutations, combinations, N-queens, Sudoku, word search.\nTime: usually O(2^n) or O(n!). Prune early to speed up.', category: 'dynamic-programming', difficulty: 2 },

  { id: 'dp-07', front: 'Greedy algorithms: when to use and how to prove correctness', back: 'Use when locally optimal choices lead to globally optimal solution.\n\nProof techniques:\n1. Exchange argument — swapping a non-greedy choice for greedy doesn\'t worsen the result\n2. Greedy stays ahead — greedy solution is always at least as good at every step\n\nCommon greedy problems:\n- Activity selection (sort by end time)\n- Huffman coding\n- Fractional knapsack\n- Interval scheduling (sort by end, take non-overlapping)\n- Jump game (track farthest reachable)', category: 'dynamic-programming', difficulty: 2 },

  // ─── Sorting & Searching ────────────────────────────────────────────────────

  { id: 'sort-01', front: 'Know your sorting algorithms: time/space/stability', back: 'Merge Sort: O(n log n) time, O(n) space, STABLE\nQuick Sort: O(n log n) avg, O(n²) worst, O(log n) space, NOT stable\nHeap Sort: O(n log n) time, O(1) space, NOT stable\nCounting Sort: O(n + k) time, O(k) space, STABLE (k = range)\nRadix Sort: O(d*(n + k)) time, STABLE\n\nPython: sorted() uses Timsort — O(n log n), stable, adaptive.\nInterview default: use built-in sort unless asked to implement.', category: 'sorting-searching', difficulty: 1 },

  { id: 'sort-02', front: 'Trigger: "Kth largest/smallest element" → what approaches?', back: '1. Sort + index: O(n log n) — simple but not optimal\n2. Min/Max Heap of size K: O(n log k) — good for streaming\n3. Quickselect: O(n) average, O(n²) worst — optimal for one-time query\n\nHeap approach (Kth largest):\n  heap = []  # min heap of size K\n  for num in arr:\n    heappush(heap, num)\n    if len(heap) > k: heappop(heap)\n  return heap[0]  # kth largest', category: 'sorting-searching', difficulty: 2 },

  { id: 'sort-03', front: 'Binary search variants beyond basic find', back: '1. Find first occurrence: when found, search LEFT half\n2. Find last occurrence: when found, search RIGHT half\n3. Find insertion point: bisect_left / bisect_right\n4. Search rotated sorted array: check which half is sorted\n5. Search for peak element: compare mid with mid+1\n6. Minimize/maximize answer (binary search on answer space)\n\nPython: import bisect — bisect_left(arr, x), bisect_right(arr, x)', category: 'sorting-searching', difficulty: 2 },

  { id: 'sort-04', front: 'Trigger: "merge K sorted lists/arrays" → what approach?', back: 'Min Heap.\n\n1. Push first element of each list into min heap: (value, list_index, element_index)\n2. Pop smallest, add to result\n3. Push next element from same list\n4. Repeat until heap is empty\n\nTime: O(N log K) where N = total elements, K = number of lists.\nSpace: O(K) for the heap.\n\nAlternative: Divide and conquer merge — merge pairs, O(N log K) same complexity.', category: 'sorting-searching', difficulty: 2 },

];

export const TECHNIQUE_CARDS: FlashCard[] = techniques.map(t => ({
  id: `tech-${t.id}`,
  type: 'technique' as const,
  category: t.category,
  front: t.front,
  back: t.back,
  meta: { difficulty: String(t.difficulty) },
}));
