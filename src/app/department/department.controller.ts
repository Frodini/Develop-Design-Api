import { Router, Request, Response } from "express";
import { Service } from "typedi";
import { DepartmentService } from "./department.service";
import { authenticateToken } from "../middleware/auth.middleware";

@Service()
export class DepartmentController {
  public router: Router;

  constructor(private departmentService: DepartmentService) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    // Listar todos los departamentos
    this.router.get(
      "/",
      authenticateToken,
      async (req: Request, res: Response) => {
        try {
          const departments = await this.departmentService.getAllDepartments();
          res.status(200).json(departments);
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      }
    );
  }
}
