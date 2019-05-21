const Splitter = artifacts.require("./Splitter.sol");
const utils = require("web3-utils");
const BN = utils.BN;

contract("Splitter", accounts => {
  before("define Alice, Bob and Carol", () => {
    this.Alice = accounts[0];
    this.Bob = accounts[1];
    this.Carol = accounts[2];
    this.Mallory = accounts[3];
  });

  beforeEach("initialize contract", async () => {
    this.contract = await Splitter.new(this.Bob, this.Carol);
  });

  describe("Contract initialization", () => {
    it("assigns the owner correctly", async () => {
      const owner = await this.contract.owner();
      assert.equal(owner, this.Alice);
    });

    it("assigns recipient 1 as Bob, recipient 2 as Carol", async () => {
      const recipient1 = await this.contract.recipient1();
      const recipient2 = await this.contract.recipient2();

      assert.equal(recipient1, this.Bob);
      assert.equal(recipient2, this.Carol);
    });
  });

  describe("Contract operation", () => {
    it("allows Alice to send ether to the contract and split it", async () => {
      const sentBalance = new BN(utils.toWei("1", "ether"));
      const tx = await this.contract.addBalance({
        value: sentBalance.toString()
      });

      assert.ok(tx.receipt.status, "Transaction did not go through");

      const contractBalance = await web3.eth.getBalance(this.contract.address);

      assert.equal(
        contractBalance,
        sentBalance.toString(),
        "Contract balance was not updated"
      );

      const bobBalance = await this.contract.balances(this.Bob);
      const carolBalance = await this.contract.balances(this.Carol);

      assert.equal(
        bobBalance.toString(),
        carolBalance.toString(),
        "Balance was not splitted equally"
      );

      const bnTwo = new BN("2");

      assert.equal(
        sentBalance.div(bnTwo).toString(),
        bobBalance.toString(),
        "Balance was not splitted into two"
      );
    });

    it("allows Bob to withdraw his ether", async () => {
      const amountToSplit = new BN(utils.toWei("1", "ether"));
      await this.contract.addBalance({ value: amountToSplit.toString() });

      const oldBobBalance = new BN(await web3.eth.getBalance(this.Bob));

      const withdrawAmount = new BN(utils.toWei("0.5", "ether"));

      const tx = await this.contract.withdrawEther(withdrawAmount, {
        from: this.Bob
      });

      assert.ok(tx.receipt.status, "Transaction did not go through");

      const newBobBalance = new BN(await web3.eth.getBalance(this.Bob));

      assert.ok(
        newBobBalance.gt(oldBobBalance),
        "Balance did not increase after withdrawal"
      );
    });

    it("allows Carol to withdraw his ether", async () => {
      const amountToSplit = new BN(utils.toWei("1", "ether"));
      await this.contract.addBalance({ value: amountToSplit.toString() });

      const oldCarolBalance = new BN(await web3.eth.getBalance(this.Carol));

      const withdrawAmount = new BN(utils.toWei("0.5", "ether"));

      const tx = await this.contract.withdrawEther(withdrawAmount, {
        from: this.Carol
      });

      assert.ok(tx.receipt.status, "Transaction did not go through");

      const newCarolBalance = new BN(await web3.eth.getBalance(this.Carol));

      assert.ok(
        newCarolBalance.gt(oldCarolBalance),
        "Balance did not increase after withdrawal"
      );
    });
  });

  describe("TODO Dishonest / bad behaviours", () => {
    it("rejects withdrawals from extraneous accounts", async () => {
      const amountToSplit = new BN(utils.toWei("1", "ether"));
      await this.contract.addBalance({ value: amountToSplit.toString() });

      try {
        const tx = await this.contract.withdrawEther(
          amountToSplit.div(new BN(2)).toString(),
          { from: this.Mallory }
        );

        assert.fail("Transaction should have failed");
      } catch (e) {
        if (e.reason) {
          assert.equal(
            e.reason,
            "SafeMath: subtraction overflow",
            "Transaction failed for the wrong reasons"
          );
        } else {
          console.error(e);
          assert.fail("Transaction failed for the wrong reasons");
        }
      }
    });

    it("rejects to withdraw more ether than is allowed", async () => {
      const amountToSplit = new BN(utils.toWei("1", "ether"));
      await this.contract.addBalance({ value: amountToSplit.toString() });

      const excessAmount = amountToSplit.div(new BN(2)).add(new BN(1)); // 1 Wei more than balance

      try {
        const tx = await this.contract.withdrawEther(excessAmount, {
          from: this.Bob
        });

        assert.fail("Transaction should have failed");
      } catch (e) {
        if (e.reason) {
          assert.equal(
            e.reason,
            "SafeMath: subtraction overflow",
            "Transaction failed for the wrong reasons"
          );
        } else {
          console.error(e);
          assert.fail("Transaction failed for the wrong reasons");
        }
      }
    });

    // describe("copes well with more complex withdrawal sequences"); // TODO
  });
});
