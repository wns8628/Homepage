
var mongoose = require("mongoose");
var util  = require("../util"); // 1


var commentSchema = mongoose.Schema({
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:"user", required:true},
  createdAt: {type:Date, default:Date.now}
},{
  toObject:{virtuals:true}
});

//댓글위해
commentSchema.virtual("c_createdDate")
.get(function(){
 return util.getDate(this.createdAt);
});
commentSchema.virtual("c_createdTime")
.get(function(){
 return util.getTime(this.createdAt);
});
//---------------------------

// model & export
var Comment = mongoose.model("comment",commentSchema);
module.exports = Comment;
