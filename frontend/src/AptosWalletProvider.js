// AptosWalletProvider.js - WORKING VERSION WITH CORRECT IMPORTS
import React, { useMemo } from "react";
import {
  AptosWalletAdapterProvider,
  NetworkName,
} from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";

export const AptosWalletProvider = ({ children }) => {
  const wallets = useMemo(() => [new PetraWallet()], []);

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      dappConfig={{
        network: NetworkName.Testnet,
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};

export default AptosWalletProvider;
