var {OWL} = require("owl");
var assert = require("assert");

importPackage(java.io);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);

exports.testJSON = function() {
    var owl = new OWL();
    owl.loadOntology("tests/data/ceph.owl");
    
    var json = owl.ontologyToAxiomaticJSON();
    print(JSON.stringify(json, null, ' '));
};

if (require.main == module) {
    require("test").run(exports);
}
