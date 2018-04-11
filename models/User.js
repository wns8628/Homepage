// models/User.js
var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs"); //비밀번호를 암호화하기위해 해쉬할려고 씀

// schema //
var userSchema = mongoose.Schema({
 username:{
   type:String,
   required:[true,"아이디가 필요합니다."],     // ↓ match: [/정규표현식/,"에러메세지"]
   match:[/^.{4,12}$/,"아이디는 4~12글자만 사용할 수 있습니다."], //match는 regex(Regular Expression, 정규표현식)를 사용해서 문자열을 검사하는 내용입니다.
   trim:true,   // trim은 문자열 앞뒤에 빈칸이 있는 경우 빈칸을 제거해 주는 옵션입니다
   unique:true
  },
 password:{ //패스워드는 중요하니깐 밑에서 따로처리함 정규식을
   type:String,
   required:[true,"비밀번호가 필요합니다."],
   select:false  //select false 하면 값을 읽어오라고할때만 읽어온다. ㅇㅋ ?
  },
 name:{
   type:String,
   required:[true,"닉네임이 필요합니다."],
   match:[/^.{4,12}$/,"닉네임은 4~12글자만 사용할 수 있습니다."], // 1-2
   trim:true
  },
 email:{
   type:String,
   match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,"이메일 형식이 아닙니다."], // 1-3
   trim:true // 1-1
 },
 admin:{ //관리자계정만들기~
   type:String,
   default : false,
 },
},{
 toObject:{virtuals:true}
});


// virtuals // 2 가상항목.
userSchema.virtual("passwordConfirmation") //passwordConfirmation= 비밀번호확인칸임
.get(function(){ return this._passwordConfirmation; })
.set(function(value){ this._passwordConfirmation=value; });

userSchema.virtual("originalPassword")
.get(function(){ return this._originalPassword; })
.set(function(value){ this._originalPassword=value; });

userSchema.virtual("currentPassword") //현재 비밀번호
.get(function(){ return this._currentPassword; })
.set(function(value){ this._currentPassword=value; });

userSchema.virtual("newPassword")
.get(function(){ return this._newPassword; })
.set(function(value){ this._newPassword=value; });

///////////////////////////

// password validation //
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/; // 8-16자리 문자열 중에 숫자랑 영문자가 반드시 하나 이상 존재해야 한다는 뜻의 regex입니다.
var passwordRegexErrorMessage = "8글자이상 알파벳,숫자 혼합하여 비밀번호를 생성하십시오"; // 에러메세지가 반복되므로 변수로 선언하였습니다.

// password validation // 3 //디비 정보생성 전 값이 유효한지 확인
userSchema.path("password").validate(function(v) { //패스워드에서 확인 패스워드항목에서 사용자지정함수로확인
 var user = this; // 3-1 //this는 유저모델임

 // create user // 3-3
 if(user.isNew){ // 3-2   //model.isNew 가 true면 새로생긴 모델이고 false면 디비에서읽어온거지 즉, 회원정보를 수정하는 경우입니다
  if(!user.passwordConfirmation){
   user.invalidate("passwordConfirmation", "비밀번호 확인 필요!");
  }
  if(!passwordRegex.test(user.password)){
    user.invalidate("password", passwordRegexErrorMessage);
  } else if(user.password !== user.passwordConfirmation) {
   user.invalidate("passwordConfirmation", "비밀번호 확인이 일치하지 않습니다!");
  }
} //이거는 생성하기때문에 그냥 그 문자그대로 비교를하는거잔아  ㅇㅋ ?

 // update user // 3-4
 if(!user.isNew){
  if(!user.currentPassword){
   user.invalidate("currentPassword", "현재비밀번호가 필요합니다.");                              //현재비번없으면
  }
 if(user.currentPassword && !bcrypt.compareSync(user.currentPassword, user.originalPassword)){ //현재비번적었는데 틀렸을때
   user.invalidate("currentPassword", "현재비밀번호가 유효하지 않습니다!");
  }
  if(user.newPassword && !passwordRegex.test(user.newPassword)){ //새비밀번호적었고 새비밀번호유효성검사해서 통과못함
     user.invalidate("newPassword", passwordRegexErrorMessage); // 이거발생
  } else if(user.newPassword !== user.passwordConfirmation) {  //이것도 새거 즉 그냥 문자만비교하는거다.
   user.invalidate("passwordConfirmation", "새비밀번호 확인이 일치하지 않습니다.");
  }
 }
});

// hash password // 3
// Schema.pre 함수는 첫번째 파라미터로 설정된 event가 일어나기 전(pre)에 먼저 callback 함수를 실행시킵니다.
// "save" event는 Model.create, model.save 함수 실행시 발생하는 event입니다.
// 즉 유저를 생성하거나 수정하고 세이브실행할때 콜백함수가 먼저호출
userSchema.pre("save", function (next){
 var user = this;
 if(!user.isModified("password")){ // 3-1 //이전 db에 기록된값과 비교해서 변경된경우 true 변경이안된경우 false  //즉 처음생성시는 무조건 트루겠지?
  return next(); //변경이안되면 이거 해쉬를다시만들필요없지
 } else {
  user.password = bcrypt.hashSync(user.password); // 3-2 **이게중요 비밀번호를 해쉬함수돌려서 비번에 넣어준다 ㅇㅋ ?
  return next();
 }
});

// model methods // 4
//  user model의 password hash와 입력받은 password text를 비교하는 method를 추가합니다.
// 이번 예제에 사용되는 method는 아니고 나중에 로그인을 만들때 될 method인데 bcrypt를 사용하므로 지금 추가해봤습니다.
userSchema.methods.authenticate = function (password) {
 var user = this;
 return bcrypt.compareSync(password,user.password); //이거 비교한거지? 위에서썻잔아
};


// model & export
var User = mongoose.model("user",userSchema);
module.exports = User;
