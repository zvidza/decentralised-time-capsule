import { defineConfig } from "hardhat/config";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

export default defineConfig({
  plugins: [hardhatMocha, hardhatEthers],

  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  paths: {
    sources: "./contracts",
    tests: {
      mocha: "./test",
    },
    cache: "./cache",
    artifacts: "./artifacts",
  },
});
