// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/Raffle.sol";

contract RaffleTest is Test {
    Raffle raffle;
    address creator = makeAddr("creator");
    address player1 = makeAddr("player1");
    address player2 = makeAddr("player2");
    address player3 = makeAddr("player3");

    function setUp() public {
        raffle = new Raffle();
        vm.deal(creator, 100 ether);
        vm.deal(player1, 100 ether);
        vm.deal(player2, 100 ether);
        vm.deal(player3, 100 ether);
    }

    // --- Create ---

    function test_createRaffle() public {
        vm.prank(creator);
        uint256 id = raffle.createRaffle("Test Raffle", "Test Raffle", "", "00D4AA", 1 ether, 100, 60);

        assertEq(id, 1);
        assertEq(raffle.raffleCounter(), 1);

        Raffle.RaffleInfo memory info = raffle.getRaffle(1);
        assertEq(info.creator, creator);
        assertEq(info.name, "Test Raffle");
        assertEq(info.title, "Test Raffle");
        assertEq(info.color, "00D4AA");
        assertEq(info.ticketPrice, 1 ether);
        assertEq(info.maxTickets, 100);
        assertFalse(info.drawn);
        assertFalse(info.cancelled);
    }

    function test_createRaffle_zeroPrice() public {
        vm.prank(creator);
        vm.expectRevert("Price must be > 0");
        raffle.createRaffle("Test", "Test", "", "00D4AA", 0, 100, 60);
    }

    function test_createRaffle_shortDuration() public {
        vm.prank(creator);
        vm.expectRevert("Duration too short");
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 100, 5);
    }

    function test_createRaffle_emptyTitle() public {
        vm.prank(creator);
        vm.expectRevert("Name required");
        raffle.createRaffle("", "", "", "00D4AA", 1 ether, 100, 60);
    }

    // --- Buy Ticket ---

    function test_buyTicket() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 100, 60);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);

        assertEq(raffle.getTickets(1, player1), 1);
        Raffle.RaffleInfo memory info = raffle.getRaffle(1);
        assertEq(info.ticketCount, 1);
        assertEq(info.totalCollected, 1 ether);
    }

    function test_buyMultipleTickets() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 60);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);
        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);

        assertEq(raffle.getTickets(1, player1), 2);
    }

    function test_buyTicket_wrongAmount() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 100, 60);

        vm.prank(player1);
        vm.expectRevert("Wrong amount");
        raffle.buyTicket{value: 2 ether}(1);
    }

    function test_buyTicket_afterDeadline() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 100, 60);

        vm.warp(block.timestamp + 61);

        vm.prank(player1);
        vm.expectRevert("Entry closed");
        raffle.buyTicket{value: 1 ether}(1);
    }

    function test_buyTicket_soldOut() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 1, 60);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);

        vm.prank(player2);
        vm.expectRevert("Sold out");
        raffle.buyTicket{value: 1 ether}(1);
    }

    // --- Draw ---

    function test_drawWinner() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 10);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);
        vm.prank(player2);
        raffle.buyTicket{value: 1 ether}(1);

        vm.warp(block.timestamp + 11);

        vm.prank(creator);
        raffle.drawWinner(1);

        Raffle.RaffleInfo memory info = raffle.getRaffle(1);
        assertTrue(info.drawn);
        assertTrue(info.winner == player1 || info.winner == player2);
        assertEq(info.prizeAmount, 2 ether);
    }

    function test_drawWinner_stillOpen() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 60);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);

        vm.prank(creator);
        vm.expectRevert("Still open");
        raffle.drawWinner(1);
    }

    function test_drawWinner_notCreator() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 10);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);

        vm.warp(block.timestamp + 11);

        vm.prank(player1);
        vm.expectRevert("Only creator can draw");
        raffle.drawWinner(1);
    }

    function test_drawWinner_noTickets() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 10);

        vm.warp(block.timestamp + 11);

        vm.prank(creator);
        vm.expectRevert("No tickets sold");
        raffle.drawWinner(1);
    }

    // --- Claim ---

    function test_claimPrize() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 10);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);
        vm.prank(player2);
        raffle.buyTicket{value: 1 ether}(1);

        vm.warp(block.timestamp + 11);

        vm.prank(creator);
        raffle.drawWinner(1);

        Raffle.RaffleInfo memory info = raffle.getRaffle(1);
        address winner = info.winner;

        uint256 balBefore = winner.balance;

        vm.prank(winner);
        raffle.claimPrize(1);

        uint256 balAfter = winner.balance;
        assertEq(balAfter - balBefore, 2 ether);

        info = raffle.getRaffle(1);
        assertEq(info.prizeAmount, 0);
    }

    function test_claimPrize_notWinner() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 10);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);

        vm.warp(block.timestamp + 11);

        vm.prank(creator);
        raffle.drawWinner(1);

        Raffle.RaffleInfo memory info = raffle.getRaffle(1);
        address loser = info.winner == player1 ? player2 : player1;

        vm.prank(loser);
        vm.expectRevert("Not the winner");
        raffle.claimPrize(1);
    }

    // --- Cancel ---

    function test_cancelRaffle() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 60);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);
        vm.prank(player2);
        raffle.buyTicket{value: 1 ether}(1);

        uint256 bal1Before = player1.balance;
        uint256 bal2Before = player2.balance;

        vm.prank(creator);
        raffle.cancelRaffle(1);

        assertEq(player1.balance - bal1Before, 1 ether);
        assertEq(player2.balance - bal2Before, 1 ether);

        Raffle.RaffleInfo memory info = raffle.getRaffle(1);
        assertTrue(info.cancelled);
        assertEq(info.totalCollected, 0);
    }

    function test_cancelRaffle_notCreator() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 60);

        vm.prank(player1);
        vm.expectRevert("Only creator");
        raffle.cancelRaffle(1);
    }

    // --- Is Open ---

    function test_isOpen() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 60);

        assertTrue(raffle.isOpen(1));

        vm.warp(block.timestamp + 61);
        assertFalse(raffle.isOpen(1));
    }

    // --- Get Entrants ---

    function test_getEntrants() public {
        vm.prank(creator);
        raffle.createRaffle("Test", "Test", "", "00D4AA", 1 ether, 0, 60);

        vm.prank(player1);
        raffle.buyTicket{value: 1 ether}(1);
        vm.prank(player2);
        raffle.buyTicket{value: 1 ether}(1);

        address[] memory e = raffle.getEntrants(1);
        assertEq(e.length, 2);
        assertEq(e[0], player1);
        assertEq(e[1], player2);
    }

    // --- Events ---

    function test_events_RaffleCreated() public {
        vm.expectEmit(true, true, false, true);
        emit Raffle.RaffleCreated(1, creator, "Test Raffle", "Test Raffle", "", "00D4AA", 1 ether, 100, block.timestamp + 60);

        vm.prank(creator);
        raffle.createRaffle("Test Raffle", "Test Raffle", "", "00D4AA", 1 ether, 100, 60);
    }
}
