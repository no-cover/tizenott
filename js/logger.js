App = window.App || {};
App.Log = (function Log() {

    function print(msg) {
        console.log(msg);
        
    }
    function printAlert(msg){
        alert(msg);
    }
    return {
        print,
        printAlert
    };

}());
