// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.20;

/**
 * @title TimeCapsule
 * @dev Dapp used to store encrypted memmories on the blovckchain
 * @notice Contract governs metadata and access for time locked capsules 
*/
contract TimeCapsule {

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

    /// TODO: comments
    function createCapsule(
        address _beneficiary,
        uint256 _unlockTimestamp,
        string memory _arweaveTxId,
        string memory _encryptedKey
    ) external returns (uint256) {
        
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

}
