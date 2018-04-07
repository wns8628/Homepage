//디비스키마

var mongoose = require("mongoose");
var util  = require("../util"); // 1

var postSchema = mongoose.Schema({
  numId: {type:Number, require:true},
  views:{type:Number, default: 0},
  title:{type:String, required:[true, "제목을 적어주세요"]},
  body:{type:String, required: [true, "본문을 적어주세요"]},
  author:{type:mongoose.Schema.Types.ObjectId, ref:"user", required:true}, //관계를위해 user의 아디를저장한다라고 보인다
  createdAt:{type:Date, default:Date.now}, // 2
  updatedAt:{type:Date},
  typePost : {type:Number, required:[true, "게시판을 선택하세요"] },
  comment : [{type:mongoose.Schema.Types.ObjectId, ref:"comment"}],
},{
  toObject:{virtuals:true} //데이터로서 사용하게 될 때 사용될 옵션들을 넣는 부분입니다
});

//버츄얼 가상 ?
postSchema.virtual("createdDate")
.get(function(){
 return util.getDate(this.createdAt);
});

postSchema.virtual("createdTime")
.get(function(){
 return util.getTime(this.createdAt);
});

postSchema.virtual("updatedDate")
.get(function(){
 return util.getDate(this.updatedAt);
});

postSchema.virtual("updatedTime")
.get(function(){
 return util.getTime(this.updatedAt);
});



// model & export
var Post = mongoose.model("post",postSchema);
module.exports = Post;
