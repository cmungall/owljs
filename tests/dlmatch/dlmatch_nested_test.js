var {OWL} = require("owljs");
var {DLMatch} = require("owljs/dlmatch");
var assert = require("assert");
var repl = require("owljs/repl");

var matcher;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

function init() {
    if (owl == null) {
        owl = new OWL();
        repl.owlinit(owl);
        owl.loadOntology("tests/data/ceph.owl");
        matcher = new DLMatch(owl);
    }
}

exports.testNested = function() {
    init();
    
    var o = repl.o;
    repl.owlinit(owl);
    var nc = repl.mkClass("cell of tentacle of beak");
    var tob = owl.intersectionOf(o.tentacle, 
                               owl.someValuesFrom(o.part_of, 
                                                  owl.intersectionOf(o.beak,
                                                                     owl.someValuesFrom(o.part_of,
                                                                                        o.head))));
    var cell = owl.intersectionOf(o.cell,
                                  owl.someValuesFrom(o.part_of,
                                                     tob));
    owl.add( owl.equivalentClasses(nc, cell) );

    find(
        matcher.equivalentClassesMatch(
            nc,
            matcher.intersectionOfMatch("?genus",
                                        "?svf")
        ),
        1,
        {
            genus: "cell"
        });

    find(
        matcher.equivalentClassesMatch(
            "?nc",
            matcher.intersectionOfMatch("?c",
                                        matcher.someValuesFromMatch(o.part_of,
                                                                    matcher.intersectionOfMatch("?t",
                                                                                                matcher.someValuesFromMatch("?rel","?z"))))
        ),
        1,
        {
            nc: "cell of tentacle of beak",
            c: "cell",
            t: "tentacle",
        });

};


// Arguments:
//  - q : queryTemplate
//  - numExpected: if present, number of results must match this
//  - mustContain: if present, the result set must contain at least one binding object to match this
function find(q, numExpected, mustContain) {
    //print("QUERY:");
    repl.pp(q);
    var matches = matcher.find(q);
    print("#match = "+matches.length);
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
