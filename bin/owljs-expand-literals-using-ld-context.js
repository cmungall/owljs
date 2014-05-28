var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owljs");
var ov = require("owljs/vocab/obo");

importPackage(Packages.org.semanticweb.owlapi.model);

var owl;
var part_of;
var rels;
var relObjs = [];
var isElk;

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('c', 'importsClosure', null, 'set this flag if the full import closure is to used');
    parser.addOption('x', 'context', 'File', 'context file');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');
    parser.addOption('t', 'toOutputFormat', 'OWLOntologyFormat', 'output format (defaults to RDFXML)');

    var options = parser.parse(args);
    var incClosure = options.importsClosure == null ? false : true;

    if (options.help) {
        print("Usage: owljs-expand-literals-using-ld-context.js OPTIONS OWLFILE\n");
        print("Stats");
        print("\nOptions:");
	print(parser.help());
	system.exit('-1');
    }

    owl = new OWL();
    owl.addCatalog();

    if (options.toOutputFormat != null) {
        console.log("Setting format to "+options.toOutputFormat);
        owl.setDefaultFormat(options.toOutputFormat);
    }

    args.forEach(function(fn) { owl.loadFile(fn) } );

    owl.log("Saving to " + options.outputFile);
    owl.save(options.outputFile);

}

function render(c) {
    if (c == null) {
        return "";
    }
    if (c.map != null) {
        return c.map(render).join("|");
    }
    else {
        if (c.getIRI != null) {
            return owl.getLabel(c)
        }
        else {
            return markdown.renderOWLObject(c, owl, {isLabelOnly : true});
        }
    }
}

function getColVals(c, type) {
    var def = ov.getDefinitionObject(owl,c);
    // shared by all types
    var vals =
        [
            { name: "iri",
              value: c.getIRI()},
            { name: "label",
              value: owl.getLabel(c)},
            { name: "definition",
              value: def == null ? "" : def.value},
            { name: "definitionXrefs",
              value: def == null ? "" : def.xrefs.join(",")}
        ];
    if (type == 'Class') {
        vals = vals.concat([
            { name: "superClasses",
              value: render(owl.getInferredSuperClasses(c, true, false, true)) },
            //{ name: "part_of",
            //  value: render(owl.getAncestorsOver(c, part_of, true, false)) }
        ]);
        relObjs.forEach(function(r) {
            vals.push(
                { name: r.label,
                  value: render(owl.getAncestorsOver(c, r.obj, true, false)) }
            );
        });
    }
    else if (type == 'ObjectProperty') {
        if (!isElk) {
            vals = vals.concat([
                { name: "superProperties",
                  value: render(owl.getInferredSuperProperties(c, true, false, true)) },
            ]);
        }
        var axs = owl.getAxiomsReferencing(c, true);
        vals = vals.concat([
            { name: "classAxiomUsages",
              value: axs.length },
        ]);
        vals = vals.concat([
            { name: "classAxiomExampleUsage",
              value: render(axs.
                            filter(interesting).
                            slice(0,5)) },
        ]);
    }
    return vals;

}

function interesting(ax) {
    return ax.getSubClass != null || ax.getClassExpressions != null;
}


// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
