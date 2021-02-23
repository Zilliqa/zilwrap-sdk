import { Zilliqa } from "@zilliqa-js/zilliqa";
import { BN, Long, bytes, units, validation } from "@zilliqa-js/util";
import { Contract } from "@zilliqa-js/contract";
import { Transaction } from "@zilliqa-js/account";
import { getAddressFromPrivateKey, fromBech32Address } from '@zilliqa-js/crypto';
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
        this.walletAddress = getAddressFromPrivateKey(privateKey);
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
     * @param address optional checksum wallet address to check for balance. If not supplied, checks the default wallet address
     */
    // get wrapped tokens balance from contract
    // returns wrapped tokens balance in Qa
    public async checkBalance(address?: string) {
        try {
            const state = await this.contract.getSubState("balances");
            
            let interestedWallet = "";
            if (address === undefined) {
                // no input, use default wallet
                interestedWallet = this.walletAddress;
            } else {
                interestedWallet = address;
            }

            const hexWalletAddress = this.sanitizeAddress(interestedWallet);

            if (state.balances[hexWalletAddress] === undefined) {
                return '0';
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
    public async wrap(amount: string):Promise<Transaction> {
        try {
            const amountQa = units.toQa(amount, units.Units.Zil);

            // check sufficient balance
            const balance = await this.zilliqa.blockchain.getBalance(this.removeHex(this.walletAddress));

            if (balance.result === undefined) {
                throw new Error("Could not get balance");
            }

            if (amountQa.gt(new BN(balance.result.balance))) {
                throw new Error("Insufficient $ZIL balance");
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
     * @param amount token amount to be unwrapped
     */
    public async unwrap(tokenAmount: string):Promise<Transaction> {
        try {
            const burnAmountBN = new BN(tokenAmount);
            const tokenBalance = await this.checkBalance();
            const tokenBalanceBN = new BN(tokenBalance);

            if (tokenBalanceBN.lt(burnAmountBN)) {
                throw new Error("Insufficient token balance to unwrap");
            }

            const callTx = await this.contract.call(
                'Burn',
                [
                    {
                        vname: 'amount',
                        type: 'Uint128',
                        value: `${tokenAmount}`
                    }
                ],
                {
                    amount: new BN(0),
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
     * Transfer
     * @param recipient bech32, checksum, base16 address
     * @param amount actual number of tokens (not $ZIL!)
     */
    public async transfer(recipient: string, amount: string) {
        try {
            const recipientAddress = this.sanitizeAddress(recipient);
            const transferAmountBN = new BN(amount);
            const tokenBalance = await this.checkBalance();
            const tokenBalanceBN = new BN(tokenBalance);

            if (tokenBalanceBN.lt(transferAmountBN)) {
                throw new Error("Insufficient token balance to transfer");
            }

            const callTx = await this.contract.call(
                'Transfer',
                [
                    {
                        vname: 'to',
                        type: 'ByStr20',
                        value: `${recipientAddress}`
                    },
                    {
                        vname: 'amount',
                        type: 'Uint128',
                        value: `${amount}`
                    }
                ],
                {
                    amount: new BN(0),
                    ...this.txParams
                },
                33,
                1000,
                false
            );
            return callTx;
        } catch (err) {
            throw err;
        }
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

    private sanitizeAddress(address: string): string {
        if (validation.isBech32(address)) {
            return fromBech32Address(address).toLowerCase();
        }
        
        if (validation.isAddress(address)) {
            return address.toLowerCase();
        } else {
            throw new Error('Not a valid address');
        }
    }

    private sanitizeAmount(amount: string): string {
        // if amount is not digit, errors will show up when converting to BN
        return new BN(amount).toString();
    }
}
