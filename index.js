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

const { POLYGON_PAIRS } = require("./scripts/pairs");

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
  console.log("Waiting for an event to happen on the pool...");
  POLYGON_PROVIDER.on("block", async (event) => {
    console.log(" ");
    if (!isExecuting) {
      isExecuting = true;
      console.log(`========`);
      console.log("New block");
      console.log(`========`);

      const estimateGasPrice = await POLYGON_PROVIDER.getFeeData();
      const maxFeePerGas = estimateGasPrice.maxFeePerGas;

      const formattedGasFees = ethers.utils.formatEther(maxFeePerGas);
      // console.log(`Estimate gas price  ${formattedGasFees}`);

      POLYGON_PAIRS.forEach(async (pair) => {
        const BASE_TOKEN = pair.token0;
        const SWAP_TOKEN = pair.token1;

        let lastMaxBaseToSwap = {
          rate: "-1",
          protocol: null,
          estimatedYield: null,
        };
        let lastMinSwapToBase = {
          rate: "10000000000000000000000",
          protocol: null,
        };

        await Promise.all(
          protocols.map(async (protocol) => {
            const [baseToSwap, swapToBase] = await Promise.all([
              getPrice(BASE_TOKEN, SWAP_TOKEN, protocol, "1.0"),
              getPrice(SWAP_TOKEN, BASE_TOKEN, protocol, "1.0"),
            ]);

            const formattedBaseToSwap = ethers.utils.formatUnits(
              baseToSwap,
              SWAP_TOKEN.decimals,
            );

            // console.log(protocol.name);
            // console.log(formattedBaseToSwap);

            if (Number(formattedBaseToSwap) > Number(lastMaxBaseToSwap.rate)) {
              lastMaxBaseToSwap = {
                rate: formattedBaseToSwap,
                protocol: protocol,
              };
            }

            const formattedSwapToBase =
              1 / ethers.utils.formatUnits(swapToBase, BASE_TOKEN.decimals);

            if (
              Number(formattedSwapToBase) - Number(lastMinSwapToBase.rate) <
              0
            ) {
              lastMinSwapToBase = {
                rate: formattedSwapToBase,
                protocol: protocol,
              };
            }
          }),
        );

        const buyprotocolName = lastMaxBaseToSwap.protocol.name;
        const sellprotocolName = lastMinSwapToBase.protocol.name;

        const estimatedOut = await getPrice(
          SWAP_TOKEN,
          BASE_TOKEN,
          lastMinSwapToBase.protocol,
          lastMaxBaseToSwap.rate,
        );

        const formattedEstimatedOut = ethers.utils.formatUnits(
          estimatedOut,
          BASE_TOKEN.decimals,
        );

        const profit = Number(formattedEstimatedOut) - Number("1.0");

        if (isDebug == true || (isDebug == false && profit > 0)) {
          console.log(
            `1 ${BASE_TOKEN.name} -> ${lastMaxBaseToSwap.rate} ${
              SWAP_TOKEN.symbol
            } on ${chalk.cyanBright(`${buyprotocolName} `)}`,
          );

          console.log(
            `${lastMaxBaseToSwap.rate} ${
              SWAP_TOKEN.symbol
            }  -> ${formattedEstimatedOut} ${
              BASE_TOKEN.name
            } on ${chalk.cyanBright(`${sellprotocolName} `)}`,
          );

          if (profit > 0) {
            console.log(
              chalk.green(`>>>>> PROFIT ${profit} ${BASE_TOKEN.name}`),
            );
          } else {
            console.log(chalk.red(`>>>>> PROFIT ${profit} ${BASE_TOKEN.name}`));
          }

          //console.log(`>>>> PROFIT:  ${profit} ${BASE_TOKEN.name}`);
          console.log(`--------`);
        } else {
          // console.log("No opportunity");
          // console.log(
          //   `1 ${BASE_TOKEN.name}  -> ${lastMaxBaseToSwap.rate} ${SWAP_TOKEN.name}  on ${buyprotocolName}  `,
          // );
          // console.log(
          //   `${lastMinSwapToBase.rate} ${SWAP_TOKEN.name}  -> 1 ${BASE_TOKEN.name} on ${sellprotocolName}  `,
          // );
        }
      });

      ///////////////////

      isExecuting = false;
    }
  });
};

main();
