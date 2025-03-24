import hre, { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

async function main() {
  const [deployer, donor1, donor2, recipient] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the CTK Token
  const CTK = await ethers.getContractFactory("CTK");
  const ctk = await CTK.deploy();
  await ctk.waitForDeployment();
  const ctkAddress = await ctk.getAddress();
  console.log("CTK Token deployed at:", ctkAddress);

  // Deploy the CrowdFunding Contract
  const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
  const crowdfunding = await CrowdFunding.deploy(ctkAddress);
  await crowdfunding.waitForDeployment();
  const crowdfundingAddress = await crowdfunding.getAddress();
  console.log("CrowdFunding Contract deployed at:", crowdfundingAddress)

  // Mint tokens to donors
  const mintAmount = ethers.parseUnits("100", 18)
  await ctk.mint(donor1.address, mintAmount);
  await ctk.mint(donor2.address, mintAmount);
  console.log("Minted CTK to donors");

  // Approve the CrowdFunding contract to spend donors' tokens
  await ctk.connect(donor1).approve(crowdfunding.getAddress(), mintAmount);
  await ctk.connect(donor2).approve(crowdfunding.getAddress(), mintAmount);
  console.log("Donors approved spending");

  // Create a fundraising campaign
  const goal = ethers.parseUnits("50", 18)
  const duration = 60 * 10; // 10 minutes
  const createTx = await crowdfunding
    .connect(deployer)
    .createFundRaising("Medical Aid", "Help for surgery", recipient.getAddress(), goal, duration);
  await createTx.wait();
  console.log("Created a crowdfunding campaign");

  // Donate to the fundraising
  const fundId = 1;
  const donationAmount = ethers.parseUnits("25", 18)
  await crowdfunding.connect(donor1).donate(fundId, donationAmount);
  await crowdfunding.connect(donor2).donate(fundId, donationAmount);
  console.log("Donors contributed to the campaign");

  // End the fundraising campaign
  await crowdfunding.connect(recipient).endFundRaising(fundId);
  console.log("Fundraising campaign ended");

  // Attempt refund if goal not met
  try {
    await crowdfunding.connect(donor1).refund(fundId);
    console.log("Refund issued to donor1");
  } catch (error) {
    console.log("No refund required as goal was met");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
