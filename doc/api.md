# Zilwrap API Documentation

## Contents

### Contructors
- [constructor](api.md#constructor)

### Methods
- init
- checkAllowance
- checkBalance
- wrap
- unwrap
- transfer
- transferFrom
- increaseAllowance
- decreaseAllowance

## Constructors

### constructor

**new Zilwrap(`network`:`Network`, `privateKey`: `string`)**: `Zilwrap`

Initialize a new Zilwrap object with a default wallet.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `network` | Network | blockchain network, available options: `Network.Mainnet`, `Network.Testnet`. |
| `privateKey` | string | user's wallet private key to interact with. |

**Returns**
`Zilwrap` - The main Zilwrap object for interaction.

## Methods

### init

**init()**

Setup essential parameters for the Zilwrap object, e.g. fetching the current gas price of the network.

**Note:** Used in conjunction whenever after declaring a new Zilwrap object. 
Omitting this `init()` statement may result in other methods to fail.

**Returns** 
`void`

**Usage**
```
const zilwrap = new Zilwrap(Network.Testnet, 'private_key');
await zilwrap.init(); // always after the new Zilwrap object
// can start to call other methods
```

___

### checkAllowance

**checkAllowance(`holder`: `string`, `approvedSpender?`: `string`)**: `string`

Retrieves the allowable tokens available for a list of approved spender or a particular approved spender.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `holder` | string | token holder address in either bech32/checksum/base16 format. |
| `approvedSpender` (optional) | string | approved spender address in either bech32/checksum/base16 format. |

**Returns**
`string` - if the approved spender address is not specified, the entire JSON mapping of approved spender-allowances for the token holder is returned. Otherwise, only the approved spender's allowance is returned.

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

___

### checkBalance

**checkBalance(`address?`: `string`)**: `string`

Retrieves the wrapped token amount within the contract.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `address` (optional) | string | token holder address in either bech32/checksum/base16 format. |

**Returns**
`string` - Returns a string representation of the token amount. If the address is not specified, the default wallet address is used to query.

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

___

### wrap

**wrap(`amount`: `string`)**: `Promise<TxReceipt | undefined>`

Wrap $ZIL to a ZRC2 token.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `amount` | string | amount in $ZIL to "convert" it into a ZRC2 token. |

**Returns**
`Promise<TxReceipt | undefined>` - Transaction receipt after the transaction is confirmed onchain or undefined if connection error.

**Usage**
```
await zilwrap.wrap("10"); // wrap 10 $ZIL
```

___

### unwrap

**unwrap(`tokenAmount`: `string`)**: `Promise<TxReceipt | undefined>`

Unwrap ZRC2 token to $ZIL.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `tokenAmount` | string | number of ZRC2 tokens to be converted to $ZIL. |

**Returns**
`Promise<TxReceipt | undefined>` - Transaction receipt after the transaction is confirmed onchain or undefined if connection error.

**Usage**
```
await zilwrap.unwrap("10000000000000") // unwrapping the equivalent of 10 $ZI
```

___

### transfer

