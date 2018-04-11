//routes/posts.js

var express = require("express");
var router = express.Router();
var Post = require("../models/Post");
var Comment = require("../models/Comment");
var Counter = require("../models/Counter");
var util  = require("../util");
var async = require('async');//비동기를동기로


//index 즉 posts로 들어온거임
router.get("/",function(req,res){

  var page = Math.max(1,req.query.page)>1?parseInt(req.query.page):1;
  var limit = Math.max(1,req.query.limit)>1?parseInt(req.query.limit):15;
  var search = util.createSearch(req.query);


  async.waterfall([function(callback){

    Post.find({})
     .populate(['author','comment'])
     .sort("-createdAt")
     .exec(function(err,posts_length){
       var Notice = util.BoardTextCount(posts_length,1);
       var Community = util.BoardTextCount(posts_length,2);
       var QnA = util.BoardTextCount(posts_length,3);
       if(err) return callback(err);
       callback(null, posts_length, Notice, Community, QnA);
     });
   },function(posts_length, Notice, Community, QnA, callback){
      Post.count(search.findPost,function(err,count){
      if(err) callback(err);
      var skip = (page-1)*limit;
      var maxPage = Math.ceil(count/limit); //페이지갯수가나오겠지
      callback(null, posts_length, Notice, Community, QnA, skip, maxPage);
    });
  },function(posts_length,Notice, Community, QnA, skip, maxPage, callback){
    Post.find(search.findPost)
    .populate(['author','comment']) //Model.populate()함수는 relationship이 형성되어 있는 항목의 값을 생성해 줍니다
    .sort("-createdAt")
    .skip(skip)
    .limit(limit)
    .exec(function(err,posts){
      if(err) return callback(err);
      res.render("posts/index", {posts:posts,
                                urlQuery:req._parsedUrl.query,
                                search:search ,
                                maxPage:maxPage ,
                                page:page,
                                posts_length : posts_length.length,
                                Notice_length : Notice.length,
                                Community_length : Community.length,
                                QnA_length : QnA.length,
                                });
    });
  }],function(err){
    if(err) return res.json(err);
  });
});

// New
router.get("/new", util.isLoggedin, function(req,res){

  Post.find({})
   .populate(['author','comment'])
   .sort("-createdAt")
   .exec(function(err,posts_length){
     var Notice = util.BoardTextCount(posts_length,1);
     var Community = util.BoardTextCount(posts_length,2);
     var QnA = util.BoardTextCount(posts_length,3);
     if(err) return callback(err);

     var post = req.flash("post")[0] || {};
     var errors = req.flash("errors")[0] || {};
     res.render("posts/new", { post:post,
                               errors:errors,
                               urlQuery:req._parsedUrl.query,
                               posts_length : posts_length.length,
                               Notice_length : Notice.length,
                               Community_length : Community.length,
                               QnA_length : QnA.length,
                              });
   });
});


router.post('/', util.isLoggedin, function(req,res){
  async.waterfall([function(callback){
    Counter.findOne({name:"posts"}, function (err,counter) {
      if(err) callback(err);
      if(counter){
         callback(null, counter);
      } else {
        Counter.create({name:"posts",totalCount:0},function(err,counter){
          if(err) return res.json({success:false, message:err});
          callback(null, counter);
        });
      }
    });
  }],function(callback, counter){
    var newPost = req.body;
    newPost.author = req.user._id;
    newPost.numId = counter.totalCount+1;
    Post.create(req.body ,function (err,post) {
      if(err){ //에러있으면 제이슨으로보내지말고 플래시를만들어서 넘겨준다 ㅇㅋ ?
        req.flash("post", req.body); //이걸하는이유는 리다이렉트되면 그대로적혀있도록
        req.flash("errors", util.parseError(err));
        return res.redirect("/posts/new");
      }
      counter.totalCount++;
      counter.save();
      res.redirect('/posts');
    });
  });
}); // create


// show
router.get("/:id", function(req, res){

async.waterfall([function(callback){

  Post.find({})
   .populate(['author','comment'])
   .sort("-createdAt")
   .exec(function(err,posts_length_show){
    var Notice = util.BoardTextCount(posts_length_show,1);
    var Community = util.BoardTextCount(posts_length_show,2);
    var QnA = util.BoardTextCount(posts_length_show,3);
    if(err) return callback(err);
     callback(null, posts_length_show, Notice, Community, QnA);
   });
},function(posts_length, Notice, Community, QnA, callback){

 Post.findOne({_id:req.params.id})
 .populate(['author','comment'])
 .exec(function(err, post){
  if(err) return res.json(err);
   post.views++; //조회수
   post.save();  //위해서 사용

  Comment.find({_id:post.comment})
  .populate(['author'])
  .exec(function(err, comments){
  if(err) return res.json(err);
  res.render("posts/show", {post:post,
                            comments:comments,
                            user:req.user,
                            urlQuery:req._parsedUrl.query,
                            posts_length : posts_length.length,
                            Notice_length : Notice.length,
                            Community_length : Community.length,
                            QnA_length : QnA.length,
                           });
    });
   });
  }],function(err){
    if(err) return res.json(err);
  });
});


