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
import { BN, Long, units, validation } from '@zilliqa-js/util';
import { Contract } from '@zilliqa-js/contract';
import { TxReceipt } from '@zilliqa-js/account';
import { getAddressFromPrivateKey, fromBech32Address } from '@zilliqa-js/crypto';
import { Network, BLOCKCHAIN_URL, WRAPPER_CONTRACT, BLOCKCHAIN_VERSIONS, GAS_LIMIT, GAS_PRICE } from './constants';

export type Balance = {
  balance: string;
};

interface AllowanceMap {
  [key: string]: string;
}

export type Allowance = {
  allowances: AllowanceMap[];
};

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
  private readonly zilliqa: Zilliqa;
  private readonly txParams: TxParams = {
    version: 99999,
    gasPrice: new BN(GAS_PRICE),
    gasLimit: Long.fromNumber(GAS_LIMIT),
  };
  private readonly walletAddress: string;
  private readonly contractAddress: string; // wrapper address
  private readonly contract: Contract;

  constructor(network: Network, privateKey: string, settings?: Settings) {
    this.zilliqa = new Zilliqa(BLOCKCHAIN_URL[network]);
    this.zilliqa.wallet.addByPrivateKey(privateKey);

    this.txParams.version = BLOCKCHAIN_VERSIONS[network];

    this.walletAddress = getAddressFromPrivateKey(privateKey);
    this.contractAddress = WRAPPER_CONTRACT[network];

    // override default settings
    if (settings) {
      if (network === Network.Isolated && settings.contractAddress && this.sanitizeAddress(settings.contractAddress)) {
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

  /**
   * Init
   *
   * Set current gas price
   */
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
   *
   * Retrieves the allowable tokens available for a list of approved spender or a particular approved spender.
   * @param holder          token holder address in either bech32/checksum/base16 format
   * @param approvedSpender optional approved spender address in either bech32/checksum/base16 format
   * @returns JSON map containing the allowance mapping
   */
  public async checkAllowance(holder: string, approvedSpender?: string) {
    const tokenHolderAddress = this.sanitizeAddress(holder);
    const state = await this.contract.getSubState('allowances', [tokenHolderAddress]);

    const result: Allowance = {
      allowances: [] as AllowanceMap[],
    };

    if (state === null || state.allowances === undefined || state.allowances[tokenHolderAddress] == undefined) {
      throw new Error('Could not get allowance');
    }

    if (approvedSpender === undefined) {
      result.allowances.push(state.allowances[tokenHolderAddress]);
    }

    if (approvedSpender !== undefined) {
      const approvedSpenderAddress = this.sanitizeAddress(approvedSpender);
      let allowance = '0';

      if (state.allowances[tokenHolderAddress][approvedSpenderAddress] !== undefined) {
        allowance = state.allowances[tokenHolderAddress][approvedSpenderAddress];
      }
      result.allowances.push({
        [approvedSpenderAddress]: allowance,
      });
    }

    return result;
  }

  /**
   * Check Balance
   *
   * Retrieves wrapped tokens balance from contract
   * @param address optional checksum wallet address to check for balance. If not supplied, the default wallet address is used
   * @returns wrapped tokens balance
   */
  public async checkBalance(address?: string) {
    const state = await this.contract.getSubState('balances');

    const result: Balance = {
      balance: '0',
    };

    let interestedWallet = '';
    if (address === undefined) {
      // no input, use default wallet
      interestedWallet = this.walletAddress;
    } else {
      interestedWallet = address;
    }

    const hexWalletAddress = this.sanitizeAddress(interestedWallet);

    if (state.balances !== undefined && state.balances[hexWalletAddress] !== undefined) {
      result.balance = state.balances[hexWalletAddress];
    }

    return result;
  }

  /**
   * Wrap
   *
   * Wrap $ZIL to particular token
   * @param amount amount to be wrapped in ZIL
   * @returns transaction receipt
   */
  public async wrap(amount: string): Promise<TxReceipt | undefined> {
    if (this.isContainsAlphabets(amount)) {
      throw new Error(`Not a valid amount for Amount: ${amount}`);
    }

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
   * Unwrap
   *
   * Unwrap tokens and retrieve back $ZIL
   * @param tokenAmount token amount to be unwrapped
   * @returns transaction receipt
   */
  public async unwrap(tokenAmount: string): Promise<TxReceipt | undefined> {
    const burnAmountBN = this.sanitizeAmountBN(tokenAmount);
    const balanceQuery = await this.checkBalance();
    const tokenBalanceBN = new BN(balanceQuery.balance);

    if (tokenBalanceBN.lt(burnAmountBN)) {
      throw new Error(
        `Insufficient token balance to unwrap. Required: ${tokenAmount}, Current token balance: ${tokenBalanceBN.toString()}.`,
      );
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
   *
   * Transfer the ZRC2 tokens to another wallet.
   * @param recipient bech32, checksum, base16 address
   * @param amount    actual number of tokens (not $ZIL!)
   * @returns transaction receipt
   */
  public async transfer(recipient: string, amount: string): Promise<TxReceipt | undefined> {
    const recipientAddress = this.sanitizeAddress(recipient);
    const transferAmountBN = this.sanitizeAmountBN(amount);
    const balanceQuery = await this.checkBalance();
    const tokenBalanceBN = new BN(balanceQuery.balance);

    if (tokenBalanceBN.lt(transferAmountBN)) {
      throw new Error(`Insufficient token balance to transfer. Required: ${amount}, Current token balance: ${tokenBalanceBN.toString()}.`);
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
   *
   * Transfer using a allowance mechanism; allowing an approved spender to transfer tokens from another user wallet (sender) to the recipient.
   * Approved spender allowance is deducted.
   * Different implementation vs Transfer().
   * @param sender    token holder wallet address to transfer from
   * @param recipient recipient wallet address in either bech32/checksum/base16 format to transfer the ZRC2 tokens to.
   * @param amount    number of ZRC2 tokens to transfer
   * @returns transaction receipt
   */
  public async transferFrom(sender: string, recipient: string, amount: string): Promise<TxReceipt | undefined> {
    const senderAddress = this.sanitizeAddress(sender);
    const recipientAddress = this.sanitizeAddress(recipient);
    const spenderAddress = this.sanitizeAddress(this.walletAddress);

    // check allowance
    // sender is token holder
    // the one invoking is the approved spender
    const transferAmountBN = this.sanitizeAmountBN(amount);
    const allowanceQuery = await this.checkAllowance(sender, spenderAddress);
    const spenderAllowanceBN = new BN(allowanceQuery.allowances[0][spenderAddress]);

    if (spenderAllowanceBN.lt(transferAmountBN)) {
      throw new Error(
        `Insufficient allowance to initiate transfer on behalf of token holder. Required: ${amount}, Current allowance: ${spenderAllowanceBN.toString()}`,
      );
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
   * @returns transaction receipt
   */
  public async increaseAllowance(spender: string, amount: string): Promise<TxReceipt | undefined> {
    const spenderAddress = this.sanitizeAddress(spender);
    this.sanitizeAmountBN(amount);

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
   *
   * Decrease the allowance of an approved spender. Only the token holder is allowed to invoke.
   * @param spender address of the designated approved spender in bech32/checksum/base16 format.
   * @param amount  number of ZRC2 tokens allowance to deduct from the approved spender.
   * @returns transaction receipt
   */
  public async decreaseAllowance(spender: string, amount: string): Promise<TxReceipt | undefined> {
    const tokenHolderAddress = this.sanitizeAddress(this.walletAddress);
    const spenderAddress = this.sanitizeAddress(spender);

    const deductAmountBN = this.sanitizeAmountBN(amount);
    const allowanceQuery = await this.checkAllowance(tokenHolderAddress, spenderAddress);
    const spenderAllowanceBN = new BN(allowanceQuery.allowances[0][spenderAddress]);

    if (deductAmountBN.gt(spenderAllowanceBN)) {
      throw new Error(
        `Insufficient spender allowance to decrease. Required: ${amount}, Current allowance: ${spenderAllowanceBN.toString()}`,
      );
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

  private removeHex(address: string): string {
    if (address.startsWith('0x')) {
      return address.replace('0x', '').toLowerCase();
    }
    return address.toLowerCase();
  }

  private isContainsAlphabets(input: string): boolean {
    return /^[a-zA-Z]*$/.test(input);
  }

  private sanitizeAddress(address: string): string {
    if (address) {
      if (validation.isBech32(address)) {
        return fromBech32Address(address).toLowerCase();
      }

      if (validation.isAddress(address)) {
        return address.toLowerCase();
      } else {
        throw new Error(`Not a valid address for Address: ${address}`);
      }
    }

    throw new Error('Address is empty');
  }

  // return a BN
  private sanitizeAmountBN(amount: string): BN {
    // if amount is not digit, errors will show up when converting to BN
    if (/^[0-9]*$/.test(amount) === false) {
      throw new Error(`Not a valid amount for Amount: ${amount}`);
    }
    return new BN(amount);
  }
}
