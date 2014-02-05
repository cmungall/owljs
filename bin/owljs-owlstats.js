var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owljs");
var stats = require("owljs/Stats");

var owl;
function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('r', 'reasoner', 'Reasoner', 'set reasoner factory. Default is elk.');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-owlstats OPTIONS OWLFILE\n");
        print("Stats");
        print("\nOptions:");
	print(parser.help());
	system.exit('-1');
    }

    owl = new OWL();
    owl.addCatalog();
    args.forEach(function(fn) { owl.loadFile(fn) } );

    var info = stats.getOntologyStats(owl);
    var json = JSON.stringify(info, null, ' ');
    if (options.outputFile != null) {
        var fs = require('fs');
        fs.write(options.outputFile, json);
    }
    else {
        print(json);
    }
}

function show(c) {
    print(c + " " + owl.getLabel(c));
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
