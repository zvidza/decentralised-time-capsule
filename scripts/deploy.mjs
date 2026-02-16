import {
    createHardhatRuntimeEnvironment,
    resolveHardhatConfigPath,
    importUserConfig,
} from "hardhat/hre";
import path from "path";

async function main() {
    const configPath = await resolveHardhatConfigPath();
    const userConfig = await importUserConfig(configPath);
    const projectRoot = path.dirname(configPath);

    const hre = await createHardhatRuntimeEnvironment(
        userConfig,
        { network: "arbitrumSepolia" },
        projectRoot
    );

    console.log("Deploying TimeCapsule contract...");

    const connection = await hre.network.connect();
    const TimeCapsule = await connection.ethers.getContractFactory("TimeCapsule");
    const timeCapsule = await TimeCapsule.deploy();

    await timeCapsule.waitForDeployment();

    const address = await timeCapsule.getAddress();
    console.log("TimeCapsule deployed to:", address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
