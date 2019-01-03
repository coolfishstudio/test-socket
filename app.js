const express = require('express');
const bodyParser = require('body-parser'); 
const axios = require('axios');
const qs = require('qs');
const app = express();
const port = 8000;

const appKey = 'KTavAffGs7IvNh3y9M4UrEvH';
const appSecret = 'L32LbY1n92zFhHqUv5GuAikd7TPidi5v';
// 语气助词 后期配合情感处理
const auxiliary = ['哈', '哼', '呵', '喝', '切', '嘿', '嗯', '呃', '哦', '噢', '嗷', '喔', '唔'];
let token = '24.69c97b6466a68f38572485c729a7d3e0.2592000.1548484581.282335-15282616';

//静态文件存放位置
app.use(express.static(__dirname + '/client'));

// 初始化获取
// axios.get(`https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=${appKey}&client_secret=${appSecret}`, (response) => {
//   console.log(response.data);
//   token = response.data.access_token;
// });
// {"access_token":"24.69c97b6466a68f38572485c729a7d3e0.2592000.1548484581.282335-15282616","session_key":"9mzdDc93cyExx4rBG8ysDStQ5jBj0nHr8pG3U1MQxhqxtekvgDBz3u+4VWyMG2g8Ba33GpNsXf\/r4sDPF5wNbrLhH2Xqcg==","scope":"audio_voice_assistant_get audio_tts_post public brain_all_scope wise_adapt lebo_resource_base lightservice_public hetu_basic lightcms_map_poi kaidian_kaidian ApsMisTest_Test\u6743\u9650 vis-classify_flower lpq_\u5f00\u653e cop_helloScope ApsMis_fangdi_permission smartapp_snsapi_base iop_autocar oauth_tp_app smartapp_smart_game_openapi oauth_sessionkey smartapp_swanid_verify","refresh_token":"25.c2c7b14c78093f8a4cc3bd1e858a5ce0.315360000.1861252581.282335-15282616","session_secret":"5e7c38ee4bc20fa9fea27a9abffca2aa","expires_in":2592000}

//启动页面 路由存放在浏览器端
app.use((req, res) => {
  res.sendfile('./client/index.html');
});

//往服务器端添加socket
const io = require('socket.io').listen(app.listen(port));

let users = {};
let isCanSayByRoBot = true;

