/// <reference types="bn.js" />
/// <reference types="long" />
import { BN, Long } from "@zilliqa-js/util";
import { Transaction } from "@zilliqa-js/account";
import { Network } from "./constants";
export declare type TxParams = {
    version: number;
    gasPrice: BN;
    gasLimit: Long;
};
export declare class Zilwrap {
    private zilliqa;
    private txParams;
    private walletAddress;
    private contractAddress;
    private contract;
    constructor(network: Network, privateKey: string);
    /**
     * Check Allowance
     */
    checkAllowance(): void;
    /**
     * Check Balance
     * @param address optional checksum wallet address to check for balance. If not supplied, checks the default wallet address
     */
    checkBalance(address?: string): Promise<any>;
    /**
     * Wrap $ZIL to particular token
     * @param amount amount to be wrapped in ZIL
     */
    wrap(amount: string): Promise<Transaction>;
    /**
     * Unwrap tokens and retrieve back $ZIL
     * @param amount token amount to be unwrapped
     */
    unwrap(tokenAmount: string): Promise<Transaction>;
    /**
     * Transfer
     * @param recipient bech32, checksum, base16 address
     * @param amount actual number of tokens (not $ZIL!)
     */
    transfer(recipient: string, amount: string): Promise<Transaction>;
    /**
     * TransferFrom
     */
    transferFrom(): void;
    /**
     * IncreaseAllowance
     */
    increaseAllowance(): void;
    /**
     * Reduce Allowance
     */
    reduceAllowance(): void;
    getBalance(address: string): Promise<any>;
    private addHex;
    private removeHex;
    private sanitizeAddress;
    private sanitizeAmount;
}
