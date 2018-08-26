function AudioLoader(context) {
	this.context = context;
};

AudioLoader.prototype.load = function(urls, callback) {
	Promise.all(
		urls.map(url => 
			fetch(url)
				.then(response => response.arrayBuffer())
				.then(buf => this.context.decodeAudioData(buf)))
		).then(buffers => {
			callback(buffers);
		});
}

export default AudioLoader;