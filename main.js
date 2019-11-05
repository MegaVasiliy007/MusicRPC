let fs = require('fs')
	, config = require('./config.json')
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
function checked(menuItem) {config.source = menuItem.label; saveConfig(); console.log(menuItem.label); win.loadURL(`https://${config.source}`);}

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




let prevInfo = '';
let prevArgs = [];

async function setActivity() {
	if (!rpc || !win || !config.state) return;

	if (config.source.indexOf('soundcloud.com') != -1) return;

	if (config.source.indexOf('music.yandex.ru') != -1) {
		yandex();
		return;
	}
	
	const args = win.getTitle().split(' - ');
	let details = args.length < 2 ? prevArgs[0] : args[0];
	let state = args.length < 2 ? prevArgs[1] : args[1];

	if (prevInfo !== win.getTitle()) {
		prevInfo = win.getTitle();
		prevArgs = args.length > 1 ? args : prevArgs;
	}

	rpc.setActivity({
		details: details,
		state: state == 'YouTube Music' ? '¯\\_(ツ)_/¯' : state,
		largeImageKey: 'youtube',
		largeImageText: 'YouTube Music',
		smallImageKey: args.length < 2 ? 'pause' : 'play',
		smallImageText: args.length < 2 ? 'На паузе' : 'Слушает',
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

	setActivity();
	setInterval(() => setActivity(), 5e3);
});

rpc.login({clientId: config.clientId}).catch(console.error);