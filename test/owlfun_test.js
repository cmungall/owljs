var OWL = require("../lib/owl").OWL;
var fun = include("../lib/owl/fun");
var assert = require("assert");

importPackage(java.io);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);

exports.testLoad = function() {
    
    owl = new OWL(); // defined in fun
    owlinit(owl);
    owl.loadOntology("test/caro.owl");
    var c1 = owl.find("epithelium");
    var c2 = owl.find("anatomical structure");
    var ax = subClassOf(c1,c2);
    console.log(ax);
    setClassVars();
    console.log("EP="+o.epithelium);
};

if (require.main == module) {
    require("test").run(exports);
}
