// To use this conf:
//
// cd uberon
// owljs-repl -i load-uberon-edit.js uberon.owl

owl.config.idspace = 'UBERON';
owl.config.lastId = 10000; // CJM
owl.defaultSlotMap = { created_by : "GOC:cjm" }; // todo - dates
owl.config.defaultFormat = new org.semanticweb.owlapi.io.OWLFunctionalSyntaxOntologyFormat(); // todo - introspect this

print("Welcome, CJM");
