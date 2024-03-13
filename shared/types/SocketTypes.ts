import { User } from "./Models";

export { };

// Events emitted by the server to the client
export interface ServerToClientEvents {
  gameStart: (gameroom: GameRoomInterface, virusShow: number, virusInterval: number) => void;
  nextRound: (gameroom: GameRoomInterface, virusShow: number, virusInterval: number) => void;
  gameOver: (usersInRoom: UserInroom[]) => void;
  roundWinner: (userInRoom: UserInroom) => void;
  latestReactiontime: (usersInRoom: UserInroom[], roomId: string) => void;
  highscore: (creatingHighscore: HighscoreFromUser[]) => void;
  playedGames: (creatingPlayedGames: PlayedGamesUser[]) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  //  userJoinReq: (username: string, callback: (success: boolean, randomNumber: number, randomInterval: number) => void) => void;

  userJoinReq: (username: string, callback: (username: string) => void) => void;
  virusClick: (userId: string, gameroom: GameRoomInterface, virusClicked: number) => void;
  continueGame: (usersInRoom: UserInroom[], roomId: string) => void;
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
}

export interface UserInroom {
  id: string;
  username: string;
  roomId: string | null;
  averageTime: number[];
  score: number | null;
  virusClicked: number | null;
  playedgamesId: string | null;
  higscoresId: string | null; // Fixa stavfel här, ändrade från "higscoresId" till "highscoresId"
}

export interface HighscoreFromUser {
  id: string
  username: string
  averageTimeFromUser: number
}

export interface PlayedGamesUser {
  id: string
  createdAt: Date | null
  userOne:string
  userTwo:string
  userOneScore: number | null
  userTwoScore: number | null
}
