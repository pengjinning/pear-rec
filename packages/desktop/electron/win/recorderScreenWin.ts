import { app, BrowserWindow, dialog, shell, screen, Rectangle } from "electron";
import fs from "node:fs";
import { join, basename, dirname } from "node:path";
import Ffmpeg from "fluent-ffmpeg";
import FfmpegPath from "ffmpeg-static";
import Jimp from "jimp";
import {
	preload,
	url,
	DIST,
	ICON,
	WEB_URL,
	DIST_ELECTRON,
} from "../main/contract";
import { getFilePath, setHistoryVideo } from "../main/api";
import {
	closeClipScreenWin,
	getBoundsClipScreenWin,
	setBoundsClipScreenWin,
} from "./clipScreenWin";
import { openViewVideoWin } from "./viewVideoWin";

FfmpegPath &&
	Ffmpeg.setFfmpegPath(
		url
			? join(DIST_ELECTRON, "../node_modules/ffmpeg-static/ffmpeg.exe")
			: FfmpegPath.replace("app.asar", "app.asar.unpacked"),
	);

const recorderScreenHtml = join(DIST, "./recorderScreen.html");
let recorderScreenWin: BrowserWindow | null = null;
let isFullScreen: boolean = false;

function createRecorderScreenWin(search?: any): BrowserWindow {
	isFullScreen = search?.isFullScreen || false;
	if (!isFullScreen) {
		const { x, y, width, height } = getBoundsClipScreenWin() as Rectangle;
		let recorderScreenWinX = x;
		let recorderScreenWinY = y + height;

		recorderScreenWin = new BrowserWindow({
			title: "pear-rec 录屏",
			icon: ICON,
			x: recorderScreenWinX,
			y: recorderScreenWinY,
			width: width,
			height: 34,
			autoHideMenuBar: true, // 自动隐藏菜单栏
			frame: false, // 无边框窗口
			hasShadow: false, // 窗口是否有阴影
			fullscreenable: false, // 窗口是否可以进入全屏状态
			alwaysOnTop: true, // 窗口是否永远在别的窗口的上面
			skipTaskbar: true,
			webPreferences: {
				preload,
			},
		});
	} else {
		recorderScreenWin = new BrowserWindow({
			title: "pear-rec 录屏",
			icon: ICON,
			height: 40,
			width: 365,
			center: true,
			transparent: true, // 使窗口透明
			autoHideMenuBar: true, // 自动隐藏菜单栏
			frame: false, // 无边框窗口
			hasShadow: false, // 窗口是否有阴影
			fullscreenable: false, // 窗口是否可以进入全屏状态
			alwaysOnTop: true, // 窗口是否永远在别的窗口的上面
			skipTaskbar: true,
			webPreferences: {
				preload,
			},
		});
		recorderScreenWin?.setBounds({ y: 0 });
	}
	recorderScreenWin?.setResizable(false);
	if (url) {
		recorderScreenWin.loadURL(
			WEB_URL + `recorderScreen.html?isFullScreen=${isFullScreen}`,
		);
		// recorderScreenWin.webContents.openDevTools();
	} else {
		recorderScreenWin.loadFile(recorderScreenHtml, {
			search: `?isFullScreen=${isFullScreen}`,
		});
	}

	recorderScreenWin.on("move", () => {
		const recorderScreenWinBounds = getBoundsRecorderScreenWin() as Rectangle;
		const clipScreenWinBounds = getBoundsClipScreenWin() as Rectangle;
		isFullScreen ||
			setBoundsClipScreenWin({
				x: recorderScreenWinBounds.x,
				y: recorderScreenWinBounds.y - clipScreenWinBounds.height,
				width: clipScreenWinBounds.width,
				height: clipScreenWinBounds.height,
			});
	});

	return recorderScreenWin;
}

async function recorderScreen(rsFilePath: string) {
	// closeRecorderScreenWin();
	setHistoryVideo(rsFilePath);
	shell.showItemInFolder(rsFilePath);
}

