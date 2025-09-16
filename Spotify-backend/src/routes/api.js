import express from 'express';
import SongRouter from "./songRouter.js";
import PlaylistRouter from "./PlaylistRouter.js";
import setupUserRouter from "./UserRouter.js";

const routes = (app, forms) => {
  const userRouter = setupUserRouter(forms);
  app.use("/api/user", userRouter);
  app.use("/api/song", SongRouter);
  app.use("/api/playlist", PlaylistRouter);
};

export default routes;
