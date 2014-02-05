var {OWL} = require("owljs");
var {Learner} = require("owljs/learner");
var assert = require("assert");
var repl = require("owljs/repl");

var learner;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

function init() {
    if (owl == null) {
        owl = new OWL();
        repl.owlinit(owl);
        var owlFile = "test/learner/mptest.ofn";
        owl.loadOntology(owlFile);
        learner = new Learner(owl);
        learner.owlFile = "mptest.ofn";
    }
}

exports.testLCS = function() {
    init();
    var c = owl.find("weakness");
    var d = owl.find("abnormal striatum morphology");
    print("C="+c);
    print("D="+d);
    learner.prepLCS(c,d);
    print(learner.renderConfig());
};



if (require.main == module) {
    require("test").run(exports);
}