// edit
router.get("/:id/edit", util.isLoggedin, checkPermission, function(req, res){
 var post = req.flash("post")[0];
 var errors = req.flash("errors")[0] || {};

if(!post){ //처음 에디트 오면 비어있지 업뎃도안햇으니 에러날게없잔아그래서 첨오면무조건이거

async.waterfall([function(callback){

  Post.find({})
   .populate(['author','comment'])
   .sort("-createdAt")
   .exec(function(err,posts_length){
     var Notice = util.BoardTextCount(posts_length,1);
     var Community = util.BoardTextCount(posts_length,2);
     var QnA = util.BoardTextCount(posts_length,3);
     if(err) return callback(err);
     callback(null, posts_length, Notice, Community, QnA);
   });

  },function(posts_length, Notice, Community, QnA, callback){

    Post.findOne({_id:req.params.id}, function(err, post){                           //그러니 그대로보여줌 일단
     if(err) return res.json(err);
     res.render("posts/edit", {post:post,
                               errors: errors,
                               urlQuery:req._parsedUrl.query,
                               posts_length : posts_length.length,
                               Notice_length : Notice.length,
                               Community_length : Community.length,
                               QnA_length : QnA.length,
                              });                        //  <div class="form-group <%= (errors.title)?'has-error':'' %>"> 이거때문에 안써도 넣어준다.
   });
 }],function(err){
   if(err) return res.json(err);
 });

 }else{                                                                              //업데이트했을때 에러가 발생했다! 포스트플래시가 있겠지그면

   Post.find({})
    .populate(['author','comment'])
    .sort("-createdAt")
    .exec(function(err,posts_length){
       Notice = util.BoardTextCount(posts_length,1);
       Community = util.BoardTextCount(posts_length,2);
       QnA = util.BoardTextCount(posts_length,3);
       // posts_length = posts_length;

      if(err) return res.json(err);
      post._id = req.params.id;                                                         //이걸하는이유는 에러발생시 리다이렉트할 주소를찾아줘야하잔아 //디비를가져오는게아니니깐
      res.render("posts/edit", {post:post,
        errors:errors,
        urlQuery:req._parsedUrl.query,
        posts_length : posts_length.length,
        Notice_length : Notice.length,
        Community_length : Community.length,
        QnA_length : QnA.length,
      });
    });

 }
});


// update
  // Post.findOneAndUpdate에 {runValidators:true}이 추가된 것인데요,
  // findOneAndUpdate는 기본설정이 schema에 있는 validation을 작동하지 않도록 되어 있기때문에
  // 이 option을 통해서 validation이 작동하도록 설정해 주어야 합니다.
router.put("/:id", util.isLoggedin, checkPermission, function(req,res){
  req.body.updatedAt = Date.now();
  Post.findOneAndUpdate({_id:req.params.id},req.body, {runValidators:true},function(err,post){
    if(err){
      req.flash("post", req.body); //이걸하는이유는 리다이렉트되면 그대로적혀있도록
      req.flash("errors", util.parseError(err));
      return res.redirect("/posts/" + req.params.id +"/edit");
    }
    res.redirect("/posts/" + req.params.id);
  });
});

//destroy
router.delete("/:id", util.isLoggedin, checkPermission, function(req,res){
  Post.remove({_id:req.params.id},function(err){
    res.redirect("/posts");
  });
});

//댓글--------------------------------------------------

router.post('/:id/comments', function(req,res){
  req.body.author = req.user._id;
  Comment.create(req.body,function(err,comment){
    if(err) return res.json({success:false, message:err});

  Post.update({_id:req.params.id},{$push:{comment:comment._id}},function(err,post){
    if(err) return res.json({success:false, message:err});
    res.redirect('/posts/'+req.params.id+"?"+req._parsedUrl.query);
  });
 });
}); //create a comment


router.delete('/:postId/comments/:commentId', function(req,res){
  Post.update({_id:req.params.postId},{$pull:{comment:req.params.commentId}},
    function(err,post){
      if(err) return res.json({success:false, message:err});
      res.redirect('/posts/'+req.params.postId+"?"+req._parsedUrl.query.replace(/_method=(.*?)(&|$)/ig,""));
  });
}); //destroy a comment



//댓글---------------------------------------------------



module.exports = router;

// private functions // 접근제한위해
function checkPermission(req, res, next){
 Post.findOne({_id:req.params.id}, function(err, post){
  if(err) return res.json(err);
  if((post.author != req.user.id) && req.user.admin == 'false') return util.noPermission(req, res);
      //post.author은 req.body.author = req.user._id 위에서 넣어줘서
  next();
 });
}
