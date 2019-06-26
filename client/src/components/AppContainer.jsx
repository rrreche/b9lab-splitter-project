import React from "react";

import { Container, Row, Col } from "react-bootstrap";

import LoadingDapp from "./LoadingDapp.jsx";
import Header from "./Header.jsx";
import Operations from "./Operations.jsx";

import { DrizzleContext } from "drizzle-react";

class AppContainer extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return JSON.stringify(nextProps.drizzleState) !== JSON.stringify(this.props.drizzleState);
  }

  render() {
    return (
      <Container fluid>
        <Header />
        <hr />
        <Row>
          <Col sm={6}>
            <h4>Operations dashboard</h4>
            <Operations />
          </Col>
          <Col sm={6}>
            <h4>Events board</h4>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default () => (
  <DrizzleContext.Consumer>
    {drizzleContext => {
      const { drizzle, drizzleState, initialized } = drizzleContext;
      if (!initialized) {
        return <LoadingDapp drizzle={drizzle} drizzleState={drizzleState} />;
      }

      return <AppContainer drizzle={drizzle} drizzleState={drizzleState} />;
    }}
  </DrizzleContext.Consumer>
);
