import { ethers, upgrades } from "hardhat";
async function main() {
  const [deployer] = await ethers.getSigners();
  const Agnostico = await ethers.getContractFactory("Agnostico");
  const AgnoCode = await ethers.getContractFactory("AgnoCode");

  let agnostico = await upgrades.deployProxy(Agnostico, [
    30,
    deployer.address,
    ethers.utils.parseEther("0.02"),
  ]); //30 -> devPct === 30%
  let agnocode = await upgrades.deployProxy(AgnoCode);
  agnostico = await agnostico.deployed();
  agnocode = await agnocode.deployed();

  await agnocode.setAgnostico(agnostico.address);
  await agnostico.setAgnoCode(agnocode.address);

  console.log("Agnostico deployed to:", agnostico.address);
  console.log("AgnoCode deployed to:", agnocode.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
