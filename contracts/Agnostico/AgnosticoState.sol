// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgnosticoState {
    struct Code {
        address claimedBy;
        address implementation;
        address firstDeployer;
        address beneficiary;
        bytes32 codeHash;
        uint256 id;
        uint256 used;
        uint256 likes;
        uint256 addedOn;
        bool verified;
    }

    struct MyDeployments {
        uint256 id;
        address location;
    }

    struct Earning {
        uint256 available;
        uint256 withdrawn;
    }

    /// @notice address of the platform's fee collector.
    /// @dev Preferrably a multisig for added security
    address public feeCollector;
    /// @notice address of the current agnocode contract
    address public agnocode;

    /// @notice cost of deploying a contract
    uint256 public cost;
    /// @notice percentage cut for devs when their contract is deployed
    uint256 public pctForDevs;
    // /// @notice shows the expanded information about a given code hash
    // mapping(bytes32 => Code) public codes;
    /// @notice shows the expanded information about a given '$CODE' id
    mapping(uint256 => Code) public codes;
    /// @notice earnings by a given address (developer/platform)
    mapping(address => Earning) public devEarnings; // account => amount

    mapping(bytes32 => bool) internal exists;

    /// @notice amount earned by a developer/platform
    event Claimed(uint256 id, bytes32 indexed code, address indexed claimedBy);
    event Deployed(
        address indexed newContract,
        uint256 indexed codeId,
        address indexed deployer
    );
    event EarningWithdrawn(address account, uint256 amount);
    event Verified(bytes32 indexed code, uint256 indexed verifiedAtBlock);
}
