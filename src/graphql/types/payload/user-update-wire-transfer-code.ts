import { GT } from "@graphql/index"

import GraphQLUser from "../object/graphql-user"
import IError from "../abstract/error"

const UserUpdateWireTransferCodePayload = GT.Object({
  name: "UserUpdateWireTransferCodePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    user: {
      type: GraphQLUser,
    },
  }),
})

export default UserUpdateWireTransferCodePayload
