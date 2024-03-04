/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@shared/types/SocketTypes";
import prisma from "../prisma";
import { createUserInput } from "@shared/types/Models";

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
		try {
			const newUser = await prisma.user.create({
				data: {
					username: username,
				},
			});

			callback(true);

			// 1. Hitta ett rum som bara har en user

			const gameRooms = await prisma.gameroom.findMany({
				include: {
					users: true,
				},
			});

			console.log("Game rooms:", gameRooms);

			const availableRoom = gameRooms.find(
				(room) => room.users.length === 1
			);

			console.log("Available room:", availableRoom);

			// 2. Om det finns, joina rummet
			if (availableRoom) {
				await prisma.gameroom.update({
					where: {
						id: availableRoom.id,
					},
					data: {
						users: {
							connect: {
								id: newUser.id,
							},
						},
					},
				}); // Hur skriver vi detta?

				// Add user to socket
				socket.join(availableRoom.id);
				// Emitta event till socket(?) med roomId
				// Detta eventet skickar bara till ovriga
				// io.to(availableRoom.id).emit("userJoinedRoom", username);
				// Ska vi skicka till alla?
				io.to(availableRoom.id).emit("gameStart", availableRoom.id);
			} else {
				// 3. Om det inte finns, skapa ett nytt rum och joina det

				const newRoom = await createRoom(newUser.id);

				console.log("New room created:", newRoom);

				socket.join(newRoom.id);
			}
			// debug("User wants to join", username);
		} catch (error) {
			console.error("Error while handling userJoinReq", error);
			callback(false);
		}
	});
};

const createRoom = async (userId: string) => {
	const newRoom = await prisma.gameroom.create({
		data: {
			users: {
				connect: {
					id: userId,
				},
			},
		},
	});

	return newRoom;
};

// const updateRoom = async (user: any) => {
// 	const updatedRoom = await prisma.gameroom.update({
// 		where: {
// 			users: {

// 			}
// 		}
// 	})
// }

// playerCount.push(username);
// console.log(playerCount);

// if(!playerCount) {
// 	return;
// }

/**
 * Now i want to look for users in the "waiting" area. As soon as there is two users, take those two
 * and create a room and join it and start the game. Same process whenever a new users joins.
 */

// const newUser: createUserInput = await prisma.user.create({
// 	data: {
// 		id: socket.id,
// 		username,
// 	}
// })

// Första spelare joinar > skapa spelrum > socket.join
// Andra spelare joinar > leta efter lediga rum > hittar inget med mindre än 2 spelare > socket.join
// Tredje spelare joinar > letar efter lediga rum > hittar inte > skapa spelrum > socket.join
