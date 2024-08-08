// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Token is ERC20, ERC20Burnable {
    constructor(address initialOwner)
        ERC20(name, symbol)
        Ownable(initialOwner)
    {
        _mint(msg.sender, 0 * 10 ** decimals());
    }
    function burnFrom(address account, uint256 amount) public override onlyOwner {
        _burn(account, amount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
