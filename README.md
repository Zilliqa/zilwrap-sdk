# zilwrap-sdk

## Getting Started
```
npm install
npm run build
```

Configure the contracts address in `src/constants.ts`:
```
export const WRAPPER_CONTRACT: { [key in Networks]: string } = {
  [Network.Mainnet]: '',
  [Network.Testnet]: 'zil1r9lexrfs44555yj8t0tuyjk8z3an0h4dv2qv2l',
  [Network.Isolated]: 'zil17qh89yvllqt63dwd4hexx758kcw8lu75z3hzzf',
};
```

Initialize Zilwrap

Create a new `example.js` file and import zilwrap:
```
const { Network } = require('./lib/constants');
const Zilwrap = require('./lib/index').Zilwrap;

async function main() {
    const zilwrap = new Zilwrap(Network.Testnet, 'private_key');

    try {
        await zilwrap.init();
        await zilwrap.wrap('10');
        await zilwrap.transfer('recipient_address', 'token_amt');
        await zilwrap.unwrap('5');
    } catch (err) {
        console.log(err);
    }
}

main();
```

## ZRC2 Wrapper Contract
asdasd

### Allowable Mechanism

## API Documentation

### `constructor(network: Network, privateKey: string)`

Initialize a new Zilwrap object with a default wallet.

**Parameters**
- `network`: `Network` - the blockchain network, available options: `Network.Mainnet`, `Network.Testnet`
- `privateKey`: `string`- the user's wallet private key to interact with.

**Returns**
The main Zilwrap object for interaction.

### `init()`

Setup essential parameters for the Zilwrap object, e.g. fetching the current gas price of the network.

**Note:** Used in conjunction whenever after declaring a new Zilwrap object. 
Omitting this `init()` statement may result in other methods to fail.

**Usage**
```
const zilwrap = new Zilwrap(Network.Testnet, 'private_key');
await zilwrap.init(); // always after the new Zilwrap object
// can start to call other methods
```

### `checkAllowance(holder: string, approvedSpender?: string): string`

Retrieves the allowable tokens available for a list of approved spender or a particular approved spender. Refer to the ZRC2 contract section for more details about the allowable mechanism.

**Parameters**
- `holder`: `string` - The token holder address in either bech32/checksum/base16 format. 
- `approvedSpender`: `string` (optional) - The approved spender address in either bech32/checksum/base16 format.

**Returns**
if the approved spender address is not specified, the entire JSON mapping of approved spender-allowances for the token holder is returned. Otherwise, only the approved spender's allowance is returned.

**Usage**
*With approved spender*
```
const result = zilwrap.checkAllowance("0x99f9d482abbdc5f05272a3c34a77e5933bb1c615", "0x13aa1c29698008e78801702be8a43527813ce892");
console.log("spender allowance: %o", result);

// result
spender allowance: 500
```

*Without approved spender*
```
const result = zilwrap.checkAllowance("0x99f9d482abbdc5f05272a3c34a77e5933bb1c615");
console.log(result);

// result
{
  "0x99f9d482abbdc5f05272a3c34a77e5933bb1c615": {
    "0x4978075dd607933122f4355b220915efa51e84c7": "475",
    "0x13aa1c29698008e78801702be8a43527813ce892": "500"
  }
}
```

### `checkBalance(address?: string): string`

Retrieves the wrapped token amount within the contract.

**Parameters**
- `address`: `string` (optional) - The token holder address in either bech32/checksum/base16 format.

**Returns**
Returns a string representation of the token amount. If the address is not specified, the default wallet address is used to query.

**Usage**
*With address*
```
const result = zilwrap.checkBalance("0x99f9d482abbdc5f05272a3c34a77e5933bb1c615");
console.log("wrapped token: %o", result);

// result
wrapped token: 10000000000000
```

*Without address*
```
const zilwrap = new Zilwrap(Network.Testnet, 'private_key'); // init default wallet
const result = zilwrap.checkBalance(); // check balance using default wallet
console.log("wrapped token: %o", result);

// result
wrapped token: 10000000000000
```

### `wrap(amount: string): Promise<Transaction>`

Wrap $ZIL to a ZRC2 token.

**Parameters**
- `amount`: `string` - amount in $ZIL to "convert" it into a ZRC2 token.

**Returns**

- `Promise<Transaction>` - Transaction object with its status confirmed onchain.

**Usage**
```
await zilwrap.wrap("10"); // wrap 10 $ZIL
```

