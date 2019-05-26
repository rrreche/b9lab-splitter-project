const Splitter = artifacts.require("./Splitter.sol");
const utils = require("web3-utils");
const BN = utils.BN;
const checkEvent = require("./helpers/checkEvent");

contract("Splitter", accounts => {
  before("define Alice, Bob and Carol", () => {
    this.Alice = accounts[0];
    this.Bob = accounts[1];
    this.Carol = accounts[2];
    this.Mallory = accounts[3];
  });

  beforeEach("initialize contract", async () => {
    this.contract = await Splitter.new(false, {
      from: this.Alice
    });
  });

  describe("Contract initialization", () => {
    it("assigns the owner correctly", async () => {
      const owner = await this.contract.getOwner();
      assert.equal(owner, this.Alice);
    });
  });

  describe("Owner actions", () => {
    it("allows to pause the contract", async () => {
      const tx = await this.contract.pause({ from: this.Alice });

      checkEvent({
        logs: tx.logs,
        name: "LogPause",
        params: [{ name: "state", val: true }]
      });

      const isPaused = await this.contract.isPaused();

      assert.equal(isPaused, true, "Contract is not paused");
    });

    it("allows to transfer ownership", async () => {
      const tx = await this.contract.setOwner(this.Bob, { from: this.Alice });

      checkEvent({
        logs: tx.logs,
        name: "LogOwnerChange",
        params: [{ name: "owner", val: this.Bob }]
      });

      const owner = await this.contract.getOwner();

      assert.equal(owner, this.Bob, "New owner was not set");
    });

    it("allows to kill the contract", async () => {
      await this.contract.pause({ from: this.Alice });
      const tx = await this.contract.kill({ from: this.Alice });

      checkEvent({
        logs: tx.logs,
        name: "LogKill",
        params: [{ name: "sender", val: this.Alice }]
      });

      const isDead = await this.contract.isDead();

      assert.equal(isDead, true, "Contract is not dead");
    });

    describe("When paused", () => {
      beforeEach("Pause the contract", async () => {
        await this.contract.pause({ from: this.Alice });
      });

      it("Rejects pausing again", async () => {
        try {
          await this.contract.pause({ from: this.Alice });
          assert.fail("Transaction should have failed");
        } catch (e) {
          if (e.reason) {
            assert.equal(
              e.reason,
              "The contract is paused",
              "Transaction failed for the wrong reasons"
            );
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
      it("splits the amount between receivers correctly and updates balances", async () => {
        const sentBalance = new BN(utils.toWei("1", "ether"));
        const tx = await this.contract.splitEther(this.Bob, this.Carol, {
          from: this.Alice,
          value: sentBalance.toString()
        });

        assert.ok(tx.receipt.status, "Transaction did not go through");

        const contractBalance = await web3.eth.getBalance(
          this.contract.address
        );

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
          "Balance was not split equally"
        );

        const bnTwo = new BN("2");

        assert.equal(
          sentBalance.div(bnTwo).toString(),
          bobBalance.toString(),
          "Balance was not split into two"
        );

        checkEvent({
          logs: [tx.logs[0]],
          name: "LogBalanceIncrease",
          params: [
            { name: "sender", val: this.Alice },
            { name: "receiver", val: this.Bob },
            { name: "amount", val: sentBalance.div(bnTwo) }
          ]
        });

        checkEvent({
          logs: [tx.logs[1]],
          name: "LogBalanceIncrease",
          params: [
            { name: "sender", val: this.Alice },
            { name: "receiver", val: this.Carol },
            { name: "amount", val: sentBalance.div(bnTwo) }
          ]
        });
      });

      it("assigns back the remainder to the sender if amount is odd", async () => {
        const sentBalance = new BN("3");
        const tx = await this.contract.splitEther(this.Bob, this.Carol, {
          from: this.Alice,
          value: sentBalance.toString()
        });

        const aliceBalance = await this.contract.balances(this.Alice);

        assert.equal(
          aliceBalance.toString(),
          new BN("1").toString(),
          "Odd amounts do not credit remainder to sender"
        );

        checkEvent({
          logs: [tx.logs[2]],
          name: "LogBalanceIncrease",
          params: [
            { name: "sender", val: this.Alice },
            { name: "receiver", val: this.Alice },
            { name: "amount", val: new BN("1") }
          ]
        });
      });
    });

    it("allows users to withdraw their ether", async () => {
      const sentBalance = new BN(utils.toWei("1", "ether"));

      await this.contract.splitEther(this.Bob, this.Carol, {
        from: this.Alice,
        value: sentBalance.toString()
      });

      const oldBobBalance = new BN(await web3.eth.getBalance(this.Bob));
      const withdrawAmount = new BN(utils.toWei("0.5", "ether"));

      const result = await this.contract.withdrawEther(withdrawAmount, {
        from: this.Bob
      });

      const transaction = await web3.eth.getTransaction(result.tx);

      const txFee = new BN(
        String(result.receipt.gasUsed * transaction.gasPrice)
      );

      assert.ok(result.receipt.status, "Transaction did not go through");

      const newBobBalance = new BN(await web3.eth.getBalance(this.Bob));

      assert.equal(
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
        params: [
          { name: "sender", val: this.Bob },
          { name: "amount", val: withdrawAmount }
        ]
      });
    });
  });

  describe("TODO Dishonest / bad behaviours", () => {
    it("rejects to withdraw more ether than is allowed", async () => {
      const amountToSplit = new BN(utils.toWei("1", "ether"));
      await this.contract.splitEther(this.Bob, this.Carol, {
        value: amountToSplit.toString()
      });

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
            "Not enough balance",
            "Transaction failed for the wrong reasons"
          );
        } else {
          console.error(e);
          assert.fail("Transaction failed for the wrong reasons");
        }
      }
    });

    it("rejects pause from non-owner", async () => {
      try {
        await this.contract.pause({ from: this.Mallory });
        assert.fail("Transaction should have failed");
      } catch (e) {
        if (e.reason) {
          assert.equal(
            e.reason,
            "Can only be called by the owner",
            "Transaction failed for the wrong reasons"
          );
        } else {
          console.error(e);
          assert.fail("Transaction failed for the wrong reasons");
        }
      }
    });

    it("rejects unpause from non-owner", async () => {
      await this.contract.pause({ from: this.Alice });

      try {
        await this.contract.pause({ from: this.Mallory });
        assert.fail("Transaction should have failed");
      } catch (e) {
        if (e.reason) {
          assert.equal(
            e.reason,
            "Can only be called by the owner",
            "Transaction failed for the wrong reasons"
          );
        } else {
          console.error(e);
          assert.fail("Transaction failed for the wrong reasons");
        }
      }
    });

    it("rejects kill() from non-owner", async () => {
      try {
        await this.contract.kill({ from: this.Mallory });
        assert.fail("Transaction should have failed");
      } catch (e) {
        if (e.reason) {
          assert.equal(
            e.reason,
            "Can only be called by the owner",
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
