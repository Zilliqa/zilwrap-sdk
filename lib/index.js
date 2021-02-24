"use strict";
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
    function Zilwrap(network, privateKey) {
        this.txParams = {
            version: 99999,
            gasPrice: new util_1.BN(constants_1.GAS_PRICE),
            gasLimit: util_1.Long.fromNumber(constants_1.GAS_LIMIT),
        };
        this.zilliqa = new zilliqa_1.Zilliqa(constants_1.BLOCKCHAIN_URL[network]);
        this.zilliqa.wallet.addByPrivateKey(privateKey);
        this.txParams.version = constants_1.BLOCKCHAIN_VERSIONS[network];
        console.log('Added account: %o', crypto_1.getAddressFromPrivateKey(privateKey));
        this.walletAddress = crypto_1.getAddressFromPrivateKey(privateKey);
        this.contractAddress = constants_1.WRAPPER_CONTRACT[network];
        this.contract = this.zilliqa.contracts.at(this.contractAddress);
    }
    // set current gas price
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
     */
    Zilwrap.prototype.checkAllowance = function (holder, approvedSpender) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenHolderAddress, state, approvedSpenderAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokenHolderAddress = this.sanitizeAddress(holder);
                        return [4 /*yield*/, this.contract.getSubState('allowances', [tokenHolderAddress])];
                    case 1:
                        state = _a.sent();
                        if (state === null || state.allowances === undefined || state.allowances[tokenHolderAddress] == undefined) {
                            throw new Error('Could not get allowance');
                        }
                        if (approvedSpender === undefined) {
                            return [2 /*return*/, state.allowances[tokenHolderAddress]];
                        }
                        else {
                            approvedSpenderAddress = this.sanitizeAddress(approvedSpender);
                            if (state.allowances[tokenHolderAddress][approvedSpenderAddress] === undefined) {
                                return [2 /*return*/, '0'];
                            }
                            return [2 /*return*/, state.allowances[tokenHolderAddress][approvedSpenderAddress]];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check Balance
     * @param address optional checksum wallet address to check for balance. If not supplied, checks the default wallet address
     */
    // get wrapped tokens balance from contract
    // returns wrapped tokens balance in Qa
    Zilwrap.prototype.checkBalance = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var state, interestedWallet, hexWalletAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.getSubState('balances')];
                    case 1:
                        state = _a.sent();
                        interestedWallet = '';
                        if (address === undefined) {
                            // no input, use default wallet
                            interestedWallet = this.walletAddress;
                        }
                        else {
                            interestedWallet = address;
                        }
                        hexWalletAddress = this.sanitizeAddress(interestedWallet);
                        console.log('check balance: %o', hexWalletAddress);
                        // console.log("state balances: %o", state.balances);
                        if (state.balances === undefined || state.balances[hexWalletAddress] === undefined) {
                            return [2 /*return*/, '0'];
                        }
                        return [2 /*return*/, state.balances[hexWalletAddress]];
                }
            });
        });
    };
    /**
     * Wrap $ZIL to particular token
     * @param amount amount to be wrapped in ZIL
     */
    Zilwrap.prototype.wrap = function (amount) {
        return __awaiter(this, void 0, void 0, function () {
            var amountQa, balance, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
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
                        return [2 /*return*/, callTx];
                }
            });
        });
    };
    /**
     * Unwrap tokens and retrieve back $ZIL
     * @param amount token amount to be unwrapped
     */
    Zilwrap.prototype.unwrap = function (tokenAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var burnAmountBN, tokenBalance, tokenBalanceBN, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        burnAmountBN = new util_1.BN(tokenAmount);
                        return [4 /*yield*/, this.checkBalance()];
                    case 1:
                        tokenBalance = _a.sent();
                        tokenBalanceBN = new util_1.BN(tokenBalance);
                        if (tokenBalanceBN.lt(burnAmountBN)) {
                            throw new Error('Insufficient token balance to unwrap');
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
                        return [2 /*return*/, callTx];
                }
            });
        });
    };
    /**
     * Transfer
     * @param recipient bech32, checksum, base16 address
     * @param amount actual number of tokens (not $ZIL!)
     */
    Zilwrap.prototype.transfer = function (recipient, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var recipientAddress, transferAmountBN, tokenBalance, tokenBalanceBN, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        recipientAddress = this.sanitizeAddress(recipient);
                        transferAmountBN = new util_1.BN(amount);
                        return [4 /*yield*/, this.checkBalance()];
                    case 1:
                        tokenBalance = _a.sent();
                        tokenBalanceBN = new util_1.BN(tokenBalance);
                        if (tokenBalanceBN.lt(transferAmountBN)) {
                            throw new Error('Insufficient token balance to transfer');
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
                        return [2 /*return*/, callTx];
                }
            });
        });
    };
    /**
     * TransferFrom
     * Transfer using a allowance mechanism; allowing an approved spender to transfer tokens from another user wallet (sender) to the recipient.
     * Approved spender allowance is deducted.
     * Different implementation vs Transfer().
     */
    Zilwrap.prototype.transferFrom = function (sender, recipient, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var senderAddress, recipientAddress, spenderAddress, transferAmountBN, spenderAllowance, spenderAllowanceBN, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        senderAddress = this.sanitizeAddress(sender);
                        recipientAddress = this.sanitizeAddress(recipient);
                        spenderAddress = this.sanitizeAddress(this.walletAddress);
                        transferAmountBN = new util_1.BN(amount);
                        return [4 /*yield*/, this.checkAllowance(sender, spenderAddress)];
                    case 1:
                        spenderAllowance = _a.sent();
                        spenderAllowanceBN = new util_1.BN(spenderAllowance);
                        console.log('spender allowance: %o', spenderAllowance);
                        if (spenderAllowanceBN.lt(transferAmountBN)) {
                            throw new Error('Insufficient allowance to initiate transfer on behalf of token holder');
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
                        return [2 /*return*/, callTx];
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
     */
    Zilwrap.prototype.increaseAllowance = function (spender, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var spenderAddress, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spenderAddress = this.sanitizeAddress(spender);
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
                        return [2 /*return*/, callTx];
                }
            });
        });
    };
    /**
     * Decrease Allowance
     */
    Zilwrap.prototype.decreaseAllowance = function (spender, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenHolderAddress, spenderAddress, deductAmountBN, spenderAllowance, spenderAllowanceBN, callTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokenHolderAddress = this.sanitizeAddress(this.walletAddress);
                        spenderAddress = this.sanitizeAddress(spender);
                        deductAmountBN = new util_1.BN(amount);
                        return [4 /*yield*/, this.checkAllowance(tokenHolderAddress, spenderAddress)];
                    case 1:
                        spenderAllowance = _a.sent();
                        spenderAllowanceBN = new util_1.BN(spenderAllowance);
                        if (deductAmountBN.gt(spenderAllowanceBN)) {
                            throw new Error('Insufficient spender allowance to decrease');
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
                        return [2 /*return*/, callTx];
                }
            });
        });
    };
    Zilwrap.prototype.getBalance = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var balance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.zilliqa.blockchain.getBalance(address)];
                    case 1:
                        balance = _a.sent();
                        return [2 /*return*/, balance.result];
                }
            });
        });
    };
    Zilwrap.prototype.addHex = function (address) {
        if (address.startsWith('0x')) {
            return address.toLowerCase();
        }
        return "0x" + address;
    };
    Zilwrap.prototype.removeHex = function (address) {
        if (address.startsWith('0x')) {
            return address.replace('0x', '').toLowerCase();
        }
        return address.toLowerCase();
    };
    Zilwrap.prototype.sanitizeAddress = function (address) {
        if (util_1.validation.isBech32(address)) {
            return crypto_1.fromBech32Address(address).toLowerCase();
        }
        if (util_1.validation.isAddress(address)) {
            return address.toLowerCase();
        }
        else {
            throw new Error('Not a valid address');
        }
    };
    Zilwrap.prototype.sanitizeAmount = function (amount) {
        // if amount is not digit, errors will show up when converting to BN
        return new util_1.BN(amount).toString();
    };
    return Zilwrap;
}());
exports.Zilwrap = Zilwrap;
