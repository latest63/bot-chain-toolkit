// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/BatchSplitter.sol";
import "../src/Raffle.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        BatchSplitter splitter = new BatchSplitter();
        console.log("BatchSplitter deployed to:", address(splitter));

        Raffle raffle = new Raffle();
        console.log("Raffle deployed to:", address(raffle));

        vm.stopBroadcast();
    }
}
