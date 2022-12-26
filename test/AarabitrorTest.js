const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const { impersonateFundErc20 } = require("../utils/utilities");
const {
  abi,
} = require("../artifacts/contracts/interfaces/IERC20.sol/IERC20.json");
const axios = require("axios");

const provider = waffle.provider;

const WETH_WHALE = "0x2093b4281990a568c9d588b8bce3bfd7a1557ebd";
const WETH_POLYGON = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const MATIC_POLYGON = "0x0000000000000000000000000000000000001010";
const flashloanPool = "0x5333Eb1E32522F1893B7C9feA3c263807A02d561";

describe("Arabitor tests", () => {
  let ARABITROR;
  let FUND_AMOUNT = "0.01";

  beforeEach(async () => {
    // check the whale balance is not zero
    const whale_balance = await provider.getBalance(WETH_WHALE);
    expect(whale_balance).not.equal("0");

    // get our contract deployed
    const arabitror = await ethers.getContractFactory("Arabitror");
    ARABITROR = await arabitror.deploy();
    await ARABITROR.deployed();

    const BASE_TOKEN_ERC20_CONTRACT = new ethers.Contract(
      WETH_POLYGON,
      abi,
      provider,
    );

    await impersonateFundErc20(
      BASE_TOKEN_ERC20_CONTRACT,
      WETH_WHALE,
      ARABITROR.address,
      FUND_AMOUNT,
    );
  });

  it("should have the correct balance on smart contract", async () => {
    const contractBalance = await ARABITROR.getBalance(WETH_POLYGON);
    const contractBalanceFormatted = ethers.utils.formatUnits(
      contractBalance,
      18,
    );
    expect(contractBalanceFormatted).to.equal(FUND_AMOUNT);
  });

  it("should perforn the arbitrage correctly", async () => {
    const loanAmount = ethers.utils.parseUnits("100", 18);
    const tx = ARABITROR.startArbitrage(
      flashloanPool,
      loanAmount,
      WETH_POLYGON,
      MATIC_POLYGON,
    );
    assert(tx);
  });
});
