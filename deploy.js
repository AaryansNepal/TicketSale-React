const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const { abi, bytecode } = require('./compile');

// Configuration
const MNEMONIC = 'Secret Phrase';
const PROVIDER_URL = 'https://sepolia.infura.io/v3/f823a4f11ea14717840ca4d83145389a'; // Infura endpoint
const NUM_TICKETS = 100;  // totalTickets parameter
const TICKET_PRICE = '100000000000'; // 0.0001 ETH in wei

// Initialize provider and web3 instance
const provider = new HDWalletProvider(
    MNEMONIC,
    PROVIDER_URL
);

const web3 = new Web3(provider);

const deploy = async () => {
    try {
        // Get accounts
        const accounts = await web3.eth.getAccounts();
        console.log('Attempting to deploy from account', accounts[0]);

        // Deploy contract with constructor parameters
        const contract = await new web3.eth.Contract(abi)
            .deploy({
                data: bytecode,
                arguments: [NUM_TICKETS, TICKET_PRICE] // Matches constructor(uint numTickets, uint price)
            })
            .send({
                from: accounts[0], // Specify the from address
                gas: '3000000', // Adjusted gas limit
                gasPrice: web3.utils.toWei('20', 'gwei') // Adjusted gas price
            });

        console.log('Contract deployed to:', contract.options.address);
        console.log('Total tickets:', NUM_TICKETS);
        console.log('Ticket price:', web3.utils.fromWei(TICKET_PRICE, 'ether'), 'ETH');

    } catch (error) {
        console.error('Deployment failed:', error);
    } finally {
        provider.engine.stop();
    }
};

deploy();

