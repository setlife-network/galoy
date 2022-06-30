import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const WireTransferCode = GT.Scalar<WireTransferCode | InputValidationError>({
  name: "WireTransferCode",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for WireTransferCode" })
    }
    return validWireTransferCodeValue(value)
  },
  parseLiteral(valueNode) {
    if (valueNode.kind === GT.Kind.STRING) {
      return validWireTransferCodeValue(valueNode.value)
    }
    return new InputValidationError({ message: "Invalid type for WireTransferCode" })
  },
})

function validWireTransferCodeValue(
  value: string,
): WireTransferCode | InputValidationError {
  if (value) {
    return value.toLowerCase() as WireTransferCode
  }
  return new InputValidationError({ message: "Invalid value for WireTransferCode" })
}

export default WireTransferCode
