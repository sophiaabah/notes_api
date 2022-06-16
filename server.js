const express = require("express"); //makes my server
const app = express();
const bodyParser = require("body-parser"); // middleware for express
const bcrypt = require("bcrypt-nodejs"); // scramble my hashes
const cors = require("cors"); // to connect server to front end
const knex = require("knex"); // to connect database to server
const { response } = require("express");
const { password } = require("pg/lib/defaults");

// try prisma

app.use(bodyParser.json());
app.use(cors());

const store = knex({
  //assign knex to a variable so we can access it and its methods in the file. we cant use knex anymore cuz i used it to require the package so use store
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    password: "43211",
    database: "notepad",
  },
});

// knex has custom ways/methods of returning info in the database to our server.
// it uses a query builder to construct our sql statement (language of communication btw server and db), in order to speak with the db
// we wouldnt use the usual js syntaxes.
// we have to use x chaining because requests to our db return a promise first

const data = [
  {
    id: "123",
    name: "Sally",
    email: "sallyjenkins@gmail.com",
    password: "mundane",
  },
  {
    id: "123",
    name: "Sally",
    email: "sallyjenkins@gmail.com",
    password: "mundane",
  },
];

// get requests always have send as a response, other requests should too or server hangs cuz its not responding with anything.
// what is the root route. my homepage?? i think its profile or account cuz u can link that to id. and since id is unique its not rly smtn youd show on root route. or maybe two root routes... one with id and without
app.get("/", (req, res) => {
  const user = {
    name: "Sally",
    hobby: "soccer",
  };
  res.send(user);
});

// sign in route with a post method to post information to our server. return / responds with success or fail.
//the information is being passed in the body of the reqest (not query strings!) to protect from man in the middle attacks. so we access req.body

app.post("/signin", (req, res) => {
  // or destructure const { email, password } = req.body;
  store("users")
    .where({
      email: req.body.email, // searching thru the table using primary key
    })
    .select("*")
    .then((response) => {
      if (req.body.password === response[0].hash) {
        return res.json({
          email: response[0].email,
          name: response[0].name,
        });
      } else {
        res.status(400).json("Wrong credentials");
      }
    })
    .catch((err) => res.status(400).json("Email doesnt exist")); // change this error message
});

// register route with a post request because we will send data to our database. return access to a new page
app.post("/register", (req, res) => {
  // const hash = bcrypt.hashSync(password);
  store
    .insert({
      hash: req.body.password,
      email: req.body.email,
      name: req.body.name,
    })
    .into("users")
    .returning(["email", "name"])
    .then((response) => {
      return res.json(response[0]);
    });
});

app.post("/savenote", async (req, res) => {
  const note = await store("notes").where({ id: req.body.id }).select("id");
  console.log(note);
  if (note.length === 0) {
    const newNote = await store
      .insert({
        id: req.body.id,
        user_email: req.body.email,
        note: req.body.note,
      })
      .into("notes")
      .returning("*");

    return res.json(newNote[0]);
  } else {
    const newNote = await store("notes")
      .where({ id: req.body.id })
      .update({
        note: req.body.note,
      })
      .returning("*");

    return res.json(newNote[0]);
  }
});

app.get("/getnotes", (req, res) => {
  store("notes")
    .where({
      user_email: req.query.email, // searching thru the table using primary key
    })
    .select("*")
    .then((response) => {
      res.json(response);
    });
});

app.post("/deletenote", (req, res) => {
  store("notes")
    .where({ id: req.body.id })
    .del()
    .then(() => {
      res.json(true);
    });
});

app.listen(3000);
