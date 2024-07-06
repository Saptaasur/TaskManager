const express = require('express')
const app = express()
require('colors')


const { mongoose } = require('./db/mongoose');

const { List,Task,User } = require('./db/models');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');



app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});

let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // verify the JWT
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            // there was an error
            // jwt is invalid - * DO NOT AUTHENTICATE *
            res.status(401).send(err);
        } else {
            // jwt is valid
            req.user_id = decoded._id;
            next();
        }
    });
}

// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

    // grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }


        

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            
            next();
        } else {
            
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}

app.get('/lists',authenticate, (req, res) => {
    List.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists);
    }).catch((e) => {
        res.send(e);
    });
})

app.post('/lists',authenticate,  (req, res) => {
    let title = req.body.title;

    let newList = new List({
        title,
        _userId: req.user_id
    });
    newList.save().then((listDoc) => {
        res.send(listDoc);
    })
});
app.patch('/lists/:id',authenticate, (req, res) => {
    List.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id }, {
        $set: req.body
    }).then(() => {
        res.send({ 'message': 'Updated successfully'});
    });
});


app.delete('/lists/:id',authenticate, async (req, res) => {
    List.findOneAndDelete({
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedListDoc) => {
        res.send(removedListDoc);

        // delete all the tasks that are in the deleted list
        deleteTasksFromList(removedListDoc._id);
    })
});
let deleteTasksFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then(() => {
        console.log("Tasks from " + _listId + " were deleted!");
    })
}

app.get('/lists/:listId/tasks',authenticate, (req, res) => {
    Task.find({
        _listId: req.params.listId
    }).then((tasks) => {
        res.send(tasks);
    })
});

app.post('/lists/:listId/tasks',authenticate, (req, res) => {

    let newTask = new Task({
    title: req.body.title,
     _listId: req.params.listId
    });
     newTask.save().then((newTaskDoc) => {
        res.send(newTaskDoc);
    })
        
})
app.patch('/lists/:listId/tasks/:taskId',authenticate, (req,res)=>{
    Task.findOneAndUpdate({_id:req.params.taskId, _listId: req.params.listId},{
        $set:req.body
    }).then(()=>{
        res.send({message:"Updated Successfully"})
    })
})
app.delete('/lists/:listId/tasks/:taskId',authenticate, (req,res)=>{
    Task.findOneAndDelete({_id:req.params.taskId, _listId: req.params.listId}).then((removedTaskDoc)=>{
        res.send(removedTaskDoc)
    })
})
app.post('/users', (req, res) => {
    

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        

        return newUser.generateAccessAuthToken().then((accessToken) => {
            
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})




app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            

            return user.generateAccessAuthToken().then((accessToken) => {
                
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})
app.get('/users/me/access-token', verifySession, (req, res) => {
    // we know that the user/caller is authenticated and we have the user_id and user object available to us
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})


app.listen(3000,() =>{
    console.log("Server is running at port 3000".inverse.yellow)
})