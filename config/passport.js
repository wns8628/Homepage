// config/passport.js
// 1.로그인 버튼이 클릭되면 routes/home.js의 post /login route의 코드가 실행됩니다.
// 2.다음으로 config/passport.js의 local-strategy의 코드가 실행됩니다.
// 3.로그인이 성공하면 config/passport.js의 serialize코드가 실행됩니다.
// 4.마지막으로 routes/home.js의 post /login route의 successRedirect의 route으로 redirect가 됩니다.
// 5.로그인이 된 이후에는 모든 신호가 config/passport.js의 deserialize코드를 거치게 됩니다.

var passport   = require("passport"); //여기서 패스포트를 가져온다.
var LocalStrategy = require("passport-local").Strategy; // 1 strategy들은 거의 대부분이 require다음에 .Strategy가 붙습니다
var User     = require("../models/User");

// serialize & deserialize User // 2
passport.serializeUser(function(user, done) { //디비에서 발견한 유저를 어떻게 세션에 저장할지정한다
 done(null, user.id);
});
passport.deserializeUser(function(id, done) { // request시에 session에서 어떻게 user object를 만들지를 정하는 부분입니다.
  User.findOne({_id:id}, function(err, user) {
  done(err, user);
 });
});

// local strategy // 3
passport.use("local-login",  //로컬스트레티지설정부분 로컬사용한다고 정의하고
 new LocalStrategy({
   usernameField : "username", // 3-1
   passwordField : "password", // 3-1
   passReqToCallback : true
  },
  function(req, username, password, done) { //로그인 시에 이 함수가 호출됩니다
   User.findOne({username:username})
   .select({password:1})
   .exec(function(err, user) {
    if (err) return done(err);

    if (user && user.authenticate(password)){ // 3-3
     return done(null, user);
    } else {
     req.flash("username", username);
     req.flash("errors", {login:"비밀번호가 틀렸습니다."});
     return done(null, false);
    }
   });
  }
 )
);

module.exports = passport;
