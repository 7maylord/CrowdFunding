import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CrowdFunding Contract", () => {
  const deployCrowdFundingContract = async () => {
    const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

    const [owner, donor1, donor2, stranger] = await hre.ethers.getSigners();

    // Deploy the ERC20 Token (CTK)
    const Token = await hre.ethers.getContractFactory("CTK");
    const token = await Token.deploy();
    await token.waitForDeployment();

    // Transfer tokens to contributors
    await token.mint(owner.address, 5000);
    await token.mint(donor1.address, 1000); 
    await token.mint(donor2.address, 1000);

    // Deploy the CrowdFunding contract
    const CrowdFunding = await hre.ethers.getContractFactory("CrowdFunding");
    const crowdFunding = await CrowdFunding.deploy(await token.getAddress());
    await crowdFunding.waitForDeployment();

    return { token, crowdFunding, owner, donor1, donor2, stranger, ADDRESS_ZERO };
  };

  describe("Deployment", () => {
    it('should be deployed by owner', async() => {
        let { crowdFunding, owner } = await loadFixture(deployCrowdFundingContract);

        const runner = crowdFunding.runner as HardhatEthersSigner;

        expect(runner.address).to.equal(owner.address);
    });

    it("Should deploy CrowdFunding with correct token address", async () => {
      const { owner, crowdFunding } = await loadFixture(deployCrowdFundingContract);
      expect(await crowdFunding.owner()).to.equal(await owner.getAddress());
    });

    it('should not be address zero', async() => {
        let { crowdFunding, ADDRESS_ZERO } = await loadFixture(deployCrowdFundingContract);

        expect(crowdFunding.target).to.not.be.equal(ADDRESS_ZERO);
    }); 
  });

  describe("Creating a Fundraising Campaign", () => {
    it("Should allow owner to create a fundraising campaign", async () => {
      const { crowdFunding, owner } = await loadFixture(deployCrowdFundingContract);
      const goal = ethers.parseEther("10"); // Goal: 10 tokens
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60; // 7 days from now
      
      await expect(crowdFunding.createFundRaising("Health Issue", "Help save Labake", owner, goal, deadline))
        .to.emit(crowdFunding, "FundRaisingStart")

      const campaign = await crowdFunding.fundRaisings(1);
      expect(campaign.goal).to.equal(goal);
      expect(campaign.recipient).to.equal(owner.address);
    });


    it("Should fail if goal is zero", async () => {
      const { crowdFunding, owner } = await loadFixture(deployCrowdFundingContract);
      const goal = ethers.parseEther("0"); 
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60; // 7 days

      await expect(crowdFunding.createFundRaising("Health Issue", "Help save Labake", owner, goal, deadline)).to.be.revertedWithCustomError(crowdFunding, "MustBeGreaterThenZero");
    });
  });

  describe("Donating to Fundraising", () => {
    it("Should allow users to donate", async () => {
      const { crowdFunding, owner, token, donor1 } = await loadFixture(deployCrowdFundingContract);
      const goal = ethers.parseEther("10");
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      await crowdFunding.createFundRaising("Health Issue", "Help save Labake", owner, goal, deadline);      
      await token.transfer(donor1.address, ethers.parseEther("5"));
      await token.connect(owner).transfer(donor1.address, ethers.parseEther("100"));
      await token.connect(donor1).approve(await crowdFunding.getAddress(), ethers.parseEther("5"));

      await expect(crowdFunding.connect(donor1).donate(1, ethers.parseEther("5")))
        .to.emit(crowdFunding, "DonationReceived")
    });

    it("Should fail if donation amount is zero", async () => {
      const { crowdFunding, owner, donor1 } = await loadFixture(deployCrowdFundingContract);
      const goal = ethers.parseEther("10");
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      await crowdFunding.createFundRaising("Health Issue", "Help save Labake", owner, goal, deadline); 

      await expect(crowdFunding.connect(donor1).donate(0, 0)).to.be.revertedWithCustomError(crowdFunding, "InvalidAmount");
    });
  });

  describe("Ending a Fundraising Campaign", () => {
    it("Should allow creator to end campaign after deadline", async () => {
      const { crowdFunding, token,donor1, owner } = await loadFixture(deployCrowdFundingContract);
      const goal = ethers.parseEther("10");
      const deadline = (await time.latest()) + 5; 

      await crowdFunding.createFundRaising("Health Issue", "Help save Labake", owner, goal, deadline); 
      await token.connect(owner).transfer(donor1.address, ethers.parseEther("20"));
      await token.connect(donor1).approve(crowdFunding.target, ethers.parseEther("11"));
      await time.increaseTo(deadline + 1); // Move past deadline
      await expect(crowdFunding.endFundRaising(1))
        .to.emit(crowdFunding, "FundWithdrawn")

      const campaign = await crowdFunding.fundRaisings(1);
      expect(campaign.hasEnded).to.be.true;
    });

    it("Should fail if campaign is still active", async () => {
      const { crowdFunding, token, donor1, owner } = await loadFixture(deployCrowdFundingContract);
      const goal = ethers.parseEther("10");
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;


      await crowdFunding.createFundRaising("Health Issue", "Help save Labake", owner, goal, deadline); 
      await token.connect(owner).transfer(donor1.address, ethers.parseEther("20"));
      await token.connect(donor1).approve(crowdFunding.target, ethers.parseEther("8"));

      await expect(crowdFunding.endFundRaising(1)).to.be.revertedWithCustomError(crowdFunding,"FundRaisingNotMet");
    });
  });
});
