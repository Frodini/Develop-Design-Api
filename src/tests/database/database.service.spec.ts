import "reflect-metadata";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import { Container } from "typedi";
import { DatabaseService } from "../../database/database.service";

jest.mock("sqlite", () => ({
  open: jest.fn(),
}));

jest.mock("sqlite3", () => ({
  Database: jest.fn(),
}));

describe("DatabaseService", () => {
  let databaseService: DatabaseService;
  let openMock: jest.MockedFunction<typeof open>;
  let dbMock: jest.Mocked<Database>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    // Mock the open function and database methods
    dbMock = {
      exec: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<Database>;

    openMock = open as jest.MockedFunction<typeof open>;
    openMock.mockResolvedValue(dbMock);

    databaseService = Container.get(DatabaseService);
  });

  describe("connect", () => {
    it("should open the database if not already connected", async () => {
      const db = await databaseService.connect();

      expect(openMock).toHaveBeenCalledWith({
        filename: path.resolve(__dirname, "../../data/database.db"), // Asegura que la ruta generada sea exactamente igual
        driver: sqlite3.Database,
      });

      expect(db.exec).toHaveBeenCalledWith("PRAGMA foreign_keys = ON");
      expect(db).toBe(dbMock);
    });

    it("should return the same database instance if already connected", async () => {
      await databaseService.connect();
      const secondDb = await databaseService.connect();

      expect(openMock).toHaveBeenCalledTimes(1);
      expect(secondDb).toBe(dbMock);
    });
  });

  describe("initializeDatabase", () => {
    it("should execute table creation and default value scripts", async () => {
      await databaseService.initializeDatabase();

      expect(dbMock.exec).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS users")
      );
      expect(dbMock.exec).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO specialties (name)")
      );
      expect(dbMock.exec).toHaveBeenCalledTimes(3); // Verifying exec for both scripts
    });
  });
});
