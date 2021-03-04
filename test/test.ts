const assert = require('assert');
const { Network } = require('../lib/constants');
const Zilwrap = require('../lib/index').Zilwrap;
const fs = require('fs');
const ZilTest = require('zilliqa-testing-library').default;
const Test = new ZilTest();

before(async () => {
  console.log('setting up pre-test stuff...');
  const contract = fs.readFileSync(__dirname + '/fixtures/token_contract.scilla', 'utf-8');

  console.log('generating accounts...');
  await Test.generateAccounts(3);
  assert(Test.accounts.length === 3);

  console.log('loading contract: %o', __dirname + '/fixtures/token_contract.scilla');
  await Test.loadContract(contract);
  assert(Test.contracts.length === 1);
});

describe('Zilwrap-testing', () => {
  let deployedAddress = '';

  // it('should deploy token contract', async () => {
  //     const preparedContract = Test.contracts[0];

  //     const [tx, deployed] = await preparedContract.deploy(
  //         Test.accounts[0].address,
  //         {
  //             contract_owner: Test.accounts[0].address,
  //             name: "ACME-TOKEN",
  //             symbol: "ACME",
  //             decimals: "12",
  //             init_supply: "0",
  //         }
  //     );

  //     assert(tx.receipt.success === true, "Transaction failed");

  //     deployedAddress = deployed.address;
  // });

  beforeEach(async () => {
    const preparedContract = Test.contracts[0];

    const [tx, deployed] = await preparedContract.deploy(Test.accounts[0].address, {
      contract_owner: Test.accounts[0].address,
      name: 'ACME-TOKEN',
      symbol: 'ACME',
      decimals: '12',
      init_supply: '0',
    });

    assert(tx.receipt.success === true, 'Transaction failed');

    deployedAddress = deployed.address;
  });

  it('should wrap $ZIL to token', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    const result = await zilwrap.wrap('10'); // wrap 10 $ZIL

    const expectedResult = JSON.parse(`
        [
            {
                "_eventname": "Minted",
                "address": "${deployedAddress.toLowerCase()}",
                "params": [
                    {
                        "type": "ByStr20",
                        "value": "${Test.accounts[0].address.toLowerCase()}",
                        "vname": "minter"
                    },
                    {
                        "type": "ByStr20",
                        "value": "${Test.accounts[0].address.toLowerCase()}",
                        "vname": "recipient"
                    },
                    {
                        "type": "Uint128",
                        "value": "10000000000000",
                        "vname": "amount"
                    }
                ]
            }
        ]
        `);

    const deployed = Test.deployedContracts[deployedAddress];
    const state = await deployed.getState();

    // should have 10000000000000 token = 10$ZIL
    assert(state.balances[Test.accounts[0].address.toLowerCase()] === '10000000000000');

    // compare event logs
    assert(JSON.stringify(result.event_logs) === JSON.stringify(expectedResult));
  });

  it('should return error when wrap more $ZIL than current balance', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    assert.rejects(async () => await zilwrap.wrap('9999'), Error, 'Insufficient $ZIL balance');
  });

  it('should unwrap binded token to $ZIL', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.wrap('10'); // wrap 10 $ZIL

    const result = await zilwrap.unwrap('1000'); // unwrap 1000 tokens (not $ZIL)

    const deployed = Test.deployedContracts[deployedAddress];
    const state = await deployed.getState();

    const expectedLogs = JSON.parse(`
        [
            {
                "_eventname": "Burnt",
                "address": "${deployedAddress.toLowerCase()}",
                "params": [
                    {
                        "type": "ByStr20",
                        "value": "${Test.accounts[0].address.toLowerCase()}",
                        "vname": "burner"
                    },
                    {
                        "type": "ByStr20",
                        "value": "${Test.accounts[0].address.toLowerCase()}",
                        "vname": "burn_account"
                    },
                    {
                        "type": "Uint128",
                        "value": "1000",
                        "vname": "amount"
                    }
                ]
            }
        ]
        `);

    // should have 10000000000000 - 1000
    assert(state.balances[Test.accounts[0].address.toLowerCase()] === '9999999999000');
    assert(JSON.stringify(result.event_logs) === JSON.stringify(expectedLogs));
  });

  it('should return error when unwrap more tokens than available tokens', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.wrap('10'); // wrap 10 $ZIL
    assert.rejects(async () => await zilwrap.unwrap('20000000000000'), Error);
  });

  it('should transfer tokens from sender to receipient', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.wrap('10'); // wrap 10 $ZIL

    // transfer to Account[1]
    const result = await zilwrap.transfer(Test.accounts[1].address, '5000000000000');

    const expectedLogs = JSON.parse(`
    [
        {
            "_eventname": "TransferSuccess",
            "address": "${deployedAddress.toLowerCase()}",
            "params": [
                {
                    "type": "ByStr20",
                    "value": "${Test.accounts[0].address.toLowerCase()}",
                    "vname": "sender"
                },
                {
                    "type": "ByStr20",
                    "value": "${Test.accounts[1].address.toLowerCase()}",
                    "vname": "recipient"
                },
                {
                    "type": "Uint128",
                    "value": "5000000000000",
                    "vname": "amount"
                }
            ]
        }
    ]
    `);

    const deployed = Test.deployedContracts[deployedAddress];
    const state = await deployed.getState();

    assert(state.balances[Test.accounts[0].address.toLowerCase()] === '5000000000000');
    assert(state.balances[Test.accounts[1].address.toLowerCase()] === '5000000000000');
    assert(JSON.stringify(result.event_logs) === JSON.stringify(expectedLogs));
  });

  it('should return error when transfer more than available tokens', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.wrap('10'); // wrap 10 $ZIL

    // transfer to Account[1]
    assert.rejects(async () => await zilwrap.transfer(Test.accounts[1].address, '20000000000000'), Error);
  });

  it('should increase allowance for approved spender', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();

    const result = await zilwrap.increaseAllowance(Test.accounts[1].address, '10000000000000');

    const expectedLogs = JSON.parse(`
    [
        {
            "_eventname": "IncreasedAllowance",
            "address": "${deployedAddress.toLowerCase()}",
            "params": [
                {
                    "type": "ByStr20",
                    "value": "${Test.accounts[0].address.toLowerCase()}",
                    "vname": "token_owner"
                },
                {
                    "type": "ByStr20",
                    "value": "${Test.accounts[1].address.toLowerCase()}",
                    "vname": "spender"
                },
                {
                    "type": "Uint128",
                    "value": "10000000000000",
                    "vname": "new_allowance"
                }
            ]
        }
    ]
    `);

    const deployed = Test.deployedContracts[deployedAddress];
    const state = await deployed.getState();

    assert(state.allowances[Test.accounts[0].address.toLowerCase()][Test.accounts[1].address.toLowerCase()] === '10000000000000');
    assert(JSON.stringify(result.event_logs) === JSON.stringify(expectedLogs));
  });

  it('should decrease allowance for approved spender', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.increaseAllowance(Test.accounts[1].address, '10000000000000');

    const result = await zilwrap.decreaseAllowance(Test.accounts[1].address, '5000000000000');

    const expectedLogs = JSON.parse(`
    [
        {
            "_eventname": "DecreasedAllowance",
            "address": "${deployedAddress.toLowerCase()}",
            "params": [
                {
                    "type": "ByStr20",
                    "value": "${Test.accounts[0].address.toLowerCase()}",
                    "vname": "token_owner"
                },
                {
                    "type": "ByStr20",
                    "value": "${Test.accounts[1].address.toLowerCase()}",
                    "vname": "spender"
                },
                {
                    "type": "Uint128",
                    "value": "5000000000000",
                    "vname": "new_allowance"
                }
            ]
        }
    ]
    `);

    const deployed = Test.deployedContracts[deployedAddress];
    const state = await deployed.getState();

    assert(state.allowances[Test.accounts[0].address.toLowerCase()][Test.accounts[1].address.toLowerCase()] === '5000000000000');
    assert(JSON.stringify(result.event_logs) === JSON.stringify(expectedLogs));
  });
});

// remove test.js
after(async () => {
  try {
    console.log('cleaning up tests remnants...');
    fs.unlinkSync(__dirname + '/test.js');
  } catch (err) {
    console.error(err);
  }
});
