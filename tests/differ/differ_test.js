var {OWL} = require("owljs");
var {Differ} = require("owljs/differ");
var assert = require("assert");

var differ;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

function init() {
    if (owl == null) {
        owl = new OWL();
        //repl.owlinit(owl);
        owl.loadOntology("tests/data/ceph.owl");
    }
}

exports.testDiffs = function() {
    init();
    var ov = require("owljs/vocab/obo");
    var repl = require("owljs/repl");
    var owlB = new OWL();
    repl.owlinit(owlB);
    owlB.loadOntology("tests/data/ceph.owl");

    // simulate creating a class in new ontology
    var c = repl.mkClass( "test" );
    var tentacle = owl.find("tentacle");
    var beak = owl.find("beak");
    owlB.add( owl.declaration(c) );
    owlB.add( ov.definitionAssertion(owl, c, "this is a test", ["FOO:BAR"]) );
    var axs = owlB.getAllAxioms(c);
    assert.equal( axs.length, 2);

    // adding an axiom to existing class in new
    owlB.add( owl.subClassOf(tentacle, c) );
   
    // simulate removing axioms from original ontology by
    // adding them in prior to diff; in this case
    // we assume the ontology originally had a nonsense
    // axiom, <beak isA tentacle>
    owl.add( owl.subClassOf(beak, tentacle) );

    //var ncA = owl.getClasses();
    //var ncB = owlB.getClasses();
    //assert.equal(ncA.length, ncB.length-1);

    //var tA = owl.find("tentacle");
    //var tB = owlB.find("tentacle");
    //assert.isTrue(tA.equals(tB));
    //assert.isTrue(tA == tB);

    differ = new Differ();
    var md = differ.getDiffsAsMarkdown(owl, owlB, false, false);
    print(md);

};

if (require.main == module) {
    require("test").run(exports);
}
