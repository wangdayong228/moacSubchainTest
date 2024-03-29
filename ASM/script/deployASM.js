/* Script to prepare three Global contracts for the example MOAC ASM MicroChain 
 * using example binary codes.
 * Require:
 * 1. Valid account with enough moac to deploy the contracts;
 * 2. A running VNODE can connect and send Transaction to, need turn on personal in rpc api;
 --rpcapi "chain3,mc,net,vnode,personal,
 * 3. At least three SCSs, recommended 5;
 * 4. A VNODE used as proxy for the MicroChain, with VNODE settings in the vnodeconfig.json;
 * Steps:
 * 
 * 1. Deploy the VNODE and SCS pool contracts;
 * 2. Create the MicroChain contract using VNODE and SCS pools;
 * 3. Register the VNODE, SCSs, then open MicroChain to get all the SCSs registered.
 *  
 * This script generates a MicroChain with no DAPP deployed.
 * To deploy the Dappbase and additional DAPP contracts on MicroChain
 * please check online documents:
 * https://moacdocs-chn.readthedocs.io/zh_CN/latest/subchain/%E5%AD%90%E9%93%BE%E4%B8%9A%E5%8A%A1%E9%80%BB%E8%BE%91%E7%9A%84%E9%83%A8%E7%BD%B2.html
 * 
 * 
*/

const Chain3 = require('chain3');
const fs = require('fs');
const solc = require('solc');//only 0.4.24 version should be used, npm install solc@0.4.24

//===============Setup the Parameters==========================================

// need to have a valid account to use for contracts deployment
baseaddr = "0x17ebd41cb0bb437cd24e94e2d4cf98ebedce7ad2";//"0xput your wallet accouint";
basepsd = "hello"//;"your password";

// The known SCS on MOAC network
var scs = ["0x26445156cb1320c4ccc90f4e1a33ea8da4f3d36f",
  "0xcc34b03b190dffdc5c33201405670e404c951965",
  "0x702890e1a5ba5604fe2e04677e2fd0fec4e5e014"
]

// The VNODE benificial address, should be found in the vnodeconfig.json 
vnodeVia = "0xbda66674a58256d09c9c766eee0968ecf3c85b29";// "0x vnode proxy beneficial address";
vnodeConnectUrl = "127.0.0.1:50062";//VNODE connection as parameter to use for VNODE protocol
var minScsRequired = 3; // Min number of SCSs in the MicroChain, recommended 3 or more

//===============Check the Blockchain connection===============================
// 
// Using local node or remote to send TX command
const vnodeUri = 'http://localhost:8545';

let chain3 = new Chain3();
chain3.setProvider(new chain3.providers.HttpProvider(vnodeUri));

if (!chain3.isConnected()) {
  throw new Error('unable to connect to moac vnode at ' + vnodeUri);
} else {
  console.log('connected to moac vnode at ' + vnodeUri);
  let balance = chain3.mc.getBalance(baseaddr);
  console.log('Check src account balance:' + baseaddr + ' has ' + balance / 1000000000000000000 + " MC");
}

// Min balance of the baseaddr needs to be larger than these numbers if all SCSs need to be funded
// + SCS deposit (10 mc) * SCS number (=5)
// + VNODE deposit (1 mc) * VNODE number (=1)
// + MicroChain deposit (10 mc)
// = 50 + 1+ 10 = 61
if (!checkBalance(baseaddr, 61)) {
  console.log("Need more balance in baseaddr")
  return;
} else {
  console.log("baseaddr has enough balance!")
}

// Unlock the baseaddr for contract deployment

if (chain3.personal.unlockAccount(baseaddr, basepsd, 0)) {
  console.log(`${baseaddr} is unlocked`);
} else {
  console.log(`unlock failed, ${baseaddr}`);
  throw new Error('unlock failed ' + baseaddr);
}

//===============Step 1. Deploy required Mother Chain contracts=========================
// If you have all these contracts deployed earlier, you can skip this and go to Step 2.
// 
// vnode pool
// scs pool
// Deploy the VNODE pool contract to allow VNODE join as proxy to the microchain, 
var minVnodeDeposit = 1;// number of deposit required for the VNODE proxy to register, unit is mc

var basepath = '.';

var contractName = 'VnodeProtocolBase';
var solpath = basepath + '/' + contractName + '.sol';

contract = fs.readFileSync(solpath, 'utf8');

output = solc.compile(contract, 1);

abi = output.contracts[':' + contractName].interface;
bin = output.contracts[':' + contractName].bytecode;


var vnodeprotocolbaseContract = chain3.mc.contract(JSON.parse(abi));

var vnodeprotocolbase = vnodeprotocolbaseContract.new(
  minVnodeDeposit,
  {
    from: baseaddr,
    data: '0x' + bin,
    gas: '8000000'
  }
);

