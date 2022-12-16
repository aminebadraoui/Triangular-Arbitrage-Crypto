const { default: Big } = require("big.js");
const ethers = require("ethers");
const UNISWAPV3_ABI = require("./scripts/helpers/uniswapV3/UniswapV3Pool.json");
const { UNISWAPV2_ABI } = require("./scripts/helpers/uniswapV2/abi");
const UNIS = require("./scripts/helpers/uniswapV2/abi");
const IERC20 = require("./scripts/helpers/ierc20/abi/IERC20.json");
const { SWAP_EVENT_SIGNATURE } = require("./scripts/helpers");
const { POLYGON_PROVIDER } = require("./scripts/provider");
const { getSpotPrice } = require("./scripts/helpers/UniswapV3/GetPrice");

const WETH_POLYGON = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const MATIC_WETH__UNISWAPV3_POLYGON =
  "0x86f1d8390222A3691C28938eC7404A1661E618e0";

const WMATIC_WETH__QUICKSWAP_POLYGON =
  "0xadbF1854e5883eB8aa7BAf50705338739e558E5b";

const uniswap_pair_contract = new ethers.Contract(
  MATIC_WETH__UNISWAPV3_POLYGON,
  UNISWAPV3_ABI.abi,
  POLYGON_PROVIDER,
);

const DIFF_TRESHOLD = 0.1;

let isExecuting = false;

const quickswap_pair_contract = new ethers.Contract(
  WMATIC_WETH__QUICKSWAP_POLYGON,
  UNISWAPV2_ABI.UNISWAPV2PAIR,
  POLYGON_PROVIDER,
);

const filter = {
  address: MATIC_WETH__UNISWAPV3_POLYGON,
};

const main = async () => {
  POLYGON_PROVIDER.on(filter, async (event) => {
    if (!isExecuting) {
      isExecuting = true;
      console.log(`========`);
      console.log(" A new event on uniswap pool happened");
      console.log(`========`);

      const diff = await checkForImbalance("Uniswap");
      console.log(`========`);
      console.log(`Price difference: ${diff} \n`);
      console.log(`========`);

      const path = calculateDirectionOfSwap(diff);

      if (!path) {
        console.log(`========`);
        console.log("No Arbitrage opportunity detected");
        console.log(`========`);
        isExecuting = false;
        return;
      }

      console.log(`========`);
      console.log("Arbitrage opportunity Detected!");
      console.log(`========`);
      isExecuting = false;
    }
  });
};

const checkForImbalance = async () => {
  const {
    quote: price0,
    baseToken_ierc20: baseToken0,
    swapToken_ierc20: swapToken0,
  } = await getSpotPrice(
    uniswap_pair_contract,
    MATIC_WETH__UNISWAPV3_POLYGON,
    WETH_POLYGON,
  );

  const formattedPrice0 = ethers.utils.formatUnits(
    price0.toString(),
    await swapToken0.decimals(),
  );
  const baseTokenSymbol0 = await baseToken0.symbol();
  const swapTokenSymbol0 = await swapToken0.symbol();

  console.log(`========`);
  console.log(
    `Price of 1 ${baseTokenSymbol0} on Uniswap : ${formattedPrice0} ${swapTokenSymbol0} \n`,
  );

  const {
    price: price1,
    baseToken_ierc20: baseToken1,
    swapToken_ierc20: swapToken1,
  } = await calculatePriceRatio(
    quickswap_pair_contract,
    WMATIC_WETH__QUICKSWAP_POLYGON,
    WETH_POLYGON,
  );

  const formattedPrice1 = price1;
  const baseTokenSymbol1 = await baseToken1.symbol();
  const swapTokenSymbol1 = await swapToken1.symbol();

  console.log(`========`);
  console.log(
    `Price of 1 ${baseTokenSymbol1} on QuickSwap : ${formattedPrice1} ${swapTokenSymbol1} \n`,
  );

  const diff = calculateDifference(formattedPrice0, formattedPrice1);

  return diff;
};

const calculatePriceRatio = async (pairContract, pairAddress, baseToken) => {
  const token0 = await pairContract.token0();
  const token1 = await pairContract.token1();

  const swapToken = baseToken == token0 ? token1 : token0;

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

  const reserveBase = await baseToken_ierc20.balanceOf(pairAddress);
  const reserveSwap = await swapToken_ierc20.balanceOf(pairAddress);

  const price = Big(reserveSwap).div(reserveBase);

  return { price, baseToken_ierc20, swapToken_ierc20 };
};

const calculateDifference = (price0, price1) => {
  return (((price0 - price1) / price1) * 100).toFixed(2);
};

const calculateDirectionOfSwap = (diff) => {
  console.log(`Determining Direction...\n`);

  if (diff >= DIFF_TRESHOLD) {
    console.log(`Potential Arbitrage Direction:\n`);
    console.log(`Buy\t -->\t Uniswap`);
    console.log(`Sell\t -->\t Sushiswap\n`);

    return "U to S";
  } else if (diff <= -DIFF_TRESHOLD) {
    console.log(`Potential Arbitrage Direction:\n`);
    console.log(`Buy\t -->\t Sushiswap`);
    console.log(`Sell\t -->\t Uniswap\n`);

    return "S to U";
  } else {
    return null;
  }
};

main();
