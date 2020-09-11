import { AdminWallet } from "../LightningAdminImpl";
import {User, setupMongoConnection} from "../mongodb"
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// need to set MONGODB_ADDRESS to call the script
// ie: MONGODB_ADDRESS=localhost ts-node export_user_create_csv.ts

const main = async () => {
  await setupMongoConnection()

  const adminWallet = new AdminWallet()
  const books = await adminWallet.getBooks()

  console.log("csvWriter")
  const csvWriter = createCsvWriter({
    path: 'records.csv',
    header: ['Account', 'Balance']
  });

  Object.keys(books).forEach(async account => await csvWriter.writeRecords([account, books[account]]));
}

main().then(o => console.log(o)).catch(err => console.log(err))
console.log("end")