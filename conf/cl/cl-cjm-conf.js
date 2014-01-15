// To use this conf:
//
// cd cell-ontology/src/ontology
// owljs-repl -i load-cl-edit.js cl-edit.owl

owl.config.idspace = 'CL';
owl.config.lastId = 10000; // CJM
owl.defaultSlotMap = { created_by : "GOC:cjm" }; // todo - dates
owl.config.defaultFormat = new org.semanticweb.owlapi.io.OWLFunctionalSyntaxOntologyFormat(); // todo - introspect this

print("Welcome, CJM");
