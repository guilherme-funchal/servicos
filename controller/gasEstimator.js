const { Web3 } = require('web3');


async function priorityFeePerGas(address) {
    var web3 = new Web3(`${address}`);

  function formatFeeHistory(result) {
    let blockNum = Number(result.oldestBlock);
    const blocks = [];
    for (let index = 0; index < result.baseFeePerGas.length; index++) {
      if (result.reward[index]) { 
        blocks.push({
          priorityFeePerGas: result.reward[index].map(x => Number(x)),
        });
      }
      blockNum += 1;
    }
    return blocks;
  }

  function avg(arr) {
    const sum = arr.reduce((a, v) => a + v);
    return Math.round(sum/arr.length);
  }
  
  const feeHistory = await web3.eth.getFeeHistory(20, "pending", [1]);
  const blocks = formatFeeHistory(feeHistory);
  const average = avg(blocks.map(b => b.priorityFeePerGas[0]));
  return average;
    
}

module.exports = { priorityFeePerGas };