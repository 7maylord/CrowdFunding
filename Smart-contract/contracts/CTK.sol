// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CTK is ERC20, Ownable{

    event Burn(address indexed from, uint256 value);
    event Mint(address indexed to, uint256 value);
    constructor( uint256 _initialSupply) ERC20("CrowdToken", "CTK") Ownable(msg.sender) {
        _mint(msg.sender, _initialSupply * 10 ** uint8(decimals()));
    }

    function mint(address _to, uint256 _value) external returns(bool) {
        _mint(_to, _value);
        return true;
    }

    function burn(uint256 _value) public returns (bool success) {
        _burn(msg.sender, _value);
        emit Burn(msg.sender, _value);
        return true;
    }

}