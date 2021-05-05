const express = require('express');
const WebSocket = require('ws');

const port = process.env.PORT || 3000
var app = express();
app.use(express.static('public'))

var server = app.listen(port, function () {
	console.log("Server is listening on port:", port);
});

const wss = new WebSocket.Server({ server: server });

var player1 = null;
var player2 = null;
var playerTurn = 1

var points1 = 0;
var points2 = 0;

function sendToOther(newClient, data) {
    wss.clients.forEach(function each(client) {
        if (client !== newClient && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        } 
    });
}

function messageRecieved(newClient, playerNumber) {
    newClient.on('message', function incoming(data) {
        console.log("player",playerNumber, "sent a message", data);
        var data = JSON.parse(data);

        if (data.action == "send-question") {
            if (playerNumber == playerTurn) {
                dataToSend = {'action': "receive-question", "question": data.question}
                sendToOther(newClient, dataToSend);
            }       
        } else if (data.action == "send-answer") {
            if (playerNumber != playerTurn) {
                dataToSend = {'action': "receive-answer", "answer": data.answer}
                sendToOther(newClient, dataToSend);
            }
        } else if (data.action == 'correct-answer') {
            if (playerNumber == playerTurn) {
                if (playerTurn == 1) {
                    playerTurn = 2;
                    points1 += 1;
                } else {
                    playerTurn = 1;
                    points2 += 1;
                }

                if (points1 == 3) {
                    data = {'action': 'game-over'};
                    sendToOther(newClient, data)
                } else if (points2 == 3) {
                    data = {'action': 'game-over'};
                    sendToOther(newClient, data)
                } 
                
                else {
                    data = {'action': 'correct-answer'};
                    sendToOther(newClient, data)
                }
            }
        } else if (data.action = "wrong-answer") {
            if (playerNumber == playerTurn) {
                if (playerTurn == 1) {
                    playerTurn = 2
                } else {
                    playerTurn = 1
                }
                sendToOther(newClient, data)
            }
        }
    });
};

wss.on('connection', function (newClient, request) {
    if (player1 === null) {
        player1 = newClient;
        player1.send(JSON.stringify({ 'action': 'new-player', 'player-number': 1, 'turn': true }))

        console.log("Welcome player 1, now waiting for player 2");
        messageRecieved(newClient, 1);
    } else {
        player2 = newClient;
        player2.send(JSON.stringify({ 'action': 'new-player', 'player-number': 2, 'turn': false }))

        console.log("Welcome player 2");
        messageRecieved(newClient, 2);
    }
});