### `unwrap(tokenAmount: string): Promise<Transaction>`

Unwrap ZRC2 token to $ZIL.

**Parameters**
- `tokenAmount`: `string` - number of ZRC2 tokens to be converted to $ZIL.

**Returns**

- `Promise<Transaction>` - Transaction object with its status confirmed onchain.

**Usage**
```
await zilwrap.unwrap("10000000000000") // unwrapping the equivalent of 10 $ZIL
```

### `transfer(recipient: string, amount: string): Promise<Transaction>`

Transfer the ZRC2 tokens to another wallet.

**Parameters**
- `recipient`: `string` - recipient wallet address in either bech32/checksum/base16 format to transfer the ZRC2 tokens to.
- `amount`: `string` - number of ZRC2 tokens

**Returns**

- `Promise<Transaction>` - Transaction object with its status confirmed onchain.

**Usage**
```
const result = zilwrap.transfer("0x4978075dd607933122f4355B220915EFa51E84c7", "5"); // transfer 5 ZRC2 tokens
```

### `transferFrom(sender: string, recipient: string, amount: string): Promise<Transaction>`

Transfer using a allowance mechanism; allowing an approved spender to transfer tokens from another user wallet (sender) to the recipient. Approved spender allowance is deducted.

**Note:** Different implementation vs Transfer().

**Parameters**
- `sender`: `string` - token holder wallet address to transfer from
- `recipient`: `string` - recipient wallet address in either bech32/checksum/base16 format to transfer the ZRC2 tokens to.
- `amount`: `string` - number of ZRC2 tokens

**Returns**

- `Promise<Transaction>` - Transaction object with its status confirmed onchain.

**Usage**
Suppose the allowance map is as follows:
```
allowances: {
  "0x99f9d482abbdc5f05272a3c34a77e5933bb1c615": {
    "0x4978075dd607933122f4355b220915efa51e84c7": "475",
    "0x13aa1c29698008e78801702be8a43527813ce892": "500"
  }
}
```
The above implies that the token holder: `0x99f9d482abbdc5f05272a3c34a77e5933bb1c615` has permitted `0x4978075dd607933122f4355b220915efa51e84c7` to transfer up to `475` of `0x99f9d482abbdc5f05272a3c34a77e5933bb1c615`'s tokens.

Hence, if we wish to transfer `0x99f9d482abbdc5f05272a3c34a77e5933bb1c615` 's tokens as another user, the default wallet should either be `0x4978075dd607933122f4355b220915efa51e84c7` or `0x13aa1c29698008e78801702be8a43527813ce892` when initializing the `Zilwrap` object:
```
const zilwrap = new Zilwrap(Network.Testnet, 'approved_spender_private_key'); // init default wallet
const result = zilwrap.transferFrom("0x99f9d482abbdc5f05272a3c34a77e5933bb1c615", "0x1234567890123456789012345678901234567890", "10"); // transfer 10 tokens from "0x99f9..." to "0x1234"
```

### `increaseAllowance(spender: string, amount: string): Promise<Transaction>`

Increase the allowance of an approved spender over the caller tokens. Only the token holder is allowed to invoke.

**Parameters**
- `spender`: `string` - address of the designated approved spender in bech32/checksum/base16 format.
- `amount`: `string` - set the number of ZRC2 tokens as allowance for the approved spender.

**Returns**

- `Promise<Transaction>` - Transaction object with its status confirmed onchain.

**Usage**
```
const zilwrap = new Zilwrap(Network.Testnet, 'token_holder_private_key'); // init default wallet
const result = zilwrap.increaseAllowance("0x4978075dd607933122f4355b220915efa51e84c7", "500"); // permit user "0x4978" to transfer token holder tokens; limit up to 500 tokens
```

### `decreaseAllownce(spender: string, amount: string): Promise<Transaction>`

Decrease the allowance of an approved spender. Only the token holder is allowed to invoke.

**Parameters**
- `spender`: `string` - address of the designated approved spender in bech32/checksum/base16 format.
- `amount`: `string` - amount of ZRC2 token allowance to deduct


**Returns**

- `Promise<Transaction>` - Transaction object with its status confirmed onchain.

**Usage**
```
const zilwrap = new Zilwrap(Network.Testnet, 'token_holder_private_key'); // init default wallet
const result = zilwrap.decreaseAllowance("0x4978075dd607933122f4355b220915efa51e84c7", "10"); // deduct approved spender "0x4978" allowance by 10 tokens.
```


