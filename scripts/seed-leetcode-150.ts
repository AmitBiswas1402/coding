import "dotenv/config";
import { db } from "../lib/db";
import { problems, testCases } from "../lib/db/schema";
import { eq } from "drizzle-orm";

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
      skipped++;
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

    // Add sample test cases
    await db.insert(testCases).values({
      problemId: problem.id,
      input: "Sample input",
      expectedOutput: "Sample output",
      isSample: true,
    });

    inserted++;
  }

  console.log(`Seed complete! Inserted: ${inserted}, Skipped: ${skipped}`);
}

seed().catch(console.error);
