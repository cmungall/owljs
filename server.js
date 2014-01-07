// We include server.js in the top level to simplify deployment on heroku

var system = require('system');
addToClasspath('./jars/owltools-runner-all.jar');
var OWL = require('./lib/owl.js').OWL;

var stick = require('stick');
var fs = require('fs');
var response = require('ringo/jsgi/response');
var httpclient = require('ringo/httpclient');

var owl = new OWL();

var session = {
    foo: 1,
    owl: owl
}

owl.loadFile("test/caro.owl");

var app = exports.app = new stick.Application();

app.configure('route');
app.configure('params');
app.configure('static');

var owlservices = require('./lib/owl/owlservices.js');
var addons = require('./lib/owl/addons.js');

print("owl is :"+session.owl);
var myOwlservices = new owlservices.OWLServices(app,session);
new addons.AddOns(app,session);
//myOwlservices.install();

function main(args) {
    print("args="+args);
    if (false) {
        while(args.length > 0) {
            var arg = args.shift();
            if (arg == "--") {
                break;
            }
            print("Arg="+arg);
        }
    }
    require('ringo/httpserver').main(module.id);
}

// INITIALIZATION
// Can set port from command line. E.g. --port 8080
if (require.main == module) {
   main(system.args);
}
