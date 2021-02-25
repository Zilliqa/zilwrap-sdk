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
The ZRC2 contract locks $ZIL and returns a ZRC2 compliance token to the user. If the user wishes to unwrap, the ZRC2 contract would deduct the ZRC2 tokens and returns the locked $ZIL.


## API Documentation

Refer to [here](doc/api.md) for API details.