//监听链接事件
io.sockets.on('connection', (socket) => {
  //有人上线
  socket.on('online', (obj) => {
    console.log('online', obj)
    //将上线的用户名存储为 socket 对象的属性，以区分每个 socket 对象，方便后面使用
    socket.name = obj.user;
    if (/萌萌酱|系统|管理员/.test(obj.user)) {
      socket.emit('onlineError', {msg: '昵称不合法'});
    }
    //users 对象中不存在该用户名则插入该用户名
    if(!users[obj.user]){
      users[obj.user] = obj.user;
      //向所有用户广播该用户上线信息
      socket.emit('onlineSuccess');
      io.sockets.emit('online', {users: users, user: obj.user});
      if (isCanSayByRoBot) {
        let text = `欢迎${obj.user}加入到直播间来。`;
        io.sockets.emit('say', { from: '萌萌酱', to: 'all', msg: text });
        io.sockets.emit('audio', { data: `http://tsn.baidu.com/text2audio?tex=${encodeURI(encodeURI(text))}&tok=${token}&cuid=萌萌酱&ctp=${1}&lan=${'zh'}&spd=${5}&pit=${5}&vol=${6}&per=${4}` });
        setTimeout(() => {
          isCanSayByRoBot = true;
        }, 10000);
      }
    }else{
      socket.emit('onlineError', {msg: '昵称已存在。'});
    }
  });
  //有人下线
  socket.on('disconnect', () => {
    //若 users 对象中保存了该用户名
    if(users[socket.name]){
      //从 users 对象中删除该用户名
      delete users[socket.name];
      //向其他所有用户广播该用户下线信息
      io.sockets.emit('offline', {users: users, user: socket.name});
    }
  });
  //有人说话
  socket.on('say', (data) => {
    console.log('>>>', data)
    if(data.to === 'all'){
      //向其他所有用户广播该用户发话信息
      socket.broadcast.emit('say', data);

      if (isCanSayByRoBot) {
        isCanSayByRoBot = false;
        axios.post('http://openapi.tuling123.com/openapi/api/v2', {
          'reqType': 0,
          'perception': {
            'inputText': {
              'text': data.msg
            },
          },
          'userInfo': {
            'apiKey': '2a5b302f83704d79b05a250d44191d99',
            'userId': '1111' // data.from md5
          }
        }).then((response) => {
          console.log('>>',response.data.results)
          if (response.data.results[0]) {
            // io.sockets.emit('say', { from: '萌萌酱', to: 'all', msg: response.data.results[0].values.text });
            let text = data.from + '说：' + data.msg + '。 ' + '。。。' + auxiliary[Math.floor((Math.random() * auxiliary.length))] + '，' + response.data.results[0].values.text;
            // console.log(text)
            // setTimeout(() => {
            //   isCanSayByRoBot = true;
            // }, 10000);
            // console.log((response.data.results[0].values.text || '').replace(/，|？|。/img, ' '))
            // axios.post(`https://aip.baidubce.com/rpc/2.0/nlp/v1/sentiment_classify?access_token=${token}`, {
            //   text: (response.data.results[0].values.text || '').replace(/，|？|。/img, ' ')
            // }, {
            //   headers: {
            //     charset: 'GBK'
            //   }
            // }).then((response) => {
            //   console.log('>>>', response.data)
              
            // }).catch((error) => console.log(error));

            // {
            //   tex: encodeURI(encodeURI(response.data.results[0].values.text)),
            //   tok: token,
            //   cuid: data.from,
            //   ctp: 1,
            //   lan: 'zh',
            //   spd: 3,
            //   pit: 4,
            //   vol: 5,
            //   per: 3,
            // }
            console.log(text)
            console.log(`http://tsn.baidu.com/text2audio?tex=${encodeURI(encodeURI(text))}&tok=${token}&cuid=${data.from}&ctp=${1}&lan=${'zh'}&spd=${5}&pit=${5}&vol=${6}&per=${4}`)
            // axios.post('https://tsn.baidu.com/text2audio', qs.stringify({
            //   tex: encodeURI(encodeURI(text)),
            //   tok: token,
            //   cuid: data.from,
            //   ctp: 1,
            //   lan: 'zh',
            //   spd: 5,
            //   pit: 5,
            //   vol: 6,
            //   per: 4,
            // }), {
            //   headers: {
            //     'Content-Type': 'application/x-www-form-urlencoded'
            //   }
            // }).then((response) => {
            //   // 成功
            //   if (response.headers['content-type'] === 'audio/mp3') {
                io.sockets.emit('say', { from: '萌萌酱', to: 'all', msg: response.data.results[0].values.text });
                io.sockets.emit('audio', { data: `http://tsn.baidu.com/text2audio?tex=${encodeURI(encodeURI(text))}&tok=${token}&cuid=${data.from}&ctp=${1}&lan=${'zh'}&spd=${5}&pit=${5}&vol=${6}&per=${4}` });
              // }
              setTimeout(() => {
                isCanSayByRoBot = true;
              }, 10000);
            // }).catch((error) => console.log(error));
          }
        }).catch((error) => console.log(error));
      }
    }else{
      //向特定用户发送该用户发话信息
      //clients 为存储所有连接对象的数组
      let clients = io.sockets.sockets;
      //遍历找到该用户
      clients.forEach((client) => {
        if(client.name == data.to){
          //触发该用户客户端的 say 事件
          client.emit('say', data);
        }
      });
    }
  });
});

console.log('y-robot-chat is on port ' + port + '!');

