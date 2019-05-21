pragma solidity >= 0.5.0 <6.0.0;

import "./SafeMath.sol";

contract Splitter {
  using SafeMath for uint256;

  address payable public owner;
  address payable public recipient1;
  address payable public recipient2;
  mapping(address => uint) public balances;

  constructor(address payable r1, address payable r2) public {
    owner = msg.sender;
    recipient1 = r1;
    recipient2 = r2;
  }

  function addBalance() public payable isOwner() {
    uint256 splittedAmount = msg.value.div(2); // Split the ether

    // Update balances
    balances[recipient1] = balances[recipient1].add(splittedAmount);
    balances[recipient2] = balances[recipient2].add(splittedAmount);

    // Refund remainder
    if(msg.value % 2 == 1){
      msg.sender.transfer(1);
    }

    emit LogBalanceAdd(splittedAmount);
  }

  function withdrawEther(uint amount) public payable {
    balances[msg.sender] = balances[msg.sender].sub(amount);
    msg.sender.transfer(amount);
    emit LogBalanceWithdraw(msg.sender, amount);
  }

  // Can only be called by the contract's creator
  modifier isOwner(){
    require(msg.sender == owner, "Can only be called by the owner");
    _;
  }

  event LogBalanceAdd(
    uint256 amount
  );

  event LogBalanceWithdraw(
    address caller,
    uint256 amount
  );

}
