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
    // const contract address
    function Zilwrap(network, privateKey) {
        this.txParams = {
            version: 99999,
            gasPrice: new util_1.BN(0),
            gasLimit: util_1.Long.fromNumber(constants_1.GAS_LIMIT),
        };
        this.zilliqa = new zilliqa_1.Zilliqa(constants_1.BLOCKCHAIN_URL[network]);
        this.zilliqa.wallet.addByPrivateKey(privateKey);
        this.txParams.version = constants_1.BLOCKCHAIN_VERSIONS[network];
        this.txParams.gasPrice = new util_1.BN('2000000000000');
        console.log('Added account: %o', crypto_1.getAddressFromPrivateKey(privateKey));
        this.walletAddress = this.removeHex(crypto_1.getAddressFromPrivateKey(privateKey));
        this.contractAddress = constants_1.WRAPPER_CONTRACT[network];
        this.contract = this.zilliqa.contracts.at(this.contractAddress);
    }
    // wrap zil to token contract
    // amount is in ZIL
    Zilwrap.prototype.wrapZil = function (amount) {
        return __awaiter(this, void 0, void 0, function () {
            var amountQa, balance, callTx, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        amountQa = util_1.units.toQa(amount, util_1.units.Units.Zil);
                        return [4 /*yield*/, this.zilliqa.blockchain.getBalance(this.walletAddress)];
                    case 1:
                        balance = _a.sent();
                        if (balance.result === undefined) {
                            throw new Error("Could not get balance");
                        }
                        if (amountQa.gt(new util_1.BN(balance.result.balance))) {
                            throw new Error("Insufficient balance");
                        }
                        return [4 /*yield*/, this.contract.call('Mint', [], __assign({ amount: new util_1.BN(amountQa) }, this.txParams), 33, 1000, false)];
                    case 2:
                        callTx = _a.sent();
                        return [2 /*return*/, callTx];
                    case 3:
                        err_1 = _a.sent();
                        throw err_1;
                    case 4: return [2 /*return*/];
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
    Zilwrap.prototype.removeHex = function (address) {
        if (address.startsWith('0x')) {
            return address.replace('0x', '').toLowerCase();
        }
        return address.toLowerCase();
    };
    return Zilwrap;
}());
exports.Zilwrap = Zilwrap;
