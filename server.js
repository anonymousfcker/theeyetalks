const express=require('express')
const app=express()
const bodyparser=require("body-parser")
app.use(express.json())
app.use(bodyparser.json())
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


const http=require('http').Server(app)
const io=require('socket.io')(http)
const mongoose=require('mongoose')

const path=require('path')
require('dotenv').config()
const PORT=process.env.PORT || 5000
//---------------------------deployment stuff-----------------------------
_dirname=path.resolve()
app.get('/',(req,res)=>{

	res.sendFile(__dirname+'/index.html')

})

const DBURL="mongodb+srv://sonata:sonata8008@cluster0.hh7p3lt.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(DBURL,{
	useNewUrlParser:true,
	useUnifiedTopology:true
})
mongoose.connection.on('connected',()=>{
	console.log("connected to db")
})

require('./Userschema.js')
require('./Messageschema.js')
const User=mongoose.model("USER")
const Message=mongoose.model("MESSAGE")
app.post('/signup',(req,res)=>{
const{name}=req.body
User.findOne({name:name})
	.then(useru=>{
		if(useru){
			return res.json({"error":"ue"})
		}
		const user=new User({
			name,
		})
		user.save()
		res.json({"message":"success!","id":user._id,"name":name})
	})



})
app.get('/users',(req,res)=>{
	let u=[]
	User.find()

	.then(users=>{

		for(let i=0;i<users.length;i++){
			u.push(users[i].name)
		}
		res.json(u)
		
	})
})

app.post('/checkforuser',(req,res)=>{
	User.findById(req.body.id)
	.then(user=>{
		if(user.name=="thecreator"){
			return res.json({"success":"yo"})
		}else{
			return res.json({"f":"f"})
		}
	})
})
let current_users=[];
function getuser(to){
	tou=current_users.find(user=>user.name===to)
	console.log("lalalalal"+tou)
	return tou
}

app.post('/prevmsgs',(req,res)=>{
	const user1=req.body.user1
	const user2=req.body.user2
	console.log("body: : : :   ")
	console.log(req.body)
	console.log("user2 : ")
	console.log(user2)
	User.findOne({name:user1})
	.then(userby=>{
		console.log("*********")
		console.log(userby)
		User.findOne({name:user2})
		.then(userto=>{
			console.log(userto)
			Message.find({$or:[{by:userby._id,to:userto._id},{by:userto._id,to:userby._id}]}).populate("by","name")
			.then(msgs=>{
				return res.json(msgs)
			})
			
		})

	})

	
})



function save_to_db(msg){
	User.findOne({name:msg.by})
	.then(userby=>{
		User.findOne({name:msg.to})
		.then(userto=>{
			const mesg=new Message({
				by:userby._id,
				to:userto._id,
				msg:msg.msg,
				at:msg.at
			})
			mesg.save()
		})

	})
}

function add_user(name,sockid){

	let cuser={
		
		sockid,
		name,
		opened:"thecreator"

	}
	!current_users.some(user=>user.sockid===sockid) && current_users.push(cuser)
}
function add_creator(name,sockid,opened){

	let cuser={
		
		sockid,
		name,
		opened

	}
	!current_users.some(user=>user.sockid===sockid) && current_users.push(cuser)
}
function pull_user(sockid){
	current_users= current_users.filter(user=>user.sockid!=sockid)
}

function getuserbysid(sockid){
	person=current_users.find(user=>user.sockid===sockid)
	return person
}
io.on('connection',(socket)=>{


	socket.on('message',(message)=>{
		d = new Date();
		utc = d.getTime() + (d.getTimezoneOffset() * 60000);
		nd = new Date(utc + (3600000*+5.5));
		let ist =  nd.toLocaleString();
		msg={
			to:message.to,
			by:message.by,
			msg:message.msg,
			at:ist
			
		}
		let tou=getuser(message.to)

		if(tou.opened===msg.by){
		io.to(tou.sockid).emit("message",msg)
	}
	save_to_db(msg)

		

	})
	socket.on('join',(name)=>{
		add_user(name,socket.id,)
		console.log("heyyyyy")
		let z=getuser("thecreator")

		if(z){
		io.to(socket.id).emit("status","online")
		console.log(z)
		console.log(z.opened)
		console.log(name)
		console.log(z.opened==name)
		if(z.opened==name){
			io.to(z.sockid).emit("status","online")
		}

	}
	else{
		io.to(socket.id).emit("status","offline")
		console.log("baby")
	}



	})
	socket.on('creatorjoined',(info)=>{
		add_creator(info.name,socket.id,info.to)
		console.log(current_users)
		if(getuser(info.to)){
			let h=getuser(info.to)
			io.to(socket.id).emit("status","online")
			io.to(h.sockid).emit("status","online")
			console.log("online")
		}else{
			io.to(socket.id).emit("status","offline")
			
		}
	})
	

	socket.on('disconnect',()=>{
		let person=getuserbysid(socket.id)
		if(person){
		let a=getuser(person.opened)
		
		if(a && a.opened==person.name){
		io.to(a.sockid).emit("status","offline")
	}
}
	

		pull_user(socket.id)


	})


})


http.listen(PORT,()=>{
console.log("server is running")

})
