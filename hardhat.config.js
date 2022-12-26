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
        url: "https://polygon-mainnet.infura.io/v3/0c1cf12a2abb497288c2f23bb29d0761",
      },
    },
    mainnet: {
      url: "https://polygon-mainnet.infura.io/v3/0c1cf12a2abb497288c2f23bb29d0761",
      chainId: 137,
    },
  },
};
