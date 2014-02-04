var {OWL} = require("../lib/owl");
var assert = require("assert");

importPackage(java.io);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);

exports.testLoad = function() {
    var owl = new OWL();
    owl.loadOntology("tests/caro.owl");
    var tt = owl.find("epithelium");
    console.log("EP="+tt);
    var ttf = owl.getFrame(tt);
    console.log(ttf);
    var axioms = owl.grepAxioms( function(a) { return a instanceof OWLAnnotationAssertionAxiom } );
    console.log("#Ann axioms=" + axioms.length);
};

if (require.main == module) {
    require("test").run(exports);
}
