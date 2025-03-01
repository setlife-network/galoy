import { LoopService } from "@services/loopd"

import {
  SwapClientNotResponding,
  SwapErrorChannelBalanceTooLow,
} from "@domain/swap/errors"
import { SwapOutChecker } from "@domain/swap"
import { lndsBalances } from "@services/lnd/utils"
import { getSwapDestAddress } from "@app/swap/get-swap-dest-address"
import {
  getActiveLoopd,
  LND1_LOOP_CONFIG,
  LND2_LOOP_CONFIG,
} from "@app/swap/get-active-loopd"
import { swapOut } from "@app/swap"
import { BtcPaymentAmount, WalletCurrency, ZERO_SATS } from "@domain/shared"

describe("Swap", () => {
  const activeLoopd = getActiveLoopd()
  const swapService = LoopService(activeLoopd ?? LND1_LOOP_CONFIG)
  const amount: BtcPaymentAmount = { amount: 250000n, currency: WalletCurrency.Btc }

  it("Swap out app returns a SwapOutResult or NoSwapAction", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (!(isSwapServerUp instanceof Error)) {
      const swapResult = await swapOut()
      if (swapResult instanceof Error) throw swapResult
      expect(swapResult).not.toBeInstanceOf(Error)
      if (swapResult.noOp) {
        expect(swapResult.noOp).toBe(true)
      } else {
        expect(swapResult).toEqual(
          expect.objectContaining({
            swapId: expect.any(String),
          }),
        )
      }
    }
  })

  it("Swap out for default active loop node or lnd1-loop node returns successful swap result ", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (!(isSwapServerUp instanceof Error)) {
      const swapDestAddress = await getSwapDestAddress()
      if (swapDestAddress instanceof Error) return swapDestAddress
      const swapResult = await swapService.swapOut({ amount, swapDestAddress })
      if (swapResult instanceof SwapClientNotResponding) {
        console.log("Swap Client is not running, skipping")
        return
      }
      if (swapResult instanceof Error) throw swapResult
      expect(swapResult).not.toBeInstanceOf(Error)
      expect(swapResult).toEqual(
        expect.objectContaining({
          swapId: expect.any(String),
        }),
      )
    }
  })

  it("Swap out for lnd2-loop node returns successful swap result or error if not enough funds", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (!(isSwapServerUp instanceof Error)) {
      const loopService = LoopService(LND2_LOOP_CONFIG)
      const swapServiceLnd2 = loopService
      const isSwapServerUp2 = await swapServiceLnd2.healthCheck()
      if (!(isSwapServerUp2 instanceof Error)) {
        const swapDestAddress = await getSwapDestAddress()
        if (swapDestAddress instanceof Error) return swapDestAddress
        // this might fail in not enough funds in LND2 in regtest
        const swapResult = await swapServiceLnd2.swapOut({ amount, swapDestAddress })
        if (swapResult instanceof SwapClientNotResponding) {
          console.log("Swap Client is not running, skipping")
          return
        }
        if (swapResult instanceof Error) {
          if (swapResult instanceof SwapErrorChannelBalanceTooLow) {
            expect(swapResult).toBeInstanceOf(SwapErrorChannelBalanceTooLow)
          } else {
            expect(swapResult).not.toBeInstanceOf(Error)
          }
        } else {
          expect(swapResult).toEqual(
            expect.objectContaining({
              swapId: expect.any(String),
            }),
          )
        }
      }
    }
  })

  it("Swap out without enough funds returns an error", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (!(isSwapServerUp instanceof Error)) {
      const btc = { amount: 5_000_000_000n, currency: WalletCurrency.Btc }
      const swapResult = await swapService.swapOut({ amount: btc })
      if (swapResult instanceof SwapClientNotResponding) {
        return
      }
      expect(swapResult).toBeInstanceOf(Error)
    }
  })

  it("Swap out if on chain wallet is depleted returns a swap result", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (!(isSwapServerUp instanceof Error)) {
      // thresholds
      const { onChain } = await lndsBalances()
      const loopOutWhenHotWalletLessThanConfig = {
        amount: BigInt(onChain + 50000),
        currency: WalletCurrency.Btc,
      }

      // check if wallet is depleted
      const swapOutChecker = SwapOutChecker({
        loopOutWhenHotWalletLessThanConfig,
        swapOutAmount: amount,
      })
      const amountToSwapOut = swapOutChecker.getSwapOutAmount({
        currentOnChainHotWalletBalance: ZERO_SATS,
        currentOutboundLiquidityBalance: ZERO_SATS,
      })
      if (amountToSwapOut instanceof Error) return amountToSwapOut
      if (amountToSwapOut.amount > 0) {
        const swapResult = await swapService.swapOut({ amount: amountToSwapOut })
        if (swapResult instanceof SwapClientNotResponding) {
          return
        }

        expect(swapResult).not.toBeInstanceOf(Error)
        expect(swapResult).toEqual(
          expect.objectContaining({
            swapId: expect.any(String),
          }),
        )
      } else {
        expect("No swap Needed").toEqual("No swap Needed")
      }
    }
  })

  it("Swap out quote return quote result", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (!(isSwapServerUp instanceof Error)) {
      const btc: BtcPaymentAmount = { amount: 250000n, currency: WalletCurrency.Btc }
      const quoteResult = await swapService.swapOutQuote(btc)
      if (quoteResult instanceof Error) throw quoteResult
      expect(quoteResult).not.toBeInstanceOf(Error)
      expect(quoteResult.swapFeeSat).toBeDefined()
    }
  })

  it("Swap out terms return terms result", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (!(isSwapServerUp instanceof Error)) {
      const termsResult = await swapService.swapOutTerms()
      if (termsResult instanceof Error) throw termsResult
      expect(termsResult).not.toBeInstanceOf(Error)
      expect(termsResult.maxSwapAmount).toBeDefined()
    }
  })
})
