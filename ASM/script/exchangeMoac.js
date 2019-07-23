
const m = require('mylib').moacLib;
const util = require('mylib').util;
const bn = require('bignumber.js');
const consoleHl = util.consoleHl;
const assert = require('assert');
//编译合约使用的solc版本
var solcVersion = '0.4.24';

//vnode注册进矿池需要缴纳的最小押金
var vnodeBeneficialAddr = '0x000a7fb416977209c26ecda9cacc90beb438587e';
var vnodeUrl = 'http://10.10.10.72:30000' //`http://${vnodeIp}:12000`;//'10.10.10.72:8545'
var vnodeProtocalConn = '10.10.10.72:30003'//'10.10.10.72:12003';//'10.10.10.72:50062';//VNODE connection as parameter to use for VNODE protocol
var scsMonitorConn = '10.10.10.72:31040' // '10.10.10.72:7004';// '10.10.10.72:8004';
var chainId = 100;

//合约地址
var vnodeProtocalbaseAddr = '0x3f1a9fa5ab388f47cf23531ee4e999b93c80cce1' //= '0x7872ab73ceb2ea2ac4884330d37bcf475e44999d' //= '0xad9bef137175acf04db8ca894f9b3f3c6b93d3bb' //= '0x9c0f99c6e02b5ab2db7ff819f7229c390a89fdd1'
var subChainProtocolBaseAddr = '0xae8a5150a1715f93bd33321f7198ff43a33959d8' //= '0xe2b952ca31268b8239386fa70fa257cecf2a280d' //= '0x33c08f33e0f8bf0ef5c8329cf2280a65520984a0'//= '0x5eea5f490fba5190cee7e03c43ce6841e3fc4d8c' //= '0x252e6b4d7424af60b46821cefc7ee9fd5c59dc79'
var subchainbaseAddr = '0xb79bb9c2c9ff420a601dd7b939d587a09d74def1'//= '0xbbe4c5f8ee3917cf5fd2c8f082c02efde8cd5b54' //= '0xc508b97f3d9b9ef8a32242df9e252b49cbddac1e' //= '0xf895929275150074d8b039e6c58526bf99e93fec'
var dappbaseAddr = '0x7872ab73ceb2ea2ac4884330d37bcf475e44999d' //= '0x7872ab73ceb2ea2ac4884330d37bcf475e44999d'// = '0x7872ab73ceb2ea2ac4884330d37bcf475e44999d';
var dapp1Addr = '0xad9bef137175acf04db8ca894f9b3f3c6b93d3bb'//= '0xad9bef137175acf04db8ca894f9b3f3c6b93d3bb'//= '0xd50b17ebe664075d7e33e3fd5078fcf39fb67988';

var subChainTotalSupply = 10;
var exchangeRate = 100;
var solDir = '/dayong/mywork/moac-core/v1/';

m.init(vnodeUrl, solcVersion);
m.setScsMonitorUrl(scsMonitorConn);
m.setChainId(chainId);
m.setSubChainBaseContractAddr(subchainbaseAddr);
m.setVnodeInfo(vnodeBeneficialAddr);

var subchainbase = m.getContract(solDir + 'SubChainBase.sol', subchainbaseAddr);
var dappbase = m.getContract(solDir + 'DappBase.sol', dappbaseAddr);
var dapp1 = m.getContract(solDir + 'Dapp1.sol', dapp1Addr);

var testAccount = m.core.accounts[4];
m.blk.personal.unlockAccount(testAccount, 'hello', 0);

