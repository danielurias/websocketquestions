var app = new Vue({
	el: "#app",
	data: {
		state: "waiting",
		whichPlayer: "",
		myPlayer: 1,
		score1: 0, 
		score2: 0,
		socket: null,
		questionsReceived: [],
		answerReceived: [],
		question: "",
		answer: "",
		myTurn: true,
		gameOver: true,
		playerDesc: ""
	},
	methods: {
		connectSocket: function () {
			this.socket = new WebSocket('ws://localhost:3000');
			this.socket.onmessage = (event) => {

				var data = JSON.parse(event.data);

				if (data.action == "receive-question") {
					this.receiveQuestion(data);
					this.playerDesc = "Answer the question.";
				} else if (data.action == "receive-answer") {
					this.receiveAnswer(data);
					this.playerDesc = "Answer recieved, Respond to it.";
				} else if (data.action == "send-question") {
					this.newQuestion();
				} else if (data.action == "send-answer") {
					this.newAnswer();
					this.playerDesc = "Wait for a response.";
				} else if (data.action == "correct-answer") {
					this.receivePoint(data);
					this.playerDesc = "You recieved a point! \nIt's now your turn to send question";
				} else if (data.action == "wrong-answer") {
					this.receiveWrong();
					this.playerDesc = "Wrong answer, no points. \nIt's now your turn to send question";
				} else if (data.action == "new-player") {
					this.switchPlayer(data);
				} else if (data.action == "game-over") {
					this.receivePoint(data);
				}
				
				console.log(data);
				console.log("Connection Successful")
			};
		},
		switchPlayer: function (data) {
			this.myPlayer = data['player-number'];
			if (this.myPlayer == 1) {
				this.state = "asking"
				this.playerDesc = "It's your turn to send a question.";
			} else {
				this.playerDesc = "Wait for the question.";
			}
		},
		receiveQuestion: function (data) {
			this.state = "answering";
			this.questionsReceived.push(data.question);
		},
		newQuestion: function () {
			var data = {
				question: this.question,
				action: "send-question"
			};
			this.socket.send(JSON.stringify(data));
			this.question = "";
			this.playerDesc = "Question sent, now waiting for a response";
		},
		receiveAnswer: function (data) {
			this.state = "waiting";
			this.answerReceived.push(data.answer);
		},
		newAnswer: function () {
			var data = {
				answer: this.answer,
				action: "send-answer"
			};
			this.socket.send(JSON.stringify(data))
			this.answer = "";
			this.playerDesc = "Answer sent, now waiting for a response";
		},
		correctAnswer: function () {
			this.myTurn = !this.myTurn
			this.state = "waiting";

			if (this.myPlayer == 1) {
				this.score2 += 1;
			} else {
				this.score1 += 1;
			}
			
			if (this.score1 == 3) {
				this.score1 = 0;
				this.score2 = 0;
				alert("Player 1 has won");
				this.endGame();
			} else if (this.score2 == 3) {
				this.score1 = 0;
				this.score2 = 0;
				alert("Player 2 has won");
				this.endGame();
			} else {
				this.playerDesc = "Response sent, now wait for a question";
			}
			this.socket.send(JSON.stringify({"action": "correct-answer"}))
		},
		receivePoint: function (data) {
			this.myTurn = !this.myTurn
			this.state = "asking";

			if (this.myPlayer == 1) {
				this.score1 += 1;
			} else {
				this.score2 += 1;
			}
			
			if (data.action == "game-over") {
				this.score1 = 0;
				this.score2 = 0;
				alert("Game over you won!");
				this.endGame();			}
		},
		wrongAnswer: function () {
			this.myTurn = !this.myTurn
			this.state = "asking";

			this.socket.send(JSON.stringify({"action": "wrong-answer"}));
			alert("Switch");
			this.playerDesc = "Wait for the question.";
		},
		receiveWrong: function () {
			this.myTurn = !this.myTurn
		},
		endGame: function () {
			questionsReceived = [];
			answerReceived = [];
		}

	},
	created: function () {
		console.log("Vue.js loaded and ready");
		this.connectSocket();
	}
});

