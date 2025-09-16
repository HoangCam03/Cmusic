import express from "express";
import UserController from "../controllers/UserController.js";
import { authenticateToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';

const setupUserRouter = (forms) => {
  const router = express.Router();

  router.post("/register", forms.none(), UserController.register);
  router.post("/login", forms.none(), UserController.login);
  router.post("/create-playlist", authenticateToken, upload.single('image'), UserController.createPlaylist);
  router.post("/update-role", authenticateToken, UserController.updateRole);

  // New route to list all users (GET request)
  router.get("/list", authenticateToken, UserController.listUsers);

  return router;
};

export default setupUserRouter;