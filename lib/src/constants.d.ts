export declare enum Network {
    Mainnet = "Mainnet",
    Testnet = "Testnet",
    Isolated = "Isolated"
}
declare type Networks = keyof typeof Network;
export declare const BLOCKCHAIN_URL: {
    [key in Networks]: string;
};
export declare const BLOCKCHAIN_VERSIONS: {
    [key in Networks]: number;
};
export declare const WRAPPER_CONTRACT: {
    [key in Networks]: string;
};
export declare const GAS_LIMIT = 25000;
export declare const GAS_PRICE = 2000000000;
export {};
