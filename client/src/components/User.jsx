import React from "react";
import { newContextComponents } from "drizzle-react-components";
import withDrizzle from "./withDrizzle.jsx";

import { Form, Row, Col } from "react-bootstrap";
import LoadingButton from "./LoadingButton";
import * as Utils from "web3-utils";
const { AccountData, ContractData } = newContextComponents;

class User extends React.Component {
  render() {
    const { drizzle, drizzleState } = this.props;
    const account = this.props.drizzleState.accounts[0];

    return (
      <div>
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
            <Form>
              <Form.Group controlId="amountToSplit">
                <Form.Row>
                  <Col xs={6}>
                    <Form.Label>Amount to split</Form.Label>
                    <Form.Control type="number" placeholder="Amount" />
                  </Col>
                  <Col xs={6}>
                    <Form.Label>Currency unit</Form.Label>
                    <Form.Control as="select">
                      <option>Ether</option>
                      <option>Wei</option>
                    </Form.Control>
                  </Col>
                </Form.Row>
              </Form.Group>

              <Form.Group controlId="recipient1">
                <Form.Label>Recipient 1</Form.Label>
                <Form.Control placeholder="Address of recipient 1: 0x..." />
              </Form.Group>

              <Form.Group controlId="recipient1">
                <Form.Label>Recipient 1</Form.Label>
                <Form.Control placeholder="Address of recipient 2: 0x..." />
              </Form.Group>

              <LoadingButton block>Split</LoadingButton>
            </Form>
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
            <LoadingButton variant="info" block>
              Withdraw
            </LoadingButton>
          </Col>
        </Row>
      </div>
    );
  }
}

export default withDrizzle(User);
