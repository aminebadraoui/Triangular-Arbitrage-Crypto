const { getPairPriceUniswapV3 } = require("../protocols/uniswapV3/getPrice");
const FRAXSWAPROUTER = require("../abi/Fraxswap/FraxswapRouter.json");
const { getPairPriceUniswapV2 } = require("../protocols/uniswapV2/getPrice");
const { getPrice: getKyberPrice } = require("../protocols/kyberswap/getPrice");

const getPrice = async (baseToken, swapToken, protocol, amount) => {
  if (protocol.fork == "V3") {
    try {
      const price = await getPairPriceUniswapV3(
        baseToken,
        swapToken,
        protocol,
        amount,
      );
      return price;
    } catch (e) {}
  }

  if (protocol.fork == "Kyber") {
    const price = await getKyberPrice(baseToken, swapToken, protocol, amount);
    return price;
  }
  if (protocol.fork == "V2") {
    try {
      const price = await getPairPriceUniswapV2(
        baseToken,
        swapToken,
        protocol,
        amount,
      );
      return price;
    } catch (e) {}
  }

  if (protocol.fork == "Fraxswap") {
    const price = await getPairPriceUniswapV2(
      baseToken,
      swapToken,
      protocol.routerAddress,
      FRAXSWAPROUTER.abi,
    ).catch(() => {});

    return price;
  }
};

module.exports = { getPrice };
