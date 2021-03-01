/// <reference types="bn.js" />
/// <reference types="long" />
import { BN, Long } from '@zilliqa-js/util';
import { TxReceipt } from '@zilliqa-js/account';
import { Network } from './constants';
/**
 * TODO: sanitize method params (address, amount, etc)
 */
export declare type Balance = {
    balance: string;
};
interface AllowanceMap {
    [key: string]: string;
}
export declare type Allowance = {
    allowances: AllowanceMap[];
};
export declare type Settings = {
    contractAddress?: string;
    gasPrice?: number;
    gasLimit?: number;
};
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
    constructor(network: Network, privateKey: string, settings?: Settings);
    init(): Promise<void>;
    /**
     * Check Allowance
     */
    checkAllowance(holder: string, approvedSpender?: string): Promise<Allowance>;
    /**
     * Check Balance
     * Retrieves wrapped tokens balance from contract
     * @param address optional checksum wallet address to check for balance. If not supplied, the default wallet address is used
     * @returns wrapped tokens balance
     */
    checkBalance(address?: string): Promise<Balance>;
    /**
     * Wrap $ZIL to particular token
     * @param amount amount to be wrapped in ZIL
     */
    wrap(amount: string): Promise<TxReceipt | undefined>;
    /**
     * Unwrap tokens and retrieve back $ZIL
     * @param amount token amount to be unwrapped
     */
    unwrap(tokenAmount: string): Promise<TxReceipt | undefined>;
    /**
     * Transfer
     * @param recipient bech32, checksum, base16 address
     * @param amount actual number of tokens (not $ZIL!)
     */
    transfer(recipient: string, amount: string): Promise<TxReceipt | undefined>;
    /**
     * TransferFrom
     * Transfer using a allowance mechanism; allowing an approved spender to transfer tokens from another user wallet (sender) to the recipient.
     * Approved spender allowance is deducted.
     * Different implementation vs Transfer().
     */
    transferFrom(sender: string, recipient: string, amount: string): Promise<TxReceipt | undefined>;
    /**
     * IncreaseAllowance
     *
     * Increase the allowance of an approved spender over the caller tokens.
     * Only token holder allowed to invoke.
     * @param spender address of the designated approved spender in bech32/checksum/base16 forms
     * @amount amount number of tokens to be increased as allowance for the approved spender
     */
    increaseAllowance(spender: string, amount: string): Promise<TxReceipt | undefined>;
    /**
     * Decrease Allowance
     */
    decreaseAllowance(spender: string, amount: string): Promise<TxReceipt | undefined>;
    private addHex;
    private removeHex;
    private sanitizeAddress;
    private sanitizeAmount;
}
export {};
