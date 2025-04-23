require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    "tea-sepolia": {
      url: "https://tea-sepolia.g.alchemy.com/public",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};