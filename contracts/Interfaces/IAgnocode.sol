// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgnoCode {
    function grantCode(address to, string calldata uri)
        external
        returns (bool, uint256);

    function total() external view returns (uint256);

    function version() external pure returns (string memory);

    function fixURI(uint256 id, string calldata uri) external;
}

interface IERC721 {
    function ownerOf(uint256 id) external view returns (address);
}
