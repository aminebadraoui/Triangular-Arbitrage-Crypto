const { ethers } = require("ethers");
const IERC20 = require("../../abi/IERC20/IERC20.json");
const UNISWAPV2ROUTER = require("../../abi/UniswapV2/UniswapV2Router02.json");
const { POLYGON_PROVIDER } = require("../../provider");

const getPairPriceUniswapV2 = async (
  baseToken,
  swapToken,
  protocol,
  amount,
) => {
  const router_contract = new ethers.Contract(
    protocol.routerAddress,
    UNISWAPV2ROUTER.abi,
    POLYGON_PROVIDER,
  );
  const baseAmount = ethers.utils.parseUnits(
    amount.toString(),
    baseToken.decimals,
  );

  //////
  const amountsOut = await router_contract.getAmountsOut(baseAmount, [
    baseToken.address,
    swapToken.address,
  ]);

  const price = amountsOut[1];

  return price;
};

module.exports = { getPairPriceUniswapV2 };
