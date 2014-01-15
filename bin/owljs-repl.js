include("owl/repl");
var Parser = require('ringo/args').Parser;
var system = require('system');
var fs = require('fs');
var {OWL} = require("owl");
var {OWLFrame} = require("owl/owlframe");
var owl;

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('i', 'include', 'File', 'loads js. Argument can be a path to a js file or a module name');
    parser.addOption('e', 'evaluate', 'Code', 'evals js code block');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-grep OPTIONS [ARGUMENTS] [OWLFILE...]\n");
        print("Starts a repl. See repl docs for more details.");
        print("\nOptions:");
	print(parser.help());
        print("\nExample:");
        print("owljs-repl -i bootcl.js cl-edit.owl");
	system.exit('-1');
    }

    owl = new OWL();

    args.forEach(function(fn) { owl.loadFile(fn) } );

    owlinit(owl);
    if (options.evaluate != null) {
        eval(options.evaluate);
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
print(">> Weclome!");
require('ringo/shell').start();

