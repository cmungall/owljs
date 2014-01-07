var {OWL} = require("../lib/owl");
var fun = include("../lib/owl/fun");
var assert = require("assert");


exports.testLoad = function() {
    
    owl = new OWL(); // defined in fun
    owlinit(owl);
    owl.loadOntology("test/caro.owl");

    owl.config.defaultFormat = new org.semanticweb.owlapi.io.OWLFunctionalSyntaxOntologyFormat(); // todo - introspect this
    owl.config.lastId = 1000;
    owl.config.idspace = 'CL';

    var c1 = owl.find("epithelium");
    var c2 = owl.find("anatomical structure");
    var ax = subClassOf(c1,c2);
    console.log(ax);
    setClassVars();
    console.log("EP="+o.epithelium);
    console.log("PO="+o.part_of);
    console.log("ORG="+o.compound_organ);

    var fr = owl.generateXP(o.epithelium,o.part_of,o.compound_organ);
    //console.log(fr.render());
    console.log(fr.toAxioms());
    owl.add(fr.toAxioms());

    owl.save('test/foo.owl');
    
};

if (require.main == module) {
    require("test").run(exports);
}
