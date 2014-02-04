var {OWL} = require("owl");
var {Obol} = require("owl/obol");
var repl = require("owl/repl");
var assert = require("assert");

var owl;
var obol

importPackage(Packages.org.semanticweb.owlapi.model);

function init() {
    if (owl == null) {
        owl = new OWL();
        //repl.owlinit(owl);
        owl.loadOntology("test/data/clmin.ofn");
    }
}

exports.testOps = function() {
    init();
    repl.owlinit(owl);
    var o = repl.o;
    obol = new Obol(owl, repl.o);
    owl.config.isCompareClasses = true;
    require("owl/obol/anatomy");
    var str = "cell of brain";
    var results = obol.parse(str, null);
    repl.pp(results);
    assert.equal(results.length, 1);
    //var x = results[0];

    var c = o.epithelial_cell_of_nephron;
    var results = obol.parseClass(c);
    repl.pp(results);
    assert.equal(results.length, 1);

    //obol.setIgnoreDefinedClasses(true);
    results = obol.parseSubClasses(o.epithelial_cell, null);
    repl.pp(results);
    assert.equal(results.length, 127);
    
};



if (require.main == module) {
    require("test").run(exports);
}
