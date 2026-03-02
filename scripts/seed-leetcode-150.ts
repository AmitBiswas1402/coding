import "dotenv/config";
import { db } from "../lib/db";
import { problems, testCases } from "../lib/db/schema";
import { eq } from "drizzle-orm";

type GeneratedTestCase = {
  input: string;
  expectedOutput: string;
  isSample: boolean;
};

// Topic mapping for the 150 problems
const PROBLEMS_DATA = [
  // Arrays (1-10)
  { title: "Two Sum", topic: "Arrays", difficulty: 1 },
  { title: "Best Time to Buy and Sell Stock", topic: "Arrays", difficulty: 1 },
  { title: "Contains Duplicate", topic: "Arrays", difficulty: 1 },
  { title: "Product of Array Except Self", topic: "Arrays", difficulty: 2 },
  { title: "Maximum Subarray", topic: "Arrays", difficulty: 1 },
  { title: "Maximum Product Subarray", topic: "Arrays", difficulty: 2 },
  { title: "Find Minimum in Rotated Sorted Array", topic: "Arrays", difficulty: 2 },
  { title: "Search in Rotated Sorted Array", topic: "Arrays", difficulty: 2 },
  { title: "3Sum", topic: "Arrays", difficulty: 2 },
  { title: "Container With Most Water", topic: "Arrays", difficulty: 2 },
  
  // Strings (11-20)
  { title: "Valid Anagram", topic: "Strings", difficulty: 1 },
  { title: "Group Anagrams", topic: "Strings", difficulty: 2 },
  { title: "Longest Substring Without Repeating Characters", topic: "Strings", difficulty: 2 },
  { title: "Longest Repeating Character Replacement", topic: "Strings", difficulty: 2 },
  { title: "Minimum Window Substring", topic: "Strings", difficulty: 3 },
  { title: "Valid Palindrome", topic: "Strings", difficulty: 1 },
  { title: "Longest Palindromic Substring", topic: "Strings", difficulty: 2 },
  { title: "Palindromic Substrings", topic: "Strings", difficulty: 2 },
  { title: "Encode and Decode Strings", topic: "Strings", difficulty: 2 },
  { title: "String to Integer (atoi)", topic: "Strings", difficulty: 2 },
  
  // Linked Lists (21-30)
  { title: "Reverse Linked List", topic: "Linked Lists", difficulty: 1 },
  { title: "Detect Cycle in Linked List", topic: "Linked Lists", difficulty: 2 },
  { title: "Merge Two Sorted Lists", topic: "Linked Lists", difficulty: 1 },
  { title: "Merge k Sorted Lists", topic: "Linked Lists", difficulty: 3 },
  { title: "Remove Nth Node From End of List", topic: "Linked Lists", difficulty: 2 },
  { title: "Reorder List", topic: "Linked Lists", difficulty: 2 },
  { title: "Add Two Numbers", topic: "Linked Lists", difficulty: 2 },
  { title: "Copy List with Random Pointer", topic: "Linked Lists", difficulty: 2 },
  { title: "Linked List Cycle II", topic: "Linked Lists", difficulty: 2 },
  { title: "Intersection of Two Linked Lists", topic: "Linked Lists", difficulty: 1 },
  
  // Stacks (31-38)
  { title: "Valid Parentheses", topic: "Stacks", difficulty: 1 },
  { title: "Min Stack", topic: "Stacks", difficulty: 2 },
  { title: "Evaluate Reverse Polish Notation", topic: "Stacks", difficulty: 2 },
  { title: "Daily Temperatures", topic: "Stacks", difficulty: 2 },
  { title: "Car Fleet", topic: "Stacks", difficulty: 2 },
  { title: "Largest Rectangle in Histogram", topic: "Stacks", difficulty: 3 },
  { title: "Implement Queue using Stacks", topic: "Stacks", difficulty: 1 },
  { title: "Implement Stack using Queues", topic: "Stacks", difficulty: 1 },
  
  // Binary Search (39-44)
  { title: "Binary Search", topic: "Binary Search", difficulty: 1 },
  { title: "Search a 2D Matrix", topic: "Binary Search", difficulty: 2 },
  { title: "Koko Eating Bananas", topic: "Binary Search", difficulty: 2 },
  { title: "Find Peak Element", topic: "Binary Search", difficulty: 2 },
  { title: "Search Insert Position", topic: "Binary Search", difficulty: 1 },
  { title: "Time Based Key-Value Store", topic: "Binary Search", difficulty: 2 },
  
  // Arrays/DP (45-50)
  { title: "Median of Two Sorted Arrays", topic: "Arrays", difficulty: 3 },
  { title: "Best Time to Buy and Sell Stock II", topic: "Arrays", difficulty: 2 },
  { title: "Longest Substring with At Most K Distinct Characters", topic: "Sliding Window", difficulty: 2 },
  { title: "Permutation in String", topic: "Sliding Window", difficulty: 2 },
  { title: "Find All Anagrams in a String", topic: "Sliding Window", difficulty: 2 },
  { title: "Sliding Window Maximum", topic: "Sliding Window", difficulty: 3 },
  
  // Trees (51-65)
  { title: "Maximum Depth of Binary Tree", topic: "Trees", difficulty: 1 },
  { title: "Same Tree", topic: "Trees", difficulty: 1 },
  { title: "Invert Binary Tree", topic: "Trees", difficulty: 1 },
  { title: "Binary Tree Level Order Traversal", topic: "Trees", difficulty: 2 },
  { title: "Serialize and Deserialize Binary Tree", topic: "Trees", difficulty: 3 },
  { title: "Subtree of Another Tree", topic: "Trees", difficulty: 1 },
  { title: "Construct Binary Tree from Preorder and Inorder Traversal", topic: "Trees", difficulty: 2 },
  { title: "Validate Binary Search Tree", topic: "Trees", difficulty: 2 },
  { title: "Kth Smallest Element in a BST", topic: "Trees", difficulty: 2 },
  { title: "Lowest Common Ancestor of a BST", topic: "Trees", difficulty: 1 },
  { title: "Lowest Common Ancestor of a Binary Tree", topic: "Trees", difficulty: 2 },
  { title: "Binary Tree Right Side View", topic: "Trees", difficulty: 2 },
  { title: "Balanced Binary Tree", topic: "Trees", difficulty: 1 },
  { title: "Diameter of Binary Tree", topic: "Trees", difficulty: 1 },
  { title: "Path Sum", topic: "Trees", difficulty: 1 },
  
  // Heaps (66-70)
  { title: "Kth Largest Element in an Array", topic: "Heaps", difficulty: 2 },
  { title: "Top K Frequent Elements", topic: "Heaps", difficulty: 2 },
  { title: "Find Median from Data Stream", topic: "Heaps", difficulty: 3 },
  { title: "Merge k Sorted Lists (Heap version)", topic: "Heaps", difficulty: 3 },
  { title: "Task Scheduler", topic: "Heaps", difficulty: 2 },
  
  // Backtracking (71-80)
  { title: "Subsets", topic: "Backtracking", difficulty: 2 },
  { title: "Combination Sum", topic: "Backtracking", difficulty: 2 },
  { title: "Permutations", topic: "Backtracking", difficulty: 2 },
  { title: "Subsets II", topic: "Backtracking", difficulty: 2 },
  { title: "Combination Sum II", topic: "Backtracking", difficulty: 2 },
  { title: "Word Search", topic: "Backtracking", difficulty: 2 },
  { title: "Palindrome Partitioning", topic: "Backtracking", difficulty: 2 },
  { title: "Letter Combinations of a Phone Number", topic: "Backtracking", difficulty: 2 },
  { title: "N-Queens", topic: "Backtracking", difficulty: 3 },
  { title: "Generate Parentheses", topic: "Backtracking", difficulty: 2 },
  
  // Graphs (81-90)
  { title: "Number of Islands", topic: "Graphs", difficulty: 2 },
  { title: "Clone Graph", topic: "Graphs", difficulty: 2 },
  { title: "Pacific Atlantic Water Flow", topic: "Graphs", difficulty: 2 },
  { title: "Course Schedule", topic: "Graphs", difficulty: 2 },
  { title: "Course Schedule II", topic: "Graphs", difficulty: 2 },
  { title: "Graph Valid Tree", topic: "Graphs", difficulty: 2 },
  { title: "Number of Connected Components in an Undirected Graph", topic: "Graphs", difficulty: 2 },
  { title: "Redundant Connection", topic: "Graphs", difficulty: 2 },
  { title: "Word Ladder", topic: "Graphs", difficulty: 3 },
  { title: "Rotting Oranges", topic: "Graphs", difficulty: 2 },
  
  // Dynamic Programming (91-107)
  { title: "Climbing Stairs", topic: "Dynamic Programming", difficulty: 1 },
  { title: "House Robber", topic: "Dynamic Programming", difficulty: 2 },
  { title: "House Robber II", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Longest Increasing Subsequence", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Coin Change", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Maximum Product Subarray (DP variant)", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Word Break", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Combination Sum IV", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Unique Paths", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Longest Common Subsequence", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Decode Ways", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Jump Game", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Partition Equal Subset Sum", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Edit Distance", topic: "Dynamic Programming", difficulty: 3 },
  { title: "Burst Balloons", topic: "Dynamic Programming", difficulty: 3 },
  { title: "Jump Game II", topic: "Dynamic Programming", difficulty: 2 },
  { title: "Gas Station", topic: "Dynamic Programming", difficulty: 2 },
  
  // Greedy (108-116)
  { title: "Hand of Straights", topic: "Greedy", difficulty: 2 },
  { title: "Merge Intervals", topic: "Greedy", difficulty: 2 },
  { title: "Non-overlapping Intervals", topic: "Greedy", difficulty: 2 },
  { title: "Partition Labels", topic: "Greedy", difficulty: 2 },
  { title: "Candy", topic: "Greedy", difficulty: 3 },
  { title: "Insert Interval", topic: "Greedy", difficulty: 2 },
  { title: "Meeting Rooms", topic: "Greedy", difficulty: 1 },
  { title: "Meeting Rooms II", topic: "Greedy", difficulty: 2 },
  { title: "Interval List Intersections", topic: "Greedy", difficulty: 2 },
  
  // Matrix (117-120)
  { title: "Set Matrix Zeroes", topic: "Matrix", difficulty: 2 },
  { title: "Spiral Matrix", topic: "Matrix", difficulty: 2 },
  { title: "Rotate Image", topic: "Matrix", difficulty: 2 },
  { title: "Word Search II", topic: "Matrix", difficulty: 3 },
  
  // Trie (121-124)
  { title: "Number of Islands II", topic: "Graphs", difficulty: 3 },
  { title: "Implement Trie", topic: "Trie", difficulty: 2 },
  { title: "Design Add and Search Words Data Structure", topic: "Trie", difficulty: 2 },
  { title: "Word Search II (Trie version)", topic: "Trie", difficulty: 3 },
  
  // Bit Manipulation (125-130)
  { title: "Single Number", topic: "Bit Manipulation", difficulty: 1 },
  { title: "Number of 1 Bits", topic: "Bit Manipulation", difficulty: 1 },
  { title: "Counting Bits", topic: "Bit Manipulation", difficulty: 1 },
  { title: "Reverse Bits", topic: "Bit Manipulation", difficulty: 1 },
  { title: "Missing Number", topic: "Bit Manipulation", difficulty: 1 },
  { title: "Sum of Two Integers", topic: "Bit Manipulation", difficulty: 2 },
  
  // Advanced (131-150)
  { title: "Trapping Rain Water", topic: "Arrays", difficulty: 3 },
  { title: "LRU Cache", topic: "Design", difficulty: 2 },
  { title: "LFU Cache", topic: "Design", difficulty: 3 },
  { title: "Median of Two Sorted Arrays", topic: "Arrays", difficulty: 3 },
  { title: "Merge k Sorted Lists", topic: "Linked Lists", difficulty: 3 },
  { title: "Sliding Window Maximum", topic: "Sliding Window", difficulty: 3 },
  { title: "Minimum Window Substring", topic: "Strings", difficulty: 3 },
  { title: "Largest Rectangle in Histogram", topic: "Stacks", difficulty: 3 },
  { title: "Regular Expression Matching", topic: "Dynamic Programming", difficulty: 3 },
  { title: "Wildcard Matching", topic: "Dynamic Programming", difficulty: 3 },
  { title: "Alien Dictionary", topic: "Graphs", difficulty: 3 },
  { title: "Serialize and Deserialize Binary Tree", topic: "Trees", difficulty: 3 },
  { title: "Longest Consecutive Sequence", topic: "Arrays", difficulty: 2 },
  { title: "Find Duplicate Number", topic: "Arrays", difficulty: 2 },
  { title: "Basic Calculator", topic: "Stacks", difficulty: 3 },
  { title: "Maximum Path Sum (Binary Tree)", topic: "Trees", difficulty: 3 },
  { title: "Shortest Path in Binary Matrix", topic: "Graphs", difficulty: 2 },
  { title: "Reconstruct Itinerary", topic: "Graphs", difficulty: 3 },
  { title: "Critical Connections in a Network", topic: "Graphs", difficulty: 3 },
  { title: "Minimum Height Trees", topic: "Graphs", difficulty: 2 },
];

function generateTestCases(title: string, _topic: string): GeneratedTestCase[] {
  switch (title) {
    // ========== ARRAYS ==========
    case "Two Sum":
      return [
        { input: JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }), expectedOutput: JSON.stringify([0, 1]), isSample: true },
        { input: JSON.stringify({ nums: [3, 2, 4], target: 6 }), expectedOutput: JSON.stringify([1, 2]), isSample: false },
        { input: JSON.stringify({ nums: [3, 3], target: 6 }), expectedOutput: JSON.stringify([0, 1]), isSample: false },
      ];
    case "Best Time to Buy and Sell Stock":
      return [
        { input: JSON.stringify({ prices: [7, 1, 5, 3, 6, 4] }), expectedOutput: JSON.stringify(5), isSample: true },
        { input: JSON.stringify({ prices: [7, 6, 4, 3, 1] }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ prices: [1] }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ prices: [2, 4, 1] }), expectedOutput: JSON.stringify(2), isSample: false },
      ];
    case "Contains Duplicate":
      return [
        { input: JSON.stringify({ nums: [1, 2, 3, 1] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ nums: [1, 2, 3, 4] }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ nums: [] }), expectedOutput: JSON.stringify(false), isSample: false },
      ];
    case "Product of Array Except Self":
      return [
        { input: JSON.stringify({ nums: [1, 2, 3, 4] }), expectedOutput: JSON.stringify([24, 12, 8, 6]), isSample: true },
        { input: JSON.stringify({ nums: [-1, 1, 0, -3, 3] }), expectedOutput: JSON.stringify([0, 0, 9, 0, 0]), isSample: false },
        { input: JSON.stringify({ nums: [2, 3] }), expectedOutput: JSON.stringify([3, 2]), isSample: false },
      ];
    case "Maximum Subarray":
      return [
        { input: JSON.stringify({ nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }), expectedOutput: JSON.stringify(6), isSample: true },
        { input: JSON.stringify({ nums: [1] }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ nums: [5, 4, -1, 7, 8] }), expectedOutput: JSON.stringify(23), isSample: false },
        { input: JSON.stringify({ nums: [-1] }), expectedOutput: JSON.stringify(-1), isSample: false },
      ];
    case "Maximum Product Subarray":
      return [
        { input: JSON.stringify({ nums: [2, 3, -2, 4] }), expectedOutput: JSON.stringify(6), isSample: true },
        { input: JSON.stringify({ nums: [-2, 0, -1] }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ nums: [-2, 3, -4] }), expectedOutput: JSON.stringify(24), isSample: false },
        { input: JSON.stringify({ nums: [0, 2] }), expectedOutput: JSON.stringify(2), isSample: false },
      ];
    case "Find Minimum in Rotated Sorted Array":
      return [
        { input: JSON.stringify({ nums: [3, 4, 5, 1, 2] }), expectedOutput: JSON.stringify(1), isSample: true },
        { input: JSON.stringify({ nums: [4, 5, 6, 7, 0, 1, 2] }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ nums: [11, 13, 15, 17] }), expectedOutput: JSON.stringify(11), isSample: false },
        { input: JSON.stringify({ nums: [2, 1] }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Search in Rotated Sorted Array":
      return [
        { input: JSON.stringify({ nums: [4, 5, 6, 7, 0, 1, 2], target: 0 }), expectedOutput: JSON.stringify(4), isSample: true },
        { input: JSON.stringify({ nums: [4, 5, 6, 7, 0, 1, 2], target: 3 }), expectedOutput: JSON.stringify(-1), isSample: false },
        { input: JSON.stringify({ nums: [1], target: 0 }), expectedOutput: JSON.stringify(-1), isSample: false },
        { input: JSON.stringify({ nums: [1], target: 1 }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "3Sum":
      return [
        { input: JSON.stringify({ nums: [-1, 0, 1, 2, -1, -4] }), expectedOutput: JSON.stringify([[-1, -1, 2], [-1, 0, 1]]), isSample: true },
        { input: JSON.stringify({ nums: [0, 1, 1] }), expectedOutput: JSON.stringify([]), isSample: false },
        { input: JSON.stringify({ nums: [0, 0, 0] }), expectedOutput: JSON.stringify([[0, 0, 0]]), isSample: false },
      ];
    case "Container With Most Water":
      return [
        { input: JSON.stringify({ height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }), expectedOutput: JSON.stringify(49), isSample: true },
        { input: JSON.stringify({ height: [1, 1] }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ height: [4, 3, 2, 1, 4] }), expectedOutput: JSON.stringify(16), isSample: false },
      ];

    // ========== STRINGS ==========
    case "Valid Anagram":
      return [
        { input: JSON.stringify({ s: "anagram", t: "nagaram" }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ s: "rat", t: "car" }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ s: "", t: "" }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ s: "a", t: "ab" }), expectedOutput: JSON.stringify(false), isSample: false },
      ];
    case "Group Anagrams":
      return [
        { input: JSON.stringify({ strs: ["eat", "tea", "tan", "ate", "nat", "bat"] }), expectedOutput: JSON.stringify([["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]), isSample: true },
        { input: JSON.stringify({ strs: [""] }), expectedOutput: JSON.stringify([[""]]), isSample: false },
        { input: JSON.stringify({ strs: ["a"] }), expectedOutput: JSON.stringify([["a"]]), isSample: false },
      ];
    case "Longest Substring Without Repeating Characters":
      return [
        { input: JSON.stringify({ s: "abcabcbb" }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ s: "bbbbb" }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ s: "pwwkew" }), expectedOutput: JSON.stringify(3), isSample: false },
        { input: JSON.stringify({ s: "" }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Longest Repeating Character Replacement":
      return [
        { input: JSON.stringify({ s: "ABAB", k: 2 }), expectedOutput: JSON.stringify(4), isSample: true },
        { input: JSON.stringify({ s: "AABABBA", k: 1 }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ s: "A", k: 0 }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Minimum Window Substring":
      return [
        { input: JSON.stringify({ s: "ADOBECODEBANC", t: "ABC" }), expectedOutput: JSON.stringify("BANC"), isSample: true },
        { input: JSON.stringify({ s: "a", t: "a" }), expectedOutput: JSON.stringify("a"), isSample: false },
        { input: JSON.stringify({ s: "a", t: "aa" }), expectedOutput: JSON.stringify(""), isSample: false },
      ];
    case "Valid Palindrome":
      return [
        { input: JSON.stringify({ s: "A man, a plan, a canal: Panama" }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ s: "race a car" }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ s: " " }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Longest Palindromic Substring":
      return [
        { input: JSON.stringify({ s: "babad" }), expectedOutput: JSON.stringify("bab"), isSample: true },
        { input: JSON.stringify({ s: "cbbd" }), expectedOutput: JSON.stringify("bb"), isSample: false },
        { input: JSON.stringify({ s: "a" }), expectedOutput: JSON.stringify("a"), isSample: false },
        { input: JSON.stringify({ s: "ac" }), expectedOutput: JSON.stringify("a"), isSample: false },
      ];
    case "Palindromic Substrings":
      return [
        { input: JSON.stringify({ s: "abc" }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ s: "aaa" }), expectedOutput: JSON.stringify(6), isSample: false },
        { input: JSON.stringify({ s: "a" }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Encode and Decode Strings":
      return [
        { input: JSON.stringify({ strs: ["hello", "world"] }), expectedOutput: JSON.stringify(["hello", "world"]), isSample: true },
        { input: JSON.stringify({ strs: [""] }), expectedOutput: JSON.stringify([""]), isSample: false },
        { input: JSON.stringify({ strs: ["lint", "code", "love", "you"] }), expectedOutput: JSON.stringify(["lint", "code", "love", "you"]), isSample: false },
      ];
    case "String to Integer (atoi)":
      return [
        { input: JSON.stringify({ s: "42" }), expectedOutput: JSON.stringify(42), isSample: true },
        { input: JSON.stringify({ s: "   -42" }), expectedOutput: JSON.stringify(-42), isSample: false },
        { input: JSON.stringify({ s: "4193 with words" }), expectedOutput: JSON.stringify(4193), isSample: false },
        { input: JSON.stringify({ s: "words and 987" }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ s: "" }), expectedOutput: JSON.stringify(0), isSample: false },
      ];

    // ========== LINKED LISTS ==========
    case "Reverse Linked List":
      return [
        { input: JSON.stringify({ head: [1, 2, 3, 4, 5] }), expectedOutput: JSON.stringify([5, 4, 3, 2, 1]), isSample: true },
        { input: JSON.stringify({ head: [1, 2] }), expectedOutput: JSON.stringify([2, 1]), isSample: false },
        { input: JSON.stringify({ head: [] }), expectedOutput: JSON.stringify([]), isSample: false },
      ];
    case "Detect Cycle in Linked List":
      return [
        { input: JSON.stringify({ head: [3, 2, 0, -4], pos: 1 }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ head: [1, 2], pos: 0 }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ head: [1], pos: -1 }), expectedOutput: JSON.stringify(false), isSample: false },
      ];
    case "Merge Two Sorted Lists":
      return [
        { input: JSON.stringify({ list1: [1, 2, 4], list2: [1, 3, 4] }), expectedOutput: JSON.stringify([1, 1, 2, 3, 4, 4]), isSample: true },
        { input: JSON.stringify({ list1: [], list2: [] }), expectedOutput: JSON.stringify([]), isSample: false },
        { input: JSON.stringify({ list1: [], list2: [0] }), expectedOutput: JSON.stringify([0]), isSample: false },
      ];
    case "Merge k Sorted Lists":
    case "Merge k Sorted Lists (Heap version)":
      return [
        { input: JSON.stringify({ lists: [[1, 4, 5], [1, 3, 4], [2, 6]] }), expectedOutput: JSON.stringify([1, 1, 2, 3, 4, 4, 5, 6]), isSample: true },
        { input: JSON.stringify({ lists: [] }), expectedOutput: JSON.stringify([]), isSample: false },
        { input: JSON.stringify({ lists: [[]] }), expectedOutput: JSON.stringify([]), isSample: false },
        { input: JSON.stringify({ lists: [[1], [2], [3]] }), expectedOutput: JSON.stringify([1, 2, 3]), isSample: false },
      ];
    case "Remove Nth Node From End of List":
      return [
        { input: JSON.stringify({ head: [1, 2, 3, 4, 5], n: 2 }), expectedOutput: JSON.stringify([1, 2, 3, 5]), isSample: true },
        { input: JSON.stringify({ head: [1], n: 1 }), expectedOutput: JSON.stringify([]), isSample: false },
        { input: JSON.stringify({ head: [1, 2], n: 1 }), expectedOutput: JSON.stringify([1]), isSample: false },
      ];
    case "Reorder List":
      return [
        { input: JSON.stringify({ head: [1, 2, 3, 4] }), expectedOutput: JSON.stringify([1, 4, 2, 3]), isSample: true },
        { input: JSON.stringify({ head: [1, 2, 3, 4, 5] }), expectedOutput: JSON.stringify([1, 5, 2, 4, 3]), isSample: false },
        { input: JSON.stringify({ head: [1] }), expectedOutput: JSON.stringify([1]), isSample: false },
      ];
    case "Add Two Numbers":
      return [
        { input: JSON.stringify({ l1: [2, 4, 3], l2: [5, 6, 4] }), expectedOutput: JSON.stringify([7, 0, 8]), isSample: true },
        { input: JSON.stringify({ l1: [0], l2: [0] }), expectedOutput: JSON.stringify([0]), isSample: false },
        { input: JSON.stringify({ l1: [9, 9, 9, 9, 9, 9, 9], l2: [9, 9, 9, 9] }), expectedOutput: JSON.stringify([8, 9, 9, 9, 0, 0, 0, 1]), isSample: false },
      ];
    case "Copy List with Random Pointer":
      return [
        { input: JSON.stringify({ head: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] }), expectedOutput: JSON.stringify([[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]), isSample: true },
        { input: JSON.stringify({ head: [[1, 1], [2, 1]] }), expectedOutput: JSON.stringify([[1, 1], [2, 1]]), isSample: false },
        { input: JSON.stringify({ head: [[3, null], [3, 0], [3, null]] }), expectedOutput: JSON.stringify([[3, null], [3, 0], [3, null]]), isSample: false },
      ];
    case "Linked List Cycle II":
      return [
        { input: JSON.stringify({ head: [3, 2, 0, -4], pos: 1 }), expectedOutput: JSON.stringify(1), isSample: true },
        { input: JSON.stringify({ head: [1, 2], pos: 0 }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ head: [1], pos: -1 }), expectedOutput: JSON.stringify(-1), isSample: false },
      ];
    case "Intersection of Two Linked Lists":
      return [
        { input: JSON.stringify({ listA: [4, 1, 8, 4, 5], listB: [5, 6, 1, 8, 4, 5], skipA: 2, skipB: 3 }), expectedOutput: JSON.stringify(8), isSample: true },
        { input: JSON.stringify({ listA: [1, 9, 1, 2, 4], listB: [3, 2, 4], skipA: 3, skipB: 1 }), expectedOutput: JSON.stringify(2), isSample: false },
        { input: JSON.stringify({ listA: [2, 6, 4], listB: [1, 5], skipA: 3, skipB: 2 }), expectedOutput: JSON.stringify(null), isSample: false },
      ];

    // ========== STACKS ==========
    case "Valid Parentheses":
      return [
        { input: JSON.stringify({ s: "()" }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ s: "()[]{}" }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ s: "(]" }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ s: "" }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Min Stack":
      return [
        { input: JSON.stringify({ operations: ["MinStack", "push", "push", "push", "getMin", "pop", "top", "getMin"], values: [[], [-2], [0], [-3], [], [], [], []] }), expectedOutput: JSON.stringify([null, null, null, null, -3, null, 0, -2]), isSample: true },
        { input: JSON.stringify({ operations: ["MinStack", "push", "push", "getMin", "pop", "getMin"], values: [[], [1], [2], [], [], []] }), expectedOutput: JSON.stringify([null, null, null, 1, null, 1]), isSample: false },
        { input: JSON.stringify({ operations: ["MinStack", "push", "getMin", "top"], values: [[], [0], [], []] }), expectedOutput: JSON.stringify([null, null, 0, 0]), isSample: false },
      ];
    case "Evaluate Reverse Polish Notation":
      return [
        { input: JSON.stringify({ tokens: ["2", "1", "+", "3", "*"] }), expectedOutput: JSON.stringify(9), isSample: true },
        { input: JSON.stringify({ tokens: ["4", "13", "5", "/", "+"] }), expectedOutput: JSON.stringify(6), isSample: false },
        { input: JSON.stringify({ tokens: ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"] }), expectedOutput: JSON.stringify(22), isSample: false },
      ];
    case "Daily Temperatures":
      return [
        { input: JSON.stringify({ temperatures: [73, 74, 75, 71, 69, 72, 76, 73] }), expectedOutput: JSON.stringify([1, 1, 4, 2, 1, 1, 0, 0]), isSample: true },
        { input: JSON.stringify({ temperatures: [30, 40, 50, 60] }), expectedOutput: JSON.stringify([1, 1, 1, 0]), isSample: false },
        { input: JSON.stringify({ temperatures: [30, 60, 90] }), expectedOutput: JSON.stringify([1, 1, 0]), isSample: false },
      ];
    case "Car Fleet":
      return [
        { input: JSON.stringify({ target: 12, position: [10, 8, 0, 5, 3], speed: [2, 4, 1, 1, 3] }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ target: 10, position: [3], speed: [3] }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ target: 100, position: [0, 2, 4], speed: [4, 2, 1] }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Largest Rectangle in Histogram":
      return [
        { input: JSON.stringify({ heights: [2, 1, 5, 6, 2, 3] }), expectedOutput: JSON.stringify(10), isSample: true },
        { input: JSON.stringify({ heights: [2, 4] }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ heights: [1] }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ heights: [2, 1, 2] }), expectedOutput: JSON.stringify(3), isSample: false },
      ];
    case "Implement Queue using Stacks":
      return [
        { input: JSON.stringify({ operations: ["MyQueue", "push", "push", "peek", "pop", "empty"], values: [[], [1], [2], [], [], []] }), expectedOutput: JSON.stringify([null, null, null, 1, 1, false]), isSample: true },
        { input: JSON.stringify({ operations: ["MyQueue", "push", "pop", "empty"], values: [[], [1], [], []] }), expectedOutput: JSON.stringify([null, null, 1, true]), isSample: false },
        { input: JSON.stringify({ operations: ["MyQueue", "push", "push", "push", "pop", "pop", "pop", "empty"], values: [[], [1], [2], [3], [], [], [], []] }), expectedOutput: JSON.stringify([null, null, null, null, 1, 2, 3, true]), isSample: false },
      ];
    case "Implement Stack using Queues":
      return [
        { input: JSON.stringify({ operations: ["MyStack", "push", "push", "top", "pop", "empty"], values: [[], [1], [2], [], [], []] }), expectedOutput: JSON.stringify([null, null, null, 2, 2, false]), isSample: true },
        { input: JSON.stringify({ operations: ["MyStack", "push", "pop", "empty"], values: [[], [1], [], []] }), expectedOutput: JSON.stringify([null, null, 1, true]), isSample: false },
        { input: JSON.stringify({ operations: ["MyStack", "push", "push", "push", "top", "pop", "top"], values: [[], [1], [2], [3], [], [], []] }), expectedOutput: JSON.stringify([null, null, null, null, 3, 3, 2]), isSample: false },
      ];

    // ========== BINARY SEARCH ==========
    case "Binary Search":
      return [
        { input: JSON.stringify({ nums: [-1, 0, 3, 5, 9, 12], target: 9 }), expectedOutput: JSON.stringify(4), isSample: true },
        { input: JSON.stringify({ nums: [-1, 0, 3, 5, 9, 12], target: 2 }), expectedOutput: JSON.stringify(-1), isSample: false },
        { input: JSON.stringify({ nums: [5], target: 5 }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Search a 2D Matrix":
      return [
        { input: JSON.stringify({ matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 3 }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 13 }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ matrix: [[1]], target: 1 }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Koko Eating Bananas":
      return [
        { input: JSON.stringify({ piles: [3, 6, 7, 11], h: 8 }), expectedOutput: JSON.stringify(4), isSample: true },
        { input: JSON.stringify({ piles: [30, 11, 23, 4, 20], h: 5 }), expectedOutput: JSON.stringify(30), isSample: false },
        { input: JSON.stringify({ piles: [30, 11, 23, 4, 20], h: 6 }), expectedOutput: JSON.stringify(23), isSample: false },
      ];
    case "Find Peak Element":
      return [
        { input: JSON.stringify({ nums: [1, 2, 3, 1] }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ nums: [1, 2, 1, 3, 5, 6, 4] }), expectedOutput: JSON.stringify(5), isSample: false },
        { input: JSON.stringify({ nums: [1] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Search Insert Position":
      return [
        { input: JSON.stringify({ nums: [1, 3, 5, 6], target: 5 }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ nums: [1, 3, 5, 6], target: 2 }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ nums: [1, 3, 5, 6], target: 7 }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ nums: [1, 3, 5, 6], target: 0 }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Time Based Key-Value Store":
      return [
        { input: JSON.stringify({ operations: ["TimeMap", "set", "get", "get", "set", "get", "get"], values: [[], ["foo", "bar", 1], ["foo", 1], ["foo", 3], ["foo", "bar2", 4], ["foo", 4], ["foo", 5]] }), expectedOutput: JSON.stringify([null, null, "bar", "bar", null, "bar2", "bar2"]), isSample: true },
        { input: JSON.stringify({ operations: ["TimeMap", "set", "get", "get"], values: [[], ["key", "val1", 1], ["key", 1], ["key", 0]] }), expectedOutput: JSON.stringify([null, null, "val1", ""]), isSample: false },
        { input: JSON.stringify({ operations: ["TimeMap", "set", "set", "get", "get"], values: [[], ["a", "x", 1], ["a", "y", 2], ["a", 1], ["a", 3]] }), expectedOutput: JSON.stringify([null, null, null, "x", "y"]), isSample: false },
      ];

    // ========== SLIDING WINDOW ==========
    case "Median of Two Sorted Arrays":
      return [
        { input: JSON.stringify({ nums1: [1, 3], nums2: [2] }), expectedOutput: JSON.stringify(2.0), isSample: true },
        { input: JSON.stringify({ nums1: [1, 2], nums2: [3, 4] }), expectedOutput: JSON.stringify(2.5), isSample: false },
        { input: JSON.stringify({ nums1: [], nums2: [1] }), expectedOutput: JSON.stringify(1.0), isSample: false },
      ];
    case "Best Time to Buy and Sell Stock II":
      return [
        { input: JSON.stringify({ prices: [7, 1, 5, 3, 6, 4] }), expectedOutput: JSON.stringify(7), isSample: true },
        { input: JSON.stringify({ prices: [1, 2, 3, 4, 5] }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ prices: [7, 6, 4, 3, 1] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Longest Substring with At Most K Distinct Characters":
      return [
        { input: JSON.stringify({ s: "eceba", k: 2 }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ s: "aa", k: 1 }), expectedOutput: JSON.stringify(2), isSample: false },
        { input: JSON.stringify({ s: "a", k: 0 }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Permutation in String":
      return [
        { input: JSON.stringify({ s1: "ab", s2: "eidbaooo" }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ s1: "ab", s2: "eidboaoo" }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ s1: "a", s2: "a" }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Find All Anagrams in a String":
      return [
        { input: JSON.stringify({ s: "cbaebabacd", p: "abc" }), expectedOutput: JSON.stringify([0, 6]), isSample: true },
        { input: JSON.stringify({ s: "abab", p: "ab" }), expectedOutput: JSON.stringify([0, 1, 2]), isSample: false },
        { input: JSON.stringify({ s: "a", p: "a" }), expectedOutput: JSON.stringify([0]), isSample: false },
      ];
    case "Sliding Window Maximum":
      return [
        { input: JSON.stringify({ nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 }), expectedOutput: JSON.stringify([3, 3, 5, 5, 6, 7]), isSample: true },
        { input: JSON.stringify({ nums: [1], k: 1 }), expectedOutput: JSON.stringify([1]), isSample: false },
        { input: JSON.stringify({ nums: [1, -1], k: 1 }), expectedOutput: JSON.stringify([1, -1]), isSample: false },
        { input: JSON.stringify({ nums: [7, 2, 4], k: 2 }), expectedOutput: JSON.stringify([7, 4]), isSample: false },
      ];

    // ========== TREES ==========
    case "Maximum Depth of Binary Tree":
      return [
        { input: JSON.stringify({ root: [3, 9, 20, null, null, 15, 7] }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ root: [1, null, 2] }), expectedOutput: JSON.stringify(2), isSample: false },
        { input: JSON.stringify({ root: [] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Same Tree":
      return [
        { input: JSON.stringify({ p: [1, 2, 3], q: [1, 2, 3] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ p: [1, 2], q: [1, null, 2] }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ p: [1, 2, 1], q: [1, 1, 2] }), expectedOutput: JSON.stringify(false), isSample: false },
      ];
    case "Invert Binary Tree":
      return [
        { input: JSON.stringify({ root: [4, 2, 7, 1, 3, 6, 9] }), expectedOutput: JSON.stringify([4, 7, 2, 9, 6, 3, 1]), isSample: true },
        { input: JSON.stringify({ root: [2, 1, 3] }), expectedOutput: JSON.stringify([2, 3, 1]), isSample: false },
        { input: JSON.stringify({ root: [] }), expectedOutput: JSON.stringify([]), isSample: false },
      ];
    case "Binary Tree Level Order Traversal":
      return [
        { input: JSON.stringify({ root: [3, 9, 20, null, null, 15, 7] }), expectedOutput: JSON.stringify([[3], [9, 20], [15, 7]]), isSample: true },
        { input: JSON.stringify({ root: [1] }), expectedOutput: JSON.stringify([[1]]), isSample: false },
        { input: JSON.stringify({ root: [] }), expectedOutput: JSON.stringify([]), isSample: false },
      ];
    case "Serialize and Deserialize Binary Tree":
      return [
        { input: JSON.stringify({ root: [1, 2, 3, null, null, 4, 5] }), expectedOutput: JSON.stringify([1, 2, 3, null, null, 4, 5]), isSample: true },
        { input: JSON.stringify({ root: [] }), expectedOutput: JSON.stringify([]), isSample: false },
        { input: JSON.stringify({ root: [1] }), expectedOutput: JSON.stringify([1]), isSample: false },
      ];
    case "Subtree of Another Tree":
      return [
        { input: JSON.stringify({ root: [3, 4, 5, 1, 2], subRoot: [4, 1, 2] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ root: [3, 4, 5, 1, 2, null, null, null, null, 0], subRoot: [4, 1, 2] }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ root: [1, 1], subRoot: [1] }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Construct Binary Tree from Preorder and Inorder Traversal":
      return [
        { input: JSON.stringify({ preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7] }), expectedOutput: JSON.stringify([3, 9, 20, null, null, 15, 7]), isSample: true },
        { input: JSON.stringify({ preorder: [-1], inorder: [-1] }), expectedOutput: JSON.stringify([-1]), isSample: false },
        { input: JSON.stringify({ preorder: [1, 2], inorder: [2, 1] }), expectedOutput: JSON.stringify([1, 2]), isSample: false },
      ];
    case "Validate Binary Search Tree":
      return [
        { input: JSON.stringify({ root: [2, 1, 3] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ root: [5, 1, 4, null, null, 3, 6] }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ root: [1] }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ root: [5, 4, 6, null, null, 3, 7] }), expectedOutput: JSON.stringify(false), isSample: false },
      ];
    case "Kth Smallest Element in a BST":
      return [
        { input: JSON.stringify({ root: [3, 1, 4, null, 2], k: 1 }), expectedOutput: JSON.stringify(1), isSample: true },
        { input: JSON.stringify({ root: [5, 3, 6, 2, 4, null, null, 1], k: 3 }), expectedOutput: JSON.stringify(3), isSample: false },
        { input: JSON.stringify({ root: [1], k: 1 }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Lowest Common Ancestor of a BST":
      return [
        { input: JSON.stringify({ root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 }), expectedOutput: JSON.stringify(6), isSample: true },
        { input: JSON.stringify({ root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 4 }), expectedOutput: JSON.stringify(2), isSample: false },
        { input: JSON.stringify({ root: [2, 1], p: 2, q: 1 }), expectedOutput: JSON.stringify(2), isSample: false },
      ];
    case "Lowest Common Ancestor of a Binary Tree":
      return [
        { input: JSON.stringify({ root: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 1 }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ root: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 4 }), expectedOutput: JSON.stringify(5), isSample: false },
        { input: JSON.stringify({ root: [1, 2], p: 1, q: 2 }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Binary Tree Right Side View":
      return [
        { input: JSON.stringify({ root: [1, 2, 3, null, 5, null, 4] }), expectedOutput: JSON.stringify([1, 3, 4]), isSample: true },
        { input: JSON.stringify({ root: [1, null, 3] }), expectedOutput: JSON.stringify([1, 3]), isSample: false },
        { input: JSON.stringify({ root: [] }), expectedOutput: JSON.stringify([]), isSample: false },
      ];
    case "Balanced Binary Tree":
      return [
        { input: JSON.stringify({ root: [3, 9, 20, null, null, 15, 7] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ root: [1, 2, 2, 3, 3, null, null, 4, 4] }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ root: [] }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Diameter of Binary Tree":
      return [
        { input: JSON.stringify({ root: [1, 2, 3, 4, 5] }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ root: [1, 2] }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ root: [1] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Path Sum":
      return [
        { input: JSON.stringify({ root: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], targetSum: 22 }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ root: [1, 2, 3], targetSum: 5 }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ root: [], targetSum: 0 }), expectedOutput: JSON.stringify(false), isSample: false },
      ];

    // ========== HEAPS ==========
    case "Kth Largest Element in an Array":
      return [
        { input: JSON.stringify({ nums: [3, 2, 1, 5, 6, 4], k: 2 }), expectedOutput: JSON.stringify(5), isSample: true },
        { input: JSON.stringify({ nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ nums: [1], k: 1 }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Top K Frequent Elements":
      return [
        { input: JSON.stringify({ nums: [1, 1, 1, 2, 2, 3], k: 2 }), expectedOutput: JSON.stringify([1, 2]), isSample: true },
        { input: JSON.stringify({ nums: [1], k: 1 }), expectedOutput: JSON.stringify([1]), isSample: false },
        { input: JSON.stringify({ nums: [4, 1, -1, 2, -1, 2, 3], k: 2 }), expectedOutput: JSON.stringify([-1, 2]), isSample: false },
      ];
    case "Find Median from Data Stream":
      return [
        { input: JSON.stringify({ operations: ["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"], values: [[], [1], [2], [], [3], []] }), expectedOutput: JSON.stringify([null, null, null, 1.5, null, 2.0]), isSample: true },
        { input: JSON.stringify({ operations: ["MedianFinder", "addNum", "findMedian"], values: [[], [5], []] }), expectedOutput: JSON.stringify([null, null, 5.0]), isSample: false },
        { input: JSON.stringify({ operations: ["MedianFinder", "addNum", "addNum", "addNum", "addNum", "findMedian"], values: [[], [1], [2], [3], [4], []] }), expectedOutput: JSON.stringify([null, null, null, null, null, 2.5]), isSample: false },
      ];
    case "Task Scheduler":
      return [
        { input: JSON.stringify({ tasks: ["A", "A", "A", "B", "B", "B"], n: 2 }), expectedOutput: JSON.stringify(8), isSample: true },
        { input: JSON.stringify({ tasks: ["A", "A", "A", "B", "B", "B"], n: 0 }), expectedOutput: JSON.stringify(6), isSample: false },
        { input: JSON.stringify({ tasks: ["A", "A", "A", "A", "A", "A", "B", "C", "D", "E", "F", "G"], n: 2 }), expectedOutput: JSON.stringify(16), isSample: false },
      ];

    // ========== BACKTRACKING ==========
    case "Subsets":
      return [
        { input: JSON.stringify({ nums: [1, 2, 3] }), expectedOutput: JSON.stringify([[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]), isSample: true },
        { input: JSON.stringify({ nums: [0] }), expectedOutput: JSON.stringify([[], [0]]), isSample: false },
        { input: JSON.stringify({ nums: [1, 2] }), expectedOutput: JSON.stringify([[], [1], [2], [1, 2]]), isSample: false },
      ];
    case "Combination Sum":
      return [
        { input: JSON.stringify({ candidates: [2, 3, 6, 7], target: 7 }), expectedOutput: JSON.stringify([[2, 2, 3], [7]]), isSample: true },
        { input: JSON.stringify({ candidates: [2, 3, 5], target: 8 }), expectedOutput: JSON.stringify([[2, 2, 2, 2], [2, 3, 3], [3, 5]]), isSample: false },
        { input: JSON.stringify({ candidates: [2], target: 1 }), expectedOutput: JSON.stringify([]), isSample: false },
      ];
    case "Permutations":
      return [
        { input: JSON.stringify({ nums: [1, 2, 3] }), expectedOutput: JSON.stringify([[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]), isSample: true },
        { input: JSON.stringify({ nums: [0, 1] }), expectedOutput: JSON.stringify([[0, 1], [1, 0]]), isSample: false },
        { input: JSON.stringify({ nums: [1] }), expectedOutput: JSON.stringify([[1]]), isSample: false },
      ];
    case "Subsets II":
      return [
        { input: JSON.stringify({ nums: [1, 2, 2] }), expectedOutput: JSON.stringify([[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]), isSample: true },
        { input: JSON.stringify({ nums: [0] }), expectedOutput: JSON.stringify([[], [0]]), isSample: false },
        { input: JSON.stringify({ nums: [4, 4, 4, 1, 4] }), expectedOutput: JSON.stringify([[], [1], [1, 4], [1, 4, 4], [1, 4, 4, 4], [1, 4, 4, 4, 4], [4], [4, 4], [4, 4, 4], [4, 4, 4, 4]]), isSample: false },
      ];
    case "Combination Sum II":
      return [
        { input: JSON.stringify({ candidates: [10, 1, 2, 7, 6, 1, 5], target: 8 }), expectedOutput: JSON.stringify([[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]), isSample: true },
        { input: JSON.stringify({ candidates: [2, 5, 2, 1, 2], target: 5 }), expectedOutput: JSON.stringify([[1, 2, 2], [5]]), isSample: false },
        { input: JSON.stringify({ candidates: [1], target: 2 }), expectedOutput: JSON.stringify([]), isSample: false },
      ];
    case "Word Search":
      return [
        { input: JSON.stringify({ board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "ABCCED" }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "SEE" }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "ABCB" }), expectedOutput: JSON.stringify(false), isSample: false },
      ];
    case "Palindrome Partitioning":
      return [
        { input: JSON.stringify({ s: "aab" }), expectedOutput: JSON.stringify([["a", "a", "b"], ["aa", "b"]]), isSample: true },
        { input: JSON.stringify({ s: "a" }), expectedOutput: JSON.stringify([["a"]]), isSample: false },
        { input: JSON.stringify({ s: "aba" }), expectedOutput: JSON.stringify([["a", "b", "a"], ["aba"]]), isSample: false },
      ];
    case "Letter Combinations of a Phone Number":
      return [
        { input: JSON.stringify({ digits: "23" }), expectedOutput: JSON.stringify(["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]), isSample: true },
        { input: JSON.stringify({ digits: "" }), expectedOutput: JSON.stringify([]), isSample: false },
        { input: JSON.stringify({ digits: "2" }), expectedOutput: JSON.stringify(["a", "b", "c"]), isSample: false },
      ];
    case "N-Queens":
      return [
        { input: JSON.stringify({ n: 4 }), expectedOutput: JSON.stringify([[".Q..", "...Q", "Q...", "..Q."], ["..Q.", "Q...", "...Q", ".Q.."]]), isSample: true },
        { input: JSON.stringify({ n: 1 }), expectedOutput: JSON.stringify([["Q"]]), isSample: false },
        { input: JSON.stringify({ n: 2 }), expectedOutput: JSON.stringify([]), isSample: false },
      ];
    case "Generate Parentheses":
      return [
        { input: JSON.stringify({ n: 3 }), expectedOutput: JSON.stringify(["((()))", "(()())", "(())()", "()(())", "()()()"]), isSample: true },
        { input: JSON.stringify({ n: 1 }), expectedOutput: JSON.stringify(["()"]), isSample: false },
        { input: JSON.stringify({ n: 2 }), expectedOutput: JSON.stringify(["(())", "()()"]), isSample: false },
      ];

    // ========== GRAPHS ==========
    case "Number of Islands":
      return [
        { input: JSON.stringify({ grid: [["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]] }), expectedOutput: JSON.stringify(1), isSample: true },
        { input: JSON.stringify({ grid: [["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]] }), expectedOutput: JSON.stringify(3), isSample: false },
        { input: JSON.stringify({ grid: [["0"]] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Clone Graph":
      return [
        { input: JSON.stringify({ adjList: [[2, 4], [1, 3], [2, 4], [1, 3]] }), expectedOutput: JSON.stringify([[2, 4], [1, 3], [2, 4], [1, 3]]), isSample: true },
        { input: JSON.stringify({ adjList: [[]] }), expectedOutput: JSON.stringify([[]]), isSample: false },
        { input: JSON.stringify({ adjList: [] }), expectedOutput: JSON.stringify([]), isSample: false },
      ];
    case "Pacific Atlantic Water Flow":
      return [
        { input: JSON.stringify({ heights: [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]] }), expectedOutput: JSON.stringify([[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]), isSample: true },
        { input: JSON.stringify({ heights: [[1]] }), expectedOutput: JSON.stringify([[0, 0]]), isSample: false },
        { input: JSON.stringify({ heights: [[1, 1], [1, 1]] }), expectedOutput: JSON.stringify([[0, 0], [0, 1], [1, 0], [1, 1]]), isSample: false },
      ];
    case "Course Schedule":
      return [
        { input: JSON.stringify({ numCourses: 2, prerequisites: [[1, 0]] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ numCourses: 2, prerequisites: [[1, 0], [0, 1]] }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ numCourses: 1, prerequisites: [] }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Course Schedule II":
      return [
        { input: JSON.stringify({ numCourses: 2, prerequisites: [[1, 0]] }), expectedOutput: JSON.stringify([0, 1]), isSample: true },
        { input: JSON.stringify({ numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]] }), expectedOutput: JSON.stringify([0, 1, 2, 3]), isSample: false },
        { input: JSON.stringify({ numCourses: 1, prerequisites: [] }), expectedOutput: JSON.stringify([0]), isSample: false },
      ];
    case "Graph Valid Tree":
      return [
        { input: JSON.stringify({ n: 5, edges: [[0, 1], [0, 2], [0, 3], [1, 4]] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ n: 5, edges: [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]] }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ n: 1, edges: [] }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Number of Connected Components in an Undirected Graph":
      return [
        { input: JSON.stringify({ n: 5, edges: [[0, 1], [1, 2], [3, 4]] }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]] }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ n: 3, edges: [] }), expectedOutput: JSON.stringify(3), isSample: false },
      ];
    case "Redundant Connection":
      return [
        { input: JSON.stringify({ edges: [[1, 2], [1, 3], [2, 3]] }), expectedOutput: JSON.stringify([2, 3]), isSample: true },
        { input: JSON.stringify({ edges: [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]] }), expectedOutput: JSON.stringify([1, 4]), isSample: false },
        { input: JSON.stringify({ edges: [[1, 2], [1, 3], [1, 4], [3, 4]] }), expectedOutput: JSON.stringify([3, 4]), isSample: false },
      ];
    case "Word Ladder":
      return [
        { input: JSON.stringify({ beginWord: "hit", endWord: "cog", wordList: ["hot", "dot", "dog", "lot", "log", "cog"] }), expectedOutput: JSON.stringify(5), isSample: true },
        { input: JSON.stringify({ beginWord: "hit", endWord: "cog", wordList: ["hot", "dot", "dog", "lot", "log"] }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ beginWord: "a", endWord: "c", wordList: ["a", "b", "c"] }), expectedOutput: JSON.stringify(2), isSample: false },
      ];
    case "Rotting Oranges":
      return [
        { input: JSON.stringify({ grid: [[2, 1, 1], [1, 1, 0], [0, 1, 1]] }), expectedOutput: JSON.stringify(4), isSample: true },
        { input: JSON.stringify({ grid: [[2, 1, 1], [0, 1, 1], [1, 0, 1]] }), expectedOutput: JSON.stringify(-1), isSample: false },
        { input: JSON.stringify({ grid: [[0, 2]] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];

    // ========== DYNAMIC PROGRAMMING ==========
    case "Climbing Stairs":
      return [
        { input: JSON.stringify({ n: 2 }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ n: 3 }), expectedOutput: JSON.stringify(3), isSample: false },
        { input: JSON.stringify({ n: 1 }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ n: 5 }), expectedOutput: JSON.stringify(8), isSample: false },
      ];
    case "House Robber":
      return [
        { input: JSON.stringify({ nums: [1, 2, 3, 1] }), expectedOutput: JSON.stringify(4), isSample: true },
        { input: JSON.stringify({ nums: [2, 7, 9, 3, 1] }), expectedOutput: JSON.stringify(12), isSample: false },
        { input: JSON.stringify({ nums: [0] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "House Robber II":
      return [
        { input: JSON.stringify({ nums: [2, 3, 2] }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ nums: [1, 2, 3, 1] }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ nums: [1, 2, 3] }), expectedOutput: JSON.stringify(3), isSample: false },
      ];
    case "Longest Increasing Subsequence":
      return [
        { input: JSON.stringify({ nums: [10, 9, 2, 5, 3, 7, 101, 18] }), expectedOutput: JSON.stringify(4), isSample: true },
        { input: JSON.stringify({ nums: [0, 1, 0, 3, 2, 3] }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ nums: [7, 7, 7, 7, 7, 7, 7] }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Coin Change":
      return [
        { input: JSON.stringify({ coins: [1, 5, 10, 25], amount: 11 }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ coins: [2], amount: 3 }), expectedOutput: JSON.stringify(-1), isSample: false },
        { input: JSON.stringify({ coins: [1], amount: 0 }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ coins: [1, 2, 5], amount: 11 }), expectedOutput: JSON.stringify(3), isSample: false },
      ];
    case "Maximum Product Subarray (DP variant)":
      return [
        { input: JSON.stringify({ nums: [2, 3, -2, 4] }), expectedOutput: JSON.stringify(6), isSample: true },
        { input: JSON.stringify({ nums: [-2, 0, -1] }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ nums: [-2] }), expectedOutput: JSON.stringify(-2), isSample: false },
      ];
    case "Word Break":
      return [
        { input: JSON.stringify({ s: "leetcode", wordDict: ["leet", "code"] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ s: "applepenapple", wordDict: ["apple", "pen"] }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ s: "catsandog", wordDict: ["cats", "dog", "sand", "and", "cat"] }), expectedOutput: JSON.stringify(false), isSample: false },
      ];
    case "Combination Sum IV":
      return [
        { input: JSON.stringify({ nums: [1, 2, 3], target: 4 }), expectedOutput: JSON.stringify(7), isSample: true },
        { input: JSON.stringify({ nums: [9], target: 3 }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ nums: [1, 2], target: 3 }), expectedOutput: JSON.stringify(3), isSample: false },
      ];
    case "Unique Paths":
      return [
        { input: JSON.stringify({ m: 3, n: 7 }), expectedOutput: JSON.stringify(28), isSample: true },
        { input: JSON.stringify({ m: 3, n: 2 }), expectedOutput: JSON.stringify(3), isSample: false },
        { input: JSON.stringify({ m: 1, n: 1 }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Longest Common Subsequence":
      return [
        { input: JSON.stringify({ text1: "abcde", text2: "ace" }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ text1: "abc", text2: "abc" }), expectedOutput: JSON.stringify(3), isSample: false },
        { input: JSON.stringify({ text1: "abc", text2: "def" }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Decode Ways":
      return [
        { input: JSON.stringify({ s: "12" }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ s: "226" }), expectedOutput: JSON.stringify(3), isSample: false },
        { input: JSON.stringify({ s: "06" }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ s: "10" }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Jump Game":
      return [
        { input: JSON.stringify({ nums: [2, 3, 1, 1, 4] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ nums: [3, 2, 1, 0, 4] }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ nums: [0] }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Partition Equal Subset Sum":
      return [
        { input: JSON.stringify({ nums: [1, 5, 11, 5] }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ nums: [1, 2, 3, 5] }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ nums: [1, 1] }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Edit Distance":
      return [
        { input: JSON.stringify({ word1: "horse", word2: "ros" }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ word1: "intention", word2: "execution" }), expectedOutput: JSON.stringify(5), isSample: false },
        { input: JSON.stringify({ word1: "", word2: "a" }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Burst Balloons":
      return [
        { input: JSON.stringify({ nums: [3, 1, 5, 8] }), expectedOutput: JSON.stringify(167), isSample: true },
        { input: JSON.stringify({ nums: [1, 5] }), expectedOutput: JSON.stringify(10), isSample: false },
        { input: JSON.stringify({ nums: [1] }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Jump Game II":
      return [
        { input: JSON.stringify({ nums: [2, 3, 1, 1, 4] }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ nums: [2, 3, 0, 1, 4] }), expectedOutput: JSON.stringify(2), isSample: false },
        { input: JSON.stringify({ nums: [1] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Gas Station":
      return [
        { input: JSON.stringify({ gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ gas: [2, 3, 4], cost: [3, 4, 3] }), expectedOutput: JSON.stringify(-1), isSample: false },
        { input: JSON.stringify({ gas: [5, 1, 2, 3, 4], cost: [4, 4, 1, 5, 1] }), expectedOutput: JSON.stringify(4), isSample: false },
      ];

    // ========== GREEDY ==========
    case "Hand of Straights":
      return [
        { input: JSON.stringify({ hand: [1, 2, 3, 6, 2, 3, 4, 7, 8], groupSize: 3 }), expectedOutput: JSON.stringify(true), isSample: true },
        { input: JSON.stringify({ hand: [1, 2, 3, 4, 5], groupSize: 4 }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ hand: [1, 1, 2, 2, 3, 3], groupSize: 3 }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Merge Intervals":
      return [
        { input: JSON.stringify({ intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] }), expectedOutput: JSON.stringify([[1, 6], [8, 10], [15, 18]]), isSample: true },
        { input: JSON.stringify({ intervals: [[1, 4], [4, 5]] }), expectedOutput: JSON.stringify([[1, 5]]), isSample: false },
        { input: JSON.stringify({ intervals: [[1, 4], [0, 4]] }), expectedOutput: JSON.stringify([[0, 4]]), isSample: false },
      ];
    case "Non-overlapping Intervals":
      return [
        { input: JSON.stringify({ intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] }), expectedOutput: JSON.stringify(1), isSample: true },
        { input: JSON.stringify({ intervals: [[1, 2], [1, 2], [1, 2]] }), expectedOutput: JSON.stringify(2), isSample: false },
        { input: JSON.stringify({ intervals: [[1, 2], [2, 3]] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Partition Labels":
      return [
        { input: JSON.stringify({ s: "ababcbacadefegdehijhklij" }), expectedOutput: JSON.stringify([9, 7, 8]), isSample: true },
        { input: JSON.stringify({ s: "eccbbbbdec" }), expectedOutput: JSON.stringify([10]), isSample: false },
        { input: JSON.stringify({ s: "a" }), expectedOutput: JSON.stringify([1]), isSample: false },
      ];
    case "Candy":
      return [
        { input: JSON.stringify({ ratings: [1, 0, 2] }), expectedOutput: JSON.stringify(5), isSample: true },
        { input: JSON.stringify({ ratings: [1, 2, 2] }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ ratings: [1, 3, 2, 2, 1] }), expectedOutput: JSON.stringify(7), isSample: false },
      ];
    case "Insert Interval":
      return [
        { input: JSON.stringify({ intervals: [[1, 3], [6, 9]], newInterval: [2, 5] }), expectedOutput: JSON.stringify([[1, 5], [6, 9]]), isSample: true },
        { input: JSON.stringify({ intervals: [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], newInterval: [4, 8] }), expectedOutput: JSON.stringify([[1, 2], [3, 10], [12, 16]]), isSample: false },
        { input: JSON.stringify({ intervals: [], newInterval: [5, 7] }), expectedOutput: JSON.stringify([[5, 7]]), isSample: false },
      ];
    case "Meeting Rooms":
      return [
        { input: JSON.stringify({ intervals: [[0, 30], [5, 10], [15, 20]] }), expectedOutput: JSON.stringify(false), isSample: true },
        { input: JSON.stringify({ intervals: [[7, 10], [2, 4]] }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ intervals: [] }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Meeting Rooms II":
      return [
        { input: JSON.stringify({ intervals: [[0, 30], [5, 10], [15, 20]] }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ intervals: [[7, 10], [2, 4]] }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ intervals: [[1, 5], [2, 6], [3, 7], [4, 8]] }), expectedOutput: JSON.stringify(4), isSample: false },
      ];
    case "Interval List Intersections":
      return [
        { input: JSON.stringify({ firstList: [[0, 2], [5, 10], [13, 23], [24, 25]], secondList: [[1, 5], [8, 12], [15, 24], [25, 26]] }), expectedOutput: JSON.stringify([[1, 2], [5, 5], [8, 10], [15, 23], [24, 24], [25, 25]]), isSample: true },
        { input: JSON.stringify({ firstList: [[1, 3], [5, 9]], secondList: [] }), expectedOutput: JSON.stringify([]), isSample: false },
        { input: JSON.stringify({ firstList: [[1, 7]], secondList: [[3, 10]] }), expectedOutput: JSON.stringify([[3, 7]]), isSample: false },
      ];

    // ========== MATRIX ==========
    case "Set Matrix Zeroes":
      return [
        { input: JSON.stringify({ matrix: [[1, 1, 1], [1, 0, 1], [1, 1, 1]] }), expectedOutput: JSON.stringify([[1, 0, 1], [0, 0, 0], [1, 0, 1]]), isSample: true },
        { input: JSON.stringify({ matrix: [[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]] }), expectedOutput: JSON.stringify([[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]]), isSample: false },
        { input: JSON.stringify({ matrix: [[1]] }), expectedOutput: JSON.stringify([[1]]), isSample: false },
      ];
    case "Spiral Matrix":
      return [
        { input: JSON.stringify({ matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }), expectedOutput: JSON.stringify([1, 2, 3, 6, 9, 8, 7, 4, 5]), isSample: true },
        { input: JSON.stringify({ matrix: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]] }), expectedOutput: JSON.stringify([1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]), isSample: false },
        { input: JSON.stringify({ matrix: [[1]] }), expectedOutput: JSON.stringify([1]), isSample: false },
      ];
    case "Rotate Image":
      return [
        { input: JSON.stringify({ matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }), expectedOutput: JSON.stringify([[7, 4, 1], [8, 5, 2], [9, 6, 3]]), isSample: true },
        { input: JSON.stringify({ matrix: [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]] }), expectedOutput: JSON.stringify([[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]]), isSample: false },
        { input: JSON.stringify({ matrix: [[1]] }), expectedOutput: JSON.stringify([[1]]), isSample: false },
      ];
    case "Word Search II":
    case "Word Search II (Trie version)":
      return [
        { input: JSON.stringify({ board: [["o", "a", "a", "n"], ["e", "t", "a", "e"], ["i", "h", "k", "r"], ["i", "f", "l", "v"]], words: ["oath", "pea", "eat", "rain"] }), expectedOutput: JSON.stringify(["eat", "oath"]), isSample: true },
        { input: JSON.stringify({ board: [["a", "b"], ["c", "d"]], words: ["abcb"] }), expectedOutput: JSON.stringify([]), isSample: false },
        { input: JSON.stringify({ board: [["a"]], words: ["a"] }), expectedOutput: JSON.stringify(["a"]), isSample: false },
      ];

    // ========== TRIE ==========
    case "Number of Islands II":
      return [
        { input: JSON.stringify({ m: 3, n: 3, positions: [[0, 0], [0, 1], [1, 2], [2, 1]] }), expectedOutput: JSON.stringify([1, 1, 2, 3]), isSample: true },
        { input: JSON.stringify({ m: 1, n: 1, positions: [[0, 0]] }), expectedOutput: JSON.stringify([1]), isSample: false },
        { input: JSON.stringify({ m: 3, n: 3, positions: [[0, 0], [0, 1], [1, 2], [2, 1], [1, 1]] }), expectedOutput: JSON.stringify([1, 1, 2, 3, 1]), isSample: false },
      ];
    case "Implement Trie":
      return [
        { input: JSON.stringify({ operations: ["Trie", "insert", "search", "search", "startsWith", "insert", "search"], values: [[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]] }), expectedOutput: JSON.stringify([null, null, true, false, true, null, true]), isSample: true },
        { input: JSON.stringify({ operations: ["Trie", "insert", "search", "startsWith"], values: [[], ["hello"], ["hell"], ["hell"]] }), expectedOutput: JSON.stringify([null, null, false, true]), isSample: false },
        { input: JSON.stringify({ operations: ["Trie", "insert", "insert", "search"], values: [[], ["a"], ["a"], ["a"]] }), expectedOutput: JSON.stringify([null, null, null, true]), isSample: false },
      ];
    case "Design Add and Search Words Data Structure":
      return [
        { input: JSON.stringify({ operations: ["WordDictionary", "addWord", "addWord", "addWord", "search", "search", "search", "search"], values: [[], ["bad"], ["dad"], ["mad"], ["pad"], ["bad"], [".ad"], ["b.."]] }), expectedOutput: JSON.stringify([null, null, null, null, false, true, true, true]), isSample: true },
        { input: JSON.stringify({ operations: ["WordDictionary", "addWord", "search", "search"], values: [[], ["a"], ["a"], [".."]] }), expectedOutput: JSON.stringify([null, null, true, false]), isSample: false },
        { input: JSON.stringify({ operations: ["WordDictionary", "addWord", "addWord", "search"], values: [[], ["at"], ["and"], ["a."]] }), expectedOutput: JSON.stringify([null, null, null, true]), isSample: false },
      ];

    // ========== BIT MANIPULATION ==========
    case "Single Number":
      return [
        { input: JSON.stringify({ nums: [2, 2, 1] }), expectedOutput: JSON.stringify(1), isSample: true },
        { input: JSON.stringify({ nums: [4, 1, 2, 1, 2] }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ nums: [1] }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Number of 1 Bits":
      return [
        { input: JSON.stringify({ n: 11 }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ n: 128 }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ n: 0 }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ n: 255 }), expectedOutput: JSON.stringify(8), isSample: false },
      ];
    case "Counting Bits":
      return [
        { input: JSON.stringify({ n: 2 }), expectedOutput: JSON.stringify([0, 1, 1]), isSample: true },
        { input: JSON.stringify({ n: 5 }), expectedOutput: JSON.stringify([0, 1, 1, 2, 1, 2]), isSample: false },
        { input: JSON.stringify({ n: 0 }), expectedOutput: JSON.stringify([0]), isSample: false },
      ];
    case "Reverse Bits":
      return [
        { input: JSON.stringify({ n: 43261596 }), expectedOutput: JSON.stringify(964176192), isSample: true },
        { input: JSON.stringify({ n: 4294967293 }), expectedOutput: JSON.stringify(3221225471), isSample: false },
        { input: JSON.stringify({ n: 0 }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Missing Number":
      return [
        { input: JSON.stringify({ nums: [3, 0, 1] }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ nums: [0, 1] }), expectedOutput: JSON.stringify(2), isSample: false },
        { input: JSON.stringify({ nums: [9, 6, 4, 2, 3, 5, 7, 0, 1] }), expectedOutput: JSON.stringify(8), isSample: false },
        { input: JSON.stringify({ nums: [0] }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Sum of Two Integers":
      return [
        { input: JSON.stringify({ a: 1, b: 2 }), expectedOutput: JSON.stringify(3), isSample: true },
        { input: JSON.stringify({ a: 2, b: 3 }), expectedOutput: JSON.stringify(5), isSample: false },
        { input: JSON.stringify({ a: -1, b: 1 }), expectedOutput: JSON.stringify(0), isSample: false },
        { input: JSON.stringify({ a: 0, b: 0 }), expectedOutput: JSON.stringify(0), isSample: false },
      ];

    // ========== ADVANCED ==========
    case "Trapping Rain Water":
      return [
        { input: JSON.stringify({ height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] }), expectedOutput: JSON.stringify(6), isSample: true },
        { input: JSON.stringify({ height: [4, 2, 0, 3, 2, 5] }), expectedOutput: JSON.stringify(9), isSample: false },
        { input: JSON.stringify({ height: [1, 0, 1] }), expectedOutput: JSON.stringify(1), isSample: false },
        { input: JSON.stringify({ height: [] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "LRU Cache":
      return [
        { input: JSON.stringify({ operations: ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"], values: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]] }), expectedOutput: JSON.stringify([null, null, null, 1, null, -1, null, -1, 3, 4]), isSample: true },
        { input: JSON.stringify({ operations: ["LRUCache", "put", "get", "put", "get", "get"], values: [[1], [2, 1], [2], [3, 2], [2], [3]] }), expectedOutput: JSON.stringify([null, null, 1, null, -1, 2]), isSample: false },
        { input: JSON.stringify({ operations: ["LRUCache", "put", "get"], values: [[1], [1, 1], [1]] }), expectedOutput: JSON.stringify([null, null, 1]), isSample: false },
      ];
    case "LFU Cache":
      return [
        { input: JSON.stringify({ operations: ["LFUCache", "put", "put", "get", "put", "get", "get", "put", "get", "get", "get"], values: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [3], [4, 4], [1], [3], [4]] }), expectedOutput: JSON.stringify([null, null, null, 1, null, -1, 3, null, -1, 3, 4]), isSample: true },
        { input: JSON.stringify({ operations: ["LFUCache", "put", "get"], values: [[1], [1, 1], [1]] }), expectedOutput: JSON.stringify([null, null, 1]), isSample: false },
        { input: JSON.stringify({ operations: ["LFUCache", "put", "put", "get", "get"], values: [[0], [0, 0], [0, 0], [0], [0]] }), expectedOutput: JSON.stringify([null, null, null, -1, -1]), isSample: false },
      ];
    case "Regular Expression Matching":
      return [
        { input: JSON.stringify({ s: "aa", p: "a" }), expectedOutput: JSON.stringify(false), isSample: true },
        { input: JSON.stringify({ s: "aa", p: "a*" }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ s: "ab", p: ".*" }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ s: "aab", p: "c*a*b" }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Wildcard Matching":
      return [
        { input: JSON.stringify({ s: "aa", p: "a" }), expectedOutput: JSON.stringify(false), isSample: true },
        { input: JSON.stringify({ s: "aa", p: "*" }), expectedOutput: JSON.stringify(true), isSample: false },
        { input: JSON.stringify({ s: "cb", p: "?a" }), expectedOutput: JSON.stringify(false), isSample: false },
        { input: JSON.stringify({ s: "adceb", p: "*a*b" }), expectedOutput: JSON.stringify(true), isSample: false },
      ];
    case "Alien Dictionary":
      return [
        { input: JSON.stringify({ words: ["wrt", "wrf", "er", "ett", "rftt"] }), expectedOutput: JSON.stringify("wertf"), isSample: true },
        { input: JSON.stringify({ words: ["z", "x"] }), expectedOutput: JSON.stringify("zx"), isSample: false },
        { input: JSON.stringify({ words: ["z", "x", "z"] }), expectedOutput: JSON.stringify(""), isSample: false },
      ];
    case "Longest Consecutive Sequence":
      return [
        { input: JSON.stringify({ nums: [100, 4, 200, 1, 3, 2] }), expectedOutput: JSON.stringify(4), isSample: true },
        { input: JSON.stringify({ nums: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] }), expectedOutput: JSON.stringify(9), isSample: false },
        { input: JSON.stringify({ nums: [] }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Find Duplicate Number":
      return [
        { input: JSON.stringify({ nums: [1, 3, 4, 2, 2] }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ nums: [3, 1, 3, 4, 2] }), expectedOutput: JSON.stringify(3), isSample: false },
        { input: JSON.stringify({ nums: [1, 1] }), expectedOutput: JSON.stringify(1), isSample: false },
      ];
    case "Basic Calculator":
      return [
        { input: JSON.stringify({ s: "1 + 1" }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ s: " 2-1 + 2 " }), expectedOutput: JSON.stringify(3), isSample: false },
        { input: JSON.stringify({ s: "(1+(4+5+2)-3)+(6+8)" }), expectedOutput: JSON.stringify(23), isSample: false },
        { input: JSON.stringify({ s: "0" }), expectedOutput: JSON.stringify(0), isSample: false },
      ];
    case "Maximum Path Sum (Binary Tree)":
      return [
        { input: JSON.stringify({ root: [1, 2, 3] }), expectedOutput: JSON.stringify(6), isSample: true },
        { input: JSON.stringify({ root: [-10, 9, 20, null, null, 15, 7] }), expectedOutput: JSON.stringify(42), isSample: false },
        { input: JSON.stringify({ root: [-3] }), expectedOutput: JSON.stringify(-3), isSample: false },
      ];
    case "Shortest Path in Binary Matrix":
      return [
        { input: JSON.stringify({ grid: [[0, 1], [1, 0]] }), expectedOutput: JSON.stringify(2), isSample: true },
        { input: JSON.stringify({ grid: [[0, 0, 0], [1, 1, 0], [1, 1, 0]] }), expectedOutput: JSON.stringify(4), isSample: false },
        { input: JSON.stringify({ grid: [[1, 0, 0], [1, 1, 0], [1, 1, 0]] }), expectedOutput: JSON.stringify(-1), isSample: false },
      ];
    case "Reconstruct Itinerary":
      return [
        { input: JSON.stringify({ tickets: [["MUC", "LHR"], ["JFK", "MUC"], ["SFO", "SJC"], ["LHR", "SFO"]] }), expectedOutput: JSON.stringify(["JFK", "MUC", "LHR", "SFO", "SJC"]), isSample: true },
        { input: JSON.stringify({ tickets: [["JFK", "SFO"], ["JFK", "ATL"], ["SFO", "ATL"], ["ATL", "JFK"], ["ATL", "SFO"]] }), expectedOutput: JSON.stringify(["JFK", "ATL", "JFK", "SFO", "ATL", "SFO"]), isSample: false },
        { input: JSON.stringify({ tickets: [["JFK", "A"], ["A", "JFK"]] }), expectedOutput: JSON.stringify(["JFK", "A", "JFK"]), isSample: false },
      ];
    case "Critical Connections in a Network":
      return [
        { input: JSON.stringify({ n: 4, connections: [[0, 1], [1, 2], [2, 0], [1, 3]] }), expectedOutput: JSON.stringify([[1, 3]]), isSample: true },
        { input: JSON.stringify({ n: 2, connections: [[0, 1]] }), expectedOutput: JSON.stringify([[0, 1]]), isSample: false },
        { input: JSON.stringify({ n: 5, connections: [[0, 1], [1, 2], [2, 3], [3, 4]] }), expectedOutput: JSON.stringify([[0, 1], [1, 2], [2, 3], [3, 4]]), isSample: false },
      ];
    case "Minimum Height Trees":
      return [
        { input: JSON.stringify({ n: 4, edges: [[1, 0], [1, 2], [1, 3]] }), expectedOutput: JSON.stringify([1]), isSample: true },
        { input: JSON.stringify({ n: 6, edges: [[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]] }), expectedOutput: JSON.stringify([3, 4]), isSample: false },
        { input: JSON.stringify({ n: 1, edges: [] }), expectedOutput: JSON.stringify([0]), isSample: false },
      ];

    // ========== DEFAULT FALLBACK ==========
    default:
      return [
        { input: JSON.stringify({ input: [1, 2, 3] }), expectedOutput: JSON.stringify([1, 2, 3]), isSample: true },
        { input: JSON.stringify({ input: [0] }), expectedOutput: JSON.stringify([0]), isSample: false },
        { input: JSON.stringify({ input: [] }), expectedOutput: JSON.stringify([]), isSample: false },
      ];
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateStatement(title: string, topic: string): string {
  const baseStatements: Record<string, string> = {
    "Two Sum": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
    "Best Time to Buy and Sell Stock": "You are given an array `prices` where `prices[i]` is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction.",
    "Contains Duplicate": "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
  };
  
  return baseStatements[title] || `Solve the problem: ${title}. This is a ${topic} problem.`;
}

function generateConstraints(topic: string): string {
  const constraints: Record<string, string> = {
    "Arrays": "1 <= nums.length <= 10^5. -10^9 <= nums[i] <= 10^9.",
    "Strings": "1 <= s.length <= 10^5. s consists of lowercase English letters.",
    "Linked Lists": "The number of nodes in the list is in the range [0, 10^4]. -10^5 <= Node.val <= 10^5.",
    "Trees": "The number of nodes in the tree is in the range [0, 10^4]. -10^4 <= Node.val <= 10^4.",
    "Dynamic Programming": "1 <= n <= 100. 0 <= nums[i] <= 100.",
  };
  
  return constraints[topic] || "1 <= n <= 10^4.";
}

async function seed() {
  console.log("Starting seed for 150 LeetCode problems...");
  let inserted = 0;
  let skipped = 0;

  for (const problemData of PROBLEMS_DATA) {
    const slug = generateSlug(problemData.title);
    
    // Check if problem already exists
    const [existing] = await db
      .select()
      .from(problems)
      .where(eq(problems.slug, slug))
      .limit(1);
    
    if (existing) {
      // Delete old test cases and re-seed with real ones
      await db.delete(testCases).where(eq(testCases.problemId, existing.id));
      const cases = generateTestCases(problemData.title, problemData.topic);
      for (const tc of cases) {
        await db.insert(testCases).values({
          problemId: existing.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isSample: tc.isSample,
        });
      }
      console.log(`  Updated test cases for: ${problemData.title} (${cases.length} cases)`);
      inserted++;
      continue;
    }

    const statement = generateStatement(problemData.title, problemData.topic);
    const constraints = generateConstraints(problemData.topic);

    const [problem] = await db
      .insert(problems)
      .values({
        title: problemData.title,
        slug,
        statement,
        constraints,
        inputFormat: "Follow the standard input format for this problem type.",
        outputFormat: "Return the expected output format.",
        difficulty: problemData.difficulty,
        topic: problemData.topic,
        source: "leetcode",
      })
      .returning();

    if (!problem) {
      skipped++;
      continue;
    }

    // Add real test cases
    const cases = generateTestCases(problemData.title, problemData.topic);
    for (const tc of cases) {
      await db.insert(testCases).values({
        problemId: problem.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isSample: tc.isSample,
      });
    }
    console.log(`  Inserted new problem: ${problemData.title} (${cases.length} cases)`);

    inserted++;
  }

  console.log(`Seed complete! Inserted: ${inserted}, Skipped: ${skipped}`);
}

seed().catch(console.error);
