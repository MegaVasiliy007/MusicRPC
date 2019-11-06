let fs = require('fs')
	, request = require('request-promise-native')
	, config = require('./config.json')
	, googleData = {key: require('./google.js'), url: '', res: {}}
	, saveConfig = () => {fs.writeFile('./config.json',  JSON.stringify(config), 'utf8', () => {})}
	, win
	;

const DiscordRPC = require('discord-rpc')
		, rpc = new DiscordRPC.Client({transport: 'ipc'})
		, {app, BrowserWindow, Menu, remote, globalShortcut } = require('electron')
		;

DiscordRPC.register(config.clientId);

const menuTemplate = [
	{
		label: "Interface",
		submenu: [
			{role: "Reload"},
			{role: "toggleDevTools"},
			{label: 'Enable RPC', type: 'checkbox', checked: config.state ? true : false, click: () => {config.state = config.state ? false : true; saveConfig()}}
		]
	},
	{label: "Source", submenu: []}
];

for (var i of config.menu) menuTemplate[1].submenu.push({label: i, type: "radio", click: checked, checked: config.source.indexOf(i) != -1 ? true : false});
function checked(menuItem) {config.source = menuItem.label; saveConfig(); if (googleData.url && config.source.indexOf('music.youtube.com') == -1) googleData.url = ''; console.log(menuItem.label); win.loadURL(`https://${config.source}`);}

app.on('ready', () => {
	// Create the browser window.
	win = new BrowserWindow({width: 800, height: 700, show: false, webPreferences: {nodeIntegration: false}});
	win.setMinimumSize(300, 300);
	win.setSize(800, 700);
	win.setResizable(true);
	Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
	win.once('ready-to-show', () => {win.show()});


  globalShortcut.register('MediaPlayPause', () => {
  	if (config.source.indexOf('music.yandex.ru') != -1) {
  		win.webContents.executeJavaScript('externalAPI.togglePause()');
  		return;
  	}
  	if (config.source.indexOf('music.youtube.com') != -1) {
  		win.webContents.sendInputEvent({type: 'keyDown', keyCode: 'Space'})
  		return;
  	}
    console.log('MediaPlayPause is pressed')
  });
  console.log('MediaPlayPause', globalShortcut.isRegistered('MediaPlayPause'));

  globalShortcut.register('MediaNextTrack', () => {
  	if (config.source.indexOf('music.yandex.ru') != -1) {
  		win.webContents.executeJavaScript('externalAPI.next()');
  		return;
  	}
  	if (config.source.indexOf('music.youtube.com') != -1) {
  		win.webContents.sendInputEvent({type: 'keyDown', keyCode: 'j'})
  		return;
  	}
    console.log('MediaNextTrack is pressed')
  });
  console.log('MediaNextTrack', globalShortcut.isRegistered('MediaNextTrack'));

  globalShortcut.register('MediaPreviousTrack', () => {
  	if (config.source.indexOf('music.yandex.ru') != -1) {
  		win.webContents.executeJavaScript('externalAPI.prev()');
  		return;
  	}
  	if (config.source.indexOf('music.youtube.com') != -1) {
  		win.webContents.sendInputEvent({type: 'keyDown', keyCode: 'k'})
  		return;
  	}
    console.log('MediaPreviousTrack is pressed')
  });
  console.log('MediaPreviousTrack', globalShortcut.isRegistered('MediaPreviousTrack'));

  // globalShortcut.register('MediaStop', () => {
  // 	if (config.source.indexOf('music.yandex.ru') != -1) {
  // 		//
  // 	}
  //   console.log('MediaStop is pressed')
  // });
  // console.log(globalShortcut.isRegistered('MediaStop'));

  globalShortcut.register('VolumeUp', async () => {
  	if (config.source.indexOf('music.yandex.ru') != -1) {
  		let vol = await win.webContents.executeJavaScript('externalAPI.getVolume()');
  		win.webContents.executeJavaScript(`externalAPI.setVolume(${vol + 0.1})`);
  		return;
  	}
  	if (config.source.indexOf('music.youtube.com') != -1) {
  		win.webContents.sendInputEvent({type: 'keyDown', keyCode: '='})
  		return;
  	}
    console.log('VolumeUp is pressed')
  });
  console.log('VolumeUp', globalShortcut.isRegistered('VolumeUp'));

  globalShortcut.register('VolumeDown', async () => {
  	if (config.source.indexOf('music.yandex.ru') != -1) {
  		let vol = await win.webContents.executeJavaScript('externalAPI.getVolume()');
  		win.webContents.executeJavaScript(`externalAPI.setVolume(${vol - 0.1})`);
  		return;
  	}
  	if (config.source.indexOf('music.youtube.com') != -1) {
  		win.webContents.sendInputEvent({type: 'keyDown', keyCode: '-'})
  		return;
  	}
    console.log('VolumeDown is pressed')
  });
  console.log('VolumeDown', globalShortcut.isRegistered('VolumeDown'));

  globalShortcut.register('VolumeMute', () => {
  	if (config.source.indexOf('music.yandex.ru') != -1) {
  		win.webContents.executeJavaScript('externalAPI.toggleMute()');
  		return;
  	}
  	if (config.source.indexOf('music.youtube.com') != -1) {
  		win.webContents.sendInputEvent({type: 'keyDown', keyCode: 'm'})
  		return;
  	}
    console.log('VolumeMute is pressed')
  });
  console.log('VolumeMute', globalShortcut.isRegistered('VolumeMute'));

	win.on('closed', () => {win = null; globalShortcut.unregisterAll(); rpc.destroy();});
	win.loadURL(`https://${config.source}`);
});




