const ethers = require("ethers");
const dotenv = require("dotenv");

dotenv.config();

console.log(process.env.POLYGON_MAINNET_URL);

const POLYGON_PROVIDER = new ethers.providers.JsonRpcProvider(
  process.env.POLYGON_MAINNET_URL,
);
const ETHEREUM_PROVIDER = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_MAINNET_URL,
);

module.exports = { POLYGON_PROVIDER, ETHEREUM_PROVIDER };
