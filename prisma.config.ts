import path from "path";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_URL as string,
  },
  migrate: {
    async adapter() {
      return new PrismaPg({ connectionString: process.env.DIRECT_URL as string });
    },
  },
});