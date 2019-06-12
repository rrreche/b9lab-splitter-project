const Splitter = artifacts.require("./Splitter.sol");
const utils = require("web3-utils");
const BN = utils.BN;
const checkEvent = require("./helpers/checkEvent");

contract("Splitter", accounts => {
  let alice, bob, carol, david;

  before("define Alice, Bob and Carol", function() {
    [alice, bob, carol, david] = accounts;
  });

  beforeEach("initialize contract", async function() {
    this.contract = await Splitter.new(false, {
      from: alice
    });
  });

  describe("Contract initialization", () => {
    it("assigns the owner correctly", async function() {
      assert.strictEqual(await this.contract.getOwner(), alice);
    });
  });

  describe("Owner actions", () => {
    it("allows to pause the contract", async function() {
      const tx = await this.contract.pause({ from: alice });

      checkEvent({
        logs: tx.logs,
        name: "LogPause",
        params: [{ name: "state", val: true }]
      });

      assert.strictEqual(await this.contract.isPaused(), true, "Contract is not paused");
    });

    it("allows to transfer ownership", async function() {
      const tx = await this.contract.setOwner(bob, { from: alice });

      checkEvent({
        logs: tx.logs,
        name: "LogOwnerChange",
        params: [{ name: "owner", val: bob }]
      });

      assert.strictEqual(await this.contract.getOwner(), bob, "New owner was not set");
    });

    it("allows to kill the contract", async function() {
      await this.contract.pause({ from: alice });
      const tx = await this.contract.kill({ from: alice });

      checkEvent({
        logs: tx.logs,
        name: "LogKill",
        params: [{ name: "sender", val: alice }]
      });

      assert.strictEqual(await this.contract.isDead(), true, "Contract is not dead");
    });

    describe("When paused", () => {
      beforeEach("Pause the contract", async function() {
        await this.contract.pause({ from: alice });
      });

      it("Rejects pausing again", async function() {
        try {
          await this.contract.pause({ from: alice });
          assert.fail("Transaction should have failed");
        } catch (e) {
          if (e.reason) {
            assert.strictEqual(e.reason, "The contract is paused", "Transaction failed for the wrong reasons");
          } else {
            console.error(e);
            assert.fail("Transaction failed for the wrong reasons");
          }
        }
      });
    });

    describe("When killed", () => {
      // TODO
      it("TODO Rejects every state change action");
    });
  });

  describe("Contract operation", () => {
    describe("allows users to send ether to the contract and split it", () => {
      it("splits the amount between receivers correctly and updates balances", async function() {
        const sentBalance = new BN(utils.toWei("1", "shannon"));
        const tx = await this.contract.splitEther(bob, carol, {
          from: alice,
          value: sentBalance.toString()
        });

        assert.isTrue(tx.receipt.status, "Transaction did not go through");

        const contractBalance = await web3.eth.getBalance(this.contract.address);

        assert.strictEqual(contractBalance, sentBalance.toString(), "Contract balance was not updated");

        const aliceBalance = await this.contract.balances(alice);
        const bobBalance = await this.contract.balances(bob);
        const carolBalance = await this.contract.balances(carol);

        assert.strictEqual(bobBalance.toString(), carolBalance.toString(), "Balance was not split strictEqually");

        const bnTwo = new BN("2");

        assert.strictEqual(sentBalance.div(bnTwo).toString(), bobBalance.toString(), "Balance was not split into two");

        assert.strictEqual(aliceBalance.toString(), "0", "Contract assigned an illegal remainder to the sender");

        assert.strictEqual(tx.logs.length, 2, "A inconsistent number of events fired");

        checkEvent({
          logs: [tx.logs[0]],
          name: "LogBalanceIncrease",
          params: [
            { name: "sender", val: alice },
            { name: "receiver", val: bob },
            { name: "amount", val: sentBalance.div(bnTwo) }
          ]
        });

        checkEvent({
          logs: [tx.logs[1]],
          name: "LogBalanceIncrease",
          params: [
            { name: "sender", val: alice },
            { name: "receiver", val: carol },
            { name: "amount", val: sentBalance.div(bnTwo) }
          ]
        });
      });

      it("assigns back the remainder to the sender if amount is odd", async function() {
        const sentBalance = new BN("3");
        const tx = await this.contract.splitEther(bob, carol, {
          from: alice,
          value: sentBalance.toString()
        });

        const aliceBalance = await this.contract.balances(alice);

        assert.strictEqual(
          aliceBalance.toString(),
          new BN("1").toString(),
          "Odd amounts do not credit remainder to sender"
        );

        assert.strictEqual(tx.logs.length, 3, "A inconsistent number of events fired");

        checkEvent({
          logs: [tx.logs[2]],
          name: "LogBalanceIncrease",
          params: [
            { name: "sender", val: alice },
            { name: "receiver", val: alice },
            { name: "amount", val: new BN("1") }
          ]
        });
      });
    });

    it("allows users to withdraw their ether", async function() {
      const sentBalance = new BN(utils.toWei("1", "shannon"));

      await this.contract.splitEther(bob, carol, {
        from: alice,
        value: sentBalance.toString()
      });

      const oldBobBalance = new BN(await web3.eth.getBalance(bob));
      const withdrawAmount = new BN(utils.toWei("0.5", "shannon"));

      const result = await this.contract.withdrawEther(withdrawAmount, {
        from: bob
      });

      const transaction = await web3.eth.getTransaction(result.tx);

      const txFee = new BN(String(result.receipt.gasUsed * transaction.gasPrice));

      assert.isTrue(result.receipt.status, "Transaction did not go through");

      const newBobBalance = new BN(await web3.eth.getBalance(bob));

      assert.strictEqual(
        newBobBalance.toString(),
        oldBobBalance
          .add(withdrawAmount)
          .sub(txFee)
          .toString(),
        "Balance mismatch after withdrawal"
      );

      checkEvent({
        logs: result.logs,
        name: "LogBalanceWithdraw",
        params: [{ name: "sender", val: bob }, { name: "amount", val: withdrawAmount }]
      });
    });
  });

  describe("Dishonest / bad behaviours", () => {
    it("rejects to withdraw more ether than is allowed", async function() {
      const amountToSplit = new BN(utils.toWei("1", "shannon"));
      await this.contract.splitEther(bob, carol, {
        value: amountToSplit.toString()
      });

      const excessAmount = amountToSplit.div(new BN(2)).add(new BN(1)); // 1 Wei more than balance

      try {
        const tx = await this.contract.withdrawEther(excessAmount, {
          from: bob
        });

        assert.fail("Transaction should have failed");
      } catch (e) {
        if (e.reason) {
          assert.strictEqual(e.reason, "Not enough balance", "Transaction failed for the wrong reasons");
        } else {
          console.error(e);
          assert.fail("Transaction failed for the wrong reasons");
        }
      }
    });

    it("rejects pause from non-owner", async function() {
      try {
        await this.contract.pause({ from: david });
        assert.fail("Transaction should have failed");
      } catch (e) {
        if (e.reason) {
          assert.strictEqual(e.reason, "Can only be called by the owner", "Transaction failed for the wrong reasons");
        } else {
          console.error(e);
          assert.fail("Transaction failed for the wrong reasons");
        }
      }
    });

    it("rejects unpause from non-owner", async function() {
      await this.contract.pause({ from: alice });

      try {
        await this.contract.pause({ from: david });
        assert.fail("Transaction should have failed");
      } catch (e) {
        if (e.reason) {
          assert.strictEqual(e.reason, "Can only be called by the owner", "Transaction failed for the wrong reasons");
        } else {
          console.error(e);
          assert.fail("Transaction failed for the wrong reasons");
        }
      }
    });

    it("rejects kill() from non-owner", async function() {
      try {
        await this.contract.kill({ from: david });
        assert.fail("Transaction should have failed");
      } catch (e) {
        if (e.reason) {
          assert.strictEqual(e.reason, "Can only be called by the owner", "Transaction failed for the wrong reasons");
        } else {
          console.error(e);
          assert.fail("Transaction failed for the wrong reasons");
        }
      }
    });

    describe("copes well with more complex withdrawal sequences", () => {
      it("TODO");
    });
  });
});
