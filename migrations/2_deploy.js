const fs = require("fs-extra");
const path = require("path");
const { BN } = require("web3-utils").BN;
let Splitter = artifacts.require("./Splitter.sol");

// const from = path.resolve(__dirname, "./../build/contracts/Splitter.json");
const toFilePath = path.resolve(__dirname, "./../client/src/contracts/Splitter.json");

module.exports = function(deployer, network) {
  deployer.deploy(Splitter, false);
};
