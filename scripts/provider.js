const ethers = require("ethers");

const POLYGON_MAINNET_URL =
  "https://ultra-old-yard.matic.discover.quiknode.pro/e3f409c30c9d8517f46960425bb4a214ded8fcf6/";
const ETHEREUM_MAINNET_URL =
  "https://eth-mainnet.g.alchemy.com/v2/lKJk6w82nyQy03A0tm5BMbg-s_uNtB7b";

const POLYGON_PROVIDER = new ethers.providers.JsonRpcProvider(
  POLYGON_MAINNET_URL,
);
const ETHEREUM_PROVIDER = new ethers.providers.JsonRpcProvider(
  ETHEREUM_MAINNET_URL,
);

module.exports = { POLYGON_PROVIDER, ETHEREUM_PROVIDER };
