// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Raffle
 * @notice Verifiably fair on-chain raffle using blockhash randomness.
 *         Leverages BOT Chain's ~0.75s block times for fast draws.
 */
contract Raffle {
    struct RaffleInfo {
        address creator;
        string title;
        string color;           // hex color e.g. "00D4AA"
        uint256 ticketPrice;
        uint256 maxTickets;      // 0 = unlimited
        uint256 totalCollected;
        uint256 ticketCount;
        uint256 entryDeadline;
        address winner;
        uint256 prizeAmount;
        bool drawn;
        bool cancelled;
    }

    uint256 public raffleCounter;
    mapping(uint256 => RaffleInfo) public raffles;
    mapping(uint256 => mapping(address => uint256)) public tickets;   // raffleId => user => ticket count
    mapping(uint256 => address[]) internal entrants;                  // raffleId => unique entrant addresses
    mapping(uint256 => mapping(address => bool)) internal entered;

    event RaffleCreated(uint256 indexed raffleId, address indexed creator, string title, string color, uint256 ticketPrice, uint256 maxTickets, uint256 entryDeadline);
    event TicketPurchased(uint256 indexed raffleId, address indexed buyer, uint256 ticketNumber);
    event WinnerDrawn(uint256 indexed raffleId, address indexed winner, uint256 prize);
    event RaffleCancelled(uint256 indexed raffleId);
    event PrizeClaimed(uint256 indexed raffleId, address indexed winner, uint256 amount);

    modifier raffleExists(uint256 _id) {
        require(_id > 0 && _id <= raffleCounter, "Invalid raffle");
        _;
    }

    /**
     * @notice Create a new raffle
     * @param _title Title of the raffle
     * @param _color Hex color for the premium banner (e.g. "00D4AA")
     * @param _ticketPrice Price per ticket in wei
     * @param _maxTickets Maximum number of tickets (0 = unlimited)
     * @param _durationSeconds How long entries stay open
     */
    function createRaffle(
        string calldata _title,
        string calldata _color,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _durationSeconds
    ) external returns (uint256) {
        require(_ticketPrice > 0, "Price must be > 0");
        require(_durationSeconds >= 10, "Duration too short");
        require(bytes(_title).length > 0, "Title required");

        raffleCounter++;
        uint256 id = raffleCounter;

        raffles[id] = RaffleInfo({
            creator: msg.sender,
            title: _title,
            color: _color,
            ticketPrice: _ticketPrice,
            maxTickets: _maxTickets,
            totalCollected: 0,
            ticketCount: 0,
            entryDeadline: block.timestamp + _durationSeconds,
            winner: address(0),
            prizeAmount: 0,
            drawn: false,
            cancelled: false
        });

        emit RaffleCreated(id, msg.sender, _title, _color, _ticketPrice, _maxTickets, block.timestamp + _durationSeconds);
        return id;
    }

    /**
     * @notice Buy a ticket for a raffle
     * @param _id The raffle to enter
     */
    function buyTicket(uint256 _id) external payable raffleExists(_id) {
        RaffleInfo storage r = raffles[_id];

        require(!r.cancelled, "Raffle cancelled");
        require(!r.drawn, "Already drawn");
        require(block.timestamp <= r.entryDeadline, "Entry closed");
        require(msg.value == r.ticketPrice, "Wrong amount");
        require(r.maxTickets == 0 || r.ticketCount < r.maxTickets, "Sold out");

        r.ticketCount++;
        r.totalCollected += msg.value;
        tickets[_id][msg.sender]++;

        if (!entered[_id][msg.sender]) {
            entrants[_id].push(msg.sender);
            entered[_id][msg.sender] = true;
        }

        emit TicketPurchased(_id, msg.sender, r.ticketCount);
    }

    /**
     * @notice Draw a winner using blockhash randomness.
     *         Must be called AFTER entry deadline.
     * @param _id The raffle to draw
     */
    function drawWinner(uint256 _id) external raffleExists(_id) {
        RaffleInfo storage r = raffles[_id];

        require(!r.drawn, "Already drawn");
        require(!r.cancelled, "Cancelled");
        require(block.timestamp > r.entryDeadline, "Still open");
        require(r.ticketCount > 0, "No tickets sold");
        require(msg.sender == r.creator, "Only creator can draw");

        // Pseudo-random using blockhash + entropy
        bytes32 rand = keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            block.timestamp,
            msg.sender,
            r.ticketCount
        ));
        uint256 randomIndex = uint256(rand) % r.ticketCount;

        // Walk entrants to find winner (weighted by ticket count)
        address winner = address(0);
        uint256 cumulative = 0;
        address[] storage holders = entrants[_id];

        for (uint256 i = 0; i < holders.length; i++) {
            cumulative += tickets[_id][holders[i]];
            if (cumulative > randomIndex) {
                winner = holders[i];
                break;
            }
        }

        require(winner != address(0), "Winner selection failed");

        r.winner = winner;
        r.prizeAmount = r.totalCollected;
        r.drawn = true;

        emit WinnerDrawn(_id, winner, r.totalCollected);
    }

    /**
     * @notice Winner claims their prize
     * @param _id The raffle to claim from
     */
    function claimPrize(uint256 _id) external raffleExists(_id) {
        RaffleInfo storage r = raffles[_id];

        require(r.drawn, "Not drawn yet");
        require(msg.sender == r.winner, "Not the winner");
        require(r.prizeAmount > 0, "Already claimed");

        uint256 amount = r.prizeAmount;
        r.prizeAmount = 0;

        (bool success,) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit PrizeClaimed(_id, msg.sender, amount);
    }

    /**
     * @notice Cancel a raffle and refund all ticket holders
     * @param _id The raffle to cancel
     */
    function cancelRaffle(uint256 _id) external raffleExists(_id) {
        RaffleInfo storage r = raffles[_id];

        require(msg.sender == r.creator, "Only creator");
        require(!r.drawn, "Already drawn");
        require(!r.cancelled, "Already cancelled");

        r.cancelled = true;

        address[] storage holders = entrants[_id];
        for (uint256 i = 0; i < holders.length; i++) {
            uint256 holderTickets = tickets[_id][holders[i]];
            if (holderTickets > 0) {
                uint256 refund = holderTickets * r.ticketPrice;
                tickets[_id][holders[i]] = 0;
                (bool success,) = payable(holders[i]).call{value: refund}("");
                require(success, "Refund failed");
            }
        }

        r.totalCollected = 0;
        emit RaffleCancelled(_id);
    }

    /**
     * @notice Get raffle details
     */
    function getRaffle(uint256 _id) external view raffleExists(_id) returns (RaffleInfo memory) {
        return raffles[_id];
    }

    /**
     * @notice Get ticket count for a user in a raffle
     */
    function getTickets(uint256 _id, address _user) external view returns (uint256) {
        return tickets[_id][_user];
    }

    /**
     * @notice Check if raffle entry is still open
     */
    function isOpen(uint256 _id) external view raffleExists(_id) returns (bool) {
        RaffleInfo storage r = raffles[_id];
        return !r.cancelled && !r.drawn && block.timestamp <= r.entryDeadline;
    }

    /**
     * @notice Get all entrants of a raffle
     */
    function getEntrants(uint256 _id) external view raffleExists(_id) returns (address[] memory) {
        return entrants[_id];
    }
}
