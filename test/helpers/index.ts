import { generate2fa, save2fa } from "@app/users"
import { InvalidPhoneNumber } from "@domain/errors"
import { TwoFAAlreadySetError } from "@domain/twoFA"
import { gqlAdminSchema } from "@graphql/admin"
import { ExecutionResult, graphql, Source } from "graphql"
import { ObjMap } from "graphql/jsutils/ObjMap"
import { generateToken } from "node-2fa"

export * from "./apollo-client"
export * from "./bitcoin-core"
export * from "./integration-server"
export * from "./lightning"
export * from "./price"
export * from "./rate-limit"
export * from "./redis"
export * from "./state-setup"
export * from "./user"
export * from "./wallet"
export * from "./check-is-balanced"

export const amountAfterFeeDeduction = ({
  amount,
  depositFeeRatio,
}: {
  amount: Satoshis
  depositFeeRatio: DepositFeeRatio
}) => Math.round(amount * (1 - depositFeeRatio))

export const resetDatabase = async (mongoose) => {
  const db = mongoose.connection.db
  // Get all collections
  const collections = await db.listCollections().toArray()
  // Create an array of collection names and drop each collection
  collections
    .map((c) => c.name)
    .forEach(async (collectionName) => {
      await db.dropCollection(collectionName)
    })
}

export const generateTokenHelper = (secret) => {
  const generateTokenResult = generateToken(secret)
  if (generateTokenResult && generateTokenResult.token) {
    return generateTokenResult.token as TwoFAToken
  }

  fail("generateToken returned null")
}

export const enable2FA = async (userId: UserId) => {
  const generateResult = await generate2fa(userId)
  if (generateResult instanceof Error) return generateResult

  const { secret } = generateResult

  const token = generateTokenHelper(secret)

  const user = await save2fa({ secret, token, userId })
  if (user instanceof Error && !(user instanceof TwoFAAlreadySetError)) {
    throw user
  }

  return secret
}

export const chunk = (a, n) =>
  [...Array(Math.ceil(a.length / n))].map((_, i) => a.slice(n * i, n + n * i))

export const randomPhone = (length = 14): PhoneNumber => {
  const PhoneNumberRegex = /^\+\d{7,14}$/i // FIXME {7,14} to be refined

  const phoneNumber = `+${Math.floor(Math.random() * 10 ** length)}`
  if (!phoneNumber.match(PhoneNumberRegex)) throw new InvalidPhoneNumber()

  return phoneNumber as PhoneNumber
}

export const graphqlAdmin = <
  T = Promise<ExecutionResult<ObjMap<unknown>, ObjMap<unknown>>>,
>({
  source,
  contextValue,
}: {
  source: string | Source
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextValue?: Record<string, any>
}) => graphql({ schema: gqlAdminSchema, source, contextValue }) as unknown as T
