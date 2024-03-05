import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  RoomInfo,
  ServerToClientEvents,
} from "@shared/types/SocketTypes";
import "./assets/scss/style.scss";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

//DOM referenser
const userInput = document.querySelector("#nametag") as HTMLInputElement;
const userSubmit = document.querySelector("#user-form") as HTMLFormElement;
const startDiv = document.querySelector("#start") as HTMLDivElement;
const gameDiv = document.querySelector("#game") as HTMLDivElement;

// Connect to Socket.IO Server
console.log("Connecting to Socket.IO Server at:", SOCKET_HOST);
const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_HOST);

let username: string | null = null;

startDiv.classList.remove("hide");
gameDiv.classList.add("hide");

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

	socket.emit("userJoinReq", username, (callback, randomNumber, randomInterval) => {
		if(!callback){
			alert("GET THE HELL OUT OF MY FACE")
			return;
		}
		console.log("User has joined through back and front", callback, randomNumber, randomInterval)
		startDiv.classList.add("hide");
		gameDiv.classList.remove("hide");

	function getDivandPutvirus(randomNumber: number) {
    const divID = "div" + randomNumber; 
    const divElement = document.getElementById(divID) as HTMLDivElement; 

    if (divElement) {
			setTimeout(function() {
				divElement.innerHTML = `<span id="virusEmoji">&#129503;</span>`;
				console.log(divElement);
			}, randomInterval);
	
    } else {
        console.log("Kunde inte hitta element med ID: " + divID);
    }}
	getDivandPutvirus(randomNumber);
	})

});
