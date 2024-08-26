import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import http from "http";
import { json } from "body-parser";
import { postRouter } from "./routes/posts_actions/posts";
import { commentRouter } from "./routes/comment";
import { likeRouter } from "./routes/like";
import { userRouter } from "./routes/users_actions/users";
import { followRouter } from "./routes/users_actions/follow";
import { blockRouter } from "./routes/users_actions/block";
import { favRouter } from "./routes/users_actions/favourite";
import { requestRouter } from "./routes/users_actions/request";
import { saveRouter } from "./routes/posts_actions/save";
import { collectionRouter } from "./routes/posts_actions/collection";
import { messagesRouter } from "./routes/messages";
import { albumRouter } from "./routes/posts_actions/album";
import { Server } from "socket.io";
import { initSocket } from "./routes/socket";
import { notiRouter } from "./routes/noti";

const PORT = 4444;
// const MONGO_URL = "mongodb://localhost:27017/todo";

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(json());
app.use(express.static(path.join("./public")));

app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);
app.use("/likes", likeRouter);
app.use("/follows", followRouter);
app.use("/blocks", blockRouter);
app.use("/favs", favRouter);
app.use("/request", requestRouter);
app.use("/save", saveRouter);
app.use("/collection", collectionRouter);
app.use("/messages", messagesRouter);
app.use("/album", albumRouter);
app.use("/noti", notiRouter);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

initSocket(io);

const { DB_URL } = process.env;

mongoose
  // .connect(MONGO_URL)
  .connect(`${DB_URL}`)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

server.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}`));
