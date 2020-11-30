// Version 1.0.0 - Initial release
// Version 1.1.0 (2017-08-02) - Added cmdp function that returns promise instead of using callback
// Version 1.2.0 (2017-08-02) - Added Ajax monkey patch to emulate XMLHttpRequest over ZeroFrame API

export const enum CMD {
	INNER_READY = "innerReady",
	RESPONSE = "response",
	WRAPPER_READY = "wrapperReader",
	PING = "ping",
	PONG = "pong",
	DB_QUERY = "dbQuery",
	FEED_FOLLOW = "feedFollow",
	MUTE_ADD = "muteAdd",
	BIG_FILE_UPLOAD_INIT = "bigfileUploadInit",

	CERT_SELECT = "certSelect",
	CERT_ADD = "certAdd",

	CHANNEL_JOIN = "channelJoin",
	SERVER_INFO = "serverInfo",
	SITE_INFO = "siteInfo",
	SET_SITE_INFO = "setSiteInfo",
	SET_SERVER_INFO = "setServerInfo",
	SITE_PUBLISH = "sitePublish",

	FILE_GET = "fileGet",
	FILE_WRITE = "fileWrite",
	FILE_NEED = "fileNeed",
	FILE_LIST = "fileList",
	FILE_DELETE = "fileDelete",

	OPTIONAL_FILE_UNPIN = "optionalFileUnpin",
	OPTIONAL_FILE_PIN = "optionalFilePin",
	OPTIONAL_FILE_DELETE = "optionalFileDelete",
	OPTIONAL_FILE_INFO = "optionalFileInfo",
	OPTIONAL_HELP = "optionalHelp",
	OPTIONAL_HELP_REMOVE = "optionalHelpRemove",
	OPTIONAL_HELP_LIST = "optionalHelpList",

	USER_GET_SETTINGS = "userGetSettings",
	USER_SET_SETTINGS = "userSetSettings",

	WRAPPER_OPENED_WEBSOCKET = "wrapperOpenedWebsocket",
	WRAPPER_CLOSE_WEBSOCKET = "wrapperClosedWebsocket",
	WRAPPER_NOTIFICATION = "wrapperNotification",
	WRAPPER_GET_STATE = "wrapperGetState",
	WRAPPER_POP_STATE = "wrapperPopState",
	WRAPPER_PUSH_STATE = "wrapperPushState",
	WRAPPER_CONFIRM = "wrapperConfirm",
	WRAPPER_PROGRESS = "wrapperProgress",
	WRAPPER_SET_TITLE = "wrapperSetTitle",
	WRAPPER_PROMPT = "wrapperPrompt",
}

export type Callback = ((result: any) => void) | null;
export type Params = { [key: string]: any };

export interface Message {
	cmd: CMD;
	id?: number;
	to?: number;
	wrapper_nonce?: string;
	waiting_cb?: { [key: number]: Callback };
	result?: string;
	params?: Params;
}

export class ZeroFrame {
	waiting_cb: { [key: number]: Callback };
	wrapper_nonce: string;
	next_message_id: number;
	target: Window;

	constructor() {
		this.waiting_cb = {};
		this.wrapper_nonce = document.location.href.replace(
			/.*wrapper_nonce=([A-Za-z0-9]+).*/,
			"$1"
		);
		this.target = window.parent;
		this.connect();
		this.next_message_id = 1;
	}

	connect() {
		window.addEventListener("message", (e) => this.onMessage(e), false);
		this.cmd(CMD.INNER_READY);
	}

	onMessage({ data }: MessageEvent) {
		let message = data;
		let cmd = message.cmd;
		if (cmd === CMD.RESPONSE) {
			if (message.to && this.waiting_cb[message.to]) {
				let cb = this.waiting_cb[message.to];
				if (cb) cb(message.result);
				delete this.waiting_cb[message.to];
			} else {
				this.log("Websocket callback not found:", message);
			}
		} else if (cmd === CMD.WRAPPER_READY) {
			this.cmd(CMD.INNER_READY);
		} else if (cmd === CMD.PING) {
			this.response(message.id, CMD.PONG);
		} else if (cmd === CMD.WRAPPER_OPENED_WEBSOCKET) {
			this.onOpenWebsocket();
		} else if (cmd === CMD.WRAPPER_CLOSE_WEBSOCKET) {
			this.onCloseWebsocket();
		} else if (cmd === CMD.WRAPPER_POP_STATE) {
			this.onPopState(message.params);
		} else {
			this.onRequest(cmd, message);
		}
	}

	onRequest(cmd: CMD, message: Message) {
		this.log("Unknown request:", message, ". cmd: ", cmd);
	}

	response(to: number, result: string) {
		this.send({
			cmd: CMD.RESPONSE,
			to: to,
			result: result,
		});
	}

	cmd<T>(cmd: CMD, params: Params = {}, cb: Callback = null) {
		this.send(
			{
				cmd: cmd,
				params: params,
			},
			cb
		);
	}

	cmdp<T>(cmd: CMD, params: Params = {}): Promise<T> {
		return new Promise((resolve, reject) => {
			this.cmd(cmd, params, (res: any) => {
				if (res && res.error) {
					reject(res.error);
				} else {
					resolve(res);
				}
			});
		});
	}
	send(message: Message, cb: Callback = null) {
		message.wrapper_nonce = this.wrapper_nonce;
		message.id = this.next_message_id;
		this.next_message_id++;
		this.target.postMessage(message, "*");
		if (cb) {
			this.waiting_cb[message.id] = cb;
		}
	}

	log(...args: [any?, ...any[]]) {
		console.log.apply(console, args);
	}

	onOpenWebsocket() {
		this.log("Websocket open");
	}

	onCloseWebsocket() {
		this.log("Websocket close");
	}

	onPopState(state: HTMLAnchorElement) {
		this.log("Pop state");
	}
}
