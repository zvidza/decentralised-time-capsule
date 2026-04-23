import { expect } from "chai";
import { network } from "hardhat";

describe("TimeCapsule - Admin Functions", function () {
    let ethers, timeCapsule, owner, creator, beneficiary, randomUser;

    const sampleArweaveTxId = "IHopeIFinishMyDissertation";
    const sampleEncryptedKey = "encryptedKey1705";

    //helper 
    async function getLatestTimestamp(){
        const blockNum = await ethers.provider.getBlock("latest");
        return BigInt(blockNum.timestamp);
    }

    // helper 
    async function expectEvent(tx, eventName) {
        const receipt = await tx.wait();
        const event = receipt.logs.find(
            (log) => log.fragment && log.fragment.name === eventName
        );
        expect(event, 'Expected event ${eventName} to be emitted').to.not.be.undefined;
        return event;
    }

    // Helper function 
    async function expectRevertCustomError(promise,errorName){
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
        [owner, creator, beneficiary, randomUser] = await ethers.getSigners();

        const TimeCapsule = await ethers.getContractFactory("TimeCapsule");
        timeCapsule = await TimeCapsule.deploy();
        await timeCapsule.waitForDeployment();
    });

    // Ownership tests
    describe("ownership", function (){
        it("Shoulds set deployer as owner", async function (){
            expect(await timeCapsule.owner()).to.equal(owner.address);
        });

        it("Should allow owner to transfer ownership", async function (){
            await timeCapsule.connect(owner).transferOwnership(randomUser.address);

            expect(await timeCapsule.owner()).to.equal(randomUser.address);
        });

        it ("Should fail is non-owner tries to transfer ownership", async function (){
            await expectRevertCustomError(
                timeCapsule.connect(randomUser).transferOwnership(creator.address),
                "OwnableUnauthorizedAccount"
            );
        });
        it ("Should allow owner to renounce ownership", async function (){
            await timeCapsule.connect(owner).renounceOwnership();
            //owner is a zero address
            expect(await timeCapsule.owner()).to.equal(ethers.ZeroAddress);
        });
    });

    //Pause test cases
    describe("pausable", function (){
        it("Should allow owner to pause contract", async function (){
            await timeCapsule.connect(owner).pause();
            expect(await timeCapsule.paused()).to.equal(true);
        });

        it("Should emit Pasued event when pasued",async function (){
            const tx = await timeCapsule.connect(owner).pause();
            await expectEvent(tx,"Paused");
        });

        it ("should fail if non-owner tries to pause", async function (){
            await expectRevertCustomError(
                timeCapsule.connect(randomUser).pause(),
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should fail if creator tries to pause",async function (){
            await expectRevertCustomError(
                timeCapsule.connect(creator).pause(),
                "OwnableUnauthorizedAccount"
            );
        });

        it ("Should fail if already paused", async function (){
            await timeCapsule.connect(owner).pause();
            await expectRevertCustomError(
                timeCapsule.connect(owner).pause(),
                "EnforcedPause"
            );
        });
    });

    // Unpause test cases
    describe("unpausable", function (){
        beforeEach(async function (){
            //pausing each contract before testing
            await timeCapsule.connect(owner).pause();
        });

        it("Should allow owner to unpause contract", async function (){
            await timeCapsule.connect(owner).unpause();
            expect(await timeCapsule.paused()).to.equal(false);
        });

        it("Should emit Unpaused event when unpaused",async function (){
            const tx = await timeCapsule.connect(owner).unpause();
            await expectEvent(tx,"Unpaused");
        });

        it ("should fail if non-owner tries to unpause", async function (){
            await expectRevertCustomError(
                timeCapsule.connect(randomUser).unpause(),
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should fail if not paused",async function (){
            //unpausing first 
            await timeCapsule.connect(owner).unpause();
            await expectRevertCustomError(
                // uppausing again
                timeCapsule.connect(owner).unpause(),
                "ExpectedPause"
            );
        });
    });

    // Pausable effects tests
    describe("Pausable effects", function (){
        it("Should block createCapsule when paused", async function (){
            const unlockTimestamp = await getLatestTimestamp() + 86400n; // 24 hrs

            await timeCapsule.connect(owner).pause();

            await expectRevertCustomError(
                timeCapsule.connect(creator).createCapsule(
                    beneficiary.address,
                    unlockTimestamp,
                    sampleArweaveTxId,
                    sampleEncryptedKey,
                ),
                "EnforcedPause"
            );
        });

        it("Should block cancelCapsule when paused", async function (){
            const unlockTimestamp = await getLatestTimestamp() + 86400n;

            //creating capsule 
            await timeCapsule.connect(creator).createCapsule(
                beneficiary.address,
                unlockTimestamp,
                sampleArweaveTxId,
                sampleEncryptedKey,
            );

            await timeCapsule.connect(owner).pause();
            
            //trying to cancel capsule
            await expectRevertCustomError(
                timeCapsule.connect(creator).cancelCapsule(0),
                "EnforcedPause"
            );
        });

        it("Should NOT block view functions when paused", async function (){
            const unlockTimestamp = await getLatestTimestamp() + 86400n;

            //creating capsule 
            await timeCapsule.connect(creator).createCapsule(
                beneficiary.address,
                unlockTimestamp,
                sampleArweaveTxId,
                sampleEncryptedKey,
            );

            await timeCapsule.connect(owner).pause();
            
            //checking if view fucntion are still functional
            expect(await timeCapsule.getTotalCapsules()).to.equal(1n);
            expect(await timeCapsule.getCapsuleStatus(0)).to.equal("Locked");
            expect(await timeCapsule.isCapsuleUnlocked(0)).to.equal(false);

            const capsule = await timeCapsule.getCapsule(0);
            expect(capsule.creator).to.equal(creator.address);
        });

        it("Should allow functions after unpause", async function() {
            const unlockTimestamp = (await getLatestTimestamp()) + 86400n;

            //Pausing and unpasuing 
            await timeCapsule.connect(owner).pause();
            await timeCapsule.connect(owner).unpause();

            const tx = await timeCapsule.connect(creator).createCapsule(
                beneficiary.address,
                unlockTimestamp,
                sampleArweaveTxId,
                sampleEncryptedKey
            );

            await expectEvent(tx,"CapsuleCreated");
        });
    });
    //Onwership transfing effects test cases
    describe("Ownership Transfer Effects", function () {
        it("New owner should be able to pause", async function () {
            // Transferiu ownership
            await timeCapsule.connect(owner).transferOwnership(randomUser.address);

            // New owner pauses
            await timeCapsule.connect(randomUser).pause();

            expect(await timeCapsule.paused()).to.equal(true);
        });

        it("Old owner should NOT be able to pause after transfer", async function () {
            await timeCapsule.connect(owner).transferOwnership(randomUser.address);

            // Old owner trying to pause
            await expectRevertCustomError(
                timeCapsule.connect(owner).pause(),
                "OwnableUnauthorizedAccount"
            );
        });

        it("No one can pause after ownership is renounced", async function () {
            // Renouncing ownership
            await timeCapsule.connect(owner).renounceOwnership();

            await expectRevertCustomError(
                timeCapsule.connect(owner).pause(),
                "OwnableUnauthorizedAccount"
            );

            await expectRevertCustomError(
                timeCapsule.connect(randomUser).pause(),
                "OwnableUnauthorizedAccount"
            );
        });
    });
});