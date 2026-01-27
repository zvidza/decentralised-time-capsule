import { expect } from "chai";
import { network } from "hardhat";

/**
 * @title TimeCapsule View Functions Tests
 * @notice Tests that verify read-only functions work correctly
 * @dev View functions cost no gas when called externally
 */
describe("TimeCapsule - View Functions", function () {
    let ethers, timeCapsule, owner, creator, beneficiary, otherUser;

    const sampleArweaveTxId = "myNameIsTadiwaAndIAmCreatingATimeCapsule";
    const sampleEncryptedKey = "encryptedKey2003";

    // Helper function to get latest block timestamp as BigInt
    async function getLatestTimestamp() {
        const block = await ethers.provider.getBlock("latest");
        return BigInt(block.timestamp);
    }

    // Helper function to expect a revert with custom error
    async function expectRevertCustomError(promise, errorName) {
        try {
            await promise;
            expect.fail("Expected transaction to revert");
        } catch (error) {
            expect(error.message).to.include(errorName);
        }
    }

    // Helper function to increase blockchain time
    async function increaseTimeTo(timestamp) {
        await ethers.provider.send("evm_setNextBlockTimestamp", [Number(timestamp)]);
        await ethers.provider.send("evm_mine", []);
    }

    beforeEach(async function () {
        const connection = await network.connect();
        ethers = connection.ethers;

        [owner, creator, beneficiary, otherUser] = await ethers.getSigners();

        const TimeCapsule = await ethers.getContractFactory("TimeCapsule");
        timeCapsule = await TimeCapsule.deploy();
        await timeCapsule.waitForDeployment();
    });

    // getCapsule test cases  
    describe("getCapsule", function () {
        it("Should return correct capsule data for valid ID", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey
                );

            const capsule = await timeCapsule.getCapsule(0);

            expect(capsule.id).to.equal(0n);
            expect(capsule.creator).to.equal(creator.address);
            expect(capsule.beneficiary).to.equal(beneficiary.address);
        });

        it("Should fail for non-existent capsule", async function () {
            await expectRevertCustomError(
                timeCapsule.getCapsule(999),
                "CapsuleDoesNotExist"
            );
        });

        it("Should allow anyone to read capsule data", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey
                );

            // Other user (not creator or beneficiary) can still read
            const capsule = await timeCapsule.connect(otherUser).getCapsule(0);
            expect(capsule.creator).to.equal(creator.address);
        });
    });

    // getTotalCapsules tets cases 
    describe("getTotalCapsules", function () {
        it("Should return 0 when no capsules created", async function () {
            expect(await timeCapsule.getTotalCapsules()).to.equal(0n);
        });

        it("Should return correct count after creating capsules", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            // Create 3 capsules
            for (let i = 0; i < 3; i++) {
                await timeCapsule
                    .connect(creator)
                    .createCapsule(
                        beneficiary.address,
                        unlockTime,
                        sampleArweaveTxId + i,
                        sampleEncryptedKey + i
                    );
            }

            expect(await timeCapsule.getTotalCapsules()).to.equal(3n);
        });

        it("Should not decrease when capsule is cancelled", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey
                );

            // Cancel the capsule
            await timeCapsule.connect(creator).cancelCapsule(0);

            // Count should still be 1
            expect(await timeCapsule.getTotalCapsules()).to.equal(1n);
        });
    });

    //getCreatedCapsules test cases 
    describe("getCreatedCapsules", function () {
        it("Should return empty array for address with no capsules", async function () {
            const capsules = await timeCapsule.getCreatedCapsules(otherUser.address);
            expect(capsules.length).to.equal(0);
        });

        it("Should return correct capsule IDs for creator", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            // Creator makes 2 capsules
            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey
                );

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    otherUser.address,
                    unlockTime,
                    "anotherArweaveId",
                    "anotherKey"
                );

            const capsules = await timeCapsule.getCreatedCapsules(creator.address);
            expect(capsules.length).to.equal(2);
            expect(capsules[0]).to.equal(0n);
            expect(capsules[1]).to.equal(1n);
        });

        it("Should track capsules separately for different creators", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            // Creator makes 1 capsule
            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey
                );

            // OtherUser makes 1 capsule
            await timeCapsule
                .connect(otherUser)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    "otherArweaveId",
                    "otherKey"
                );

            // Check each creator's list
            const creatorCapsules = await timeCapsule.getCreatedCapsules(creator.address);
            const otherUserCapsules = await timeCapsule.getCreatedCapsules(otherUser.address);

            expect(creatorCapsules.length).to.equal(1);
            expect(creatorCapsules[0]).to.equal(0n);

            expect(otherUserCapsules.length).to.equal(1);
            expect(otherUserCapsules[0]).to.equal(1n);
        });
    });

    // getBeneficiaryCapsules test cases
    describe("getBeneficiaryCapsules", function () {
        it("Should return empty array for address with no incoming capsules", async function () {
            const capsules = await timeCapsule.getBeneficiaryCapsules(otherUser.address);
            expect(capsules.length).to.equal(0);
        });

        it("Should return correct capsule IDs for beneficiary", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            // Two different creators send to same beneficiary
            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey
                );

            await timeCapsule
                .connect(otherUser)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    "anotherArweaveId",
                    "anotherKey"
                );

            const capsules = await timeCapsule.getBeneficiaryCapsules(beneficiary.address);
            expect(capsules.length).to.equal(2);
            expect(capsules[0]).to.equal(0n);
            expect(capsules[1]).to.equal(1n);
        });
    });

    // isCapsuleUnlocked test cases
    describe("isCapsuleUnlocked", function () {
        let unlockTime;

        beforeEach(async function () {
            unlockTime = (await getLatestTimestamp()) + 86400n; // 1 day from now

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey
                );
        });

        it("Should return false before unlock time", async function () {
            expect(await timeCapsule.isCapsuleUnlocked(0)).to.equal(false);
        });

        it("Should return true after unlock time", async function () {
            // Fast forward past unlock time
            await increaseTimeTo(unlockTime + 1n);

            expect(await timeCapsule.isCapsuleUnlocked(0)).to.equal(true);
        });

        it("Should return true at exact unlock time", async function () {
            // Fast forward to exact unlock time
            await increaseTimeTo(unlockTime);

            expect(await timeCapsule.isCapsuleUnlocked(0)).to.equal(true);
        });

        it("Should fail for non-existent capsule", async function () {
            await expectRevertCustomError(
                timeCapsule.isCapsuleUnlocked(999),
                "CapsuleDoesNotExist"
            );
        });

        it("Should return true even if capsule is cancelled", async function () {
            // Cancel the capsule
            await timeCapsule.connect(creator).cancelCapsule(0);

            // Fast forward past unlock time
            await increaseTimeTo(unlockTime + 1n);

            // Still returns true (unlocked based on time, not cancellation)
            expect(await timeCapsule.isCapsuleUnlocked(0)).to.equal(true);
        });
    });

    // getTimeRemaining test cases
    describe("getTimeRemaining", function () {
        let unlockTime;

        beforeEach(async function () {
            unlockTime = (await getLatestTimestamp()) + 86400n; // 1 day from now

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey
                );
        });

        it("Should return approximate time remaining", async function () {
            const remaining = await timeCapsule.getTimeRemaining(0);

            // Should be close to 1 day 
            expect(remaining).to.be.greaterThan(86390n);
            expect(remaining).to.be.lessThanOrEqual(86400n);
        });

        it("Should return 0 after unlock time", async function () {
            await increaseTimeTo(unlockTime + 100n);

            expect(await timeCapsule.getTimeRemaining(0)).to.equal(0n);
        });

        it("Should return 0 at exact unlock time", async function () {
            await increaseTimeTo(unlockTime);

            expect(await timeCapsule.getTimeRemaining(0)).to.equal(0n);
        });

        it("Should decrease as time passes", async function () {
            const remainingBefore = await timeCapsule.getTimeRemaining(0);

            // Move forward 1 hour (3600 seconds)
            const currentTime = await getLatestTimestamp();
            await increaseTimeTo(currentTime + 3600n);

            const remainingAfter = await timeCapsule.getTimeRemaining(0);

            // Should have decreased by approximately 1 hour
            expect(remainingBefore - remainingAfter).to.be.greaterThanOrEqual(3599n);
        });

        it("Should fail for non-existent capsule", async function () {
            await expectRevertCustomError(
                timeCapsule.getTimeRemaining(999),
                "CapsuleDoesNotExist"
            );
        });
    });

    // getCapsuleStatus test cases
    describe("getCapsuleStatus", function () {
        let unlockTime;

        beforeEach(async function () {
            unlockTime = (await getLatestTimestamp()) + 86400n; // 1 day from now

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey
                );
        });

        it("Should return LOCKED before unlock time", async function () {
            expect(await timeCapsule.getCapsuleStatus(0)).to.equal("Locked");
        });

        it("Should return UNLOCKED after unlock time", async function () {
            await increaseTimeTo(unlockTime + 1n);

            expect(await timeCapsule.getCapsuleStatus(0)).to.equal("Unlocked");
        });

        it("Should return CANCELLED for cancelled capsule", async function () {
            await timeCapsule.connect(creator).cancelCapsule(0);

            expect(await timeCapsule.getCapsuleStatus(0)).to.equal("Cancelled");
        });

        it("Should return CANCELLED even after unlock time if cancelled", async function () {
            // Cancel before unlock
            await timeCapsule.connect(creator).cancelCapsule(0);

            // Fast forward past unlock time
            await increaseTimeTo(unlockTime + 1n);

            // Status should still be CANCELLED (takes priority)
            expect(await timeCapsule.getCapsuleStatus(0)).to.equal("Cancelled");
        });

        it("Should fail for non-existent capsule", async function () {
            await expectRevertCustomError(
                timeCapsule.getCapsuleStatus(999),
                "CapsuleDoesNotExist"
            );
        });
    });
});
