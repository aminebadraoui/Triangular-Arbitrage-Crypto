const { ethers } = require("ethers");
const FACTORYABI = require("../../abi/KyberSwap/KyberSwapFactory.json");
const ROUTERABI = require("../../abi/KyberSwap/KyberSwapRouter.json");
const POOLABI = require("../../abi/KyberSwap/KyberPool.json");
const IERC20 = require("../../abi/IERC20/IERC20.json");
const { POLYGON_PROVIDER } = require("../../provider");

const getPrice = async (baseToken, swapToken, protocol) => {
  const router_contract = new ethers.Contract(
    protocol.routerAddress,
    ROUTERABI.abi,
    POLYGON_PROVIDER,
  );

  const factory_contract = new ethers.Contract(
    protocol.factoryAddress,
    FACTORYABI.abi,
    POLYGON_PROVIDER,
  );

  const pools = await factory_contract.getPools(
    baseToken.address,
    swapToken.address,
  ).catch(() => {});

  const pool = pools[0];

  const pool_contract = new ethers.Contract(
    pool,
    POOLABI.abi,
    POLYGON_PROVIDER,
  )

  const token0 = await pool_contract.token0().catch(() => {});
  const token1 = await pool_contract.token1().catch(() => {});

  const token0_contract = new ethers.Contract(
    token0,
    IERC20.abi,
    POLYGON_PROVIDER,
  );
  const token1_contract = new ethers.Contract(
    token1,
    IERC20.abi,
    POLYGON_PROVIDER,
  );

  const reserveToken0 = await token0_contract.balanceOf(pool).catch(() => {});
  const reserveToken1 = await token1_contract.balanceOf(pool).catch(() => {});

  const [token0name, token1name] = await Promise.all([
    token0_contract.name(),
    token1_contract.name(),
  ]);

  const baseAmount = ethers.utils.parseUnits("1.0", 18);

  //////
  const price = await router_contract.quote(
    baseAmount,
    reserveToken1,
    reserveToken0,
  ).catch(() => {});

 
  return price;
};

module.exports = { getPrice };
