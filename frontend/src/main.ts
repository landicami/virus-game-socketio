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

// Connect to Socket.IO Server
console.log("Connecting to Socket.IO Server at:", SOCKET_HOST);
const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_HOST);

let username: string | null = null;
let startTime: number;
let virusPressed: number;

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
  username = trimmedUsername;

  console.log(username);
  if(username) {
    startDiv.classList.add("hide");
    gameDiv.classList.add("hide");
    waitingDiv.classList.remove("hide");

  }

  socket.emit("userJoinReq", username,(callback) => {
      if (!callback) {
        alert("GET THE HELL OUT OF MY FACE");
        return;
      }
      console.log("User has joined through back and front", callback);
      
    }
  );
});

  socket.on("gameStart", (gameroom, virusShow, virusInterval) => {
    console.log("Now the game will start, with the", gameroom);
    console.log(`Virus will appear in div${virusShow} within ${virusInterval} seconds`);
    if(gameroom.users.length === 2){
    startDiv.classList.add("hide");
    waitingDiv.classList.add("hide");
    gameDiv.classList.remove("hide");
    highscoreDiv.classList.add("hide");

    const playerOneParagraph = document.querySelector(".playerOne") as HTMLParagraphElement;
    const playerTwoParagraph = document.querySelector(".playerTwo") as HTMLParagraphElement;

    const players = gameroom.users;
    const playerOne = gameroom.users[0];
    const playerTwo = gameroom.users[1];
    playerOneParagraph.innerText = playerOne;
    playerTwoParagraph.innerText = playerTwo;
    console.log(players, playerOne, playerTwo);

    function getDivandPutvirus(virusShow: number, virusInterval: number) {
      const divID = "div" + virusShow;
      const divElement = document.getElementById(divID) as HTMLDivElement;
    
      if (divElement) {
        setTimeout(function () {
          divElement.innerHTML = `<span class="knife" id="virusEmoji">&#129503;</span>`;
          console.log(divElement);
          startTimer();
          divElement.addEventListener("click", () => {
            virusPressed = virusClicked();
            // virusClicked();
            socket.emit("virusClick", (virusPressed));
          });
        }, virusInterval);
      } else {
        console.log("Kunde inte hitta element med ID: " + divID);
      }
    }
    getDivandPutvirus(virusShow, virusInterval);
  } else {
    waitingDiv.classList.remove("hide");
  }
    
  });

  //stopwatch

let timer: any = null;
let isRunning = false;
let seconds = 0;
let minutes = 0;
let hours = 0;

const startStopButton = document.querySelector("#startStopButton") as HTMLButtonElement;
const display = document.querySelector('#display') as HTMLHeadingElement;
const resetButton = document.querySelector('#resetButton') as HTMLButtonElement;

function startStop() {
    if (!isRunning) {
        timer = setInterval(runStopwatch, 1000);
        startStopButton.innerHTML = 'Stop';
        isRunning = true;
    } else {
        clearInterval(timer);
        startStopButton.innerHTML = 'Start';
        isRunning = false;
    }
}

function runStopwatch() {
    seconds++;
    if (seconds === 60) {
        seconds = 0;
        minutes++;
        if (minutes === 60) {
            minutes = 0;
            hours++;
        }
    }

    display.innerHTML = 
        (hours < 10 ? '0' + hours : hours) + ':' + 
        (minutes < 10 ? '0' + minutes : minutes) + ':' + 
        (seconds < 10 ? '0' + seconds : seconds);
}

function reset() {
    clearInterval(timer);
    isRunning = false;
    seconds = 0;
    minutes = 0;
    hours = 0;
    display.innerHTML = '00:00:00';
    startStopButton.innerHTML = 'Start';
}

startStopButton.addEventListener('click', startStop);
resetButton.addEventListener('click', reset);
