var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owl");

var owl;
function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('q', 'query', 'ManchesterString', 'class expression in owltools manchester syntax (all labels enclosed in single quotes)');
    parser.addOption('r', 'reasoner', 'Reasoner', 'set reasoner factory. Default is elk.');
    parser.addOption('a', 'ancestors', null, 'TODO');
    parser.addOption('d', 'direct', null, 'direct only (defaults to direct plus indirect)');
    parser.addOption('p', 'property', 'ObjectProperty', 'ancestors over specified relation. queries SELECT ?x  WHERE {CLASSEXPR SubClassOf ?p some ?x}');

    var options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-dlquery OPTIONS OWLFILE\n");
        print("DL-query");
        print("\nOptions:");
	print(parser.help());
        print("\nExample (what are the things that are parts of some cell):");
        print("$ owljs-dlquery -r elk \"'part_of' some 'cell'\" foo.owl");
        print("\nExample (what does this cell type have as parts)?:");
        print("$ owljs-dlquery  -p has_part -q \"'small pre-B-II cell'\" cl-edit.owl");
	system.exit('-1');
    }

    owl = new OWL();
    owl.addCatalog();
    args.forEach(function(fn) { owl.loadFile(fn) } );
    
    var cx = owl.parseManchesterExpression(options.query);
    owl.log("Query="+cx);
    var subs;
    if (options.property == null) {
        subs = owl.getInferredSubClasses(cx);
    }
    else {
        var objprop = owl.find(options.property);
        owl.log("Prop="+objprop);
        subs = owl.getAncestorsOver(cx, objprop, false, options.direct != null);
    }
    subs.forEach(show);
}

function show(c) {
    print(c + " " + owl.getLabel(c));
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
