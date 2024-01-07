import { ethers, upgrades } from "hardhat";
async function main() {
  // const [deployer] = await ethers.getSigners()
  // const AgnoCode = await ethers.getContractFactory("AgnoCode");
  const Agnostico = await ethers.getContractFactory("Agnostico");

  // let agnocode = await upgrades.upgradeProxy("0xF587eA4206E23A10Dbc45C7d056Be12625ACd706", AgnoCode);
  let agnostico = await upgrades.upgradeProxy("0xCfd315A844d5368c33857188Aa7F7A12a6313933", Agnostico);

  // agnocode = await agnocode.deployed();
  agnostico = await agnostico.deployed();

  console.log("Agnostico deployed to:", agnostico.address);
  // console.log("AgnoCode deployed to:", agnocode.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});







// upgrades.deployProxy(Box, [42])