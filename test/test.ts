var assert = require('assert');
const { Network } = require('../lib/constants');
const Zilwrap = require('../lib/index').Zilwrap;
const fs = require('fs');
const ZilTest = require('zilliqa-testing-library').default;
const Test = new ZilTest();

before(async () => {
    console.log("setting up pre-test stuff...");
    const contract = fs.readFileSync(__dirname + "/fixtures/token_contract.scilla", 'utf-8');

    console.log("generating accounts...");
    await Test.generateAccounts(3);
    assert(Test.accounts.length === 3);

    console.log("loading contract: %o", __dirname + "/fixtures/token_contract.scilla");
    await Test.loadContract(contract);
    assert(Test.contracts.length === 1);

});

describe('Zilwrap-testing', () => {
    let deployedAddress = "";

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
        
        const [tx, deployed] = await preparedContract.deploy(
            Test.accounts[0].address,
            {
                contract_owner: Test.accounts[0].address,
                name: "ACME-TOKEN",
                symbol: "ACME",
                decimals: "12",
                init_supply: "0",
            }
        );

        assert(tx.receipt.success === true, "Transaction failed");

        deployedAddress = deployed.address;
    });

    it('should wrap $ZIL to token', async () => {
        const settings = {
            contractAddress: deployedAddress
        };
        const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, settings);
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
        const settings = {
            contractAddress: deployedAddress
        };
        const zilwrap = new Zilwrap(Network.Isolated, Test.accounts[0].privateKey, settings);
        await zilwrap.init();
        assert.rejects(async () => await zilwrap.wrap('9999'), Error, 'Insufficient $ZIL balance')
    });

    // deploy token contract
    // beforeEach(() => {

    // });
});

// remove test.js
after(async () => {
    try {
        console.log("cleaning up tests remnants...");
        fs.unlinkSync(__dirname + "/test.js");
    } catch (err) {
        console.error(err);
    }
});