const hre = require("hardhat");

async function main() {
  const Game2048 = await hre.ethers.getContractFactory("Game2048");
  const game = await Game2048.deploy();

  await game.waitForDeployment();

  console.log("Game2048 deployed to:", await game.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});