// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/BatchSplitter.sol";

contract BatchSplitterTest is Test {
    BatchSplitter splitter;
    address addr1 = makeAddr("addr1");
    address addr2 = makeAddr("addr2");
    address addr3 = makeAddr("addr3");

    function setUp() public {
        splitter = new BatchSplitter();
        vm.deal(addr1, 10 ether);
        vm.deal(addr2, 10 ether);
        vm.deal(addr3, 10 ether);
    }

    function test_splitEqually_basic() public {
        address[] memory recipients = new address[](3);
        recipients[0] = addr1;
        recipients[1] = addr2;
        recipients[2] = addr3;

        uint256 bal1Before = addr1.balance;
        uint256 bal2Before = addr2.balance;

        splitter.splitEqually{value: 3 ether}(recipients);

        assertEq(addr1.balance - bal1Before, 1 ether);
        assertEq(addr2.balance - bal2Before, 1 ether);
    }

    function test_splitEqually_refundsRemainder() public {
        address[] memory recipients = new address[](2);
        recipients[0] = addr1;
        recipients[1] = addr2;

        splitter.splitEqually{value: 1.001 ether}(recipients);

        // 1.001 / 2 = 0.5005 ether each, no remainder (exact division)
        assertEq(addr1.balance, 10.5005 ether);
        assertEq(addr2.balance, 10.5005 ether);
    }

    function test_splitEqually_noRecipients() public {
        address[] memory recipients = new address[](0);
        vm.expectRevert("No recipients");
        splitter.splitEqually{value: 1 ether}(recipients);
    }

    function test_splitEqually_noValue() public {
        address[] memory recipients = new address[](1);
        recipients[0] = addr1;
        vm.expectRevert("No value sent");
        splitter.splitEqually{value: 0}(recipients);
    }

    function test_splitCustom_basic() public {
        address[] memory recipients = new address[](2);
        recipients[0] = addr1;
        recipients[1] = addr2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 0.5 ether;
        amounts[1] = 1.5 ether;

        uint256 bal1Before = addr1.balance;
        uint256 bal2Before = addr2.balance;

        splitter.splitCustom{value: 2 ether}(recipients, amounts);

        assertEq(addr1.balance - bal1Before, 0.5 ether);
        assertEq(addr2.balance - bal2Before, 1.5 ether);
    }

    function test_splitCustom_lengthMismatch() public {
        address[] memory recipients = new address[](1);
        recipients[0] = addr1;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;

        vm.expectRevert("Length mismatch");
        splitter.splitCustom{value: 3 ether}(recipients, amounts);
    }

    function test_splitCustom_insufficientValue() public {
        address[] memory recipients = new address[](1);
        recipients[0] = addr1;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 2 ether;

        vm.expectRevert("Insufficient value");
        splitter.splitCustom{value: 1 ether}(recipients, amounts);
    }

    function test_splitEqually_manyRecipients() public {
        uint256 count = 50;
        address[] memory recipients = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            recipients[i] = makeAddr(string.concat("r", vm.toString(i)));
        }

        splitter.splitEqually{value: 5 ether}(recipients);

        for (uint256 i = 0; i < count; i++) {
            assertEq(recipients[i].balance, 0.1 ether);
        }
    }

    function test_splitEqually_events() public {
        address[] memory recipients = new address[](2);
        recipients[0] = addr1;
        recipients[1] = addr2;

        vm.expectEmit(true, true, false, true);
        emit BatchSplitter.BatchSent(address(this), 2, 1 ether);

        splitter.splitEqually{value: 1 ether}(recipients);
    }
}
