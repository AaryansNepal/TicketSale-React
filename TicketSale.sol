// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TicketSale {
    // Struct to represent a ticket
    struct Ticket {
        address owner;
        bool isAvailable;
        uint256 price;
        bool exists;
    }

    // Struct to represent a ticket swap offer
    struct SwapOffer {
        address from;
        address to;
        uint256 fromTicketId;
        uint256 toTicketId;
        bool isActive;
    }

    // State variables
    mapping(uint256 => Ticket) public tickets;
    mapping(address => uint256) public addressToTicket;
    mapping(uint256 => SwapOffer) public swapOffers;
    
    uint256 public ticketCounter;
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant RETURN_FEE_PERCENTAGE = 10; // 10% service fee

    // Events
    event TicketPurchased(address buyer, uint256 ticketId);
    event TicketReturned(address seller, uint256 ticketId, uint256 refundAmount);
    event SwapOfferCreated(address from, address to, uint256 fromTicketId, uint256 toTicketId);
    event SwapOfferAccepted(address from, address to, uint256 fromTicketId, uint256 toTicketId);

    // Modifier to check ticket ownership
    modifier onlyTicketOwner(uint256 _ticketId) {
        require(tickets[_ticketId].owner == msg.sender, "You are not the ticket owner");
        _;
    }

    // Purchase a new ticket
    function purchaseTicket() public payable {
        require(msg.value >= TICKET_PRICE, "Insufficient funds to purchase ticket");
        require(addressToTicket[msg.sender] == 0, "You can only own one ticket");

        // Create new ticket
        ticketCounter++;
        tickets[ticketCounter] = Ticket({
            owner: msg.sender,
            isAvailable: true,
            price: TICKET_PRICE,
            exists: true
        });

        // Link address to ticket
        addressToTicket[msg.sender] = ticketCounter;

        // Refund excess payment
        if (msg.value > TICKET_PRICE) {
            payable(msg.sender).transfer(msg.value - TICKET_PRICE);
        }

        emit TicketPurchased(msg.sender, ticketCounter);
    }

    // Return ticket and get partial refund
    function returnTicket(uint256 _ticketId) public onlyTicketOwner(_ticketId) {
        require(tickets[_ticketId].exists, "Ticket does not exist");

        // Calculate refund amount (90% of original price)
        uint256 refundAmount = (TICKET_PRICE * (100 - RETURN_FEE_PERCENTAGE)) / 100;

        // Reset ticket
        delete tickets[_ticketId];
        delete addressToTicket[msg.sender];

        // Transfer refund
        payable(msg.sender).transfer(refundAmount);

        emit TicketReturned(msg.sender, _ticketId, refundAmount);
    }

    // Create a swap offer
    function createSwapOffer(uint256 _fromTicketId, uint256 _toTicketId) public onlyTicketOwner(_fromTicketId) {
        require(tickets[_toTicketId].exists, "Target ticket does not exist");
        require(tickets[_fromTicketId].owner != tickets[_toTicketId].owner, "Cannot swap with yourself");

        SwapOffer memory newOffer = SwapOffer({
            from: msg.sender,
            to: tickets[_toTicketId].owner,
            fromTicketId: _fromTicketId,
            toTicketId: _toTicketId,
            isActive: true
        });

        swapOffers[_fromTicketId] = newOffer;

        emit SwapOfferCreated(msg.sender, tickets[_toTicketId].owner, _fromTicketId, _toTicketId);
    }

    // Accept a swap offer
    function acceptSwapOffer(uint256 _toTicketId) public onlyTicketOwner(_toTicketId) {
        SwapOffer storage offer = swapOffers[_toTicketId];
        require(offer.isActive, "No active swap offer for this ticket");
        require(offer.to == msg.sender, "You are not the recipient of this swap offer");

        // Swap ticket owners
        tickets[offer.fromTicketId].owner = msg.sender;
        tickets[_toTicketId].owner = offer.from;

        // Update address to ticket mappings
        addressToTicket[msg.sender] = offer.fromTicketId;
        addressToTicket[offer.from] = _toTicketId;

        // Deactivate the offer
        offer.isActive = false;

        emit SwapOfferAccepted(offer.from, msg.sender, offer.fromTicketId, _toTicketId);
    }

    // Get active swap offer for a ticket
    function getSwapOffer(uint256 _ticketId) public view returns (address from, address to, uint256 fromTicketId, uint256 toTicketId, bool isActive) {
        SwapOffer memory offer = swapOffers[_ticketId];
        return (offer.from, offer.to, offer.fromTicketId, offer.toTicketId, offer.isActive);
    }
    // Get ticket number by address
    function getTicketNumberByAddress(address _user) public view returns (uint256) {
        return addressToTicket[_user];
    }

    // Check ticket availability
    function isTicketAvailable(uint256 _ticketId) public view returns (bool) {
        return tickets[_ticketId].exists && tickets[_ticketId].isAvailable;
    }

    // Get ticket details
    function getTicketDetails(uint256 _ticketId) public view returns (address owner, bool isAvailable, uint256 price, bool exists) {
        Ticket memory ticket = tickets[_ticketId];
        return (ticket.owner, ticket.isAvailable, ticket.price, ticket.exists);
    }

// New method to get all ticket IDs for a specific user
    function getUserTickets(address _user) public view returns (uint256[] memory) {
        // Create a temporary array to store ticket IDs
        uint256[] memory userTickets = new uint256[](ticketCounter);
        uint256 count = 0;
        
        // Iterate through all tickets to find tickets owned by the user
        for (uint256 i = 1; i <= ticketCounter; i++) {
            if (tickets[i].owner == _user && tickets[i].exists) {
                userTickets[count] = i;
                count++;
            }
        }
        
        // Create a new array with exact size of found tickets
        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = userTickets[j];
        }
        
        return result;
    }

    // Enhanced refund function with more detailed checks
    function refundTicket(uint256 _ticketId) public onlyTicketOwner(_ticketId) {
        require(tickets[_ticketId].exists, "Ticket does not exist");
        require(tickets[_ticketId].isAvailable, "Ticket has already been used");

        // Calculate refund amount (deducting service fee)
        uint256 refundAmount = (TICKET_PRICE * (100 - RETURN_FEE_PERCENTAGE)) / 100;

        // Store ticket details before deletion
        address ticketOwner = tickets[_ticketId].owner;

        // Reset ticket and address mapping
        delete tickets[_ticketId];
        delete addressToTicket[ticketOwner];

        // Transfer refund
        payable(ticketOwner).transfer(refundAmount);

        emit TicketReturned(ticketOwner, _ticketId, refundAmount);
    }

    // Additional helper function to check total number of tickets
    function getTotalTickets() public view returns (uint256) {
        return ticketCounter;
    }


    // Fallback function to receive Ether
    receive() external payable {}
}
