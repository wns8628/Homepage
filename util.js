// util.js


var util = {};


// mongoose에서 내는 에러와 mongoDB에서 내는 에러의 형태가 다르기 때문에 이 함수를 통해 에러의 형태를
// { 항목이름: { message: "에러메세지" } 로 통일시켜주는 함수입니다.
// Functions
util.parseError = function(errors){
 var parsed = {};
 if(errors.name == 'ValidationError'){
  for(var name in errors.errors){
   var validationError = errors.errors[name];
   parsed[name] = { message:validationError.message };
   // console.log(parsed[name]);
  }
 } else if(errors.code == "11000" && errors.errmsg.indexOf("username") > 0) {
  parsed.username = { message:"아이디가 이미 존재합니다."};
 } else {
  parsed.unhandled = JSON.stringify(errors);
 }
 return parsed;
}


// functions
util.getDate = function(dateObj){
 if(dateObj instanceof Date)
  return dateObj.getFullYear() + "-" + get2digits(dateObj.getMonth()+1)+ "-" + get2digits(dateObj.getDate());
}

util.getTime = function(dateObj){
 if(dateObj instanceof Date)
  return get2digits(dateObj.getHours()) + ":" + get2digits(dateObj.getMinutes())+ ":" + get2digits(dateObj.getSeconds());
}

module.exports = util;

// private functions
function get2digits (num){
 return ("0" + num).slice(-2);
}


//접근제한위해
util.isLoggedin = function(req, res, next){
 if(req.isAuthenticated()){
  next();
 } else {
  req.flash("errors", {login:"로그인을 먼저 해주십시오"});
  res.redirect("/login");
 }
}

util.noPermission = function(req, res){
 req.flash("errors", {login:"권한이 없습니다."});
 res.redirect("/");
    // req.logout();
}



//제목 본문검색과 게시판나누기 위해
util.createSearch = function(queries){

  var findPost = {};

  if(queries.group == 1){
    findPost = { typePost:1 }
  }else if(queries.group == 2){
    findPost = { typePost:2 }
  }else if(queries.group == 3){
    findPost = { typePost:3 }
  }

  if(queries.searchType && queries.searchText && queries.searchText.length >= 2){
    var searchTypes = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    if(searchTypes.indexOf("title")>=0){
      postQueries.push({ title : { $regex : new RegExp(queries.searchText, "i") } });
    }
    if(searchTypes.indexOf("body")>=0){
      postQueries.push({ body : { $regex : new RegExp(queries.searchText, "i") } });
    }
    if(postQueries.length > 0) findPost = {$or:postQueries};
  }
  return { searchType:queries.searchType, searchText:queries.searchText,
    findPost:findPost};
}


//메인페이지 공지사항등 나누기위해사용
util.Splitmainboard = function(posts_sub , BoardNumber){

      var tp1 = new Array();
      var j = 0;
      for(var i=0; i < posts_sub.length ; i++){
        if(posts_sub[i].typePost==BoardNumber){
         tp1[j] = posts_sub[i];
         j++;
       }
      }
      var limit_8 = 8;
      var tp1_8 = new Array();
      for(var i = 0; i < limit_8; i++){
         if(tp1[i]){
         tp1_8[i] = tp1[i];
        }
      }
      return tp1_8;
}

util.BoardTextCount = function(posts_sub , BoardNumber){

      var tp1 = new Array();
      var j = 0;
      for(var i=0; i < posts_sub.length ; i++){
        if(posts_sub[i].typePost==BoardNumber){
         tp1[j] = posts_sub[i];
         j++;
       }
      }
      return tp1;
}
