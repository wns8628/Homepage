var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var flash     = require("connect-flash");     // 1
var session    = require("express-session");  // 1
var passport   = require("./config/passport"); //config/passport module를 passport 변수에 담았습니다
var cookieParser = require("cookie-parser"); //방문자카운터위해 쿠키씀
var Counter = require("./models/Counter"); //디비를왜 여기서가져오냐? 모든페이지에 보여줄 디비는 여기서 가져온다 알겠니
var app = express();


//디비세팅
mongoose.connect(process.env.V_MONGO_LAST, {useNewUrlParser : true});
mongoose.set('useCreateIndex', true);
var db = mongoose.connection;
db.once("open",function(){
  console.log("디비 연결됨!");
});
db.on("err",function(err){
  console.log("디비에러 : ", err);
});

//app.use에 있는 함수는 request가 올때마다 route에 상관없이 무조건 해당 함수가 실행됩니다.--------------위치도중요
// other 세팅
app.set("view engine", "ejs"); //뷰엔진 ejs를쓰겟다 근데이건 프론트엔드로바뀔거다..
app.use(express.static(__dirname+"/public")); //스태틱폴더세팅
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(methodOverride("_method"));//알지? http메소드
app.use(cookieParser());//방문자카운터위해 쿠키씀 cookie-parser는 미들웨어로 사용됩니다.
app.use(flash()); // 플래시초기화를 했다 이제 req.flash 함수 사용가능
app.use(session({secret:"MySecret"})); //session은 서버에서 접속자를 구분시키는 역할을 합니다
//** req.flash(문자열, 저장할_값),  불러오기 = req.flash(문자열)
app.use(countVisitors); //방문자카운터위해 쿠키씀
// countVisitors는 아래에 만들 함수입니다. 이 함수는 미들웨어로 웹사이트의 모든 요청이 이 함수를 지나가게 됩니다.
// 즉, 어떠한 페이지를 열더라도 카운팅이 됩니다.



// Passport // 2
app.use(passport.initialize()); //passport를 초기화 시켜주는 함수
app.use(passport.session()); // passport를 session과 연결해 주는 함수로 둘다 반드시 필요합니다

// Custom Middlewares // 3
app.use(function(req,res,next){ //  ↓ 로그인되있으면 true 리턴
 res.locals.isAuthenticated = req.isAuthenticated(); // res.locals에담겨진건 ejs에서 바로사용가능
 res.locals.currentUser = req.user;  // req.user는 로그인되는 세션으로부터 유저를 디시리얼라이즈하여 생성
 next();                             // 즉 currentuser는 로그인된 유저정보 가져옴
})

//nav페이지에 즉 모든페이지 보여주기위해서 여기서 미들웨어로 선언해서 넘겨준다.
app.use(function(req,res,next){
  Counter.findOne({name:"vistors"},function(err,counter){
   if(err) return res.json(err);
    res.locals.vistorCounter = counter;
    next();
  });
});

//사이트명바꿀떄이 변수를써라
app.use(function(req,res,next){
  res.locals.Site_name = "Sejun Website";
  next();
});

//라우터
app.use("/", require("./routes/home"));
app.use("/posts", require("./routes/posts"));
app.use("/users", require("./routes/users"));

//포트세팅
var port = process.env.PORT || 3000;
app.listen(port,function(){
  console.log("server on!");
});

//--------------------------------------------------------------
// 간략히 설명하면,
// 1. 'count'라는 쿠키값이 있으면 카운터 함수를 사용하지 않습니다. 이 쿠키는 1시간동안 브라우저에 저장됩니다. 처음 접속 후 1시간동안은 날짜 검사도 하지 않습니다.
// 2. 'connect.sid'는 express session id를 저장하는 쿠키값인데, 여기서는 브라우저가 쿠키사용 금지인지 아닌지 판단하는 용도로 쓰였습니다. 만약 단순히 쿠키값이 없는 경우 카운팅을 하게 되면 브라우저가 쿠키사용 금지인 경우 페이지를 열때마다 계속해서 카운터가 올라가게 됩니다.
// 3. 'count'가 없는 경우 오늘의 날짜를 구하고, 'countData'의 쿠키의 날짜값과 비교합니다.
// 4. 날짜값이 다른 경우 DB에 있는 visitors라는 데이터를 불러오는데, 이 데이터가 없는 경우에는 새로 생성합니다.
// 5. 이 데이터가 있는 경우 totalCount를 +1를 합니다. DB에 있는 날짜랑 오늘의 날짜를 비교해서 같은 경우 todayCount도 +1하고, 다른 경우는 날짜를 업데이트하고 todayCount를 1로 리셋합니다.
function countVisitors(req,res,next){
  if(!req.cookies.count&&req.cookies['connect.sid']){ //쿠키카운터가없다면
    res.cookie('count', "", { maxAge: 3600000, httpOnly: true }); //브라우저에 쿠키를만든다 이름은 카운터
    var now = new Date(); //날짜넣어
    var date = now.getFullYear() +"/"+ now.getMonth() +"/"+ now.getDate(); //날짜변수에 2018/8/1 이런식으로현재날짜넣어줌
    if(date != req.cookies.countDate){ //현재날짜와 쿠기데이터랑비교 다르면 //첨엔무조건다르겟지 없으니깐
      res.cookie('countDate', date, { maxAge: 86400000, httpOnly: true });

      var Counter = require('./models/Counter');
      Counter.findOne({name:"vistors"}, function (err,counter) {
        if(err) return next();
        if(counter===null){
          Counter.create({name:"vistors",totalCount:1,todayCount:1,date:date});
        } else {
          counter.totalCount++;
          if(counter.date == date){
            counter.todayCount++;
          } else {
            counter.todayCount = 1;
            counter.date = date;
          }
          counter.save();
        }
      });
    }
  }
  return next();
}
//-------------------------------------------------------------------------
