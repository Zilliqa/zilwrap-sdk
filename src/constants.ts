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

import { bytes } from '@zilliqa-js/zilliqa';

export enum Network {
  Mainnet = 'Mainnet',
  Testnet = 'Testnet',
  Isolated = 'Isolated',
}
type Networks = keyof typeof Network;

export const BLOCKCHAIN_URL: { [key in Networks]: string } = {
  [Network.Mainnet]: 'https://api.zilliqa.com',
  [Network.Testnet]: 'https://dev-api.zilliqa.com',
  [Network.Isolated]: 'https://zilliqa-isolated-server.zilliqa.com',
};

export const BLOCKCHAIN_VERSIONS: { [key in Networks]: number } = {
  // CHAIN_ID, MSG_VERSION
  [Network.Mainnet]: bytes.pack(1, 1),
  [Network.Testnet]: bytes.pack(333, 1),
  [Network.Isolated]: bytes.pack(222, 1),
};

export const WRAPPER_CONTRACT: { [key in Networks]: string } = {
  [Network.Mainnet]: '',
  [Network.Testnet]: 'zil1r9lexrfs44555yj8t0tuyjk8z3an0h4dv2qv2l',
  [Network.Isolated]: 'zil17qh89yvllqt63dwd4hexx758kcw8lu75z3hzzf',
};

export const GAS_LIMIT = 25000;
export const GAS_PRICE = 2000000000;
