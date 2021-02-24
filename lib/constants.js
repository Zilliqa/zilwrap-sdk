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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAS_PRICE = exports.GAS_LIMIT = exports.WRAPPER_CONTRACT = exports.BLOCKCHAIN_VERSIONS = exports.BLOCKCHAIN_URL = exports.Network = void 0;
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
    _c[Network.Testnet] = 'zil1r9lexrfs44555yj8t0tuyjk8z3an0h4dv2qv2l',
    _c[Network.Isolated] = 'zil17qh89yvllqt63dwd4hexx758kcw8lu75z3hzzf',
    _c);
exports.GAS_LIMIT = 25000;
exports.GAS_PRICE = 2000000000;