//检测余额变化
//operateMoac：购买或出售的moac币，这里指的汇率都是主链币
//operateFunc：检测余额变化中间执行的操作，也就是说是这个方法导致的余额变化
async function checkblcChange(operateMoac, operateFunc) {

    //dappbase中应该有subChainTotalSupply个moac
    var oldDappBlc = bn(await m.getSubChainBalance(subchainbaseAddr, dappbaseAddr));
    consoleHl(`dappbase 中有moac ${oldDappBlc}；dappbase的subChainTotalSupply为 ${subChainTotalSupply}`);
    // assert.equal(subChainTotalSupply * 1e18, balance, 'dappbase中的moac数量与totoalsupply不同');
    //buyMinToken
    var oldUsrVnodeBlc = bn(await m.core.getBalance(testAccount));
    // assert.ok(usrVnodeBlc > operateMoac / exchangeRate, testAccount + `主链余额小于${operateMoac}$moac`);
    var oldUsrBlc = bn(await m.getSubChainBalance(subchainbaseAddr, testAccount));
    consoleHl(`操作前账户 ${testAccount} 子链余额：${oldUsrBlc},主链余额：${oldUsrVnodeBlc}`);

    await operateFunc();

    //accounts[1] 应该有充值进buyValue
    var usrVnodeBlc = bn(await m.core.getBalance(testAccount));
    var usrBlc = bn(await m.getSubChainBalance(subchainbaseAddr, testAccount));
    var dappBlc = bn(await m.getSubChainBalance(subchainbaseAddr, dappbaseAddr));
    consoleHl(`操作后账户 ${testAccount} 子链余额： ${usrBlc}, 增加：${usrBlc.minus(oldUsrBlc)},主链余额：${usrVnodeBlc}，增加：${usrVnodeBlc.minus(oldUsrVnodeBlc)}`);
    consoleHl(`dappbase账户 ${dappbaseAddr} 余额增加：${dappBlc.minus(oldDappBlc)}`);

    // consoleHl(`主链账户${testAccount}应该减少至少${operateMoac},实际上减少${oldUsrVnodeBlc - usrVnodeBlc}`);
    // consoleHl(`子链账户 ${testAccount} 应该充值进${operateMoac * exchangeRate},实际上充值${usrBlc - oldUsrBlc}`);
    // consoleHl(`dappbase账户 ${dappbaseAddr} 应该减少${operateMoac * exchangeRate},实际上减少${oldDappBlc - dappBlc}`);
    consoleHl('完成');
    return {
        dapp: {
            pre: oldDappBlc,
            now: dappBlc
        },
        usrSubChain: {
            pre: oldUsrBlc,
            now: usrBlc
        },
        usrVnode: {
            pre: oldUsrVnodeBlc,
            now: usrVnodeBlc
        }
    }
}

//用主链币兑换子链币，1主链moac = exchangeRate主链moac
//value:主链moac数
async function buy(value) {
    consoleHl('开始购买子链币，支付母链币：', value);
    var blcStates = await checkblcChange(value, async () => {
        var tx = subchainbase.buyMintToken.sendTransaction({ from: testAccount, gas: 900000, value: value });
        var receipt = await m.waitBlock(tx);
        var blknum = receipt.blockNumber;

        for (let i = 0; i < 50; i++) {
            // balance = await m.getSubChainBalance(subchainbaseAddr, testAccount);
            if (m.core.blockNumber - blknum > 10)
                break;

            consoleHl('10个块后子链才能收到帐，等待10个块', m.core.blockNumber);
            await util.pSleep(10000);
        }
    });
    consoleHl('最终账户余额状态', JSON.stringify(blcStates));
}

//用子链币兑换主链币
//value：子链moac数
async function sell(value) {
    consoleHl('开始兑换主链币，卖出子链币：', value);
    var operateFunc = async function () {
        // var tx = subchainbase.redeemFromMicroChain.sendTransaction({ from: testAccount, gas: 900000, value: value });
        var strData = dappbaseAddr + dappbase.redeemFromMicroChain.getData().substr(2);
        var nonce = await m.getSubChainNonce(subchainbaseAddr, testAccount);
        var tx = m.sendSubChainTx(testAccount, value, strData, nonce);
        await m.waitSubchainBlock(subchainbaseAddr, tx);

        var blknum = m.core.blockNumber;
        for (let i = 0; i < 50; i++) {
            // balance = await m.getSubChainBalance(subchainbaseAddr, testAccount);
            if (m.core.blockNumber - blknum > 10)
                break;

            consoleHl('10个块后主链才能收到帐，等待10个块', m.core.blockNumber);
            await util.pSleep(10000);
        }
    };
    var blcStates = await checkblcChange(value, operateFunc);
    consoleHl('最终账户余额状态', JSON.stringify(blcStates));
}
// buy(1e15)
sell(1e17);







