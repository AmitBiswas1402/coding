// LeetCode-style code templates for different languages

export const LEETCODE_TEMPLATES: Record<string, string> = {
  java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}`,
  cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`,
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};`,
  python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        
`,
  c: `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    
}`,
  csharp: `public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        
    }
}`,
  typescript: `function twoSum(nums: number[], target: number): number[] {
    
};`,
  go: `func twoSum(nums []int, target int) []int {
    
}`,
  rust: `impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        
    }
}`,
  ruby: `# @param {Integer[]} nums
# @param {Integer} target
# @return {Integer[]}
def two_sum(nums, target)
    
end`,
  php: `class Solution {
    /**
     * @param Integer[] $nums
     * @param Integer $target
     * @return Integer[]
     */
    function twoSum($nums, $target) {
        
    }
}`,
  swift: `class Solution {
    func twoSum(_ nums: [Int], _ target: Int) -> [Int] {
        
    }
}`,
};

// Generic template for problems without specific function signatures
export function getGenericTemplate(language: string, functionName: string = "solution"): string {
  switch (language) {
    case "java":
      return `class Solution {
    // Write your code here
    
}`;
    case "cpp":
      return `class Solution {
public:
    // Write your code here
    
};`;
    case "javascript":
      return `/**
 * @param {any} params
 * @return {any}
 */
var ${functionName} = function(params) {
    
};`;
    case "python":
      return `class Solution:
    def ${functionName}(self, *args, **kwargs):
        pass`;
    case "c":
      return `// Write your code here
int ${functionName}(void) {
    return 0;
}`;
    case "csharp":
      return `public class Solution {
    // Write your code here
    
}`;
    case "typescript":
      return `function ${functionName}(params: any): any {
    
};`;
    case "go":
      return `func ${functionName}() {
    
}`;
    case "rust":
      return `impl Solution {
    pub fn ${functionName}() {
        
    }
}`;
    case "ruby":
      return `def ${functionName}
    # Write your code here
end`;
    case "php":
      return `class Solution {
    function ${functionName}() {
        
    }
}`;
    case "swift":
      return `class Solution {
    func ${functionName}() {
        
    }
}`;
    default:
      return `// Write your code here\n`;
  }
}
