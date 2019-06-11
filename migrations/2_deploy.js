const fs = require("fs-extra");
const path = require("path");
const { BN } = require("web3-utils").BN;
let Splitter = artifacts.require("./Splitter.sol");

const fromDirectory = path.resolve(__dirname, "./../build");
const toDirectory = path.resolve(__dirname, "./../client/src");

module.exports = function(deployer) {
  deployer
    .deploy(Splitter, false)
    .then(() => {
      return Splitter.deployed();
    })
    .then(instance => {
      fs.copySync(fromDirectory, toDirectory);
    });
};
