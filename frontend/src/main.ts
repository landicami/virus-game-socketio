import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  // RoomInfo,
  ServerToClientEvents,
} from "@shared/types/SocketTypes";
import "./assets/scss/style.scss";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

//DOM referenser
const userInput = document.querySelector("#nametag") as HTMLInputElement;
const userSubmit = document.querySelector("#user-form") as HTMLFormElement;
const startDiv = document.querySelector("#start") as HTMLDivElement;
const gameDiv = document.querySelector("#game") as HTMLDivElement;
const waitingDiv = document.querySelector(".waiting") as HTMLDivElement;
const highscoreDiv = document.querySelector(".highscoreDiv") as HTMLDivElement;

const playerOneParagraph = document.querySelector(".playerOne") as HTMLParagraphElement;
const playerTwoParagraph = document.querySelector(".playerTwo") as HTMLParagraphElement;

const playerOneResult = document.querySelector("#playerOneResult") as HTMLParagraphElement;
const playerTwoResult = document.querySelector("#playerTwoResult") as HTMLParagraphElement;

const playerOneLatestTime = document.querySelector("#playerOneLatestTime") as HTMLParagraphElement;
const playerTwoLatestTime = document.querySelector("#playerTwoLatestTime") as HTMLParagraphElement;

const highscoreUlEl = document.querySelector("#highscoreUl") as HTMLUListElement;
const playedGamesUlEl = document.querySelector("#recentGamesUl") as HTMLUListElement;
const gameOverDiv = document.querySelector("#gameOver") as HTMLDivElement;
const winnerOrLoser = document.querySelector("#winnerOrLoser") as HTMLHeadingElement;
const nextRound = document.querySelector("#nextRound") as HTMLParagraphElement;
// Connect to Socket.IO Server
console.log("Connecting to Socket.IO Server at:", SOCKET_HOST);
const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_HOST);

let username: string = "";
let startTime: number;
let virusPressed: number;
let currentRound = 0;
let currentRoomId: string = "";
let playerOneRoundCount = 0;
let playerTwoRoundCount = 0;

startDiv.classList.remove("hide");
gameDiv.classList.add("hide");
highscoreDiv.classList.remove("hide");
waitingDiv.classList.add("hide");

const startTimer = () => {
  startTime = Date.now();
  console.log(startTime);
  return startTime;
  // return (startTime = Date.now());
};
const virusClicked = () => {
  const endTime = Date.now();
  const timeTaken = endTime - startTime;
  console.log("timeTaken is: ", timeTaken);
  return timeTaken;
};

// Listen for when connection is established
socket.on("connect", () => {
  console.log("💥 Connected to the server", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);
});




// Listen for when server got tired of us
socket.on("disconnect", () => {
  console.log("💀 Disconnected from the server:", SOCKET_HOST);
  alert("A player disconnected from the server, reload page")
  window.location.reload();
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
  console.log("🍽️ Reconnected to the server:", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);
});

userSubmit.addEventListener("submit", (e) => {
  e.preventDefault();

  const trimmedUsername = userInput.value.trim();
  if (!trimmedUsername) {
    return;
  }

  if (trimmedUsername) {
    startDiv.classList.add("hide");
    gameDiv.classList.add("hide");
    waitingDiv.classList.remove("hide");
  }

  socket.emit("userJoinReq", trimmedUsername, (callback) => {

    if (!callback) {
      alert("GET THE HELL OUT OF MY FACE");
      return;
    }
    console.log("User has joined through back and front", callback);
    username = callback;
  }
  );
});

socket.on("highscore", (allHighscores) => {
  console.log("All highscores", allHighscores);
  highscoreUlEl.innerHTML = allHighscores.map(user => `<li>${user.username} - ${user.averageTimeFromUser}`).join("");
});

socket.on("playedGames", (allPlayedGames) => {
  console.log("All highscores", allPlayedGames);
  playedGamesUlEl.innerHTML = allPlayedGames.map(game => `<li>${game.userOne}: ${game.userOneScore} - ${game.userTwo}: ${game.userTwoScore}`).join("");
});





socket.on("gameStart", (gameroom, virusShow, virusInterval) => {
  console.log("Now the game will start, with the", gameroom);
  console.log(`Virus will appear in div${virusShow} within ${virusInterval} seconds`);
  setupGameView(gameroom.users);
  function getDivandPutvirus(virusShow: number, virusInterval: number) {
    const divID = "div" + virusShow;
    const divElement = document.getElementById(divID) as HTMLDivElement;

    if (divElement) {
      setTimeout(function () {
        divElement.innerHTML = `<span id="virusEmoji">&#129503;</span>`;
        console.log(divElement);
        startTimer();
        startstopWatch();
      }, virusInterval);
      function handleClick() {
        stopStopwatch();
        divElement.innerHTML = "";
        virusPressed = virusClicked();
        let userId = socket.id;

        if (!userId) {
          return;
        }
        socket.emit("virusClick", userId, gameroom, virusPressed)
        divElement.removeEventListener("click", handleClick)
      }
      divElement.addEventListener("click", handleClick);

    } else {
      console.log("Kunde inte hitta element med ID: " + divID);
    }
  }
  getDivandPutvirus(virusShow, virusInterval);
  // } else {
  //   waitingDiv.classList.remove("hide");
  // }

});

