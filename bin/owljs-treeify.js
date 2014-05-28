var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owljs");
var ov = require("owljs/vocab/obo");

var owl;
var part_of;
var rels;
var relObjs = [];

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('r', 'reasoner', 'Reasoner', 'set reasoner factory. Default is elk.');
    parser.addOption('R', 'relations', 'RelList', 'relations to query over.');
    parser.addOption('S', 'superClass', 'Class', 'only use subclasses of this.');
    parser.addOption('c', 'importsClosure', null, 'set this flag if the full import closure is to used');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');

    var options = parser.parse(args);
    var incClosure = options.importsClosure == null ? false : true;

    if (options.help) {
        print("Usage: owljs-treeify OPTIONS OWLFILE\n");
        print("Stats");
        print("\nOptions:");
	print(parser.help());
	system.exit('-1');
    }

    owl = new OWL();
    owl.addCatalog();
    args.forEach(function(fn) { owl.loadFile(fn) } );
    if (options.reasoner != null) {
        owl.setReasonerType(options.reasoner);
    }

    rels = [];
    if (options.relations != null) {
        options.relations.split(",").forEach(function(rn) {
            rels.push(owl.find(rn));
        });
    }
    if (rels == []) {
        rels = [ov.part_of(owl)];
    }
    relObjs = rels.map( function(r) {
        var label = owl.getLabel(r);
        if (label == null) {
            console.warn("No label: "+r);
        }
        return { obj : r,
                 label : label }});

    var io;
    var fs;
    if (options.outputFile != null) {
        fs = require('fs');
        io = fs.open(options.outputFile, {write:true});
        //fs.write(options.outputFile, json);
    }
    else {
        //print(json);
    }


    var cs;
    var type = options.objectType;
    if (type == null) {
        type = "Class";
    }
    if (type == 'Class') {
        // note that ontologies that reference other ontologies automatically have
        // external referenced classes in their signature; if the intent is to
        // show ontologies that 'belong' to an ontology we make the assumption that
        // the declaration is accompanied by at least one other axiom
        if (options.superClass != null) {
            cs = owl.getInferredSubClasses( owl.find(options.superClass), false, true );
        }
        else {
            cs = owl.getClassesWithAxioms(incClosure);
        }

    }
    else if (type == 'ObjectProperty') {
        cs = owl.getObjectProperties(incClosure);
    }

    cs.sort(function(a,b){ return a.getIRI().compareTo(b.getIRI()) });

    function peekName(obj) {
        return obj.name;
    }
    function peekVal(obj) {
        return obj.value;
    }


    var n=0;
    for (var k in cs) {
        var c = cs[k];
        if (owl.isDeprecated(c)) {
            continue;
        }

        var tree = getTree(c);
        if (tree.length == 0) {
            continue;
        }

        var line = c.getIRI() + "\t" + owl.getLabel(c) + "\t" + tree.length + "\t" + tree.map(
            function(a) {
                return owl.getLabel(a);
            }
        ).join(",");

        if (io == null) {
            print(line);
        }
        else {
            io.write(line+"\n");
        }
        n++;
    }
    if (io != null) {
        io.close();
    }
}

function getTree(c) {
    var ancs = [];
    for (var k in rels) {
        var rel = rels[k];
        ancs = ancs.concat(owl.getAncestorsOver(c, rel, true, false));
        ancs.forEach( function(a) {
            ancs = ancs.concat(owl.getAncestorsOver(a, rel, true, false));
        });
    }

    return ancs;
}


// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
