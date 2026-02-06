import { prisma } from './src/lib/db'; async function main() { const dates = await prisma.closedDate.findMany(); console.log(JSON.stringify(dates, null, 2)); } main();
