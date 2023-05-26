import React, { useRef, useEffect, useState } from "react";
import { ipcRenderer } from "electron";
import { Button } from "antd";
import {
	BsMic,
	BsMicMute,
	BsPlayFill,
	BsPause,
	BsFillStopFill,
} from "react-icons/bs";
import "./index.scss";

const RecorderVideo = () => {
	const previewVideo = useRef<HTMLVideoElement>(null);
	const [record, setRecord] = useState<any>();
	const [isRunning, setIsRunning] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [isPause, setIsPause] = useState(false);

	useEffect(() => {
		initRecord();
	}, []);

	async function initRecord() {
		const _record = window.mediajs.video();
		_record.create();
		_record
			.oncreate(() => {
				const mediaStream = _record.getMedisStream();
				console.log(mediaStream);
				previewVideo.current!.srcObject = mediaStream;
			})
			.onstop(() => {
				const _blob = _record.getMediaBlobs();
				const [chunk] = _blob;
				const blobProperty: BlobPropertyBag = Object.assign(
					{ type: chunk.type },
					{
						type: "video/mp4",
					},
				);
				const blob = new Blob(_blob, blobProperty);
				const url = URL.createObjectURL(blob);
				ipcRenderer.send("rv:download-record", url);
			});
		setRecord(_record);
	}

	function handleStartRecord() {
		console.log("handleStartRecord");
		isPause ? record.resume() : record.start();
		setIsPause(false);
		setIsRunning(true);
		ipcRenderer.send("rv:start-record");
	}

	function handlePauseRecord() {
		console.log("handlePauseRecord");
		record.pause();
		setIsPause(true);
		setIsRunning(false);
		ipcRenderer.send("rv:pause-record");
	}

	function handleStopRecord() {
		console.log("handleStopRecord");
		record.stop();
		setIsRunning(false);
		ipcRenderer.send("rv:stop-record");
	}

	function toggleMute(isMuted: boolean) {
		setIsMuted(isMuted);
	}

	return (
		<div className="recorderVideo">
			<video
				className="recorderVideoDom"
				ref={previewVideo}
				playsInline
				autoPlay
			/>
			<div className="recorderTools">
				{isRunning ? (
					<>
						<Button
							icon={<BsPause />}
							shape="circle"
							className="toolbarIcon playBtn"
							title="暂停"
							onClick={handlePauseRecord}
						/>
						<Button
							type="primary"
							danger
							icon={<BsFillStopFill />}
							shape="circle"
							className="toolbarIcon playBtn"
							title="停止"
							onClick={handleStopRecord}
						/>
						<Button
							icon={isMuted ? <BsMicMute /> : <BsMic />}
							shape="circle"
							className="toolbarIcon playBtn"
							title={isMuted ? "打开声音" : "禁音"}
							onClick={() => toggleMute(!isMuted)}
						/>
					</>
				) : (
					<Button
						type="primary"
						icon={<BsPlayFill />}
						shape="circle"
						className="toolbarIcon playBtn"
						title="开始"
						onClick={handleStartRecord}
					/>
				)}
			</div>
		</div>
	);
};

export default RecorderVideo;
