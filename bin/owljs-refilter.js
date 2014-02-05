var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owl");

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var re = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('v', 'invertMatch', null, 'Invert (negate) match');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');
    parser.addOption('t', 'toOutputFormat', 'OWLOntologyFormat', 'output format (defaults to RDFXML)');
    parser.addOption('j', 'jsFrames', null, 'writes output as js frames');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-cgrep OPTIONS [PATTERN] OWLFILE\n");
        print("Filters class from an ontology using a regexp. Compare with owljs-grep, which greps axioms");
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

    var reStr = args.shift();
    if (reStr.indexOf("/") != 0) {
        reStr = "/" + reStr + "/";
    }
    var re = eval(reStr);

    args.forEach(function(fn) { owl.loadFile(fn) } );

    if (options.load != null) {
        owl.log("Loading "+options.load);
    }
    var clist = owl.mfind(re);
    owl.log("#filteredClasses = " + clist.length);

    if (options.jsFrames) {
        var repl = require("owljs/repl");
        repl.owlinit(owl);
        //repl.owl = owl;
        for (var ci in clist) {
            var c = clist[ci];
            var fr = owl.getFrame(c);
            print(repl.render(fr));
        }        
    }
    else {

        var filteredAxioms = [];
        for (var ci in clist) {
            var c = clist[ci];
            var axioms = owl.getAllAxioms(c);
            console.log(c+" #axioms = "+axioms.length);
            filteredAxioms = filteredAxioms.concat(axioms);
        }
        owl.log("#filteredAxioms = " + filteredAxioms.length);
        
        owl.log("Saving to " + options.outputFile);
        owl.saveAxioms(filteredAxioms, null, options.outputFile);
    }
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
