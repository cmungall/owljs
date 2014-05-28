var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owljs");

// have this available for evaluation of user functions
importPackage(Packages.org.semanticweb.owlapi.model);

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var sedFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');
    parser.addOption('n', 'number', 'Number', 'Number of axioms to remove.');
    parser.addOption('t', 'toOutputFormat', 'OWLOntologyFormat', 'output format (defaults to RDFXML)');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-remove-random-axioms OPTIONS [FUNCTION] OWLFILE\n");
        print("Removes axioms at random. For testing purposes");
        print("\nOptions:");
	print(parser.help());
	system.exit('-1');
    }

    var owl = new OWL();
    owl.addCatalog();

    if (options.toOutputFormat != null) {
        console.log("Setting format to "+options.toOutputFormat);
        owl.setDefaultFormat(options.toOutputFormat);
    }


    args.forEach(function(fn) { owl.loadFile(fn) } );

    if (options.load != null) {
        owl.log("Loading "+options.load);
    }

    var NUM = options.number;
    if (NUM == null) {
        NUM = 1;
    }

    var axioms = owl.getAllAxioms(null, false);
    var axl = axioms.length;
    console.log("#Axioms = "+axl);
    var rmAxioms = [];
    if (NUM >= axl) {
        console.warn("Will remove ALL axioms!");
    }

    var i=0;
    while (i < NUM) {
        axl = axioms.length;
        var ai = Math.floor(axl * Math.random());
        console.log("Removing #"+ai);
        rmAxioms.push(axioms[ai]);
        axioms.splice(ai, 1);
        i++;
    }
    console.log("Remove Axiom Count: "+rmAxioms.length);
    owl.removeAxioms(rmAxioms);

    owl.log("Saving to " + options.outputFile);
    owl.save(options.outputFile);
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
