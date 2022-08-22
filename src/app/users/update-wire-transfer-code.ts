import { UsersRepository } from "@services/mongoose"

export const updateWireTransferCode = async ({
  userId,
  wireTransferCode,
}: UpdateWireTransferCodeArgs): Promise<User | ApplicationError> => {
  const usersRepo = UsersRepository()
  const user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  user.wireTransferCode = wireTransferCode
  return usersRepo.update(user)
}
