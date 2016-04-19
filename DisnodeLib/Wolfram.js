"use strict"

class Wolfram {
	constructor(wolframapi){
		this.wolframapi = wolframapi;
		console.log("Wolfram constructor: " + wolframapi);
	}
	
	//Makes a request based on params (empty = normal lookup, int = limited lookup, img = images only, and you can combine)
	//callback sends a formatted message
	//imageIdentity is a string value use to define what its looking for in the parms to lookup and img ex 'img' 'Image'
	makeRequest(parms, imageIdentity, cb){
		console.log("Wolfram request: " + this.wolframapi);
		console.log("Making a wolfram request with Q: " + parms[0] + " Options: " + parms[1] + " " + parms[2]);
		var text = '```';
		if (parms[1] == imageIdentity && parms[2] == parseInt(parms[2])){
			this.wolframapi.query(parms[0], function (err, result) {
				if (err) throw err;
				for (var i = 0; i < result.length; i++) {
					if (i < parseInt(parms[2])){text = text + result[i].subpods[0].image + ' \n';}
				}
				text = text + '```'
				cb(text);
			});
		}else if (parms[2] == imageIdentity && parms[1] == parseInt(parms[1])){
			this.wolframapi.query(parms[0], function (err, result) {
				if (err) throw err;
				for (var i = 0; i < result.length; i++) {
					if (i < parseInt(parms[1])){text = text + result[i].subpods[0].image + ' \n';}
				}
				text = text + '```'
				cb(text);
			});
		}else if(parms[1] == imageIdentity){
			this.wolframapi.query(parms[0], function (err, result) {
				if (err) throw err;
				for (var i = 0; i < result.length; i++) {
					text = text + result[i].subpods[0].image + ' \n';
				}
				text = text + '```'
				cb(text);
			});
		}else if (parms[1] == parseInt(parms[1])){
			this.wolframapi.query(parms[0], function (err, result) {
				if (err) throw err;
				for (var i = 0; i < result.length; i++) {
					if (i < parseInt(parms[1])){text = text + result[i].subpods[0].text + '\n';}
				}
				text = text + '```'
				cb(text);
			});
		}else if (!parms[1] && !parms[2]){
			this.wolframapi.query(parms[0], function (err, result) {
				if (err) throw err;
				for (var i = 0; i < result.length; i++) {
					text = text + result[i].subpods[0].text + '\n';
				}
				text = text + '```'
				cb(text);
			});
		}else {
			cb("There was an issue with the lookup...");
		}
	}
}

module.exports.Wolfram = Wolfram;
