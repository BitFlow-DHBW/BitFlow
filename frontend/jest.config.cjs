module.exports = {
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  testMatch: ["**/?(*.)+(test).ts?(x)"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/src/test/styleMock.ts"
  },
  setupFilesAfterEnv: ["<rootDir>/src/test/setupTests.ts"]
};
