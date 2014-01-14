var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owl");
var {Obol} = require("owl/obol");

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var re = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('q', 'query', 'String', 'sentence to parse');
    parser.addOption('r', 'rootClass', 'Class', 'root class to restrict search space');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');
    parser.addOption('t', 'toOutputFormat', 'OWLOntologyFormat', 'output format (defaults to RDFXML)');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-cgrep OPTIONS [FUNCTION] OWLFILE\n");
        print("Filters class from an ontology using a custom function. Compare with owljs-grep, which greps axioms");
        print("\nOptions:");
	print(parser.help());
        print("\nExample:");
        print("owljs-cgrep /epithelium/ foo.owl");
	system.exit('-1');
    }

    var owl = new OWL();

    if (options.toOutputFormat != null) {
        console.log("Setting format to "+options.toOutputFormat);
        owl.setDefaultFormat(options.toOutputFormat);
    }

    args.forEach(function(fn) { owl.loadFile(fn) } );

    if (options.load != null) {
        owl.log("Loading "+options.load);
    }

    var obol = new Obol(owl);

    require("owl/obol/phenotype");
    var repl = require("owl/repl");
    repl.owlinit(owl);

    var results;
    if (options.query != null) {
        var str = options.query;
        results = obol.parse(str, null, repl.o);
        repl.pp(results);
    }
    else {
        var root = options.root;
        var clist;
        if (root == null) {
            clist = owl.getClasses();
        }
        else {
            clist = owl.getSubClasses(owl.find(root));
        }

        var axioms = [];
        for (var k in clist) {
            var c = clist[k];
            //var label = owl.getLabel(c); // TODO - other APs
            results = obol.parse(c, null, repl.o);
            if (results.length > 0) {
                var cx = results[0];
                var ax = owl.equivalentClasses(c, cx);
                axioms.push( ax );
                repl.pp("GEN_AX=");
                repl.pp([ax]);
                // TODO - other results
            }
        }
        owl.saveAxioms(axioms, options.output);
    }
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
