/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	GameRoomInterface,
	ServerToClientEvents,
	playedGamesUser,
} from "@shared/types/SocketTypes";
import prisma from "../prisma";
import { createUserInput } from "@shared/types/Models";
import { userInfo } from "os";
import { resolve } from "path";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

let clickedarray: number[] = [];
let currentRoundinRoom = 0;
let user1count = 0;
let user2count = 0;

interface Round {
	[key: string]: number;
}

interface RoomsInterface {
	[key: string]: {
		rounds: Round[];
	};
}
// rooms {
// 	"12345": {
// rounds: [
// { "player1": 2.5, "player2": 3.5 },
// { "player1": 2.5, "player2": 3.5 },
// { "player1": 2.5 },
// ]
// 	}
// }

const rooms: RoomsInterface = {};

const a = ['a', 'b', 'c'];
a.length; // 3

function getRound(rounds: Round[]): number | null {
	if (rounds.length === 0) {
		// Inga rundor har registrerats
		return null;
	}

	const lastRoundNumber = rounds.length - 1; // 2

	// Object keys = ["player1"]
	if (Object.keys(rounds[lastRoundNumber]).length === 2) {
		// Två spelare har registrerat score
		return null;
	}
	// Returnera index för senaste rundan
	return lastRoundNumber;
}

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

	async function findingHighscores(){
		const allHighscores =  await prisma.highscore.findMany({
			orderBy:{
				averageTimeFromUser: "asc"
			},
			take: 5,
		});

		io.emit("highscore", allHighscores);
	}

	findingHighscores();

	async function findingLastPlayedGames(){

		const allPlayedGames =  await prisma.playedGames.findMany({
			orderBy: {
				createdAt: "desc", // or "id: "desc""
			  },
			  take: 5,
		});
		const playedGamesData: playedGamesUser[] = allPlayedGames.map(game => ({
			id: game.id,
			createdAt: game.createdAt,
			userOne: game.userOne,
			userTwo: game.userTwo,
			userOneScore: game.userOneScore,
			userTwoScore: game.userTwoScore,
			gameroomId: game.gameroomId
		}));

		io.emit("playedGames", playedGamesData);
	}

	findingLastPlayedGames();
	// debug("allscores", allScores);



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
					roomId: existingRoom.id
				},
			});
			debug("This is anotherUser", anotherUser)

			debug("Användare tillagd i befintligt rum:", existingRoom);
			// Om det befintliga rummet nu har 2 användare, skicka en händelse för att meddela att spelet kan börja
			if (existingRoom.users.length === 2) {
				socket.join(existingRoom.id);

				existingRoom.currentRound = existingRoom.currentRound ? existingRoom.currentRound + 1 : 1;
				io.to(existingRoom.id).emit("gameStart", existingRoom, randomNumber(), randomInterval);


				// Lägg till anslutningen till rummet
			}
			debug("Sent to", existingRoom.id);
		} else {
			// Om inget rum med färre än 2 användare finns, skapa ett nytt rum
			let newRoom = await prisma.gameroom.create({
				data: {}
			});
			debug("Nytt rum skapat:", newRoom);

			// Lägg till användaren i det nya rummet
			let newUser = await prisma.user.create({
				data: {
					id: socket.id,
					username: username,
					roomId: newRoom.id
				}
			});
			debug("Användare tillagd i det nya rummet:", newUser);

			// Lägg till det nya rummet i listan med aktiva rum
			activeGameRooms.push({
				id: newRoom.id,
				users: [username]
			});

			socket.join(newRoom.id);
			// Skapa ett rum när f;rsta användaren joinar
			if (rooms[newRoom.id] === undefined) {
				rooms[newRoom.id] = {
					rounds: [],
				};
			}

			debug("the newroomid", newRoom.id);

		}
		callback(username);

	});

	socket.on("virusClick", async (userId: string, roomId: string, username: string, virusPressed: number) => {
		debug("Time it took to click", virusPressed.toFixed(1));

		const userthatPressed = await prisma.user.update({
			where: {
				id: userId
			},
			data: {
				virusClicked: virusPressed,
				averageTime: {
					push: virusPressed
				}
			}
		});
		debug("The user has pressed", userthatPressed);

		//hitta rummet användarna befinner sig i för att kunna jämföra
		const findRoomtocompare = await prisma.gameroom.findUnique({
			where: {
				id: roomId
			},
			include: {
				users: true
			},
		});
		debug("fint the room that the users are put in", findRoomtocompare);
		if (!findRoomtocompare) {
			return;
		}

		const usersInRoom = findRoomtocompare.users.map(user => user)
		let userOne = usersInRoom[0];
		const averageClick1 = userOne.averageTime;
		let userTwo = usersInRoom[1];
		const averageClick2 = userTwo.averageTime;


		debug("This is arrayround", usersInRoom);
		if (usersInRoom.length === 2) {
			const user1 = usersInRoom[0];
			debug("This is user1", user1)
			const user2 = usersInRoom[1];
			debug("This is user2", user2)
			// io.to(roomId).emit("latestReactiontime", usersInRoom)



			if (!user1.virusClicked || !user2.virusClicked) {
				// båda har inte klickat ännu
				return;
			}

			// if (user1.virusClicked && user2.virusClicked) {
			// Jämför rounds och tilldela poäng
			if (user1.virusClicked < user2.virusClicked) {
				io.to(roomId).emit("roundWinner", user1)
				debug(`User 1 ${user1.username} får ett poäng.`);
				user1count++;
				await prisma.user.update({
					where: {
						id: user1.id
					},
					data:{
						score: user1count
					}
				});
			} else {
				io.to(roomId).emit("roundWinner", user2)
				debug(` User 2 ${user2.username} får ett poäng.`);
				user2count++;
				await prisma.user.update({
					where: {
						id: user2.id
					},
					data:{
						score: user2count
					}});
			}
			debug("USer1 score", user1count);
			debug("USer2 score", user2count);
			// } else {
			// 	debug('En eller båda användarna är null.');
			// }
		}
		io.to(roomId).emit("latestReactiontime", usersInRoom)

		currentRoundinRoom++;

		const findRoomAndUpdateRounds = await prisma.gameroom.update({
			where: {
				id: roomId
			},
			data: {
				currentRound: currentRoundinRoom
			},
		});

		function averageClickTime1(){
			let sum1 = 0;
			for(let i = 0; i <averageClick1.length; i++){
				sum1 += averageClick1[i];
			}
			debug("sum1", sum1)
			return sum1 / 10;
		}
		const finalAverageTime1 = averageClickTime1();

		function averageClickTime2(){
			let sum2 = 0;
			for(let i = 0; i <averageClick2.length; i++){
				sum2 += averageClick2[i];
			}
			debug("sum2", sum2);
			return sum2 / 10;
		}

		const finalAverageTime2 = averageClickTime2();
;
		if (findRoomAndUpdateRounds.currentRound === 10) {
			debug("final1", finalAverageTime1);
			debug("final2", finalAverageTime2);

			const creatingHighscore1 = await prisma.highscore.create({
				data: {
					username: userOne.username,
					averageTimeFromUser: finalAverageTime1,
				},
			});
			const creatingHighscore2 = await prisma.highscore.create({
				data: {
					username: userTwo.username,
					averageTimeFromUser: finalAverageTime2,
				},
			});
			debug(creatingHighscore1,creatingHighscore2);

			let timeCreatedGame = new Date;
			const creatingPlayedGames = await prisma.playedGames.create({
				data: {
					createdAt: timeCreatedGame,
					userOne: userOne.username,
					userTwo: userTwo.username,
					userOneScore: userOne.score,
					userTwoScore: userTwo.score,
					gameroomId: roomId,
				},
			});
			debug("creatingPlayedGames", creatingPlayedGames.userOne)
			debug("foundRoom CurrentRound", findRoomAndUpdateRounds.currentRound)
			// socket.emit("highscore", creatingHighscore2 );
			debug("VI vill inte fortsätta med någonting");
			findingHighscores();
			findingLastPlayedGames();
			io.to(roomId).emit("gameOver", roomId);
			//emitta gamestop
		}

		const roomwithUsers = await prisma.gameroom.findUnique({
			where: {
				id: roomId
			},
			include: {
				users: true
			},
		});

		if (!roomwithUsers) {
			debug("Could not find room with id: ", roomId);
			return;
		}

		for (let i = 0; i < roomwithUsers.users.length; i++) {
			await prisma.user.update({
				where: {
					id: roomwithUsers.users[i].id,
				},
				data: {
					virusClicked: null
				},
			});
		}
		io.to(roomId).emit("nextRound", roomId, randomNumber(), randomInterval);



		// io.to(roomId).emit("nextRound", roomId, availableRoundIndex + 1, randomNumber(), randomInterval);

		// Hitta vilken runda det vi ska registrera score för
	// 	const availableRoundIndex = getRound(rooms[roomId].rounds);
	// 	debug("du är på rad 198", availableRoundIndex);

	// 	if (availableRoundIndex === null) {
	// 		// Skapa en ny runda och lägg till score för user
	// 		rooms[roomId].rounds.push({
	// 			[username]: virusPressed,
	// 		})
	// 		// rounds:[
	// 		// ...
	// 		// { player1: 2.5 }
	// 		//]
	// 		debug("Går du inte här i ifsatsen på rad 208?", rooms[roomId].rounds)
	// 	} else {
	// 		// Varför funkar detta?
	// 		rooms[roomId].rounds[availableRoundIndex][username] = virusPressed;
	// 		// rooms['rum1233542345234234234'].rounds[3]['player99] = 55;
	// 		// rounds:[
	// 		// ...
	// 		// { player1: 2.5, player99: 55},
	// 		//]
	// 		// Lägg till score för användaren i den aktuella rundan

	// 		// Om båda spelarna har klickat, skicka nästa runda
	// 		debug("Går du inte här i ifsatsen på rad 220?")

	// 		if (availableRoundIndex !== 10) {
	// 			debug("Går du inte här i ifsatsen på rad 223?")

	// 			//uppdatera användaren med tiden det tog att klicka
	// 			//nolla för båda spelarna i rummet

	// 			debug(rooms[roomId].rounds);
	// 			debug("what round are we at?", availableRoundIndex);
	// 		} else {
	// 			// Avsluta spel
	// 			// Event till alla i rummet
	// 			// Spara i DB
	// 			// delete rooms[roomId];
	// 		}

	// 		debug("Room status:", JSON.stringify(rooms[roomId]));
	// 	}
	 });

};
