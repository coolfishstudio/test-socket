// window.onload = window.onresize = function () {
//   init();
// };

// 初始化
function init () {
  // 适配
  var deviceWidth = document.documentElement.clientWidth;
  if (deviceWidth > 480) {
    deviceWidth = 480;
  }
  document.documentElement.style.fontSize = deviceWidth / 7.5 + 'px';
}

window.onload = function () {
  //加载socket
  var socket = io.connect();
  var oSay = document.getElementById('say');
  var oContents = document.getElementById('contents');

  var oLiveBox = document.getElementById('liveBox');
  var oLoginBox = document.getElementById('loginBox');

  var oBtnSub = document.getElementById('subUser');
  var oTextName = document.getElementById('userName');

  var name = '';
  oBtnSub.onclick = function(){
    name = oTextName.value;
    if (name === '') {
      alert('请输入用户名');
      return false;
    }
    socket.emit('online',{ user: name });
  };

  socket.on('onlineError',function (data) {
    console.log(data.msg)
  });

  socket.on('onlineSuccess',function () {
    // 登录成功
    oLiveBox.style.display = 'block';
    oLoginBox.style.display = 'none';
  });

  socket.on('online',function (data) {
    if(data.user !== name) {
      var sys = '<span class="contents_item"><font style="color:#f00">系统消息：</font>用户 [' + data.user + '] 上线了！</span><br/>';
    }else{
      var sys = '<span class="contents_item"><font style="color:#f00">系统消息：</font>你进入了聊天室！</span><br/>';
    }
    oContents.innerHTML += sys;
    scrollDown();
  });

  socket.on('offline', function(data){
    oContents.innerHTML += '<span class="contents_item"><font style="color:#f00">系统消息：</font>用户 [' + data.user + '] 下线了！</span><br/>';
    scrollDown();
  });

  socket.on('say', function (data) {
    if(data.to === 'all'){
      oContents.innerHTML += '<span class="contents_item"><font style="color:#FFD700">' + data.from + '：</font>' + data.msg + '</span><br/>';
    }
    scrollDown();
  });

  socket.on('audio', function (data) {
    let audio = new Audio(data.data);
    audio.addEventListener('canplaythrough', function () {
      audio.play();
    }, false);
  });

  oSay.onclick = function () {
    say();
  }

  function say () {
    //获取要发送的信息
    var msg = document.getElementById('input_content').value;
    console.log('msg', msg)
    if (msg === '') {
      return false;
    }
    var data = {from: name, to: 'all', msg: msg};
    oContents.innerHTML += '<span class="contents_item"><font style="color:#FFD700">' + data.from + '：</font>' + data.msg + '</span><br/>';
    //发送发话信息
    // console.log('===', data);
    socket.emit('say', data);
    document.getElementById('input_content').value = '';
    scrollDown();
  }

  function scrollDown () {
    oContents.scrollTop = oContents.scrollHeight;
  }
}