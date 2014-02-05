include("owljs/repl");
var {OWL} = require("owljs");
var {DLMatch} = require("owljs/dlmatch");
var assert = require("assert");
var fs = require('fs');

var matcher;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

exports.testMakeOntology = function() {
    owl = new OWL();
    owlinit(owl);
    //eval(fs.read("test/repl/mkont.js"));
    load("tests/repl/mkont.js");
};


if (require.main == module) {
    require("test").run(exports);
}
