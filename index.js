//importing express module and saving it in express variable
const express = require("express")
//create an express object and store it into the variable app
//can use app to create API routes
const app = express();
//imports the path module and stores that into the path variable
const path = require("path")
//imports the bcrypt module and stores that into the bcrypt variable
const bcrypt = require("bcrypt");
//imports the jsonswebtoken module and stores that in the jwt
const jwt = require("jsonwebtoken")
//imports the cookie-parser module and stores this into cookieParser
const cookieParser = require("cookie-parser")

//allows usuage of .env files, DO NOT USE LINE IN PRODUCTION
require("dotenv").config(); 

//using the cookieParser module as a middlewear function to parse cookies for us to use
app.use(cookieParser())
//using express's json middleware to parse req.body into a JSON object
app.use(express.json())

//allows account information to be stored and modified through a JSON object in Accounts
const Accounts = {}

//listening for a requests on the "/" route and executes the function
app.get("/", (req, res) =>
{
    //sends the index.html file to the user for their browser to render
    res.sendFile(path.join(__dirname, "public","index.html") )
})

//creates a middleware function named TokenCheck
const TokenCheck = (req, res, next) =>
{
    //reads the cookies from the user and stores that in the token variable
    const token = req.cookies.authToken; 
    //checks if there is a cookie, if not cookie not logged in and tells the user they aren't logged in,
    if(!token) return res.send("error! You aren't logged in!");
    //tries to check if the token present is actually a correct token
    try
    {
        //grabs the TOKEN_SECRET variable in .env file and checks if the token matches the password. if not throw an error
        verified = jwt.verify(token, process.env.TOKEN_SECRET);
        //stores the verified object into req.user so it can be accessed later
        req.user = verified;
        //moves on to the next middleware/function
        next(); 
    }
    catch(err)
    {
        res.send("error! You aren't logged in!")
    }
}

//listening for a GET request on /homepage, then uses the TokenCheck middleware to make sure they are logged in. If they are send back the homepage html
app.get("/homepage", TokenCheck, (req, res) =>
{
    //sends the user the authHomepage.html
    res.sendFile(path.join(__dirname, "public", "authHomepage.html"))
})


//listens for a post request on the given route and handles the data
app.post("/api/user/register", async (req, res) =>
{
    //stores username and password from the body sent from the user
    const username = req.body.username; 
    const password = req.body.password; 

    //checks if the password is less than 4. if so send an error
    if(password.length < 4) return res.status(400).send({error:true, message:"make a better password"}) 
    
    //checks to see if there is a already made account with the same username in the Accounts JSON object, if so send an error
    if(Accounts[username]) return res.status(400).send({error:true, message:"this account name is taken"})

    //uses bcrypt to hash the password and store that in the hashedPassword variable
    const hashedPassword = await bcrypt.hash(password, 10)

    //creates a new JSON object with the key name as the username and value as a JSON object with the password
    Accounts[username] = {password:hashedPassword};
    
    //hashes and creates a token with the json object username
    const token = jwt.sign({username:username}, process.env.TOKEN_SECRET)

    //clears the cookie
    res.clearCookie("authToken");
    //sets the cookie as the token with certain security parameters
    res.cookie("authToken", token, {maxAge:9000000, httpOnly: true})
    //sends the error and sends the token back
    res.send({error:false, message: token});
})
//listens for GET request
app.get("/api/user/logout", (req, res) =>
{
    //clears the cookie so if they try and go to a authenticated route they wont have the "wristband" to get in
    res.clearCookie("authToken"); 
    res.send({error:false}); 
})

app.post("/api/user/login", async(req, res) =>
{
    //reading the username and password the user put 
    const username = req.body.username;
    const password = req.body.password; 

    if(!Accounts[username]) return res.status(400).send({error:true, message:"Username or password incorrect"});

    //compare hashed and unhashed password to see if the password is correct
    const validPass = await bcrypt.compare(password, Accounts[username].password);
    
    if(!validPass) return res.status(400).send({error:true, message:"Username or password incorrect"});

    const token = jwt.sign({username:username}, process.env.TOKEN_SECRET)
    res.clearCookie("authToken");
    res.cookie("authToken", token, {maxAge:9000000, httpOnly: true})
    res.send({error:false, message: token});
})

app.listen(3000, () => console.log("Server up "))

//first middleware
req.x = 5
next()
//second middleware
console.log(req.x)
req.x += 6

//third middleware
console.log(req.x)