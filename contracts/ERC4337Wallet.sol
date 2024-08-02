// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ERC4337Wallet {
    address public owner;
    address public entryPoint;

    constructor(address _entryPoint) {
        owner = msg.sender;
        entryPoint = _entryPoint;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function executeTransaction(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }

    function executeERC721Transaction(address token, address to, uint256 tokenId) external onlyOwner {
        IERC721(token).transferFrom(address(this), to, tokenId);
    }
}
