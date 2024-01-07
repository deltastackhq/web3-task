/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, utils } from "ethers";
import { ethers } from "hardhat";
import { deployAgnostico } from "../utils";

describe("Agnostico V2 - Deployment", function () {
  let agnostico: Contract;
  let deployer: SignerWithAddress;
  before(async () => {
    [deployer] = await ethers.getSigners();
    agnostico = await deployAgnostico(deployer);
  });

  it("Should have deployed", async () => {
    expect(agnostico.address).not.eq(ethers.constants.AddressZero);
    expect(utils.isAddress(agnostico.address)).eq(true)
  });

  it("Should have assigned the default role to the deployer", async () => {
    const defaultAdmin = await agnostico.DEFAULT_ADMIN_ROLE();
    expect(await agnostico.hasRole(defaultAdmin, deployer.address)).eq(true);
  });
});
