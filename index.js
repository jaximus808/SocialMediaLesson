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

//allows us to use mongoose schema and store data in mongodb
const User = require("./models/UserObject")
const Msg = require("./models/MsgObject");

//grabs our validation objects
const {registerValidation, loginValidation} = require("./validation")

//lets us use the mongoose library
const mongoose = require("mongoose")


//allows usuage of .env files, DO NOT USE LINE IN PRODUCTION
require("dotenv").config(); 

//using the cookieParser module as a middlewear function to parse cookies for us to use
app.use(cookieParser())
//using express's json middleware to parse req.body into a JSON object
app.use(express.json())

const max = 10; 

//Connects us to the mongoose database using DOT ENV mongoose link 
mongoose.connect(process.env.MONGO_CONNECT, {useNewUrlParser:true, useUnifiedTopology:true}, () =>
{
    //prints that we are connected
    console.log("connected to db!");
})



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
    //stores username, email, and password from the body sent from the user
    const username = req.body.username; 
    const email = req.body.email;
    const password = req.body.password; 

    //checks if the password is less than 4. if so send an error
    //if(password.length < 4) return res.status(400).send({error:true, message:"make a better password"}) 
    
    //Wraps the input data into json so our registration validation can read our data
    const data = 
    {
        username: username,
        email: email,
        password:password
    }

    //Checks to make sure the data is formatted correctly, sends an error other wise. Sends the error to the client
    const {error} = registerValidation(data)
    if(error) return res.status(400).send({error:true, message:error.details[0].message})

    //checks the emailExists by looking in the database with an existing email, sends email already exists to the client 
    const emailExists = await User.findOne({email: email})
    if(emailExists) return res.status(400).send({error:true, message:"email already exists!"})


    
    //checks to see if there is a already made account with the same username in the Accounts JSON object, if so send an error
    // if(Accounts[username]) return res.status(400).send({error:true, message:"this account name is taken"})

    //uses bcrypt to hash the password and store that in the hashedPassword variable
    const hashedPassword = await bcrypt.hash(password, 10)

    //creates a new JSON object with the key name as the username and value as a JSON object with the password
    // Accounts[username] = {password:hashedPassword};

    //Formatting the registration data for MongoDB
    const user = new User({
        username:username,
        email: email, 
        password:hashedPassword, 
        friendlist: JSON.stringify([])
    })

    try
    {
        //saves the user into the data base and returns the newly saved information. and makes a secret token from the ID 
        const savedUser = await user.save(); 
        const token = jwt.sign({_id:savedUser._id}, process.env.TOKEN_SECRET)

        //clears the cookie
        res.clearCookie("authToken");
        //sets the cookie as the token with certain security parameters
        res.cookie("authToken", token, {maxAge:9000000, httpOnly: true})
        //sends the error and sends the token back
        res.send({error:false, message: token});
    }
    catch (error){
        res.status(400).send({error:true, message:error.message})
    }
    //hashes and creates a token with the json object username
    
})
//listens for GET request
app.get("/api/user/logout", (req, res) =>
{
    //clears the cookie so if they try and go to a authenticated route they wont have the "wristband" to get in
    res.clearCookie("authToken"); 
    res.send({error:false}); 
})

//listens for a post request on the login route
app.post("/api/user/login", async(req, res) =>
{

    //Reads the email and password
    const email = req.body.email;
    const password = req.body.password; 

    //wraps the data into json and stores it into a variable named data 
    const data = 
    {
        email:email, 
        password: password,
    }

    //checks for an error in the data such as formatting and returns to the client the error
    const {error} = loginValidation(data);
    if(error) return res.status(400).send({error:true, message: error.details[0].message})

    //checks if the email exists in the database by looking in the data base for an account with that email. If there isn't an email return an error to the client 
    const emailExists = await User.findOne({email: email});
    if(!emailExists) return res.status(400).send({error:true, message:"Email or Password incorrect!"});

    //checks to see if the hashed password matches the inputted password
    const validPass = await bcrypt.compare(password, emailExists.password);
    

    //checks if the username exsits, if not send an error
    //if(!Accounts[username]) return res.status(400).send({error:true, message:"Username or password incorrect"});

    //checks if the given password matches the hashed password
    
    //if validPass is false (undefined) then it returns the error
    if(!validPass) return res.status(400).send({error:true, message:"Username or password incorrect"});

    //creates a token that stores the hashed username 
    const token = jwt.sign({_id:emailExists._id}, process.env.TOKEN_SECRET)
    
    //clears the cookie and sets the new token as the cookie with parameters
    res.clearCookie("authToken");
    res.cookie("authToken", token, {maxAge:9000000, httpOnly: true})
    
    //sends that there were no errors
    res.send({error:false, message: token});
})

