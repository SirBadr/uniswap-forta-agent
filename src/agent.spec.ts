import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  ethers,
} from "forta-agent";
import { 
  MockEthersProvider,
  //encodeParameter, 
  MockEthersSigner, 
  createAddress,
} from "forta-agent-tools/lib/tests";
import { utils, Contract } from "ethers";
import agent, {
  SWAP_EVENT,
  UNISWAP_ROUTER_ADDRESS,
} from "./agent";

import { UNISWAP_V3_POOL_ADDRESS } from "../RouterABI";
import { NON_UNISWAP_V3_POOL_ADDRESS } from "../RouterABI";

describe("uniswap bot", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(async () => {
      handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("returns empty findings if there are no swapping events", async () => {
      mockTxEvent.filterLog = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        SWAP_EVENT,
      );
    });

    it("returns a finding if there is a swapping event from uniswap", async () => {
      // sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick
      //console.log("START");
      const mockSwappingEvent = {
        args: {
          sender: "0xabc",
          recipient: "0xdef",
          amount0: "10",
          amount1: "11",
          sqrtPriceX96: "12",
          liquidity: "13",
          tick:"14",
        },
        address: UNISWAP_V3_POOL_ADDRESS
      };
      mockTxEvent.filterLog = jest
        .fn()
        .mockReturnValue([mockSwappingEvent]);

      const findings = await handleTransaction(mockTxEvent);
      //console.log(findings);

      const sender = mockSwappingEvent.args.sender;
      const recipient = mockSwappingEvent.args.recipient;
      const amount0 = mockSwappingEvent.args.amount0;
      const amount1 = mockSwappingEvent.args.amount1;
      const sqrtPriceX96 = mockSwappingEvent.args.sqrtPriceX96;
      const liquidity = mockSwappingEvent.args.liquidity;
      const tick = mockSwappingEvent.args.tick;

      expect(findings).toStrictEqual([
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
          addresses: []
        })
      ]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        SWAP_EVENT,
      );
      //console.log("FINISH");
    });

    it("returns no findings if there's a swapping event not from uniswap", async() => {
      const mockSwappingEvent = {
        args: {
          sender: "0xabc",
          recipient: "0xdef",
          amount0: "10",
          amount1: "11",
          sqrtPriceX96: "12",
          liquidity: "13",
          tick:"14",
        },
        address: NON_UNISWAP_V3_POOL_ADDRESS
      };
      mockTxEvent.filterLog = jest
        .fn()
        .mockReturnValue([mockSwappingEvent]);

      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
    })
  });
});
