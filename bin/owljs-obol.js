var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owljs");
var {Obol} = require("owljs/obol");

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var re = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('q', 'query', 'String', 'sentence to parse');
    parser.addOption('r', 'rootClass', 'Class', 'root class to restrict search space. Can be IRI or name. E.g. "neuron" or "regulation of biological process"');
    parser.addOption('m', 'module', 'Module', 'module in owljs/obol to load. E.g. phenotype; E.g. anatomy; E.g. bp/involvedIn');
    parser.addOption('o', 'outputFile', 'File', 'output OWL file where generated axioms are stored (defaults to stdout)');
    parser.addOption('t', 'toOutputFormat', 'OWLOntologyFormat', 'output format for generated axioms (defaults to RDFXML)');
    parser.addOption('F', 'forceGenerate', 'Variables', 'forces generation of classes for the given variable name or names (comma-separated). E.g. "part,whole"');
    parser.addOption('T', 'testExpressions', null, 'If set, all generated expressions are compared to parsed class using reasoner');
    parser.addOption('R', 'rule', 'RuleName', 'Name of rule to use. Defaults to all (loaded) rules');
    parser.addOption('u', 'undefinedOnly', null, 'If set, defined classes are not parsed');
    parser.addOption('l', 'load', 'File', 'Evals file contents');
    parser.addOption('p', 'properties', 'Properties', 'Comma-delimited list of properties to use');
    parser.addOption('v', 'verbosity', 'Number', 'sets verbosity. >0 logs');
    parser.addOption('S', 'subsumersOnly', null, 'If set, the generated class expression must subsume the query class');
    parser.addOption('O', 'oboFile', 'File', 'OBO file to write results to (MAY BE DEPRECATED IN FUTURE)');
    parser.addOption('C', 'configFile', 'File', 'js config file');
    parser.addOption('Z', 'noImports', null, 'only use core ontology for class list');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-obol OPTIONS [FUNCTION] OWLFILE\n");
        print("Parses class labels and annotations using a grammar pattern");
        print("\nOptions:");
	print(parser.help());
        print("\n\n\
Example:\n\
owljs-obol -m anatomy -r neuron cl.owl\n\
\n\
Example:\n\
# parses undefined classes from GO using precise synonyms, using involved_in pattern, testing if object is subsumed by expression\n\
owljs-obol -p label,has_exact_synonym -T -v 1 -u -o xp.owl -t ofn -m bp/involvedIn -u gene_ontology_write.obo\n\
\n\
Example:\n\
# finds equivalent class pairs\n\
owljs-obol  -o xp.owl -t ofn -m equiv uberon.owl ma.owl\n\
");
	system.exit('-1');
    }

    var owl = new OWL();
    owl.addCatalog();
    if (options.configFile != null) {
        console.log("Loading: " + options.configFile);
        owl.loadConfig(options.configFile);
    }

    if (options.toOutputFormat != null) {
        console.log("Setting format to "+options.toOutputFormat);
        owl.setDefaultFormat(options.toOutputFormat);
    }

    args.forEach(function(fn) { owl.loadFile(fn, {addToImport: true}) } );

    if (options.load != null) {
        owl.log("Loading "+options.load);
    }

    if (options.module != null) {
        if (options.module.indexOf(".") == 0) {
            require(options.module);
        }
        require("owljs/obol/" + options.module);
    }

    var repl = require("owljs/repl");
    repl.owlinit(owl);
    var obol = new Obol(owl, repl.o);

    obol.logLevel = options.verbosity;

    obol.useOboVocab(); // TODO - make configurable

    if (options.properties != null) {
        var plabels = options.properties.split(",");
        var ps = 
            plabels.map( function(pl) {
                if (pl == 'label') {
                    return owl.labelProperty();
                }
                return owl.find(pl);
            });
        obol.restrictProperties(ps);
    }

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
        var root = options.rootClass;
        var clist;
        if (root == null) {
            clist = owl.getClasses();
            console.log("No root; # of classes: "+clist.length);
        }
        else {
            clist = owl.getInferredSubClasses(owl.find(root), false, true);
            console.log("# of subtypes: "+clist.length);
        }

        if (options.noImports) {
            // only use root ontology
            clist = clist.filter( function(c) { return owl.getOntology().getClassesInSignature(false).contains(c) } );
            console.log("# of subtypes (in core ontology): "+clist.length);
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
