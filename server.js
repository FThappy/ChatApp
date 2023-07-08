const express = require('express')
const app = express();

const userRoutes = require('./routes/userRoutes')
const User = require('./models/User')
const Message = require('./models/Message')
const rooms = ['general','tech','finance','crypto'];

const cors = require('cors');
const Room = require('./models/Room');
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());

app.use('/users', userRoutes)

require('./connection')

const server = require('http').createServer(app);
const PORT = 5001;
const io = require('socket.io')(server,{
    cors:{
        origin:'http://localhost:3000',
        methods:['GET','POST']
    }
})
app.post("/rooms", async (req, res) => {
  try {
    const { name,quantity } = req.body;
    console.log(req.body);
    const room = await Room.create({ name, quantity });
    res.status(201).json(room);
  } catch (e) {
    let mesage;
    if (e.code === 11000) {
      mesage = "User already exists";
    } else {
      mesage = e.message;
    }
    console.log(e);
    res.status(400).json(mesage);
  }
});
app.get("/rooms", async (req, res) => {
  try {
    const room = await Room.find();
    res.status(200).json(room);
  } catch (e) {
    res.status(400).json(e.message);
  }
});
// app.get('/rooms', (req, res)=> {
//   res.json(rooms)
// })


async function getLastMessagesFromRoom(room){
    let roomMessages = await Message.aggregate([
      { $match: { to: room } },
      {
        $group: {
          _id: "$date",
          messagesByDate: { $push: "$$ROOT" },
        },
      },
    ]);
    return roomMessages;
}

function sortRoomMessagesByDate(messages) {
  if (!Array.isArray(messages)) {
    return []; // hoặc xử lý lỗi khác tùy theo yêu cầu của bạn
  }

  return messages.sort(function (a, b) {
    let date1 = a._id.split("/");
    let date2 = b._id.split("/");

    date1 = date1[2] + date1[0] + date1[1];
    date2 = date2[2] + date2[0] + date2[1];

    return date1 < date2 ? -1 : 1;
  });
}

io.on('connection',(socket)=>{

    socket.on('new-user',async()=>{
        const members = await User.find();
        io.emit('new-user',members)
    })

    socket.on('join-room',async(room,previousRoom)=>{
        socket.join(room);
        socket.leave(previousRoom)
        let roomMessages = await getLastMessagesFromRoom(room);
        roomMessages = sortRoomMessagesByDate(roomMessages);
        socket.emit('room-messages',roomMessages)
    })
    socket.on('message-room',async(room,content,sender,time,date)=>{
        const newMessage = await Message.create({content,from : sender,time,date,to:room})
        let roomMessages = await getLastMessagesFromRoom(room);
        roomMessages = sortRoomMessagesByDate(roomMessages)
        io.to(room).emit('room-messages',roomMessages);
        
        socket.broadcast.emit('notifications',room)
    })

    app.delete('/logout',async(req,res)=>{
        try{
            const{_id,newMessages} = req.body;
            const user = await User.findById(_id);
            user.newMessages = newMessages;
            user.status = 'offline'
            await user.save();
            const members = await User.find();
            socket.broadcast.emit('new-user',members);
            res.status(200).send();
        } catch(e){
            console.log(e);
            res.status(400).send
        }
    })
})

server.listen(PORT,()=>{
    console.log('listening to port',PORT)
})