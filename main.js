let fs = require('fs')
	, config = require('./config.json')
	, saveConfig = () => {fs.writeFile('./config.json',  JSON.stringify(config), 'utf8', () => {})}
	, win
	;

const DiscordRPC = require('discord-rpc')
		, rpc = new DiscordRPC.Client({transport: 'ipc'})
		, {app, BrowserWindow, Menu, remote, globalShortcut } = require('electron')
		, clientId = config.clientId
		;

DiscordRPC.register(config.clientId);

const menuTemplate = [
	{
		label: "Interface",
		submenu: [
			{role: "Reload"}
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
	// win.openDevTools();
	const menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
	win.once('ready-to-show', () => {win.show()});

  globalShortcut.register('MediaPlayPause', () => {
  	if (config.source.indexOf('music.yandex.ru') != -1) {
  		win.webContents.executeJavaScript('externalAPI.togglePause()');
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
    console.log('MediaNextTrack is pressed')
  });
  console.log('MediaNextTrack', globalShortcut.isRegistered('MediaNextTrack'));

  globalShortcut.register('MediaPreviousTrack', () => {
  	if (config.source.indexOf('music.yandex.ru') != -1) {
  		win.webContents.executeJavaScript('externalAPI.prev()');
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
    console.log('VolumeUp is pressed')
  });
  console.log('VolumeUp', globalShortcut.isRegistered('VolumeUp'));

  globalShortcut.register('VolumeDown', async () => {
  	if (config.source.indexOf('music.yandex.ru') != -1) {
  		let vol = await win.webContents.executeJavaScript('externalAPI.getVolume()');
  		win.webContents.executeJavaScript(`externalAPI.setVolume(${vol - 0.1})`);
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
    console.log('VolumeMute is pressed')
  });
  console.log('VolumeMute', globalShortcut.isRegistered('VolumeMute'));

	win.on('closed', () => {win = null; globalShortcut.unregisterAll(); rpc.destroy();});
	win.loadURL(`https://${config.source}`);
});




let startTimestamp = new Date();
let prevInfo = '';
let prevArgs = [];

function setActivity() {
	if (!rpc || !win) return;

	if (config.source.indexOf('music.yandex.ru') != -1) {
		// win.webContents.executeJavaScript('externalAPI.togglePause()');
		return;
	}
	
	const args = config.source == 'youtube.com' ? win.getTitle().split(' - ') : win.getTitle().split(' — ');
	let smallImage = 'play';
	let details = args[0];
	let state = args[1];
	let smallImageText = 'Слушает';

	console.log(win.getTitle());
	console.log(args);

	if (prevInfo !== win.getTitle()) {
		prevInfo = win.getTitle();

		if (args.length > 1) {
			prevArgs = args;
		}
	}

	if (args.length < 2) {
		smallImage = 'pause';
		smallImageText = 'На паузе';
		details = prevArgs[0];
		state = prevArgs[1];
	}

	rpc.setActivity({
		details: details,
		state: config.source == 'youtube.com' && state == 'YouTube Music' ? '¯\\_(ツ)_/¯' : state,
		startTimestamp,
		largeImageKey: config.source.split('.')[0],
		largeImageText: config.source == 'youtube.com' ? 'YouTube Music' : 'Yandex Music',
		smallImageKey: smallImage,
		smallImageText: smallImageText,
		instance: false,
	});
}

rpc.on('ready', () => {
  console.log('Authed for user', rpc.user.username);

	setActivity();
	// activity can only be set every 15 seconds
	setInterval(() => {
		setActivity();
	}, 15e3);
});

rpc.login({clientId}).catch(console.error);