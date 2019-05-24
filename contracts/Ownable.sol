pragma solidity >= 0.5.0 <6.0.0;


contract Ownable {

  address internal owner;

  constructor() public {
    owner = msg.sender;
  }

  function getOwner() public view returns(address){
    return owner;
  }

  function setOwner(address newOwner) public onlyOwner(){
    owner = newOwner;
    emit LogOwnerChange(owner);
  }

  modifier onlyOwner(){
    require(msg.sender == owner, "Can only be called by the owner");
    _;
  }

  event LogOwnerChange(
    address owner
  );
}
