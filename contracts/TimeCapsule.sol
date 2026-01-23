// SPDX-LIcense -Identifier: MIT 
pragma solidity ^0.8.20;

/**
 * @title TimeCapsule
 * @dev Dapp used to store encrypted memmories on the blovckchain
 *@notice Contract governs metadata and access for time locked capsules 
*/

//TODO: COMMENTS EVERYWHERE They ARE IMPORTANT


contract TimeCapsule {

    // State variables
    uint256 private _capsuleIdCounter;

    struct Capsule {
        uint256 id;
        address creator;
        address beneficiary;
        uint256 unlockTimestamp;
        string arweaveTxId;
        string encryptedKey;
        uint256 isCancelled;
    }

    mapping(uint256 => Capsule) private _capsules;

    mapping(address => uint256[]) private _createdCapsules;

    mapping(address => uint256[]) private _beneficiaryCapsules;

    // Events
    event CapsuleCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed beneficiary,
        uint256 unlockTimestamp
    );

    event CapsuleClaimed(
        uint256 indexed id,
        address indexed beneficiary,
        uint256 timestamp
    );

    event CapsuleCancelled(
        uint256 indexed id,
        address indexed creator
    );
}
