import type { FlashCard } from '../types';

export type TechniqueCategory =
  | 'algorithms'
  | 'two-pointers'
  | 'python-syntax'
  | 'bugs';

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

];

export const TECHNIQUE_CARDS: FlashCard[] = techniques.map(t => ({
  id: `tech-${t.id}`,
  type: 'technique' as const,
  category: t.category,
  front: t.front,
  back: t.back,
  meta: { difficulty: String(t.difficulty) },
}));
