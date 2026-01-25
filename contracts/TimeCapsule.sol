// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TimeCapsule
 * @author Tadiwanashe Mandizvidza 
 * @dev Dapp used to store encrypted memmories on the blovckchain
 * @notice Contract governs metadata and access for time locked capsules 
 *@notice reentrancy guard ensures function is not called while being executed
*/
contract TimeCapsule is ReentrancyGuard {

    // State variables

    /// @dev Counter for capsule IDs
    uint256 private _capsuleIdCounter;

    /// @dev Capsule struct to store capsule metadata
    struct Capsule {
        uint256 id;
        address creator;
        address beneficiary;
        uint256 unlockTimestamp;
        string arweaveTxId;
        string encryptedKey;
        bool isCancelled;
    }

    /// @dev Mapping capsule ID to Capsule data (storage)
    mapping(uint256 => Capsule) private _capsules;

    /// @dev Mapping creator address to created capsule IDs
    mapping(address => uint256[]) private _createdCapsules;

    /// @dev Mapping beneficiary address to assigned capsule IDs
    mapping(address => uint256[]) private _beneficiaryCapsules;

    // Events
    // Emitted when a new capsule is created
    event CapsuleCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed beneficiary,
        uint256 unlockTimestamp
    );

    // Emitted when beneficiary claims capsule
    event CapsuleClaimed(
        uint256 indexed id,
        address indexed beneficiary,
        uint256 timestamp
    );

    // Emitted when creator cancels capsule
    event CapsuleCancelled(
        uint256 indexed id,
        address indexed creator
    );

    // CORE FUNCTIONS
    /**
     * @notice Createing a new time capsule
     * @param _beneficiary beneficiary address
     * @param _unlockTimestamp timestamp when capsule can be unlocked
     * @param _arweaveTxId Arweave transaction ID
     * @param _encryptedKey encrypted key for capsule
     */
    function createCapsule(
        address _beneficiary,
        uint256 _unlockTimestamp,
        string memory _arweaveTxId,
        string memory _encryptedKey
    ) external nonReentrant returns (uint256) {
        //VALIDATIONS
        require(
            _unlockTimestamp > block.timestamp,
            "Unlock time should sometime be in the future"
        );

        require(
            _beneficiary != address(0),
            "Beneficiary cannot be the zero address"
        );

        require(
            bytes(_arweaveTxId).length > 0,
            "Arweave ID cannot be empty"
        );

        require(
            bytes(_encryptedKey).length > 0, 
            "Encrypted key cannot be empty");

        uint256 newCapsuleId = _capsuleIdCounter;
        _capsuleIdCounter ++;

        //New capsule struct 
        Capsule memory newCapsule = Capsule({
            creator: msg.sender,
             id: newCapsuleId,
            beneficiary: _beneficiary,
            unlockTimestamp: _unlockTimestamp,
            arweaveTxId: _arweaveTxId,
            encryptedKey: _encryptedKey,
            isCancelled: false 
        });

        _capsules[newCapsuleId] = newCapsule;

        _createdCapsules[msg.sender].push(newCapsuleId);

        _beneficiaryCapsules[_beneficiary].push(newCapsuleId);

        emit CapsuleCreated(
            newCapsuleId,
            msg.sender,
            _beneficiary,
            _unlockTimestamp
        );

        return newCapsuleId;
    }

    /**
     * @notice Get capsule metadata
     * @param _id ID of capsule to retrieve
     * @return Capsule struct containing capsule metadata
     */
    function getCapsule(uint256 _id ) external view returns (Capsule memory) {
        require(_id < _capsuleIdCounter, "Capsulse does not exist");
        return _capsules[_id];
    }

    /**
     * @notice Claim a time capsule
     * @param _id ID of capsule to claim
     */
    function cancelCapsule(uint256 _id) external nonReentrant {
        Capsule storage capsule = _capsules[_id];

        require(
            msg.sender == capsule.creator,
            "Only the creator can cancel the capsule"
        );

        require(
            block.timestamp < capsule.unlockTimestamp,
            "Cannot cancel after unlock time"
        );

        require(
            !capsule.isCancelled,
            "Capsule is already cancelled"
        );

        capsule.isCancelled = true;

        emit CapsuleCancelled(_id, msg.sender);
    }

}
