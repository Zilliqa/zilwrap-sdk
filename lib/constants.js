"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAS_LIMIT = exports.WRAPPER_CONTRACT = exports.BLOCKCHAIN_VERSIONS = exports.BLOCKCHAIN_URL = exports.Network = void 0;
var zilliqa_1 = require("@zilliqa-js/zilliqa");
var Network;
(function (Network) {
    Network["Mainnet"] = "Mainnet";
    Network["Testnet"] = "Testnet";
    Network["Isolated"] = "Isolated";
})(Network = exports.Network || (exports.Network = {}));
exports.BLOCKCHAIN_URL = (_a = {},
    _a[Network.Mainnet] = 'https://api.zilliqa.com',
    _a[Network.Testnet] = 'https://dev-api.zilliqa.com',
    _a[Network.Isolated] = 'https://zilliqa-isolated-server.zilliqa.com',
    _a);
exports.BLOCKCHAIN_VERSIONS = (_b = {},
    // CHAIN_ID, MSG_VERSION
    _b[Network.Mainnet] = zilliqa_1.bytes.pack(1, 1),
    _b[Network.Testnet] = zilliqa_1.bytes.pack(333, 1),
    _b[Network.Isolated] = zilliqa_1.bytes.pack(222, 1),
    _b);
exports.WRAPPER_CONTRACT = (_c = {},
    _c[Network.Mainnet] = '',
    _c[Network.Testnet] = '',
    _c[Network.Isolated] = 'zil17qh89yvllqt63dwd4hexx758kcw8lu75z3hzzf',
    _c);
exports.GAS_LIMIT = 30000;
