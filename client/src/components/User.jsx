import React from "react";
import { newContextComponents } from "drizzle-react-components";
import withDrizzle from "./withDrizzle.jsx";

import { Form, Row, Col, Toast } from "react-bootstrap";
import { AlertList } from "react-bs-notifier";

import LoadingButton from "./LoadingButton";
import * as Utils from "web3-utils";
const BN = Utils.BN;

const { AccountData, ContractData } = newContextComponents;

class User extends React.Component {
  state = {
    performingOperation: false,
    splitting: false,
    splitError: false,
    splitReason: "",
    withdrawing: false,
    alerts: []
  };

  handleSplit = e => {
    e.preventDefault();

    try {
      const { drizzle } = this.props;
      let { alerts } = this.state;
      const onConfirmation = this.handleConfirmation;
      const onError = this.handleFailedTransaction;

      let amountToSplit, currencyUnit, recipient1, recipient2;

      currencyUnit = e.target.currencyUnit.value;

      if (currencyUnit !== "Ether" && currencyUnit !== "Wei") throw new Error("bad currency unit");

      if (currencyUnit === "Ether") {
        if (isNaN(parseFloat(e.target.amountToSplit.value))) throw new Error("Invalid amount");
        amountToSplit = new BN(Utils.toWei(e.target.amountToSplit.value, "ether"));
      } else {
        console.log(parseInt(e.target.amountToSplit.value) <= 2);
        if (isNaN(parseInt(e.target.amountToSplit.value)) || parseInt(e.target.amountToSplit.value) < 2)
          throw new Error("Invalid amount");
        amountToSplit = new BN(e.target.amountToSplit.value);
      }

      if (amountToSplit.lte(new BN("0"))) throw new Error("Amount must be greater than 0");

      recipient1 = e.target.recipient1.value;

      if (Utils.isAddress(recipient1) === false) throw new Error("Bad address on recipient 1");

      recipient2 = e.target.recipient2.value;

      if (Utils.isAddress(recipient2) === false) throw new Error("Bad address on recipient 2");

      this.setState({ performingOperation: true, splitting: true });

      drizzle.contracts.Splitter.methods
        .splitEther(recipient1, recipient2)
        .send({ value: amountToSplit })
        .on("confirmation", onConfirmation)
        .on("error", onError);
    } catch (e) {
      this.setState({ splitError: true, splitReason: e.message });
    }
  };

  handleWithdraw = () => {
    const { drizzle, drizzleState } = this.props;
    const onConfirmation = this.handleConfirmation;
    const onError = this.handleFailedTransaction;

    this.setState({ performingOperation: true, withdrawing: true });

    const withdrawAmount = drizzle.contracts.Splitter.methods
      .balances(drizzleState.accounts["0"])
      .call()
      .then(amount => {
        return drizzle.contracts.Splitter.methods
          .withdrawEther(amount)
          .send()
          .on("confirmation", onConfirmation)
          .on("error", onError);
      })
      .catch(onError);
  };

  closeSplitToast = () => {
    this.setState({ splitError: false });
  };

  closeAlerts = () => {
    this.setState({ alerts: [] });
  };

  handleConfirmation = (confirmationNumber, receipt) => {
    let { alerts } = this.state;

    if (confirmationNumber === 0) {
      alerts.push({ id: alerts.length, type: "info", message: "Transaction successful, waiting 2 confirmations" });
    }

    if (confirmationNumber === 2) {
      alerts.push({ id: alerts.length, type: "success", message: "Transaction confirmed" });
      this.setState({ performingOperation: false, splitting: false, withdrawing: false, alerts });
    }
  };

  handleFailedTransaction = error => {
    console.error(error);

    let { alerts } = this.state;

    alerts.push({
      id: alerts.length,
      type: "danger",
      message: "Something went wrong"
    });
    this.setState({ performingOperation: false, withdrawing: false, alerts });
  };

  render() {
    const { drizzle, drizzleState } = this.props;
    const account = this.props.drizzleState.accounts[0];

    const { performingOperation, splitting, withdrawing, splitError, splitReason, alerts } = this.state;

    return (
      <div>
        <AlertList alerts={alerts} onDismiss={this.closeAlerts} timeout={3000} />
        <Row>
          <Col xs={12}>
            You have{" "}
            <b>
              <AccountData
                drizzle={drizzle}
                drizzleState={drizzleState}
                accountIndex={0}
                units="ether"
                precision={3}
                render={({ address, balance, units }) => `${balance}`}
              />
            </b>{" "}
            Ξ
          </Col>
        </Row>
        <hr />
        <h4>Split ether</h4>
        <Row>
          <Col xs={12}>
            <Form onSubmit={e => this.handleSplit(e)}>
              <Form.Row>
                <Col xs={6}>
                  <Form.Group controlId="amountToSplit">
                    <Form.Label>Amount to split</Form.Label>
                    <Form.Control placeholder="Amount" />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group controlId="currencyUnit">
                    <Form.Label>Currency unit</Form.Label>
                    <Form.Control as="select">
                      <option>Ether</option>
                      <option>Wei</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Form.Row>

              <Form.Group controlId="recipient1">
                <Form.Label>Recipient 1</Form.Label>
                <Form.Control placeholder="Address of recipient 1: 0x..." />
              </Form.Group>

              <Form.Group controlId="recipient2">
                <Form.Label>Recipient 2</Form.Label>
                <Form.Control placeholder="Address of recipient 2: 0x..." />
              </Form.Group>

              <LoadingButton type="submit" disabled={performingOperation} loading={splitting} block>
                Split
              </LoadingButton>
            </Form>

            <br />

            <Toast onClose={this.closeSplitToast} show={splitError} delay={5000} autohide>
              <Toast.Header>
                <strong className="mr-auto text-danger">That's an error</strong>
              </Toast.Header>
              <Toast.Body className="text-danger">{splitReason}</Toast.Body>
            </Toast>
          </Col>
        </Row>

        <hr />
        <h4>Withdraw ether</h4>
        <Row className="align-items-center">
          <Col sm={6}>
            You can withdraw{" "}
            <b>
              <ContractData
                drizzle={drizzle}
                drizzleState={drizzleState}
                contract="Splitter"
                method="balances"
                methodArgs={[account]}
                render={displayData => {
                  return Utils.fromWei(`${displayData}`, "ether");
                }}
              />{" "}
            </b>
            Ξ
          </Col>
          <Col sm={6}>
            <LoadingButton
              onClick={this.handleWithdraw}
              type="submit"
              disabled={performingOperation}
              loading={withdrawing}
              variant="info"
              block
            >
              Withdraw
            </LoadingButton>
          </Col>
        </Row>
      </div>
    );
  }
}

export default withDrizzle(User);
