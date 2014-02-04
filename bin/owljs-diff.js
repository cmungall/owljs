var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owl");
var {Differ} = require("owl/Differ");

var owlA;
var owlB;
function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('r', 'reasoner', 'Reasoner', 'set reasoner factory. Default is elk.');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-owldiffer OPTIONS OWLFILE_A OWLFILE_B\n");
        print("Differ");
        print("\nOptions:");
	print(parser.help());
	system.exit('-1');
    }

    owlA = new OWL();
    owlA.addCatalog();
    owlA.loadFile(args[0]);

    owlB = new OWL();
    owlB.addCatalog();
    owlB.loadFile(args[1]);

    var differ = new Differ();
    var md = differ.getDiffsAsMarkdown(owlA, owlB, false, false);

    if (options.outputFile != null) {
        var fs = require('fs');
        fs.write(options.outputFile, md);
    }
    else {
        print(md);
    }
}


// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