function setActivity() {
	if (!rpc || !win || !config.state) return;

	if (config.source.indexOf('soundcloud.com') != -1) return;

	if (config.source.indexOf('music.yandex.ru') != -1) {
		yandex();
		return;
	}

  if (config.source.indexOf('music.youtube.com') != -1) {
    google();
    return;
  }
}

async function google() {
  if (!googleData.url && win.webContents.getURL() == 'https://music.youtube.com/') {
    rpc.setActivity({
      details: 'Ожидание...',
      state: 'Ждем выбора трека',
      largeImageKey: 'youtube',
      largeImageText: 'YouTube Music',
      smallImageKey: 'pause',
      smallImageText: 'На паузе',
    });
    return;
  }

  let getUrl = win.webContents.getURL().slice(win.webContents.getURL().indexOf('v=')+2, win.webContents.getURL().indexOf('&list='));

  if (getUrl != googleData.url && win.webContents.getURL() != 'https://music.youtube.com/') {
    googleData.url = getUrl;
    let res = await request.get({url: `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${googleData.url}&key=${googleData.key}`, json: true});
    console.log(res);
    if (!res.pageInfo.totalResults) return;
    googleData.res = res.items[0].snippet;
  }

  rpc.setActivity({
    details: googleData.res.title,
    state: googleData.res.channelTitle,
    largeImageKey: 'youtube',
    largeImageText: 'YouTube Music',
    smallImageKey: win.getTitle() == 'YouTube Music' ? 'pause' : 'play',
    smallImageText: win.getTitle() == 'YouTube Music' ? 'На паузе' : 'Слушает',
  });
}

async function yandex() {
	let data = await win.webContents.executeJavaScript('externalAPI.getCurrentTrack()');
	let state = await win.webContents.executeJavaScript('externalAPI.isPlaying()');

	rpc.setActivity({
		details: data.title,
		state: data.artists[0].title,
		largeImageKey: 'yandex',
		largeImageText: 'Yandex Music',
		smallImageKey: state ? 'play' : 'pause',
		smallImageText: state ? 'Слушает' : 'На паузе'
	})
}

rpc.on('ready', () => {
  console.log('Authed for user', rpc.user.username);

	rpc.setActivity({
    details: 'Запускается...',
    state: 'Загрузка плеера',
    smallImageKey: 'pause',
    smallImageText: 'На паузе'
  })
	setInterval(() => setActivity(), 5e3);
});

rpc.login({clientId: config.clientId}).catch(console.error);