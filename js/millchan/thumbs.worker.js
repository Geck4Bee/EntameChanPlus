import jimp from "jimp";
const jpeg = require('jpeg-js');
const exifParser = require('exif-parser');

onmessage = event => {
	let buffer = event.data.buffer,
		width = event.data.new_width,
		height = event.data.new_height,
		file_type = event.data.file_type,
		thumbnail_quality = event.data.thumbnail_quality,
		jpegjs_max_memory = event.data.jpegjs_max_memory;

	let rotation = 0;
	if (file_type === "image/jpeg") {
		const exif = exifParser.create(buffer).parse();
		// TODO: handle mirrored cases
		switch (exif.tags.Orientation) {
			case 8:
				rotation = 90;
				break;
			case 3:
				rotation = 180;
				break;
			case 6:
				rotation = 270;
				break;
		}
		buffer = jpeg.decode(buffer, {
			maxMemoryUsageInMB: jpegjs_max_memory,
		})
	}

	jimp.read(buffer).then(result => {
		result
			.rotate(rotation)
			.resize(width, height)
			.quality(thumbnail_quality)
			.getBase64(file_type, (err, b64data) => {
				self.postMessage({
					err,
					b64data,
					file: event.data.file,
					file_type: event.data.file_type,
					objectURL: event.data.objectURL,
				});
			});
	});
};
