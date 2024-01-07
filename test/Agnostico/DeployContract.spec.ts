/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract, utils } from 'ethers';
import { ethers } from 'hardhat';
import {
  deployAgnocode,
  deployAgnostico,
  mockBytecode,
  mockHelloABI,
  sampleContract,
  fullContract,
  fullContractABI,
  fullContractBytecode,
} from '../utils';

describe('Agnostico V2 - Deploy Contract', function () {
  let agnostico: Contract;
  let agnocode: Contract;
  let deployer: SignerWithAddress;
  this.beforeEach(async () => {
    [deployer] = await ethers.getSigners();
    agnostico = await deployAgnostico(deployer);
    agnocode = await deployAgnocode(deployer);
    await agnocode.setAgnostico(agnostico.address);
    await agnostico.setAgnoCode(agnocode.address);
  });

  it('Should deploy a contract', async () => {
    const codeHash = utils.id(sampleContract);
    const tokenURI1 = 'http://ipfs/data1';
    await agnostico.claim(codeHash, tokenURI1);
    const before = await agnostico.codes(1);

    const initParameter = 'Test';
    const inter = new ethers.utils.Interface(mockHelloABI);
    const initCall = inter.encodeFunctionData('initialize', [initParameter]);
    const cost = await agnostico.cost();
    const d = await agnostico.deployContract(1, codeHash, mockBytecode, initCall, false, { value: cost });
    const depl = await d.wait();
    const to = depl['events'][0]['args']['newContract'];
    const instance = new ethers.Contract(to, mockHelloABI, deployer);
    const result = await instance.name();
    const after = await agnostico.codes(1);

    expect(before.implementation).eq(ethers.constants.AddressZero);
    expect(+before.used).eq(0);
    expect(result).eq(initParameter);
    expect(after.implementation).eq(to);
    expect(after.firstDeployer).eq(deployer.address);
    expect(+after.used).eq(1);
  });

  it('should clone correctly', async () => {
    const codeHash = utils.id(sampleContract);
    const inter = new ethers.utils.Interface(mockHelloABI);
    const initParameter = 'Test Versions';
    const initCall = inter.encodeFunctionData('initialize', [initParameter]);
    const before = await agnostico.codes(1);
    const cost = await agnostico.cost();

    const c = await agnostico.deployClone(1, codeHash, initCall, { value: cost });
    const clone = await c.wait();

    const to = clone['events'][0]['args']['newContract'];
    const instance = new ethers.Contract(to, mockHelloABI, deployer);
    const result = await instance.name();
    const after = await agnostico.codes(1);
    expect(before.implementation).not.eq(ethers.constants.AddressZero);
    expect(+before.used).eq(1);
    expect(result).eq(initParameter);
    expect(+after.used).eq(2);
  });

  it.only('should clone correctly no init, no constructor', async () => {
    const codeHash = utils.id(fullContract);
    const tokenURI1 = 'http://ipfs/full-contract.json';
    await agnostico.claim(codeHash, tokenURI1);

    // const inter = new ethers.utils.Interface(mockHelloABI);
    // const initParameter = "Test Versions";
    // const initCall = inter.encodeFunctionData("initialize", [initParameter]);
    const cost = await agnostico.cost();

    const d = await agnostico.deployContract(1, codeHash, fullContractBytecode, [], false, { value: cost });

    await d.wait();

    const c = await agnostico.deployClone(1, codeHash, [], { value: cost });
    const clone = await c.wait();

    const deployed = clone['events'][0]['args']['newContract'];
    const instance = new ethers.Contract(deployed, fullContractABI, deployer);
    const name = await instance.showName();
    // const result = await instance.name();
    // const after = await agnostico.codes(1);
    // expect(before.implementation).not.eq(ethers.constants.AddressZero)
    // expect(+before.used).eq(1)
    // // expect(result).eq(initParameter);
    // expect(+after.used).eq(2);
  });
});
