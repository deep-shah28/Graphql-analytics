require("dotenv").config();

const { DataSource } = require("typeorm");
const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: process.env.DB_PASSWORD,
  database: "my_db",
  entities: [require("../entities/User"), require("../entities/Post")],
  synchronize: true,
  logging: false,
});

const initializeDB = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Data Source has been initialized!");
    }
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    throw error; // Rethrow to handle it in the main application
  }
};

module.exports = { AppDataSource, initializeDB };
