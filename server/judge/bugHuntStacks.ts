import type { FullStackId } from "../../shared/languages";

export type BugHuntRuntime = {
  stackId: FullStackId;

  frontend: {
    image: string;
    port: number;
  };

  backend: {
    image: string;
    port: number;
  };

  database: {
    image: string;
    port: number;
    environment: Record<string, string>;
  };
};

export const BUG_HUNT_RUNTIMES: Record<
  FullStackId,
  BugHuntRuntime
> = {
  "react-node-postgres": {
    stackId: "react-node-postgres",

    frontend: {
      image: "node:22-alpine",
      port: 5173,
    },

    backend: {
      image: "node:22-alpine",
      port: 3000,
    },

    database: {
      image: "postgres:16-alpine",
      port: 5432,
      environment: {
        POSTGRES_DB: "assessment",
        POSTGRES_USER: "assessment",
        POSTGRES_PASSWORD: "assessment",
      },
    },
  },

  "react-node-mongo": {
    stackId: "react-node-mongo",

    frontend: {
      image: "node:22-alpine",
      port: 5173,
    },

    backend: {
      image: "node:22-alpine",
      port: 3000,
    },

    database: {
      image: "mongo:8",
      port: 27017,
      environment: {
        MONGO_INITDB_DATABASE: "assessment",
      },
    },
  },

  "react-python-postgres": {
    stackId: "react-python-postgres",

    frontend: {
      image: "node:22-alpine",
      port: 5173,
    },

    backend: {
      image: "python:3.13-slim",
      port: 8000,
    },

    database: {
      image: "postgres:16-alpine",
      port: 5432,
      environment: {
        POSTGRES_DB: "assessment",
        POSTGRES_USER: "assessment",
        POSTGRES_PASSWORD: "assessment",
      },
    },
  },

  "react-java-postgres": {
    stackId: "react-java-postgres",

    frontend: {
      image: "node:22-alpine",
      port: 5173,
    },

    backend: {
      image: "eclipse-temurin:21",
      port: 8080,
    },

    database: {
      image: "postgres:16-alpine",
      port: 5432,
      environment: {
        POSTGRES_DB: "assessment",
        POSTGRES_USER: "assessment",
        POSTGRES_PASSWORD: "assessment",
      },
    },
  },

  "react-csharp-sqlserver": {
    stackId: "react-csharp-sqlserver",

    frontend: {
      image: "node:22-alpine",
      port: 5173,
    },

    backend: {
      image: "mcr.microsoft.com/dotnet/sdk:8.0",
      port: 5000,
    },

    database: {
      image: "mcr.microsoft.com/mssql/server:2022-latest",
      port: 1433,
      environment: {
        ACCEPT_EULA: "Y",
        MSSQL_SA_PASSWORD: "Assessment!Pass123",
      },
    },
  },

  "react-go-postgres": {
    stackId: "react-go-postgres",

    frontend: {
      image: "node:22-alpine",
      port: 5173,
    },

    backend: {
      image: "golang:1.24",
      port: 8080,
    },

    database: {
      image: "postgres:16-alpine",
      port: 5432,
      environment: {
        POSTGRES_DB: "assessment",
        POSTGRES_USER: "assessment",
        POSTGRES_PASSWORD: "assessment",
      },
    },
  },

  "react-php-mysql": {
    stackId: "react-php-mysql",

    frontend: {
      image: "node:22-alpine",
      port: 5173,
    },

    backend: {
      image: "php:8.4-cli",
      port: 8000,
    },

    database: {
      image: "mysql:8.4",
      port: 3306,
      environment: {
        MYSQL_DATABASE: "assessment",
        MYSQL_USER: "assessment",
        MYSQL_PASSWORD: "assessment",
        MYSQL_ROOT_PASSWORD: "Assessment!Root123",
      },
    },
  },

  "react-ruby-postgres": {
    stackId: "react-ruby-postgres",

    frontend: {
      image: "node:22-alpine",
      port: 5173,
    },

    backend: {
      image: "ruby:3.4",
      port: 3000,
    },

    database: {
      image: "postgres:16-alpine",
      port: 5432,
      environment: {
        POSTGRES_DB: "assessment",
        POSTGRES_USER: "assessment",
        POSTGRES_PASSWORD: "assessment",
      },
    },
  },
};

export function getBugHuntRuntime(
  stackId: FullStackId
): BugHuntRuntime {
  return BUG_HUNT_RUNTIMES[stackId];
};