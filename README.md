# CrowdFunding Smart Contract

This is a decentralized crowdfunding smart contract built on Ethereum, allowing users to create fundraising campaigns, donate using an ERC-20 token, and withdraw funds or request refunds when necessary.

## Features
- **Create Fundraising Campaigns**: Users can start a fundraising campaign with a title, description, recipient address, goal amount, and duration.
- **Donate**: Supporters can donate using an ERC-20 token.
- **Withdraw Funds**: If the goal is met, the recipient can withdraw funds.
- **Refund Contributors**: If the goal is not met by the deadline, donors can request a refund.
- **Event Emissions**: Tracks campaign creation, donations, withdrawals, and refunds for transparency.

## Technologies Used
- Solidity (`^0.8.28`)
- OpenZeppelin Contracts (`ReentrancyGuard`, `Ownable`)
- ERC-20 Interface (`ICTK`)

## Contract Overview
### **Structs**
- `FundRaising`:
  - `title`: Name of the fundraising campaign.
  - `description`: Details about the campaign.
  - `recipient`: The address that will receive the funds if the goal is met.
  - `goal`: The target amount to be raised.
  - `deadline`: Time until which donations are accepted.
  - `amountDonated`: Total amount donated so far.
  - `hasEnded`: Indicates if the campaign has ended.

### **State Variables**
- `ICTK token`: ERC-20 token used for donations.
- `uint256 public fundCount`: Total number of fundraising campaigns created.
- `mapping(uint256 => FundRaising) public fundRaisings`: Stores all campaigns.
- `mapping(uint256 => mapping(address => uint256)) public donations`: Tracks donor contributions.

### **Events**
- `FundRaisingStart(uint256 fundId, string title, string description, address recipient, uint goal, uint deadline )`
- `DonationReceived(uint256 fundId, string title, address donor, uint amount)`
- `FundWithdrawn(uint256 fundId, uint256 amountRaised, address recipient)`
- `FundRaisingNotMet(uint256 fundId, uint256 amountRaised, uint goal )`
- `RefundIssued(uint256 fundId, address donor, uint amountRefunded )`

## Installation and Deployment
### **Prerequisites**
Ensure you have the following installed:
- Node.js & npm
- Hardhat
- Solidity
- OpenZeppelin Contracts

### **Clone the Repository**
```sh
$ git clone https://github.com/7maylord/CrowdFunding.git
$ cd CrowdFunding
```

### **Install Dependencies**
```sh
$ npm install
```

### **Compile the Contract**
```sh
$ npx hardhat compile
```

### **Deploy the Contract**
Modify the deployment script and run:
```sh
$ npx hardhat run scripts/deploy.js --network lisk_sepolia
```

## Contract Address : Lisk Sepolia
   ```sh
   0x9Fcc5FD34098Ba5DDbf6F0C46C9a84BE113ed14c
   ```
   
## CTK Token Contract Address : Lisk Sepolia
   ```sh
   0xAE8cFEc0a9d1DF138EFf443c24a70567FFd49F40
   ```

## Usage
### **Create a Fundraising Campaign**
```solidity
createFundRaising("Help Build a School", "Fundraising for a new school", payable(0xRecipientAddress), 1000, 1440);
```

### **Donate to a Campaign**
```solidity
donate(1, 100);
```

### **End Fundraising & Withdraw Funds**
```solidity
endFundRaising(1);
```

### **Request a Refund (if goal not met)**
```solidity
refund(1);
```

## Security Measures
- Uses `ReentrancyGuard` to prevent reentrancy attacks.
- Custom errors to optimize gas usage.
- Ensures only campaign recipients can withdraw funds.
- Prevents donations after the deadline.

## License
This contract is **UNLICENSED**, meaning it has no predefined license attached.

## Author
Developed by **[MayLord](https://github.com/7maylord)**. Feel free to contribute and improve the project!

---

Happy coding! 🚀

