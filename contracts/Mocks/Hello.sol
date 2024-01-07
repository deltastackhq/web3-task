// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Hello {
    string public name;

    function initialize(string calldata _name) external {
        name = _name;
    }
}

contract FullContract {
    string internal constant NAME = "Something Fixed";

    function showName() external pure returns (string memory name) {
        return NAME;
    }
}