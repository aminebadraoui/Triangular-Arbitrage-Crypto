// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.9;
// import "./libraries/SafeERC20.sol";
// import "./interfaces/IUniswapV2Factory.sol";
// import "./interfaces/IUniswapV2Pair.sol";
// import "./interfaces/IUniswapV2Router02.sol";
// import "hardhat/console.sol";

// contract PancakeFlashSwap {
//     using SafeERC20 for IERC20;

//     // factory and router addresses
//     address private constant PANCAKE_FACTORY =
//         0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73;
//     address private constant PANCAKE_ROUTER =
//         0x10ED43C718714eb63d5aA57B78B54704E256024E;

//     // token addresses
//     address private constant BTCb = 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c;
//     address private constant BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
//     address private constant CAKE = 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82;
//     address private constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
//     address private constant ETH = 0x2170Ed0880ac9A755fd29B2688956BD959F933F8;
//     address private constant USDT = 0xfD5840Cd36d94D7229439859C0112a4185BC0255;

//     // trade variables
//     uint256 private deadline = block.timestamp + 1 days;
//     uint256 private constant MAX_INT =
//         115792089237316195423570985008687907853269984665640564039457584007913129639935;

//     // Initiate arbitrage
//     function startArbitrage(address _tokenToBorrow, uint256 _amount) external {
//         // get pair address
//         address pair = IUniswapV2Factory(PANCAKE_FACTORY).getPair(
//             _tokenToBorrow,
//             CAKE
//         );

//         require(pair != address(0), "pair doesn't exist");

//         address token0 = IUniswapV2Pair(pair).token0();
//         address token1 = IUniswapV2Pair(pair).token1();

//         uint256 amount0 = _tokenToBorrow == token0 ? _amount : 0;
//         uint256 amount1 = _tokenToBorrow == token1 ? _amount : 0;

//         // parse data as bytes so uniswap knows it's a flash loan
//         address _owner = msg.sender;
//         bytes memory data = abi.encode(_tokenToBorrow, _amount, _owner);

//         IUniswapV2Pair(pair).swap(amount0, amount1, address(this), data);
//     }

//     function pancakeCall(
//         address sender,
//         uint256 amount0,
//         uint256 amount1,
//         bytes calldata data
//     ) external {
//         // make sure we are calling this ourselves
//         address token0 = IUniswapV2Pair(msg.sender).token0();
//         address token1 = IUniswapV2Pair(msg.sender).token1();
//         address pair = IUniswapV2Factory(PANCAKE_FACTORY).getPair(
//             token0,
//             token1
//         );
//         require(msg.sender == pair, "Wrong pair");
//         require(sender == address(this), "Not allowed");

//         // compute amount to payback
//         (address tokenBorrowed, uint256 borrowedAmount, address owner) = abi
//             .decode(data, (address, uint256, address));
//         uint256 fee = ((borrowedAmount * 3) / 997) + 1;
//         uint256 amountToPayback = borrowedAmount + fee;

//         console.log("");
//         console.log("BUSD Balance before swap");
//         console.log(IERC20(BUSD).balanceOf(address(this)));

//         uint256 tx1AmountOut = placeSwap(BUSD, BTCb, borrowedAmount);
//         uint256 tx2AmountOut = placeSwap(BTCb, WBNB, tx1AmountOut);
//         uint256 tx3AmountOut = placeSwap(WBNB, ETH, tx2AmountOut);
//         uint256 tx4AmountOut = placeSwap(ETH, BUSD, tx3AmountOut);

//         bool isProfitable = isArbitrageProfitable(
//             tx4AmountOut,
//             amountToPayback
//         );

//         if (isProfitable) {
//             uint256 profit = tx4AmountOut - amountToPayback;
//             IERC20(tokenBorrowed).transfer(owner, profit);
//         }

//         //require(isProfitable, "Arbitrage Not profitable");

//         // payback loan
//         IERC20(tokenBorrowed).transfer(pair, amountToPayback);

//         console.log("");
//         console.log("BUSD Balance after pay back");
//         console.log(IERC20(BUSD).balanceOf(address(this)));
//     }

//     function isArbitrageProfitable(
//         uint256 amountAcquired,
//         uint256 amountToPayback
//     ) private pure returns (bool) {
//         return amountAcquired > amountToPayback;
//     }

//     function placeSwap(
//         address _tokenIn,
//         address _tokenOut,
//         uint256 _amountIn
//     ) private returns (uint256) {
//         address pair = IUniswapV2Factory(PANCAKE_FACTORY).getPair(
//             _tokenIn,
//             _tokenOut
//         );

//         require(pair != address(0), "pair doesn't exist");

//         address[] memory path = new address[](2);
//         path[0] = _tokenIn;
//         path[1] = _tokenOut;

//         IERC20(_tokenIn).approve(address(PANCAKE_ROUTER), MAX_INT);
//         IERC20(_tokenOut).approve(address(PANCAKE_ROUTER), MAX_INT);

//         uint256 expectedAmountOut = IUniswapV2Router01(PANCAKE_ROUTER)
//             .getAmountsOut(_amountIn, path)[1];

//         require(expectedAmountOut > 0, "Error getting amount out");

//         uint256 amountReceived = IUniswapV2Router01(PANCAKE_ROUTER)
//             .swapExactTokensForTokens(
//                 _amountIn,
//                 expectedAmountOut,
//                 path,
//                 address(this),
//                 deadline
//             )[1];

//         return amountReceived;
//     }

//     // fund swap contract
//     function fundFlashSwap(
//         address _owner,
//         address _token,
//         uint256 _amount
//     ) public {
//         IERC20(_token).transferFrom(_owner, address(this), _amount);
//     }

//     // get balance of contract
//     function getBalance(address token) public view returns (uint256) {
//         return IERC20(token).balanceOf(address(this));
//     }
// }
