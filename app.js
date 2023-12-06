const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const secretKey = "secretKey";

const app = express();

app.use(bodyParser.urlencoded({extended: true}));    //set up a bodyParser middleware

mongoose.connect("mongodb://127.0.0.1:27017/task1DB", { useNewUrlParser: true});

const userSchema = new mongoose.Schema({

    name: String,
    email: String,
    status: String,
    password: String
});

const blogSchema = new mongoose.Schema({
    title: String,
    body: String,
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "USER"
    }

});


const BLOG = mongoose.model("post",blogSchema);    //BLOG model

const USER = mongoose.model("user", userSchema);   //USER model


// user login

app.post("/login",  (req,res) => {


    const {email , password} = req.body;

    // console.log(email);

    USER.findOne({email})
        .then((result) => {
            // console.log("Result: " + result)
            // console.log(result.userId);
            if(result)
            {
                if(result.password === password)
                {
                    console.log(result._id);
                    console.log(result._id.toString());
                    jwt.sign({
                        userId: result._id.toString()
                    }, secretKey, { expiresIn: '600s' }, (err,token) => {
                        res.json(token)
                    })
                }

            }

        })
        .catch((err) => console.log(err))


})

// user signUp

app.post("/createUser" , (req,res) => {

    const newUser = new USER({
        name: req.body.name,
        email: req.body.email,
        status: req.body.status,
        password: req.body.password
    })

    newUser.save()
        .then((user) => {
            console.log("Successfully saved a new post !!")
            res.status(201).json(user)
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({err: "Failed to save the user details !!"});
        })

});


// view Own Profile

app.post("/profile", verifyToken, (req,res) => {
    console.log(req.idOfUser.userId);

    const userId = req.idOfUser.userId;

    USER.findOne({_id: userId})
        .then((data) => {
            res.json(data);
        })
        .catch((err) => console.log(err))


})

// middleware which verify the jwt token and send the raw data to profile route
function verifyToken(req,res,next)
{
    const bearerHeader = req.headers['authentication'];

    if (bearerHeader !== undefined)
    {

        const bearer = bearerHeader.split(" ");    // split the token bcuz in 0th index bearer is present and in 2nd index token is present
        const token = bearer[1];
        jwt.verify(token, secretKey, (err, authData) => {           // verify the token
            if (err)
            {
                res.send({
                    result: "Invalid token"
                })
            }
            else {
                req.idOfUser = authData;
                next();
            }
        })

    }
    else {
        res.send({
            result: "Token is not valid"
        })
    }
}


// app.post("/createBlog", (req,res) => {
//
//
//
//     const newPost = new BLOG({
//
//           title: req.body.title,
//           body: req.body.body,
//           //userId:
//     });
//
//     newPost.save()
//       .then((posts) => {
//           console.log("Successfully saved a new post !!")
//           res.status(201).json(posts)
//       })
//       .catch((err) => {
//           console.log(err);
//           res.status(500).json({err: "Failed to save the post !!"});
//       })
// })

app.post("/createBlog", verifyToken, (req, res) => {
    const newPost = new BLOG({
        title: req.body.title,
        body: req.body.body,
        userId: req.idOfUser.userId // Assign the authenticated user's ID to the blog post
    });

    newPost.save()
        .then((posts) => {
            console.log("Successfully saved a new post!")
            res.status(201).json(posts)
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err: "Failed to save the post!" });
        })
})

app.get("/mypost", verifyToken, (req,res) => {

    const userId = req.idOfUser.userId;

    BLOG.find({userId: userId})
        .then((response) => {
            res.send(response);
        })
        .catch((err) => console.log(err))
})


// view all users profile

app.get("/allProfile", (req,res) => {
    USER.find()
        .then(allData => {
            res.send(allData)
        })
        .catch(err => {
            res.send(err)
        })
})

// view all users post

app.get("/allpost", (req,res) => {

    BLOG.find()
        .then((response) => {
            response.forEach((data)=> res.json(data))
        })
        .catch((err) => console.log(err))
})


app.listen(5000, () => console.log("Server is listening to port 5000"));

