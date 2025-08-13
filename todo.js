import express from "express";
import dotenv, { parse } from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const app = express();
const PORT = 3002;
app.use(express.json());
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
async function connectDB() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
  } catch (err) {
    return console.log("Failed to connect to database");
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json("no token provided");
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json("Forbidden");
    }
    req.user = user;
    next();
  });
}

app.post("/users/signup", async (req, res) => {
  try {
    const { fullName, username, pass } = req.body;
    if (!fullName || !username || !pass) {
      return res
        .status(400)
        .json("Full Name, Username and Password must be provided");
    }
    const hashedPass = await bcrypt.hash(pass, 10);
    const [existingUser] = await pool.query(
      "select id from users where username = ?",
      [username]
    );
    if (existingUser.length > 0)
      return res.status(409).json({ error: "user already exists" });
    await pool.query(
      "insert into users (fullName, username, pass) values (?, ?, ?)",
      [fullName, username, hashedPass]
    );
    res.status(201).json("user created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).json("Failed to create user.");
  }
});

app.post("/users/login", async (req, res) => {
  try {
    const { username, pass } = req.body;
    const [rows] = await pool.query(
      "select id, username, pass from users where username = ?",
      [username]
    );
    if (rows.length === 0) {
      return res.status(404).json("user not found");
    }
    const user = rows[0];
    const matchPass = await bcrypt.compare(pass, user.pass);
    if (!matchPass) return res.status(401).json("invalid username or password");

    //create jwt token
    const payload = { id: user.id, username: user.username };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });
    res
      .status(200)
      .json({ message: "login successful", accessToken, refreshToken });
  } catch (err) {
    // This is the improved error handling block.
    // It will now log the actual error and return a 500 status.
    console.error("Error during login:", err);
    res
      .status(500)
      .json({ error: "An internal server error occurred during login." });
  }
});

app.post("/users/token/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    return res.status(401).json("refresh token required");
  }
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden. invalid token" });
    }
    const payload = { id: user.id, username: user.username };
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    res.status(200).json({ accessToken: newAccessToken });
  });
});

//all todos
app.get("/todos", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query("select * from tasks where userId = ?", [
      req.user.id,
    ]);
    res.json(rows);
  } catch (err) {
    console.log(`error occured ${err}`);
    res.status(500).json({ error: "something went wrong" });
  }
});

app.get("/todos/:id", authenticateToken, async (req, res) => {
  const taskId = parseInt(req.params.id);
  if (!taskId) return res.status(400).send("bad request... id required");
  try {
    const [rows] = await pool.query(
      "select * from tasks where id = ? and userId = ?",
      [(taskId, req.user.id)]
    );
    if (rows.length === 0) {
      return res.status(404).send("task not found");
    }
    res.json(rows[0]);
  } catch (err) {
    console.log(`error occured ${err}`);
    res.status(500).json({ error: "something went rong" });
  }
});

app.post("/todos", authenticateToken, async (req, res) => {
  const { task, done } = req.body;
  if (!task || typeof task !== "string") {
    return res.status(400).send("bad request... id required");
  }
  try {
    const [result] = await pool.query(
      "insert into tasks (task, done, userId) values (?, ?, ?)",
      [task, done, req.user.id]
    );
    const newTodo = {
      id: result.insertId,
      task,
      done: done,
      userId: req.user.id,
    };
    res.status(201).json(newTodo);
  } catch (err) {
    console.log(`error creating new task: ${err}`);
    res.status(500).json({ error: "something went wrong" });
  }
});

app.put("/todos/:id", authenticateToken, async (req, res) => {
  const taskId = parseInt(req.params.id);
  if (!taskId) {
    return res.status(400).send("bad request... id required");
  }
  const { task, done } = req.body;
  try {
    const [rows] = await pool.query(
      "select * from tasks where id = ? and userId = ?",
      [taskId, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).send("task not found");
    }
    const updatedTask = rows[0];
    if (task && typeof task === "string") {
      updatedTask.task = task;
    }
    if (done !== "boolean") {
      updatedTask.done = Boolean(done);
    }
    await pool.query(
      "update tasks set task = ?, done = ? where id = ? and userId = ?",
      [updatedTask.task, updatedTask.done, taskId, req.user.id]
    );
    res.status(200).json(updatedTask);
  } catch (err) {
    console.log(`error occured: ${err}`);
    res.status(500).json({ error: "something went wrong" });
  }
});

app.delete("/todos/:id", authenticateToken, async (req, res) => {
  const taskId = parseInt(req.params.id);
  if (!taskId) {
    return res.status(400).send("bad request... id required");
  }
  try {
    const [result] = await pool.query(
      "delete from tasks where id = ? and userId = ?",
      [taskId, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send("task not found");
    }
    res.status(200).json({ message: "task deleted successfully" });
  } catch (err) {
    console.log(`error occured: ${err}`);
    res.status(500).json({ error: "something went wrong" });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});

// function errorHandler(err, req, res, next) {
//   return res.status(500).json({ error: "unknown error occurred" });
// }

// authetication
// mysql 8 >
// validation
// login
// signup
