/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	GameRoomInterface,
	ServerToClientEvents,
} from "@shared/types/SocketTypes";
import prisma from "../prisma";
import { createUserInput } from "@shared/types/Models";
import { userInfo } from "os";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

let activeGameRooms: GameRoomInterface[] = [];
function randomNumber() {
	return Math.floor(Math.random() * 25) + 1;
}
const randomInterval = Math.floor(Math.random() * (8500 - 1500 + 1)) + 1500; // Slumpa ett tal mellan 1500 och 8500

debug(randomNumber(), randomInterval);

// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);
	socket.on("userJoinReq", async (username, callback) => {
		debug("Användare vill ansluta", username);

		// Hitta ett befintligt rum med färre än 2 användare
		let existingRoom = activeGameRooms.find(
			(room) => room.users.length < 2
		);

		if (existingRoom) {
			// Om ett rum med färre än 2 användare finns, lägg till användaren till detta rum
			existingRoom.users.push(username);
			let anotherUser = await prisma.user.create({
				data: {
					id: socket.id,
					username: username,
					roomId: existingRoom.id,
				},
			});
			debug("This is anotherUser", anotherUser);

			debug("Användare tillagd i befintligt rum:", existingRoom);
			// Om det befintliga rummet nu har 2 användare, skicka en händelse för att meddela att spelet kan börja
			if (existingRoom.users.length === 2) {
				socket.join(existingRoom.id);

				io.to(existingRoom.id).emit(
					"gameStart",
					existingRoom,
					randomNumber(),
					randomInterval
				);
				callback(true);

				// Lägg till anslutningen till rummet
			}
			debug("Sent to", existingRoom.id);
		} else {
			// Om inget rum med färre än 2 användare finns, skapa ett nytt rum
			let newRoom = await prisma.gameroom.create({
				data: {},
			});
			debug("Nytt rum skapat:", newRoom);

			// Lägg till användaren i det nya rummet
			let newUser = await prisma.user.create({
				data: {
					id: socket.id,
					username: username,
					roomId: newRoom.id,
				},
			});
			debug("Användare tillagd i det nya rummet:", newUser);

			// Lägg till det nya rummet i listan med aktiva rum
			activeGameRooms.push({
				id: newRoom.id,
				users: [username],
			});
			socket.join(newRoom.id);
			debug("the newroomid", newRoom.id);
		}
	});

	socket.on("virusClick", async(virusPressed: number, gameroom: GameRoomInterface, userId:string) => {
		debug("Time it took to click", virusPressed.toFixed(1));
        debug("This is the person who clicked", userId);

        const userthatPressed = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                rounds: virusPressed
            }
        });
        debug("The user has pressed", userthatPressed);
		const findRoomtocompare = await prisma.gameroom.findUnique({
            where: {
                id: gameroom.id
            },
            include: {
                users: true
            },
        });
        debug("fint the room that the users are put in", findRoomtocompare);
        if(!findRoomtocompare){
            return;
        }
        const usersInRoom = findRoomtocompare?.users.map(user => user)
        debug("This is arrayround", usersInRoom);
        if(usersInRoom.length === 2){
            const user1 = usersInRoom[0];
            debug("This is user1", user1)
            const user2 = usersInRoom[1];
            debug("This is user2", user2)

            if (user1.rounds && user2.rounds) {
                // Jämför rounds och tilldela poäng
                if (user1.rounds < user2.rounds) {
					socket.to(gameroom.id).emit("roundWinner", user1.username )
                  debug(`User 1 ${user1.username} får ett poäng.`);
                } else if (user1.rounds > user2.rounds) {
					socket.to(gameroom.id).emit("roundWinner", user2.username )
                  debug(` User 2 ${user2.username} får ett poäng.`);
                } else {
                  debug('Ingen vinner, rounds är lika.');
                }
              } else {
                debug('En eller båda användarna är null.');
              }
            } else {
              debug('Felaktig data, förväntar mig exakt två användare.');
            }


        })
}
// Skapa en global array för att hålla reda på aktiva rum

// socket.on("userJoinReq", async (username, callback) => {
// try {
// 	const newUser = await prisma.user.create({
// 		data: {
// 			username: username,
// 		},
// 	});
// 	function slumpaTal() {
// 		return Math.floor(Math.random() * 25) + 1;
// 	}
// 	debug(slumpaTal());

// 1. Hitta ett rum som bara har en user

// const gameRooms = await prisma.gameroom.findMany({
// 	include: {
// 		users: true,
// 	},
// });

// console.log("Game rooms:", gameRooms);

// const availableRoom = gameRooms.find(
// 	(room) => room.users.length === 1
// );

// console.log("Available room:", availableRoom);

// 		// 2. Om det finns, joina rummet
// 		if (availableRoom) {
// 			await prisma.gameroom.update({
// 				where: {
// 					id: availableRoom.id,
// 				},
// 				data: {
// 					users: {
// 						connect: {
// 							id: newUser.id,
// 						},
// 					},
// 				},
// 			}); // Hur skriver vi detta?

// 			// Add user to socket
// 			socket.join(availableRoom.id);
// 			// Emitta event till socket(?) med roomId
// 			// Detta eventet skickar bara till ovriga
// 			// io.to(availableRoom.id).emit("userJoinedRoom", username);
// 			// Ska vi skicka till alla?
// 			io.to(availableRoom.id).emit("gameStart", availableRoom);
// 			debug(`This is the availableroomData;`, availableRoom.users);
// 		} else {
// 			// 3. Om det inte finns, skapa ett nytt rum och joina det

// 			const newRoom = await createRoom(newUser.id);

// 			console.log("New room created:", newRoom);

// 			socket.join(newRoom.id);
// 		}
// 		// debug("User wants to join", username);
// 	} catch (error) {
// 		console.error("Error while handling userJoinReq", error);
// 		callback(false, 0, 0);
// 	}
// });

// const createRoom = async (userId: string) => {
// 	const newRoom = await prisma.gameroom.create({
// 		data: {
// 			users: {
// 				connect: {
// 					id: userId,
// 				},
// 			},
// 		},
// 	});

// 	return newRoom;
// };

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
// const newUser: createUserInput = await prisma.user.create({
// 	data: {
// 		id: socket.id,
// 		username,
// 	}
// })

// Första spelare joinar > skapa spelrum > socket.join
// Andra spelare joinar > leta efter lediga rum > hittar inget med mindre än 2 spelare > socket.join
// Tredje spelare joinar > letar efter lediga rum > hittar inte > skapa spelrum > socket.join
