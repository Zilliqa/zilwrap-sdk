/// <reference types="bn.js" />
/// <reference types="long" />
import { BN, Long } from '@zilliqa-js/util';
import { TxReceipt } from '@zilliqa-js/account';
import { Network } from './constants';
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
    private readonly zilliqa;
    private readonly txParams;
    private readonly walletAddress;
    private readonly contractAddress;
    private readonly contract;
    constructor(network: Network, privateKey: string, settings?: Settings);
    /**
     * Init
     *
     * Set current gas price
     */
    init(): Promise<void>;
    /**
     * Check Allowance
     *
     * Retrieves the allowable tokens available for a list of approved spender or a particular approved spender.
     * @param holder          token holder address in either bech32/checksum/base16 format
     * @param approvedSpender optional approved spender address in either bech32/checksum/base16 format
     * @returns JSON map containing the allowance mapping
     */
    checkAllowance(holder: string, approvedSpender?: string): Promise<Allowance>;
    /**
     * Check Balance
     *
     * Retrieves wrapped tokens balance from contract
     * @param address optional checksum wallet address to check for balance. If not supplied, the default wallet address is used
     * @returns wrapped tokens balance
     */
    checkBalance(address?: string): Promise<Balance>;
    /**
     * Wrap
     *
     * Wrap $ZIL to particular token
     * @param amount amount to be wrapped in ZIL
     * @returns transaction receipt
     */
    wrap(amount: string): Promise<TxReceipt | undefined>;
    /**
     * Unwrap
     *
     * Unwrap tokens and retrieve back $ZIL
     * @param tokenAmount token amount to be unwrapped
     * @returns transaction receipt
     */
    unwrap(tokenAmount: string): Promise<TxReceipt | undefined>;
    /**
     * Transfer
     *
     * Transfer the ZRC2 tokens to another wallet.
     * @param recipient bech32, checksum, base16 address
     * @param amount    actual number of tokens (not $ZIL!)
     * @returns transaction receipt
     */
    transfer(recipient: string, amount: string): Promise<TxReceipt | undefined>;
    /**
     * TransferFrom
     *
     * Transfer using a allowance mechanism; allowing an approved spender to transfer tokens from another user wallet (sender) to the recipient.
     * Approved spender allowance is deducted.
     * Different implementation vs Transfer().
     * @param sender    token holder wallet address to transfer from
     * @param recipient recipient wallet address in either bech32/checksum/base16 format to transfer the ZRC2 tokens to.
     * @param amount    number of ZRC2 tokens to transfer
     * @returns transaction receipt
     */
    transferFrom(sender: string, recipient: string, amount: string): Promise<TxReceipt | undefined>;
    /**
     * IncreaseAllowance
     *
     * Increase the allowance of an approved spender over the caller tokens.
     * Only token holder allowed to invoke.
     * @param spender address of the designated approved spender in bech32/checksum/base16 forms
     * @amount amount number of tokens to be increased as allowance for the approved spender
     * @returns transaction receipt
     */
    increaseAllowance(spender: string, amount: string): Promise<TxReceipt | undefined>;
    /**
     * Decrease Allowance
     *
     * Decrease the allowance of an approved spender. Only the token holder is allowed to invoke.
     * @param spender address of the designated approved spender in bech32/checksum/base16 format.
     * @param amount  number of ZRC2 tokens allowance to deduct from the approved spender.
     * @returns transaction receipt
     */
    decreaseAllowance(spender: string, amount: string): Promise<TxReceipt | undefined>;
    private removeHex;
    private isContainsAlphabets;
    private sanitizeAddress;
    private sanitizeAmountBN;
}
export {};
