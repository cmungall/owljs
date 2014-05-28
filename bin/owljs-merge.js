var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owljs");
var {Differ} = require("owljs/Differ");

var owlA;
var owlB;
function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('r', 'reasoner', 'Reasoner', 'set reasoner factory. Default is elk. NOT IMPLEMENTED');
    parser.addOption('c', 'importsClosure', null, 'set this flag if the full import closure is to be diffed');
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

    owlOrig = new OWL();
    owlOrig.addCatalog();
    owlOrig.loadFile(args.shift);

    owlA = new OWL();
    owlA.addCatalog();
    owlA.loadFile(args.shift);

    owlB = new OWL();
    owlB.addCatalog();
    owlB.loadFile(args.shift);

    if (options.toOutputFormat != null) {
        console.log("Setting format to "+options.toOutputFormat);
        owl.setDefaultFormat(options.toOutputFormat);
    }

    var differ = new Differ();
    differ.merge(owlOrig, owlA, owlB);

    owlA.save(options.outputFile);

}


// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
