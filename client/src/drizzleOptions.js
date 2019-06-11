import Splitter from "./contracts/Splitter.json";

const options = {
  contracts: [Splitter],
  events: {
    Splitter: ["LogBalanceIncrease", "LogBalanceWithdraw"]
  },
  polls: {
    accounts: 1500
  }
};

export default options;
