const ethers = require("ethers");
const { POLYGON_PROVIDER } = require("./scripts/provider");
const {
  getPairPriceUniswapV3,
} = require("./scripts/helpers/uniswapV3/GetPairPrice");

const FRAXSWAPROUTER = require("./scripts/abi/Fraxswap/FraxswapRouter.json");

const {
  getPairPriceUniswapV2,
} = require("./scripts/helpers/uniswapV2/GetPairPrice");
const { protocols } = require("./scripts/protocols");

const {
  getPrice: getKyberPrice,
} = require("./scripts/helpers/kyberswap/GetQuote");

const { POLYGON_PAIRS, getPairName } = require("./scripts/pairs");

const chalk = require("chalk");

let isExecuting = false;

const AmountOfEth = 100;

let isDebug = true;

const getPrice = async (baseToken, swapToken, protocol, amount) => {
  if (protocol.fork == "V3") {
    const price = await getPairPriceUniswapV3(
      baseToken,
      swapToken,
      protocol,
      amount,
    );

    return price;
  }

  if (protocol.fork == "Kyber") {
    const price = await getKyberPrice(baseToken, swapToken, protocol, amount);

    return price;
  }
  if (protocol.fork == "V2") {
    const price = await getPairPriceUniswapV2(
      baseToken,
      swapToken,
      protocol,
      amount,
    );

    return price;
  }

  if (protocol.fork == "Fraxswap") {
    const price = await getPairPriceUniswapV2(
      baseToken,
      swapToken,
      protocol.routerAddress,
      FRAXSWAPROUTER.abi,
    );

    return price;
  }
};
const main = async () => {
  console.log("Starting scan...");

  POLYGON_PROVIDER.on("block", async (event) => {
    if (!isExecuting) {
      isExecuting = true;
      console.log(`Block ${event}`);

      const estimateGasPrice = await POLYGON_PROVIDER.getFeeData();
      const maxFeePerGas = estimateGasPrice.maxFeePerGas;

      const rates = await getBestRateForAllPairs();

      const potentialAmountsOuts = await getPotentialAmountOutForAllPairs(
        rates,
      );

      console.log(JSON.stringify(potentialAmountsOuts, null, 2));

      isExecuting = false;
    }
  });
};

main();

const getBestRateForAllPairs = async () => {
  let rates = {};

  // Get rates foe each pair
  await Promise.all(
    POLYGON_PAIRS.map(async (pair) => {
      const BASE_TOKEN = pair.token0;
      const SWAP_TOKEN = pair.token1;

      let bestBaseToSwap = {
        rate: null,
        protocol: null,
      };

      let bestSwapToBase = {
        rate: null,
        protocol: null,
      };

      // Get best prices for pair
      await Promise.all(
        protocols.map(async (protocol) => {
          // Fetch prices for pair at current protocol
          const [baseToSwap, swapToBase] = await Promise.all([
            getPrice(BASE_TOKEN, SWAP_TOKEN, protocol, "1.0"),
            getPrice(SWAP_TOKEN, BASE_TOKEN, protocol, "1.0"),
          ]);

          const formattedBaseToSwap = ethers.utils.formatUnits(
            baseToSwap,
            SWAP_TOKEN.decimals,
          );

          const formattedSwapToBase =
            1 / ethers.utils.formatUnits(swapToBase, BASE_TOKEN.decimals);

          // is this the better than price in last protocol?
          // if yes: Update price tracker
          if (
            !bestBaseToSwap.rate ||
            Number(formattedBaseToSwap) > Number(bestBaseToSwap.rate)
          ) {
            bestBaseToSwap = {
              rate: formattedBaseToSwap,
              protocol: protocol,
            };
          }

          if (
            !bestSwapToBase.rate ||
            Number(formattedSwapToBase) < Number(bestSwapToBase.rate)
          ) {
            bestSwapToBase = {
              rate: formattedSwapToBase,
              protocol: protocol,
            };
          }
        }),
      );

      rates[getPairName(pair)] = {
        bestBaseToSwap: bestBaseToSwap,
        bestSwapToBase: bestSwapToBase,
      };
    }),
  );

  return rates;
};

const getPotentialAmountOutForAllPairs = async (rates) => {
  let potentialAmountsOut = {};
  await Promise.all(
    POLYGON_PAIRS.map(async (pair) => {
      const BASE_TOKEN = pair.token0;
      const SWAP_TOKEN = pair.token1;

      const pairName = getPairName(pair);

      const bestSwapToBaseProtocol = rates[pairName].bestSwapToBase.protocol;
      const bestBaseToSwapRate = rates[pairName].bestBaseToSwap.rate;

      const potentialAmountOut = await getPrice(
        SWAP_TOKEN,
        BASE_TOKEN,
        bestSwapToBaseProtocol,
        bestBaseToSwapRate,
      );

      const formattedPotentialAmountOut = ethers.utils.formatUnits(
        potentialAmountOut,
        BASE_TOKEN.decimals,
      );

      potentialAmountsOut[pairName] = {
        rates: {
          ...rates[pairName],
        },
        potentialAmountOut: formattedPotentialAmountOut,
      };
    }),
  );

  return potentialAmountsOut;
};

// const displayArbitrage = async () => {

//   const profit = Number(formattedEstimatedOut) - Number("1.0");

//   if (isDebug == true || (isDebug == false && profit > 0)) {
//     console.log(
//       `1 ${BASE_TOKEN.name} -> ${lastMaxBaseToSwap.rate} ${
//         SWAP_TOKEN.symbol
//       } on ${chalk.cyanBright(`${lastMaxBaseToSwap.protocol.name} `)}`,
//     );

//     console.log(
//       `${lastMaxBaseToSwap.rate} ${
//         SWAP_TOKEN.symbol
//       }  -> ${formattedEstimatedOut} ${BASE_TOKEN.name} on ${chalk.cyanBright(
//         `${lastMinSwapToBase.protocol.name} `,
//       )}`,
//     );

//     if (profit > 0) {
//       console.log(chalk.green(`>>>>> PROFIT ${profit} ${BASE_TOKEN.name}`));
//     } else {
//       console.log(chalk.red(`>>>>> PROFIT ${profit} ${BASE_TOKEN.name}`));
//     }
//   } else {
//   }
// };