app.get("/api/user/getUserDetails", TokenCheck, async (req, res)=>
{
    //req.user = {_id: budgiwq}
    //looks through the database for the user with their id and saves it in the varaible userInfo. If the user does not exist send an error to the client 
    const userInfo = await User.findById(req.user); 
    if(!userInfo) return res.status(400).send({error:true})

    //sends the user's information to the client so they can no
    res.send({error:false, username:userInfo.username, imageLink:userInfo.profilePicture} )
})

app.post("/api/message/postMessage", TokenCheck, async(req, res) =>
{   
    var msg = req.body.msg;
    if(msg.trim().length == 0) return res.status(200).send({error:true, msg:"must send a message"})


    const Message = new Msg(
        {
            ownerId: req.user._id,
            message: msg
        }
    )
    try
    {
        Message.save(); 
        res.send({error:false})
    }
    catch
    {
        res.send({error:true, msg:"FAIL"})
    }
})

app.get("/api/messages/getMessages", TokenCheck, async (req, res) =>
{
    //finds the userAccount by the token's id and returns the account's information
    const userAccount = await User.findById(req.user);
    //if cannot find the account send an error as userAccount is undefined 
    if(!userAccount) return res.status(400).send({error:true, message:"Your account does not exist?"})

    //makes the friends list variable and creates an array by parsing the string array into an actual array
    const friends = JSON.parse(userAccount.friendlist);
    //looks through the messages and finds which belongs to the userAccount
    const selfMessages = await Msg.find({ownerId: req.user});

    // const selfMessages = [
    //     {msg:"BALLS", date:200},
    //     {msg:"MEOW", date:232},
    //     {msg:"BARK", date:120},
    //     {msg:"CAR", date:320},
    //     {msg:"DOG", date:2310},
    //     {msg:"RAT", date:21},
    //     {msg:"SAT", date:2230},
    //     {msg:"WQGGQW", date:210},
    //     {msg:"PMG", date:260},
    //     {msg:"OMG", date:210},
    //     {msg:"WOW!", date:211},
    //     {msg:"BOOM", date:223},
    //     {msg:"ZOOM", date:212},
    // ]

    //if you have no friends and no messages then display nothing and saves processing power since nothing would return 
    if(friends.length == 0 && selfMessages.length == 0) return res.send({error:false, data:[]})

    //10 messages
    //if friends then creates three empty arrays
    //stores the literal messages to display
    let messages = []; 
    //stores when the messages were sent for the algorithm
    let dateMessage = []; 
    //who sent the messages 
    let userInfos = []; 

    //adds the first element to the array so it is not empty, we do this because if the array is empty the for loop has nothing to loop through.
    messages.push(selfMessages[0])
    
    var firstDate = selfMessages[0].date.getTime();

    dateMessage.push(firstDate)
    
    userInfos.push({
        username: userAccount.username,
        pfp: userAccount.profilePicture
    })

    //loops through the selfMessages array except for the first one
    for(let i = 1; i < selfMessages.length; i++)
    {
        //stores the ms from the starting date (Jan 1 1970) into the variable messageDate.
        var messageDate = selfMessages[i].date.getTime()

        //a condition where if the message datez is the least out of the current dates and the length is 
        //less than the max, add the message to the end. 
        if(dateMessage[dateMessage.length-1] >= messageDate && messages.length < max)
        {
            //pushes the information of the message, date, and user info into the messages array
            messages.push(selfMessages[i]); 
            dateMessage.push(messageDate);
            userInfos.push({
                username: userAccount.username,
                pfp: userAccount.profilePicture
            })
        }
        //checks if the date being check is more recent than the last date in the array. 
        //if true: run our sorting algorithm
        else if(dateMessage[dateMessage.length-1] < messageDate)
        {
            //It loops through all the elements in the messages array
            for(let y = 0; y < messages.length;y++)
            {
                //checks if the message is newer than the message at the y position in the messages array
                if(messageDate > dateMessage[y])
                {
                    //uses the message data and puts the new message into the messages array at the y position
                    //splice: inserts an element and moves everthing after it to the right
                    messages.splice(y, 0, selfMessages[i]);
                    dateMessage.splice(y, 0, messageDate);
                    userInfos.splice(y, 0, {
                        username: userAccount.username,
                        pfp: userAccount.profilePicture
                    }) 
                    //makes sure the messages is only added once to the array. It does this by stopping the for loop
                    break; 
                }
            }
            //if the messages length is greater than the max, then remove the last element in the array. 
            if(messages.length > max)
            {
                //splice(a, b) a = position, b = how much to delete from that position
                messages.splice(max,1)
                dateMessage.splice(max,1)
                userInfos.splice(max, 1)
            }
        }
    }
    console.log(messages)
    console.log(dateMessage)

    //sends to the client the messages to be show it on the webpage
    res.send({error:false, message:messages, userInfos: userInfos})
})

app.listen(3000, () => console.log("Server up "))
