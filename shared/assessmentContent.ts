import {
  FULL_STACKS,
  type FullStackId,
} from "./languages";


export type AptitudeQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type CodingProblem = {
  id: string;
  number: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  publicTests: Array<{ input: string; expected: string }>;
};

const aptitudeQuestionData: Array<[string, string[]]> = [
  [
    "A train travels 240 km in 3 hours. What is its average speed?",
    ["60 km/h", "80 km/h", "90 km/h", "120 km/h"],
  ],
  ["If 5x + 7 = 32, what is x?", ["3", "5", "7", "9"]],
  [
    "Which number completes the sequence: 2, 6, 12, 20, __?",
    ["24", "28", "30", "32"],
  ],
  [
    "A shop gives a 20% discount on an item marked at ₹1,500. What is the selling price?",
    ["₹1,100", "₹1,200", "₹1,250", "₹1,300"],
  ],
  [
    "The ratio of boys to girls in a class is 3:2. If there are 30 students, how many are girls?",
    ["10", "12", "15", "18"],
  ],
  ["What is 15% of 240?", ["24", "30", "36", "42"]],
  [
    "A can complete a job in 12 days and B in 18 days. How long will they take together?",
    ["6 days", "7.2 days", "8 days", "9 days"],
  ],
  [
    "If the average of 8, 12, 15 and x is 14, what is x?",
    ["18", "20", "21", "22"],
  ],
  [
    "A number increased by 25% becomes 500. What was the original number?",
    ["375", "400", "425", "450"],
  ],
  [
    "What is the simple interest on ₹8,000 at 5% per annum for 2 years?",
    ["₹400", "₹600", "₹800", "₹1,000"],
  ],
  [
    "If 3 pens cost ₹45, how much do 8 pens cost at the same rate?",
    ["₹100", "₹110", "₹120", "₹135"],
  ],
  [
    "A car covers 150 km in 2.5 hours. What is its speed?",
    ["50 km/h", "60 km/h", "65 km/h", "75 km/h"],
  ],
  ["What is the next number: 81, 27, 9, 3, __?", ["0", "1", "2", "6"]],
  [
    "A sum of ₹2,000 is divided in the ratio 3:5. What is the smaller share?",
    ["₹600", "₹750", "₹800", "₹1,200"],
  ],
  ["If x/4 = 7, what is x?", ["11", "21", "28", "35"]],
  [
    "A product costs ₹800 and is sold for ₹920. What is the profit percentage?",
    ["10%", "12%", "15%", "20%"],
  ],
  [
    "A pipe fills a tank in 10 hours. What fraction of the tank does it fill in 2 hours?",
    ["1/10", "1/5", "1/4", "1/2"],
  ],
  ["What is the HCF of 36 and 48?", ["6", "8", "12", "16"]],
  [
    "A 25 m rope is cut into pieces of 5 m each. How many pieces are made?",
    ["4", "5", "6", "7"],
  ],
  ["If 2x - 9 = 17, what is x?", ["9", "11", "13", "15"]],
  [
    "A salary of ₹40,000 is increased by 10%. What is the new salary?",
    ["₹42,000", "₹43,000", "₹44,000", "₹45,000"],
  ],
  ["What is the median of 3, 7, 9, 12 and 15?", ["7", "9", "10", "12"]],
  ["If a:b = 4:7 and b = 35, what is a?", ["15", "20", "25", "28"]],
  [
    "A clock gains 5 minutes every hour. How many minutes does it gain in 6 hours?",
    ["20", "25", "30", "35"],
  ],
  ["What is 3/5 expressed as a percentage?", ["40%", "50%", "60%", "75%"]],
  [
    "A 10% tax is added to a ₹2,500 bill. What is the total bill?",
    ["₹2,550", "₹2,650", "₹2,750", "₹2,800"],
  ],
  [
    "A cyclist travels 18 km in 45 minutes. What is the speed in km/h?",
    ["18", "20", "24", "27"],
  ],
  [
    "What is the least positive number divisible by both 6 and 8?",
    ["12", "18", "24", "48"],
  ],
  [
    "If 40% of a number is 72, what is the number?",
    ["160", "180", "200", "220"],
  ],
  [
    "A box contains 5 red, 3 blue and 2 green balls. What is the probability of drawing a blue ball?",
    ["1/5", "3/10", "1/3", "2/5"],
  ],
];

