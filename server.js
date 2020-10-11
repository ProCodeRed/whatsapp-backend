import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'


// app configuration
const app = express();
const port = process.env.PORT || 9000;

// making mongoDb realtime using pusher
const pusher = new Pusher({
    appId: '1088273',
    key: 'bdec0603ddd8de98a11c',
    secret: '7306ca056cfe49238480',
    cluster: 'ap2',
    encrypted: true
});

const db = mongoose.connection
db.once("open", () => {
    console.log("db is connected")
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();
    changeStream.on('change', (change) => {
        console.log('there is change in msgs', change)

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
            })
        }else{
            console.log('Error triggering Pusher')
        }
    })
})

// middleware
app.use(express.json())
app.use(cors())
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*")
//     res.setHeader("Access-Control-Allow-Headers", "*")
//     next();
// })

// db configuration
const connection_url = 'mongodb+srv://vipin:vipinwhatsapp@cluster0.fpnyh.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
    useCreateIndex:true, 
    useNewUrlParser:true, 
    useUnifiedTopology:true
})



// ???


// api routes
app.get('/', (req, res) => {
    res.status(200).send('hello world')
})

// api for getting all data that is in database
app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body
    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
})


// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));