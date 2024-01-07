// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgnostico {
    error UnAuthorizedRequest();
    error InitializationFailed();
    error MisMatchedID();
    error InsufficientBalance(uint256 requested, uint256 available);


    function deployClone(
       uint256 id,
        bytes32 codeHash,
        bytes calldata initCall
    ) external payable;

    function deployContract(
        uint256 id,
        bytes32 codeHash,
        bytes calldata bytecode,
        bytes calldata initCall,
        bool withConstructor
    ) external payable;

    function claim(bytes32 codeHash, string calldata uri) external;

    function setAgnoCode(address _agnocode) external;

    function setDevPct(uint256 _pctForDevs) external;

    function setFeeCollector(address _collector) external;

    function setCost(uint256 _cost) external;

    function withdrawFee(address to, uint256 amount) external;

    function removeStuckTokens(
        address token,
        address to,
        uint256 amount
    ) external;

    function version() external view returns (string memory);
}
