import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
	// await prisma.gameroom.upsert({
	// 	where: {
	// 		name: "GamersPalace",
	// 	},
	// 	update: {},
	// 	create: {
	// 		name: "GamersPalace",
	// 	},
	// });
	// await prisma.gameroom.upsert({
	// 	where: {
	// 		name: "ChickenDinner",
	// 	},
	// 	update: {},
	// 	create: {
	// 		name: "ChickenDinner",
	// 	},
	// });
	// await prisma.gameroom.upsert({
	// 	where: {
	// 		name: "HardcoreGaming",
	// 	},
	// 	update: {},
	// 	create: {
	// 		name: "HardcoreGaming",
	// 	},
	// });
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
