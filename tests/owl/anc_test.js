var {OWL} = require("owljs");
var assert = require("assert");

var matcher;
var owl;

importPackage(Packages.org.semanticweb.owlapi.model);

function init() {
    owl = new OWL();
    //repl.owlinit(owl);
    owl.loadOntology("tests/data/ceph.owl");
}

function render(c) {
    return c + '"' + owl.getLabel(c) + '"';
}


exports.testIndirect = function() {
    init();
    var organ = owl.find("organ");
    var part_of = owl.find("part of");
    var tentacle = owl.find("tentacle");
    var cartilage = owl.find("cartilage");
    var mco = owl.find("multi-cellular organism");

    var tps =
        owl.getInferredSubClasses( owl.someValuesFrom(part_of, tentacle) );
    assert.equal(tps.length, 13);

    var nFails = 0;
    for (var i in tps) {
        console.log(render(tp));
        var tp = tps[i];
        ancs = owl.getAncestorsOver(tp, part_of, false, true);
        ancs.forEach(function(c) {
            //console.log(" A="+render(c));
        });
        if (ancs.indexOf(tentacle) == -1) {
            nFails++;
            console.warn("NO TENTACLE FOR "+tp);
        }
        if (ancs.indexOf(mco) == -1) {
            console.warn("NO "+mco+" FOR "+tp);
            nFails++;
        }
    }
    assert.equal(nFails, 0);
};


exports.testDidirect = function() {
    init();
    var organ = owl.find("organ");
    var part_of = owl.find("part of");
    var tentacle = owl.find("tentacle");
    var cartilage = owl.find("cartilage");
    var mco = owl.find("multi-cellular organism");

    var tps =
        owl.getInferredSubClasses( owl.someValuesFrom(part_of, tentacle), true );
    assert.equal(tps.length, 13);

    var nFails = 0;
    var n2 = 0;
    for (var i in tps) {
        console.log(render(tp));
        var tp = tps[i];
        ancs = owl.getAncestorsOver(tp, part_of, true, false);
        console.log("|Ancs|="+ancs.length);
        ancs.forEach(function(c) {
            console.log(" A="+render(c));
        });
        if (ancs.indexOf(tentacle) == -1) {
            n2++;
            console.warn("NO TENTACLE FOR "+tp);
        }
        if (ancs.indexOf(mco) > -1) {
            console.warn("UNEXPECTED "+mco+" FOR "+tp);
            nFails++;
        }
    }
    assert.equal(nFails, 0);
    assert.equal(n2, 8);
};




if (require.main == module) {
    require("test").run(exports);
}
