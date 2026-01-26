import { expect } from "chai";
import { network } from "hardhat";

describe("TimeCapsule - Deployment", function () {
  let ethers, timeCapsule, owner;

  /**
   * Deploying fresh contract before each test
   */
  beforeEach(async function () {
    // Connect to network and get ethers
    const connection = await network.connect();
    ethers = connection.ethers;

    // Getting first signer
    [owner] = await ethers.getSigners();

    // Get contract factory and deploy
    const TimeCapsule = await ethers.getContractFactory("TimeCapsule");
    timeCapsule = await TimeCapsule.deploy();
    await timeCapsule.waitForDeployment();
  });

  it("Should set the deployer as owner", async function () {
    //Ownable contract should set msg.sender as owner
    expect(await timeCapsule.owner()).to.equal(owner.address);
  });

  it("Should start with zero capsules", async function () {
    // No capsules created yet
    expect(await timeCapsule.getTotalCapsules()).to.equal(0n);
  });

  it("Should not be paused on deployment", async function () {
    // Contract should be active when deployed
    expect(await timeCapsule.paused()).to.equal(false);
  });
});
