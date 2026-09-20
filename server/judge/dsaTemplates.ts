import type { DsaLanguage } from "../../shared/languages";

export const DSA_TEMPLATES: Record<
  "two-sum" | "valid-parentheses" | "merge-intervals",
  Record<DsaLanguage, string>
> = {
  "two-sum": {
    C: `#include <stdio.h>
#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Write your solution here
    *returnSize = 0;
    return NULL;
}`,

    "C++": `#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int> nums, int target) {
    // Write your solution here
    return {};
}`,

    "C#": `using System;
using System.Collections.Generic;

public class Solution
{
    public int[] TwoSum(int[] nums, int target)
    {
        // Write your solution here
        return Array.Empty<int>();
    }
}`,

    Java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,

    JavaScript: `function twoSum(nums, target) {
  // Write your solution here
  return [];
}`,

    TypeScript: `function twoSum(nums: number[], target: number): number[] {
  // Write your solution here
  return [];
}`,

    Python: `def twoSum(nums, target):
    # Write your solution here
    return []`,

    Go: `package main

func twoSum(nums []int, target int) []int {
    // Write your solution here
    return []int{}
}`,

    Rust: `fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
    // Write your solution here
    vec![]
}`,

    Kotlin: `class Solution {
    fun twoSum(nums: IntArray, target: Int): IntArray {
        // Write your solution here
        return intArrayOf()
    }
}`,

    Swift: `class Solution {
    func twoSum(_ nums: [Int], _ target: Int) -> [Int] {
        // Write your solution here
        return []
    }
}`,

    PHP: `<?php

function twoSum($nums, $target) {
    // Write your solution here
    return [];
}`,

    Ruby: `def two_sum(nums, target)
  # Write your solution here
  []
end`,

    Dart: `List<int> twoSum(List<int> nums, int target) {
  // Write your solution here
  return [];
}`,

    Scala: `object Solution {
  def twoSum(nums: Array[Int], target: Int): Array[Int] = {
    // Write your solution here
    Array.empty[Int]
  }
}`,

    R: `twoSum <- function(nums, target) {
  # Write your solution here
  integer(0)
}`,
  },

  "valid-parentheses": {
    C: `#include <stdbool.h>

bool isValid(char* s) {
    // Write your solution here
    return false;
}`,

    "C++": `#include <bits/stdc++.h>
using namespace std;

bool isValid(string s) {
    // Write your solution here
    return false;
}`,

    "C#": `using System;
using System.Collections.Generic;

public class Solution
{
    public bool IsValid(string s)
    {
        // Write your solution here
        return false;
    }
}`,

    Java: `import java.util.*;

class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        return false;
    }
}`,

    JavaScript: `function isValid(s) {
  // Write your solution here
  return false;
}`,

    TypeScript: `function isValid(s: string): boolean {
  // Write your solution here
  return false;
}`,

    Python: `def isValid(s):
    # Write your solution here
    return False`,

    Go: `package main

func isValid(s string) bool {
    // Write your solution here
    return false
}`,

    Rust: `fn is_valid(s: String) -> bool {
    // Write your solution here
    false
}`,

    Kotlin: `class Solution {
    fun isValid(s: String): Boolean {
        // Write your solution here
        return false
    }
}`,

    Swift: `class Solution {
    func isValid(_ s: String) -> Bool {
        // Write your solution here
        return false
    }
}`,

    PHP: `<?php

function isValid($s) {
    // Write your solution here
    return false;
}`,

    Ruby: `def valid_parentheses(s)
  # Write your solution here
  false
end`,

    Dart: `bool isValid(String s) {
  // Write your solution here
  return false;
}`,

    Scala: `object Solution {
  def isValid(s: String): Boolean = {
    // Write your solution here
    false
  }
}`,

    R: `isValid <- function(s) {
  # Write your solution here
  FALSE
}`,
  },

  "merge-intervals": {
    C: `#include <stdio.h>
#include <stdlib.h>

/*
 * Implement only this function.
 *
 * intervals:
 *   input array of [start, end] pairs
 *
 * intervalsSize:
 *   number of intervals
 *
 * intervalsColSize:
 *   column size for each input row
 *
 * returnSize:
 *   set this to the number of merged intervals
 *
 * returnColumnSizes:
 *   allocate one value of 2 for every returned interval
 */
int** merge(
    int** intervals,
    int intervalsSize,
    int* intervalsColSize,
    int* returnSize,
    int** returnColumnSizes
) {
    *returnSize = 0;
    *returnColumnSizes = NULL;

    /*
     * Write your solution here.
     */

    return NULL;
}`,

    "C++": `#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> merge(vector<vector<int>> intervals) {
    // Write your solution here
    return {};
}`,

    "C#": `using System;

public class Solution
{
    public int[][] Merge(int[][] intervals)
    {
        // Write your solution here
        return Array.Empty<int[]>();
    }
}`,

    Java: `import java.util.*;

class Solution {
    public int[][] merge(int[][] intervals) {
        // Write your solution here
        return new int[][]{};
    }
}`,

    JavaScript: `function merge(intervals) {
  // Write your solution here
  return [];
}`,

    TypeScript: `function merge(intervals: number[][]): number[][] {
  // Write your solution here
  return [];
}`,

    Python: `def merge(intervals):
    # Write your solution here
    return []`,

    Go: `package main

func merge(intervals [][]int) [][]int {
    // Write your solution here
    return [][]int{}
}`,

    Rust: `fn merge(intervals: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
    // Write your solution here
    vec![]
}`,

    Kotlin: `class Solution {
    fun merge(intervals: Array<IntArray>): Array<IntArray> {
        // Write your solution here
        return emptyArray()
    }
}`,

    Swift: `class Solution {
    func merge(_ intervals: [[Int]]) -> [[Int]] {
        // Write your solution here
        return []
    }
}`,

    PHP: `<?php

function merge($intervals) {
    // Write your solution here
    return [];
}`,

    Ruby: `def merge_intervals(intervals)
  # Write your solution here
  []
end`,

    Dart: `List<List<int>> merge(List<List<int>> intervals) {
  // Write your solution here
  return [];
}`,

    Scala: `object Solution {
  def merge(intervals: Array[Array[Int]]): Array[Array[Int]] = {
    // Write your solution here
    Array.empty
  }
}`,

    R: `mergeIntervals <- function(intervals) {
  # Write your solution here
  list()
}`,
  },
};

export function starterCode(
  problemId: keyof typeof DSA_TEMPLATES,
  language: DsaLanguage
): string {
  return DSA_TEMPLATES[problemId]?.[language] ?? "";
}