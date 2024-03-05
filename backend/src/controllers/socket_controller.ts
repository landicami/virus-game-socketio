/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types/SocketTypes";
import prisma from "../prisma";
import { createUserInput } from "@shared/types/Models"

// Create a new debug instance
const debug = Debug("backend:socket_controller");

let playerCount: string[] = [];

// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	socket.on("userJoinReq", async (username, callback) => {
		// playerCount.push(username);
		// console.log(playerCount);

		// if(!playerCount) {
		// 	return;
		// }
		// const newUser = await prisma.user.create({
		// 	data: {
		// 		id: socket.id,
		// 		username: username,

		// 	}
		// })
		// const allUsers = await prisma.user.findMany();
		// debug(allUsers.slice(0, 2));
		function randomNumber() {
			return Math.floor(Math.random() * 25) + 1;
		}
		const randomInterval = Math.floor(Math.random() * (8500 - 1500 + 1)) + 1500; // Slumpa ett tal mellan 1500 och 8500

		debug(randomNumber(), randomInterval);

		callback(true, randomNumber(), randomInterval);
		debug("User wants to join", username);


		// const newUser: createUserInput = await prisma.user.create({
		// 	data: {
		// 		id: socket.id,
		// 		username,
		// 	}
		// })

	})
}




