// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AgnosticoBase} from "./AgnosticoBase.sol";
import {IERC721, IAgnoCode} from "../Interfaces/IAgnocode.sol";
import "../Interfaces/IAgnostico.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title A factory for deploying any contract given their bytecode. Registers ownership of using the hash of that code
/// @notice This contract enables ownership and redeploying of contracts
contract Agnostico is AgnosticoBase, IAgnostico {
    /// @notice hashed value of smart contract code is used to mint $CODE token
    /// @param codeHash the hash value of the smart contract code that is being submitted.
    /// @param uri the ipfs uri for the code to be generated after claiming it
    function claim(bytes32 codeHash, string calldata uri) external virtual {
        require(!exists[codeHash], "Claimed!");
        _claim(codeHash, uri);
    }

    function _claim(bytes32 _codeHash, string calldata uri) internal {
        address claimant = _msgSender();
        (bool minted, uint256 mintId) = IAgnoCode(agnocode).grantCode(
            claimant,
            uri
        );
        require(minted, "Not Minted");
        Code memory code = Code(
            _msgSender(),
            address(0),
            address(0),
            _msgSender(),
            _codeHash,
            mintId,
            0,
            0,
            block.timestamp,
            false
        );
        // codes[_codeHash] = code;
        codes[mintId] = code;
        exists[_codeHash] = true;
        emit Claimed(mintId, _codeHash, claimant);
    }

    /// @notice change the beneficiary of a $CODE earning. Must be called after a token transfer to
    /// transfer earning rights in case of P2P of marketplace purchases
    /// benefits starts accruing after changing beneficiary for this $CODE
    /// @dev can be called only by the current owner of that token
    /// @param beneficiary the address of the new beneficiary
    /// @param codeId id of the $CODE
    function changeBeneficiary(address beneficiary, uint256 codeId) external {
        address currentOwner = IERC721(agnocode).ownerOf(codeId);
        require(_msgSender() == currentOwner, "unAuthorized");
        codes[codeId].beneficiary = beneficiary;
    }

    /// @notice clones an existing claimed contract that matches the given codeHash parameter
    /// @dev deployable contract must not have a contstructor
    /// @param id the corresponing value of the contract's $CODE id.
    /// @param codeHash the hash value of the smart contract code that is being submitted.
    /// @param initCall the byte value for the initializing function for the contract being cloned
    function deployClone(
        uint256 id,
        bytes32 codeHash,
        bytes calldata initCall
    ) external payable virtual {
        _getDevCut(codeHash, msg.value, id);
        Code memory _code = codes[id];
        if(_code.codeHash != codeHash){ 
            revert MisMatchedID();
        }
        require(_code.implementation != address(0), "Invalid Contract Ref");
        _clone(_code.implementation, id, initCall);
    }

    function _clone(
        address implementation,
        uint256 id,
        bytes calldata initCall
    ) internal {
        address instance;
        assembly {
            let ptr := mload(0x40)
            mstore(
                ptr,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(
                add(ptr, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "ERC1167: Create Failed");
        if (initCall.length > 0) {
            (bool ok, ) = instance.call(initCall);
            if (!ok) revert InitializationFailed();
        }
        emit Deployed(instance, id, _msgSender());
        codes[id].used += 1;
    }

    /// @notice deploys a new contract from an existing claimed one that matches the given codeHash parameter
    /// @dev must use if contract has a constructor
    /// @param id the corresponing value of the contract's $CODE id.
    /// @param codeHash the keccak256 value of the smart contract code that is being submitted.
    /// @param initCall the byte value for the initializing function for the contract being deployed
    /// @param withConstructor to tell if the contract contains a contructor
    function deployContract(
        uint256 id,
        bytes32 codeHash,
        bytes calldata bytecode,
        bytes calldata initCall,
        bool withConstructor
    ) external payable virtual {
        _getDevCut(codeHash, msg.value, id);
        address deployer = _msgSender();
        _deployContract(id, deployer, bytecode, initCall, withConstructor);
    }

    function _deployContract(
        uint256 id,
        address _deployer,
        bytes memory _bytecode,
        bytes memory _initCall,
        bool _withConstrucor
    ) internal {
        address addr = _getAddress(_bytecode, _initCall, _withConstrucor);
        Code storage code = codes[id];
        if (code.implementation == address(0)) {
            code.implementation = addr;
            code.firstDeployer = _deployer;
        }
        code.used += 1;
        emit Deployed(addr, id, _deployer);
    }

    function _getAddress(
        bytes memory _bytecode,
        bytes memory _initCall,
        bool _withConstructor
    ) internal returns (address) {
        address addr;
        assembly {
            addr := create(0, add(_bytecode, 0x20), mload(_bytecode))
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        if (!_withConstructor) {
            if (_initCall.length > 0) {
                (bool ok, ) = addr.call(_initCall);
                if (!ok) revert InitializationFailed();
            }
            // call initializer low-level
        }
        require(addr != address(0), "Agnostico: Failed To Deploy");
        return addr;
    }

    /// @notice sets the flat pct fee for devs
    /// @dev must only be called by authorized admin. In whole number between 1 and 100
    /// @param _pctForDevs the fee percentage
    function setDevPct(uint256 _pctForDevs) external virtual onlyRole(ADMIN) {
        pctForDevs = _pctForDevs;
    }

    /// @notice sets the address of the agnocode implementation.
    /// @dev must only be called by authorized admin.
    /// @param _agnocode the new address for agnocode
    function setAgnoCode(address _agnocode) external virtual onlyRole(ADMIN) {
        agnocode = _agnocode;
    }

    /// @notice sets the address of platform fee collector
    /// @dev must only be called by authorized admin. Preferrably a mulsitsig
    /// @param _collector the new address for platform fee collector
    function setFeeCollector(address _collector)
        external
        virtual
        onlyRole(ADMIN)
    {
        feeCollector = _collector;
    }

    /// @notice sets the cost of deploying a contract using the platform
    /// @dev must only be called by authorized admin.
    /// @param _cost the cost for deploying a contract
    function setCost(uint256 _cost) external virtual onlyRole(ADMIN) {
        cost = _cost;
    }

    function _getDevCut(
        bytes32 codeHash,
        uint256 amount,
        uint256 codeId
    ) internal {
        Code memory _code = codes[codeId];
        if(_code.codeHash != codeHash) revert MisMatchedID();
        require(amount == cost, "Send Correct Fee Amount");
        address beneficiary = _code.beneficiary;
        uint256 devCut = (cost * pctForDevs);
        unchecked {
            amount -= devCut;
            devEarnings[beneficiary].available += devCut;
            devEarnings[feeCollector].available += amount;
        }
        
    }

    /// @notice lets developer withdraw their funds from the contract
    /// @dev supports only chain's native currency
    /// @param to the receiving address
    /// @param amount the amount to the withdrawn
    function withdrawFee(address to, uint256 amount) external virtual {
        Earning storage devEarning = devEarnings[_msgSender()];
          if(amount + devEarning.withdrawn >= devEarning.available)  revert InsufficientBalance(amount + devEarning.withdrawn, devEarning.available);
    
        unchecked { 
             devEarning.available -= amount;
             devEarning.withdrawn += amount;
        }
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "withdrawal failed");
        emit EarningWithdrawn(_msgSender(), amount);
    }

    /// @notice lets platform admin withdraw erc20 tokens accidentally sent to the contract
    /// @dev helper function to remove stuck tokens by platform admin(s)
    /// @param token address of token to be withdrawn
    /// @param to the receiving address
    /// @param amount the amount to the withdrawn
    function removeStuckTokens(
        address token,
        address to,
        uint256 amount
    ) external virtual onlyRole(ADMIN) {
        IERC20(token).transfer(to, amount);
    }

    function getCodes(uint256 size, uint256 step)
        external
        view
        returns (Code[] memory result)
    {
        Code[] memory _result = new Code[](size);
        for (uint256 index = step; index < size; index++) {
            Code memory _code = codes[index];
            _result[index] = _code;
        }
        result = _result;
    }

    /// @notice shows the current version of this contract
    function version() external pure virtual returns (string memory) {
        return "0.1.2";
    }
}
