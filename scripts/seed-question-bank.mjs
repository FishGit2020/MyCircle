#!/usr/bin/env node
/**
 * Generate 570 interview questions (19 chapters x 3 difficulties x 10 each)
 * and upload to Cloud Storage as question-bank/questions.json.
 *
 * Usage:
 *   node scripts/seed-question-bank.mjs
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or Application Default Credentials
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

initializeApp({ storageBucket: 'mycircle-dash.firebasestorage.app' });

const CHAPTERS = [
  'Dynamic Arrays',
  'String Manipulation',
  'Two Pointers',
  'Grids & Matrices',
  'Binary Search',
  'Sets & Maps',
  'Sorting',
  'Stacks & Queues',
  'Recursion',
  'Linked Lists',
  'Trees',
  'Graphs',
  'Heaps',
  'Sliding Windows',
  'Backtracking',
  'Dynamic Programming',
  'Greedy Algorithms',
  'Topological Sort',
  'Prefix Sums',
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

function toSlug(name) {
  return name.replace(/&/g, 'and').toLowerCase().replace(/\s+/g, '-');
}

// Hand-crafted questions for Dynamic Arrays chapter
const DYNAMIC_ARRAYS_QUESTIONS = {
  easy: [
    { title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]', tags: ['arrays', 'hash-map'] },
    { title: 'Remove Duplicates from Sorted Array', description: 'Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. Return the number of unique elements.\n\nExample:\nInput: nums = [1,1,2]\nOutput: 2, nums = [1,2,_]', tags: ['arrays', 'two-pointers'] },
    { title: 'Best Time to Buy and Sell Stock', description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. Find the maximum profit you can achieve from one transaction (buy one and sell one share).\n\nExample:\nInput: prices = [7,1,5,3,6,4]\nOutput: 5', tags: ['arrays', 'greedy'] },
    { title: 'Contains Duplicate', description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.\n\nExample:\nInput: nums = [1,2,3,1]\nOutput: true', tags: ['arrays', 'hash-set'] },
    { title: 'Single Number', description: 'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one. You must implement a solution with linear time and constant space.\n\nExample:\nInput: nums = [2,2,1]\nOutput: 1', tags: ['arrays', 'bit-manipulation'] },
    { title: 'Merge Sorted Array', description: 'You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n. Merge nums2 into nums1 as one sorted array.\n\nExample:\nInput: nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3\nOutput: [1,2,2,3,5,6]', tags: ['arrays', 'two-pointers'] },
    { title: 'Move Zeroes', description: 'Given an integer array nums, move all 0s to the end while maintaining the relative order of non-zero elements. Must do this in-place.\n\nExample:\nInput: nums = [0,1,0,3,12]\nOutput: [1,3,12,0,0]', tags: ['arrays', 'two-pointers'] },
    { title: 'Plus One', description: 'You are given a large integer represented as an integer array digits, where each digits[i] is the ith digit. Increment the number by one and return the result.\n\nExample:\nInput: digits = [1,2,3]\nOutput: [1,2,4]', tags: ['arrays', 'math'] },
    { title: 'Running Sum of 1D Array', description: 'Given an array nums, return the running sum. runningSum[i] = sum(nums[0]...nums[i]).\n\nExample:\nInput: nums = [1,2,3,4]\nOutput: [1,3,6,10]', tags: ['arrays', 'prefix-sum'] },
    { title: 'Majority Element', description: 'Given an array nums of size n, return the majority element (appears more than n/2 times). You may assume the majority element always exists.\n\nExample:\nInput: nums = [2,2,1,1,1,2,2]\nOutput: 2', tags: ['arrays', 'voting'] },
  ],
  medium: [
    { title: 'Product of Array Except Self', description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. Must run in O(n) without division.\n\nExample:\nInput: nums = [1,2,3,4]\nOutput: [24,12,8,6]', tags: ['arrays', 'prefix'] },
    { title: 'Maximum Subarray', description: 'Given an integer array nums, find the subarray with the largest sum and return its sum.\n\nExample:\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6 (subarray [4,-1,2,1])', tags: ['arrays', 'dynamic-programming'] },
    { title: 'Container With Most Water', description: 'Given n non-negative integers representing heights, find two lines that together with the x-axis form a container that holds the most water.\n\nExample:\nInput: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49', tags: ['arrays', 'two-pointers'] },
    { title: '3Sum', description: 'Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nExample:\nInput: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]', tags: ['arrays', 'two-pointers', 'sorting'] },
    { title: 'Rotate Array', description: 'Given an integer array nums, rotate the array to the right by k steps.\n\nExample:\nInput: nums = [1,2,3,4,5,6,7], k = 3\nOutput: [5,6,7,1,2,3,4]', tags: ['arrays', 'math'] },
    { title: 'Find Minimum in Rotated Sorted Array', description: 'Given the sorted rotated array nums of unique elements, find the minimum element in O(log n) time.\n\nExample:\nInput: nums = [3,4,5,1,2]\nOutput: 1', tags: ['arrays', 'binary-search'] },
    { title: 'Subarray Sum Equals K', description: 'Given an integer array nums and an integer k, return the total number of subarrays whose sum equals k.\n\nExample:\nInput: nums = [1,1,1], k = 2\nOutput: 2', tags: ['arrays', 'hash-map', 'prefix-sum'] },
    { title: 'Sort Colors', description: 'Given an array nums with n objects colored red (0), white (1), or blue (2), sort them in-place using constant extra space.\n\nExample:\nInput: nums = [2,0,2,1,1,0]\nOutput: [0,0,1,1,2,2]', tags: ['arrays', 'two-pointers'] },
    { title: 'Next Permutation', description: 'Given an array of integers nums, rearrange into the next lexicographically greater permutation. If not possible, rearrange to the lowest order.\n\nExample:\nInput: nums = [1,2,3]\nOutput: [1,3,2]', tags: ['arrays', 'math'] },
    { title: 'Spiral Matrix', description: 'Given an m x n matrix, return all elements in spiral order.\n\nExample:\nInput: [[1,2,3],[4,5,6],[7,8,9]]\nOutput: [1,2,3,6,9,8,7,4,5]', tags: ['arrays', 'matrix'] },
  ],
  hard: [
    { title: 'Trapping Rain Water', description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\nExample:\nInput: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6', tags: ['arrays', 'two-pointers', 'stack'] },
    { title: 'First Missing Positive', description: 'Given an unsorted integer array nums, return the smallest missing positive integer. Must run in O(n) time and O(1) auxiliary space.\n\nExample:\nInput: nums = [3,4,-1,1]\nOutput: 2', tags: ['arrays', 'hash'] },
    { title: 'Median of Two Sorted Arrays', description: 'Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. The overall run time should be O(log(m+n)).\n\nExample:\nInput: nums1 = [1,3], nums2 = [2]\nOutput: 2.0', tags: ['arrays', 'binary-search'] },
    { title: 'Longest Consecutive Sequence', description: 'Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. Must run in O(n) time.\n\nExample:\nInput: nums = [100,4,200,1,3,2]\nOutput: 4 (sequence [1,2,3,4])', tags: ['arrays', 'hash-set'] },
    { title: 'Candy Distribution', description: 'There are n children standing in a line, each with a rating. Give each child at least one candy. Children with higher rating than neighbors must get more. Find the minimum total.\n\nExample:\nInput: ratings = [1,0,2]\nOutput: 5', tags: ['arrays', 'greedy'] },
    { title: 'Sliding Window Maximum', description: 'Given an array nums and a sliding window of size k moving left to right, return the max value in each window position.\n\nExample:\nInput: nums = [1,3,-1,-3,5,3,6,7], k = 3\nOutput: [3,3,5,5,6,7]', tags: ['arrays', 'deque'] },
    { title: 'Count of Range Sum', description: 'Given an integer array nums and two integers lower and upper, return the number of range sums that lie in [lower, upper] inclusive.\n\nExample:\nInput: nums = [-2,5,-1], lower = -2, upper = 2\nOutput: 3', tags: ['arrays', 'merge-sort', 'prefix-sum'] },
    { title: 'Maximum Gap', description: 'Given an integer array nums, return the maximum difference between two successive elements in its sorted form. Must run in O(n) time.\n\nExample:\nInput: nums = [3,6,9,1]\nOutput: 3', tags: ['arrays', 'bucket-sort'] },
    { title: 'Minimum Window Substring', description: 'Given strings s and t, return the minimum window substring of s containing all chars in t. If no such substring, return "".\n\nExample:\nInput: s = "ADOBECODEBANC", t = "ABC"\nOutput: "BANC"', tags: ['arrays', 'sliding-window', 'hash-map'] },
    { title: 'Insert Delete GetRandom O(1)', description: 'Implement a data structure that supports insert, remove, and getRandom, each in average O(1) time.\n\nExample:\ninsert(1) → true, remove(2) → false, insert(2) → true, getRandom() → 1 or 2', tags: ['arrays', 'hash-map', 'design'] },
  ],
};

// Template-based generation for other chapters
const CHAPTER_TEMPLATES = {
  'String Manipulation': {
    easy: ['Reverse String', 'Valid Palindrome', 'First Unique Character', 'Count and Say', 'Valid Anagram', 'Longest Common Prefix', 'Implement strStr()', 'Roman to Integer', 'String to Integer (atoi)', 'Length of Last Word'],
    medium: ['Longest Substring Without Repeating', 'Group Anagrams', 'Longest Palindromic Substring', 'Generate Parentheses', 'Decode Ways', 'Zigzag Conversion', 'String Compression', 'Multiply Strings', 'Compare Version Numbers', 'Simplify Path'],
    hard: ['Regular Expression Matching', 'Wildcard Matching', 'Edit Distance', 'Shortest Palindrome', 'Text Justification', 'Minimum Window Substring', 'Palindrome Pairs', 'Word Break II', 'Distinct Subsequences', 'Scramble String'],
  },
  'Two Pointers': {
    easy: ['Remove Element', 'Squares of Sorted Array', 'Backspace String Compare', 'Intersection of Two Arrays', 'Reverse Vowels', 'Is Subsequence', 'Assign Cookies', 'Merge Sorted Lists', 'Valid Mountain Array', 'Two Sum II'],
    medium: ['3Sum Closest', '4Sum', 'Sort Colors', 'Container With Most Water', 'Partition Labels', 'Interval List Intersections', 'Remove Nth Node from End', 'Boats to Save People', 'Longest Mountain in Array', 'Subarrays with K Different Integers'],
    hard: ['Trapping Rain Water', 'Minimum Window Substring', 'Substring with Concatenation', 'Smallest Range Covering K Lists', 'Count of Range Sum', 'Max Consecutive Ones III', 'Minimum Operations to Reduce X', 'Number of Subsequences', 'Count Pairs With Given Sum', 'Maximum Points on a Line'],
  },
  'Grids & Matrices': {
    easy: ['Transpose Matrix', 'Reshape Matrix', 'Island Perimeter', 'Flood Fill', 'Image Smoother', 'Toeplitz Matrix', 'Set Matrix Zeroes', 'Matrix Diagonal Sum', 'Lucky Numbers in Matrix', 'Cells with Odd Values'],
    medium: ['Number of Islands', 'Rotting Oranges', 'Spiral Matrix', 'Word Search', 'Game of Life', 'Surrounded Regions', 'Pacific Atlantic Water Flow', 'Maximal Square', 'Unique Paths', 'Minimum Path Sum'],
    hard: ['Largest Rectangle in Histogram', 'Maximal Rectangle', 'Shortest Path in Grid', 'Dungeon Game', 'Cherry Pickup', 'Swim in Rising Water', 'Shortest Path with Obstacles', 'Making A Large Island', 'Stamping the Grid', 'Escape the Spreading Fire'],
  },
  'Binary Search': {
    easy: ['Binary Search', 'First Bad Version', 'Search Insert Position', 'Count Negative Numbers', 'Sqrt(x)', 'Guess Number', 'Check if N has Double', 'Intersection of Arrays II', 'Two Sum II', 'Valid Perfect Square'],
    medium: ['Search in Rotated Array', 'Find Peak Element', 'Search 2D Matrix', 'Find Minimum in Rotated', 'Koko Eating Bananas', 'Capacity To Ship Packages', 'Split Array Largest Sum', 'Time Based Key-Value Store', 'Find First and Last Position', 'Single Element in Sorted'],
    hard: ['Median of Two Sorted Arrays', 'Find in Mountain Array', 'Count of Smaller Numbers', 'Divide Two Integers', 'Smallest Good Base', 'K-th Smallest Prime Fraction', 'Find K-th Smallest Pair Distance', 'Russian Doll Envelopes', 'Maximum Running Time', 'Minimum Number of Days'],
  },
  'Sets & Maps': {
    easy: ['Two Sum', 'Contains Duplicate', 'Intersection of Arrays', 'Single Number', 'Happy Number', 'Isomorphic Strings', 'Word Pattern', 'Ransom Note', 'First Unique Character', 'Jewels and Stones'],
    medium: ['Group Anagrams', 'Top K Frequent Elements', 'Longest Consecutive Sequence', 'Subarray Sum Equals K', 'LRU Cache', '4Sum II', 'Find All Anagrams', 'Minimum Index Sum', 'Longest Substring Without Repeating', 'Contiguous Array'],
    hard: ['Alien Dictionary', 'Max Points on a Line', 'Minimum Window Substring', 'All O One Data Structure', 'Count of Smaller Numbers', 'Number of Atoms', 'Stream of Characters', 'Substring with Concatenation', 'Max Frequency Stack', 'Word Ladder II'],
  },
  'Sorting': {
    easy: ['Merge Sorted Array', 'Sort Array By Parity', 'Valid Anagram', 'Relative Sort Array', 'Intersection of Arrays', 'Height Checker', 'Matrix Cells in Range', 'Minimum Difference', 'Largest Perimeter Triangle', 'Can Make Arithmetic Progression'],
    medium: ['Sort Colors', 'Merge Intervals', 'Insert Interval', 'Meeting Rooms II', 'Largest Number', 'Custom Sort String', 'Sort Characters By Frequency', 'Wiggle Sort II', 'Queue Reconstruction', 'Pancake Sorting'],
    hard: ['Count of Smaller Numbers', 'Reverse Pairs', 'Maximum Gap', 'Count of Range Sum', 'Merge K Sorted Lists', 'Minimum Number of Arrows', 'Russian Doll Envelopes', 'Orderly Queue', 'Sort Items by Groups', 'Minimum Cost to Hire K Workers'],
  },
  'Stacks & Queues': {
    easy: ['Valid Parentheses', 'Min Stack', 'Implement Queue Using Stacks', 'Baseball Game', 'Next Greater Element', 'Backspace String Compare', 'Remove Outer Parentheses', 'Number of Recent Calls', 'Implement Stack Using Queues', 'Remove All Adjacent Duplicates'],
    medium: ['Daily Temperatures', 'Decode String', 'Evaluate Reverse Polish', 'Asteroid Collision', 'Online Stock Span', 'Next Greater Element II', 'Simplify Path', 'Remove K Digits', 'Validate Stack Sequences', 'Basic Calculator II'],
    hard: ['Largest Rectangle in Histogram', 'Maximal Rectangle', 'Basic Calculator', 'Trapping Rain Water', 'Sliding Window Maximum', 'Maximum Frequency Stack', 'Shortest Subarray with Sum', 'Number of Visible People', 'Minimum Cost Tree From Leaf', 'Strange Printer'],
  },
  'Recursion': {
    easy: ['Power of Two', 'Reverse Linked List', 'Fibonacci Number', 'Maximum Depth of Binary Tree', 'Merge Two Sorted Lists', 'Same Tree', 'Climbing Stairs', 'Symmetric Tree', 'Range Sum of BST', 'Invert Binary Tree'],
    medium: ['Pow(x, n)', 'Generate Parentheses', 'Letter Combinations', 'Subsets', 'Permutations', 'Flatten Nested List Iterator', 'Decode String', 'Sort List', 'K-th Symbol in Grammar', 'Different Ways to Add Parentheses'],
    hard: ['Regular Expression Matching', 'Sudoku Solver', 'N-Queens', 'Expression Add Operators', 'Strobogrammatic Number III', 'Scramble String', 'Zuma Game', 'Number of Ways to Reorder', 'Special Binary String', 'Frog Jump'],
  },
  'Linked Lists': {
    easy: ['Reverse Linked List', 'Merge Two Sorted Lists', 'Linked List Cycle', 'Remove Duplicates', 'Palindrome Linked List', 'Intersection of Two Lists', 'Remove Elements', 'Middle of Linked List', 'Delete Node in a Linked List', 'Convert Binary to Integer'],
    medium: ['Add Two Numbers', 'Remove Nth Node from End', 'Swap Nodes in Pairs', 'Rotate List', 'Sort List', 'Reorder List', 'Copy List with Random Pointer', 'Flatten Multilevel List', 'Partition List', 'Linked List Cycle II'],
    hard: ['Merge K Sorted Lists', 'Reverse Nodes in K-Group', 'LRU Cache', 'LFU Cache', 'Design Skiplist', 'All O One Data Structure', 'Insert into Sorted Circular', 'Linked List in Binary Tree', 'Maximum Twin Sum', 'Design Browser History'],
  },
  'Trees': {
    easy: ['Maximum Depth', 'Invert Binary Tree', 'Same Tree', 'Symmetric Tree', 'Path Sum', 'Subtree of Another Tree', 'Minimum Depth', 'Balanced Binary Tree', 'Diameter of Binary Tree', 'Merge Two Binary Trees'],
    medium: ['Binary Tree Level Order', 'Validate BST', 'Kth Smallest in BST', 'Lowest Common Ancestor', 'Binary Tree Right Side View', 'Serialize and Deserialize BST', 'Construct from Preorder/Inorder', 'Flatten Binary Tree', 'Binary Tree Zigzag Level', 'Path Sum III'],
    hard: ['Serialize and Deserialize BT', 'Binary Tree Maximum Path Sum', 'Vertical Order Traversal', 'Count Complete Tree Nodes', 'Recover BST', 'Binary Tree Cameras', 'Maximum Sum BST', 'Minimum Cost Tree from Leaf', 'Number of Ways to Reorder', 'Distribute Coins in Binary Tree'],
  },
  'Graphs': {
    easy: ['Find Center of Star Graph', 'Find if Path Exists', 'Island Perimeter', 'Find the Town Judge', 'Flood Fill', 'Employee Importance', 'Keys and Rooms', 'Maximum Depth of N-ary Tree', 'Find All Groups of Farmland', 'Destination City'],
    medium: ['Number of Islands', 'Clone Graph', 'Course Schedule', 'Course Schedule II', 'Pacific Atlantic Water Flow', 'Rotting Oranges', 'Network Delay Time', 'Evaluate Division', 'Cheapest Flights Within K', 'Redundant Connection'],
    hard: ['Word Ladder', 'Alien Dictionary', 'Critical Connections', 'Reconstruct Itinerary', 'Swim in Rising Water', 'Bus Routes', 'Making A Large Island', 'Shortest Path Visiting All', 'Minimum Cost to Connect All', 'Word Ladder II'],
  },
  'Heaps': {
    easy: ['Last Stone Weight', 'Kth Largest Element in Stream', 'Relative Ranks', 'Sort Array by Increasing Freq', 'Find K Closest Elements', 'Minimum Cost of Ropes', 'Top K Frequent Words', 'K Weakest Rows', 'Maximum Product of Two Elements', 'Reduce Array Size to Half'],
    medium: ['Top K Frequent Elements', 'Kth Largest Element', 'Task Scheduler', 'Find K Pairs with Smallest Sums', 'K Closest Points to Origin', 'Reorganize String', 'Furthest Building You Can Reach', 'Seat Reservation Manager', 'Find Median from Data Stream', 'IPO'],
    hard: ['Merge K Sorted Lists', 'Find Median from Data Stream', 'Sliding Window Median', 'Trapping Rain Water II', 'The Skyline Problem', 'Minimum Cost to Hire K Workers', 'Smallest Range Covering K Lists', 'Maximum Performance of Team', 'Course Schedule III', 'Swim in Rising Water'],
  },
  'Sliding Windows': {
    easy: ['Maximum Average Subarray', 'Contains Duplicate II', 'Minimum Difference Pair', 'Diet Plan Performance', 'Number of Good Pairs', 'Defuse the Bomb', 'Find All Anagrams', 'Longest Nice Substring', 'Maximum Number of Vowels', 'Grumpy Bookstore Owner'],
    medium: ['Longest Substring Without Repeating', 'Minimum Size Subarray Sum', 'Longest Repeating Character Replacement', 'Permutation in String', 'Fruit Into Baskets', 'Max Consecutive Ones III', 'Subarrays with K Different', 'Maximum Points from Cards', 'Get Equal Substrings', 'Maximum Erasure Value'],
    hard: ['Minimum Window Substring', 'Sliding Window Maximum', 'Substring with Concatenation', 'Smallest Range Covering K Lists', 'Count of Range Sum', 'Subarrays with K Different II', 'Minimum Number of K Flips', 'Maximum Number of Visible People', 'Shortest Subarray with Sum', 'Minimum Swaps to Group All 1s'],
  },
  'Backtracking': {
    easy: ['Letter Case Permutation', 'Binary Watch', 'Path Sum II', 'Combinations', 'Subsets', 'Combination Sum III', 'Generate Parentheses', 'Palindrome Partitioning', 'Count Number of Max OR Subsets', 'Fair Distribution of Cookies'],
    medium: ['Permutations', 'Combination Sum', 'Word Search', 'N-Queens', 'Sudoku Solver', 'Letter Combinations of Phone', 'Restore IP Addresses', 'Partition to K Equal Sum', 'Beautiful Arrangement', 'Maximum Length of Concatenated String'],
    hard: ['N-Queens II', 'Expression Add Operators', 'Word Break II', 'Remove Invalid Parentheses', 'Palindrome Partitioning III', 'Stickers to Spell Word', 'Verbal Arithmetic Puzzle', 'Tiling Rectangle with Fewest Squares', 'Zuma Game', 'Number of Squareful Arrays'],
  },
  'Dynamic Programming': {
    easy: ['Climbing Stairs', 'Fibonacci Number', 'Min Cost Climbing Stairs', 'House Robber', 'Maximum Subarray', 'Best Time to Buy/Sell Stock', 'Counting Bits', 'Pascal Triangle', 'Is Subsequence', 'Divisor Game'],
    medium: ['Longest Increasing Subsequence', 'Coin Change', 'Word Break', 'Unique Paths', 'Jump Game', 'Longest Palindromic Substring', 'House Robber II', 'Decode Ways', 'Partition Equal Subset Sum', 'Longest Common Subsequence'],
    hard: ['Edit Distance', 'Regular Expression Matching', 'Burst Balloons', 'Interleaving String', 'Wildcard Matching', 'Distinct Subsequences', 'Palindrome Partitioning II', 'Dungeon Game', 'Cherry Pickup', 'Minimum Cost to Cut a Stick'],
  },
  'Greedy Algorithms': {
    easy: ['Assign Cookies', 'Lemonade Change', 'Best Time to Buy/Sell Stock II', 'Minimum Cost to Move Chips', 'Maximum Units on Truck', 'Split a String in Balanced', 'Largest Perimeter Triangle', 'Can Place Flowers', 'Maximize Sum After K Negations', 'Walking Robot Simulation'],
    medium: ['Jump Game', 'Jump Game II', 'Gas Station', 'Partition Labels', 'Task Scheduler', 'Non-overlapping Intervals', 'Minimum Number of Arrows', 'Queue Reconstruction', 'Boats to Save People', 'Reorganize String'],
    hard: ['Candy Distribution', 'Create Maximum Number', 'IPO', 'Minimum Number of Refueling Stops', 'Patching Array', 'Minimum Cost to Hire K Workers', 'Course Schedule III', 'Remove Duplicate Letters', 'Smallest Subsequence', 'Minimum Initial Energy to Finish Tasks'],
  },
  'Topological Sort': {
    easy: ['Find Center of Star Graph', 'Find the Town Judge', 'Destination City', 'Course Schedule Prerequisites', 'Count Unreachable Pairs', 'Find Champion', 'Number of Provinces', 'Redundant Connection', 'Minimum Vertices to Reach All', 'All Ancestors of a Node'],
    medium: ['Course Schedule', 'Course Schedule II', 'Alien Dictionary', 'Minimum Height Trees', 'Parallel Courses', 'Longest Path in DAG', 'Find All Possible Recipes', 'Sequence Reconstruction', 'Sort Items by Groups', 'Build a Matrix With Conditions'],
    hard: ['Alien Dictionary (Hard)', 'Longest Increasing Path in Matrix', 'Parallel Courses II', 'Sort Items by Groups Respecting Dependencies', 'Critical Connections', 'Minimum Cost to Make at Least One Valid Path', 'Collect All Apples in Tree', 'Number of Ways to Arrive at Destination', 'Rank Transform of Matrix', 'Maximum Employees to Be Invited'],
  },
  'Prefix Sums': {
    easy: ['Running Sum of 1D Array', 'Range Sum Query', 'Find Pivot Index', 'Subarray Sum Equals K', 'Minimum Value to Get Positive Step', 'Number of Good Pairs', 'Matrix Block Sum', 'Sum of All Odd Length Subarrays', 'Left and Right Sum Differences', 'Count Equal and Divisible Pairs'],
    medium: ['Product of Array Except Self', 'Contiguous Array', 'Subarray Sum Equals K', '2D Range Sum Query', 'Maximum Size Subarray Sum Equals K', 'Continuous Subarray Sum', 'Path Sum III', 'Random Pick with Weight', 'Find the Longest Substring', 'Count Number of Nice Subarrays'],
    hard: ['Count of Range Sum', 'Max Sum of Rectangle No Larger Than K', 'Number of Submatrices That Sum to Target', 'Shortest Subarray with Sum at Least K', 'Minimum Number of Increments', 'Make Array Strictly Increasing', 'Maximum Sum of 3 Non-Overlapping', 'Split Array with Equal Sum', 'Binary Subarrays With Sum', 'Count Subarrays With Median K'],
  },
};

function generateDescription(title, chapter, difficulty) {
  const diffDesc = difficulty === 'easy' ? 'a straightforward' : difficulty === 'medium' ? 'an intermediate' : 'a challenging';
  return `${title} is ${diffDesc} ${chapter.toLowerCase()} problem.\n\nGiven relevant input, implement an efficient solution.\n\nConstraints:\n- Consider time and space complexity\n- Handle edge cases (empty input, single element, etc.)\n- Optimize for the expected difficulty level`;
}

function generateQuestions() {
  const questions = [];
  let idCounter = 1;

  for (const chapter of CHAPTERS) {
    const slug = toSlug(chapter);

    if (chapter === 'Dynamic Arrays') {
      // Use hand-crafted questions
      for (const diff of DIFFICULTIES) {
        for (const q of DYNAMIC_ARRAYS_QUESTIONS[diff]) {
          questions.push({
            id: `q${idCounter++}`,
            chapter,
            chapterSlug: slug,
            difficulty: diff,
            title: q.title,
            description: q.description,
            tags: q.tags,
          });
        }
      }
    } else {
      // Template-based generation
      const templates = CHAPTER_TEMPLATES[chapter];
      if (!templates) continue;

      for (const diff of DIFFICULTIES) {
        const titles = templates[diff] || [];
        for (const title of titles) {
          questions.push({
            id: `q${idCounter++}`,
            chapter,
            chapterSlug: slug,
            difficulty: diff,
            title,
            description: generateDescription(title, chapter, diff),
            tags: [slug, diff],
          });
        }
      }
    }
  }

  return questions;
}

async function main() {
  console.log('Generating question bank...');
  const questions = generateQuestions();
  console.log(`Generated ${questions.length} questions across ${CHAPTERS.length} chapters.`);

  const data = {
    chapters: CHAPTERS,
    questions,
    generatedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(data, null, 2);
  const storagePath = 'question-bank/questions.json';

  console.log(`Uploading to gs://mycircle-dash.firebasestorage.app/${storagePath}...`);

  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);
  await file.save(Buffer.from(json, 'utf-8'), {
    contentType: 'application/json',
    metadata: { metadata: { generatedAt: new Date().toISOString() } },
  });

  console.log('Done! Question bank uploaded to Cloud Storage.');
  console.log(`  Chapters: ${CHAPTERS.length}`);
  console.log(`  Questions: ${questions.length}`);
  console.log(`  Per chapter: ~${Math.round(questions.length / CHAPTERS.length)}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to seed question bank:', err);
  process.exit(1);
});
