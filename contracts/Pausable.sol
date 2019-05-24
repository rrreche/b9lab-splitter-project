pragma solidity >= 0.5.0 <6.0.0;

import "./Ownable.sol";

contract Pausable is Ownable {

  bool internal paused = false;
  bool internal dead = false;

  function pause() public mustBeAlive() onlyOwner() mustBeUnpaused(){
    paused = true;
    emit LogPause(paused);
  }

  function resume() public mustBeAlive() onlyOwner() mustBePaused() {
    paused = false;
    emit LogPause(paused);
  }

  function kill() public mustBeAlive() onlyOwner(){
    dead = true;
    emit LogKill(dead);
  }

  // Override to account for dead contract
  function getOwner() public view returns(address) {
    return owner;
  }

  function setOwner(address newOwner) public mustBeAlive() onlyOwner() {
    owner = newOwner;
    emit LogOwnerChange(owner);
  }

  function isPaused() public view returns (bool){
    return paused;
  }

  function isDead() public view returns (bool){
    return dead;
  }

  modifier mustBeAlive(){
    require(dead == false, "The contract has been killed");
    _;
  }

  modifier mustBeUnpaused(){
    require(paused == false, "The contract is paused");
    _;
  }

  modifier mustBePaused(){
    require(paused == true, "The contract must be paused");
    _;
  }

  event LogPause(
    bool state
  );

  event LogKill(
    bool state
  );

}
