const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Endereços dos contratos já implantados
    const accountFactoryAddress = "0x..."; // Substitua pelo endereço da AccountFactory

    const AccountFactory = await ethers.getContractFactory("AccountFactory");
    const accountFactory = AccountFactory.attach(accountFactoryAddress);

    const owner = deployer.address; // O dono da conta
    const salt = 1; // Um salt qualquer

    console.log("Creating SimpleAccount...");
    const tx = await accountFactory.createAccount(owner, salt);
    await tx.wait();

    console.log("SimpleAccount created.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
