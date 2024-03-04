import type { Config } from "jest";

const config: Config = {
  testMatch: ["**/*.test.ts", "**/*.it.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest"
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};

export default config;
