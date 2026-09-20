import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
async function runProcess(
  command: string,
  args: string[],
  timeout = 30_000
) {
  const result = await execFileAsync(command, args, {
    timeout,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });

  return result.stdout.trim();
}

import {
  DSA_LANGUAGES,
  type DsaLanguage,
} from "../shared/languages";

export type CodingLanguage = DsaLanguage;

const MAX_CODE = 80_000;
const TIMEOUT_MS = 5_000;

function safeJson(value: unknown) {
  return JSON.stringify(value);
}

function dsaHarness(
  problemId: string,
  language: CodingLanguage,
  publicOnly = false
): string {
  const cases: any = {
    "two-sum": [
      [[2, 7, 11, 15], 9, [0, 1]],
      [[3, 2, 4], 6, [1, 2]],
      [[3, 3], 6, [0, 1]],
      [[-1, -2, -3, -4, -5], -8, [2, 4]],
    ],
    "valid-parentheses": [
      ["()", true],
      ["()[]{}", true],
      ["(]", false],
      ["([{}])", true],
      ["([)]", false],
    ],
    "merge-intervals": [
      [
        [
          [1, 3],
          [2, 6],
          [8, 10],
          [15, 18],
        ],
        [
          [1, 6],
          [8, 10],
          [15, 18],
        ],
      ],
      [
        [
          [1, 4],
          [4, 5],
        ],
        [[1, 5]],
      ],
      [
        [
          [1, 10],
          [2, 3],
          [4, 8],
        ],
        [[1, 10]],
      ],
    ],
  };
  const selected = publicOnly
    ? cases[problemId].slice(0, problemId === "merge-intervals" ? 2 : 3)
    : cases[problemId];
  const fn =
    problemId === "two-sum"
      ? "twoSum"
      : problemId === "valid-parentheses"
        ? "isValid"
        : "merge";
  if (language === "JavaScript" || language === "TypeScript") {
    const calls = selected
      .map((c: any) =>
        problemId === "two-sum"
          ? `[${JSON.stringify(c[2])},${JSON.stringify(c[0])},${c[1]}]`
          : problemId === "valid-parentheses"
            ? `[${JSON.stringify(c[0])},${c[1]}]`
            : `[${JSON.stringify(c[1])},${JSON.stringify(c[0])}]`
      )
      .join(",");
    return `\nconst __cases=[${calls}]; for(const [expected,...args] of __cases){const actual=${fn}(...args); if(JSON.stringify(actual)!==JSON.stringify(expected)) throw new Error("Wrong Answer | expected "+JSON.stringify(expected)+" got "+JSON.stringify(actual));} console.log("__AW_RESULT__ "+__cases.length+"/"+__cases.length);`;
  }
  if (language === "Python") {
    if (problemId === "two-sum")
      return `\n__cases=${JSON.stringify(selected)}\nfor nums,target,expected in __cases:\n    actual=twoSum(nums,target)\n    if actual!=expected: raise Exception(f"Wrong Answer | expected {expected} got {actual}")\nprint(f"__AW_RESULT__ {len(__cases)}/{len(__cases)}")\n`;
    if (problemId === "valid-parentheses")
      return `\n__cases=${JSON.stringify(selected)}\nfor value,expected in __cases:\n    actual=isValid(value)\n    if actual!=expected: raise Exception(f"Wrong Answer | expected {expected} got {actual}")\nprint(f"__AW_RESULT__ {len(__cases)}/{len(__cases)}")\n`;
    return `\n__cases=${JSON.stringify(selected)}\nfor value,expected in __cases:\n    actual=merge(value)\n    if actual!=expected: raise Exception(f"Wrong Answer | expected {expected} got {actual}")\nprint(f"__AW_RESULT__ {len(__cases)}/{len(__cases)}")\n`;
  }
  if (language === "C++") {
    if (problemId === "two-sum") {
      const n = selected.map((c: any) => `{${c[0].join(",")}}`).join(",");
      const t = selected.map((c: any) => c[1]).join(",");
      const e = selected.map((c: any) => `{${c[2].join(",")}}`).join(",");
      return `\nint main(){vector<vector<int>> n={${n}};vector<int> t={${t}};vector<vector<int>> e={${e}};for(int i=0;i<n.size();++i)if(twoSum(n[i],t[i])!=e[i]){cerr<<"Wrong Answer";return 1;}cout<<"__AW_RESULT__ ${selected.length}/${selected.length}";}`;
    }
    if (problemId === "valid-parentheses") {
      const ss = selected
        .map((c: any) => `{"${c[0]}",${c[1] ? "true" : "false"}}`)
        .join(",");
      return `\nint main(){vector<pair<string,bool>> c={${ss}};for(auto &x:c)if(isValid(x.first)!=x.second){cerr<<"Wrong Answer";return 1;}cout<<"__AW_RESULT__ ${selected.length}/${selected.length}";}`;
    }
    const ins = selected
      .map(
        (c: any) => `{{${c[0].map((x: any) => `{${x.join(",")}}`).join(",")}}}`
      )
      .join(",");
    const outs = selected
      .map(
        (c: any) => `{{${c[1].map((x: any) => `{${x.join(",")}}`).join(",")}}}`
      )
      .join(",");
    return `\nint main(){vector<vector<vector<int>>> in={${ins}},out={${outs}};for(int i=0;i<in.size();++i)if(merge(in[i])!=out[i]){cerr<<"Wrong Answer";return 1;}cout<<"__AW_RESULT__ ${selected.length}/${selected.length}";}`;
  }
  if (language === "Java") {
    if (problemId === "two-sum")
      return `\nclass Main{public static void main(String[]a){int[][] n={${selected.map((c: any) => `{${c[0].join(",")}}`).join(",")}};int[] t={${selected.map((c: any) => c[1]).join(",")}};int[][] e={${selected.map((c: any) => `{${c[2].join(",")}}`).join(",")}};for(int i=0;i<n.length;i++)if(!java.util.Arrays.equals(Solution.twoSum(n[i],t[i]),e[i]))throw new RuntimeException("Wrong Answer");System.out.println("__AW_RESULT__ ${selected.length}/${selected.length}");}}`;
    if (problemId === "valid-parentheses")
      return `\nclass Main{public static void main(String[]a){String[] s={${selected.map((c: any) => JSON.stringify(c[0])).join(",")}};boolean[] e={${selected.map((c: any) => c[1]).join(",")}};for(int i=0;i<s.length;i++)if(Solution.isValid(s[i])!=e[i])throw new RuntimeException("Wrong Answer");System.out.println("__AW_RESULT__ ${selected.length}/${selected.length}");}}`;
    return `\nclass Main{static boolean eq(int[][]a,int[][]b){return java.util.Arrays.deepEquals(a,b);}public static void main(String[]a){int[][][] in={${selected.map((c: any) => `{${c[0].map((x: any) => `{${x.join(",")}}`).join(",")}}`).join(",")}};int[][][] e={${selected.map((c: any) => `{${c[1].map((x: any) => `{${x.join(",")}}`).join(",")}}`).join(",")}};for(int i=0;i<in.length;i++)if(!eq(Solution.merge(in[i]),e[i]))throw new RuntimeException("Wrong Answer");System.out.println("__AW_RESULT__ ${selected.length}/${selected.length}");}}`;
  }
  if (language === "Go") {
    if (problemId === "two-sum")
      return `\nfunc main(){tests:=[]struct{n []int;t int;e []int}{${selected.map((c: any) => `{[]int{${c[0].join(",")}},${c[1]},[]int{${c[2].join(",")}}}`).join(",")}};for _,x:=range tests{if fmt.Sprint(twoSum(x.n,x.t))!=fmt.Sprint(x.e){panic("Wrong Answer")}};fmt.Println("__AW_RESULT__ ${selected.length}/${selected.length}")}`;
    if (problemId === "valid-parentheses")
      return `\nfunc main(){tests:=[]struct{s string;e bool}{${selected.map((c: any) => `{"${c[0]}",${c[1]}}`).join(",")}};for _,x:=range tests{if isValid(x.s)!=x.e{panic("Wrong Answer")}};fmt.Println("__AW_RESULT__ ${selected.length}/${selected.length}")}`;
    return `\nfunc main(){tests:=[]struct{i,e [][]int}{${selected.map((c: any) => `{[][]int{${c[0].map((x: any) => `[]int{${x.join(",")}}`).join(",")}},[][]int{${c[1].map((x: any) => `[]int{${x.join(",")}}`).join(",")}}}`).join(",")}};for _,x:=range tests{if fmt.Sprint(merge(x.i))!=fmt.Sprint(x.e){panic("Wrong Answer")}};fmt.Println("__AW_RESULT__ ${selected.length}/${selected.length}")}`;
  }
  if (language === "Ruby") {
    const json = JSON.stringify(selected);
    if (problemId === "two-sum")
      return `\ntests=${json};tests.each{|n,t,e|raise "Wrong Answer" unless two_sum(n,t)==e};puts "__AW_RESULT__ ${selected.length}/${selected.length}"`;
    if (problemId === "valid-parentheses")
      return `\ntests=${json};tests.each{|s,e|raise "Wrong Answer" unless valid_parentheses(s)==e};puts "__AW_RESULT__ ${selected.length}/${selected.length}"`;
    return `\ntests=${json};tests.each{|i,e|raise "Wrong Answer" unless merge_intervals(i)==e};puts "__AW_RESULT__ ${selected.length}/${selected.length}"`;
  }
  throw new Error(`Unsupported language: ${language}`);
}

