const express = require("express");
const app = express();
const PORT = 3001;
app.get("/", (req, res) => {
  res.send("<h1>this is homepage</h1>");
});

app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  res.send(`<h1>you are viewing user: ${userId}</h1>`);
});
app.get("/users/:userId/books/:bookId", (req, res) => {
  res.send(`User ID: ${req.params.userId}, Book ID: ${req.params.bookId}`);
});
app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});
