'use strict';
const DiscordRPC = require('discord-rpc');
const {app, BrowserWindow, Menu, remote} = require('electron');

const clientId = '594507314204246024';

let source = 'yandex.ru', win;
const menuTemplate = [
	{
		label: "Interface",
		submenu: [
			{role: "Reload"}
		]
	},
	{
		label: "Source",
		submenu: [
			{label: "youtube.com", type: "radio", click: checked, checked: source == 'youtube.com' ? true : false},
			{label: "yandex.ru", type: "radio", click: checked, checked: source == 'youtube.com' ? false : true}
		]
	}
];

function checked(menuItem) {source = menuItem.label; console.log(menuItem.label); win.loadURL(`https://music.${source}/`);}

app.on('ready', () => {
	// Create the browser window.
	win = new BrowserWindow({width: 800, height: 700, webPreferences: {nodeIntegration: false}});
	win.setMinimumSize(300, 300);
	win.setSize(800, 700);
	win.setResizable(true);
	// win.openDevTools();
	const menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
	// and load the index.html of the app.
	win.loadURL(`https://music.${source}/`);
	win.on('closed', () => {
		win = null;
	});

});

// only needed for discord allowing spectate, join, ask to join
DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({transport: 'ipc'});
let startTimestamp = new Date();
let prevInfo = '';
let prevArgs = [];

function setActivity() {
	if (!rpc || !win) return;
	
	const args = source == 'youtube.com' ? win.getTitle().split(' - ') : win.getTitle().split(' — ');
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
		state: source == 'youtube.com' && state == 'YouTube Music' ? '¯\\_(ツ)_/¯' : state,
		startTimestamp,
		largeImageKey: source.split('.')[0],
		largeImageText: source == 'youtube.com' ? 'YouTube Music' : 'Yandex Music',
		smallImageKey: smallImage,
		smallImageText: smallImageText,
		instance: false,
	});
}

rpc.on('ready', () => {
	setActivity();
	// activity can only be set every 15 seconds
	setInterval(() => {
		setActivity();
	}, 15e3);
});

rpc.login({clientId}).catch(console.error);