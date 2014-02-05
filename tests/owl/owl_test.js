var {OWL} = require("owljs");
var assert = require("assert");

var matcher;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

function init() {
    if (owl == null) {
        owl = new OWL();
        //repl.owlinit(owl);
        owl.loadOntology("tests/data/ceph.owl");
    }
}

exports.testOps = function() {
    init();
    var objs = owl.grepObjects(
        function(x,owl) {
            return /tentacle/.test(owl.getLabel(x));
        }
    );
    console.log("#objs = "+objs.length);
    print(objs);
    assert.equal(6, objs.length);


    var axs = owl.grepAxioms(
        function(x,owl) {
            return !x.isLogicalAxiom()
        }
    );
    console.log("#annotation ax = "+axs.length);
    assert.equal(axs.length, 7370);
};


exports.testReasoning = function() {
    init();
    var organ = owl.find("organ");
    var part_of = owl.find("part of");
    var tentacle = owl.find("tentacle");
    var cartilage = owl.find("cartilage");

    var supsDirect =
        owl.getInferredSuperClasses( tentacle, true );
    assert.equal(supsDirect.length, 1);

    var supsDirectReflexive =
        owl.getInferredSuperClasses( tentacle, true, true );
    assert.equal(supsDirectReflexive.length, 2);

    var sups =
        owl.getInferredSuperClasses( tentacle, false );
    assert.equal(sups.length, 7);

    var tps =
        owl.getInferredSubClasses( owl.someValuesFrom(part_of, tentacle) );
    assert.equal(tps.length, 13);

    var xs =
        owl.getInferredSubClasses( 
            owl.intersectionOf( organ,
                                owl.someValuesFrom(part_of, cartilage) )
        );
    assert.equal(xs.length, 2);
};



if (require.main == module) {
    require("test").run(exports);
}
