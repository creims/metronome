function AudioLoader(context, urls, callback) {
	this.context = context;
	this.toLoad = urls;
	this.doneLoading = callback;
	this.audioBuffers = [];
	this.loadCount = 0;
};

AudioLoader.prototype.loadAudio = function(url) {
	fetch(url)
		.then(response => response.arrayBuffer())
		.then(buf => this.context.decodeAudioData(buf))
		.then(buf => {
			this.audioBuffers.push(buf);
			this.loadCount++;
			if(this.loadCount >= this.toLoad.length) {
				this.doneLoading(this.audioBuffers);
			}
		});
}

AudioLoader.prototype.loadAll = function() {
	for(let url of this.toLoad) {
		this.loadAudio(url);
	}
}

export default AudioLoader;