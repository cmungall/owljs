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
    parser.addOption('r', 'rootClass', 'Class', 'root class to restrict search space. Can be IRI or name. E.g. "neuron" or "regulation of biological process"');
    parser.addOption('m', 'module', 'Module', 'module in owl/obol to load. E.g. phenotype; E.g. anatomy; E.g. bp/involvedIn');
    parser.addOption('o', 'outputFile', 'File', 'output OWL file where generated axioms are stored (defaults to stdout)');
    parser.addOption('t', 'toOutputFormat', 'OWLOntologyFormat', 'output format for generated axioms (defaults to RDFXML)');
    parser.addOption('F', 'forceGenerate', 'Variables', 'forces generation of classes for the given variable name or names (comma-separated). E.g. "part,whole"');
    parser.addOption('T', 'testExpressions', null, 'If set, all generated expressions are compared to parsed class using reasoner');
    parser.addOption('R', 'rule', 'RuleName', 'Name of rule to use. Defaults to all (loaded) rules');
    parser.addOption('u', 'undefinedOnly', null, 'If set, defined classes are not parsed');
    parser.addOption('l', 'load', 'File', 'Evals file contents');
    parser.addOption('v', 'verbosity', 'Number', 'sets verbosity. >0 logs');
    parser.addOption('S', 'subsumersOnly', null, 'If set, the generated class expression must subsume the query class');
    parser.addOption('O', 'oboFile', 'File', 'OBO file to write results to (MAY BE DEPRECATED IN FUTURE)');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-obol OPTIONS [FUNCTION] OWLFILE\n");
        print("Parses class labels and annotations using a grammar pattern");
        print("\nOptions:");
	print(parser.help());
        print("\nExample:");
        print("owljs-obol -m anatomy -r neuron cl.owl");
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

    if (options.module != null) {
        require("owl/obol/" + options.module);
    }

    var repl = require("owl/repl");
    repl.owlinit(owl);
    var obol = new Obol(owl, repl.o);

    obol.logLevel = options.verbosity;

    obol.useOboVocab(); // TODO - make configurable
    owl.config.isCompareClasses = options.testExpressions;
    owl.config.isSubsumersOnly = options.subsumersOnly;

    if (options.forceGenerate != null) {
        options.forceGenerate.split(",").forEach( function(x) { obol.generate(x) });
    }

    if (options.undefinedOnly) {
        obol.setIgnoreDefinedClasses(options.undefinedOnly);
    }
    var ruleName = options.rule;

    var results;
    var filteredResults = [];
    if (options.query != null) {
        var str = options.query;
        console.log("Parsing: "+str);
        results = obol.parse(str, ruleName, repl.o);
        repl.pp(results);
        filteredResults = results;
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
        console.log("Parsing, #classes = "+clist.length+" Rule: "+(ruleName == null ? "ALL" : ruleName));
        var n = 0;
        for (var k in clist) {
            var c = clist[k];
            if (n % 100 == 0) {
                console.log("Parsed "+n+"/"+clist.length);
            }
            n++;
            results = obol.parseClass(c, ruleName);
            if (results.length > 0) {
                repl.pp(results);
                if (results.length > 1) {
                    console.warn("Ignoring "+(results.length-1)+" other results");
                }
                var result = results[0]; // sorted
                repl.pp(result);
                if (result.axiom != null) {
                    axioms.push( result.axiom );
                }
                if (result.extraAxioms != null) {
                    axioms = axioms.concat( result.extraAxioms );
                }                
                filteredResults.push(result);

            }
        }
        console.log("Parsed, #classes = "+clist.length);
        owl.saveAxioms(axioms, options.outputFile);

        if (options.oboFile != null) {
            obol.writeOboFile(options.oboFile, results);
        }
    }
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
