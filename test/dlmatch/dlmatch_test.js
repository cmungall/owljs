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

exports.testMatchExistential = function() {
    init();
    var part_of = owl.find("part of");
    //var tentacle = owl.find("tentacle");
    find(
        {
            a : OWLSubClassOfAxiom,
            subClass: "?p",
            superClass : {
                property : part_of,
                filler : "?w"
            }
        },
        218,
        {
            p: "tentacle pad",
            w: "tentacle"
        }
    );
};

exports.testMatchIntersection = function() {
    init();
    var part_of = owl.find("part of");
    find( 
        {
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
        },
        25,
        {
            c: "ovary",
            p: "part of",
            y: "female reproductive system",
            genus: "gonad",
        }
    );
};

// Arguments:
//  - q : queryTemplate
//  - numExpected: if present, number of results must match this
//  - mustContain: if present, the result set must contain at least one binding object to match this
function find(q, numExpected, mustContain) {
    //print("QUERY:");
    repl.pp(q);
    var matches = matcher.find(q);
    //print("#match = "+matches.length);
    if (numExpected != null) {
        assert.equal(matches.length, numExpected)
    }
    matches.forEach(repl.pp);
    if (mustContain != null) {
        for (var j in mustContain) {
            var v = mustContain[j];
            if (!(v instanceof OWLObject)) {
                mustContain[j] = owl.find(v);
                console.log("Mapped "+v+" ==> "+mustContain[j]);
            }
            if (mustContain[j] == null) {
                console.error("No such entity: "+v);
                assert.isTrue(false);
            }
        }
        var ok = false;
        for (var k in matches) {
            var m = matches[k];
            var ok2 = true;
            for (var j in mustContain) {
                if (m[j] != mustContain[j]) {
                    ok2 = false;
                    break;
                }
            }
            if (ok2) {
                ok = true;
                break;
            }
        }
        assert.isTrue(ok);
    }
}


if (require.main == module) {
    require("test").run(exports);
}
