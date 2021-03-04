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

  // deploy new token contract before each test case
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

  it('should return error when wrapping more $ZIL than current balance', async () => {
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

  it('should return error when unwrapping more tokens than available tokens', async () => {
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

  it('should return error when transferring more than available tokens', async () => {
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

  it('should return error when decreasing more allowance than current available', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.increaseAllowance(Test.accounts[1].address, '10000000000000');
    assert.rejects(async () => await zilwrap.decreaseAllowance(Test.accounts[1].address, '20000000000000'), Error);
  });

  it('should transfer tokens via allowance mechanism from approved spender to recipient', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.wrap('10'); // wrap 10 $ZIL
    await zilwrap.increaseAllowance(Test.accounts[1].address, '10000000000000');

    // switch to Account1
    const zilwrap1 = new Zilwrap(Network.Isolated, Test.accounts[1].privateKey, { contractAddress: deployedAddress });
    await zilwrap1.init();

    // transfer 1000 token on behalf of Account0 to Account2
    const result = await zilwrap1.transferFrom(Test.accounts[0].address, Test.accounts[2].address, '1000');

    const expectedLogs = JSON.parse(`
    [
        {
            "_eventname": "TransferFromSuccess",
            "address": "${deployedAddress.toLowerCase()}",
            "params": [
                {
                    "type": "ByStr20",
                    "value": "${Test.accounts[1].address.toLowerCase()}",
                    "vname": "initiator"
                },
                {
                    "type": "ByStr20",
                    "value": "${Test.accounts[0].address.toLowerCase()}",
                    "vname": "sender"
                },
                {
                    "type": "ByStr20",
                    "value": "${Test.accounts[2].address.toLowerCase()}",
                    "vname": "recipient"
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

    const deployed = Test.deployedContracts[deployedAddress];
    const state = await deployed.getState();

    // check remaining balance and allowance
    assert(state.balances[Test.accounts[0].address.toLowerCase()] === '9999999999000');
    assert(state.balances[Test.accounts[2].address.toLowerCase()] === '1000');
    assert(state.allowances[Test.accounts[0].address.toLowerCase()][Test.accounts[1].address.toLowerCase()] === '9999999999000');
    assert(JSON.stringify(result.event_logs) === JSON.stringify(expectedLogs));
  });

  it('should return error when transferring more tokens than approved spender allowance limit', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.wrap('10'); // wrap 10 $ZIL
    await zilwrap.increaseAllowance(Test.accounts[1].address, '10000000000000');

    // switch to Account1
    const zilwrap1 = new Zilwrap(Network.Isolated, Test.accounts[1].privateKey, { contractAddress: deployedAddress });
    await zilwrap1.init();
    assert.rejects(async () => await zilwrap1.transferFrom(Test.accounts[0].address, Test.accounts[2].address, '20000000000000'), Error);
  });

  it('should return a JSON allowance map of the approved spender', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.increaseAllowance(Test.accounts[1].address, '10000000000000');

    const result = await zilwrap.checkAllowance(Test.accounts[0].address, Test.accounts[1].address);

    const expectedResult = JSON.parse(`
    {
        "allowances": [
            {
                "${Test.accounts[1].address.toLowerCase()}": "10000000000000"
            }
        ]
    }
    `);

    assert(JSON.stringify(result) === JSON.stringify(expectedResult));

    // add delay for next test to prevent errors
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it('should return the list of approved spenders when not specified', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.increaseAllowance(Test.accounts[1].address, '10000000000000');
    await zilwrap.increaseAllowance(Test.accounts[2].address, '10000000000000');

    // add delay for next test to prevent errors
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await zilwrap.checkAllowance(Test.accounts[0].address);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const expectedResult = JSON.parse(`
    {
        "allowances": [
            {
                "${Test.accounts[1].address.toLowerCase()}": "10000000000000",
                "${Test.accounts[2].address.toLowerCase()}": "10000000000000"
            }
        ]
    }
    `);

    assert(JSON.stringify(result) === JSON.stringify(expectedResult));
  });

  it('should return 0 allowance if approved spender is declared but not found', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.increaseAllowance(Test.accounts[1].address, '10000000000000');

    const result = await zilwrap.checkAllowance(Test.accounts[0].address, Test.accounts[2].address);

    // return 0 for Account2
    const expectedResult = JSON.parse(`
    {
        "allowances": [
            {
                "${Test.accounts[2].address.toLowerCase()}": "0"
            }
        ]
    }
    `);

    assert(JSON.stringify(result) === JSON.stringify(expectedResult));
  });

  it('should throw error if token holder cannot be found', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    assert.rejects(
      async () => await zilwrap.checkAllowance(Test.accounts[0].address, Test.accounts[1].address),
      Error,
      'Could not get allowance',
    );
  });

  it('should throw error for check allowance if address is malformed', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    assert.rejects(async () => await zilwrap.checkAllowance('abc123'), Error);
  });

  it('should retrieve token balance of default account if not specified', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.wrap('10'); // wrap 10 $ZIL

    const result = await zilwrap.checkBalance();

    const expectedResult = JSON.parse(`
    {
        "balance": "10000000000000"
    }
    `);

    assert(JSON.stringify(result) === JSON.stringify(expectedResult));
  });

  it('should return 0 token balance if no tokens', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();

    const result = await zilwrap.checkBalance();

    const expectedResult = JSON.parse(`
    {
        "balance": "0"
    }
    `);

    assert(JSON.stringify(result) === JSON.stringify(expectedResult));
  });

  it('should retrieve token balance of specific account if specified', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.wrap('10'); // wrap 10 $ZIL

    const result = await zilwrap.checkBalance(Test.accounts[0].address);

    const expectedResult = JSON.parse(`
    {
        "balance": "10000000000000"
    }
    `);

    assert(JSON.stringify(result) === JSON.stringify(expectedResult));
  });

  it('should return 0 token balance if specified address is not found', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    await zilwrap.wrap('10'); // wrap 10 $ZIL

    // requesting for Account1
    const result = await zilwrap.checkBalance(Test.accounts[1].address);

    const expectedResult = JSON.parse(`
    {
        "balance": "0"
    }
    `);

    assert(JSON.stringify(result) === JSON.stringify(expectedResult));
  });

  it('should throw error for check balance if address is malformed', async () => {
    const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, { contractAddress: deployedAddress });
    await zilwrap.init();
    assert.rejects(async () => await zilwrap.checkBalance('abc123'), Error);
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
