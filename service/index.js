var message = require('./message.js');


module.exports.onStart = function () {
	message.init();
}

module.exports.onRequest = function () {

}

module.exports.onExit = function () {

}
