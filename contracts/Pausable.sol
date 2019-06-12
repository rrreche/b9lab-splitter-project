pragma solidity >= 0.5.0 <6.0.0;

import "./Ownable.sol";

contract Pausable is Ownable {

  bool private paused;
  bool private dead;

  event LogPause(
    address indexed sender,
    bool state
  );

  event LogKill(
    address indexed sender
  );

  constructor(bool startPaused) public {
    paused = startPaused;
    dead = false;
  }

  modifier mustBeAlive {
    require(dead == false, "");
    _;
  }

  modifier mustBeRunning {
    require(paused == false, "The contract is paused");
    _;
  }

  modifier mustBePaused {
    require(paused == true, "The contract must be paused");
    _;
  }

  function pause() public mustBeAlive() onlyOwner() mustBeRunning(){
    paused = true;
    emit LogPause(msg.sender, paused);
  }

  function resume() public mustBeAlive() onlyOwner() mustBePaused() {
    paused = false;
    emit LogPause(msg.sender, paused);
  }

  function kill() public mustBeAlive() onlyOwner() mustBePaused(){
    dead = true;
    emit LogKill(msg.sender);
  }

  function isPaused() public view returns (bool){
    return paused;
  }

  function isDead() public view returns (bool){
    return dead;
  }

}
