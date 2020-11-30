import { Config } from "Millchan/config.ts";
import { Viewer } from "Millchan/viewer.ts";
import { Engine } from "Millchan/millchan.ts";
import { FormatWorkerManager } from "Millchan/FormatWorkerManager.ts";

window.config = new Config();
window.viewer = new Viewer();
window.Millchan = new Engine();
window.formatWorkerManager = new FormatWorkerManager(config.max_format_workers);