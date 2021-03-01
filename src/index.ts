//  Copyright (C) 2021 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Zilliqa } from '@zilliqa-js/zilliqa';
import { BN, Long, bytes, units, validation } from '@zilliqa-js/util';
import { Contract } from '@zilliqa-js/contract';
import { TxReceipt } from '@zilliqa-js/account';
import { getAddressFromPrivateKey, fromBech32Address } from '@zilliqa-js/crypto';
import { Network, BLOCKCHAIN_URL, WRAPPER_CONTRACT, BLOCKCHAIN_VERSIONS, GAS_LIMIT, GAS_PRICE } from './constants';

/**
 * TODO: sanitize method params (address, amount, etc)
 */

 export type Balance = {
   balance: string;
 }

 interface AllowanceMap {
   [key: string]: string
 }

 export type Allowance = {
   allowances: AllowanceMap[];
 }

export type Settings = {
  contractAddress?: string;
  gasPrice?: number;
  gasLimit?: number;
};

export type TxParams = {
  version: number;
  gasPrice: BN;
  gasLimit: Long;
};

export class Zilwrap {
  private zilliqa: Zilliqa;
  private txParams: TxParams = {
    version: 99999,
    gasPrice: new BN(GAS_PRICE),
    gasLimit: Long.fromNumber(GAS_LIMIT),
  };
  private walletAddress: string;
  private contractAddress: string; // wrapper address
  private contract: Contract;

  constructor(network: Network, privateKey: string, settings?: Settings) {
    this.zilliqa = new Zilliqa(BLOCKCHAIN_URL[network]);
    this.zilliqa.wallet.addByPrivateKey(privateKey);

    this.txParams.version = BLOCKCHAIN_VERSIONS[network];

    console.log('Added account: %o', getAddressFromPrivateKey(privateKey));
    this.walletAddress = getAddressFromPrivateKey(privateKey);
    this.contractAddress = WRAPPER_CONTRACT[network];

    // override default settings
    if (settings) {
      if (settings.contractAddress && this.sanitizeAddress(settings.contractAddress)) {
        this.contractAddress = settings.contractAddress;
      }
      if (settings.gasPrice && settings.gasPrice > 0) {
        this.txParams.gasPrice = new BN(settings.gasPrice);
      }
      if (settings.gasLimit && settings.gasLimit > 0) {
        this.txParams.gasLimit = Long.fromNumber(settings.gasLimit);
      }
    }

    this.contract = this.zilliqa.contracts.at(this.contractAddress);
  }

  // set current gas price
  public async init() {
    if (this.txParams.gasPrice.isZero()) {
      const minimumGasPrice = await this.zilliqa.blockchain.getMinimumGasPrice();
      if (!minimumGasPrice.result) {
        throw new Error('Could not get gas price');
      }
      this.txParams.gasPrice = new BN(minimumGasPrice.result);
    }
  }

  /**
   * Check Allowance
   */
  public async checkAllowance(holder: string, approvedSpender?: string) {
    const tokenHolderAddress = this.sanitizeAddress(holder);
    const state = await this.contract.getSubState('allowances', [tokenHolderAddress]);
    
    const result:Allowance = {
      allowances: [] as any
    }

    if (state === null || state.allowances === undefined || state.allowances[tokenHolderAddress] == undefined) {
      throw new Error('Could not get allowance');
    }

    if (approvedSpender === undefined) {
      result.allowances.push(state.allowances[tokenHolderAddress]);
    }

    if (approvedSpender !== undefined) {
      const approvedSpenderAddress = this.sanitizeAddress(approvedSpender);
      let allowance = "0";

      if (state.allowances[tokenHolderAddress][approvedSpenderAddress] !== undefined) {
        allowance = state.allowances[tokenHolderAddress][approvedSpenderAddress];
      }
      result.allowances.push({
        [approvedSpenderAddress]: allowance
      });
    }

    return result;
  }

  /**
   * Check Balance
   * Retrieves wrapped tokens balance from contract
   * @param address optional checksum wallet address to check for balance. If not supplied, the default wallet address is used
   * @returns wrapped tokens balance
   */
  public async checkBalance(address?: string) {
    const state = await this.contract.getSubState('balances');

    const result: Balance = {
      balance: '0'
    }

    let interestedWallet = '';
    if (address === undefined) {
      // no input, use default wallet
      interestedWallet = this.walletAddress;
    } else {
      interestedWallet = address;
    }

    const hexWalletAddress = this.sanitizeAddress(interestedWallet);
    console.log('check balance: %o', hexWalletAddress);

    if (state.balances !== undefined && state.balances[hexWalletAddress] !== undefined) {
      result.balance = state.balances[hexWalletAddress]
    }

    return result;
  }

  /**
   * Wrap $ZIL to particular token
   * @param amount amount to be wrapped in ZIL
   */
  public async wrap(amount: string): Promise<TxReceipt | undefined> {
    const amountQa = units.toQa(amount, units.Units.Zil);

    // check sufficient balance
    const balance = await this.zilliqa.blockchain.getBalance(this.removeHex(this.walletAddress));

    if (balance.result === undefined) {
      throw new Error('Could not get balance');
    }

    if (amountQa.gt(new BN(balance.result.balance))) {
      throw new Error('Insufficient $ZIL balance');
    }

    const callTx = await this.contract.call(
      'Mint',
      [],
      {
        amount: new BN(amountQa),
        ...this.txParams,
      },
      33,
      1000,
      false,
    );

    return callTx.getReceipt();
  }

