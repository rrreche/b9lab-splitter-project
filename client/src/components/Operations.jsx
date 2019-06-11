import React from "react";

import { Accordion, Card } from "react-bootstrap";
import User from "./User.jsx";
import Owner from "./Owner.jsx";

class Operations extends React.Component {
  state = {
    activeDashboard: "0"
  };

  onClickToggle = (activeDashboard, event) => {
    this.setState({ activeDashboard });
  };

  render() {
    return (
      <Accordion activeKey={this.state.activeDashboard}>
        <Card>
          <Accordion.Toggle as={Card.Header} eventKey="0" onClick={event => this.onClickToggle("0")}>
            User operations
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              <User />
            </Card.Body>
          </Accordion.Collapse>
        </Card>
        <Card>
          <Accordion.Toggle as={Card.Header} eventKey="1" onClick={event => this.onClickToggle("1")}>
            Admin operations
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="1">
            <Card.Body>
              <Owner />
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    );
  }
}

export default Operations;