export const aptitudeQuestions: AptitudeQuestion[] = aptitudeQuestionData.map(
  ([question, options], index) => ({
    id: `apt-${index + 1}`,
    question,
    options,
  })
);

export const codingProblems: CodingProblem[] = [
  {
    id: "two-sum",
    number: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description:
      "Given an integer array nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume exactly one solution exists.",
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "-10⁹ ≤ target ≤ 10⁹",
      "Exactly one valid answer exists.",
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation:
          "Store each value as you scan the array. For 7, the complement 2 is already present, so indices 0 and 1 form the unique answer.",
      },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
      { input: "nums = [3,3], target = 6", output: "[0,1]" },
    ],
    publicTests: [
      { input: "[2,7,11,15], 9", expected: "[0,1]" },
      { input: "[3,2,4], 6", expected: "[1,2]" },
      { input: "[3,3], 6", expected: "[0,1]" },
    ],
  },
  {
    id: "valid-parentheses",
    number: 2,
    title: "Valid Parentheses",
    difficulty: "Easy",
    description:
      "Given a string containing only '(', ')', '{', '}', '[' and ']', determine whether the input string is valid. An input string is valid when every opening bracket is closed by the same type and brackets close in the correct order.",
    constraints: [
      "1 ≤ s.length ≤ 10⁴",
      "s consists only of parentheses, brackets and braces.",
    ],
    examples: [
      {
        input: 's = "()"',
        output: "true",
        explanation:
          "Push the opening bracket and remove it when the matching closing bracket appears. The stack is empty at the end, so the string is valid.",
      },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    publicTests: [
      { input: '"()"', expected: "true" },
      { input: '"()[]{}"', expected: "true" },
      { input: '"(]"', expected: "false" },
      { input: '"([{}])"', expected: "true" },
    ],
  },
  {
    id: "merge-intervals",
    number: 3,
    title: "Merge Intervals",
    difficulty: "Medium",
    description:
      "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    constraints: [
      "1 ≤ intervals.length ≤ 10⁴",
      "intervals[i].length = 2",
      "0 ≤ starti ≤ endi ≤ 10⁴",
    ],
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation:
          "Sort intervals by start time. [1,3] overlaps [2,6], so they merge into [1,6]; the remaining intervals do not overlap.",
      },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
    ],
    publicTests: [
      {
        input: "[[1,3],[2,6],[8,10],[15,18]]",
        expected: "[[1,6],[8,10],[15,18]]",
      },
      { input: "[[1,4],[4,5]]", expected: "[[1,5]]" },
      { input: "[[1,10],[2,3],[4,8]]", expected: "[[1,10]]" },
    ],
  },
];

export type BugHuntPack = {
  stackId: FullStackId;
  name: string;
  description: string;

  frontend: string[];
  backend: string[];
  database: string[];

  files: Record<string, string>;

  tests: string[];
};

