import { Zilliqa } from "@zilliqa-js/zilliqa";
import { BN, Long, bytes, units } from "@zilliqa-js/util";
import { Contract } from "@zilliqa-js/contract";
import { Transaction } from "@zilliqa-js/account";
import { getAddressFromPrivateKey } from '@zilliqa-js/crypto';
import { Network, BLOCKCHAIN_URL, WRAPPER_CONTRACT, BLOCKCHAIN_VERSIONS, GAS_LIMIT } from "./constants";

export type TxParams = {
    version: number,
    gasPrice: BN,
    gasLimit: Long,
}

export class Zilwrap {
    private zilliqa: Zilliqa;
    private txParams: TxParams = {
        version: 99999,
        gasPrice: new BN(0),
        gasLimit: Long.fromNumber(GAS_LIMIT),
    };
    private walletAddress: string;
    private contractAddress: string; // wrapper address
    private contract: Contract;


    constructor(network: Network, privateKey: string) {
        this.zilliqa = new Zilliqa(BLOCKCHAIN_URL[network]);
        this.zilliqa.wallet.addByPrivateKey(privateKey);

        this.txParams.version = BLOCKCHAIN_VERSIONS[network];
        this.txParams.gasPrice = new BN('2000000000000');

        console.log('Added account: %o', getAddressFromPrivateKey(privateKey));
        this.walletAddress = this.removeHex(getAddressFromPrivateKey(privateKey));
        this.contractAddress = WRAPPER_CONTRACT[network];
        this.contract = this.zilliqa.contracts.at(this.contractAddress);
    }


    /**
     * Check Allowance
     */
    public checkAllowance() {
        // TODO
    }

    /**
     * Check Balance
     */
    // get wrapped tokens balance from contract
    // returns wrapped tokens balance in Qa
    public async checkBalance() {
        try {
            const state = await this.contract.getSubState("balances");
            const hexWalletAddress = this.addHex(this.walletAddress);

            if (state.balances[hexWalletAddress] === undefined) {
                throw new Error("No wallet found");
            }

            return state.balances[hexWalletAddress];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Wrap $ZIL to particular token
     * @param amount amount to be wrapped in ZIL
     */
    public async wrapZil(amount: string):Promise<Transaction> {
        try {
            const amountQa = units.toQa(amount, units.Units.Zil);

            // check sufficient balance
            const balance = await this.zilliqa.blockchain.getBalance(this.walletAddress);

            if (balance.result === undefined) {
                throw new Error("Could not get balance");
            }

            if (amountQa.gt(new BN(balance.result.balance))) {
                throw new Error("Insufficient balance");
            }

            const callTx = await this.contract.call(
                'Mint',
                [],
                {
                    amount: new BN(amountQa),
                    ...this.txParams
                },
                33,
                1000,
                false,
            );
            return callTx;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Unwrap tokens and retrieve back $ZIL
     */
    public unwrapZil() {
        // TODO
        
    }

    /**
     * Transfer
     */
    public transfer() {
        // TODO
    }

    /**
     * TransferFrom
     */
    public transferFrom() {
        // TODO
    }

    /**
     * IncreaseAllowance
     */
    public increaseAllowance() {
        // TODO
    }

    /**
     * Reduce Allowance
     */
    public reduceAllowance() {
        // TODO
    }

    public async getBalance(address: string) {
        const balance = await this.zilliqa.blockchain.getBalance(address);
        return balance.result;
    }

    private addHex(address: string): string {
        if (address.startsWith('0x')) {
            return address.toLowerCase();
        }
        return `0x${address}`;
    }

    private removeHex(address: string): string {
        if (address.startsWith('0x')) {
            return address.replace('0x', '').toLowerCase();
        }
        return address.toLowerCase();
    }
}
