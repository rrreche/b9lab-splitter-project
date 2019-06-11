import React from "react";
import AppContainer from "./components/AppContainer.jsx";
import "./App.css";

import { Drizzle, generateStore } from "drizzle";
import { DrizzleContext } from "drizzle-react";

import drizzleOptions from "./drizzleOptions";

const drizzleStore = generateStore(drizzleOptions);
const drizzle = new Drizzle(drizzleOptions, drizzleStore);

class App extends React.Component {
  render() {
    if (drizzle) {
      return (
        <DrizzleContext.Provider drizzle={drizzle}>
          <AppContainer />
        </DrizzleContext.Provider>
      );
    } else return "Loading dapp...";
  }
}

export default App;
