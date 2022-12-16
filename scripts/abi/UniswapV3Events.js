const MINT_ABI = [
  "address sender",
  "address owner",
  "int24 tickLower",
  "int24 tickUpper",
  "uint128 amount",
  "uint256 amount0",
  "uint256 amount1",
];

const COLLECT_ABI = [
  "address owner",
  "address recipient",
  "int24 tickLower",
  "int24 tickUpper",
  "uint128 amount0",
  "uint128 amount1",
];

const BURN_ABI = [
  "address owner",
  "int24 tickLower",
  "int24 tickUpper",
  "uint128 amount",
  "uint256 amount0",
  "uint256 amount1",
];

const SWAP_ABI = [
  "int256 amount0",
  "int256 amount1",
  "uint160 sqrtPriceX96",
  "uint128 liquidity",
];

module.exports = { BURN_ABI, COLLECT_ABI, BURN_ABI, SWAP_ABI };
