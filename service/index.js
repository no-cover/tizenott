const message = require('./message.js');

function onStart() {
    message.init();
}

function onRequest() {
    
}

module.exports = {
    onStart: onStart,
    onRequest: onRequest
};
