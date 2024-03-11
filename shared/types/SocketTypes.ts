import { User } from "./Models";

export { };

// Events emitted by the server to the client
export interface ServerToClientEvents {
  gameStart: (gameroom: GameRoomInterface, virusShow: number, virusInterval: number) => void;
  nextRound: (roomId: string, virusShow: number, virusInterval: number) => void;
  gameOver: (roomId: string) => void;
  roundWinner: (userInRoom: UsersInroom) => void;
  latestReactiontime: (usersInRoom: UsersInroom[]) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  //  userJoinReq: (username: string, callback: (success: boolean, randomNumber: number, randomInterval: number) => void) => void;

  userJoinReq: (username: string, callback: (username: string) => void) => void;
  virusClick: (userId: string, roomId: string, username: string, virusClicked: number) => void;
  // Ska klienten verkligen skicka när rundan är över? Bör göras av servern
  // nextRound: (roomId: string, round: number) => void;
}

export interface RoomInfo {
  id: string;
  users: User[];
}

export interface GameRoomInterface {
  id: string;
  users: string[];
  currentRound?: number;
}

export interface UsersInroom {
  id: string;
  username: string;
  roomId: string | null;
  virusClicked: number | null;
  playedgamesId: string | null;
  higscoresId: string | null; // Fixa stavfel här, ändrade från "higscoresId" till "highscoresId"
}
