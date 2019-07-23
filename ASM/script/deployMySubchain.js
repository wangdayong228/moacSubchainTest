
const m = require('mylib').moacLib;
const util = require('mylib').util;
const consoleHl = util.consoleHl;

//编译合约使用的solc版本
var solcVersion = '0.4.24';

//合约地址
var vnodeProtocalbaseAddr = '0x3f1a9fa5ab388f47cf23531ee4e999b93c80cce1' //= '0x7872ab73ceb2ea2ac4884330d37bcf475e44999d' //= '0xad9bef137175acf04db8ca894f9b3f3c6b93d3bb' //= '0x9c0f99c6e02b5ab2db7ff819f7229c390a89fdd1'
var subChainProtocolBaseAddr = '0xae8a5150a1715f93bd33321f7198ff43a33959d8' //= '0xe2b952ca31268b8239386fa70fa257cecf2a280d' //= '0x33c08f33e0f8bf0ef5c8329cf2280a65520984a0'//= '0x5eea5f490fba5190cee7e03c43ce6841e3fc4d8c' //= '0x252e6b4d7424af60b46821cefc7ee9fd5c59dc79'
var subchainbaseAddr = '0xb79bb9c2c9ff420a601dd7b939d587a09d74def1'//= '0xbbe4c5f8ee3917cf5fd2c8f082c02efde8cd5b54' //= '0xc508b97f3d9b9ef8a32242df9e252b49cbddac1e' //= '0xf895929275150074d8b039e6c58526bf99e93fec'
var dappbaseAddr = '0x7872ab73ceb2ea2ac4884330d37bcf475e44999d' //= '0x7872ab73ceb2ea2ac4884330d37bcf475e44999d'// = '0x7872ab73ceb2ea2ac4884330d37bcf475e44999d';
var dapp1Addr = '0xad9bef137175acf04db8ca894f9b3f3c6b93d3bb'//= '0xad9bef137175acf04db8ca894f9b3f3c6b93d3bb'//= '0xd50b17ebe664075d7e33e3fd5078fcf39fb67988';

var dappbase;
var dapp1;

//vnode注册进矿池需要缴纳的最小押金
var vnodeBmin = 1;
var vnodeBeneficialAddr = '0x000a7fb416977209c26ecda9cacc90beb438587e';
var vnodeUrl = 'http://10.10.10.72:30000' //`http://${vnodeIp}:12000`;//'10.10.10.72:8545'
var vnodeProtocalConn = '10.10.10.72:30003'//'10.10.10.72:12003';//'10.10.10.72:50062';//VNODE connection as parameter to use for VNODE protocol
var scsMonitorConn = '10.10.10.72:31040' // '10.10.10.72:7004';// '10.10.10.72:8004';
var chainId = 100;
//scs地址
var scsidAsMonitor = '0xdb2e67e5f788ad141912dbe758c2c163878ebc58';//'0x8cea0f9e463e44e9fb3632d7ddcdffa60eb4568a';

//testnet
// var scsids = ['0x6a303219d81540955a5268ca7f7bd6ebee26b71f',
//     '0x99e14bf8956f0eaa2f38419ee3a6904f148d06b5',
//     '0xbb3d0b9df700e1527ced5e9c487a4d944d1030b4'
// ];

//dev
var scsids = ['0x09e938961a593f58bfbfa2d57f99c4e45b1013c4',
    '0x31f9cdc507ca5f6c1ba93ce2b03d38e584a843df',
    '0x5d66a7773176f917281d0a0f1ee67994907f206d'
];

//privnet
// var scsids = ['0x23bf59187f9cf265178cd7e8f3a24ccb2614084d',
//     '0x2eadf841f446f9dc2328ee3d31ac05f764c91819',
//     '0xdd98b1769cf8dffbc3a4499cc3407f63cd9cb18b'
// ];

var minScsDeposit = 1;
var subChainTotalSupply = 10;

//合约文件夹目录
var solDir = '/dayong/mywork/moac-core/v1/';

m.init(vnodeUrl, solcVersion);
m.setScsMonitorUrl(scsMonitorConn);
m.setChainId(chainId);
m.setVnodeInfo(vnodeBeneficialAddr);