  /**
   * Unwrap tokens and retrieve back $ZIL
   * @param amount token amount to be unwrapped
   */
  public async unwrap(tokenAmount: string): Promise<TxReceipt | undefined> {
    const burnAmountBN = new BN(tokenAmount);
    const balanceQuery = await this.checkBalance();
    const tokenBalanceBN = new BN(balanceQuery.balance);

    if (tokenBalanceBN.lt(burnAmountBN)) {
      throw new Error('Insufficient token balance to unwrap');
    }

    const callTx = await this.contract.call(
      'Burn',
      [
        {
          vname: 'amount',
          type: 'Uint128',
          value: `${tokenAmount}`,
        },
      ],
      {
        amount: new BN(0),
        ...this.txParams,
      },
      33,
      1000,
      false,
    );
    return callTx.getReceipt();
  }

  /**
   * Transfer
   * @param recipient bech32, checksum, base16 address
   * @param amount actual number of tokens (not $ZIL!)
   */
  public async transfer(recipient: string, amount: string): Promise<TxReceipt | undefined> {
    const recipientAddress = this.sanitizeAddress(recipient);
    const transferAmountBN = new BN(amount);
    const balanceQuery = await this.checkBalance();
    const tokenBalanceBN = new BN(balanceQuery.balance);

    if (tokenBalanceBN.lt(transferAmountBN)) {
      throw new Error('Insufficient token balance to transfer');
    }

    const callTx = await this.contract.call(
      'Transfer',
      [
        {
          vname: 'to',
          type: 'ByStr20',
          value: `${recipientAddress}`,
        },
        {
          vname: 'amount',
          type: 'Uint128',
          value: `${amount}`,
        },
      ],
      {
        amount: new BN(0),
        ...this.txParams,
      },
      33,
      1000,
      false,
    );
    return callTx.getReceipt();
  }

  /**
   * TransferFrom
   * Transfer using a allowance mechanism; allowing an approved spender to transfer tokens from another user wallet (sender) to the recipient.
   * Approved spender allowance is deducted.
   * Different implementation vs Transfer().
   */
  public async transferFrom(sender: string, recipient: string, amount: string): Promise<TxReceipt | undefined> {
    const senderAddress = this.sanitizeAddress(sender);
    const recipientAddress = this.sanitizeAddress(recipient);
    const spenderAddress = this.sanitizeAddress(this.walletAddress);

    // check allowance
    // sender is token holder
    // the one invoking is the approved spender
    const transferAmountBN = new BN(amount);
    const allowanceQuery = await this.checkAllowance(sender, spenderAddress);
    const spenderAllowanceBN = new BN(allowanceQuery.allowances[0][spenderAddress]);

    console.log('spender allowance: %o', spenderAllowanceBN.toString());

    if (spenderAllowanceBN.lt(transferAmountBN)) {
      throw new Error('Insufficient allowance to initiate transfer on behalf of token holder');
    }

    const callTx = await this.contract.call(
      'TransferFrom',
      [
        {
          vname: 'from',
          type: 'ByStr20',
          value: `${senderAddress}`,
        },
        {
          vname: 'to',
          type: 'ByStr20',
          value: `${recipientAddress}`,
        },
        {
          vname: 'amount',
          type: 'Uint128',
          value: `${amount}`,
        },
      ],
      {
        amount: new BN(0),
        ...this.txParams,
      },
      33,
      1000,
      false,
    );
    return callTx.getReceipt();
  }

  /**
   * IncreaseAllowance
   *
   * Increase the allowance of an approved spender over the caller tokens.
   * Only token holder allowed to invoke.
   * @param spender address of the designated approved spender in bech32/checksum/base16 forms
   * @amount amount number of tokens to be increased as allowance for the approved spender
   */
  public async increaseAllowance(spender: string, amount: string): Promise<TxReceipt | undefined> {
    const spenderAddress = this.sanitizeAddress(spender);

    const callTx = await this.contract.call(
      'IncreaseAllowance',
      [
        {
          vname: 'spender',
          type: 'ByStr20',
          value: `${spenderAddress}`,
        },
        {
          vname: 'amount',
          type: 'Uint128',
          value: `${amount}`,
        },
      ],
      {
        amount: new BN(0),
        ...this.txParams,
      },
      33,
      1000,
      false,
    );
    return callTx.getReceipt();
  }

  /**
   * Decrease Allowance
   */
  public async decreaseAllowance(spender: string, amount: string): Promise<TxReceipt | undefined> {
    // TODO check allowance
    const tokenHolderAddress = this.sanitizeAddress(this.walletAddress);
    const spenderAddress = this.sanitizeAddress(spender);

    const deductAmountBN = new BN(amount);
    const allowanceQuery = await this.checkAllowance(tokenHolderAddress, spenderAddress);
    const spenderAllowanceBN = new BN(allowanceQuery.allowances[0][spenderAddress]);

    if (deductAmountBN.gt(spenderAllowanceBN)) {
      throw new Error('Insufficient spender allowance to decrease');
    }

    const callTx = await this.contract.call(
      'DecreaseAllowance',
      [
        {
          vname: 'spender',
          type: 'ByStr20',
          value: `${spenderAddress}`,
        },
        {
          vname: 'amount',
          type: 'Uint128',
          value: `${amount}`,
        },
      ],
      {
        amount: new BN(0),
        ...this.txParams,
      },
      33,
      1000,
      false,
    );

    return callTx.getReceipt();
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
    if (address) {
      if (validation.isBech32(address)) {
        return fromBech32Address(address).toLowerCase();
      }

      if (validation.isAddress(address)) {
        return address.toLowerCase();
      } else {
        throw new Error('Not a valid address');
      }
    }

    throw new Error('Address is empty');
  }

  private sanitizeAmount(amount: string): string {
    // if amount is not digit, errors will show up when converting to BN
    return new BN(amount).toString();
  }
}
