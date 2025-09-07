// AptosWalletProvider.js - ENHANCED WITH ERROR HANDLING
import React, { useMemo } from "react";
import {
  AptosWalletAdapterProvider,
  NetworkName,
} from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";

export const AptosWalletProvider = ({ children }) => {
  const wallets = useMemo(() => [new PetraWallet()], []);

  const handleError = (error) => {
    console.warn("Wallet adapter error (handled):", error);
    // Don't throw errors for common wallet issues
    if (error?.message?.includes("status")) {
      console.log(
        "Status check error - this is normal during wallet initialization"
      );
      return;
    }
    if (error?.message?.includes("undefined")) {
      console.log("Undefined object error - wallet may not be ready");
      return;
    }
    // Only log other errors, don't crash the app
    console.log("Other wallet error:", error);
  };

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={false}
      dappConfig={{
        network: NetworkName.Testnet,
        aptosApiKey: "aptoslabs_JgcKEDCKb3A_8ou7w2RQLoMBcNz4Z8fmGCnjCz7QmobTe",
      }}
      onError={handleError}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};

export default AptosWalletProvider;
