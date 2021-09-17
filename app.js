//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connecting to mongodb Atlas
// change <password> for the one of that specific admin
// remove everything after mongodb.net/ and add your database name
mongoose.connect("mongodb+srv://admin-shmaither:Test123@cluster0.inmlt.mongodb.net/todolistDB");

// First Schema
const itemsSchema = new mongoose.Schema({
  name: String
});

// ModelSchema
const Item = mongoose.model("Item", itemsSchema);

// Creating documents
const item1 = new Item({
  name: "Example item..."
});

const defaultItems = [item1];

// Second Schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

// Second ModelSchema
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, (err, foundItems) => {

    if (!err){
      if (foundItems.length === 0) {

        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Succesfully saved all items into todolistDB");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }

    }
  });

});

// Express Route Parameters
app.get("/:customListName", async(req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  const foundList = await List.findOne({ name: customListName }).exec();

  //List.findOne({name: customListName}, (err, foundList) => {
  //  if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        // Saving the list on database
        list.save();

        // Reloading the new route with data from database
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    //}
  //});

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    // mongoose shortcut for saving the document into the items collection
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) =>{
      foundList.items.push(item);
      // mongoose shortcut for saving the document into the lists collection
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {

    Item.findByIdAndRemove(checkItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully removed from database.");
        res.redirect("/");
      }
    })
  } else {
    // $pull is an operator from mongodb
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}}, (err) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }



});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);

app.listen(port, function() {
  console.log("Server has started succesfully.");
});
