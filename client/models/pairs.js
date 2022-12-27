const { TOKENS_POLYGON } = require("./tokens");

const POLYGON_PAIRS = [
  { token0: TOKENS_POLYGON.usdc, token1: TOKENS_POLYGON.matic },
  { token0: TOKENS_POLYGON.usdc, token1: TOKENS_POLYGON.ether },
  { token0: TOKENS_POLYGON.usdc, token1: TOKENS_POLYGON.wbtc },
  { token0: TOKENS_POLYGON.usdc, token1: TOKENS_POLYGON.aave },
  { token0: TOKENS_POLYGON.usdc, token1: TOKENS_POLYGON.ust },
  { token0: TOKENS_POLYGON.usdc, token1: TOKENS_POLYGON.curve },
];

const getPairName = (pair) => {
  return `${pair.token0.name} / ${pair.token1.name} `;
};

module.exports = { POLYGON_PAIRS, getPairName };
