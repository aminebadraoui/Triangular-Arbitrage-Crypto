const { TOKENS_POLYGON } = require("./tokens");

const POLYGON_PAIRS = [
  { token0: TOKENS_POLYGON.usdc, token1: TOKENS_POLYGON.matic },
  { token0: TOKENS_POLYGON.usdc, token1: TOKENS_POLYGON.ether },

  { token0: TOKENS_POLYGON.dai, token1: TOKENS_POLYGON.matic },
  { token0: TOKENS_POLYGON.dai, token1: TOKENS_POLYGON.ether },

  { token0: TOKENS_POLYGON.matic, token1: TOKENS_POLYGON.ether },

  { token0: TOKENS_POLYGON.ether, token1: TOKENS_POLYGON.usdc },
];

const getPairName = (pair) => {
  return `${pair.token0.name} / ${pair.token1.name} `;
};

module.exports = { POLYGON_PAIRS, getPairName };
