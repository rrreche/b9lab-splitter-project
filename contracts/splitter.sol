pragma solidity >= 0.5.0 <6.0.0;

import "./SafeMath.sol";

contract Splitter {
  using SafeMath for uint256;

  struct Recipient {
    address payable addr;
    uint256 balance;
  }

  address public owner;
  Recipient public recipient1;
  Recipient public recipient2;

  constructor(address payable r1, address payable r2) public {
    owner = msg.sender;
    recipient1 = Recipient(r1, 0);
    recipient2 = Recipient(r2, 0);
  }

  function addBalance() public payable isOwner() {
    require(isEven(msg.value), "The amount of ether sent must be even"); // Avoid inequalities
    uint256 splittedAmount = msg.value.div(2); // Split the ether

    // Update balances
    recipient1.balance = recipient1.balance.add(splittedAmount);
    recipient2.balance = recipient2.balance.add(splittedAmount);
  }


  function withdrawEther(uint amount) public payable {
    require(msg.sender == recipient1.addr || msg.sender == recipient2.addr, "You must be a recipient");

    if(msg.sender == recipient1.addr){
      require(recipient1.balance <= amount, "Tried to withdraw too much ether");
      recipient1.balance = recipient1.balance.sub(amount);
      recipient1.addr.transfer(amount);
    }else{
      require(recipient2.balance <= amount, "Tried to withdraw too much ether");
      recipient2.balance = recipient2.balance.sub(amount);
      recipient2.addr.transfer(amount);
    }
  }

  // Test if the number is even
  function isEven(uint number) public pure returns(bool){
    return number % 2 == 0;
  }

  // Can only be called by the contract's creator
  modifier isOwner(){
    require(msg.sender == owner, "Can only be called by the owner");
    _;
  }

}
