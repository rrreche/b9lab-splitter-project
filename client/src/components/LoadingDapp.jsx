import React from "react";
import { Modal, Spinner } from "react-bootstrap";

const SplitterContract = require("./../contracts/Splitter.json");

class LoadingDapp extends React.Component {
  state = {
    networkOK: true,
    network: null,
    networks: []
  };

  checkNetworkStatus() {
    const { drizzle } = this.props;

    try {
      let networks = [];

      for (let network in SplitterContract.networks) {
        networks.push(parseInt(network));
      }

      this.setState({ networks });

      drizzle.web3.eth.net
        .getId()
        .then(id => {
          if (networks.includes(id)) this.setState({ network: id, networkOK: true });
          else this.setState({ network: id, networkOK: false });
        })
        .catch(error => {
          console.error(error);
          this.setState({ networkOK: false });
        });
    } catch (e) {
      console.error(e);
      this.setState({ networkOK: false });
    }
  }

  componentDidMount() {
    this.interval = setInterval(() => this.checkNetworkStatus(), 2000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  warningText = () => {
    const { network, networks } = this.state;

    return (
      <div>
        <p className="text-warning">
          <i className="fas fa-exclamation-triangle" /> Please switch to Ropsten Test Network in Metamask, or to your
          local development network
        </p>

        <p>Contract is deployed in: {networks.toString().replace(",", ", ")}</p>
        <p>
          You are currently connected to: <b>{network ? network : "Unknown"}</b>
        </p>
      </div>
    );
  };

  render() {
    const { networkOK } = this.state;

    return (
      <Modal show={true} size="lg" aria-labelledby="contained-modal-title-vcenter" centered backdrop="static">
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter" className="w-100 text-center">
            Loading Dapp
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Please wait while we set you up</p>
          <Spinner animation="grow" variant="primary" />
          <Spinner animation="grow" variant="success" />
          <Spinner animation="grow" variant="danger" />
          <Spinner animation="grow" variant="warning" />
          <Spinner animation="grow" variant="info" />

          {networkOK === true ? <p>Please, allow the app to access Metamask</p> : this.warningText()}
        </Modal.Body>
      </Modal>
    );
  }
}

export default LoadingDapp;
