include("owl/repl");
var {OWL} = require("owl");
var {DLMatch} = require("owl/dlmatch");
var assert = require("assert");
var fs = require('fs');

var matcher;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

exports.testMakeOntology = function() {
    owl = new OWL();
    owlinit(owl);
    //eval(fs.read("test/repl/mkont.js"));
    load("test/repl/mkont.js");
};


if (require.main == module) {
    require("test").run(exports);
}