export function starterCode(problemId: string, language: CodingLanguage) {
  const templates: Record<string, Partial<Record<CodingLanguage, string>>> = {
    "two-sum": {
      JavaScript: `function twoSum(nums, target) {\n  // Write your solution here\n}\n\nmodule.exports = twoSum;`,
      TypeScript: `function twoSum(nums: number[], target: number): number[] {\n  // Write your solution here\n  return [];\n}\n\nexport default twoSum;`,
      Python: `def twoSum(nums, target):\n    # Write your solution here\n    return []`,
      "C++": `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> twoSum(vector<int> nums, int target) {\n    // Write your solution here\n    return {};\n}`,
      Java: `class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
      Go: `package main\n\nimport "fmt"\n\nfunc twoSum(nums []int, target int) []int {\n    // Write your solution here\n    return []int{}\n}\n`,
      Ruby: `def two_sum(nums, target)\n  # Write your solution here\n  []\nend\n`,
    },
    "valid-parentheses": {
      JavaScript: `function isValid(s) {\n  // Write your solution here\n  return false;\n}\n\nmodule.exports = isValid;`,
      TypeScript: `function isValid(s: string): boolean {\n  // Write your solution here\n  return false;\n}\n\nexport default isValid;`,
      Python: `def isValid(s):\n    # Write your solution here\n    return False`,
      "C++": `#include <bits/stdc++.h>\nusing namespace std;\n\nbool isValid(string s) {\n    // Write your solution here\n    return false;\n}`,
      Java: `class Solution {\n    public static boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}`,
      Go: `package main\n\nimport "fmt"\n\nfunc isValid(s string) bool {\n    // Write your solution here\n    return false\n}\n`,
      Ruby: `def valid_parentheses(s)\n  # Write your solution here\n  false\nend\n`,
    },
    "merge-intervals": {
      JavaScript: `function merge(intervals) {\n  // Write your solution here\n  return [];\n}\n\nmodule.exports = merge;`,
      TypeScript: `function merge(intervals: number[][]): number[][] {\n  // Write your solution here\n  return [];\n}\n\nexport default merge;`,
      Python: `def merge(intervals):\n    # Write your solution here\n    return []`,
      "C++": `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<vector<int>> merge(vector<vector<int>> intervals) {\n    // Write your solution here\n    return {};\n}`,
      Java: `class Solution {\n    public static int[][] merge(int[][] intervals) {\n        // Write your solution here\n        return new int[][]{};\n    }\n}`,
      Go: `package main\n\nimport "fmt"\n\nfunc merge(intervals [][]int) [][]int {\n    // Write your solution here\n    return [][]int{}\n}\n`,
      Ruby: `def merge_intervals(intervals)\n  # Write your solution here\n  []\nend\n`,
    },
  };

const template = templates[problemId]?.[language];

if (!template) {
  return `// Starter code for ${language} is being prepared for the isolated judge.`;
}
return template;
}

async function execute(command: string, args: string[], cwd: string) {
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      timeout: TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 256 * 1024,
      env: {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? process.env.USERPROFILE ?? "",
        LANG: "C.UTF-8",
      },
    });
    return { stdout: result.stdout, stderr: result.stderr };
  } catch (error: any) {
    return {
      stdout: error.stdout ?? "",
      stderr: error.stderr || error.message || "Execution failed",
    };
  }
}

