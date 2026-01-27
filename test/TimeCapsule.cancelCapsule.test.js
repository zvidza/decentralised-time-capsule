import { expect } from "chai";
import { network } from "hardhat";

/**
 * @title TimeCapsule cancelCapsule Tests
 * @notice Tests that verify capsule cancellation works correctly
 */
describe("TimeCapsule - cancelCapsule", function () {
    let ethers, timeCapsule, owner, creator, beneficiary, otherUser;

    const sampleArweaveTxId = "myNameIsTadiwaAndIAmCreatingATimeCapsule";
    const sampleEncryptedKey = "encryptedKey2003";

    // Helper function to get latest block timestamp as BigInt
    async function getLatestTimestamp() {
        const block = await ethers.provider.getBlock("latest");
        return BigInt(block.timestamp);
    }

    // Helper function to check if transaction emits an event
    async function expectEvent(tx, eventName) {
        const receipt = await tx.wait();
        const event = receipt.logs.find(
            (log) => log.fragment && log.fragment.name === eventName,
        );
        expect(event, `Expected event ${eventName} to be emitted`).to.not.be
            .undefined;
        return event;
    }

    // Helper function to expect a revert with message
    async function expectRevert(promise, expectedMessage) {
        try {
            await promise;
            expect.fail("Expected transaction to revert");
        } catch (error) {
            const errorString =
                error.message + (error.reason || "") + (error.data || "");
            expect(
                errorString.includes(expectedMessage),
                `Expected error to include "${expectedMessage}" but got: ${error.message}`,
            ).to.be.true;
        }
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
        await ethers.provider.send("evm_setNextBlockTimestamp", [
            Number(timestamp),
        ]);
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

    // SUCCESS CASES
    describe("Success Cases", function () {
        let unlockTime;

        beforeEach(async function () {
            // Creating capsule before each cancel test
            unlockTime = (await getLatestTimestamp()) + 86400n; // 1 day from now

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );
        });

        it("Should allow creator to cancel before unlock time", async function () {
            const tx = await timeCapsule.connect(creator).cancelCapsule(0n);

            // Checking event was emitted
            await expectEvent(tx, "CapsuleCancelled");

            // Verifying capsule is cancelled
            const capsule = await timeCapsule.getCapsule(0);
            expect(capsule.isCancelled).to.equal(true);
        });

        it("Should keep other capsule data unchanged after cancel", async function () {
            await timeCapsule.connect(creator).cancelCapsule(0n);

            const capsule = await timeCapsule.getCapsule(0);
            expect(capsule.id).to.equal(0n);
            expect(capsule.creator).to.equal(creator.address);
            expect(capsule.beneficiary).to.equal(beneficiary.address);
            expect(capsule.unlockTimestamp).to.equal(unlockTime);
            expect(capsule.arweaveTxId).to.equal(sampleArweaveTxId);
            expect(capsule.encryptedKey).to.equal(sampleEncryptedKey);
            expect(capsule.isCancelled).to.equal(true);
        });
    });

    //ACCESS CONTROL FAILURES
    describe("Access Control Failures", function () {
        let unlockTime;

        beforeEach(async function () {
            unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );
        });

        it("Should fail if caller is not the creator", async function () {
            await expectRevertCustomError(
                timeCapsule.connect(otherUser).cancelCapsule(0n),
                "NotCapsuleCreator",
            );
        });

        it("Should fail if beneficiary tries to cancel", async function () {
            await expectRevertCustomError(
                timeCapsule.connect(beneficiary).cancelCapsule(0n),
                "NotCapsuleCreator",
            );
        });

        it("Should fail if owner (non-creator) tries to cancel", async function () {
            // Owner deployed contract but didn't create capsule
            await expectRevertCustomError(
                timeCapsule.connect(owner).cancelCapsule(0),
                "NotCapsuleCreator",
            );
        });
    });

    //CAPSULE STATE FAILURES
    describe("Capsule State Failures", function () {
        it("Should fail if capsule does not exist", async function () {
            await expectRevertCustomError(
                timeCapsule.connect(creator).cancelCapsule(999),
                "CapsuleDoesNotExist",
            );
        });

        it("Should fail if capsule is already cancelled", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            // Cancel once
            await timeCapsule.connect(creator).cancelCapsule(0);

            // Trying to cancel again
            await expectRevertCustomError(
                timeCapsule.connect(creator).cancelCapsule(0),
                "CapsuleAlreadyCancelled",
            );
        });
    });

    // TIME-LOCK FAILURS
    describe("Time-Lock Failures", function () {
        it("Should fail if unlock time has passed", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n; // 1 day

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            // Fast forward time past unlock
            await increaseTimeTo(unlockTime + 1n);

            await expectRevertCustomError(
                timeCapsule.connect(creator).cancelCapsule(0),
                "CannotCancelAfterUnlock",
            );
        });

        it("Should fail if unlock time is exactly reached", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            // Fast forward to exact unlock time
            await increaseTimeTo(unlockTime);

            await expectRevertCustomError(
                timeCapsule.connect(creator).cancelCapsule(0),
                "CannotCancelAfterUnlock",
            );
        });

        it("Should succeed 1 second before unlock time", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            // Fast forward to 1 second before unlock
            await increaseTimeTo(unlockTime - 2n);

            const tx = await timeCapsule.connect(creator).cancelCapsule(0);
            await expectEvent(tx, "CapsuleCancelled");
        });
    });

    // PAUSABLE BEHAVIOUR
    describe("Pausable Behaviour", function () {
        beforeEach(async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );
        });

        it("Should fail when contract is paused", async function () {
            await timeCapsule.connect(owner).pause();

            await expectRevertCustomError(
                timeCapsule.connect(creator).cancelCapsule(0),
                "EnforcedPause",
            );
        });

        it("Should work after contract is unpaused", async function () {
            // Pause then unpause
            await timeCapsule.connect(owner).pause();
            await timeCapsule.connect(owner).unpause();

            const tx = await timeCapsule.connect(creator).cancelCapsule(0);
            await expectEvent(tx, "CapsuleCancelled");
        });
    });
});
