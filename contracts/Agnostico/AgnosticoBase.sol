// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./AgnosticoState.sol";

contract AgnosticoBase is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    AgnosticoState
{
    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public constant UPGRADER = keccak256("UPGRADER");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        uint256 devPct,
        address _feeCollector,
        uint256 _cost
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN, msg.sender);
        _grantRole(UPGRADER, msg.sender);

        _setRoleAdmin(ADMIN, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(UPGRADER, DEFAULT_ADMIN_ROLE);
        pctForDevs = devPct;
        feeCollector = _feeCollector;
        cost = _cost;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER)
    {}
}
