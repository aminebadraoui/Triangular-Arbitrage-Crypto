// const { ethers } = require("hardhat");
// const { expect, assert } = require("chai");
// const { impersonateFundErc20 } = require("../utils/utilities");
// const {
//   abi,
// } = require("../artifacts/contracts/interfaces/IERC20.sol/IERC20.json");

// const provider = waffle.provider;

// describe("PancakeFlashSwapTest", () => {
//   let FLASH_SWAP_CONTRACT;
//   let BORROW_AMOUNT = "1";
//   let FUND_AMOUNT = "100.0";

//   const decimals = 18;

//   const WHALE = "0xf977814e90da44bfa03b6295a0616a897441acec";
//   const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";

//   const BASE_TOKEN_ADDRESS = BUSD;

//   const BASE_TOKEN_ERC20_CONTRACT = new ethers.Contract(
//     BASE_TOKEN_ADDRESS,
//     abi,
//     provider,
//   );

//   beforeEach(async () => {
//     // get owner as a signer
//     [owner] = await ethers.getSigners();

//     // check the whale balance is not zero
//     const whale_balance = await provider.getBalance(WHALE);
//     expect(whale_balance).not.equal("0");

//     // get our contract deployed
//     const flashswapFactory = await ethers.getContractFactory(
//       "PancakeFlashSwap",
//     );
//     FLASH_SWAP_CONTRACT = await flashswapFactory.deploy();
//     await FLASH_SWAP_CONTRACT.deployed();

//     // fund contract

//     await impersonateFundErc20(
//       BASE_TOKEN_ERC20_CONTRACT,
//       WHALE,
//       FLASH_SWAP_CONTRACT.address,
//       FUND_AMOUNT,
//     );
//   });

//   describe("Arbitrage execution", () => {
//     it("should fund the contract", async () => {
//       const flashSwapBalance = await FLASH_SWAP_CONTRACT.getBalance(
//         BASE_TOKEN_ADDRESS,
//       );
//       const flashSwapBalanceFormatted = ethers.utils.formatUnits(
//         flashSwapBalance,
//         18,
//       );
//       expect(flashSwapBalanceFormatted).to.equal(FUND_AMOUNT);
//     });

//     it("should execute the arbitrage correctly", async () => {
//       const flashSwapBalance = await FLASH_SWAP_CONTRACT.getBalance(
//         BASE_TOKEN_ADDRESS,
//       );
//       const flashSwapBalanceFormatted = ethers.utils.formatUnits(
//         flashSwapBalance,
//         18,
//       );

//       const tx = await FLASH_SWAP_CONTRACT.startArbitrage(
//         BASE_TOKEN_ADDRESS,
//         ethers.utils.parseEther(BORROW_AMOUNT),
//       );

//       assert(tx);
//     });
//   });
// });
