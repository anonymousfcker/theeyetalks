const mongoose=require("mongoose")
const Schema=mongoose.Schema
const Messageschema=new mongoose.Schema({

	by:{
		type:Schema.Types.ObjectId,
		ref:"USER"

	},
	to:{
		type:Schema.Types.ObjectId,
		ref:"USER"
	},
	msg:{
	type:String,

	},
	at:{
		type:String
	}




})
module.exports=mongoose.model("MESSAGE",Messageschema)

