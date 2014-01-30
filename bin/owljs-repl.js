// we use include() rather than require(), deliberately polluting our namespace for convenience
include("owl/repl"); 

var Parser = require('ringo/args').Parser;
var system = require('system');
var fs = require('fs');
var {OWL} = require("owl");
var {OWLFrame} = require("owl/owlframe");
var {DLMatch} = require("owl/dlmatch");
var {Obol} = require("owl/obol");
var owl;
var q;
var obol;

importPackage(Packages.org.semanticweb.owlapi.model);

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('i', 'include', 'File', 'loads js. Argument can be a path to a js file or a module name');
    parser.addOption('e', 'evaluate', 'Code', 'evals js code block');
    parser.addOption('l', 'load', 'File', 'Evals file contents');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-repl OPTIONS [ARGUMENTS] [OWLFILE...]\n");
        print("Starts an interactive Read-Eval-Print-Loop.");
        print("\nOptions:");
	print(parser.help());
        print("\nExample:");
        print("owljs-repl -i bootcl.js cl-edit.owl");
        print("\nVariables:");
        print(" - o : lookup table keyed by safe-labels, indexing OWL objects");
        print(" - owl : an OWL object");
        print(" - q : a DLMatch object");
        print("\nDocumentation:");
        print("See https://github.com/cmungall/owl.js/blob/master/README-REPL.md");
	system.exit('-1');
    }

    owl = new OWL();

    args.forEach(function(fn) { owl.loadFile(fn) } );
    q = new DLMatch(owl);
    obol = new Obol(owl);

    owlinit(owl);
    if (options.evaluate != null) {
        eval(options.evaluate);
    }
    if (options.load != null) {
        eval(fs.read(options.load));
    }

    if (options.include != null) {
        var path = options.include;
        if (fs.exists(path)) {
            load(path);
        }
        else {
            include(path);
        }
        owlinit(owl);
    }
}

if (require.main == module.id) {
    main(system.args);
}

owlinit(owl);
print(">> Welcome!");
require('ringo/shell').start();

