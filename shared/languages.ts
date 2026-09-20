export const DSA_LANGUAGES = [
  "C",
  "C++",
  "C#",
  "Java",
  "JavaScript",
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Kotlin",
  "Swift",
  "PHP",
  "Ruby",
  "Dart",
  "Scala",
  "R",
] as const;

export type DsaLanguage = (typeof DSA_LANGUAGES)[number];

export const FULL_STACKS = [
  {
    id: "react-node-postgres",
    name: "React + Node.js + PostgreSQL",
    frontend: ["React", "TypeScript", "Vite"],
    backend: ["Node.js", "Express"],
    database: ["PostgreSQL"],
  },
  {
    id: "react-node-mongo",
    name: "React + Node.js + MongoDB",
    frontend: ["React", "TypeScript", "Vite"],
    backend: ["Node.js", "Express"],
    database: ["MongoDB"],
  },
  {
    id: "react-python-postgres",
    name: "React + Python + PostgreSQL",
    frontend: ["React", "TypeScript", "Vite"],
    backend: ["Python", "FastAPI"],
    database: ["PostgreSQL"],
  },
  {
    id: "react-java-postgres",
    name: "React + Java + PostgreSQL",
    frontend: ["React", "TypeScript", "Vite"],
    backend: ["Java", "Spring Boot"],
    database: ["PostgreSQL"],
  },
  {
    id: "react-csharp-sqlserver",
    name: "React + C# + SQL Server",
    frontend: ["React", "TypeScript", "Vite"],
    backend: ["C#", "ASP.NET Core"],
    database: ["SQL Server"],
  },
  {
    id: "react-go-postgres",
    name: "React + Go + PostgreSQL",
    frontend: ["React", "TypeScript", "Vite"],
    backend: ["Go"],
    database: ["PostgreSQL"],
  },
  {
    id: "react-php-mysql",
    name: "React + PHP + MySQL",
    frontend: ["React", "TypeScript", "Vite"],
    backend: ["PHP", "Laravel"],
    database: ["MySQL"],
  },
  {
    id: "react-ruby-postgres",
    name: "React + Ruby + PostgreSQL",
    frontend: ["React", "TypeScript", "Vite"],
    backend: ["Ruby", "Rails"],
    database: ["PostgreSQL"],
  },
] as const;

export type FullStackId = (typeof FULL_STACKS)[number]["id"];