pragma solidity >= 0.5.0 <6.0.0;

import "./Ownable.sol";

contract Pausable is Ownable {

  bool private paused = false;
  bool private dead = false;

  constructor(bool startPaused) public {
    paused = startPaused;
  }

  modifier mustBeAlive(){
    require(dead == false, "The contract has been killed");
    _;
  }

  modifier mustBeRunning(){
    require(paused == false, "The contract is paused");
    _;
  }

  modifier mustBePaused(){
    require(paused == true, "The contract must be paused");
    _;
  }

  event LogPause(
    address indexed sender,
    bool state
  );

  event LogKill(
    address sender
  );

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
