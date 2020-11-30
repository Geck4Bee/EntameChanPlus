// @ts-ignore
import Worker from "./format.worker";

interface Work {
	workID: string;
}

export class FormatWorkerManager {
	refs: { [key: string]: any } = {};
	workID: number = 0;
	inactiveWorkers: Worker[] = [];
	workQueue: Work[] = [];

	constructor(numOfWorkers: number) {
		while (numOfWorkers--) {
			this.initWorker();
		}
	}
	private initWorker() {
		let worker = new Worker();
		worker.onmessage = (event: MessageEvent) => {
			this.onWorkDone(worker, event.data.workID, event.data.blockquote);
		};
		this.inactiveWorkers.push(worker);
	}
	private newWorkID() {
		return `w${this.workID++}`; //numbers can't be object keys
	}

	private onWorkDone(worker: Worker, workID: number, blockquote: string) {
		this.refs[workID].vueObj._data.body = this.refs[workID].vueObj.ID2cite(
			this.refs[workID].post,
			blockquote
		);
		this.refs[workID].vueObj.$emit("update-height");
		delete this.refs[workID];
		if (this.workQueue.length > 0) worker.postMessage(this.workQueue.shift());
		else this.inactiveWorkers.push(worker);
	}

	public doWork(data: Work, vueObj: any, post: any) {
		let ID = this.newWorkID();
		this.refs[ID] = { vueObj: vueObj, post: post };
		data.workID = ID;

		if (this.inactiveWorkers.length == 0) this.workQueue.push(data);
		else this.inactiveWorkers?.shift()?.postMessage(data);
	}
}
