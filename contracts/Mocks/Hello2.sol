// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Hello2 {
  string public name;
  
  function initialize(string calldata _name) external {
    name = _name;
  }
  function setName(string calldata _name) external {
    name = _name;
  }
}