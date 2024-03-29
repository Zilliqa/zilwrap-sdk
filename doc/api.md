# Zilwrap API Documentation

## Contents

### Contructors
- [constructor](api.md#constructor)

### Methods
- [init](api.md#init)
- [checkAllowance](api.md#checkAllowance)
- [checkBalance](api.md#checkBalance)
- [wrap](api.md#wrap)
- [unwrap](api.md#unwrap)
- [transfer](api.md#transfer)
- [transferFrom](api.md#transferFrom)
- [increaseAllowance](api.md#increaseAllowance)
- [decreaseAllowance](api.md#decreaseAllowance)

## Constructors

### constructor

- **new Zilwrap(`network`:`Network`, `privateKey`: `string`, `settings?`: `Settings`)**: `Zilwrap`

Initialize a new Zilwrap object with a default wallet.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `network` | Network | blockchain network, available options: `Network.Mainnet`, `Network.Testnet`. |
| `privateKey` | string | user's wallet private key to interact with. |
| `settings` (optional) | Settings | Override the default settings for the gas price or gas limit. See 'Usage' section for more details. |

```
settings = {
  gasPrice?: number,
  gasLimit: number
}
```

**Returns**

`Zilwrap` - The main Zilwrap object for interaction.

**Usage**
```
// without optional settings
const zilwrap = new Zilwrap(Network.Testnet, 'private_key');

// with optional settings
// only declare those fields that you wish to override

const settings = {
  gasPrice: 2000000000, // in Qa
  gasLimit: 25000
}

const zilwrap = new Zilwrap(Network.Testnet, 'private_key', settings);
```

## Methods

### init

- **init()**

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

- **checkAllowance(`holder`: `string`, `approvedSpender?`: `string`)**: `string`

Retrieves the allowable tokens available for a list of approved spender or a particular approved spender.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `holder` | string | token holder address in either bech32/checksum/base16 format. |
| `approvedSpender` (optional) | string | approved spender address in either bech32/checksum/base16 format. |

**Returns**

`string` - if the approved spender address is not specified, the entire JSON mapping of approved spender-allowances for the token holder is returned. Otherwise, only the approved spender's allowance portion is returned.

```json
{
    "allowances": [
        {
            "<approved_spender_1_address>": "allowance_amount",
            "<approved_spender_2_address>": "allowance_amount"
        }
    ]
}
```

**Usage**

*With approved spender*
```
const result = zilwrap.checkAllowance("0x99f9d482abbdc5f05272a3c34a77e5933bb1c615", "0x13aa1c29698008e78801702be8a43527813ce892");
console.log(JSON.stringify(result, null, 4));

// result
{
    "allowances": [
        {
            "0x13aa1c29698008e78801702be8a43527813ce892": "500"
        }
    ]
}
```

*Without approved spender*
```
const result = zilwrap.checkAllowance("0x99f9d482abbdc5f05272a3c34a77e5933bb1c615");
console.log(JSON.stringify(result, null, 4));

// result
{
    "allowances": [
        {
            "0x4978075dd607933122f4355b220915efa51e84c7": "475",
            "0x13aa1c29698008e78801702be8a43527813ce892": "500"
        }
    ]
}
```

___

### checkBalance

- **checkBalance(`address?`: `string`)**: `string`

Retrieves the wrapped token amount within the contract.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `address` (optional) | string | token holder address in either bech32/checksum/base16 format. |

**Returns**

`string` - Returns a JSON string representation of the token amount. If the address is not specified, the default wallet address is used to query.

```json
{
    "balance": "<token_amount>"
}
```

**Usage**

*With address*
```
const result = zilwrap.checkBalance("0x99f9d482abbdc5f05272a3c34a77e5933bb1c615");
console.log("wrapped token: %o", result.balance);

// result
wrapped token: 10000000000000
```

*Without address*
```
const zilwrap = new Zilwrap(Network.Testnet, 'private_key'); // init default wallet
const result = zilwrap.checkBalance(); // check balance using default wallet
console.log("wrapped token: %o", result.balance);

// result
wrapped token: 10000000000000
```

**Sample Response**

<details>
  <summary>Show</summary>
  <p>

  ```json
  {
      "balances": "10028999999999985"
  }
  ```

  </p>
</details>

___

### wrap

- **wrap(`amount`: `string`)**: `Promise<TxReceipt | undefined>`

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

**Sample Response**

<details>
  <summary>Show</summary>
  <p>

  ```json
  {
      "accepted": true,
      "cumulative_gas": 459,
      "epoch_num": "28913",
      "event_logs": [
          {
              "_eventname": "Minted",
              "address": "0x26e4a2938ef5cd2dd49cafbfef6bc5289c88156b",
              "params": [
                  {
                      "type": "ByStr20",
                      "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                      "vname": "minter"
                  },
                  {
                      "type": "ByStr20",
                      "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                      "vname": "recipient"
                  },
                  {
                      "type": "Uint128",
                      "value": "10000000000000",
                      "vname": "amount"
                  }
              ]
          }
      ],
      "success": true,
      "transitions": [
          {
              "addr": "0x26e4a2938ef5cd2dd49cafbfef6bc5289c88156b",
              "depth": 0,
              "msg": {
                  "_amount": "0",
                  "_recipient": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                  "_tag": "RecipientAcceptMint",
                  "params": [
                      {
                          "type": "ByStr20",
                          "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                          "vname": "minter"
                      },
                      {
                          "type": "ByStr20",
                          "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                          "vname": "recipient"
                      },
                      {
                          "type": "Uint128",
                          "value": "10000000000000",
                          "vname": "amount"
                      }
                  ]
              }
          },
          {
              "addr": "0x26e4a2938ef5cd2dd49cafbfef6bc5289c88156b",
              "depth": 0,
              "msg": {
                  "_amount": "0",
                  "_recipient": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                  "_tag": "MintSuccessCallBack",
                  "params": [
                      {
                          "type": "ByStr20",
                          "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                          "vname": "minter"
                      },
                      {
                          "type": "ByStr20",
                          "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                          "vname": "recipient"
                      },
                      {
                          "type": "Uint128",
                          "value": "10000000000000",
                          "vname": "amount"
                      }
                  ]
              }
          }
      ]
  }
  ```

  </p>
</details>

___

### unwrap

- **unwrap(`tokenAmount`: `string`)**: `Promise<TxReceipt | undefined>`

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

**Sample Response**

<details>
  <summary>Show</summary>
  <p>

  ```json
  {
      "accepted": false,
      "cumulative_gas": 425,
      "epoch_num": "2477623",
      "event_logs": [
          {
              "_eventname": "Burnt",
              "address": "0x197f930d30ad694a12475bd7c24ac7147b37dead",
              "params": [
                  {
                      "type": "ByStr20",
                      "value": "0x4978075dd607933122f4355b220915efa51e84c7",
                      "vname": "burner"
                  },
                  {
                      "type": "ByStr20",
                      "value": "0x4978075dd607933122f4355b220915efa51e84c7",
                      "vname": "burn_account"
                  },
                  {
                      "type": "Uint128",
                      "value": "1000",
                      "vname": "amount"
                  }
              ]
          }
      ],
      "success": true,
      "transitions": [
          {
              "addr": "0x197f930d30ad694a12475bd7c24ac7147b37dead",
              "depth": 0,
              "msg": {
                  "_amount": "1000",
                  "_recipient": "0x4978075dd607933122f4355b220915efa51e84c7",
                  "_tag": "AddFunds",
                  "params": []
              }
          }
      ]
  }

  ```
  </p>
</details>

___

### transfer

- **transfer(`recipient`: `string`, `amount`: `string`)**: `Promise<TxReceipt | undefined>`

Transfer the ZRC2 tokens to another wallet.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `recipient` | string | recipient wallet address in either bech32/checksum/base16 format to transfer the ZRC2 tokens to. |
| `amount` | string | number of ZRC2 tokens to transfer |

**Returns**

`Promise<TxReceipt | undefined>` - Transaction receipt after the transaction is confirmed onchain or undefined if connection error.

**Usage**
```
const result = zilwrap.transfer("0x4978075dd607933122f4355B220915EFa51E84c7", "5"); // transfer 5 ZRC2 tokens
```

**Sample Response**

<details>
  <summary>Show</summary>
  <p>

  ```json
  {
      "accepted": false,
      "cumulative_gas": 485,
      "epoch_num": "29168",
      "event_logs": [
          {
              "_eventname": "TransferSuccess",
              "address": "0x26e4a2938ef5cd2dd49cafbfef6bc5289c88156b",
              "params": [
                  {
                      "type": "ByStr20",
                      "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                      "vname": "sender"
                  },
                  {
                      "type": "ByStr20",
                      "value": "0x825e09187276c167ea186b7ff17f09e2c2db5e17",
                      "vname": "recipient"
                  },
                  {
                      "type": "Uint128",
                      "value": "1000",
                      "vname": "amount"
                  }
              ]
          }
      ],
      "success": true,
      "transitions": [
          {
              "addr": "0x26e4a2938ef5cd2dd49cafbfef6bc5289c88156b",
              "depth": 0,
              "msg": {
                  "_amount": "0",
                  "_recipient": "0x825e09187276c167ea186b7ff17f09e2c2db5e17",
                  "_tag": "RecipientAcceptTransfer",
                  "params": [
                      {
                          "type": "ByStr20",
                          "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                          "vname": "sender"
                      },
                      {
                          "type": "ByStr20",
                          "value": "0x825e09187276c167ea186b7ff17f09e2c2db5e17",
                          "vname": "recipient"
                      },
                      {
                          "type": "Uint128",
                          "value": "1000",
                          "vname": "amount"
                      }
                  ]
              }
          },
          {
              "addr": "0x26e4a2938ef5cd2dd49cafbfef6bc5289c88156b",
              "depth": 0,
              "msg": {
                  "_amount": "0",
                  "_recipient": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                  "_tag": "TransferSuccessCallBack",
                  "params": [
                      {
                          "type": "ByStr20",
                          "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                          "vname": "sender"
                      },
                      {
                          "type": "ByStr20",
                          "value": "0x825e09187276c167ea186b7ff17f09e2c2db5e17",
                          "vname": "recipient"
                      },
                      {
                          "type": "Uint128",
                          "value": "1000",
                          "vname": "amount"
                      }
                  ]
              }
          }
      ]
  }

  ```
  </p>
</details>

___

### transferFrom

- **transferFrom(`sender`: `string`, `recipient`: `string`, `amount`: `string`)**: `Promise<TxReceipt | undefined>`

Transfer using a allowance mechanism; allowing an approved spender to transfer tokens from another user wallet (sender) to the recipient. Approved spender allowance is deducted.

**Note:** Different implementation vs [`transfer()`](api.md#transfer).

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `sender` | string | token holder wallet address to transfer from |
| `recipient` | string | recipient wallet address in either bech32/checksum/base16 format to transfer the ZRC2 tokens to. |
| `amount` | string | number of ZRC2 tokens to transfer |

**Returns**

`Promise<TxReceipt | undefined>` - Transaction receipt after the transaction is confirmed onchain or undefined if connection error.

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

**Sample Response**

<details>
  <summary>Show</summary>
  <p>

  ```json
  {
      "accepted": false,
      "cumulative_gas": 521,
      "epoch_num": "29403",
      "event_logs": [
          {
              "_eventname": "TransferFromSuccess",
              "address": "0x26e4a2938ef5cd2dd49cafbfef6bc5289c88156b",
              "params": [
                  {
                      "type": "ByStr20",
                      "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                      "vname": "initiator"
                  },
                  {
                      "type": "ByStr20",
                      "value": "0x825e09187276c167ea186b7ff17f09e2c2db5e17",
                      "vname": "sender"
                  },
                  {
                      "type": "ByStr20",
                      "value": "0x4978075dd607933122f4355b220915efa51e84c7",
                      "vname": "recipient"
                  },
                  {
                      "type": "Uint128",
                      "value": "50",
                      "vname": "amount"
                  }
              ]
          }
      ],
      "success": true,
      "transitions": [
          {
              "addr": "0x26e4a2938ef5cd2dd49cafbfef6bc5289c88156b",
              "depth": 0,
              "msg": {
                  "_amount": "0",
                  "_recipient": "0x4978075dd607933122f4355b220915efa51e84c7",
                  "_tag": "RecipientAcceptTransferFrom",
                  "params": [
                      {
                          "type": "ByStr20",
                          "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                          "vname": "initiator"
                      },
                      {
                          "type": "ByStr20",
                          "value": "0x825e09187276c167ea186b7ff17f09e2c2db5e17",
                          "vname": "sender"
                      },
                      {
                          "type": "ByStr20",
                          "value": "0x4978075dd607933122f4355b220915efa51e84c7",
                          "vname": "recipient"
                      },
                      {
                          "type": "Uint128",
                          "value": "50",
                          "vname": "amount"
                      }
                  ]
              }
          },
          {
              "addr": "0x26e4a2938ef5cd2dd49cafbfef6bc5289c88156b",
              "depth": 0,
              "msg": {
                  "_amount": "0",
                  "_recipient": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                  "_tag": "TransferFromSuccessCallBack",
                  "params": [
                      {
                          "type": "ByStr20",
                          "value": "0xac941274c3b6a50203cc5e7939b7dad9f32a0c12",
                          "vname": "initiator"
                      },
                      {
                          "type": "ByStr20",
                          "value": "0x825e09187276c167ea186b7ff17f09e2c2db5e17",
                          "vname": "sender"
                      },
                      {
                          "type": "ByStr20",
                          "value": "0x4978075dd607933122f4355b220915efa51e84c7",
                          "vname": "recipient"
                      },
                      {
                          "type": "Uint128",
                          "value": "50",
                          "vname": "amount"
                      }
                  ]
              }
          }
      ]
  }
  ```


  </p>
</details>

___

### increaseAllowance

- **increaseAllowance(`spender`: `string`, `amount`: `string`)**: `Promise<TxReceipt | undefined>`

Increase the allowance of an approved spender over the caller tokens. Only the token holder is allowed to invoke.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `spender` | string | address of the designated approved spender in bech32/checksum/base16 format. |
| `amount` | string | number of ZRC2 tokens as allowance for the approved spender. |

**Returns**

`Promise<TxReceipt | undefined>` - Transaction receipt after the transaction is confirmed onchain or undefined if connection error.

**Usage**
```
const zilwrap = new Zilwrap(Network.Testnet, 'token_holder_private_key'); // init default wallet
const result = zilwrap.increaseAllowance("0x4978075dd607933122f4355b220915efa51e84c7", "500"); // permit user "0x4978" to transfer token holder tokens; limit up to 500 tokens
```

**Sample Response**

<details>
  <summary>Show</summary>
  <p>

  ```json
  {
      "accepted": false,
      "cumulative_gas": 421,
      "epoch_num": "2461601",
      "event_logs": [
          {
              "_eventname": "IncreasedAllowance",
              "address": "0x197f930d30ad694a12475bd7c24ac7147b37dead",
              "params": [
                  {
                      "type": "ByStr20",
                      "value": "0x99f9d482abbdc5f05272a3c34a77e5933bb1c615",
                      "vname": "token_owner"
                  },
                  {
                      "type": "ByStr20",
                      "value": "0x4978075dd607933122f4355b220915efa51e84c7",
                      "vname": "spender"
                  },
                  {
                      "type": "Uint128",
                      "value": "480",
                      "vname": "new_allowance"
                  }
              ]
          }
      ],
      "success": true
  }
  ```


  </p>
</details>

___

### decreaseAllowance

- **decreaseAllownce(`spender`: `string`, `amount`: `string`)**: `Promise<TxReceipt | undefined>`

Decrease the allowance of an approved spender. Only the token holder is allowed to invoke.

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| `spender` | string | address of the designated approved spender in bech32/checksum/base16 format. |
| `amount` | string | number of ZRC2 tokens allowance to deduct from the approved spender. |

**Returns**

`Promise<TxReceipt | undefined>` - Transaction receipt after the transaction is confirmed onchain or undefined if connection error.

**Usage**
```
const zilwrap = new Zilwrap(Network.Testnet, 'token_holder_private_key'); // init default wallet
const result = zilwrap.decreaseAllowance("0x4978075dd607933122f4355b220915efa51e84c7", "10"); // deduct approved spender "0x4978" allowance by 10 tokens.
```

**Sample Response**

<details>
  <summary>Show</summary>
  <p>

  ```json
  {
      "accepted": false,
      "cumulative_gas": 424,
      "epoch_num": "2477641",
      "event_logs": [
          {
              "_eventname": "DecreasedAllowance",
              "address": "0x197f930d30ad694a12475bd7c24ac7147b37dead",
              "params": [
                  {
                      "type": "ByStr20",
                      "value": "0x99f9d482abbdc5f05272a3c34a77e5933bb1c615",
                      "vname": "token_owner"
                  },
                  {
                      "type": "ByStr20",
                      "value": "0x4978075dd607933122f4355b220915efa51e84c7",
                      "vname": "spender"
                  },
                  {
                      "type": "Uint128",
                      "value": "465",
                      "vname": "new_allowance"
                  }
              ]
          }
      ],
      "success": true
  }
  ```


  </p>
</details>