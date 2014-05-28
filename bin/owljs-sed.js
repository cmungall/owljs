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
    parser.addOption('v', 'invertMatch', null, 'Invert (negate) match');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');
    parser.addOption('f', 'sedFunctionFile', 'File', 'file containing js that evals to sedFunc. If specified no FUNCTION arg is specified');
    parser.addOption('e', 'sedEntities', null, 'True if entities (classes, individuals, properties) are to be sedped, no axioms ');
    parser.addOption('m', 'match', 'Regexp', 'regular expression applied to serialization of each axiom. E.g. /epithelium/. If specified, no FUNCTION arg is specified.');
    parser.addOption('t', 'toOutputFormat', 'OWLOntologyFormat', 'output format (defaults to RDFXML)');
    parser.addOption('j', 'jsFrames', null, 'writes output as js frames. TODO');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-sed OPTIONS [FUNCTION] OWLFILE\n");
        print("Search and replace axioms from an ontology using a custom function. See owl.sedAxioms() for more detauls");
        print("\nOptions:");
	print(parser.help());
        print("\nExample:");
        print("owljs-sed 'function(ax){ TODO return ax.isLogicalAxiom() }' foo.owl");
        print("\nExample: (use saved function, negate query, write in functional notation)");
        print("owljs-sed -v -t ofn -f lib/owlfunc/axiomIsLogical.js foo.owl");
	system.exit('-1');
    }

    var owl = new OWL();
    owl.addCatalog();

    if (options.toOutputFormat != null) {
        console.log("Setting format to "+options.toOutputFormat);
        owl.setDefaultFormat(options.toOutputFormat);
    }

    if (options.match != null) {
        var mf = eval(options.match);
        sedFunc = function(ax) { return mf.test(ax.toString()); };
    }

    if (options.sedFunctionFile != null) {
        var fs = require("fs");
        sedFunc = eval(fs.read(options.sedFunctionFile));
    }

    if (sedFunc == null) {
        var sedFuncStr = args.shift();
        sedFunc = eval(sedFuncStr);
    }

    args.forEach(function(fn) { owl.loadFile(fn) } );

    if (options.load != null) {
        owl.log("Loading "+options.load);
    }

    if (options.sedEntities) {

        var filteredObjects = owl.sedObjects(sedFunc, options.invertMatch, true);
        owl.log("#filteredObjects = " + filteredObjects.length);

        if (options.jsFrames) {
            var repl = require("owljs/repl");
            repl.owlinit(owl);
            for (var k in filteredObjects) {
                var obj = filteredObjects[k];
                print(repl.render(owl.getFrame(obj)));
            }        
        }
        else {
            owl.log("Saving to " + options.outputFile);
            owl.save(options.outputFile);
        }
    }
    else {

        var newAxioms = owl.sedAxioms(sedFunc, options.invertMatch, true);
        owl.log("#newAxioms = " + newAxioms.length);

        if (options.jsFrames) {
            var repl = require("owljs/repl");
            repl.owlinit(owl);
            //repl.owl = owl;
            for (var k in filteredAxioms) {
                var ax = filteredAxioms[k];
                print(repl.render(ax));
            }        
        }
        else {
            owl.log("Saving to " + options.outputFile);
            owl.save(options.outputFile);
        }
    }
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
