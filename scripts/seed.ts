import "dotenv/config";
import { db } from "../lib/db";
import { problems, testCases } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const SEED_PROBLEMS = [
  {
    title: "Two Sum",
    slug: "two-sum",
    statement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
    constraints: "2 <= nums.length <= 10^4. You may assume each input has exactly one solution.",
    inputFormat: "First line: space-separated integers (nums). Second line: target integer.",
    outputFormat: "Two space-separated indices.",
    difficulty: 1,
    topic: "Arrays",
    samples: [
      { input: "2 7 11 15\n9", output: "0 1" },
      { input: "3 2 4\n6", output: "1 2" },
    ],
    hidden: [{ input: "3 3\n6", output: "0 1" }],
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    statement: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    constraints: "1 <= s.length <= 10^4. s consists of parentheses only.",
    inputFormat: "A single line string s.",
    outputFormat: "true or false",
    difficulty: 1,
    topic: "Strings",
    samples: [{ input: "()", output: "true" }, { input: "()[]{}", output: "true" }],
    hidden: [{ input: "(]", output: "false" }],
  },
  {
    title: "Binary Tree Inorder Traversal",
    slug: "binary-tree-inorder",
    statement: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    constraints: "Number of nodes in the tree is in the range [0, 100].",
    inputFormat: "Level-order representation of the tree (e.g. 1,null,2,3).",
    outputFormat: "Space-separated values.",
    difficulty: 1,
    topic: "Trees",
    samples: [{ input: "1,null,2,3", output: "1 3 2" }],
    hidden: [{ input: "1", output: "1" }],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-no-repeat",
    statement: "Given a string `s`, find the length of the longest substring without repeating characters.",
    constraints: "0 <= s.length <= 5 * 10^4. s consists of English letters, digits, symbols and spaces.",
    inputFormat: "A single line string s.",
    outputFormat: "An integer — length of the longest substring.",
    difficulty: 2,
    topic: "Sliding Window",
    samples: [
      { input: "abcabcbb", output: "3" },
      { input: "bbbbb", output: "1" },
    ],
    hidden: [{ input: "pwwkew", output: "3" }, { input: "", output: "0" }],
  },
  {
    title: "Container With Most Water",
    slug: "container-with-most-water",
    statement: "You are given an integer array `height` of length n. There are n vertical lines drawn such that the two endpoints of the i-th line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
    constraints: "n == height.length. 2 <= n <= 10^5. 0 <= height[i] <= 10^4.",
    inputFormat: "Space-separated integers representing heights.",
    outputFormat: "An integer — the maximum area.",
    difficulty: 2,
    topic: "Arrays",
    samples: [
      { input: "1 8 6 2 5 4 8 3 7", output: "49" },
      { input: "1 1", output: "1" },
    ],
    hidden: [{ input: "4 3 2 1 4", output: "16" }],
  },
  {
    title: "Course Schedule",
    slug: "course-schedule",
    statement: "There are a total of `numCourses` courses you have to take, labeled from 0 to numCourses - 1. You are given an array `prerequisites` where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. Return true if you can finish all courses. Otherwise, return false.",
    constraints: "1 <= numCourses <= 2000. 0 <= prerequisites.length <= 5000.",
    inputFormat: "First line: numCourses. Following lines: pairs ai bi.",
    outputFormat: "true or false",
    difficulty: 2,
    topic: "Graphs",
    samples: [
      { input: "2\n1 0", output: "true" },
      { input: "2\n1 0\n0 1", output: "false" },
    ],
    hidden: [{ input: "3\n0 1\n0 2\n1 2", output: "true" }],
  },
  {
    title: "Longest Increasing Subsequence",
    slug: "longest-increasing-subsequence",
    statement: "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.",
    constraints: "1 <= nums.length <= 2500. -10^4 <= nums[i] <= 10^4.",
    inputFormat: "Space-separated integers.",
    outputFormat: "An integer — length of LIS.",
    difficulty: 3,
    topic: "DP",
    samples: [
      { input: "10 9 2 5 3 7 101 18", output: "4" },
      { input: "0 1 0 3 2 3", output: "4" },
    ],
    hidden: [{ input: "7 7 7 7 7", output: "1" }],
  },
  {
    title: "Word Search II",
    slug: "word-search-ii",
    statement: "Given an m x n `board` of characters and a list of strings `words`, return all words on the board. Each word must be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once in a word.",
    constraints: "m == board.length. n == board[i].length. 1 <= m, n <= 12. 1 <= words.length <= 3 * 10^4.",
    inputFormat: "First lines: the board rows (characters separated by spaces). Last line: words separated by spaces.",
    outputFormat: "Space-separated found words.",
    difficulty: 3,
    topic: "Backtracking",
    samples: [
      { input: "o a a n\ne t a e\ni h k r\ni f l v\noath pea eat rain", output: "eat oath" },
    ],
    hidden: [{ input: "a b\nc d\nabcb", output: "" }],
  },
  {
    title: "N-Queens",
    slug: "n-queens",
    statement: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Given an integer n, return the number of distinct solutions to the n-queens puzzle.",
    constraints: "1 <= n <= 9.",
    inputFormat: "A single integer n.",
    outputFormat: "An integer — the number of solutions.",
    difficulty: 3,
    topic: "Backtracking",
    samples: [
      { input: "4", output: "2" },
      { input: "1", output: "1" },
    ],
    hidden: [{ input: "8", output: "92" }],
  },
];

async function seed() {
  for (const p of SEED_PROBLEMS) {
    const [existing] = await db.select().from(problems).where(eq(problems.slug, p.slug)).limit(1);
    if (existing) continue;
    const [problem] = await db
      .insert(problems)
      .values({
        title: p.title,
        slug: p.slug,
        statement: p.statement,
        constraints: p.constraints,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        difficulty: p.difficulty,
        topic: p.topic,
      })
      .returning();
    if (!problem) continue;
    for (const s of p.samples) {
      await db.insert(testCases).values({
        problemId: problem.id,
        input: s.input,
        expectedOutput: s.output,
        isSample: true,
      });
    }
    for (const h of p.hidden) {
      await db.insert(testCases).values({
        problemId: problem.id,
        input: h.input,
        expectedOutput: h.output,
        isSample: false,
      });
    }
  }
  console.log("Seed done.");
}

seed().catch(console.error);
