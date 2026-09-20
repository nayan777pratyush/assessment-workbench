export const JUDGE_LANGUAGES = {
  C: {
    image: "gcc:14",
    source: "Solution.c",
    compile: [
      "gcc",
      "-std=c17",
      "-O2",
      "Solution.c",
      "-o",
      "solution",
    ],
    run: ["./solution"],
  },

  "C++": {
    image: "gcc:14",
    source: "Solution.cpp",
    compile: [
      "g++",
      "-std=c++17",
      "-O2",
      "Solution.cpp",
      "-o",
      "solution",
    ],
    run: ["./solution"],
  },

  "C#": {
    image: "mcr.microsoft.com/dotnet/sdk:8.0",
    source: "Solution.cs",
    compile: [
      "dotnet",
      "build",
      "Solution.csproj",
      "--nologo",
      "-c",
      "Release",
    ],
    run: [
      "dotnet",
      "run",
      "--no-build",
      "--project",
      "Solution.csproj",
      "-c",
      "Release",
    ],
  },

  Java: {
    image: "eclipse-temurin:21",
    source: "Solution.java",
    compile: ["javac", "Solution.java"],
    run: ["java", "Solution"],
  },

  JavaScript: {
    image: "node:22-alpine",
    source: "Solution.js",
    compile: [],
    run: ["node", "Solution.js"],
  },

  TypeScript: {
    image: "node:22-alpine",
    source: "Solution.ts",
    compile: [],
    run: ["node", "--experimental-strip-types", "Solution.ts"],
  },

  Python: {
    image: "python:3.13-slim",
    source: "Solution.py",
    compile: [],
    run: ["python", "Solution.py"],
  },

  Go: {
    image: "golang:1.24",
    source: "Solution.go",
    compile: ["go", "build", "-o", "solution", "Solution.go"],
    run: ["./solution"],
  },

  Rust: {
    image: "rust:1.88",
    source: "Solution.rs",
    compile: ["rustc", "-O", "Solution.rs", "-o", "solution"],
    run: ["./solution"],
  },

  Kotlin: {
    image: "eclipse-temurin:21",
    source: "Solution.kt",
    compile: ["kotlinc", "Solution.kt", "-include-runtime", "-d", "solution.jar"],
    run: ["java", "-jar", "solution.jar"],
  },

  Swift: {
    image: "swift:6.1",
    source: "Solution.swift",
    compile: ["swiftc", "Solution.swift", "-o", "solution"],
    run: ["./solution"],
  },

  PHP: {
    image: "php:8.4-cli",
    source: "Solution.php",
    compile: [],
    run: ["php", "Solution.php"],
  },

  Ruby: {
    image: "ruby:3.4",
    source: "Solution.rb",
    compile: [],
    run: ["ruby", "Solution.rb"],
  },

  Dart: {
    image: "dart:stable",
    source: "Solution.dart",
    compile: [],
    run: ["dart", "Solution.dart"],
  },

  Scala: {
    image: "scala:3.7",
    source: "Solution.scala",
    compile: [],
    run: ["scala", "Solution.scala"],
  },

  R: {
    image: "r-base:4.5",
    source: "Solution.R",
    compile: [],
    run: ["Rscript", "Solution.R"],
  },
} as const;