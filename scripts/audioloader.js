function AudioLoader(context) {
	this.context = context;
};

AudioLoader.prototype.load = function(urls, callback) {
	const buffers = [];
	for(let i = 0; i < urls.length; i++) {
		fetch(urls[i])
		.then(response => response.arrayBuffer())
		.then(buf => this.context.decodeAudioData(buf))
		.then(buf => {
			buffers.push(buf);
			if(i == urls.length - 1) {
				callback(buffers);
			}
		});
	}
}

export default AudioLoader;