var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owl");
var {Differ} = require("owljs/Differ");

var owlA;
var owlB;
function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('r', 'reasoner', 'Reasoner', 'set reasoner factory. Default is elk. NOT IMPLEMENTED');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-owldiff OPTIONS OWLFILE_A OWLFILE_B\n");
        print("Writes differences between two files. Current output is markdown");
        print("\nOptions:");
	print(parser.help());
        print("\nExample:");
        print("owljs-diff -o diff.md ont1.owl ont2.owl");
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
