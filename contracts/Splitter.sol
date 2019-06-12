pragma solidity >= 0.5.0 <6.0.0;

import "./SafeMath.sol";
import "./Pausable.sol";

contract Splitter is Pausable {
  using SafeMath for uint256;

  mapping(address => uint) public balances;

  event LogBalanceIncrease(
    address indexed sender,
    address indexed receiver,
    uint256 indexed amount
  );

  event LogBalanceWithdraw(
    address indexed sender,
    uint256 amount
  );

  constructor(bool startPaused) Pausable(startPaused) public {}

  function splitEther(address receiver1, address receiver2) public payable mustBeAlive() mustBeRunning(){

    uint256 splittedAmount = msg.value.div(2); // Split the ether

    // Update balances
    addBalance(receiver1, splittedAmount);
    addBalance(receiver2, splittedAmount);

    // Refund remainder
    if(msg.value % 2 == 1){
      addBalance(msg.sender, 1);
    }

  }

  function addBalance(address to, uint256 amount) private {
    balances[to] = balances[to].add(amount);

    emit LogBalanceIncrease(
      msg.sender,
      to,
      amount
    );
  }

  function withdrawEther(uint amount) public mustBeAlive() mustBeRunning() {
    uint balance = balances[msg.sender];
    require(balance >= amount, "Not enough balance");
    balances[msg.sender] = balance.sub(amount);
    emit LogBalanceWithdraw(msg.sender, amount);
    msg.sender.transfer(amount);
  }

  function() external {
    revert();
  }

}
