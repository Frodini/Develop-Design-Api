import { Service } from "typedi";
import { DatabaseService } from "../../database/database.service";
import { Department } from "./department.model";

@Service()
export class DepartmentRepository {
  constructor(private dbService: DatabaseService) {}

  async getAllDepartments(): Promise<Department[]> {
    const db = await this.dbService.connect();
    return await db.all(`SELECT * FROM departments`);
  }
}
