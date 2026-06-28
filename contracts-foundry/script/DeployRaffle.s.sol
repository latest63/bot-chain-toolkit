// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Raffle.sol";

contract DeployRaffle is Script {
    function run() external {
        vm.startBroadcast();

        Raffle raffle = new Raffle();
        console.log("Raffle deployed to:", address(raffle));

        vm.stopBroadcast();
    }
}
