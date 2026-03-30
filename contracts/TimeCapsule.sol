// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TimeCapsule
 * @author Tadiwanashe Mandizvidza 
 * @dev Dapp used to store encrypted memmories on the blovckchain
 * @notice Contract governs metadata and access for time locked capsules 
 *@notice reentrancy guard ensures function is not called while being executed
*/
contract TimeCapsule is ReentrancyGuard, Ownable, Pausable {

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

    //Gas optimization errors
    error CapsuleDoesNotExist(uint256 capsuleId);
    error NotCapsuleCreator(uint256 capsuleId, address caller);
    error NotCapsuleBeneficiary(uint256 capsuleId, address caller);
    error CapsuleStillLocked(uint256 capsuleId, uint256 unlockTime);
    error CapsuleAlreadyCancelled(uint256 capsuleId);
    error CannotCancelAfterUnlock(uint256 capsuleId, uint256 unlockTime);

    // EVENTS
    // Emitted when a new capsule is created
    event CapsuleCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed beneficiary,
        uint256 unlockTimestamp
    );

    // Emitted when creator cancels capsule
    event CapsuleCancelled(
        uint256 indexed id,
        address indexed creator
    );

    // MODIFIERS
    modifier capsuleExists(uint256 _id) {
        if (_id >= _capsuleIdCounter) {
            revert CapsuleDoesNotExist(_id);
        }
        _;
    }

    modifier onlyCreator(uint256 _id) {
        if (msg.sender != _capsules[_id].creator) {
            revert NotCapsuleCreator(_id, msg.sender);
        }
        _;
    }

    // CONSTRUCTOR
    constructor() Ownable(msg.sender) {
        // TODO: initilalizations
    }
    

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
    ) external nonReentrant whenNotPaused returns (uint256) {
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
    function getCapsule(uint256 _id ) external view capsuleExists(_id) returns(Capsule memory) {
        return _capsules[_id];
    }

    /**
     * @notice Claim a time capsule
     * @param _id ID of capsule to claim
     */
    function cancelCapsule(uint256 _id) external nonReentrant whenNotPaused() capsuleExists(_id) onlyCreator(_id) {
        Capsule storage capsule = _capsules[_id];

        if (block.timestamp >= capsule.unlockTimestamp) {
            revert CannotCancelAfterUnlock(_id, capsule.unlockTimestamp);
        }

        if (capsule.isCancelled) {
            revert CapsuleAlreadyCancelled(_id);
        }

        capsule.isCancelled = true;

        emit CapsuleCancelled(_id, msg.sender);
    }

    // ADMIN FUNCTIONS

    /**
     * @dev owner of contract is only one allowed to pause
    */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev owner of contract is only one allowed to unpause
    */
    function unpause() external onlyOwner {
        _unpause();
    }

    // VIEW FUNCTIONS
    
    /**
     * @notice Get all capsules created by a specific address
     * @param _creator creator address
     * @return uint256[] array of all capsule IDs
     */
    function getCreatedCapsules(address _creator) external view returns (uint256[] memory) {
        return _createdCapsules[_creator];
    }

    /**
     * @notice Get all capsules created by a specific address
     * @param _beneficiary beneficiary address
     * @return uint256[] array of all capsule IDs
     */
    function getBeneficiaryCapsules(address _beneficiary) external view returns (uint256[] memory) {
        return _beneficiaryCapsules[_beneficiary];
    }

    /**
     * @notice Get total number of capsules created
     * @return uint256 total capsules
     */
    function getTotalCapsules() external view returns (uint256) {
        return _capsuleIdCounter;
    }

    /**
     * @notice Check if capsule is unlocked
     * @param _id ID of capsule to check
     * @return bool true if unlocked, false otherwise
     */
    function isCapsuleUnlocked(uint256 _id) external view capsuleExists(_id) returns (bool) {
        return block.timestamp >= _capsules[_id].unlockTimestamp;
    }

    /**
     * @notice Get time remaining until capsule unlocks
     * @param _id ID of capsule to check
     * @return uint256 time remaining, seconds
     */
    function getTimeRemaining(uint256 _id) external view capsuleExists(_id) returns (uint256) {
        Capsule storage capsule = _capsules[_id];
        if (block.timestamp >= capsule.unlockTimestamp) {
            return 0;
        } else {
            return capsule.unlockTimestamp - block.timestamp;
        }
    }

    /**
     * @notice Get status of a capsule
     * @param _id ID of capsule to check
     * @return status string indicating capsule status
     */
    function getCapsuleStatus(uint256 _id) external view capsuleExists(_id) returns (string memory status) {
        Capsule storage capsule = _capsules[_id];

        if (capsule.isCancelled) {
            return "Cancelled";
        } else if (block.timestamp >= capsule.unlockTimestamp) {
            return "Unlocked";
        } else {
            return "Locked";
        }
    }
}
