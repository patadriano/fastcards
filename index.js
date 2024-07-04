import express from "express";
import bodyParser from "body-parser";
import pg from "pg"

const app = express();
const port = 3000;

let currentUser = "";
let currentFolderName = "";
let currentFolderId = "";
let currentCardName = "";
let currentCardId = "";
let currentCardIdQuiz = "";
let currentListFolders = "";
let i = 0;
let noOfRows = 0;
let questions = [];
let answers = [];
let checking = [];
let score = 0;


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
  console.log("Entering Login Page - get '/' ");
  res.render("login.ejs");
});

app.get("/login", (req, res) => {
  console.log("Entering Login Page - get '/login' ");
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  console.log("Entering Register Page - get '/register' ");
  res.render("register.ejs");
});

app.get("/createfolder", (req, res) => {
  console.log("Entering Create Folder Page - get '/createfolder' ");
  res.render("createfolder.ejs");
});

app.get("/createcard", (req, res) => {
  console.log("Entering Create Card Page - get '/createcard' ");
  res.render("createcard.ejs");
});

app.get("/editdeletefolders", (req, res) => {
  console.log("Entering Edit/Delete Folders Page - get '/editdeletefolders' ");
  res.render("edit-delete.ejs");
});

app.get("/editdeletecards", (req, res) => {
  console.log("Entering Edit/Delete Cards Page - get '/editdeleteacards' ");
  res.render("edit-delete-cards.ejs");
});

app.get("/playquiz", async (req, res) => {

  console.log("Entering Play Quiz Page - get '/playquiz' ");

  try{
      const cardname = req.query.cardname;
      let result =  await db.query("SELECT * FROM cards WHERE cardname = $1", [cardname]);
      const cards_id = result.rows[0].cards_id;
      currentCardIdQuiz = cards_id;
      result =  await db.query("SELECT * FROM qna WHERE card_id = $1", [cards_id]);
      console.log(result.rows);
      noOfRows = result.rows.length;
      res.render("playquiz.ejs", {
        question: result.rows[i].question,
      });

  } catch (err) {
    console.log(err);
  }
  
});

app.get('/cards', async (req, res) => { 
  console.log("Entering Cards Page - get '/cards' "); 
  if (req.query.foldername){
  const foldername = req.query.foldername;
  currentFolderName = foldername;
  try {
    const folderresult =  await db.query("SELECT * FROM folders WHERE foldername = $1", [foldername]);
    const folders_id = folderresult.rows[0].folders_id;
    currentFolderId = folders_id;
    //getting foldername using user id to display foldername
    const listofcards =  await db.query("SELECT cardname FROM cards WHERE folder_id = $1", [folders_id]);
    res.render("cards.ejs", { 
      currentUser:currentUser,
      listofcards:listofcards
    });  
  } catch (err) {
    console.log(err);
  }
}else{
    try {
      const folderresult =  await db.query("SELECT * FROM folders WHERE foldername = $1", [currentFolderName]);
      const folders_id = folderresult.rows[0].folders_id;
      currentFolderId = folders_id;
      //getting foldername using user id to display foldername
       let listofcards =  await db.query("SELECT cardname FROM cards WHERE folder_id = $1", [folders_id]);

      res.render("cards.ejs", { 
        currentUser:currentUser,
        listofcards:listofcards
      });  
    } catch (err) {
      console.log(err);
    }
  }
});

app.get("/score",  async (req, res) => {
  console.log("Entering Card Page - get '/score' ");
  const listofcards =  await db.query("SELECT cardname FROM cards WHERE folder_id = $1", [currentFolderId]);
  res.render("cards.ejs", {currentUser:currentUser, listofcards:listofcards});
});

app.get("/summary", async (req, res) => {
  onsole.log("Entering Summary Page - get '/summary' ");
  const listofcards =  await db.query("SELECT cardname FROM cards WHERE folder_id = $1", [currentFolderId]);
  res.render("cards.ejs", {currentUser:currentUser, listofcards:listofcards});
});

app.get("/logout", (req, res) => {
  console.log("Entering Login Page - get '/logout' ");
  res.render("login.ejs");
});