console.log("VNODE protocol is being deployed at transaction HASH: " + vnodeprotocolbase.transactionHash);

// Deploy the MicroChain protocol pool to allow SCS join the pool to form the MicroChain 
var protocol = "POR";   //Name of the SCS pool, don't change
var minScsDeposit = 10;// SCS must pay more than this in the register function to get into the SCS pool
var _protocolType = 0; // type of the MicroChain protocol, don't change


contractName = 'SubChainProtocolBase';
solpath = basepath + '/' + contractName + '.sol';

contract = fs.readFileSync(solpath, 'utf8');

output = solc.compile(contract, 1);

abi = output.contracts[':' + contractName].interface;
bin = output.contracts[':' + contractName].bytecode;

var protocol = "POR";
var bmin = 3;

var subchainprotocolbaseContract = chain3.mc.contract(JSON.parse(abi));

var subchainprotocolbase = subchainprotocolbaseContract.new(
  protocol,
  minScsDeposit,
  _protocolType,
  {
    from: baseaddr,
    data: '0x' + bin,
    gas: '8000000'
  }
);

console.log("SCS protocol is being deployed at transaction HASH: " + subchainprotocolbase.transactionHash);

// Check for the two POO contract deployments
var vnodePoolAddr = waitBlock(vnodeprotocolbase.transactionHash);
var scsPoolAddr = waitBlock(subchainprotocolbase.transactionHash);

vnodePool = vnodeprotocolbaseContract.at(vnodePoolAddr);
scsPool = subchainprotocolbaseContract.at(scsPoolAddr);

console.log("vnodeprotocolbase contract address:", vnodePool.address);
console.log("subchainprotocolbase contract address:", scsPool.address);
console.log("Please use the mined contract addresses in deploying the MicroChain contract!!!")

//===============Step 2. Use the deployed Contracts to start a MicroChain======

// Deploy the MicroChain contract to form a MicroChain with Atomic Swap of Token (ASM) function
var min = 1;           //Min SCSs required in the MicroChain, only 1,3,5,7 should be used`
var max = 11;          //Max SCSs needed in the MicroChain, Only 11, 21, 31, 51, 99
var thousandth = 1000; //Fixed, do not need change
var flushRound = 60;   //Number of MotherChain rounds, must between 40 and 500

// these address should be pass from Step 1. If you use previously deployed contract, then input the address here.
// var scsPoolAddr = vnodePool.address;
// var vnodePoolAddr = scsPool.address;

var tokensupply = 1000;// MicroChain token amount, used to exchange for native token
var exchangerate = 100;// the exchange rate bewteen moac and MicroChain token.


var contractName = 'SubChainBase';

// Need to read both contract files to compile
var input = {
  '': fs.readFileSync(basepath + '/' + 'SubChainBase.sol', 'utf8'),
  'SubChainProtocolBase.sol': fs.readFileSync(basepath + '/' + 'SubChainProtocolBase.sol', 'utf8')
};

var output = solc.compile({ sources: input }, 1);

abi = output.contracts[':' + contractName].interface;
bin = output.contracts[':' + contractName].bytecode;


var subchainbaseContract = chain3.mc.contract(JSON.parse(abi));

var subchainbase = subchainbaseContract.new(
  scsPoolAddr,
  vnodePoolAddr,
  min,
  max,
  thousandth,
  flushRound,
  tokensupply,
  exchangerate,
  {
    from: baseaddr,
    data: '0x' + bin,
    gas: '9000000'
  }
);


var microChainAddr = waitBlock(subchainbase.transactionHash);
microChain = subchainbaseContract.at(microChainAddr);
console.log("microChain created at address:", microChain.address);

//===============Step 3. Use the deployed Contracts to start a MicroChain======

// The deposit is required for each SCS to join the MicroChain
var microChainDeposit = 10;

if (checkBalance(microChainAddr, microChainDeposit)) {
  console.log("continue...")
} else {
  // Add balance to microChainAddr for MicroChain running
  console.log("Add funding to microChain!");
  addMicroChainFund(microChainAddr, microChainDeposit)
  waitBalance(microChain.address, microChainDeposit);
}

if (checkBalance(vnodeVia, minVnodeDeposit)) {
  console.log("VNODE has enough balance continue...")
  // sendtx(baseaddr,vnodecontractaddr,num,data)
} else {
  // Add balance
  console.log("Add funding to VNODE!");
  sendtx(baseaddr, vnodeVia, minVnodeDeposit);
  waitBalance(vnodeVia, minVnodeDeposit);
}


// Check to make sure all SCSs have enough balance than the min deposit required by 
// SCS pool
for (var i = 0; i < scs.length; i++) {
  if (checkBalance(scs[i], minScsDeposit)) {
    console.log("SCS has enough balance, continue...")
  } else {
    // Add balance
    console.log("Add funding to SCS!");
    sendtx(baseaddr, scs[i], minScsDeposit);
    waitBalance(scs[i], minScsDeposit);
  }
}

