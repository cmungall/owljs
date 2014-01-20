var {OWL} = require("owl");
var {dlmatch} = require("owl/dlmatch");
var assert = require("assert");
var repl = require("owl/repl");

var matcher;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

function init() {
    if (owl == null) {
        owl = new OWL();
        repl.owlinit(owl);
        owl.loadOntology("test/data/ceph.owl");
        matcher = new dlmatch(owl);
    }
}

exports.testMatchSubClassOf = function() {
    init();
    var part_of = owl.find("part of");
    //var tentacle = owl.find("tentacle");
    find(
        {
            a : OWLSubClassOfAxiom,
            subClass: "?x",
            superClass : {
                property : part_of,
                filler : "?y"
            }
        });
};

exports.testMatchComplex = function() {
    init();
    var part_of = owl.find("part of");
    find( {
        a : OWLEquivalentClassesAxiom,
        classExpressions : 
        [
            {
                operands: [
                    "?genus",
                    {
                        property: "?p",
                        filler: "?y"
                    }
                ]
            },
            "?c",
        ]                
    });
};

function find(q, numExpected) {
    print("QUERY:");
    repl.pp(q);
    var matches = matcher.find(q);
    print("#match = "+matches.length);
    if (numExpected != null) {
        assert.equal(matches.length, numExpected)
    }
    matches.forEach(repl.pp);
}


if (require.main == module) {
    require("test").run(exports);
}
