// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
contract Storage {
    string fileName;
    string fileHashvalue;
    string filePosition;
    uint256 number=123;
    constructor (string memory _fileName, string memory _fileHashvalue, string memory _filePosition) {
        fileName = _fileName;
        fileHashvalue = _fileHashvalue;
        filePosition = _filePosition;
    }
    /**
     * @dev Store value in variable
     * @param num value to store
     */
    function store(uint256 num) public {
        number = num;
    }

    /**
     * @dev Return value 
     * @return value of 'number'
     */
    function returnFile() public view returns (string[] memory){
        string[] memory detail = new string[](3);
        detail[0] = fileName;
        detail[1] = fileHashvalue;
        detail[2] = filePosition;
        return detail;
    }

    function retrieve() public view returns (uint256){
        return number;
    }
}