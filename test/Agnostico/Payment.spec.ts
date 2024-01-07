/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract, utils } from 'ethers';
import { ethers } from 'hardhat';
import { deployAgnocode, deployAgnostico, mockBytecode, mockHelloABI, sampleContract, sampleContract2 } from '../utils';

describe('Agnostico V2 - Payment', function () {
  let agnostico: Contract;
  let agnocode: Contract;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let officer: SignerWithAddress;
  let dev1: SignerWithAddress;
  let dev2: SignerWithAddress;
  let codeHash: string;
  let tokenURI: string;

  const cost = utils.parseEther('1');
  const updatedDevPct = 35;
  before(async () => {
    [deployer, user, officer, dev1, dev2] = await ethers.getSigners();
    agnostico = await deployAgnostico(deployer);
    agnocode = await deployAgnocode(deployer);
    await agnocode.setAgnostico(agnostico.address);
    await agnostico.setAgnoCode(agnocode.address);

    // test conditions
    codeHash = utils.id(sampleContract);
    tokenURI = 'http://ipfs/data1';
    await agnostico.connect(dev1).claim(codeHash, tokenURI);
    await agnostico.connect(dev2).claim(utils.id(sampleContract2), 'http://ipfs/data2');
  });

  it('Should start with earning of 0 for all devs', async () => {
    const dev1Earnings = await agnostico.devEarnings(dev1.address);
    const dev2Earnings = await agnostico.devEarnings(dev2.address);
    const platformEarnings = await agnostico.devEarnings(officer.address);

    expect(dev1Earnings.available).eq(0);
    expect(dev1Earnings.withdrawn).eq(0);
    expect(dev2Earnings.available).eq(0);
    expect(dev2Earnings.withdrawn).eq(0);
    expect(platformEarnings.available).eq(0);
    expect(platformEarnings.withdrawn).eq(0);
  });

  it('Should fail if non-auth account attempts to change cost', async () => {
    await expect(agnostico.connect(user).setCost(cost)).reverted;
  });

  it('Should set cost of deployment', async () => {
    const before = await agnostico.cost();
    await agnostico.setCost(cost);
    const after = await agnostico.cost();

    expect(before).gt(0);
    expect(after).eq(cost);
    expect(after).gt(before);
  });

  it('Should have set dev percentage', async () => {
    const percentage = await agnostico.pctForDevs();
    expect(percentage).gt(0); // actual amount depends on the set amount
  });

  it('Should update set dev percentage', async () => {
    await agnostico.setDevPct(updatedDevPct);
    const after = await agnostico.pctForDevs();
    expect(after).eq(updatedDevPct);
  });

  it('Should fail if non-auth account attempts to set dev percentage', async () => {
    await expect(agnostico.connect(user).setDevPct(5)).reverted;
  });

  it('Should set feeCollector of deployment', async () => {
    const before = await agnostico.feeCollector();
    await agnostico.setFeeCollector(officer.address);
    const after = await agnostico.feeCollector();

    expect(before).eq(deployer.address);
    expect(after).eq(officer.address);
  });

  it('Should fail if non-auth account attempts to change feeCollector', async () => {
    await expect(agnostico.connect(user).setFeeCollector(officer.address)).reverted;
  });

  it('Should fail if attempt to deploy without paying fee', async () => {
    const before = await agnostico.codes(1);
    expect(before.implementation).eq(ethers.constants.AddressZero);
    expect(+before.used).eq(0);
    const initParameter = 'Test';
    const inter = new ethers.utils.Interface(mockHelloABI);
    const initCall = inter.encodeFunctionData('initialize', [initParameter]);
    await expect(agnostico.connect(user).deployContract(1, codeHash, mockBytecode, initCall, false)).revertedWith(
      'Send Correct Fee Amount',
    );
  });

  it('Should fail if attempt to DEPLOY without paying fee', async () => {
    const before = await agnostico.codes(0);
    expect(before.implementation).eq(ethers.constants.AddressZero);
    expect(+before.used).eq(0);
    const initParameter = 'Test';
    const inter = new ethers.utils.Interface(mockHelloABI);
    const initCall = inter.encodeFunctionData('initialize', [initParameter]);
    await expect(agnostico.connect(user).deployContract(1, codeHash, mockBytecode, initCall, false)).revertedWith(
      'Send Correct Fee Amount',
    );
  });

  it('Should fail if attempt to CLONE without paying fee', async () => {
    const before = await agnostico.codes(2);
    expect(+before.used).eq(0);
    const initParameter = 'Test';
    const inter = new ethers.utils.Interface(mockHelloABI);
    const initCall = inter.encodeFunctionData('initialize', [initParameter]);
    const d = await agnostico
      .connect(user)
      .deployContract(2, before.codeHash, mockBytecode, initCall, false, { value: cost });
    await d.wait();

    const dev1Earnings = await agnostico.devEarnings(dev1.address);
    const dev2Earnings = await agnostico.devEarnings(dev2.address);
    const platformEarnings = await agnostico.devEarnings(officer.address);

    await expect(agnostico.connect(user).deployClone(1, codeHash, initCall)).revertedWith('Send Correct Fee Amount');

    expect(dev1Earnings.available).eq(0);
    expect(dev2Earnings.available).eq(cost.div(100).mul(updatedDevPct));
    expect(platformEarnings.available).eq(cost.sub(cost.div(100).mul(updatedDevPct)));
  });

  it('Should DEPLOY if paying correct fee amount', async () => {
    const before = await agnostico.codes(1);
    const initParameter = 'Test';
    const inter = new ethers.utils.Interface(mockHelloABI);
    const initCall = inter.encodeFunctionData('initialize', [initParameter]);
    const d = await agnostico.connect(user).deployContract(1, codeHash, mockBytecode, initCall, false, { value: cost });
    const { events } = await d.wait();
    const deployEvent = events[0]['args'];
    const instance = new ethers.Contract(deployEvent['newContract'], mockHelloABI, user);
    const result = await instance.name();
    const after = await agnostico.codes(1);

    const dev1Earnings = await agnostico.devEarnings(dev1.address);
    const dev2Earnings = await agnostico.devEarnings(dev2.address);
    const platformEarnings = await agnostico.devEarnings(officer.address);

    expect(before.implementation).eq(ethers.constants.AddressZero);
    expect(before.used).eq(0);
    expect(deployEvent['codeId']).eq(1);
    expect(deployEvent['deployer']).eq(user.address);
    expect(result).eq(initParameter);
    expect(after.implementation).eq(deployEvent['newContract']);
    expect(after.used).eq(1);
    expect(dev1Earnings.available).eq(cost.div(100).mul(updatedDevPct));
    expect(dev2Earnings.available).eq(cost.div(100).mul(updatedDevPct));
    expect(platformEarnings.available).eq(cost.sub(cost.div(100).mul(updatedDevPct)).mul(2));
  });

  it('Should CLONE if paying correct fee amount', async () => {
    const codeHash = utils.id(sampleContract);
    const inter = new ethers.utils.Interface(mockHelloABI);
    const initParameter = 'Test Versions';
    const initCall = inter.encodeFunctionData('initialize', [initParameter]);
    const before = await agnostico.codes(1);
    const c = await agnostico.deployClone(1, codeHash, initCall, { value: cost });
    const clone = await c.wait();

    const to = clone['events'][0]['args']['newContract'];
    const instance = new ethers.Contract(to, mockHelloABI, deployer);
    const result = await instance.name();
    const after = await agnostico.codes(1);

    const dev1Earnings = await agnostico.devEarnings(dev1.address);
    const dev2Earnings = await agnostico.devEarnings(dev2.address);
    const platformEarnings = await agnostico.devEarnings(officer.address);

    expect(dev1Earnings.available).eq(cost.div(100).mul(updatedDevPct).mul(2));
    expect(dev2Earnings.available).eq(cost.div(100).mul(updatedDevPct));
    expect(platformEarnings.available).eq(cost.sub(cost.div(100).mul(updatedDevPct)).mul(3));

    expect(before.implementation).not.eq(ethers.constants.AddressZero);
    expect(before.used).eq(1);
    expect(result).eq(initParameter);
    expect(after.implementation).eq(before.implementation);
    expect(after.firstDeployer).eq(user.address);
    expect(after.used).eq(2);
  });

  it('Should fail if non-owner attempts to withdraw', async () => {
    await expect(agnostico.connect(user).withdrawFee(deployer.address, utils.parseEther('0.1'))).reverted;
  });

  it('Should allow devs and platform to withdraw their funds', async () => {
    const receiverBalB4 = await ethers.provider.getBalance(deployer.address);
    const agnosticoBalB4 = await ethers.provider.getBalance(agnostico.address);
    const earningB4 = await agnostico.devEarnings(dev1.address);
    const toWithdraw = earningB4.available.sub(earningB4.available.div(100).mul(50)); // withdrawing 50%
    await agnostico.connect(dev1).withdrawFee(deployer.address, toWithdraw);
    const agnosticoBalAfter = await ethers.provider.getBalance(agnostico.address);
    const receiverBalAfter = await ethers.provider.getBalance(deployer.address);
    const earningAfter = await agnostico.devEarnings(dev1.address);
    await expect(agnostico.connect(dev1).withdrawFee(deployer.address, agnosticoBalAfter)).revertedWith(
      'Request Exceeds Limit',
    );
    expect(agnosticoBalAfter).eq(agnosticoBalB4.sub(toWithdraw));
    expect(receiverBalAfter).eq(receiverBalB4.add(toWithdraw));
    expect(earningAfter.available).eq(earningB4.available.sub(toWithdraw));
    expect(earningB4.withdrawn).eq(0);
    expect(earningAfter.withdrawn).eq(toWithdraw);
  });

  it('Should allow the right holder of $CODE to change its beneficiary', async () => {
    const codeId = 1;
    const prevOwner = dev1.address;
    const newOwner = dev2.address;
    const newBeneficiary = user.address;
    const codeB4Transfer = await agnostico.codes(codeId);
    const ownerB4Transfer = await agnocode.ownerOf(codeId);
    const earningB4Transfer = await agnostico.devEarnings(codeB4Transfer.beneficiary);
    await agnocode.connect(dev1).transferFrom(prevOwner, newOwner, codeId);
    const codeAfterTransfer = await agnostico.codes(codeId);
    const ownerAfterTransfer = await agnocode.ownerOf(codeId);
    const earningAfterTransfer = await agnostico.devEarnings(codeAfterTransfer.beneficiary);
    await agnostico.connect(dev2).changeBeneficiary(newBeneficiary, codeId);
    const codeAfterChange = await agnostico.codes(codeId);
    const earningAfterChange = await agnostico.devEarnings(codeAfterChange.beneficiary);
    const prevOwnerEarning = await agnostico.devEarnings(prevOwner);

    const uri = await agnocode.tokenURI(2);
    console.log(uri);

    expect(codeB4Transfer.beneficiary).eq(codeAfterTransfer.beneficiary);
    expect(earningB4Transfer.available).eq(earningAfterTransfer.available);
    expect(earningAfterChange.available).eq(0);
    expect(prevOwnerEarning.available).eq(earningB4Transfer.available);
    expect(codeAfterChange.beneficiary).eq(newBeneficiary);
    expect(ownerB4Transfer).eq(prevOwner);
    expect(ownerAfterTransfer).eq(newOwner);
    await expect(agnostico.connect(dev1).changeBeneficiary(newOwner, codeId)).revertedWith('Unauthorized Request');
  });
});
