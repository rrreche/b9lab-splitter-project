pragma solidity >= 0.5.0 <6.0.0;

import "./SafeMath.sol";
import "./Pausable.sol";

contract Splitter is Pausable {
  using SafeMath for uint256;

  mapping(address => uint) public balances;

  function addBalance(address[] memory recipients) public payable mustBeAlive() mustBeUnpaused(){

    require(recipients.length == 2);
    uint256 splittedAmount = msg.value.div(2); // Split the ether

    // Update balances
    balances[recipients[0]] = balances[recipients[0]].add(splittedAmount);
    balances[recipients[1]] = balances[recipients[1]].add(splittedAmount);

    // Refund remainder
    if(msg.value % 2 == 1){
      balances[msg.sender] = balances[msg.sender].add(1);
    }

    emit LogBalanceAdd(
      splittedAmount,
      msg.sender,
      recipients[0],
      recipients[1],
      uint8(msg.value % 2)
    );
  }

  function withdrawEther(uint amount) public payable mustBeAlive() mustBeUnpaused() {
    require(balances[msg.sender] >= amount, "Not enough balance");
    balances[msg.sender] = balances[msg.sender].sub(amount);
    emit LogBalanceWithdraw(msg.sender, amount);
    msg.sender.transfer(amount);
  }

  function() external {
  }

  event LogBalanceAdd(
    uint256 amount,
    address splitter,
    address recipient1,
    address recipient2,
    uint8 remainder
  );

  event LogBalanceWithdraw(
    address caller,
    uint256 amount
  );

}
