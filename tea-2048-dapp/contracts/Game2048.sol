// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Game2048 is Ownable {
    mapping(address => uint256) public highScores;
    uint256 public entryFee = 0.01 ether;
    uint256 public prizePool;

    event NewHighScore(address player, uint256 score);
    event PrizeClaimed(address winner, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function submitScore(uint256 score) external payable {
        require(msg.value >= entryFee, "Insufficient entry fee");
        require(score > highScores[msg.sender], "Score not higher than current record");

        highScores[msg.sender] = score;
        prizePool += msg.value;
        
        emit NewHighScore(msg.sender, score);
    }

    function claimPrize() external {
        uint256 highestScore = highScores[msg.sender];
        require(highestScore > 0, "No score to claim");
        
        // Simple logic: if your score is highest, you can claim the entire pool
        // In a real game, you'd need more complex logic to determine winners
        uint256 amount = prizePool;
        prizePool = 0;
        
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");
        
        emit PrizeClaimed(msg.sender, amount);
    }

    function setEntryFee(uint256 newFee) external onlyOwner {
        entryFee = newFee;
    }

    function withdrawFees() external onlyOwner {
        (bool sent, ) = owner().call{value: address(this).balance - prizePool}("");
        require(sent, "Failed to send Ether");
    }
}