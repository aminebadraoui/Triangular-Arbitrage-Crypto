require("dotenv").config();
const ethers = require("ethers");
const chalk = require("chalk");
const { POLYGON_PROVIDER } = require("./provider");
const { POLYGON_PAIRS, getPairName } = require("./models/pairs");
const { protocols } = require("./models/protocols");
const { getPrice } = require("./helper/getPrice");

const amountIn = process.env.AMOUNT_IN;

const main = async () => {
  let isExecuting = false;
  console.log("Starting scan...");

  POLYGON_PROVIDER.on("block", async (event) => {
    if (!isExecuting) {
      isExecuting = true;
      console.log("*****************************************");
      console.log(`BLOCK ${event}`);
      console.log("*****************************************");

      const estimateGasPrice = await POLYGON_PROVIDER.getFeeData();
      const maxFeePerGas = estimateGasPrice.maxFeePerGas;

      const rates = await getBestRateForAllPairs().catch((e) => {
        console.log(e);
      });

      const potentialAmountsOuts = await getPotentialAmountOutForAllPairs(
        rates,
      ).catch((e) => {
        console.log(e);
      });

      POLYGON_PAIRS.forEach((pair) => {
        const pairName = getPairName(pair);
        const potentialAmountOut = potentialAmountsOuts[pairName];

        const profit = Number(potentialAmountOut) - Number(amountIn);

        if (profit > 0 || process.env.IS_DEBUG == 1) {
          displayData(pair, amountIn, potentialAmountOut);
        }
      });

      isExecuting = false;
    }
  });
};

const getBestRateForAllPairs = async () => {
  let rates = {};

  // Get rates foe each pair
  await Promise.allSettled(
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
      await Promise.allSettled(
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

      if (bestBaseToSwap.rate && bestSwapToBase.rate) {
        rates[getPairName(pair)] = {
          bestBaseToSwap: bestBaseToSwap,
          bestSwapToBase: bestSwapToBase,
        };
      }
    }),
  );

  return rates;
};

const getPotentialAmountOutForAllPairs = async (rates) => {
  let potentialAmountsOut = {};

  await Promise.allSettled(
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
      ).catch(() => {});

      const formattedPotentialAmountOut = ethers.utils.formatUnits(
        potentialAmountOut,
        BASE_TOKEN.decimals,
      );

      potentialAmountsOut[pairName] = {
        ...rates[pairName],
        potentialAmountOut: formattedPotentialAmountOut,
      };
    }),
  );

  return potentialAmountsOut;
};

const displayData = (pair, amountIn, amountOut) => {
  const baseTokenSymbol = pair.token0.symbol;
  const baseToSwapRate = amountOut.bestBaseToSwap.rate;

  const swapTokenSymbol = pair.token1.symbol;
  const potentialAmountOut = amountOut.potentialAmountOut;

  const baseToSwapProtocolName = amountOut.bestBaseToSwap.protocol.name;
  const swapToBaseProtocolName = amountOut.bestSwapToBase.protocol.name;

  const proportionalBaseToSwapAmountOut =
    Number(amountIn) * Number(baseToSwapRate);
  const proportionalSwapToBaseAmountOut =
    Number(amountIn) * Number(potentialAmountOut);
  const profit = Number(proportionalSwapToBaseAmountOut) - Number(amountIn);

  console.log(
    `${amountIn} ${baseTokenSymbol} -> ${proportionalBaseToSwapAmountOut} ${swapTokenSymbol} on ${chalk.cyanBright(
      `${baseToSwapProtocolName} `,
    )}`,
  );

  console.log(
    `${
      Number(amountIn) * Number(baseToSwapRate)
    } ${swapTokenSymbol}  -> ${proportionalSwapToBaseAmountOut} ${baseTokenSymbol} on ${chalk.cyanBright(
      `${swapToBaseProtocolName}`,
    )}`,
  );

  if (profit > 0) {
    console.log(chalk.green(`>>>>> PROFIT ${profit} ${baseTokenSymbol}`));
  } else {
    console.log(chalk.red(`>>>>> PROFIT ${profit} ${baseTokenSymbol}`));
  }
  console.log("");
};

module.exports = { main };
