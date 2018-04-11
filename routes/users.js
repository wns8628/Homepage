//users 라우터
var express = require("express");
var router = express.Router();
var User  = require("../models/User");
var util  = require("../util"); // 1

//유저목록 라우터 index
router.get("/", function(req,res){ //  users로 들어왔을떄
  User.find({}) //원래 콜백나와야하는데 소트해야되서 이렇게하고 소트한다음에 콜백부를려면 exec써서 와야함
  .sort({username:1}) //오름차순?
  .exec(function(err,users){
    if(err) return res.json(err);
    res.render("users/index", {users:users});
  });
});

//New
router.get("/new",function(req,res){
  var user = req.flash("user")[0] || {};   //플래시는 배열이오게되는데 값이 하나이상있으면 무조건에러잔아 그러니걍 [0] 으로취급
  var errors = req.flash("errors")[0] || {}; // 처음들어왔을떄는 빈오브젝트 를 넣는거임 ||이걸이용해서
  res.render("users/new",{ user : user , errors : errors });
});

// create
router.post("/", function(req, res){
 User.create(req.body, function(err, user){
  if(err){
    // console.log("에러유형 : "+ err.message);
    req.flash("user", req.body);                //폼에 딱적고 전송눌럿는데 여러가지 검사에의해 전송되지못하고 에러가 떳다. 그떄
    req.flash("errors", util.parseError(err));  //이 플래시를 생성해준다 ㅇㅋ ?
    return res.redirect("/users/new");   //에러발생시 그페이지에 표시할거니깐 그페이지로 리다이렉트시킨다.
    // return res.json(err);
 }
  res.redirect("/users");
 });
});

// show
router.get("/:username", util.isLoggedin, checkPermission, function(req, res){
 User.findOne({username:req.params.username}, function(err, user){
  if(err) return res.json(err);
  res.render("users/show", {user:user});
 });
});

// edit
router.get("/:username/edit", util.isLoggedin, checkPermission, function(req, res){
 var user = req.flash("user")[0];
 var errors = req.flash("errors")[0] || {};
 if(!user){
   User.findOne({username:req.params.username}, function(err, user){
   if(err) return res.json(err);
    res.render("users/edit", { username:req.params.username, user:user, errors:errors }); //빈오브젝트겟지에러는?
  });
} else { //에러발생시 다시 일로돌아오잔아
   res.render("users/edit", { username:req.params.username, user:user, errors:errors });
 }                        //유저네임을 넣어주는이유는 user.username은 수정한값이잇으면 그걸보여주는데
});                        //에러기때문에 전송이안되니깐 url과 폼에보내는것은 수정전값으로 고정이되야하니깐 따로주는거네

//-----------------------
// update //
router.put("/:username", util.isLoggedin, checkPermission ,function(req, res, next){
 User.findOne({username:req.params.username}) //
 .select("password") //
 .exec(function(err, user){ //하나 찾았다! 업뎃할꺼 그게 user 이다 ㅇㅋ?
  if(err) return res.json(err);


  //originalPassword에 DB에서 가져온 password를 담아놓는 부분입니다
  user.originalPassword = user.password;
  // 왜냐하면, user 수정 form에서 newPassword가 있으면 password에는 newPassword가 들어가기때문에
  // 원래 비밀번호를 따로 담아 놔야 currentPassword와 값이 일치하는지
  //비교할 수 있기 때문입니다.

  //                  ↓  이게값이있으면        ↓이걸반환           ↓없으면이거
  user.password = req.body.newPassword? req.body.newPassword : user.password; // 2-3

  for(var p in req.body){ // 2-4 폼에값으로 덮어씌우는작업임
   user[p] = req.body[p];
  }
  // save updated user
  user.save(function(err, user){
   if(err){
    req.flash("user", req.body);
    req.flash("errors", util.parseError(err));
    return res.redirect("/users/"+req.params.username+"/edit");
   }
   res.redirect("/users/"+user.username); //아디바꾼경우 일로 리다이렉트시켜야하니깐
  });

 });
});

module.exports = router;


// private functions // 2
function checkPermission(req, res, next){
 User.findOne({username:req.params.username}, function(err, user){
  if(err) return res.json(err);
  if((user.id != req.user.id) && req.user.admin == 'false') return util.noPermission(req, res);
  next();
 });
}
