var {OWL} = require("owljs");
var assert = require("assert");

var owl;

importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);
importPackage(Packages.org.semanticweb.owlapi.util);
importPackage(Packages.org.coode.owlapi.manchesterowlsyntax);
importPackage(Packages.org.coode.owlapi.obo.parser);
importPackage(org.semanticweb.owlapi.apibinding);
importPackage(org.semanticweb.elk.owlapi);



exports.testAdd = function() {
    owl = new OWL();
    owl.loadOntology("tests/data/ceph.owl");
    var src = owl.getOntology();
    owl.createOntology("http://x.org", [src] );
    assert.equal(owl.getOntology().getImportsClosure().size(), 2);
};

exports.testAddToExisting = function() {
    owl = new OWL();
    owl.createOntology("http://x.org");
    owl.loadOntology("tests/data/ceph.owl", {addToImport:true});
    assert.equal(owl.getOntology().getImportsClosure().size(), 2);
};


if (require.main == module) {
    require("test").run(exports);
}
