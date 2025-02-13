// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ICTK} from "./ICTK.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdFunding is ReentrancyGuard, Ownable {
    
    struct FundRaising {
        string title;
        string description;
        address payable recipient;
        uint256 goal;
        uint256 deadline;
        uint256 amountDonated;
        bool hasEnded;
    }

    // State Variables
    ICTK token;
    uint256 public fundCount;
    mapping(uint256 => FundRaising) public fundRaisings;
    mapping(uint256 => mapping(address => uint256)) public donations;

    // Events
    event FundRaisingStart(uint256 fundId, string title, string description, address recipient, uint goal, uint deadline );

    event DonationReceived(uint256 fundId, string title,address donor, uint amount);

    event FundWithdrawn(uint256 _fundId, uint256 amountRaised, address recipient);

    event FundRaisingNotMet( uint256 fundId, uint256 amountRaised, uint goal );    

    event RefundIssued(uint256 fundId, address donor, uint amountRefunded );

    constructor(address _tokenAddress) Ownable(msg.sender) {        
        token = ICTK(_tokenAddress);
    }

     // Modifier to restrict End Fundraising
    modifier onlyRecipient(uint fundId) {
        require(msg.sender == fundRaisings[fundId].recipient, "Only the recipient can end the Fundraising");
        _;
    }

    // Custom Errors
    error MustBeGreaterThenZero();
    error InsufficientBalance();
    error InvalidAmount();
    error CrowdfundingEnded();
    error NoRefunds();
    error NotADonor();

     // Function to create a new fundraising campaign
    function createFundRaising( string memory _title, string memory _description, address payable _recipient, uint _goal, uint _durationInMinutes
    ) public {
        if(_goal <= 0) {
            revert MustBeGreaterThenZero();
        }
        uint256 _fundId = fundCount + 1;
        
        uint256 deadline = block.timestamp + _durationInMinutes * 60;

        fundRaisings[_fundId] = FundRaising({
            title: _title,
            description: _description,
            recipient: _recipient,
            goal: _goal,
            deadline: deadline,
            amountDonated: 0,
            hasEnded: false
        });

        fundCount = _fundId;

        emit FundRaisingStart(_fundId, _title, _description, _recipient, _goal, deadline);
    }

    // Function to donate to a campaign
    function donate(uint256 _fundId, uint256 _amount) external nonReentrant {
        // create an instance
        FundRaising memory fundRaising = fundRaisings[_fundId];
        
        // check if funding has ended                
        if (fundRaising.hasEnded) {
            revert CrowdfundingEnded();
        }

        // Ensure the donor has enough tokens
        uint256 balanceBefore = token.balanceOf(msg.sender);
        if (_amount > balanceBefore) {
            revert InsufficientBalance();
        }

        // Transfer tokens to the contract
        bool success = token.transferFrom(msg.sender, address(this), _amount);
        if (!success) {
            revert InvalidAmount();
        }

        // Update the donation amount for the campaign and the donor
        fundRaising.amountDonated += _amount;

        donations[_fundId][msg.sender] += _amount;

        // Emit a donation event
        emit DonationReceived(_fundId, fundRaising.title, msg.sender, _amount);

        fundRaisings[_fundId] = fundRaising;
    }

    // Function to End Fundraising
    function endFundRaising(uint256 _fundId) external nonReentrant onlyRecipient(_fundId)  {
        FundRaising memory fundRaising = fundRaisings[_fundId];
        
        // Check if the campaign has already ended
        if (fundRaising.hasEnded) {
            revert CrowdfundingEnded();
        }

        fundRaising.hasEnded = true;

        if (fundRaising.amountDonated >= fundRaising.goal) {
            bool success = token.transfer(fundRaising.recipient, fundRaising.amountDonated);
            if (!success) {
                revert InvalidAmount();
            }
            emit FundWithdrawn(_fundId, fundRaising.amountDonated, fundRaising.recipient);
        } else {
            emit FundRaisingNotMet( _fundId, fundRaising.amountDonated, fundRaising.goal);
        }

        fundRaisings[_fundId] = fundRaising;
    }


    // Refund contributors if goal is not met
    function refund(uint256 _fundId) external nonReentrant {
        FundRaising memory fundRaising = fundRaisings[_fundId];
        
        // Ensure the campaign has ended and the goal was not met
        if (fundRaising.amountDonated >= fundRaising.goal) {
            revert NoRefunds();
        }
        
         // Process refunds based on contributions 
        uint256 amountContributed = donations[_fundId][msg.sender];

        if (amountContributed == 0) {
            revert NotADonor();
        }
               
        bool success = token.transfer(msg.sender, amountContributed);
        if (!success) {
            revert InvalidAmount();
        }

        donations[_fundId][msg.sender] = 0;

        emit RefundIssued(_fundId, msg.sender, amountContributed);

        fundRaisings[_fundId] = fundRaising;
    }
}