async function ffmpegRecorderScreenWin(filePath: string) {
	const { x, y, width, height } = getBoundsClipScreenWin() as Rectangle;
	// const fileName = basename(filePath);
	const folderPath = dirname(filePath);
	const rsInputPath = filePath;
	const fileName = `pear-rec_${
		+Date.now() + "-" + Math.round(Math.random() * 1e9)
	}.mp4`;
	const rsOutputPath = join(`${folderPath}`, `${fileName}`);
	const ffmpegProcess = Ffmpeg(rsInputPath)
		.on("progress", function (progress: any) {
			console.log("Processing: " + progress.percent + "% done");
		})
		.on("start", (commandLine: any) => {
			console.log("ffmpeg started with command: ", commandLine);
		})
		.on("end", (stdout: any, stderr: any) => {
			console.log("ffmpeg finished: ", stderr);

			setHistoryVideo(rsOutputPath);
			setTimeout(() => {
				closeRecorderScreenWin();
				openViewVideoWin({ videoUrl: rsOutputPath });
				fs.unlink(rsInputPath, (err) => {
					if (err) {
						return console.error(err);
					}
					console.log(`ffmpeg: ${rsInputPath} 文件删除成功！`);
				});
			}, 500);
		})
		.on("error", (err: any) => {
			console.log("ffmpeg error: ", err.message);
		})
		.videoFilters(`crop=${width - 3}:${height - 3}:${x + 2}:${y + 2}`)
		// .format('mp4')
		.save(rsOutputPath);
}

// 打开关闭录屏窗口
function closeRecorderScreenWin() {
	recorderScreenWin?.isDestroyed() || recorderScreenWin?.close();
	recorderScreenWin = null;
	closeClipScreenWin();
}

function openRecorderScreenWin(search?: any) {
	if (!recorderScreenWin || recorderScreenWin?.isDestroyed()) {
		recorderScreenWin = createRecorderScreenWin(search);
	}
	recorderScreenWin?.show();
}

function hideRecorderScreenWin() {
	recorderScreenWin?.hide();
}

function showRecorderScreenWin() {
	recorderScreenWin?.show();
}

function minimizeRecorderScreenWin() {
	recorderScreenWin?.minimize();
}

function setSizeRecorderScreenWin(width: number, height: number) {
	recorderScreenWin?.setResizable(true);
	recorderScreenWin?.setSize(width, height);
	recorderScreenWin?.setResizable(false);
}

function getBoundsRecorderScreenWin() {
	return recorderScreenWin?.getBounds();
}

function setMovableRecorderScreenWin(movable: boolean) {
	isFullScreen || recorderScreenWin?.setMovable(movable);
}

function setResizableRecorderScreenWin(resizable: boolean) {
	isFullScreen || recorderScreenWin?.setResizable(resizable);
}

function setAlwaysOnTopRecorderScreenWin(isAlwaysOnTop: boolean) {
	recorderScreenWin?.setAlwaysOnTop(isAlwaysOnTop);
}

function isFocusedRecorderScreenWin() {
	return recorderScreenWin?.isFocused();
}

function focusRecorderScreenWin() {
	recorderScreenWin?.focus();
}

function getCursorScreenPointRecorderScreenWin() {
	return screen.getCursorScreenPoint();
}

function shotScreen(imgUrl: any) {
	const { x, y, width, height } = getBoundsClipScreenWin() as Rectangle;
	const filePath = getFilePath() as any;
	const result = join(`${filePath}/ss`, `shotScreen_${+new Date()}.jpg`);
	Jimp.read(imgUrl, function (err, img) {
		if (err) {
			console.log(`err: shotScreen ${err}`);
		} else {
			img.crop(x + 1, y + 1, width - 2, height - 2).write(result);

			setTimeout(() => {
				recorderScreenWin?.webContents.send("rs:get-shot-screen", result);
				// closeRecorderScreenWin();
				// shell.showItemInFolder(result);
			}, 500);
		}
	});
}

function setBoundsRecorderScreenWin(clipScreenWinBounds: any) {
	let { x, y, width, height } = clipScreenWinBounds;
	let recorderScreenWinX = x;
	let recorderScreenWinY = y + height;
	recorderScreenWin?.setBounds({
		x: recorderScreenWinX,
		y: recorderScreenWinY,
		width: width,
	});
	recorderScreenWin?.webContents.send(
		"rs:get-size-clip-win",
		clipScreenWinBounds,
	);
}

function setIgnoreMouseEventsRecorderScreenWin(
	event: any,
	ignore: boolean,
	options: any,
) {
	const win = BrowserWindow.fromWebContents(event.sender);
	win?.setIgnoreMouseEvents(ignore, options);
}

export {
	createRecorderScreenWin,
	closeRecorderScreenWin,
	openRecorderScreenWin,
	hideRecorderScreenWin,
	showRecorderScreenWin,
	minimizeRecorderScreenWin,
	setSizeRecorderScreenWin,
	setIgnoreMouseEventsRecorderScreenWin,
	getBoundsRecorderScreenWin,
	setMovableRecorderScreenWin,
	setResizableRecorderScreenWin,
	setAlwaysOnTopRecorderScreenWin,
	getCursorScreenPointRecorderScreenWin,
	isFocusedRecorderScreenWin,
	focusRecorderScreenWin,
	setBoundsRecorderScreenWin,
	shotScreen,
	ffmpegRecorderScreenWin,
};
