const ethers = require("ethers");

const swapEvent =
  "Swap(address indexed sender,uint amount0In,uint amount1In, uint amount0Out,uint amount1Out,address indexed to)";

const SWAP_EVENT_SIGNATURE =
  "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67";

module.exports = { SWAP_EVENT_SIGNATURE };
