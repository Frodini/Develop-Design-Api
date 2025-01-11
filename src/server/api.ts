import { Router } from "express";
import { Service } from "typedi";
import { UserController } from "../app/user/user.controller";

@Service()
export class Api {
  private apiRouter: Router;

  constructor(private userController: UserController) {
    this.apiRouter = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rutas de usuario
    this.apiRouter.use("/users", this.userController.router);

    // Aquí puedes agregar otros módulos, como:
    // this.apiRouter.use("/appointments", this.appointmentsController.router);
  }

  public getApiRouter(): Router {
    return this.apiRouter;
  }
}
