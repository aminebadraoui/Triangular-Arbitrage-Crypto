const { ethers } = require("ethers");
const QUOTER = require("../../abi/UniswapV3/Quoter.json");
const FACTORY = require("../../abi/UniswapV3/UniswapV3Factory.json");
const POOL = require("../../abi/UniswapV3/UniswapV3Pool.json");
const { POLYGON_PROVIDER } = require("../../provider");
const { UNISWAPV3_ADRESS } = require("./Addresses");
const IERC20 = require("../../abi/IERC20/IERC20.json");

const quoter_contract = new ethers.Contract(
  UNISWAPV3_ADRESS.QUOTER,
  QUOTER.abi,
  POLYGON_PROVIDER,
);

const getPairPriceUniswapV3 = async (
  baseToken,
  swapToken,
  protocol,
  amount,
) => {
  const factory_contract = new ethers.Contract(
    protocol.factoryAddress,
    FACTORY.abi,
    POLYGON_PROVIDER,
  );
  const poolAddress = await factory_contract.getPool(
    baseToken.address,
    swapToken.address,
    500,
  );

  const poolContract = new ethers.Contract(
    poolAddress,
    POOL.abi,
    POLYGON_PROVIDER,
  );

  const fee = await poolContract.fee();

  const amountIn = ethers.utils.parseUnits(
    amount.toString(),
    baseToken.decimals,
  );

  const quote = await quoter_contract.callStatic.quoteExactInputSingle(
    baseToken.address,
    swapToken.address,
    fee,
    amountIn.toString(),
    0,
  );

  //console.log(ethers.utils.formatUnits(quote, 18));

  return quote;
};

module.exports = { getPairPriceUniswapV3 };
