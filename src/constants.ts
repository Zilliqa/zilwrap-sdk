import { bytes } from "@zilliqa-js/zilliqa"

export enum Network {
    Mainnet = 'Mainnet',
    Testnet = 'Testnet',
    Isolated = 'Isolated',
}
type Networks = keyof typeof Network

export const BLOCKCHAIN_URL: { [key in Networks]: string } = {
    [Network.Mainnet]: 'https://api.zilliqa.com',
    [Network.Testnet]: 'https://dev-api.zilliqa.com',
    [Network.Isolated]: 'https://zilliqa-isolated-server.zilliqa.com',
}

export const BLOCKCHAIN_VERSIONS: { [key in Networks]: number } = {
    // CHAIN_ID, MSG_VERSION
    [Network.Mainnet]: bytes.pack(1, 1),
    [Network.Testnet]: bytes.pack(333, 1),
    [Network.Isolated]: bytes.pack(222, 1),
}

export const WRAPPER_CONTRACT: { [key in Networks]: string } = {
    [Network.Mainnet]: '',
    [Network.Testnet]: '',
    [Network.Isolated]: 'zil17qh89yvllqt63dwd4hexx758kcw8lu75z3hzzf',
}

export const GAS_LIMIT = 30000;