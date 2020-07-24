pragma solidity 0.6.11;

import "../Pawn.sol";
import "../StateController.sol";

contract BlueTank is Pawn {
    using StateController for uint8[121];

    function getMetadata() external override view returns (string memory) {
        return '/ipfs/QmW8VQr1qeL2117Gh2UnoJtmqaXQLx9kWYv52CKVVaSw2U';
    }
    function getMoveNumber() external override pure returns(uint8) {
        return 1;
    }

    function performMove(
        uint8 player,
        uint8 pawn,
        uint8 moveType,
        uint8 x,
        uint8 y,
        uint8[121] calldata state
    ) external override pure returns(uint8[121] memory outState) {
        revert("No move");
    }
}