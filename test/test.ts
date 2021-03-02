var assert = require('assert');
const fs = require('fs');
const ZilTest = require('zilliqa-testing-library').default;

describe('Zilwrap-testing', () => {
    const contract = fs.readFileSync(__dirname + "/fixtures/token_contract.scilla", 'utf-8');
    const Test = new ZilTest();
    let contractAddress;

    it('should generate 3 accounts', async () => {
        await Test.generateAccounts(3);
        assert(Test.accounts.length === 3);
    });

    it('should load contract into Testing Suite and run scilla checker', async () => {
        await Test.loadContract(contract);
        assert(Test.contracts.length === 1);
    });

    it('should deploy token contract', async () => {
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
    });

    // deploy token contract
    // beforeEach(() => {

    // });

    it('should return -1 when the value is not present', () => {
        assert.equal([1, 2, 3].indexOf(4), -1);
    });
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