export const bugHuntPacks: Record<FullStackId, BugHuntPack> = {
  "react-node-postgres": {
    stackId: "react-node-postgres",
    name: "React + Node.js + PostgreSQL",

    description:
      "Debug a small e-commerce application spanning React, Node.js/Express and PostgreSQL.",

    frontend: [
      "React",
      "TypeScript",
      "Vite",
    ],

    backend: [
      "Node.js",
      "Express",
    ],

    database: [
      "PostgreSQL",
    ],

    files: {
      "README.md": `# Full-stack Bug Hunt

## Frontend

- React
- TypeScript
- Vite

## Backend

- Node.js
- Express

## Database

- PostgreSQL

## Objective

Find and fix the seeded bugs in the existing product application.

The application contains:

1. React frontend
2. Node.js + Express backend
3. PostgreSQL database

## API

### GET /api/products

Returns:

{
  "products": [...]
}

### POST /api/products

Returns:

{
  "product": {...}
}

### DELETE /api/products/:id

Returns:

{
  "success": true
}

## Database

Table:

products(
  id,
  name,
  price
)

## Rules

- Fix the existing implementation.
- Do not replace the application.
- Do not remove the database.
- Do not bypass the API.
- Preserve the documented API routes.
- Preserve the documented response contracts.

## Testing

The judge checks:

- frontend behavior
- backend behavior
- API contracts
- database schema
- database persistence
- frontend/backend integration
`,

      "frontend/src/Products.jsx": `import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(response => response.json())
      .then(payload => setProducts(payload.products));
  }, []);

  async function createProduct(product) {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(product),
    });

    const payload = await response.json();

    setProducts(current => [
      ...current,
      payload.product,
    ]);
  }

  return (
    <section>
      <button
        onClick={() =>
          createProduct({
            name: "Keyboard",
            price: 99,
          })
        }
      >
        Create
      </button>

      {products.map(product => (
        <div key={product.id}>
          {product.name} · \${product.price}
        </div>
      ))}
    </section>
  );
}
`,

      "backend/db.js": `const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
`,

      "backend/routes/products.js": `const db = require("../db");

async function listProducts() {
  const result = await db.query(
    "SELECT id, name, price FROM products ORDER BY id"
  );

  return {
    products: result.rows,
  };
}

async function createProduct(input) {
  const result = await db.query(
    "INSERT INTO products(name, price) VALUES($1, $2) RETURNING id, name, price",
    [input.name, input.price]
  );

  return {
    product: result.rows[0],
  };
}

async function deleteProduct(id) {
  await db.query(
    "DELETE FROM products WHERE id = $1",
    [Number(id)]
  );

  return {
    success: true,
  };
}

module.exports = {
  listProducts,
  createProduct,
  deleteProduct,
};
`,

      "backend/server.js": `
const express = require("express");
const productRoutes = require("./routes/products");

const app = express();

app.use(express.json());

app.get("/api/products", async (req, res) => {
  try {
    const result = await productRoutes.listProducts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const result = await productRoutes.createProduct(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const result = await productRoutes.deleteProduct(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(\`Bug Hunt backend listening on port \${port}\`);
});
`,

      "database/schema.sql": `CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);
`,

      "database/seed.sql": `INSERT INTO products(name, price)
VALUES
  ('Mouse', 25),
  ('Keyboard', 80);
`,

      "package.json": `{
  "name": "bug-hunt-node-postgres",
  "private": true,
  "type": "commonjs",
  "dependencies": {
    "express": "^5.1.0",
    "pg": "^8.16.3"
  }
}`,

    },

    tests: [
      "GET returns products from PostgreSQL",
      "GET response contains products",
      "Product id is preserved",
      "Product name is preserved",
      "Product price is preserved",
      "POST creates a database row",
      "POST returns the created product",
      "Created product has a numeric id",
      "Created product preserves name",
      "Created product preserves price",
      "DELETE removes the requested product",
      "DELETE accepts numeric route ids",
      "DELETE does not remove unrelated products",
      "products table exists",
      "seed data is available",
    ],
  },

"react-node-mongo": {
  stackId: "react-node-mongo",
  name: "React + Node.js + MongoDB",
  description:
    "Debug a small e-commerce application spanning React, Node.js/Express and MongoDB.",

  frontend: [
    "React",
    "TypeScript",
    "Vite",
  ],

  backend: [
    "Node.js",
    "Express",
  ],

  database: [
    "MongoDB",
  ],

  files: {
    "README.md": `# Full-stack Bug Hunt

## Stack

- React
- TypeScript
- Vite
- Node.js
- Express
- MongoDB

## Objective

Find and fix the seeded bugs in the existing product application.

The application contains:

1. React frontend
2. Node.js + Express backend
3. MongoDB database

## Rules

- Fix the existing implementation.
- Do not replace the application.
- Do not remove the database.
- Do not bypass the API.
- Preserve the documented API routes.
- Preserve the documented response contracts.
`,

    "frontend/src/Products.jsx": `import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(response => response.json())
      .then(payload => setProducts(payload.products));
  }, []);

  async function createProduct(product) {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(product),
    });

    const payload = await response.json();

    setProducts(current => [
      ...current,
      payload.product,
    ]);
  }

  return (
    <section>
      <button
        onClick={() =>
          createProduct({
            name: "Keyboard",
            price: 99,
          })
        }
      >
        Create
      </button>

      {products.map(product => (
        <div key={product.id}>
          {product.name} · \${product.price}
        </div>
      ))}
    </section>
  );
}
`,

    "backend/db.js": `const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

async function getDb() {
  await client.connect();
  return client.db(process.env.MONGODB_DATABASE);
}

module.exports = {
  getDb,
};
`,

    "backend/routes/products.js": `const { getDb } = require("../db");

async function listProducts() {
  const db = await getDb();

  const products = await db
    .collection("products")
    .find({})
    .sort({ _id: 1 })
    .toArray();

  return {
    products,
  };
}

async function createProduct(input) {
  const db = await getDb();

  const product = {
    name: input.name,
    price: input.price,
  };

  const result = await db
    .collection("products")
    .insertOne(product);

  return {
    product: {
      ...product,
      id: result.insertedId.toString(),
    },
  };
}

async function deleteProduct(id) {
  const db = await getDb();

  await db.collection("products").deleteOne({
    _id: id,
  });

  return {
    success: true,
  };
}

module.exports = {
  listProducts,
  createProduct,
  deleteProduct,
};
`,

    "database/schema.md": `# MongoDB Collection

Collection: products

Documents contain:

- _id
- name
- price
`,

    "database/seed.json": `[
  {
    "name": "Mouse",
    "price": 25
  },
  {
    "name": "Keyboard",
    "price": 80
  }
]
`,
  },

  tests: [
    "GET returns products from MongoDB",
    "GET response contains products",
    "Product name is preserved",
    "Product price is preserved",
    "POST creates a database document",
    "POST returns the created product",
    "Created product preserves name",
    "Created product preserves price",
    "DELETE removes the requested product",
    "DELETE does not remove unrelated products",
    "products collection exists",
    "seed data is available",
  ],
},
  
  "react-python-postgres": {
    stackId: "react-python-postgres",
    name: "React + Python + PostgreSQL",
    description:
      "Debug a small e-commerce application spanning React, Python/FastAPI and PostgreSQL.",

    frontend: [
      "React",
      "TypeScript",
      "Vite",
    ],

    backend: [
      "Python",
      "FastAPI",
    ],

    database: [
      "PostgreSQL",
    ],

    files: {
      "README.md": `# Full-stack Bug Hunt

## Stack

- React
- TypeScript
- Vite
- Python
- FastAPI
- PostgreSQL

## Objective

Find and fix the seeded bugs in the existing product application.

## Rules

- Fix the existing implementation.
- Do not replace the application.
- Do not remove the database.
- Do not bypass the API.
- Preserve the documented API routes.
- Preserve the documented response contracts.
`,

      "frontend/src/Products.jsx": `import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(response => response.json())
      .then(payload => setProducts(payload.products));
  }, []);

  return (
    <section>
      {products.map(product => (
        <div key={product.id}>
          {product.name} · \${product.price}
        </div>
      ))}
    </section>
  );
}
`,

      "backend/main.py": `from fastapi import FastAPI

app = FastAPI()

@app.get("/api/products")
def list_products():
    return {
        "products": []
    }

@app.post("/api/products")
def create_product(product: dict):
    return {
        "product": product
    }

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int):
    return {
        "success": True
    }
`,
    },

    tests: [
      "GET returns products from PostgreSQL",
      "GET response contains products",
      "Product id is preserved",
      "Product name is preserved",
      "Product price is preserved",
      "POST creates a database row",
      "POST returns the created product",
      "DELETE removes the requested product",
      "products table exists",
      "seed data is available",
    ],
  },

  "react-java-postgres": {
    stackId: "react-java-postgres",
    name: "React + Java + PostgreSQL",
    description:
      "Debug a small e-commerce application spanning React, Java/Spring Boot and PostgreSQL.",

    frontend: [
      "React",
      "TypeScript",
      "Vite",
    ],

    backend: [
      "Java",
      "Spring Boot",
    ],

    database: [
      "PostgreSQL",
    ],

    files: {
      "README.md": `# Full-stack Bug Hunt

## Stack

- React
- TypeScript
- Vite
- Java
- Spring Boot
- PostgreSQL

## Objective

Find and fix the seeded bugs in the existing product application.

## Rules

- Fix the existing implementation.
- Do not replace the application.
- Do not remove the database.
- Do not bypass the API.
- Preserve the documented API routes.
- Preserve the documented response contracts.
`,

      "frontend/src/Products.jsx": `import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(response => response.json())
      .then(payload => setProducts(payload.products));
  }, []);

  return (
    <section>
      {products.map(product => (
        <div key={product.id}>
          {product.name} · \${product.price}
        </div>
      ))}
    </section>
  );
}
`,

      "backend/ProductController.java": `@RestController
@RequestMapping("/api/products")
public class ProductController {

    @GetMapping
    public Map<String, Object> listProducts() {
        return Map.of("products", List.of());
    }

    @PostMapping
    public Map<String, Object> createProduct(
        @RequestBody Map<String, Object> product
    ) {
        return Map.of("product", product);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> deleteProduct(@PathVariable Long id) {
        return Map.of("success", true);
    }
}
`,
    },

    tests: [
      "GET returns products from PostgreSQL",
      "GET response contains products",
      "Product id is preserved",
      "Product name is preserved",
      "Product price is preserved",
      "POST creates a database row",
      "POST returns the created product",
      "DELETE removes the requested product",
      "products table exists",
      "seed data is available",
    ],
  },

  "react-csharp-sqlserver": {
    stackId: "react-csharp-sqlserver",
    name: "React + C# + SQL Server",
    description:
      "Debug a small e-commerce application spanning React, ASP.NET Core and SQL Server.",

    frontend: [
      "React",
      "TypeScript",
      "Vite",
    ],

    backend: [
      "C#",
      "ASP.NET Core",
    ],

    database: [
      "SQL Server",
    ],

    files: {
      "README.md": `# Full-stack Bug Hunt

## Stack

- React
- TypeScript
- Vite
- C#
- ASP.NET Core
- SQL Server

## Objective

Find and fix the seeded bugs in the existing product application.

## Rules

- Fix the existing implementation.
- Do not replace the application.
- Do not remove the database.
- Do not bypass the API.
- Preserve the documented API routes.
- Preserve the documented response contracts.
`,

      "frontend/src/Products.jsx": `import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(response => response.json())
      .then(payload => setProducts(payload.products));
  }, []);

  return (
    <section>
      {products.map(product => (
        <div key={product.id}>
          {product.name} · \${product.price}
        </div>
      ))}
    </section>
  );
}
`,

      "backend/ProductsController.cs": `using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetProducts()
    {
        return Ok(new {
            products = Array.Empty<object>()
        });
    }

    [HttpPost]
    public IActionResult CreateProduct(
        [FromBody] object product
    )
    {
        return Ok(new {
            product
        });
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteProduct(int id)
    {
        return Ok(new {
            success = true
        });
    }
}
`,
    },

    tests: [
      "GET returns products from SQL Server",
      "GET response contains products",
      "Product id is preserved",
      "Product name is preserved",
      "Product price is preserved",
      "POST creates a database row",
      "POST returns the created product",
      "DELETE removes the requested product",
      "products table exists",
      "seed data is available",
    ],
  },

  "react-go-postgres": {
    stackId: "react-go-postgres",
    name: "React + Go + PostgreSQL",
    description:
      "Debug a small e-commerce application spanning React, Go and PostgreSQL.",

    frontend: [
      "React",
      "TypeScript",
      "Vite",
    ],

    backend: [
      "Go",
    ],

    database: [
      "PostgreSQL",
    ],

    files: {
      "README.md": `# Full-stack Bug Hunt

## Stack

- React
- TypeScript
- Vite
- Go
- PostgreSQL

## Objective

Find and fix the seeded bugs in the existing product application.

## Rules

- Fix the existing implementation.
- Do not replace the application.
- Do not remove the database.
- Do not bypass the API.
- Preserve the documented API routes.
- Preserve the documented response contracts.
`,

      "frontend/src/Products.jsx": `import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(response => response.json())
      .then(payload => setProducts(payload.products));
  }, []);

  return (
    <section>
      {products.map(product => (
        <div key={product.id}>
          {product.name} · \${product.price}
        </div>
      ))}
    </section>
  );
}
`,

      "backend/main.go": `package main

import (
    "encoding/json"
    "net/http"
)

func products(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")

    json.NewEncoder(w).Encode(map[string]interface{}{
        "products": []interface{}{},
    })
}

func main() {
    http.HandleFunc("/api/products", products)
    http.ListenAndServe(":8080", nil)
}
`,
    },

    tests: [
      "GET returns products from PostgreSQL",
      "GET response contains products",
      "Product id is preserved",
      "Product name is preserved",
      "Product price is preserved",
      "POST creates a database row",
      "POST returns the created product",
      "DELETE removes the requested product",
      "products table exists",
      "seed data is available",
    ],
  },

  "react-php-mysql": {
    stackId: "react-php-mysql",
    name: "React + PHP + MySQL",
    description:
      "Debug a small e-commerce application spanning React, PHP/Laravel and MySQL.",

    frontend: [
      "React",
      "TypeScript",
      "Vite",
    ],

    backend: [
      "PHP",
      "Laravel",
    ],

    database: [
      "MySQL",
    ],

    files: {
      "README.md": `# Full-stack Bug Hunt

## Stack

- React
- TypeScript
- Vite
- PHP
- Laravel
- MySQL

## Objective

Find and fix the seeded bugs in the existing product application.

## Rules

- Fix the existing implementation.
- Do not replace the application.
- Do not remove the database.
- Do not bypass the API.
- Preserve the documented API routes.
- Preserve the documented response contracts.
`,

      "frontend/src/Products.jsx": `import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(response => response.json())
      .then(payload => setProducts(payload.products));
  }, []);

  return (
    <section>
      {products.map(product => (
        <div key={product.id}>
          {product.name} · \${product.price}
        </div>
      ))}
    </section>
  );
}
`,

      "backend/routes/products.php": `<?php

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;

Route::get('/api/products', function () {
    return response()->json([
        'products' => DB::table('products')->orderBy('id')->get(),
    ]);
});

Route::post('/api/products', function (Request $request) {
    $id = DB::table('products')->insertGetId([
        'name' => $request->input('name'),
        'price' => $request->input('price'),
    ]);

    return response()->json([
        'product' => DB::table('products')->find($id),
    ]);
});

Route::delete('/api/products/{id}', function ($id) {
    DB::table('products')->where('id', $id)->delete();

    return response()->json([
        'success' => true,
    ]);
});
`,
    },

    tests: [
      "GET returns products from MySQL",
      "GET response contains products",
      "Product id is preserved",
      "Product name is preserved",
      "Product price is preserved",
      "POST creates a database row",
      "POST returns the created product",
      "DELETE removes the requested product",
      "products table exists",
      "seed data is available",
    ],
  },

  "react-ruby-postgres": {
    stackId: "react-ruby-postgres",
    name: "React + Ruby + PostgreSQL",
    description:
      "Debug a small e-commerce application spanning React, Ruby/Rails and PostgreSQL.",

    frontend: [
      "React",
      "TypeScript",
      "Vite",
    ],

    backend: [
      "Ruby",
      "Rails",
    ],

    database: [
      "PostgreSQL",
    ],

    files: {
      "README.md": `# Full-stack Bug Hunt

## Stack

- React
- TypeScript
- Vite
- Ruby
- Rails
- PostgreSQL

## Objective

Find and fix the seeded bugs in the existing product application.

## Rules

- Fix the existing implementation.
- Do not replace the application.
- Do not remove the database.
- Do not bypass the API.
- Preserve the documented API routes.
- Preserve the documented response contracts.
`,

      "frontend/src/Products.jsx": `import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(response => response.json())
      .then(payload => setProducts(payload.products));
  }, []);

  return (
    <section>
      {products.map(product => (
        <div key={product.id}>
          {product.name} · \${product.price}
        </div>
      ))}
    </section>
  );
}
`,

      "backend/products_controller.rb": `class ProductsController < ApplicationController
  def index
    render json: {
      products: Product.order(:id)
    }
  end

  def create
    product = Product.create!(
      name: params[:name],
      price: params[:price]
    )

    render json: {
      product: product
    }
  end

  def destroy
    Product.find(params[:id]).destroy!

    render json: {
      success: true
    }
  end
end
`,
    },

    tests: [
      "GET returns products from PostgreSQL",
      "GET response contains products",
      "Product id is preserved",
      "Product name is preserved",
      "Product price is preserved",
      "POST creates a database row",
      "POST returns the created product",
      "DELETE removes the requested product",
      "products table exists",
      "seed data is available",
    ],
  },

};

