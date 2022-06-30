import { Users } from "@app"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import UserUpdateWireTransferCodePayload from "@graphql/types/payload/user-update-wire-transfer-code"
import WireTransferCode from "@graphql/types/scalar/wire-transfer-code"

const UserUpdateWireTransferCodeInput = GT.Input({
  name: "UserUpdateWireTransferCodeInput",
  fields: () => ({
    wireTransferCode: { type: GT.NonNull(WireTransferCode) },
  }),
})

const UserUpdateWireTransferCodeMutation = GT.Field({
  type: GT.NonNull(UserUpdateWireTransferCodePayload),
  args: {
    input: { type: GT.NonNull(UserUpdateWireTransferCodeInput) },
  },
  resolve: async (_, args, { domainUser }: { domainUser: User }) => {
    const { wireTransferCode } = args.input

    if (wireTransferCode instanceof Error) {
      return { errors: [{ message: wireTransferCode.message }] }
    }

    const result = await Users.updateWireTransferCode({
      userId: domainUser.id,
      wireTransferCode,
    })

    if (result instanceof Error) {
      const appErr = mapError(result)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      user: result,
    }
  },
})

export default UserUpdateWireTransferCodeMutation
