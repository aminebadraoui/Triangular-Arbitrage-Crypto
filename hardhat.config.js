require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.5.5" },
      { version: "0.6.6" },
      { version: "0.8.9" },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.ankr.com/bsc",
      },
    },
    mainnet: {
      url: "https://bsc-dataseed1.binance.org/",
      chainId: 56,
    },
  },
};
