// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./libraries/SafeERC20.sol";
import "hardhat/console.sol";

interface IDODO {
    function flashLoan(
        uint256 baseAmount,
        uint256 quoteAmount,
        address assetTo,
        bytes calldata data
    ) external;

    function _BASE_TOKEN_() external view returns (address);
}

contract Arabitror {
    using SafeERC20 for IERC20;

    // trade variables
    uint256 private deadline = block.timestamp + 1 days;
    uint256 private constant MAX_INT =
        115792089237316195423570985008687907853269984665640564039457584007913129639935;

    // Initiate arbitrage
    function startArbitrage(
        address flashLoanPool, //You will make a flashloan from this DODOV2 pool
        uint256 loanAmount,
        address loanToken,
        address swapToken
    ) external {
        // if profit > 0 then transfer to wallet
        console.log("");
        console.log("WETH balance of account before swap");
        console.log(IERC20(loanToken).balanceOf(address(this)));

        startFlashLoan(flashLoanPool, loanAmount, loanToken, swapToken);
    }

    function startFlashLoan(
        address flashLoanPool,
        uint256 loanAmount,
        address loanToken,
        address swapToken
    ) internal {
        bytes memory data = abi.encode(
            flashLoanPool,
            loanToken,
            swapToken,
            loanAmount
        );
        address flashLoanBase = IDODO(flashLoanPool)._BASE_TOKEN_();
        if (flashLoanBase == loanToken) {
            IDODO(flashLoanPool).flashLoan(loanAmount, 0, address(this), data);
        } else {
            IDODO(flashLoanPool).flashLoan(0, loanAmount, address(this), data);
        }
    }

    //Note: CallBack function executed by DODOV2(DVM) flashLoan pool
    function DVMFlashLoanCall(
        address sender,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata data
    ) external {
        _flashLoanCallBack(sender, baseAmount, quoteAmount, data);
    }

    //Note: CallBack function executed by DODOV2(DPP) flashLoan pool
    function DPPFlashLoanCall(
        address sender,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata data
    ) external {
        _flashLoanCallBack(sender, baseAmount, quoteAmount, data);
    }

    //Note: CallBack function executed by DODOV2(DSP) flashLoan pool
    function DSPFlashLoanCall(
        address sender,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata data
    ) external {
        _flashLoanCallBack(sender, baseAmount, quoteAmount, data);
    }

    function _flashLoanCallBack(
        address sender,
        uint256,
        uint256,
        bytes calldata data
    ) internal {
        (
            address flashLoanPool,
            address loanToken,
            address swapToken,
            uint256 loanAmount
        ) = abi.decode(data, (address, address, address, uint256));

        require(
            sender == address(this) && msg.sender == flashLoanPool,
            "HANDLE_FLASH_NENIED"
        );

        //Note: Realize your own logic using the token from flashLoan pool.
        // Use the 1inch router for swaps
        makeSwap(loanToken, swapToken, loanAmount);

        // Make sure we have profits including gas fees and loan fees

        // if profit > 0 then transfer to wallet
        console.log("");
        console.log("WETH balance of account during swap");
        console.log(IERC20(loanToken).balanceOf(address(this)));
        //Return funds
        IERC20(loanToken).transfer(flashLoanPool, loanAmount);

        console.log("");
        console.log("WETH balance of account after swap");
        console.log(IERC20(loanToken).balanceOf(address(this)));
    }

    function makeSwap(
        address loanToken,
        address swapToken,
        uint256 amount
    ) private {
        // approve tokens
        // IERC20(loanToken).approve(address(ROUTER), MAX_INT);
        //  IERC20(swapToken).approve(address(ROUTER), MAX_INT);
        // 1inch logic
    }

    function getBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getAddress() public view returns (address) {
        return address(this);
    }
}
