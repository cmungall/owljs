var Parser = require('ringo/args').Parser;
var system = require('system');
var fs = require('fs');
var {OWL} = require("owljs");
var {Linky} = require("owljs/Linky");

var owl;
function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('r', 'reasoner', 'Reasoner', 'set reasoner factory. Default is elk. NOT IMPLEMENTED');
    parser.addOption('c', 'importsClosure', null, 'set this flag if the full import closure is to be declustered');
    parser.addOption('C', 'catalog', 'File', 'XML catalog for imports');
    parser.addOption('m', 'markdownFile', 'File', 'output file for md report');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-decluster OPTIONS OWLFILE_A OWLFILE_B\n");
        print("Breaks equivalence clusters such that bipartite equivalence graphs are retained");
        print("\nOptions:");
	print(parser.help());
        print("\nExample:");
        print("owljs-decluster -o decluster.md ont.owl");
	system.exit('-1');
    }

    owl = new OWL();
    owl.addCatalog(options.catalog);
    owl.loadFile(args[0]);

    var incClosure = options.importsClosure == null ? false : true;

    var linky = new Linky(owl);
    if (options.markdownFile != null) {
        linky.io = fs.open(options.markdownFile, {write:true});
    }
    
    linky.decluster();
    
    if (options.outputFile != null) {
        owl.save(options.outputFile);        
    }
    else {
        console.warn("No save");
    }
    if (linky.io != null) {
        linky.io.close();
    }
}


// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
