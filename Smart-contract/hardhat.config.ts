import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

// Load environment variables
const { 
  ALCHEMY_BASE_SEPOLIA_API_KEY_URL, LISK_SEPOLIA_API_KEY_URL, ACCOUNT_PRIVATE_KEY, BASESCAN_API_KEY, LISKSCAN_API_KEY} = process.env;


const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    base_sepolia: {
      url: ALCHEMY_BASE_SEPOLIA_API_KEY_URL,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`],
      chainId: 84532,
    },
    lisk_sepolia: {
      url: LISK_SEPOLIA_API_KEY_URL,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`],
      chainId: 4202,
    },
  },
  etherscan: {
    apiKey: {
      base_sepolia: BASESCAN_API_KEY || "",
      lisk_sepolia: LISKSCAN_API_KEY || "123",
    },
    customChains: [
      {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "lisk_sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
