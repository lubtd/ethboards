pragma solidity ^0.4.2;


import "./NujaBattle.sol";
import "./TimeoutStopper.sol";


contract TimeoutStarter {

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    modifier fromTimeoutStopper {
        require(msg.sender == timeoutStopper);
        _;
    }

    address owner;
    address nujaBattle;
    address serverManager;
    address timeoutStopper;
    uint timeoutThreshold;
    bool addressesSet;

    // Information about the current timeout
    mapping (uint => uint8) currentTimeoutPlayer;
    mapping (uint => uint) currentTimeoutTurn;
    mapping (uint => uint) currentTimeoutTimestamp;
    mapping (uint => address) currentTimeoutClaimer;

    // Store player timed out for front-end code
    mapping (uint => uint8) nbTimeout;
    mapping (uint => mapping (uint8 => uint)) timeoutTurn;
    mapping (uint => mapping (uint8 => uint8)) timeoutPlayer;

    // Used to avoid not shared turn attack
    // matchId => turnIndex => turnKey (0-3) => value
    mapping (uint => mapping (uint8 => mapping (uint8 => uint8))) lastMoves;

    // Last signature
    mapping (uint => mapping (uint8 => bytes32)) lastR;
    mapping (uint => mapping (uint8 => bytes32)) lastS;
    mapping (uint => mapping (uint8 => uint8)) lastV;

    // Used to let the front-end code adding the missing last moves
    mapping (uint =>  mapping (uint8 => uint)) lastMovesTurn;
    mapping (uint =>  mapping (uint8 => uint8)) lastMovesPlayer;

    // 0 - 8
    mapping (uint => uint8) lastMovesNb;



    function TimeoutStarter() public {
        owner = msg.sender;
        serverManager = 0x4D336660b3c7267e3aFDd4275ccfFF5B30D697E5;
        nujaBattle = address(0);
        timeoutStopper = address(0);
        addressesSet = false;

        // 300 sec = 5 min
        timeoutThreshold = 30;
    }

    function setAddresses(address nujaBattle_, address timeoutStopper_) public onlyOwner {
        require(!addressesSet);

        nujaBattle = nujaBattle_;
        timeoutStopper = timeoutStopper_;
        addressesSet = true;
    }

    function changeTimeoutThreshold(uint threshold) public onlyOwner {
        timeoutThreshold = threshold;
    }

    function getTimeoutThreshold() public view returns (uint thresholdRet) {
        return timeoutThreshold;
    }


    // Timeout infos

    function isTimeout(uint matchId) public view returns(bool isRet) {
        return (currentTimeoutTimestamp[matchId] > 0);
    }

    function timeoutInfos(uint matchId) public view returns(uint8 timeoutPlayerRet, uint timeoutTurnRet, uint timeoutTimestampRet, address timeoutClaimerRet) {
        require(isTimeout(matchId));
        return (currentTimeoutPlayer[matchId], currentTimeoutTurn[matchId], currentTimeoutTimestamp[matchId], currentTimeoutClaimer[matchId]);
    }

    function getCurrentTimeoutPlayer(uint matchId) public view returns(uint8 timeoutPlayerRet) {
        require(isTimeout(matchId));
        return currentTimeoutPlayer[matchId];
    }

    function getCurrentTimeoutTurn(uint matchId) public view returns(uint timeoutTurnRet) {
        require(isTimeout(matchId));
        return currentTimeoutTurn[matchId];
    }

    function getCurrentTimeoutTimestamp(uint matchId) public view returns(uint timeoutTimestampRet) {
        require(isTimeout(matchId));
        return currentTimeoutTimestamp[matchId];
    }

    function getCurrentTimeoutClaimer(uint matchId) public view returns(address timeoutClaimerRet) {
        require(isTimeout(matchId));
        return currentTimeoutClaimer[matchId];
    }


    // Last moves functions

    function getLastMoves(uint matchId) public view returns(uint8[4][8] moveRet, uint8 nbRet) {
        require(isTimeout(matchId));

        uint8[4][8] memory ret;

        for(uint8 i; i<8; i++) {
            for(uint8 j; j<4; j++) {
                ret[i][j] = lastMoves[matchId][i][j];
            }
        }

        return (ret, lastMovesNb[matchId]);
    }

    function getLastMovesSignature(uint matchId) public view returns(bytes32[8] lastRRet, bytes32[8] lastSRet, uint8[8] lastVRet) {
        require(isTimeout(matchId));

        bytes32[8] memory Rret;
        bytes32[8] memory Sret;
        uint8[8] memory Vret;

        for(uint8 i; i<8; i++) {
            Rret[i] = lastR[matchId][i];
            Sret[i] = lastS[matchId][i];
            Vret[i] = lastV[matchId][i];
        }

        return (Rret, Sret, Vret);
    }

    function getLastMovesMetadata(uint matchId) public view returns(uint[8] turnRet, uint8[8] playerRet) {
        require(isTimeout(matchId));

        uint[8] memory turn;
        uint8[8] memory player;

        for(uint8 i; i<8; i++) {
            turn[i] = lastMovesTurn[matchId][i];
            player[i] = lastMovesPlayer[matchId][i];
        }

        return (turn, player);
    }


    // Timeout metadata

    function getTimeoutPlayers(uint matchId) public view returns(uint8 nbTimeoutRet, uint[8] timeoutTurnRet, uint8[8] timeoutPlayerRet) {
        uint[8] memory turns;
        uint8[8] memory players;

        // Fill turn and player turn
        for(uint8 i=0; i<nbTimeout[matchId]; i++) {
            turns[i] = timeoutTurn[matchId][i];
            players[i] = timeoutPlayer[matchId][i];
        }

        // Fill remaining data
        for(;i<8;i++) {
            turns[i] = 0;
            players[i] = 0;
        }

        return (nbTimeout[matchId], turns, players);
    }


    // Called by anybody to start a timeout process against the player
    function startTimeout(
      uint[3][8] metadata,
      uint[4][8] move,
      uint[176][8] moveOutput,
      bytes32[2][8] signatureRS,
      uint8[8] v,
      uint[176] originState,
      uint8 nbSignature
      ) public {

        // Get contract instance
        //NujaBattle NujaBattle(nujaBattle) = NujaBattle(nujaBattle);

        // Verify caller is on the server
        require(ServerManager(serverManager).isAddressInServer(ServerManager(serverManager).getMatchServer(metadata[0][0]), msg.sender));

        // Verify there is no pending timeout
        require(currentTimeoutTimestamp[metadata[0][0]] == 0);

        if(nbSignature == 0) {
            // First turn to time out
            require(currentTimeoutTurn[metadata[0][0]] == 0 && currentTimeoutPlayer[metadata[0][0]] == 0);
            currentTimeoutTimestamp[metadata[0][0]] = now;
            currentTimeoutClaimer[metadata[0][0]] = msg.sender;
            lastMovesNb[metadata[0][0]] = 0;
        }
        else {
            // Check if it is the first turn
            // During first turn not all alive player are required to be part of the signatures list
            if(metadata[0][1] == 0 && metadata[0][2] == 0) {
                originState = ServerManager(serverManager).getInitialState(ServerManager(serverManager).getMatchServer(metadata[0][0]));
            }

            lastMovesNb[metadata[0][0]] = nbSignature;

            // Verify all signatures
            for(uint8 i=0; i<nbSignature; i++) {

                // Check if this turn has been timed out
                if(NujaBattle(nujaBattle).isTimedout(metadata[i][0], metadata[i][1], metadata[i][2])) {
                    if(i == 0) {
                        uint[176] memory simulatedTurn = NujaBattle(nujaBattle).kill(originState, uint8(metadata[i][2]));
                    }
                    else {
                        simulatedTurn = NujaBattle(nujaBattle).kill(moveOutput[i-1], uint8(metadata[i][2]));
                    }
                }
                else {
                    // Verify that the move have been signed by the player
                    require(NujaBattle(nujaBattle).moveOwner(metadata[i], move[i], moveOutput[i], signatureRS[i][0], signatureRS[i][1], v[i]) == ServerManager(serverManager).getAddressFromIndex(ServerManager(serverManager).getMatchServer(metadata[0][0]), uint8(metadata[i][2])));

                    // Simulate the turn and verify the simulated output is the given output
                    if(i == 0) {
                        simulatedTurn = NujaBattle(nujaBattle).simulate(ServerManager(serverManager).getMatchServer(metadata[0][0]), uint8(metadata[i][2]), uint8(move[i][0]), uint8(move[i][1]), uint8(move[i][2]), uint8(move[i][3]), originState);
                    }
                    else {
                        simulatedTurn = NujaBattle(nujaBattle).simulate(ServerManager(serverManager).getMatchServer(metadata[0][0]), uint8(metadata[i][2]), uint8(move[i][0]), uint8(move[i][1]), uint8(move[i][2]), uint8(move[i][3]), moveOutput[i-1]);
                    }
                }

                // Check integrity
                require(keccak256(simulatedTurn) == keccak256(moveOutput[i]));

                // If not the last turn check the next turn is correctly the next player
                uint[3] memory newMetadata = NujaBattle(nujaBattle).nextTurn(ServerManager(serverManager).getMatchServer(metadata[0][0]), metadata[i], moveOutput[i]);
                if(i < nbSignature-1) {
                    require(newMetadata[0] == metadata[i+1][0]);
                    require(newMetadata[1] == metadata[i+1][1]);
                    require(newMetadata[2] == metadata[i+1][2]);
                }
                else if(metadata[0][1] > 0 || metadata[0][2] > 0) {
                    // Last turn: we verified every alive player signed their turn
                    // Not necessary if the signature list begin from origin
                    require(newMetadata[1] > metadata[0][1] && newMetadata[2] >= metadata[0][2]);   // TOAST
                }

                // Set lastMove to be sure state is shared
                lastMoves[metadata[0][0]][i][0] = uint8(move[i][0]);
                lastMoves[metadata[0][0]][i][1] = uint8(move[i][1]);
                lastMoves[metadata[0][0]][i][2] = uint8(move[i][2]);
                lastMoves[metadata[0][0]][i][3] = uint8(move[i][3]);
                lastMovesTurn[metadata[0][0]][i] = metadata[i][1];
                lastMovesPlayer[metadata[0][0]][i] = uint8(metadata[i][2]);
                lastR[metadata[0][0]][i] = signatureRS[i][0];
                lastS[metadata[0][0]][i] = signatureRS[i][1];
                lastV[metadata[0][0]][i] = v[i];
            }

            // Verify the caller is not the blamed player
            // This technique could be used by the called to kick himself
            // from the server and get back his cheat warrant
            require(ServerManager(serverManager).getAddressFromIndex(ServerManager(serverManager).getMatchServer(metadata[0][0]), uint8(newMetadata[2])) != msg.sender);

            // Set timeout attribute
            // Last metadata is last player
            require(newMetadata[1] > currentTimeoutTurn[metadata[0][0]] || (newMetadata[1] == currentTimeoutTurn[metadata[0][0]] && newMetadata[2] >= currentTimeoutPlayer[metadata[0][0]]));   // TOAST
            currentTimeoutPlayer[metadata[0][0]] = uint8(newMetadata[2]);
            currentTimeoutTurn[metadata[0][0]] = newMetadata[1];
            currentTimeoutTimestamp[metadata[0][0]] = now;
            currentTimeoutClaimer[metadata[0][0]] = msg.sender;
        }
    }


    // Write function for timeoutStopper
    function addLastMove(
      uint matchId,
      uint8 lastMoveIndex,
      uint8 lastMove1,
      uint8 lastMove2,
      uint8 lastMove3,
      uint8 lastMove4
      ) public fromTimeoutStopper {
        lastMoves[matchId][lastMoveIndex][0] = lastMove1;
        lastMoves[matchId][lastMoveIndex][1] = lastMove2;
        lastMoves[matchId][lastMoveIndex][2] = lastMove3;
        lastMoves[matchId][lastMoveIndex][3] = lastMove4;
    }
    function addLastMoveSignature(
      uint matchId,
      uint8 lastMoveIndex,
      bytes32 r,
      bytes32 s,
      uint8 v
      ) public fromTimeoutStopper {
        lastR[matchId][lastMoveIndex] = r;
        lastS[matchId][lastMoveIndex] = s;
        lastV[matchId][lastMoveIndex] = v;
    }
    function addLastMoveMetadata(
      uint matchId,
      uint8 lastMoveIndex,
      uint turn,
      uint8 player
      ) public fromTimeoutStopper {
        lastMovesTurn[matchId][lastMoveIndex] = turn;
        lastMovesPlayer[matchId][lastMoveIndex] = player;
    }



    function updateLastMoveNb(uint matchId, uint8 lastMoveNb_) public fromTimeoutStopper {
        lastMovesNb[matchId] = lastMoveNb_;
    }

    function confirmTimeout(uint matchId) public fromTimeoutStopper {
        timeoutTurn[matchId][nbTimeout[matchId]] = currentTimeoutTurn[matchId];
        timeoutPlayer[matchId][nbTimeout[matchId]] = currentTimeoutPlayer[matchId];
        nbTimeout[matchId] += 1;
    }

    function resetTimeoutTimestamp(uint matchId) public fromTimeoutStopper {
        currentTimeoutTimestamp[matchId] = 0;
    }

    function setCurrentTimeoutInfo(uint matchId, uint turn, uint8 player) public fromTimeoutStopper {
        currentTimeoutPlayer[matchId] = player;
        currentTimeoutTurn[matchId] = turn;
    }
}