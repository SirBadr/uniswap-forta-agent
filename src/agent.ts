import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";

import {POOL_ABI, FACTORY_ABI, FACTORY_ADDRESS} from '../RouterABI';
import { ethers } from "ethers";
/*
const Web3 = require("web3");
const infura_URL = "https://mainnet.infura.io/v3/88c8b23728d749a3bccb188917e9ec27";
const web3 = new Web3(new Web3.providers.HttpProvider(infura_URL));
*/
export const SWAP_EVENT =
  "event Swap (address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)";
export const UNISWAP_ROUTER_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
//export const TETHER_DECIMALS = 6;
let findingsCount = 0;
const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // limiting this agent to emit only 5 findings so that the alert feed is not spammed
  if (findingsCount >= 1) return findings;

  const uniswapSwapEvents = txEvent.filterLog(
    SWAP_EVENT
  );

  const isUniswapAddress = async (currPool: string) => {
    // compare factory contract address with our constant
    const provider = getEthersProvider();
    // Query the pool contract for tokens and fee
    const poolContract = new ethers.Contract(currPool, POOL_ABI, provider);
    const factory = await poolContract.factory();

    if(factory.toLowerCase() == FACTORY_ADDRESS.toLowerCase()){
      return true;
    }

    return false;
  }
  //uniswapSwapEvents.forEach(async (swapEvent) =>
  for(const swapEvent of uniswapSwapEvents) {
    // extract transfer event arguments
    const { sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick } = swapEvent.args;
    // shift decimals of transfer value
    //console.log(swapEvent);
    const isUniPool = await isUniswapAddress(swapEvent.address);
    if(isUniPool) {
      //const swapEvents = txEvent.filterLog(SWAP_EVENT, swapEvent.address);
      //console.log("inside");
      findings.push(
        Finding.fromObject({
          name: "UNISWAP V3 swap",
          description: `Swap event`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            sender,
            recipient,
            amount0,
            amount1,
            sqrtPriceX96,
            liquidity,
            tick
          },
        })
      )
      findingsCount++;
    }
  };

  return findings;
};

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

export default {
  handleTransaction,
  // handleBlock
};
