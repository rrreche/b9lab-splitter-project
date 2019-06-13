import Splitter from "./contracts/Splitter.json";

const options = {
  contracts: [Splitter],
  events: {
    Splitter: ["LogBalanceIncreased", "LogBalanceWithdrawn"]
  },
  polls: {
    accounts: 1500
  }
};

export default options;
