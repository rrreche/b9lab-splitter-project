import React from "react";
import { DrizzleContext } from "drizzle-react";

function withDrizzle(WrappedComponent) {
  return class extends React.Component {
    render() {
      return (
        <DrizzleContext.Consumer>
          {drizzleContext => {
            const { drizzle, drizzleState, initialized } = drizzleContext;

            if (!initialized) {
              return "Loading...";
            }

            return <WrappedComponent drizzle={drizzle} drizzleState={drizzleState} {...this.props} />;
          }}
        </DrizzleContext.Consumer>
      );
    }
  };
}

export default withDrizzle;
