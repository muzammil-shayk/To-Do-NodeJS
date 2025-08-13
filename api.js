const express = require("express");
const api = express();

const PORT = 3001;

api.use(express.json());
let items = [
  { id: 1, name: "Item A", description: "This is the first item." },
  { id: 2, name: "Item B", description: "This is the second item." },
  { id: 3, name: "Item C", description: "This is the third item." },
];

// GET req all items
api.get("/", (req, res) => {
  res.json(items);
});

//GET find item by id
api.get("/items/:id", (req, res) => {
  const itemId = items.find((i) => i.id === parseInt(req.params.id));
  if (itemId) {
    res.json(itemId);
  } else {
    res.status(404).send("item not found");
  }
});

// POST request to create new item
api.post("/items/new", (req, res) => {
  if (!req.body.name || !req.body.description) {
    return res.status(400).send("name and description required");
  }
  const newItem = {
    id: items.length + 1,
    name: req.body.name,
    description: req.body.description,
  };
  items.push(newItem);
  res.status(201).json(newItem);
});

//PUT req to update existing item
api.put("/items/put/:id", (req, res) => {
  const item = items.find((i) => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).send("Item doesnt exist");
  }
  if (!req.body.name || !req.body.description) {
    return res.status(400).send("Name and Description are required");
  }
  item.name = req.body.name;
  item.description = req.body.description;
  res.json(item);
});

//DELETE req to remove from array
api.delete("/items/del/:id", (req, res) => {
  const item = items.find((i) => i.id === parseInt(req.params.id));
  if (!item) {
    res.status(404).send("item does not exist");
  }
  const index = items.indexOf(item);
  items.splice(index, 1);
  res.json(item);
});

//server
api.listen(PORT, () => {
  console.log(`server is running on port: ${PORT}`);
});
