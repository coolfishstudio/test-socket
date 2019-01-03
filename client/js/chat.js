window.onload = function(){
	//加载socket
	var socket = io.connect();

	var oContain = document.getElementById('contain');
	var oLoginBox = document.getElementById('loginBox');

	var oBtnSub = document.getElementById('subUser');
	var oBtnRe = document.getElementById('reUser');
	var oTextName = document.getElementById('userName');

	var oContents = document.getElementById('contents');
	var oList = document.getElementById('list');

	var oFrom = document.getElementById('from');
	var oTo = document.getElementById('to');

	var name = '';
	var to = 'all';//设置默认接收对象为"所有人"

	var  oSay = document.getElementById('say');

	oBtnRe.onclick = function(){
		oTextName.value = '';
	};

	oBtnSub.onclick = function(){
		name = oTextName.value;
		if(name == ''){
			alert('请输入用户名');
			return false;
		}
		socket.emit('online',{user : name});
	};

	socket.on('onlineError',function(){
		alert('用户名冲突，请换名字');
	});

	socket.on('onlineSuccess',function(){
		oContain.style.display = 'block';
		oLoginBox.style.display = 'none';
	});

	socket.on('online',function(data){
		if(data.user != name){
			var sys = '<div style="color:#f00"> ' + tool.getTime() + ' [系统] : ' + '用户 [' + data.user + '] 上线了！</div><br />';
		}else{
			var sys = '<div style="color:#f00"> ' + tool.getTime() + ' [系统] : 你进入了聊天室！</div><br />';
		}
		oContents.innerHTML += sys;
		flushUsers(data.users);
		showSayTo();
		scrollDown();
	});

	socket.on('offline', function(data){
		var sys = '<div style="color:#f00"> ' + tool.getTime() + ' [系统] : ' + '用户 [' + data.user + '] 下线了！</div><br />';
		oContents.innerHTML += sys;
		flushUsers(data.users);
		if(data.user == to){
			to = "all";
		}
		showSayTo();
		scrollDown();
	});

	socket.on('say', function(data){
		if(data.to == 'all'){
			oContents.innerHTML += '<div> ' + tool.getTime() + ' [' + data.from + '] 对 [所有人] 说：<br/>' + data.msg + '</div><br />';
		}
		//对你密语
		if(data.to == name){
			oContents.innerHTML += '<div style="color:#00f" > ' + tool.getTime() + ' [' + data.from + '] 对 [你] 说：<br/>' + data.msg + '</div><br />';
		}
		scrollDown();
	});
	
	//服务器关闭
	socket.on('disconnect', function(){
		var sys = '<div style="color:#f00">系统:连接服务器失败！</div>';
		oContents.innerHTML += sys + '<br/>';
		oList.innerHTML = '';
		scrollDown();
	});

	//重新启动服务器
	socket.on('reconnect', function() {
		var sys = '<div style="color:#f00">系统:重新连接服务器！</div>';
		oContents.innerHTML += sys + '<br/>';
		socket.emit('online', {user: name});
		scrollDown();
	});

	oSay.onclick = function(){
		say();
	}

	function say(){
		//获取要发送的信息
		var msg = document.getElementById('input_content').innerHTML;
		if(msg == ''){
			return;
		}
		if(to == 'all'){
			oContents.innerHTML += '<div> ' + tool.getTime() + ' [你] 对 [所有人] 说：<br/>' + msg + '</div><br />';
		} else {
			oContents.innerHTML += '<div style="color:#00f"> ' + tool.getTime() + ' [你] 对 [' + to + '] 说：<br/>' + msg + '</div><br />';
		}
		//发送发话信息
		socket.emit('say', {from: name, to: to, msg: msg});
		document.getElementById('input_content').innerHTML = '';
		scrollDown();
	}

	function flushUsers(users){
		oList.innerHTML = '';
		for(var i in users){
			oList.innerHTML += '<li alt="' + users[i] + '" title="单击私聊" onselectstart="return false">' + users[i] + '</li>';
		};
		var lis = oList.childNodes;
		for(var i = 0; i < lis.length; i++){
			lis[i].onclick = function(){
				if(this.innerHTML != name && this.innerHTML != to){
					to = this.innerHTML;
				}else{
					to = 'all';
				}
				showSayTo();
			};
		}
	}

	function showSayTo(){
		oFrom.innerHTML = name;
		oTo.innerHTML = (to == "all" ? "所有人" : to);
	}
	
	document.onkeydown = function(event){
		var e = event || window.event || arguments.callee.caller.arguments[0];
		if(e && e.keyCode == 13){
			say();
		}
	};

	function scrollDown(){
		oContents.scrollTop = oContents.scrollHeight;
	}
};

var tool = {
	setCookie : function(key, value){
		var Days = 30;
		var exp = new Date(); 
		exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000); 
		document.cookie = key + '=' + escape (value) + ';expires=' + exp.toGMTString(); 
	},
	getCookie : function(key){
		var arr = [];
		var reg = new RegExp('(^| )' + key + '=([^;]*)(;|$)');
		if(arr=document.cookie.match(reg)){
			return unescape(arr[2]); 
		}else{
			return null;
		}
	},
	delCookie : function(key){
		var exp = new Date();
		exp.setTime(exp.getTime() - 1);
		var cval = tool.getCookie(key); 
		if(cval != null){
			document.cookie = name + '=' + cval + ';expires=' + exp.toGMTString();
		}
	},
	getTime : function(){
		var date = new Date();
		var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ":" + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
		return time;
	}

};