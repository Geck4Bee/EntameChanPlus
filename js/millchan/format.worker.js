import { formatter } from "Util";

onmessage = event => {
    let body = event.data.body,
        max_body_length = event.data.max_body_length;
        self.origin = event.data.origin;

    let blockquote = formatter(body, max_body_length);
    self.postMessage({ blockquote: blockquote, workID: event.data.workID})
};