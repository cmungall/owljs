var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owljs");
var ov = require("owljs/vocab/obo");
var markdown = require("owljs/io/markdown");

importPackage(Packages.org.semanticweb.owlapi.model);

var owl;
var part_of;
var rels;
var anProps;
var relObjs = [];
var anPropObjs = [];
var isElk;

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var grepFunc = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('r', 'reasoner', 'Reasoner', 'set reasoner factory. Default is elk.');
    parser.addOption('R', 'relations', 'RelList', 'relations to query over.');
    parser.addOption('A', 'annotations', 'PropList', 'annotation properties to query over.');
    parser.addOption('f', 'force', null, 'set this to ignore non-found relations.');
    //parser.addOption('N', 'count', 'RelList', 'relations to query over.');
    parser.addOption('c', 'importsClosure', null, 'set this flag if the full import closure is to used');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');
    parser.addOption('t', 'objectType', 'Type', 'Either Class (default) or ObjectProperty. Others available on request.');
    parser.addOption('v', 'verbosity', 'Number', 'sets verbosity. >0 logs');

    var options = parser.parse(args);
    var incClosure = options.importsClosure == null ? false : true;

    if (options.help) {
        print("Usage: owljs-owlstats OPTIONS OWLFILE\n");
        print("Stats");
        print("\nOptions:");
	print(parser.help());
	system.exit('-1');
    }

    owl = new OWL();
    owl.config.logLevel = options.verbosity;
    owl.addCatalog();
    args.forEach(function(fn) { owl.loadFile(fn) } );
    isElk = true;
    if (options.reasoner != null) {
        owl.setReasonerType(options.reasoner);
        isElk = false; // TODO - temporary assumption
    }

    part_of = ov.part_of(owl);
    rels = [part_of];
    if (options.relations != null) {
        options.relations.split(",").forEach(function(rn) {
            var rel = owl.find(rn);
            if (rel == null) {
                console.warn("Cannot find: "+rn);
                if (!options.force) {
                    system.exit(1);
                }
            }
            else {
                rels.push(rel);
            }
        });
    }
    relObjs = rels.map( function(r) {
        return { obj : r,
                 label : owl.getLabel(r) }});

    if (options.annotations != null) {
        anProps = [];
        options.annotations.split(",").forEach(function(rn) {
            var p = owl.find(rn);
            if (p == null) {
                console.warn("Cannot find: "+rn);
                if (!options.force) {
                    system.exit(1);
                }
            }
            else {
                anProps.push(p);
            }
        });
        anPropObjs = anProps.map( function(r) {
            return { obj : r,
                     label : owl.getLabel(r) ? owl.getLabel(r) : r  }});
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
        cs = owl.getClassesWithAxioms(incClosure);
    }
    else if (type == 'ObjectProperty') {
        cs = owl.getObjectProperties(incClosure);
    }
    console.log("|"+type+"|="+cs.length);
    cs.sort(function(a,b){ return a.getIRI().compareTo(b.getIRI()) });

    function peekName(obj) {
        return obj.name;
    }
    function peekVal(obj) {
        return obj.value;
    }

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


    var n=0;
    for (var k in cs) {
        var c = cs[k];
        if (owl.isDeprecated(c)) {
            continue;
        }

        var vals = getColVals(c, type);
        var line = vals.map(peekVal).join("\t");

        // header
        if (n == 0) {
            line = vals.map(peekName).join("\t") + "\n" + line;
        }

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
    if (anPropObjs) {
        anPropObjs.forEach(function(r) {
            vals.push(
                { name: r.label,
                  value: owl.getAnnotationValues(c,r.obj).join("|") }
            );
        });
    }
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