vnoderegister(vnodePool, minVnodeDeposit, vnodeConnectUrl)

console.log("Registering SCS to the pool", scsPool.address);
registerScsToPool(scsPool.address, minScsDeposit);

// Check if the SCS pool have enough nodes registered
while (true) {
  let count = scsPool.scsCount();
  if (count >= minScsRequired) {
    console.log("registertopool has enough scs " + count);
    break;
  }
  console.log("Waiting registertopool, current scs count=" + count);
  sleep(5000);
}

// Check the blocks
let startnum = chain3.mc.blockNumber;
while (true) {
  let number = chain3.mc.blockNumber;
  if (number > startnum + 5) {
    console.log("reached target block number " + number);
    break;
  }
  console.log("Waiting block number, current block number=" + number);
  sleep(8000);
}


// Open the register for the SCSs to join the MicroChain
registerOpen(microChain.address);
while (true) {
  let count = microChain.nodeCount();
  if (count >= minScsRequired) {
    console.log("registertopool has enough scs " + count);
    break;
  }
  console.log("Waiting registertopool, current scs count=" + count);
  sleep(5000);
}

registerClose(microChain.address);
sleep(5000);

console.log("all Done!!!");

return;



//===============Utils Functions===============================================
// utils for the program
// Check if the input address has enough balance for the mc amount
function checkBalance(inaddr, inMcAmt) {
  if (chain3.mc.getBalance(inaddr) / 1e18 >= inMcAmt) {
    return true;
  } else {
    return false;
  }
}

function sendtx(src, tgtaddr, amount, strData) {

  chain3.mc.sendTransaction(
    {
      from: src,
      value: chain3.toSha(amount, 'mc'),
      to: tgtaddr,
      gas: "2000000",
      gasPrice: chain3.mc.gasPrice,
      data: strData
    });

  console.log('sending from:' + src + ' to:' + tgtaddr + ' amount:' + amount + ' with data:' + strData);
}

// wait certain blocks for the contract to be mined
function waitForBlocks(innum) {
  let startBlk = chain3.mc.blockNumber;
  let preBlk = startBlk;
  console.log("Waiting for blocks to confirm the contract... currently in block " + startBlk);
  while (true) {
    let curblk = chain3.mc.blockNumber;
    if (curblk > startBlk + innum) {
      console.log("Waited for " + innum + " blocks!");
      break;
    }
    if (curblk > preBlk) {
      console.log("Waiting for blocks to confirm the contract... currently in block " + curblk);
      preBlk = curblk;
    } else {
      console.log("...");
    }

    sleep(2000000);
  }
}

function waitBlock(transactionHash) {
  console.log("Waiting a mined block to include your contract...");

  while (true) {
    let receipt = chain3.mc.getTransactionReceipt(transactionHash);
    if (receipt && receipt.contractAddress) {
      console.log("contract has been deployed at " + receipt.contractAddress);
      break;
    }
    console.log("block " + chain3.mc.blockNumber + "...");
    sleep(50000);
  }
  return chain3.mc.getTransactionReceipt(transactionHash).contractAddress;
}

function waitBalance(addr, target) {
  while (true) {
    let balance = chain3.mc.getBalance(addr) / 1000000000000000000;
    if (balance >= target) {
      console.log("account has enough balance " + balance);
      break;
    }
    console.log("Waiting the account has enough balance " + balance);
    sleep(5000);
  }
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}


//===============Utils TX to MicroChains=======================================

function registerScsToPool(proto, num) {
  if (num >= minScsDeposit) {
    for (var i = 0; i < scs.length; i++) {
      sendtx(baseaddr, proto, num, '0x4420e486000000000000000000000000' + scs[i].substr(2, 100));
    }
  } else {
    console.log("Cannot register SCSs with not enough deposit!", num);
  }

}

//Open the MicroChain register process
function registerOpen(subchainaddr) {
  sendtx(baseaddr, subchainaddr, '0', '0x5defc56c');
}

//Close the MicroChain register process
function registerClose(subchainaddr) {
  sendtx(baseaddr, subchainaddr, '0', '0x69f3576f');
}

// must do before flush
function addMicroChainFund(inaddr, num) {
  sendtx(baseaddr, inaddr, num, '0xa2f09dfa')
}

// vnoderegister(viaAddress, 1, "127.0.0.1:50062")
// vnodeprotocolbase.vnodeCount()
// vnode - vnode contract object with register function, and address
// num - deposit for VNODE to join the VNODE pool
// data - VNODE register FUNCTION
function vnoderegister(vnode, num, ip) {
  var data = vnode.register.getData(vnode.address, ip)
  console.log("Registering VNODE ......")
  sendtx(baseaddr, vnode.address, num, data)
}

module.exports = { sleep }

