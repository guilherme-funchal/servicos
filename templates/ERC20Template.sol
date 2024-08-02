// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract {{Name}} is ERC20, ERC20Burnable, Ownable {
    event MintAttempt(address indexed to, uint256 amount);
    event MintSuccess(address indexed to, uint256 amount);
    event MintFailure(address indexed to, uint256 amount, string reason);

    constructor(address initialOwner)
        ERC20("{{Name}}", "{{Symbol}}")
        Ownable(initialOwner)
    {
        _mint(msg.sender, 100 * 10 ** decimals());
    }

    function burnFrom(address account, uint256 amount) public override onlyOwner {
        _burn(account, amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        _mint(to, amount);
    }
}