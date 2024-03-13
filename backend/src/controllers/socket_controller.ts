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

// Create a new debug instance
const debug = Debug("backend:socket_controller");

interface Round {
	[key: string]: number;
}

interface RoomsInterface {
	[key: string]: {
		rounds: Round[];
	};
}

const rooms: RoomsInterface = {};

const a = ['a', 'b', 'c'];
a.length; // 3

function getRound(rounds: Round[]): number | null {
	if (rounds.length === 0) {
		return null;
	}

	const lastRoundNumber = rounds.length - 1; // 2

	if (Object.keys(rounds[lastRoundNumber]).length === 2) {
		return null;
	}
	return lastRoundNumber;
}

let activeGameRooms: GameRoomInterface[] = [];
function randomNumber() {
	return Math.floor(Math.random() * 25) + 1;
}
function generateRandomInterval() {
	return Math.floor(Math.random() * (10000 - 1500 + 1)) + 1500;
}


// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	async function findingHighscores() {
		const allHighscores = await prisma.highscore.findMany({
			orderBy: {
				averageTimeFromUser: "asc"
			},
			take: 5,
		});

		io.emit("highscore", allHighscores);
	}

	findingHighscores();

	async function findingLastPlayedGames() {

		const allPlayedGames = await prisma.playedGames.findMany({
			orderBy: {
				createdAt: "desc",
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
		}));

		io.emit("playedGames", playedGamesData);
	}

	findingLastPlayedGames();



	socket.on("userJoinReq", async (username, callback) => {
		debug("Användare vill ansluta", username);
		let existingRoom = activeGameRooms.find(
			(room) => room.users.length < 2
		);
		if (existingRoom) {
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
			if (existingRoom.users.length === 2) {
				socket.join(existingRoom.id);
				io.to(existingRoom.id).emit("gameStart", existingRoom, randomNumber(), generateRandomInterval());
			}
			debug("Sent to", existingRoom.id);
		} else {
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
			debug("the newroomid", newRoom.id);
		}
		callback(username);
	});


	socket.on("virusClick", async (userId: string, gameroom: GameRoomInterface, virusPressed: number) => {
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

		const findRoomtocompare = await prisma.gameroom.findUnique({
			where: {
				id: gameroom.id
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

		//Hitta användarna för att rökna ut poängen
		if (usersInRoom.length === 2) {
			const user1 = usersInRoom[0];
			const user2 = usersInRoom[1];


			if (!user1.virusClicked || !user2.virusClicked) {
				// båda har inte klickat ännu
				return;
			}

			// Jämför rounds och tilldela poäng
			if (user1.virusClicked < user2.virusClicked) {

				const newScore = user1.score ? user1.score + 1 : 1;
				await prisma.user.update({
					where: {
						id: user1.id
					},
					data: {
						score: newScore
					}
				});
				io.to(gameroom.id).emit("roundWinner", user1)
			} else {
				const newScore = user2.score ? user2.score + 1 : 1;
				await prisma.user.update({
					where: {
						id: user2.id
					},
					data: {
						score: newScore
					}
				});
				io.to(gameroom.id).emit("roundWinner", user2)
			}
		}
		io.to(gameroom.id).emit("latestReactiontime", usersInRoom, gameroom.id)


		const roomwithUsers = await prisma.gameroom.findUnique({
			where: {
				id: gameroom.id
			},
			include: {
				users: true
			},
		});
		if (!roomwithUsers) {
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
		};

		const findFinalRoomtocompare = await prisma.gameroom.findUnique({
			where: {
				id: gameroom.id
			},
			include: {
				users: true
			},
		});

		if (!findFinalRoomtocompare) {
			return;
		}

		const endGameUsers = findFinalRoomtocompare.users.map(user => user)
		let userOneWithTenClick = endGameUsers[0];
		let userTwoWithTenClick = endGameUsers[1];
		if (userOneWithTenClick.averageTime.length !== 10 && userTwoWithTenClick.averageTime.length !== 10) {
			io.to(gameroom.id).emit("nextRound", gameroom, randomNumber(), generateRandomInterval());
		} else {

			function averageClickTime1() {
				let sum1 = 0;
				for (let i = 0; i < userOneWithTenClick.averageTime.length; i++) {
					sum1 += userOneWithTenClick.averageTime[i];
				}
				return sum1 / 10;
			}
			const finalAverageTime1 = averageClickTime1();

			function averageClickTime2() {
				let sum2 = 0;
				for (let i = 0; i < userTwoWithTenClick.averageTime.length; i++) {
					sum2 += userTwoWithTenClick.averageTime[i];
				}
				debug("sum2", sum2);
				return sum2 / 10;
			}

			const finalAverageTime2 = averageClickTime2();


			const creatingHighscore1 = await prisma.highscore.create({
				data: {
					username: userOneWithTenClick.username,
					averageTimeFromUser: finalAverageTime1,
				},
			});
			const creatingHighscore2 = await prisma.highscore.create({
				data: {
					username: userTwoWithTenClick.username,
					averageTimeFromUser: finalAverageTime2,
				},
			});
			debug(creatingHighscore1, creatingHighscore2);

			let timeCreatedGame = new Date;
			const creatingPlayedGames = await prisma.playedGames.create({
				data: {
					createdAt: timeCreatedGame,
					userOne: userOneWithTenClick.username,
					userTwo: userTwoWithTenClick.username,
					userOneScore: userOneWithTenClick.score,
					userTwoScore: userTwoWithTenClick.score,
				},
			});
			findingHighscores();
			findingLastPlayedGames();

			const usersInRoomToDelete = await prisma.user.findMany({
				where: {
					roomId: gameroom.id
				}
			});

			// Ta bort varje användare i rummet
			for (const user of usersInRoomToDelete) {
				await prisma.user.delete({
					where: {
						id: user.id
					}
				});
			}

			// Ta bort själva rummet
			await prisma.gameroom.delete({
				where: {
					id: gameroom.id
				}
			});

			io.to(gameroom.id).emit("gameOver", endGameUsers);
		}
	});
};
