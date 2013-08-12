var OWL = require("../lib/owl").OWL;
var fun = include("../lib/owl/fun");

importPackage(org.semanticweb.owlapi.io);

owl = new OWL();
owlinit(owl);
owl.loadOntology("test/caro.owl");

owl.idspace = 'CARO';
owl.lastId = 1; // CJM
owl.defaultSlotMap = { created_by : "GOC:cjm" }; // todo - dates
owl.currentFmt = OWLFunctionalSyntaxOntologyFormat; // todo - introspect this

print("Polluting...");
setClassVars();
print("DONE");

function t1() {

    print("TEST 1");
    var f = gen.generateXP(epithelial_cell,part_of,alveolus);
    currentFrame = f;
    print(f.render());
    print(f.toAxioms());
    //gen.add(f);
    return f;
}

require('ringo/shell').start();
