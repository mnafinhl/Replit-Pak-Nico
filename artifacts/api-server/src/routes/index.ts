import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import distrosRouter from "./distros";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(distrosRouter);

export default router;
