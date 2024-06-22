import express from "express";
import bodyParser from "body-parser";
import pg from "pg"

const app = express();
const port = 3000;

let currentUser = "";
let currentFolder = "";
let currentCard = "";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "softdes_test1",
  password: "password",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("login.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/createfolder", (req, res) => {
  res.render("createfolder.ejs");
});

app.get('/cards', async (req, res) => {  
  const foldername = req.query.foldername;
  console.log("_____________________________________");
  try {
    const folderresult =  await db.query("SELECT * FROM folders WHERE foldername = $1", [foldername]);
    const folders_id = folderresult.rows[0].folders_id;
    //getting foldername using user id to display foldername
    const listofcards =  await db.query("SELECT cardname FROM cards WHERE folder_id = $1", [folders_id]);
    res.render("cards.ejs", { 
      currentUser:currentUser,
      listofcards:listofcards
    });  
  } catch (err) {
    console.log(err);
  }
});

app.get("/logout", (req, res) => {
  res.render("login.ejs");
});

app.post("/register", async (req, res) => {
  //getting name=""
  const username = req.body.username;
  const password = req.body.password;
  try {
    //checking if username already exists
    const userExists = await db.query("SELECT * FROM users WHERE username = $1", [username,]);
    if (userExists.rows.length > 0) {
      res.send("username already exists. try logging in.");
    } else {
      //storing of user info
      const register = await db.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        [username, password]
      );
      //referring you to the login page
      res.render("login.ejs");  
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  //getting name=""
  const username = req.body.username;
  const password = req.body.password;
  try {
    //checking if username already exists
    const checkExist = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (checkExist.rows.length > 0) {
      const user = checkExist.rows[0];
      const storedPassword = user.password;
      if (password === storedPassword) {
        //keeping the username
        currentUser = username;
        //getting user id using username to get foldername
        const userResult = await db.query("SELECT id FROM users WHERE username = $1", [currentUser]);
        const user_id = userResult.rows[0].id;
        //getting foldername using user id to display foldername
        const listoffolder = await db.query("SELECT foldername FROM folders WHERE users_id = $1", [user_id]);
        res.render("folders.ejs", { 
          currentUser:currentUser,
          listoffolder:listoffolder
        });  
      } else {
        res.send("Incorrect Password");
      }
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/createfolder", async (req, res) => {
  const foldername = req.body.folder;
  try {
    const checkResult = await db.query("SELECT * FROM folders WHERE foldername = $1", [foldername,]);
    if (checkResult.rows.length > 0) {
      res.send("Folder already exists. Try a different folder name.");
    } else {
      const userResult = await db.query("SELECT id FROM users WHERE username = $1", [currentUser]);
      if (userResult.rows.length > 0) {
        const user_id = userResult.rows[0].id;
        await db.query("INSERT INTO folders (foldername, users_id) VALUES ($1, $2)", [foldername, user_id]);

        const listoffolder = await db.query("SELECT foldername FROM folders WHERE users_id = $1", [user_id]);
        console.log(listoffolder.rows);
        res.render("folders.ejs", {
          currentUser:currentUser,
          listoffolder:listoffolder
         });
      } else {
        res.status(404).send("User not found");
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while creating the folder.");
  }
});

// Ensure the script runs after the DOM is fully loaded





app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
