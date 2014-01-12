var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owl");

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('v', 'invertMatch', null, 'Invert (negate) match');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');
    parser.addOption('m', 'match', 'Regexp', 'regular expression applied to serialization of each axiom. E.g. /epithelium/. If specified, no FUNCTION arg is specified.');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-grep OPTIONS [FUNCTION] OWLFILE\n");
        print("Filters axioms from an ontology using a custom function. See owl.grepAxioms() for more detauls");
        print("\nOptions:");
	print(parser.help());
        print("\nExample:");
        print("owljs-grep 'function(ax){ return ax.isLogicalAxiom() }' foo.owl");
	system.exit('-1');
    }

    var owl = new OWL();

    if (options.match != null) {
        var mf = eval(options.match);
        grepFunc = function(ax) { return mf.test(ax.toString()); };
    }

    if (grepFunc == null) {
        var grepFuncStr = args.shift();
        grepFunc = eval(grepFuncStr);
    }

    args.forEach(function(fn) { owl.loadFile(fn) } );

    if (options.load != null) {
        owl.log("Loading "+options.load);
    }
    //owl.log(args);
    var filteredAxioms = owl.grepAxioms(grepFunc, options.invertMatch, true);
    owl.log("#filteredAxioms = " + filteredAxioms.length);

    owl.log("Saving to " + options.outputFile);
    owl.save(options.outputFile);
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
