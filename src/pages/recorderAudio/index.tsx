import React, { useState, useRef, useEffect } from "react";
import { ipcRenderer } from "electron";
import { useStopwatch } from "react-timer-hook";
import { BsPlayFill, BsPause, BsFillStopFill } from "react-icons/bs";
import { MinusOutlined, CloseOutlined } from "@ant-design/icons";
import { Button } from "antd";
import TimerStyled from "@/components/timer/timerStyled";
import "./index.scss";

const RecordAudio = () => {
	const [record, setRecord] = useState<any>();
	const [isPause, setIsPause] = useState(false);
	const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
		useStopwatch({ autoStart: false });

	useEffect(() => {
		initRecord();
	}, []);

	function initRecord() {
		const _record = window.mediajs.audio();
		_record.create();
		_record.onstop(() => {
			const _blob = _record.getMediaBlobs();
			const [chunk] = _blob;
			const blobProperty: BlobPropertyBag = Object.assign(
				{ type: chunk.type },
				{
					type: "audio/wav",
				},
			);
			const blob = new Blob(_blob, blobProperty);
			const url = URL.createObjectURL(blob);
			ipcRenderer.send("ra:download-record", url);
		});
		setRecord(_record);
	}

	async function handleCloseWin() {
		ipcRenderer.send("ra:close-win");
	}

	async function handleHideWin() {
		ipcRenderer.send("ra:hide-win");
	}

	function handleMinimizeWin() {
		ipcRenderer.send("ra:minimize-win");
	}

	function handleStartRecord() {
		console.log("handleStartRecord");
		start();
		isPause ? record.resume() : record.start();
		setIsPause(false);
		ipcRenderer.send("ra:start-record");
	}

	function handlePauseRecord() {
		console.log("handlePauseRecord");
		pause();
		setIsPause(true);
		record.pause();
		ipcRenderer.send("ra:pause-record");
	}

	function handleStopRecord() {
		console.log("handleStopRecord");
		record.stop();
		ipcRenderer.send("ra:stop-record");
	}

	return (
		<div className="recordAudio">
			<div className="recorderTools">
				{isRunning ? (
					<>
						<Button
							type="text"
							icon={<BsPause />}
							className="toolbarIcon pauseBtn"
							title="暂停"
							onClick={handlePauseRecord}
						/>
						<Button
							type="text"
							icon={<BsFillStopFill />}
							className="toolbarIcon stopBtn"
							title="停止"
							onClick={handleStopRecord}
						/>
					</>
				) : (
					<Button
						type="text"
						icon={<BsPlayFill />}
						className="toolbarIcon playBtn"
						title="开始"
						onClick={handleStartRecord}
					/>
				)}
			</div>
			<TimerStyled seconds={seconds} minutes={minutes} hours={hours} />
			<div className="winBar">
				<Button
					type="text"
					icon={<MinusOutlined />}
					className="toolbarIcon"
					title="最小化"
					onClick={() => handleMinimizeWin()}
				/>
				<Button
					type="text"
					icon={<CloseOutlined />}
					className="toolbarIcon"
					title="关闭"
					onClick={() => handleCloseWin()}
				/>
			</div>
		</div>
	);
};

export default RecordAudio;
