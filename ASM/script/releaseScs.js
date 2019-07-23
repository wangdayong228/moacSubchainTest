/** 本脚本执行完虽然获取nodelist为0，但是scs可能仍然挖矿，重启scs即可；若还不行，删除scsdata文件夹下对应子链文件，再重启 **/
const m = require('mylib').moacLib;
const util = require('mylib').util;
const toPromise = util.toPromise;
const assert = require('assert');
//编译合约使用的solc版本
var solcVersion = '0.4.24';

var vnodeBeneficialAddr = '0x000a7fb416977209c26ecda9cacc90beb438587e';
var vnodeUrl = 'http://10.10.10.72:30000'
var scsMonitorConn = '10.10.10.72:31040'
var chainId = 100;

var subchainbaseAddrs = ['0xbbe4c5f8ee3917cf5fd2c8f082c02efde8cd5b54',
    '0xc508b97f3d9b9ef8a32242df9e252b49cbddac1e',
    '0x3651cfda0cb458659a41ac0b973bc766500b7e46'];

var subChainTotalSupply = 10;
var solDir = '/dayong/mywork/moac-core/v1/';

m.init(vnodeUrl, solcVersion);
m.setScsMonitorUrl(scsMonitorConn);
m.setChainId(chainId);
// m.setSubChainBaseContractAddr(subchainbaseAddr);
m.setVnodeInfo(vnodeBeneficialAddr);

async function releaseOneChain(subchainbaseAddr, immediate = false) {
    const subchainbase = m.getContract(solDir + 'SubChainBase.sol', subchainbaseAddr);
    const nodeCount = subchainbase.nodeCount();
    const ps = [];
    for (let i = 0; i < nodeCount; i++) {
        const func = immediate ? 'requestReleaseImmediate' : 'requestRelease';
        const scs = subchainbase.nodeList(i);
        if (m.core.accounts.indexOf(scs) < 0)
            continue;

        m.blk.personal.unlockAccount(scs, 'moacscsofflineaccountpwd', 0);
        const tx = subchainbase[func].sendTransaction(1, i, { from: scs, gas: 900000 });
        ps.push(m.waitBlock(tx));
    }

    const scsMonitors = subchainbase.getMonitorInfo()[0];
    for (let i = 0; i < scsMonitors.length; i++) {
        let scsMonitor = scsMonitors[i];
        // m.blk.personal.unlockAccount(scsMonitor, 'moacscsofflineaccountpwd', 0);
        const tx = subchainbase.removeMonitorInfo.sendTransaction(scsMonitor, { from: m.core.accounts[0], gas: 900000 });
        ps.push(m.waitBlock(tx));
    }

    await Promise.all(ps);
    // assert.equal(0, subchainbase.nodeCount(), `subchain ${subchainbaseAddr} not release all scs`);
    return {
        scsCount: subchainbase.nodeCount(),
        scsMonitorCount: subchainbase.getMonitorInfo()[0].length
    }
}

(async function () {
    var ps = [];
    subchainbaseAddrs.forEach(a => ps.push(releaseOneChain(a, true)));
    var results = await Promise.all(ps);
    for (let i = 0; i < subchainbaseAddrs.length; i++)
        console.log(`subchain ${subchainbaseAddrs[i]} scs count: ${results[i].scsCount}, scs monitor count: ${results[i].scsMonitorCount}`);
    // console.log(results);
})();

