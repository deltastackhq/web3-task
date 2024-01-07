/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, utils } from "ethers";
import { ethers } from "hardhat";
import { deployAgnocode, deployAgnostico, sampleContract } from "../utils";

describe("Agnostico V2 - Claim Code", () => {
  let agnostico: Contract;
  let deployer: SignerWithAddress;
  let agnocode: Contract;
  before(async () => {
    [deployer] = await ethers.getSigners();
    agnostico = await deployAgnostico(deployer);
    agnocode = await deployAgnocode(deployer);
    await agnocode.setAgnostico(agnostico.address);
    await agnostico.setAgnoCode(agnocode.address);
  });

  it("Should claim a code for a user", async () => {
    const tokenURI = 'http://ipfs/data'
    const codeHash = utils.id(sampleContract);
    await agnostico.claim(codeHash, tokenURI);

    const token = await agnocode.tokenURI(1);
    const code = await agnostico.codes(1);
    expect(token).eq(tokenURI);
    expect(code.codeHash).eq(codeHash);
    expect(code.claimedBy).eq(deployer.address)
  });

  it("Should revert when previously claimed", async () => {
    const codeHash = utils.id(sampleContract);
    const tokenURI1 = 'http://ipfs/data1';
    await expect(agnostico.claim(codeHash, tokenURI1)).revertedWith("Claimed!")
    const total = await agnocode.totalSupply()
    expect(+total).eq(1)
  });
});
