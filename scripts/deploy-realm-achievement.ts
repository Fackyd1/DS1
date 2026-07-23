import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("RealmAchievement");
  const contract = await Factory.deploy(deployer.address);
  await contract.waitForDeployment();

  console.log("RealmAchievement deployed:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
