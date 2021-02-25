# Zilwrap API Documentation

## Contents

### Contructors
- constructor

### Methods
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

### checkAllowance


