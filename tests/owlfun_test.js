var fun = include("../lib/repl");
var assert = require("assert");


exports.testLoad = function() {
    
    var owl = loadowl("test/caro.owl");

    owl.log(ont());

    owl.config.defaultFormat = new org.semanticweb.owlapi.io.OWLFunctionalSyntaxOntologyFormat(); // todo - introspect this
    owl.config.lastId = 1000;
    owl.config.idspace = 'CL';

    // basic operations
    var c1 = owl.find("epithelium");
    var c2 = owl.find("anatomical structure");
    var ax = subClassOf(c1,c2);
    add(ax);
    expandMacros();


    console.log(ax);

    setClassVars();
    console.log("EP="+o.epithelium);
    console.log("PO="+o.part_of);
    console.log("ORG="+o.compound_organ);
    ax = subClassOf(o.epithelium, o.anatomical_structure);

    var fr = owl.generateXP(o.epithelium,o.part_of,o.compound_organ);
    //console.log(fr.render());
    console.log(fr.toAxioms());
    owl.add(fr.toAxioms());

    owl.save('test/foo.owl');

    console.log(omn("'epithelium' and part_of some 'anatomical structure'"));
    console.log(omn("CARO_0000066 and part_of some 'anatomical structure'"));
    console.log(omn("<http://purl.obolibrary.org/obo/CARO_0000066> and part_of some 'anatomical structure'"));
    console.log(omn(o.epithelium + And + o.part_of + Some + o.anatomical_structure));

    x("-a epithelium");

    cdef({
        label : "unilaminar cell",
        subClassOf: intersectionOf(o.cell, someValuesFrom(o.part_of, o.unilaminar_epithelium))
    });
    var obj = getObj();
    console.log(obj);
    print(obj);
    log("Rendering...");
    pp(obj);
    obj.stamp();
    obj.toAxioms().forEach(pp);

};

if (require.main == module) {
    require("test").run(exports);
}
