/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import { ClientToServerEvents, GameRoomInterface, ServerToClientEvents } from "@shared/types/SocketTypes";
import prisma from "../prisma";

// Create a new debug instance
const debug = Debug("backend:socket_controller");


let activeGameRooms: GameRoomInterface[] = [];


// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);
// Skapa en global array för att hålla reda på aktiva rum

socket.on("userJoinReq", async (username, callback) => {
    debug("Användare vill ansluta", username);

	// Hitta ett befintligt rum med färre än 2 användare
	let existingRoom = activeGameRooms.find(room => room.users.length < 2);

if (existingRoom) {
    // Om ett rum med färre än 2 användare finns, lägg till användaren till detta rum
    existingRoom.users.push(username);
    debug("Användare tillagd i befintligt rum:", existingRoom);
    // Om det befintliga rummet nu har 2 användare, skicka en händelse för att meddela att spelet kan börja
    if (existingRoom.users.length === 2) {
		socket.join(existingRoom.id);

    	io.to(existingRoom.id).emit("gameStart", existingRoom.users);
		 // Lägg till anslutningen till rummet
    }
	debug("Sent to", existingRoom);
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
}
callback(true);

});
}