(async function () {
    //部署proxy vnode矿池vnodeProtocalbaseCt
    if (!vnodeProtocalbaseAddr) {
        consoleHl('部署vnode矿池vnodeProtocalbaseCt');
        vnodeProtocalbaseAddr = await m.deploy(solDir + 'VnodeProtocolBase.sol', vnodeBmin);
    }
    var vnodeProtocalbase = m.getContract(solDir + 'VnodeProtocolBase.sol', vnodeProtocalbaseAddr);

    //给vnode转账
    if (!m.checkBalance(vnodeBeneficialAddr, vnodeBmin)) {
        consoleHl('给vnode充钱!');
        m.sendTx(m.core.accounts[0], vnodeBeneficialAddr, vnodeBmin);
        await m.waitBalance(vnodeBeneficialAddr, vnodeBmin);
    }

    //注册proxy vnode进矿池，付款1墨客
    if (!vnodeProtocalbase.vnodeCount.call()) {
        consoleHl('注册proxy vnode进矿池，付款1墨客');
        var registerVnodeTx = m.sendTx(m.core.accounts[0], vnodeProtocalbaseAddr, 1, vnodeProtocalbase.register.getData(vnodeBeneficialAddr, vnodeProtocalConn));
        await m.waitBlock(registerVnodeTx);
    }

    //部署scs矿池subChainProtocolBase
    if (!subChainProtocolBaseAddr) {
        consoleHl('部署scs矿池subChainProtocolBase');
        subChainProtocolBaseAddr = await m.deploy(solDir + 'SubChainProtocolBase.sol', 'POS', 1, 0);
    }
    var subChainProtocolBase = m.getContract(solDir + 'SubChainProtocolBase.sol', subChainProtocolBaseAddr);

    //给scs转账, 用于跟底层vnode通信或被调用时的gas
    for (var i = 0; i < scsids.length; i++) {
        if (!m.checkBalance(scsids[i], minScsDeposit)) {
            consoleHl('给SCS充钱!');
            m.sendTx(m.core.accounts[0], scsids[i], minScsDeposit);
            await m.waitBalance(scsids[i], minScsDeposit);
        }
    }

    //注册scs进scs矿池，付款5墨客作为保证金
    var registerScsTxs = [];
    // var ps = [];
    scsids.forEach(sid => {
        const scsAddr = subChainProtocolBase.scsList.call(sid)[0];
        consoleHl(sid, '对应scsid地址：', scsAddr);
        if (util.isAddress0(scsAddr)) {
            consoleHl('注册', sid, '到scs矿池.');
            var tx = m.sendTx(m.core.accounts[0], subChainProtocolBaseAddr, 5, subChainProtocolBase.register.getData(sid));
            registerScsTxs.push(tx);
        }
    });
    // registerScsTxs.forEach(tx => ps.push(m.waitBlock(tx)));
    await Promise.all(registerScsTxs.map(m.waitBlock));

    //验证scs矿池的scs数量
    var scsCount = subChainProtocolBase.scsCount.call().toNumber();
    consoleHl('注册进scs矿池的scs数量：', scsCount);
    if (scsCount < 3)
        throw new Error('注册进scs矿池的scs数量不够3个，请检查原因并重新注册');

    //部署 SubChainBase.sol
    if (!subchainbaseAddr) {
        consoleHl('部署 SubChainBase.sol');
        subchainbaseAddr = await m.deploy(solDir + 'SubChainBase.sol', subChainProtocolBaseAddr, vnodeProtocalbaseAddr, 1, 11, 1, 40, subChainTotalSupply, 100);
    }
    m.setSubChainBaseContractAddr(subchainbaseAddr);
    var subchainbase = m.getContract(solDir + 'SubChainBase.sol', subchainbaseAddr);


    //给SubChainBase转账, 子链合约需要最终提供gas费给scs，因此，需要给子链控制合约发送一定量的moac
    if (!await m.checkBalance(subchainbaseAddr, 2)) {
        consoleHl('给SubChainBase转账2moac');
        var addfundTx = m.sendTx(m.core.accounts[0], subchainbaseAddr, 2, subchainbase.addFund.getData());
        await m.waitBlock(addfundTx);
    }

    //验证scs注册数量
    var nodeCount = subchainbase.nodeCount.call().toNumber();
    if (!nodeCount) {
        //开放scs注册
        consoleHl('开放scs注册');
        var registerOpenTx = m.sendTx(m.core.accounts[0], subchainbaseAddr, 0, subchainbase.registerOpen.getData());
        let receipt = await m.waitBlock(registerOpenTx);
        if (receipt.status == '0x0')
            throw new Error('开放scs注册失败!');

        //验证scs注册数量
        while (true) {
            nodeCount = subchainbase.nodeCount.call().toNumber();
            consoleHl('registerd nodeCount:', nodeCount);
            if (nodeCount >= 3)
                break;
            util.sleep(50000);
        }

        //关闭scs注册
        consoleHl('关闭scs注册');
        var registerCloseTx = m.sendTx(m.core.accounts[0], subchainbaseAddr, 0, subchainbase.registerClose.getData());
        await m.waitBlock(registerCloseTx);
    }


    //注册scs monitor
    async function setScsMonitor() {
        var data = subchainbase.registerAsMonitor.getData(scsidAsMonitor, vnodeProtocalConn);
        var txhash = m.sendTx(m.core.accounts[0], subchainbaseAddr, 1, data);
        var receipt = await m.waitBlock(txhash);
        consoleHl('注册scs monitor:', receipt.status);
    }
    if (subchainbase.getMonitorInfo.call()[0].indexOf(scsidAsMonitor) < 0) {
        await setScsMonitor();
    }


    // async function pSleep(ms) {
    //     return new Promise((rsl, rjc) => {
    //         setTimeout(() => {
    //             rsl();
    //         }, ms);
    //     });
    // }

    async function deployDappbase() {
        if (!dappbaseAddr) {
            consoleHl('部署 DappBase.sol');
            var nonce = await m.getSubChainNonce(subchainbaseAddr);
            dappbaseAddr = await m.deploySubchainContract(solDir + 'DappBase.sol', subChainTotalSupply, nonce);
        }
        dappbase = m.getContract(solDir + 'DappBase.sol', dappbaseAddr);
    }

    async function deployDapp1() {
        if (!dapp1Addr) {
            consoleHl('部署 Dapp1.sol');
            var nonce = await m.getSubChainNonce(subchainbaseAddr);
            dapp1Addr = await m.deploySubchainContract(solDir + 'Dapp1.sol', 0, nonce);
        }
        dapp1 = m.getContract(solDir + 'Dapp1.sol', dapp1Addr);
    }

    await deployDappbase();
    await deployDapp1();
    await (async () => {
        //注册Dapp1到DappBase
        consoleHl('注册Dapp1到DappBase');
        var nonce = await m.getSubChainNonce(subchainbaseAddr);
        var data = dappbase.registerDapp.getData(dapp1Addr, m.baseaddr, JSON.stringify(dapp1.abi));
        // tx = m.sendSubChainContractMethod(subchainbaseCtAddr, dappbaseCtAddr, 0, dappbaseCtAddr + data.substr(2), nonce, vnodeBeneficialAddr);
        var tx = m.sendSubChainTx(m.core.accounts[0], 0, dappbaseAddr + data.substr(2), nonce);
        return m.waitSubchainBlock(subchainbaseAddr, tx);
    });
    util.consoleHl('子链相关合约全部部署完成', { vnodeProtocalbaseAddr, subChainProtocolBaseAddr, subchainbaseAddr, dappbaseAddr, dapp1Addr });

    var exports = {
        util,
        vnodeProtocalbaseAddr,
        subChainProtocolBaseAddr,
        subchainbaseAddr,
        dappbaseAddr,
        dapp1Addr,

        vnodeProtocalbase,
        subChainProtocolBase,
        subchainbase,
        dappbase,
        dapp1,

        vnodeBmin,
        vnodeBeneficialAddr,
        vnodeProtocalUrl: vnodeProtocalConn,
        // var minVnodeDeposit = vnodeBmin;

        //scs地址
        scsidAsMonitor,
        scsids,
        minScsDeposit,
        subChainTotalSupply
    };

    Object.keys(m).forEach(k => exports[k] = m[k]);

    module.exports = exports;
})();


