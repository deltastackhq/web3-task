import { ethers, upgrades } from "hardhat";
async function main() {
  // const [deployer] = await ethers.getSigners()
  const agnocode = await ethers.getContractAt("AgnoCode", "0xc5954226bAF0b6CC7169A481b43B6B0a86d26E28");
  // const agnostico = await ethers.getContractAt("Agnostico", "0xF4Ab9884cc5dBe0d596725Fb092B726B5a225641");

  // let agnocode = await upgrades.upgradeProxy("0xF587eA4206E23A10Dbc45C7d056Be12625ACd706", AgnoCode);
  // let agnostico = await upgrades.upgradeProxy("0xF4Ab9884cc5dBe0d596725Fb092B726B5a225641", Agnostico);

  // agnocode = await agnocode.deployed();
  // agnostico = await agnostico.deployed();

  // await agnostico.setCost(ethers.utils.parseEther("0.01"))
  await agnocode.fixURI(1, "https://ipfs.io/ipfs/bafybeigw4rfpp6xygnjcrx7unygww34sxubfwbcf3rteqs2xjutdubr7k4/PiggyBank.json")



  console.log('done')
  // console.log("Agnostico deployed to:", agnostico.address);
  // console.log("AgnoCode deployed to:", agnocode.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});







// upgrades.deployProxy(Box, [42])