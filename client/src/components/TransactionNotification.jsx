import React from "react";

const TransactionNotification = props => (
  <a target="_blank" rel="noopener noreferrer" href={`https://ropsten.etherscan.io/tx/${props.hash}`}>
    Transaction on its way, see it in <strong>etherscan.io</strong>
  </a>
);

export default TransactionNotification;
