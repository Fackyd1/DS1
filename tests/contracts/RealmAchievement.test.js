const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealmAchievement", function () {
  it("mints an achievement NFT once per player+achievement pair", async function () {
    const [owner, player] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("RealmAchievement");
    const contract = await Factory.deploy(owner.address);
    await contract.waitForDeployment();

    const tokenUri = "ipfs://realm-builder";
    const achievement = "REALM_BUILDER";

    const tx = await contract.mintAchievement(player.address, tokenUri, achievement);
    await tx.wait();

    expect(await contract.ownerOf(1n)).to.equal(player.address);
    expect(await contract.tokenURI(1n)).to.equal(tokenUri);

    let failed = false;
    try {
      await contract.mintAchievement(player.address, tokenUri, achievement);
    } catch (error) {
      failed = String(error).includes("Achievement already minted for player");
    }

    expect(failed).to.equal(true);
  });
});
