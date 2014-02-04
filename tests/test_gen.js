var repl = include("owl/repl");
var assert = require("assert");

exports.testGen = function() {
    
    var owl = createOntology("http://x.org");

    owl.log(ont());

    owl.config.defaultFormat = new org.semanticweb.owlapi.io.OWLFunctionalSyntaxOntologyFormat(); // todo - introspect this
    owl.config.lastId = 1000;
    owl.config.idspace = 'TEST';

    mkClass({
        label : "nervous system cell",
    });
    console.log(o.nervous_system_cell);
    var ax = mkDisjointUnion(o.nervous_system_cell, ["neuron", "glial cell"]);
    pp(ax);
    print("NSC="+o.nervous_system_cell);
    print(o.neuron);
    var fr = owl.getFrame(o.nervous_system_cell);
    print(fr.isFrame);
    print(fr.slotMap);
    pp(fr);

};

if (require.main == module) {
    require("test").run(exports);
}