export async function runCoding(
  problemId: string,
  language: CodingLanguage,
  code: string,
  publicOnly = false
) {
  if (!code.trim()) throw new Error("Code cannot be empty");
  if (code.length > MAX_CODE) throw new Error("Code is too large");
  const dir = await mkdtemp(
    join(
      process.env.ASSESSMENT_RUNTIME_DIR ?? process.cwd(),
      ".assessment-workbench-"
    )
  );
  try {
    const harness = dsaHarness(problemId, language, publicOnly);
    let command: string;
    let args: string[];
    let file: string;
    if (language === "JavaScript") {
      file = "Main.js";
      await writeFile(join(dir, file), `${code}\n${harness}`);
      command = process.platform === "win32" ? "node.exe" : "node";
      args = [file];
    } else if (language === "TypeScript") {
      file = "Main.ts";
      await writeFile(join(dir, file), `${code}\n${harness}`);
      command = process.platform === "win32" ? "node.exe" : "node";
      args = ["--experimental-strip-types", file];
    } else if (language === "Python") {
      file = "main.py";
      await writeFile(join(dir, file), `${code}\n${harness}`);
      command = process.platform === "win32" ? "python.exe" : "python3";
      args = [file];
    } else if (language === "C++") {
      file = "main.cpp";
      await writeFile(join(dir, file), `${code}\n${harness}`);
      const compiled = await execute(
        "g++",
        [file, "-std=c++17", "-O2", "-o", join(dir, "main")],
        dir
      );
      if (
        compiled.stderr &&
        !compiled.stdout &&
        !compiled.stderr.includes("warning:")
      )
        return {
          passed: 0,
          total: 1,
          output: compiled.stderr,
          errorType: "Compilation / type error",
        };
      try {
        await access(join(dir, "main"));
      } catch {
        return {
          passed: 0,
          total: 1,
          output:
            compiled.stderr ||
            compiled.stdout ||
            "C++ compilation did not produce an executable",
          errorType: "Compilation / type error",
        };
      }
      command = join(dir, process.platform === "win32" ? "main.exe" : "main");
      args = [];
    } else if (language === "Java") {
      file = "Solution.java";
      await writeFile(join(dir, file), `${code}\n${harness}`);
      const compiled = await execute("javac", [file], dir);
      if (compiled.stderr && !compiled.stdout)
        return {
          passed: 0,
          total: 1,
          output: compiled.stderr,
          errorType: "Compilation / type error",
        };
      command = "java";
      args = ["Main"];
    } else if (language === "Go") {
      file = "main.go";
      await writeFile(
        join(dir, file),
        `${code}\n${harness}`.replace('import "fmt"', 'import "fmt"')
      );
      command = "go";
      args = ["run", file];
    } else {
      file = "main.rb";
      await writeFile(join(dir, file), `${code}\n${harness}`);
      command = "ruby";
      args = [file];
    }
    const result = await execute(command, args, dir);
    const output =
      `${result.stdout}${result.stderr ? `\n${result.stderr}` : ""}`.trim();
    const match = output.match(/__AW_RESULT__\s+(\d+)\/(\d+)/);
    if (match)
      return {
        passed: Number(match[1]),
        total: Number(match[2]),
        output,
        errorType: "",
      };
    const lower = output.toLowerCase();
    const errorType =
      lower.includes("syntax") || lower.includes("parse")
        ? "Syntax error"
        : lower.includes("time") || lower.includes("timeout")
          ? "Time limit exceeded"
          : lower.includes("compile") ||
              lower.includes("javac") ||
              lower.includes("g++")
            ? "Compilation / type error"
            : lower.includes("wrong answer")
              ? "Wrong answer"
              : lower.includes("typeerror") || lower.includes("runtime")
                ? "Runtime error"
                : "Execution error";
    return {
      passed: 0,
      total: 1,
      output: output || "Execution failed",
      errorType,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function runBugHunt(
  stackId: string,
  files: Record<string, string>
) {
  if (stackId !== "react-node-postgres") {
    return {
      passed: 0,
      total: 0,
      details: [
        {
          name: "Docker Bug Hunt runtime",
          passed: false,
          message: `Bug Hunt stack "${stackId}" is not implemented yet.`,
        },
      ],
    };
  }

  const tempDir = await mkdtemp(
    join(
      process.env.ASSESSMENT_RUNTIME_DIR ?? process.cwd(),
      ".assessment-bug-hunt-"
    )
  );

  const dbContainer = `assessment-bug-db-${randomUUID()}`;
  const backendContainer = `assessment-bug-backend-${randomUUID()}`;
  const network = `assessment-bug-network-${randomUUID()}`;

  const cleanup = async () => {
    await runProcess("docker", [
      "rm",
      "-f",
      backendContainer,
    ]).catch(() => {});

    await runProcess("docker", [
      "rm",
      "-f",
      dbContainer,
    ]).catch(() => {});

    await runProcess("docker", [
      "network",
      "rm",
      network,
    ]).catch(() => {});

    await rm(tempDir, {
      recursive: true,
      force: true,
    });
  };

  try {
    /*
     * ------------------------------------------------------------
     * 1. Write candidate files
     * ------------------------------------------------------------
     */

    for (const [fileName, content] of Object.entries(files)) {
      const target = join(tempDir, fileName);

      await mkdir(dirname(target), {
        recursive: true,
      });

      await writeFile(target, content, "utf8");
    }

    /*
     * ------------------------------------------------------------
     * 2. Create isolated Docker network
     * ------------------------------------------------------------
     */

    await runProcess("docker", [
      "network",
      "create",
      network,
    ]);

    /*
     * ------------------------------------------------------------
     * 3. Start PostgreSQL
     * ------------------------------------------------------------
     */

    await runProcess("docker", [
      "run",
      "-d",
      "--name",
      dbContainer,
      "--network",
      network,

      "-e",
      "POSTGRES_DB=assessment",

      "-e",
      "POSTGRES_USER=assessment",

      "-e",
      "POSTGRES_PASSWORD=assessment",

      "postgres:16-alpine",
    ]);

    /*
     * ------------------------------------------------------------
     * 4. Wait for PostgreSQL
     * ------------------------------------------------------------
     */

    let databaseReady = false;

    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        await runProcess("docker", [
          "exec",
          dbContainer,
          "pg_isready",
          "-U",
          "assessment",
          "-d",
          "assessment",
        ]);

        databaseReady = true;
        break;
      } catch {
        await new Promise(resolve =>
          setTimeout(resolve, 1000)
        );
      }
    }

    if (!databaseReady) {
      throw new Error(
        "PostgreSQL container did not become ready."
      );
    }

    /*
     * ------------------------------------------------------------
     * 5. Load schema
     * ------------------------------------------------------------
     */

    const schemaPath = join(
      tempDir,
      "database",
      "schema.sql"
    );

    await runProcess("docker", [
      "cp",
      schemaPath,
      `${dbContainer}:/schema.sql`,
    ]);

    await runProcess("docker", [
      "exec",
      dbContainer,
      "psql",
      "-U",
      "assessment",
      "-d",
      "assessment",
      "-f",
      "/schema.sql",
    ]);

    /*
     * ------------------------------------------------------------
     * 6. Load seed data
     * ------------------------------------------------------------
     */

    const seedPath = join(
      tempDir,
      "database",
      "seed.sql"
    );

    await runProcess("docker", [
      "cp",
      seedPath,
      `${dbContainer}:/seed.sql`,
    ]);

    await runProcess("docker", [
      "exec",
      dbContainer,
      "psql",
      "-U",
      "assessment",
      "-d",
      "assessment",
      "-f",
      "/seed.sql",
    ]);

    /*
     * ------------------------------------------------------------
     * 7. Install backend dependencies inside Node container
     * ------------------------------------------------------------
     */

    await runProcess("docker", [
      "run",
      "-d",
      "--name",
      backendContainer,
      "--network",
      network,

      "-e",
      `DATABASE_URL=postgresql://assessment:assessment@${dbContainer}:5432/assessment`,

      "-e",
      "PORT=3000",

      "-v",
      `${tempDir}:/workspace`,

      "node:22-alpine",

      "sh",
      "-c",
      "cd /workspace && npm install --ignore-scripts && node backend/server.js",
    ]);

    /*
     * ------------------------------------------------------------
     * 8. Wait for backend
     * ------------------------------------------------------------
     */

    let backendReady = false;

    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const result = await runProcess(
          "docker",
          [
            "exec",
            backendContainer,
            "node",
            "-e",
            `
              fetch("http://localhost:3000/api/products")
                .then(response => {
                  if (!response.ok) process.exit(1);
                  process.exit(0);
                })
                .catch(() => process.exit(1));
            `,
          ],
          5000
        );
  
        backendReady = true;
        break;
        
      } catch {
        await new Promise(resolve =>
          setTimeout(resolve, 1000)
        );
      }
    }

    if (!backendReady) {
      const logs = await runProcess(
        "docker",
        [
          "logs",
          backendContainer,
        ],
        10000
      ).catch((error: unknown) => String(error));

      throw new Error(
        `Backend did not become ready.\n${logs}`
      );
    }

    /*
     * ------------------------------------------------------------
     * 9. Run HTTP/API tests
     * ------------------------------------------------------------
     */

    const testScript = `
const assert = require("node:assert");

async function request(url, options = {}) {
  const response = await fetch(url, options);

  const text = await response.text();

  let body;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return {
    status: response.status,
    body,
  };
}

async function main() {
  const base = "http://localhost:3000";

  /*
   * GET
   */

  const initial = await request(
    base + "/api/products"
  );

  assert.strictEqual(
    initial.status,
    200,
    "GET /api/products must return 200"
  );

  assert.ok(
    initial.body &&
      Array.isArray(initial.body.products),
    "GET response must contain products"
  );

  assert.ok(
    initial.body.products.length >= 2,
    "Seed data must be available"
  );

  const firstProduct = initial.body.products[0];

  assert.ok(
    Number.isInteger(firstProduct.id),
    "Product id must be numeric"
  );

  assert.ok(
    typeof firstProduct.name === "string",
    "Product name must be preserved"
  );

  assert.ok(
    firstProduct.price !== undefined,
    "Product price must be preserved"
  );

  /*
   * POST
   */

  const created = await request(
    base + "/api/products",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Judge Product",
        price: 123,
      }),
    }
  );

  assert.strictEqual(
    created.status,
    201,
    "POST /api/products must return 201"
  );

  assert.ok(
    created.body &&
      created.body.product,
    "POST response must contain product"
  );

  assert.ok(
    Number.isInteger(created.body.product.id),
    "Created product must have numeric id"
  );

  assert.strictEqual(
    created.body.product.name,
    "Judge Product",
    "Created product name must be preserved"
  );

  /*
   * Persistence
   */

  const afterCreate = await request(
    base + "/api/products"
  );

  const createdProduct =
    afterCreate.body.products.find(
      product =>
        product.id === created.body.product.id
    );

  assert.ok(
    createdProduct,
    "POST must persist the product"
  );

  /*
   * DELETE
   */

  const deleted = await request(
    base +
      "/api/products/" +
      created.body.product.id,
    {
      method: "DELETE",
    }
  );

  assert.strictEqual(
    deleted.status,
    200,
    "DELETE must return 200"
  );

  assert.deepStrictEqual(
    deleted.body,
    { success: true },
    "DELETE response contract must be preserved"
  );

  /*
   * Verify deletion
   */

  const afterDelete = await request(
    base + "/api/products"
  );

  const deletedProduct =
    afterDelete.body.products.find(
      product =>
        product.id === created.body.product.id
    );

  assert.strictEqual(
    deletedProduct,
    undefined,
    "DELETE must remove the requested product"
  );

  console.log("BUG_HUNT_TESTS_PASSED");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
`;

    const testPath = join(
      tempDir,
      "bug-hunt-test.js"
    );

    await writeFile(
      testPath,
      testScript,
      "utf8"
    );

    await runProcess("docker", [
      "cp",
      testPath,
      `${backendContainer}:/bug-hunt-test.js`,
    ]);

    await runProcess("docker", [
      "exec",
      backendContainer,
      "node",
      "/bug-hunt-test.js",
    ]);

    /*
     * ------------------------------------------------------------
     * 10. Return result
     * ------------------------------------------------------------
     */

    return {
      passed: 15,
      total: 15,
      details: [
        {
          name: "Node.js + PostgreSQL Bug Hunt",
          passed: true,
          message:
            "All backend, API, persistence and deletion tests passed.",
        },
      ],
    };
  } catch (error) {
    return {
      passed: 0,
      total: 15,
      details: [
        {
          name: "Node.js + PostgreSQL Bug Hunt",
          passed: false,
          message:
            error instanceof Error
              ? error.message
              : String(error),
        },
      ],
    };
  } finally {
    await cleanup();
  }
}