app.post("/register", async (req, res) => {
  console.log("Inserting User Data - post '/register' ");
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
  console.log("Checking User Data - post '/login' ");
  const username = req.body.username;
  const password = req.body.password;
  try {
    const checkExist = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (checkExist.rows.length > 0) {
      const user = checkExist.rows[0];
      const storedPassword = user.password;
      if (password === storedPassword) {
        currentUser = username;
        console.log(currentUser);
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
  console.log("Creating Folder - post '/createfolder' ");
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

app.post("/createcard", async (req, res) => {
  console.log("Creating Card - post '/createcard' ");
  const cardname = req.body.cardname;
  console.log("entering createcard");
  console.log("cardname",cardname);
  currentCardName = cardname
  try {
    const cardExists = await db.query("SELECT * FROM cards WHERE cardname = $1", [cardname]);
    if (cardExists.rows.length > 0) {
      res.send("card name already exists. try another name in.");
    } else {
    
      const addCard = await db.query(
        "INSERT INTO cards (cardname, folder_id) VALUES ($1, $2)",
        [cardname, currentFolderId]
      );
      const cardid = await db.query("SELECT * FROM cards WHERE cardname = $1", [currentCardName]);
    const card_id = cardid.rows[0].cards_id;
      const listofqna =  await db.query("SELECT * From qna where card_id = $1", [card_id]);
      console.log(listofqna);
      res.render("createquiz.ejs",{listofqna:listofqna});  
  } 
    
  } catch (err) {
    console.log(err);
  }
});

app.post("/createquiz", async (req, res) => {
  console.log("Creating Quiz - post '/createquiz' ");
  const question = req.body.question;
  const answer = req.body.answer;
  try {
    const cardid = await db.query("SELECT * FROM cards WHERE cardname = $1", [currentCardName]);
    const card_id = cardid.rows[0].cards_id;
    currentCardId = card_id;
    console.log(currentCardId);
    await db.query("INSERT INTO qna (question, answer, card_id) VALUES ($1, $2,$3)",[question, answer, currentCardId]);
      const listofqna =  await db.query("SELECT * From qna where card_id = $1", [currentCardId]);
      console.log(listofqna);
      res.render("createquiz.ejs",{listofqna:listofqna});  
  } catch (err) {
    console.log(err);
  }
});

app.post("/playquiz", async (req, res) => {
  
  try {
    const answer = req.body.quizanswer;
  console.log(req.body);
  console.log(req.body.quizanswer);
    const qnaresult =  await db.query("SELECT * FROM qna WHERE card_id = $1", [currentCardIdQuiz]);
    console.log(qnaresult.rows);
    console.log(i);
    questions.push(qnaresult.rows[i].question);
    answers.push(qnaresult.rows[i].answer);
    console.log(qnaresult.rows[i].question, qnaresult.rows[i].answer);
    console.log(qnaresult.rows[i].answer);
    if (qnaresult.rows[i].answer == answer){
      console.log("correct");
      checking.push("correct");
      score += 1;
    }else{
      console.log("incorrect");
      checking.push("incorrect");
    }
    i++;
    if (i < noOfRows){
      res.render("playquiz.ejs",{
        question: qnaresult.rows[i].question
      });
    }else{
      i = 0;
      res.render("scorespage.ejs", {questions:questions,answers:answers,checking:checking, score:score});
    }
  } catch (err) {
    console.log(err);
  }

});
app.post("/editdeletefolders", async (req, res) => {  
  const origfoldername = req.body.origfoldername;
  const newfoldername = req.body.newfoldername;
  const deletefoldername = req.body.delete;
  try {
    //checking if username already exists
    await db.query("UPDATE folders SET foldername = $1 WHERE foldername = $2;", [newfoldername,origfoldername]);
    await db.query("DELETE FROM folders WHERE foldername = $1", [deletefoldername]);
    const userResult = await db.query("SELECT id FROM users WHERE username = $1", [currentUser]);
    const user_id = userResult.rows[0].id;
    const listoffolder = await db.query("SELECT foldername FROM folders WHERE users_id = $1", [user_id]);
    res.render("folders.ejs", { 
      currentUser:currentUser,
      listoffolder:listoffolder
    });  
  } catch (err) {
    console.log(err);
  }
});

app.post("/editdeletecards", async (req, res) => {  
  const origcardname = req.body.origcardname;
  const newcardname = req.body.newcardname;
  const deletecardname = req.body.delete;
  try {
    //checking if username already exists
    await db.query("UPDATE cards SET cardname = $1 WHERE cardname = $2;", [newcardname,origcardname]);
    await db.query("DELETE FROM cards WHERE cardname = $1", [deletecardname]);
    const listofcards =  await db.query("SELECT cardname FROM cards WHERE folder_id = $1", [currentFolderId]);
    res.render("cards.ejs", { 
      currentUser:currentUser,
      listofcards:listofcards
    });  
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
