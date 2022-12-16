const { ethers } = require("ethers");
const QUOTER = require("./Quoter.json");
const { POLYGON_PROVIDER } = require("../../provider");
const { UNISWAPV3_ADRESS } = require("./Addresses");
const IERC20 = require("../ierc20/abi/IERC20.json");

const quoter_contract = new ethers.Contract(
  UNISWAPV3_ADRESS.QUOTER,
  QUOTER.abi,
  POLYGON_PROVIDER,
);

const getSpotPrice = async (poolContract, pairAddress, baseToken) => {
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);

  const swapToken = token0 == baseToken ? token1 : token0;

  const baseToken_ierc20 = new ethers.Contract(
    baseToken,
    IERC20.abi,
    POLYGON_PROVIDER,
  );

  const swapToken_ierc20 = new ethers.Contract(
    swapToken,
    IERC20.abi,
    POLYGON_PROVIDER,
  );

  const baseAmount = 1.0;
  const baseTokenDecimals = await baseToken_ierc20.decimals();

  const amountIn = ethers.utils.parseUnits(
    baseAmount.toString(),
    baseTokenDecimals,
  );

  const quote = await quoter_contract.callStatic.quoteExactInputSingle(
    baseToken,
    swapToken,
    fee,
    amountIn.toString(),
    0,
  );

  return { quote, baseToken_ierc20, swapToken_ierc20 };
};

module.exports = { getSpotPrice };
