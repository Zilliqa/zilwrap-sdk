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
    checkBalance(): Promise<any>;
    wrapZil(amount: string): Promise<Transaction>;
    getBalance(address: string): Promise<any>;
    private addHex;
    private removeHex;
}
