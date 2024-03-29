"use strict";
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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Zilwrap = void 0;
var zilliqa_1 = require("@zilliqa-js/zilliqa");
var util_1 = require("@zilliqa-js/util");
var crypto_1 = require("@zilliqa-js/crypto");
var constants_1 = require("./constants");
var Zilwrap = /** @class */ (function () {
    function Zilwrap(network, privateKey, settings) {
        this.txParams = {
            version: 99999,
            gasPrice: new util_1.BN(constants_1.GAS_PRICE),
            gasLimit: util_1.Long.fromNumber(constants_1.GAS_LIMIT),
        };
        this.zilliqa = new zilliqa_1.Zilliqa(constants_1.BLOCKCHAIN_URL[network]);
        this.zilliqa.wallet.addByPrivateKey(privateKey);
        this.txParams.version = constants_1.BLOCKCHAIN_VERSIONS[network];
        this.walletAddress = crypto_1.getAddressFromPrivateKey(privateKey);
        this.contractAddress = constants_1.WRAPPER_CONTRACT[network];
        // override default settings
        if (settings) {
            if (network === constants_1.Network.Isolated && settings.contractAddress && this.sanitizeAddress(settings.contractAddress)) {
                this.contractAddress = settings.contractAddress;
            }
            if (settings.gasPrice && settings.gasPrice > 0) {
                this.txParams.gasPrice = new util_1.BN(settings.gasPrice);
            }
            if (settings.gasLimit && settings.gasLimit > 0) {
                this.txParams.gasLimit = util_1.Long.fromNumber(settings.gasLimit);
            }
        }
        this.contract = this.zilliqa.contracts.at(this.contractAddress);
    }
    /**
     * Init
     *
     * Set current gas price
     */
    Zilwrap.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var minimumGasPrice;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.txParams.gasPrice.isZero()) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.zilliqa.blockchain.getMinimumGasPrice()];
                    case 1:
                        minimumGasPrice = _a.sent();
                        if (!minimumGasPrice.result) {
                            throw new Error('Could not get gas price');
                        }
                        this.txParams.gasPrice = new util_1.BN(minimumGasPrice.result);
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check Allowance
     *
     * Retrieves the allowable tokens available for a list of approved spender or a particular approved spender.
     * @param holder          token holder address in either bech32/checksum/base16 format
     * @param approvedSpender optional approved spender address in either bech32/checksum/base16 format
     * @returns JSON map containing the allowance mapping
     */
    Zilwrap.prototype.checkAllowance = function (holder, approvedSpender) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenHolderAddress, state, result, approvedSpenderAddress, allowance;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tokenHolderAddress = this.sanitizeAddress(holder);
                        return [4 /*yield*/, this.contract.getSubState('allowances', [tokenHolderAddress])];
                    case 1:
                        state = _b.sent();
                        result = {
                            allowances: [],
                        };
                        if (state === null || state.allowances === undefined || state.allowances[tokenHolderAddress] == undefined) {
                            throw new Error('Could not get allowance');
                        }
                        if (approvedSpender === undefined) {
                            result.allowances.push(state.allowances[tokenHolderAddress]);
                        }
                        if (approvedSpender !== undefined) {
                            approvedSpenderAddress = this.sanitizeAddress(approvedSpender);
                            allowance = '0';
                            if (state.allowances[tokenHolderAddress][approvedSpenderAddress] !== undefined) {
                                allowance = state.allowances[tokenHolderAddress][approvedSpenderAddress];
                            }
                            result.allowances.push((_a = {},
                                _a[approvedSpenderAddress] = allowance,
                                _a));
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Check Balance
     *
     * Retrieves wrapped tokens balance from contract
     * @param address optional checksum wallet address to check for balance. If not supplied, the default wallet address is used
     * @returns wrapped tokens balance
     */
    Zilwrap.prototype.checkBalance = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var state, result, interestedWallet, hexWalletAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.getSubState('balances')];
                    case 1:
                        state = _a.sent();
                        result = {
                            balance: '0',
                        };
                        interestedWallet = '';
                        if (address === undefined) {
                            // no input, use default wallet
                            interestedWallet = this.walletAddress;
                        }
                        else {
                            interestedWallet = address;
                        }
                        hexWalletAddress = this.sanitizeAddress(interestedWallet);
                        if (state.balances !== undefined && state.balances[hexWalletAddress] !== undefined) {
                            result.balance = state.balances[hexWalletAddress];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Wrap
     *
     * Wrap $ZIL to particular token
     * @param amount amount to be wrapped in ZIL
     * @returns transaction receipt
     */
    Zilwrap.prototype.wrap = function (amount) {
        return __awaiter(this, void 0, void 0, function () {
            var amountQa, balance, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isContainsAlphabets(amount)) {
                            throw new Error("Not a valid amount for Amount: " + amount);
                        }
                        amountQa = util_1.units.toQa(amount, util_1.units.Units.Zil);
                        return [4 /*yield*/, this.zilliqa.blockchain.getBalance(this.removeHex(this.walletAddress))];
                    case 1:
                        balance = _a.sent();
                        if (balance.result === undefined) {
                            throw new Error('Could not get balance');
                        }
                        if (amountQa.gt(new util_1.BN(balance.result.balance))) {
                            throw new Error('Insufficient $ZIL balance');
                        }
                        return [4 /*yield*/, this.contract.call('Mint', [], __assign({ amount: new util_1.BN(amountQa) }, this.txParams), 33, 1000, false)];
                    case 2:
                        callTx = _a.sent();
                        return [2 /*return*/, callTx.getReceipt()];
                }
            });
        });
    };
    /**
     * Unwrap
     *
     * Unwrap tokens and retrieve back $ZIL
     * @param tokenAmount token amount to be unwrapped
     * @returns transaction receipt
     */
    Zilwrap.prototype.unwrap = function (tokenAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var burnAmountBN, balanceQuery, tokenBalanceBN, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        burnAmountBN = this.sanitizeAmountBN(tokenAmount);
                        return [4 /*yield*/, this.checkBalance()];
                    case 1:
                        balanceQuery = _a.sent();
                        tokenBalanceBN = new util_1.BN(balanceQuery.balance);
                        if (tokenBalanceBN.lt(burnAmountBN)) {
                            throw new Error("Insufficient token balance to unwrap. Required: " + tokenAmount + ", Current token balance: " + tokenBalanceBN.toString() + ".");
                        }
                        return [4 /*yield*/, this.contract.call('Burn', [
                                {
                                    vname: 'amount',
                                    type: 'Uint128',
                                    value: "" + tokenAmount,
                                },
                            ], __assign({ amount: new util_1.BN(0) }, this.txParams), 33, 1000, false)];
                    case 2:
                        callTx = _a.sent();
                        return [2 /*return*/, callTx.getReceipt()];
                }
            });
        });
    };
    /**
     * Transfer
     *
     * Transfer the ZRC2 tokens to another wallet.
     * @param recipient bech32, checksum, base16 address
     * @param amount    actual number of tokens (not $ZIL!)
     * @returns transaction receipt
     */
    Zilwrap.prototype.transfer = function (recipient, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var recipientAddress, transferAmountBN, balanceQuery, tokenBalanceBN, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        recipientAddress = this.sanitizeAddress(recipient);
                        transferAmountBN = this.sanitizeAmountBN(amount);
                        return [4 /*yield*/, this.checkBalance()];
                    case 1:
                        balanceQuery = _a.sent();
                        tokenBalanceBN = new util_1.BN(balanceQuery.balance);
                        if (tokenBalanceBN.lt(transferAmountBN)) {
                            throw new Error("Insufficient token balance to transfer. Required: " + amount + ", Current token balance: " + tokenBalanceBN.toString() + ".");
                        }
                        return [4 /*yield*/, this.contract.call('Transfer', [
                                {
                                    vname: 'to',
                                    type: 'ByStr20',
                                    value: "" + recipientAddress,
                                },
                                {
                                    vname: 'amount',
                                    type: 'Uint128',
                                    value: "" + amount,
                                },
                            ], __assign({ amount: new util_1.BN(0) }, this.txParams), 33, 1000, false)];
                    case 2:
                        callTx = _a.sent();
                        return [2 /*return*/, callTx.getReceipt()];
                }
            });
        });
    };
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
    Zilwrap.prototype.transferFrom = function (sender, recipient, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var senderAddress, recipientAddress, spenderAddress, transferAmountBN, allowanceQuery, spenderAllowanceBN, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        senderAddress = this.sanitizeAddress(sender);
                        recipientAddress = this.sanitizeAddress(recipient);
                        spenderAddress = this.sanitizeAddress(this.walletAddress);
                        transferAmountBN = this.sanitizeAmountBN(amount);
                        return [4 /*yield*/, this.checkAllowance(sender, spenderAddress)];
                    case 1:
                        allowanceQuery = _a.sent();
                        spenderAllowanceBN = new util_1.BN(allowanceQuery.allowances[0][spenderAddress]);
                        if (spenderAllowanceBN.lt(transferAmountBN)) {
                            throw new Error("Insufficient allowance to initiate transfer on behalf of token holder. Required: " + amount + ", Current allowance: " + spenderAllowanceBN.toString());
                        }
                        return [4 /*yield*/, this.contract.call('TransferFrom', [
                                {
                                    vname: 'from',
                                    type: 'ByStr20',
                                    value: "" + senderAddress,
                                },
                                {
                                    vname: 'to',
                                    type: 'ByStr20',
                                    value: "" + recipientAddress,
                                },
                                {
                                    vname: 'amount',
                                    type: 'Uint128',
                                    value: "" + amount,
                                },
                            ], __assign({ amount: new util_1.BN(0) }, this.txParams), 33, 1000, false)];
                    case 2:
                        callTx = _a.sent();
                        return [2 /*return*/, callTx.getReceipt()];
                }
            });
        });
    };
    /**
     * IncreaseAllowance
     *
     * Increase the allowance of an approved spender over the caller tokens.
     * Only token holder allowed to invoke.
     * @param spender address of the designated approved spender in bech32/checksum/base16 forms
     * @amount amount number of tokens to be increased as allowance for the approved spender
     * @returns transaction receipt
     */
    Zilwrap.prototype.increaseAllowance = function (spender, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var spenderAddress, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spenderAddress = this.sanitizeAddress(spender);
                        this.sanitizeAmountBN(amount);
                        return [4 /*yield*/, this.contract.call('IncreaseAllowance', [
                                {
                                    vname: 'spender',
                                    type: 'ByStr20',
                                    value: "" + spenderAddress,
                                },
                                {
                                    vname: 'amount',
                                    type: 'Uint128',
                                    value: "" + amount,
                                },
                            ], __assign({ amount: new util_1.BN(0) }, this.txParams), 33, 1000, false)];
                    case 1:
                        callTx = _a.sent();
                        return [2 /*return*/, callTx.getReceipt()];
                }
            });
        });
    };
    /**
     * Decrease Allowance
     *
     * Decrease the allowance of an approved spender. Only the token holder is allowed to invoke.
     * @param spender address of the designated approved spender in bech32/checksum/base16 format.
     * @param amount  number of ZRC2 tokens allowance to deduct from the approved spender.
     * @returns transaction receipt
     */
    Zilwrap.prototype.decreaseAllowance = function (spender, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenHolderAddress, spenderAddress, deductAmountBN, allowanceQuery, spenderAllowanceBN, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokenHolderAddress = this.sanitizeAddress(this.walletAddress);
                        spenderAddress = this.sanitizeAddress(spender);
                        deductAmountBN = this.sanitizeAmountBN(amount);
                        return [4 /*yield*/, this.checkAllowance(tokenHolderAddress, spenderAddress)];
                    case 1:
                        allowanceQuery = _a.sent();
                        spenderAllowanceBN = new util_1.BN(allowanceQuery.allowances[0][spenderAddress]);
                        if (deductAmountBN.gt(spenderAllowanceBN)) {
                            throw new Error("Insufficient spender allowance to decrease. Required: " + amount + ", Current allowance: " + spenderAllowanceBN.toString());
                        }
                        return [4 /*yield*/, this.contract.call('DecreaseAllowance', [
                                {
                                    vname: 'spender',
                                    type: 'ByStr20',
                                    value: "" + spenderAddress,
                                },
                                {
                                    vname: 'amount',
                                    type: 'Uint128',
                                    value: "" + amount,
                                },
                            ], __assign({ amount: new util_1.BN(0) }, this.txParams), 33, 1000, false)];
                    case 2:
                        callTx = _a.sent();
                        return [2 /*return*/, callTx.getReceipt()];
                }
            });
        });
    };
    Zilwrap.prototype.removeHex = function (address) {
        if (address.startsWith('0x')) {
            return address.replace('0x', '').toLowerCase();
        }
        return address.toLowerCase();
    };
    Zilwrap.prototype.isContainsAlphabets = function (input) {
        return /^[a-zA-Z]*$/.test(input);
    };
    Zilwrap.prototype.sanitizeAddress = function (address) {
        if (address) {
            if (util_1.validation.isBech32(address)) {
                return crypto_1.fromBech32Address(address).toLowerCase();
            }
            if (util_1.validation.isAddress(address)) {
                return address.toLowerCase();
            }
            else {
                throw new Error("Not a valid address for Address: " + address);
            }
        }
        throw new Error('Address is empty');
    };
    // return a BN
    Zilwrap.prototype.sanitizeAmountBN = function (amount) {
        // if amount is not digit, errors will show up when converting to BN
        if (/^[0-9]*$/.test(amount) === false) {
            throw new Error("Not a valid amount for Amount: " + amount);
        }
        return new util_1.BN(amount);
    };
    return Zilwrap;
}());
exports.Zilwrap = Zilwrap;
