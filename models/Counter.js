// - 전체 방문자 수와 오늘의 방문자 수를 표시합니다.
//
// - 사이트 방문시에 브라우저에 쿠키를 생성하여 방문날짜를 기록합니다. 만약 같은 날짜에 재방문시에는 카운터가 증가하지 않습니다.
//
// - 브라우저에서 쿠키사용 금지를 설정한 경우에는 카운터가 증가하지 않습니다
var mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
  name: {type:String, required:true},
  totalCount: {type:Number, required:true},
  todayCount: {type:Number},
  date: {type:String}
});

var Counter = mongoose.model('counter',counterSchema);
module.exports = Counter;
