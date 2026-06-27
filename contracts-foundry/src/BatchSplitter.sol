// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title BatchSplitter
 * @notice Send native BOT tokens to multiple recipients in a single transaction.
 *         Saves gas vs individual transfers and leverages BOT Chain's near-zero fees.
 */
contract BatchSplitter {
    event BatchSent(
        address indexed sender,
        uint256 recipientCount,
        uint256 totalAmount
    );

    event IndividualSent(
        address indexed sender,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice Send equal amounts to multiple recipients
     * @param recipients Array of recipient addresses
     * @dev msg.value is split equally among all recipients
     */
    function splitEqually(address[] calldata recipients) external payable {
        require(recipients.length > 0, "No recipients");
        require(msg.value > 0, "No value sent");

        uint256 share = msg.value / recipients.length;
        require(share > 0, "Share too small");

        uint256 totalSent = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            (bool success,) = payable(recipients[i]).call{value: share}("");
            require(success, "Transfer failed");
            totalSent += share;
            emit IndividualSent(msg.sender, recipients[i], share);
        }

        // Refund remainder due to integer division
        uint256 remainder = msg.value - totalSent;
        if (remainder > 0) {
            (bool success,) = payable(msg.sender).call{value: remainder}("");
            require(success, "Refund failed");
        }

        emit BatchSent(msg.sender, recipients.length, totalSent);
    }

    /**
     * @notice Send specific amounts to each recipient
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts (in wei) for each recipient
     */
    function splitCustom(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable {
        require(recipients.length > 0, "No recipients");
        require(recipients.length == amounts.length, "Length mismatch");

        uint256 totalRequired = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalRequired += amounts[i];
        }
        require(msg.value >= totalRequired, "Insufficient value");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Zero amount");
            (bool success,) = payable(recipients[i]).call{value: amounts[i]}("");
            require(success, "Transfer failed");
            emit IndividualSent(msg.sender, recipients[i], amounts[i]);
        }

        // Refund excess
        uint256 excess = msg.value - totalRequired;
        if (excess > 0) {
            (bool success,) = payable(msg.sender).call{value: excess}("");
            require(success, "Refund failed");
        }

        emit BatchSent(msg.sender, recipients.length, totalRequired);
    }
}
