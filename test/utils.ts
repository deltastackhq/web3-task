import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { abi as agnosticoABI } from "../artifacts/contracts/Agnostico/Agnostico.sol/Agnostico.json";
import { abi as agnocodeABI } from "../artifacts/contracts/Agnocode/AgnoCode.sol/AgnoCode.json";
import {
  abi as mockHelloABI,
  bytecode as mockBytecode,
} from "../artifacts/contracts/Mocks/Hello.sol/Hello.json";
import {
  abi as mockHello2ABI,
  bytecode as mock2Bytecode,
} from "../artifacts/contracts/Mocks/Hello2.sol/Hello2.json";
import {
  abi as fullContractABI,
  bytecode as fullContractBytecode,
} from "../artifacts/contracts/Mocks/Hello.sol/FullContract.json";

export const deployAgnostico = async (deployer: SignerWithAddress) => {
  const Agnostico = await ethers.getContractFactory("Agnostico");

  const agnostico = await upgrades.deployProxy(Agnostico, [
    30,
    deployer.address,
    ethers.utils.parseEther("0.01"),
  ]); // 30 -> devPct === 30%
  await agnostico.deployed();

  return new ethers.Contract(agnostico.address, agnosticoABI, deployer);
};

export const deployAgnocode = async (deployer: SignerWithAddress) => {
  const Agnocode = await ethers.getContractFactory("AgnoCode");

  const agnostico = await upgrades.deployProxy(Agnocode);
  await agnostico.deployed();

  return new ethers.Contract(agnostico.address, agnocodeABI, deployer);
};

export const fullContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract FullContract {
  string internal constant NAME = "Something Fixed";

  function showName() external pure returns (string memory name) {
      return NAME;
  }
}
`;
export const sampleContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Hello {
  string public name;
  
  function initialize(string calldata _name) external {
    name = _name;
  }
}
`;
export const sampleContract2 = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Hello {
  string public name;
  
  function initialize(string calldata _name) external {
    name = _name;
  }
  function set(string calldata _name) external {
    name = _name;
  }
}
`;

export {
  mockHelloABI,
  mockBytecode,
  mockHello2ABI,
  mock2Bytecode,
  fullContractABI,
  fullContractBytecode,
};
