var {OWL} = require("owljs");
var {Linky} = require("owljs/linky");
var assert = require("assert");

var linky;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

function init() {
    if (owl == null) {
        owl = new OWL();
        //repl.owlinit(owl);
        owl.loadOntology("tests/data/linkytest.owl");
    }
    linky = new Linky(owl);
}

exports.testCollapse = function() {
    init();

    //print("X="+linky.getSource);
    linky.decluster();
};

if (require.main == module) {
    require("test").run(exports);
}