socket.on("roundWinner", (userInRoom) => {
  const userwithResult = userInRoom;
  console.log(userwithResult);

  //Sätt ut rundans vinnare i DOM
  if (userInRoom.username === playerOneParagraph.innerText) {
    playerOneRoundCount++;
    console.log("username1", username);
    playerOneResult.innerText = `${playerOneRoundCount}`;

  } else {
    playerTwoRoundCount++;
    console.log("username2:", username);
    playerTwoResult.innerText = `${playerTwoRoundCount}`;
  }
});

socket.on("latestReactiontime", (usersInRoom, gameroomId) => {
  if (usersInRoom[0].virusClicked) {
    let virusClickedInSeconds1: string = (usersInRoom[0].virusClicked / 1000).toFixed(3);
    playerOneLatestTime.textContent = virusClickedInSeconds1;
    console.log("Playerone latest time", virusClickedInSeconds1)
  }
  if (usersInRoom[1].virusClicked) {
    let virusClickedInSeconds2: string = (usersInRoom[1].virusClicked / 1000).toFixed(3);
    playerTwoLatestTime.textContent = virusClickedInSeconds2;
    console.log("Playertwo latest time", virusClickedInSeconds2)
  }
  setTimeout(() => {
    // display.innerHTML = "00:000";
    resetTimer();
  }, 1500);
  // socket.emit("continueGame", usersInRoom, gameroomId);
  console.log("EMITTAS DENNA???");
});


socket.on("nextRound", (gameroom, virusShow, virusInterval) => {
  console.log(gameroom);
  function getDivandPutvirus(virusShow: number, virusInterval: number) {
    const divID = "div" + virusShow;
    const divElement = document.getElementById(divID) as HTMLDivElement;

    if (divElement) {
      setTimeout(function () {
        divElement.innerHTML = `<span id="virusEmoji">&#129503;</span>`;
        console.log(divElement);
        startTimer();
        startstopWatch();
      }, virusInterval);

      function handleClick() {
        stopStopwatch();
        divElement.innerHTML = "";
        virusPressed = virusClicked();
        let userId = socket.id;

        if (!userId) {
          return;
        }
        socket.emit("virusClick", userId, gameroom, virusPressed)
        divElement.removeEventListener("click", handleClick)
      }

      divElement.addEventListener("click", handleClick);
    } else {
      console.log("Kunde inte hitta element med ID: " + divID);
    }
  }
  getDivandPutvirus(virusShow, virusInterval);
  currentRound++;
  console.log("Det här är rundan", currentRound);
  // resetTimer();
})
socket.on("gameOver", (usersInRoom) => {
  const userOneResult = usersInRoom[0];
  const userTwoResult = usersInRoom[1];
  highscoreDiv.classList.remove("hide");
  gameDiv.classList.add("hide");
  gameOverDiv.classList.remove("hide");
  winnerOrLoser.innerText = `Game is over!`;
  nextRound.innerText = `The result was: ${userOneResult.username}: ${userOneResult.score} - ${userTwoResult.username}: ${userTwoResult.score}`;

  // alert("Game Over! Fuck you");
});



//stopwatch

let timer = 0;
let isRunning = false;
let milliseconds = 0;
let seconds = 0;

const display = document.querySelector("#display") as HTMLHeadingElement;

function startstopWatch() {
  if (!isRunning) {
    timer = setInterval(runStopwatch, 10);
    isRunning = true;
  }
}

function stopStopwatch() {
  if (isRunning) {
    clearInterval(timer);
    isRunning = false;
  }
}


function runStopwatch() {
  // milliseconds++;
  // if (milliseconds === 100) {
  //   milliseconds = 0;
  //   seconds++;
  // }
  const elapsedTime = Date.now() - startTime;  // 2337 ms
  seconds = Math.floor(elapsedTime / 1000);  // 2
  milliseconds = elapsedTime - (seconds * 1000);   // 2337 - 2000 = 337

  display.innerHTML =
    (seconds < 10 ? '0' + seconds : seconds) + '.' +
    (milliseconds < 10 ? '00' + milliseconds : milliseconds < 100 ? '0' + milliseconds : milliseconds);
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  milliseconds = 0;
  seconds = 0;
  display.innerHTML = '00:00:00';
}

function setupGameView(users: string[]) {
  startDiv.classList.add("hide");
  waitingDiv.classList.add("hide");
  gameDiv.classList.remove("hide");
  highscoreDiv.classList.add("hide");
  const playerOne = users[0];
  const playerTwo = users[1];
  playerOneParagraph.innerText = playerOne;
  playerTwoParagraph.innerText = playerTwo;
}


