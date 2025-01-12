import { Service } from "typedi";
import { DepartmentRepository } from "./department.repository";

@Service()
export class DepartmentService {
  constructor(private departmentRepository: DepartmentRepository) {}

  async getAllDepartments(): Promise<any[]> {
    return this.departmentRepository.getAllDepartments();
  }
}
