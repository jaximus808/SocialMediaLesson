const express = require("express")
const app = express();
const path = require("path")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")


require("dotenv").config(); 

app.use(cookieParser())
app.use(express.json())

const Accounts = {}

app.get("/", (req, res) =>
{
    res.sendFile(path.join(__dirname, "public","index.html") )
})

const TokenCheck = (req, res, next) =>
{
    const token = req.cookies.authToken; 
    if(!token) res.send("error! You aren't logged in!");
    try
    {
        verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next(); 
    }
    catch(err)
    {
        res.send("error! You aren't logged in!")
    }
}

app.get("/homepage", TokenCheck, (req, res) =>
{
    res.sendFile(path.join(__dirname, "public", "authHomepage.html"))
})

app.get("/logout", (req, res) =>
{
    req.clearCookie("authToken"); 
})

app.post("/api/user/register", async (req, res) =>
{
    const username = req.body.username; 
    const password = req.body.password; 

    if(password.length < 4) return res.status(400).send({error:true, message:"make a better password"}) 
    
   
    if(Accounts[username]) return res.status(400).send({error:true, message:"this account name is taken"})

    const hashedPassword = await bcrypt.hash(password, 10)

    Accounts[username] = {password:hashedPassword};
    

    const token = jwt.sign({username:username}, process.env.TOKEN_SECRET)
    res.clearCookie("authToken");
    res.cookie("authToken", token, {maxAge:9000000, httpOnly: true})
    res.send({error:false, message: token});
})

app.get("/api/user/logout", (req, res) =>
{
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