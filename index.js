const { default: Big } = require("big.js");
const ethers = require("ethers");
const { SWAP_ABI } = require("./scripts/abi/UniswapV3Events");
const UniswapV3Pool = require("./scripts/abi/UniswapV3Pair");
const UniswapV2Pair = require("./scripts/abi/UniswapV2Pair");
const IERC20 = require("./scripts/abi/IERC20");
const { SWAP_EVENT_SIGNATURE } = require("./scripts/helpers");

const POLYGON_MAINNET_URL =
  "https://polygon-mainnet.g.alchemy.com/v2/4zo-2oGovRKoVjdokcVaaSTuz22q9sJB";
const ETHEREUM_MAINNET_URL =
  "https://eth-mainnet.g.alchemy.com/v2/lKJk6w82nyQy03A0tm5BMbg-s_uNtB7b";

const POLYGON_PROVIDER = new ethers.providers.JsonRpcProvider(
  POLYGON_MAINNET_URL,
);
const ETHEREUM_PROVIDER = new ethers.providers.JsonRpcProvider(
  ETHEREUM_MAINNET_URL,
);

const MATIC_WETH__UNISWAPV3_POLYGON =
  "0x86f1d8390222A3691C28938eC7404A1661E618e0";

const WMATIC_WETH__QUICKSWAP_POLYGON =
  "0xadbF1854e5883eB8aa7BAf50705338739e558E5b";

const uniswap_pair_contract = new ethers.Contract(
  MATIC_WETH__UNISWAPV3_POLYGON,
  UniswapV3Pool.abi,
  POLYGON_PROVIDER,
);

const DIFF_TRESHOLD = 0.1;

let isExecuting = false;

const quickswap_pair_contract = new ethers.Contract(
  WMATIC_WETH__QUICKSWAP_POLYGON,
  UniswapV2Pair.abi,
  POLYGON_PROVIDER,
);

const filter = {
  address: MATIC_WETH__UNISWAPV3_POLYGON,
};

const main = async () => {
  POLYGON_PROVIDER.on(filter, async (event) => {
    if (!isExecuting) {
      isExecuting = true;

      console.log(" EVENT ON PAIR DETECTED");

      const diff = await checkForImbalance("Uniswap");
      console.log(`diff: ${diff} \n`);

      const path = calculateDirectionOfSwap(diff);

      if (!path) {
        console.log("No Arbitrage sadly");
        isExecuting = false;
        return;
      }

      console.log("Chance for abitrage, lets go ON!!");
      isExecuting = false;
    }
  });
};

const checkForImbalance = async (exchange) => {
  console.log(`Swap initiated on ${exchange}`);

  const uRatio = await calculatePriceRatio(
    "Uniswap",
    uniswap_pair_contract,
    MATIC_WETH__UNISWAPV3_POLYGON,
  );
  const sRatio = await calculatePriceRatio(
    "QuickSwap",
    quickswap_pair_contract,
    WMATIC_WETH__QUICKSWAP_POLYGON,
  );

  const diff = calculateDifference(uRatio, sRatio);

  return diff;
};

const calculatePriceRatio = async (exchange, pairContract, pairAddress) => {
  const token0 = await pairContract.token0();
  const token1 = await pairContract.token1();

  const token0_ierc20 = new ethers.Contract(
    token0,
    IERC20.abi,
    POLYGON_PROVIDER,
  );

  const token1_ierc20 = new ethers.Contract(
    token1,
    IERC20.abi,
    POLYGON_PROVIDER,
  );

  const reserve0 = await token0_ierc20.balanceOf(pairAddress);
  const reserve1 = await token1_ierc20.balanceOf(pairAddress);

  const formattedReserve0 = ethers.utils.formatUnits(reserve0, 18);
  const formattedReserve1 = ethers.utils.formatUnits(reserve1, 18);

  const symbol0 = await token0_ierc20.symbol();
  const symbol1 = await token1_ierc20.symbol();

  console.log(`========`);
  console.log(`Reserve of ${symbol0} on ${exchange} : ${formattedReserve0} \n`);
  console.log(`Reserve of ${symbol1} on ${exchange} : ${formattedReserve1} \n`);

  const ratio = Big(reserve0).div(Big(reserve1)).toString();

  console.log(
    `Reserve Ratio for  ${symbol0}/${symbol1} ${exchange} is: ${ratio} \n`,
  );
  console.log(`========`);

  return ratio;
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
