import React from "react";
import withDrizzle from "./withDrizzle";

import { Navbar } from "react-bootstrap";

class Header extends React.Component {
  state = {
    paused: false,
    dead: false,
    address: ""
  };

  componentDidMount() {
    const { drizzle } = this.props;
    const contract = drizzle.contracts.Splitter;

    // get and save the key for the variable we are interested in
    const paused = contract.methods["isPaused"].cacheCall() !== "0x0";
    const dead = contract.methods["isDead"].cacheCall() !== "0x0";
    const address = contract.address;
    this.setState({ paused, dead, address });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      JSON.stringify(nextProps.drizzleState.accounts) !== JSON.stringify(this.props.drizzleState.accounts) ||
      JSON.stringify(nextState) !== JSON.stringify(this.state)
    );
  }

  render() {
    const { accounts } = this.props.drizzleState;
    const { paused, dead, address } = this.state;

    return (
      <Navbar>
        <Navbar.Brand>Splitter contract</Navbar.Brand>
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text>
            {accounts && accounts["0"] ? `Your account: ${accounts["0"]}` : null}
            <br />
            Contract address: {address ? `${address}` : <span className="text-danger">Could not get address</span>}
            <br />
            Contract status: {paused === false && dead === false && <span className="text-success">OK!</span>}
            {paused === true && dead === false && <span className="text-warning">Paused</span>}
            {dead === true && (
              <span className="text-danger">
                <b>Dead</b>
              </span>
            )}
          </Navbar.Text>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

export default withDrizzle(Header);
