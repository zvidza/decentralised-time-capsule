import { expect } from "chai";
import { network } from "hardhat";

describe("TimeCapsule - createCapsule", function () {
    let ethers, timeCapsule, owner, creator, beneficiary;

    const sampleArweaveTxId = "myNameIsTadiwaAndIAmCreatingATimeCapsule";
    const sampleEncryptedKey = "encryptedKey2003";

    async function getLatestTimestamp() {
        const block = await ethers.provider.getBlock("latest");
        return BigInt(block.timestamp);
    }

    async function expectEvent(tx, eventName) {
        const receipt = await tx.wait();
        const event = receipt.logs.find(
            (log) => log.fragment && log.fragment.name === eventName,
        );

        expect(event, `Expected event ${eventName} to be emitted`).to.not.be
            .undefined;
        return event;
    }

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

    async function expectRevertCustomError(promise, errorName) {
        try {
            await promise;
            expect.fail("Expected transaction to revert");
        } catch (error) {
            expect(error.message).to.include(errorName);
        }
    }

    beforeEach(async function () {
        const connection = await network.connect();
        ethers = connection.ethers;

        [owner, creator, beneficiary] = await ethers.getSigners();

        const TimeCapsule = await ethers.getContractFactory("TimeCapsule");
        timeCapsule = await TimeCapsule.deploy();
        await timeCapsule.waitForDeployment();
    });

    describe("Success Cases", function () {
        it("Should create a capsule successfully with valid inputs", async function () {
            const unlockTimestamp = (await getLatestTimestamp()) + 3600n; // 1 hr

            // Creating capsule
            const tx = await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTimestamp,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            // Check event was emitted
            await expectEvent(tx, "CapsuleCreated");

            // verifying total capsules count
            expect(await timeCapsule.getTotalCapsules()).to.equal(1n);
        });

        it("Should store correct capsule data when created", async function () {
            const unlockTimestamp = (await getLatestTimestamp()) + 3600n; // 1 hr

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTimestamp,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            const capsule = await timeCapsule.getCapsule(0);

            expect(capsule.id).to.equal(0n);
            expect(capsule.creator).to.equal(creator.address);
            expect(capsule.beneficiary).to.equal(beneficiary.address);
            expect(capsule.unlockTimestamp).to.equal(unlockTimestamp);
            expect(capsule.arweaveTxId).to.equal(sampleArweaveTxId);
            expect(capsule.encryptedKey).to.equal(sampleEncryptedKey);
            expect(capsule.isCancelled).to.equal(false);
        });

        it("Should track capsule in creator's list", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            // Check creator capsule list
            const createdCapsules = await timeCapsule.getCreatedCapsules(
                creator.address,
            );
            expect(createdCapsules.length).to.equal(1);
            expect(createdCapsules[0]).to.equal(0n);
        });

        it("Should track capsule in beneficiary's list", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            // Check beneficiary's capsule list
            const beneficiaryCapsules = await timeCapsule.getBeneficiaryCapsules(
                beneficiary.address,
            );
            expect(beneficiaryCapsules.length).to.equal(1);
            expect(beneficiaryCapsules[0]).to.equal(0n);
        });

        it("Should return the correct capsule ID", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            // Create first capsule
            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            // Create second capsule
            await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    "anotherArweaveId",
                    "anotherEncryptedKey",
                );

            // Verify total count
            expect(await timeCapsule.getTotalCapsules()).to.equal(2n);

            // Verifying IDs are sequential
            const capsule0 = await timeCapsule.getCapsule(0);
            const capsule1 = await timeCapsule.getCapsule(1);
            expect(capsule0.id).to.equal(0n);
            expect(capsule1.id).to.equal(1n);
        });

        it("Should allow creator to be their own beneficiary", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            // Creator sending capsule to themselves
            const tx = await timeCapsule.connect(creator).createCapsule(
                creator.address, // Self as beneficiary
                unlockTime,
                sampleArweaveTxId,
                sampleEncryptedKey,
            );

            await expectEvent(tx, "CapsuleCreated");

            const capsule = await timeCapsule.getCapsule(0);
            expect(capsule.creator).to.equal(creator.address);
            expect(capsule.beneficiary).to.equal(creator.address);
        });
    });

    // VALIDATION FAILURES
    describe("Validation Failures", function () {
        it("Should fail if unlock time is in the past", async function () {
            const pastTime = (await getLatestTimestamp()) - 100n; // 100 seconds ago

            await expectRevert(
                timeCapsule
                    .connect(creator)
                    .createCapsule(
                        beneficiary.address,
                        pastTime,
                        sampleArweaveTxId,
                        sampleEncryptedKey,
                    ),
                "Unlock time should sometime be in the future",
            );
        });

        it("Should fail if unlock time is current time", async function () {
            const currentTime = await getLatestTimestamp();

            await expectRevert(
                timeCapsule
                    .connect(creator)
                    .createCapsule(
                        beneficiary.address,
                        currentTime,
                        sampleArweaveTxId,
                        sampleEncryptedKey,
                    ),
                "Unlock time should sometime be in the future",
            );
        });

        it("Should fail if beneficiary is zero address", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await expectRevert(
                timeCapsule.connect(creator).createCapsule(
                    ethers.ZeroAddress, // Invalid address
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                ),
                "Beneficiary cannot be the zero address",
            );
        });

        it("Should fail if Arweave ID is empty", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await expectRevert(
                timeCapsule.connect(creator).createCapsule(
                    beneficiary.address,
                    unlockTime,
                    "", // Empty Arweave ID
                    sampleEncryptedKey,
                ),
                "Arweave ID cannot be empty",
            );
        });

        it("Should fail if encrypted key is empty", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            await expectRevert(
                timeCapsule.connect(creator).createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    "", // Empty
                ),
                "Encrypted key cannot be empty",
            );
        });
    });

    //PAUSABLE
    describe("Pausable Behaviour", function () {
        it("Should fail when contract is paused", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            // Owner pauses contract
            await timeCapsule.connect(owner).pause();

            await expectRevertCustomError(
                timeCapsule
                    .connect(creator)
                    .createCapsule(
                        beneficiary.address,
                        unlockTime,
                        sampleArweaveTxId,
                        sampleEncryptedKey,
                    ),
                "EnforcedPause",
            );
        });

        it("Should work after contract is unpaused", async function () {
            const unlockTime = (await getLatestTimestamp()) + 86400n;

            // Pause then unpause
            await timeCapsule.connect(owner).pause();
            await timeCapsule.connect(owner).unpause();

            const tx = await timeCapsule
                .connect(creator)
                .createCapsule(
                    beneficiary.address,
                    unlockTime,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                );

            await expectEvent(tx, "CapsuleCreated");
        });
    });
});
