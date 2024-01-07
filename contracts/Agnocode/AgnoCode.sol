// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {AgnoCodeBase, CountersUpgradeable} from "./AgnocodeBase.sol";
import {IAgnoCode} from "../Interfaces/IAgnocode.sol";

/// @title For minting $CODE NFTs to developers who submit their tokens on the agnostico platform
/// @notice This contract enables minting of NFTs from the agnostico platform
contract AgnoCode is AgnoCodeBase, IAgnoCode {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    address public agnostico;
    /// @notice sets agnostico current address
    /// @dev only authorized admin should call this function
    /// @param _agnostico new agnostico contract address
    function setAgnostico(address _agnostico) external virtual onlyRole(ADMIN) {
        _revokeRole(MINTER, agnostico);
        _grantRole(MINTER, _agnostico);
        agnostico = _agnostico;
    }

    /// @notice mints a new $CODE token
    /// @dev only authorized minter (agnostico contract)
    /// @param to receiver address
    /// @param uri the uri to the code being minted
    function grantCode(address to, string calldata uri)
        external
        virtual
        onlyRole(MINTER)
        returns (bool minted, uint256 id)
    {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return (true, tokenId);
    }



    function total() external view virtual returns (uint256) {
        return _tokenIdCounter.current();
    }

    /// @notice lets admin fix uri of a token
    /// @param id token id to check
    /// @param uri new token uri
    function fixURI(uint256 id, string calldata uri) external virtual {
        _setTokenURI(id, uri);
    }

    function version() external pure virtual returns (string memory) {
        return "0.1.1";
    }
}
