import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [ticketId, setTicketId] = useState('');
  const [swapFromTicket, setSwapFromTicket] = useState('');
  const [swapToTicket, setSwapToTicket] = useState('');
  const [returnTicketId, setReturnTicketId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [message, setMessage] = useState('');
  const [ticketCount, setTicketCount] = useState(1);
  const [offerPending, setOfferPending] = useState(false);
  const [userTickets, setUserTickets] = useState([]);
  const [acceptSwapInput, setAcceptSwapInput] = useState('');


  const contractAddress = "0x099cdab1370c4e8fed819e5d8c7ea7bbbf0bc170";
  const contractABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"fromTicketId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toTicketId","type":"uint256"}],"name":"SwapOfferAccepted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"fromTicketId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toTicketId","type":"uint256"}],"name":"SwapOfferCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint256","name":"ticketId","type":"uint256"}],"name":"TicketPurchased","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"seller","type":"address"},{"indexed":false,"internalType":"uint256","name":"ticketId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"refundAmount","type":"uint256"}],"name":"TicketReturned","type":"event"},{"inputs":[],"name":"RETURN_FEE_PERCENTAGE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TICKET_PRICE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_toTicketId","type":"uint256"}],"name":"acceptSwapOffer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"addressToTicket","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_fromTicketId","type":"uint256"},{"internalType":"uint256","name":"_toTicketId","type":"uint256"}],"name":"createSwapOffer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"getTicketNumberByAddress","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_ticketId","type":"uint256"}],"name":"isTicketAvailable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"purchaseTicket","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_ticketId","type":"uint256"}],"name":"returnTicket","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"swapOffers","outputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"fromTicketId","type":"uint256"},{"internalType":"uint256","name":"toTicketId","type":"uint256"},{"internalType":"bool","name":"isActive","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ticketCounter","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tickets","outputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bool","name":"isAvailable","type":"bool"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bool","name":"exists","type":"bool"}],"stateMutability":"view","type":"function"},{"stateMutability":"payable","type":"receive"}]
  
  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          const web3 = new Web3(window.ethereum);
          const contractInstance = new web3.eth.Contract(contractABI, contractAddress);
          setContract(contractInstance);
          
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);

          // Fetch user's tickets
          await fetchUserTickets(accounts[0]);
        } catch (error) {
          setMessage('Error connecting to wallet: ' + error.message);
        }
      } else {
        setMessage('Please install MetaMask to use this app.');
      }
    };

    initWeb3();
  }, []);

  const fetchUserTickets = async (userAddress) => {
    try {
      // This method depends on your smart contract implementation
      // You might need to add a method in your contract to retrieve all tickets for a user
      const tickets = await contract.methods.getUserTickets(userAddress).call();
      setUserTickets(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const purchaseTicket = async () => {
    try {
      const ticketPrice = await contract.methods.TICKET_PRICE().call();
      const totalCost = Web3.utils.toBN(ticketPrice).mul(Web3.utils.toBN(ticketCount));

      await contract.methods.purchaseTicket().send({
        from: account,
        value: totalCost.toString(),
      });

      // Refresh user's tickets after purchase
      await fetchUserTickets(account);

      setMessage(`Successfully purchased ${ticketCount} ticket(s)!`);
    } catch (error) {
      setMessage(`Error purchasing ticket: ${error.message}`);
    }
  };

  const refundTicket = async () => {
    try {
      // Validate ticket ownership
      const ticketOwner = await contract.methods.tickets(returnTicketId).call();
      
      if (ticketOwner.owner.toLowerCase() !== account.toLowerCase()) {
        setMessage('Error: You can only refund tickets you own.');
        return;
      }

      // Call refund method on the contract
      await contract.methods.refundTicket(returnTicketId).send({ 
        from: account 
      });

      // Refresh user's tickets after refund
      await fetchUserTickets(account);

      setMessage('Ticket refunded successfully!');
    } catch (error) {
      setMessage(`Error refunding ticket: ${error.message}`);
    }
  };

  const getTicketNumberByAddress = async () => {
    try {
      // Validate wallet address
      if (!Web3.utils.isAddress(walletAddress)) {
        setMessage('Invalid wallet address');
        return;
      }

      const ticketNumber = await contract.methods.getTicketNumberByAddress(walletAddress).call();
      
      if (ticketNumber > 0) {
        setMessage(`Ticket Number for ${walletAddress}: ${ticketNumber}`);
      } else {
        setMessage(`No tickets found for ${walletAddress}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const createSwapOffer = async () => {
    try {
      // Validate input
      if (!swapFromTicket || !swapToTicket) {
        setMessage('Please enter both ticket numbers');
        return;
      }

      // Call contract method to create swap offer
      await contract.methods.createSwapOffer(
        swapFromTicket, 
        swapToTicket
      ).send({ from: account });

      // Set offer as pending
      setOfferPending(true);
      setMessage('Swap Offer Created! Status: Pending');
    } catch (error) {
      setMessage(`Error creating swap offer: ${error.message}`);
      setOfferPending(false);
    }
  };

  const acceptSwapOffer = async () => {
    try {
      // Validate input (can be ticket ID or wallet address)
      if (!acceptSwapInput) {
        setMessage('Please enter a ticket number or wallet address');
        return;
      }

      let ticketId;
      // Check if input is a valid address
      if (Web3.utils.isAddress(acceptSwapInput)) {
        // If it's an address, find the ticket for that address
        ticketId = await contract.methods.getTicketNumberByAddress(acceptSwapInput).call();
      } else {
        // Assume it's a ticket ID
        ticketId = acceptSwapInput;
      }

      // Call contract method to accept swap offer
      await contract.methods.acceptSwapOffer(ticketId).send({ from: account });

      // Clear pending state and show success message
      setOfferPending(false);
      setMessage('Swap Offer Accepted Successfully!');
    } catch (error) {
      setMessage(`Error accepting swap offer: ${error.message}`);
    }
  };




  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>TicketSale Platform</h1>
      
      <div style={{ 
        backgroundColor: '#f4f4f4', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <p><strong>Connected Wallet:</strong> {account || 'Not Connected'}</p>
      </div>

      {/* Ticket Purchase Section */}
      <section style={{ marginBottom: '20px' }}>
        <h3>Purchase Tickets</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            min="1"
            placeholder="Number of tickets"
            value={ticketCount}
            onChange={(e) => setTicketCount(e.target.value)}
            style={{ flex: 1, padding: '10px' }}
          />
          <button 
            onClick={purchaseTicket}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px' 
            }}
          >
            Buy Tickets
          </button>
        </div>
      </section>

      {/* Get Ticket Number Section */}
      <section style={{ marginBottom: '20px' }}>
        <h3>Find Ticket Number</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Enter Wallet Address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            style={{ flex: 1, padding: '10px' }}
          />
          <button 
            onClick={getTicketNumberByAddress}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px' 
            }}
          >
            Get Ticket ID
          </button>
        </div>
      </section>

      {/* Message Display */}
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9', 
          color: message.includes('Error') ? '#d32f2f' : '#2E7D32', 
          borderRadius: '5px' 
        }}>
          {message}
        </div>
      )}

      {/* Offer Swap Section */}
      <section style={{ marginBottom: '20px' }}>
        <h3>Offer Ticket Swap</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Your Ticket Number"
            value={swapFromTicket}
            onChange={(e) => setSwapFromTicket(e.target.value)}
            style={{ flex: 1, padding: '10px' }}
          />
          <input
            type="text"
            placeholder="Ticket Number to Swap With"
            value={swapToTicket}
            onChange={(e) => setSwapToTicket(e.target.value)}
            style={{ flex: 1, padding: '10px' }}
          />
          <button 
            onClick={createSwapOffer}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px' 
            }}
          >
            Offer Swap
          </button>
        </div>
        {offerPending && (
          <div style={{ 
            marginTop: '10px', 
            color: 'orange', 
            fontWeight: 'bold' 
          }}>
            Offer Pending
          </div>
        )}
      </section>

      {/* Accept Swap Section */}
      <section style={{ marginBottom: '20px' }}>
        <h3>Accept Ticket Swap</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Ticket Number or Wallet Address"
            value={acceptSwapInput}
            onChange={(e) => setAcceptSwapInput(e.target.value)}
            style={{ flex: 1, padding: '10px' }}
          />
          <button 
            onClick={acceptSwapOffer}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px' 
            }}
          >
            Accept Swap
          </button>
        </div>
      </section>

      {/* Message Display */}
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9', 
          color: message.includes('Error') ? '#d32f2f' : '#2E7D32', 
          borderRadius: '5px' 
        }}>
          {message}
        </div>
      )}


            {/* Refund Ticket Section */}
            <section style={{ marginBottom: '20px' }}>
        <h3>Refund Ticket</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Enter Ticket ID"
            value={returnTicketId}
            onChange={(e) => setReturnTicketId(e.target.value)}
            style={{ flex: 1, padding: '10px' }}
          />
          <button 
            onClick={refundTicket}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px' 
            }}
          >
            Refund Ticket
          </button>
        </div>
      </section>

      {/* User's Tickets Section */}
      <section>
        <h3>Your Tickets</h3>
        {userTickets.length > 0 ? (
          <ul style={{ 
            listStyleType: 'none', 
            padding: 0, 
            backgroundColor: '#f4f4f4', 
            borderRadius: '8px' 
          }}>
            {userTickets.map((ticket, index) => (
              <li 
                key={index} 
                style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #ddd' 
                }}
              >
                Ticket ID: {ticket.id} | Status: {ticket.isAvailable ? 'Available' : 'Used'}
              </li>
            ))}
          </ul>
        ) : (
          <p>No tickets found</p>
        )}
      </section>


    </div>
  );
}

export default App;