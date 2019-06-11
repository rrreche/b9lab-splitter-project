import React from "react";
import { Modal, Spinner } from "react-bootstrap";

class LoadingDapp extends React.Component {
  state = {
    networkOK: true
  };

  checkNetworkStatus() {
    const { drizzle } = this.props;
    try {
      drizzle.web3.eth.net.getId().then(id => {
        if (id === 3) this.setState({ networkOK: true });
        else this.setState({ networkOK: false });
      });
    } catch (e) {
      console.error(e);
    }
  }

  componentDidMount() {
    this.interval = setInterval(() => this.checkNetworkStatus(), 2000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

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

          {networkOK === true ? (
            <p>Please, allow the app to access Metamask</p>
          ) : (
            <p className="text-warning">
              <i className="fas fa-exclamation-triangle" /> Please switch to Ropsten Test Network in Metamask
            </p>
          )}
        </Modal.Body>
      </Modal>
    );
  }
}

export default LoadingDapp;
