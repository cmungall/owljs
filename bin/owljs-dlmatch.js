var Parser = require('ringo/args').Parser;
var system = require('system');
var {OWL} = require("owl");
var {DLMatch} = require("owl/dlmatch");

importPackage(Packages.org.semanticweb.owlapi.model);
var owl;
var options;

function main(args) {
    var script = args.shift();
    var parser = new Parser(system.args);
    var dlmatchPattern = null;

    parser.addOption('h', 'help', null, 'Display help');
    parser.addOption('v', 'invertMatch', null, 'Invert (negate) match');
    parser.addOption('o', 'outputFile', 'File', 'output file (defaults to stdout)');
    parser.addOption('f', 'patternFile', 'File', 'file containing js that evals to dlmatchPattern. If specified no TEMPLATECODE arg is specified');
    parser.addOption('t', 'toOutputFormat', 'Format', 'One of: tbl (default), json, or an owl format (ofn, ttl, omn, rdf)');
    parser.addOption('j', 'jsFrames', null, 'writes output as js frames. TODO');
    parser.addOption('r', 'replaceWith', 'CODE', 'A generator function. If specified, findAndReplace() is used');

    options = parser.parse(args);

    if (options.help) {
        print("Usage: owljs-dlmatch [TEMPLATECODE] OPTIONS OWLFILE\n");
        print("Queries axiom in ontology using a DLMatch function. See owl.dlmatchAxioms() for more detauls");
        print("\nOptions:");
	print(parser.help());
        print("\nExample:");
        print("$ owljs-dlmatch 'part_of=owl.find(\"part of\");q.subClassOfMatch(\"?x\",q.objectSomeValuesFromMatch(\"?p\",\"?y\"))' test/data/ceph.owl");
        print("\nExample (output json):");
        print("$ owljs-dlmatch -t json 'part_of=owl.find(\"part of\");q.subClassOfMatch(\"?x\",q.objectSomeValuesFromMatch(\"?p\",\"?y\"))' test/data/ceph.owl");
        print("\nExample (find and replace):");
        print("$ owljs-dlmatch -r 'function(m){return owl.subClassOf(m.y,m.x)}' 'part_of=owl.find(\"part of\");q.subClassOfMatch(\"?x\",q.objectSomeValuesFromMatch(\"?p\",\"?y\"))' test/data/ceph.owl");
	system.exit('-1');
    }

    var dlmatchPatternStr;
    if (options.patterntionFile == null) {
        dlmatchPatternStr = args.shift();
    }

    owl = new OWL();
    args.forEach(function(fn) { owl.loadFile(fn) } );
    var q = new DLMatch(owl);


    if (options.match != null) {
        dlmatchPattern = eval(options.match);
    }

    if (options.dlmatchPatterntionFile != null) {
        var fs = require("fs");
        dlmatchPattern = eval(fs.read(options.dlmatchPatterntionFile));
    }

    if (dlmatchPatternStr != null) {
        dlmatchPattern = eval(dlmatchPatternStr);
    }

    if (options.load != null) {
        owl.log("Loading "+options.load);
    }

    var ofmt = options.toOutputFormat;

    if (options.replaceWith != null) {
        var rfunc = eval(options.replaceWith);
        var axioms = q.findAndReplace(dlmatchPattern, rfunc);
        if (ofmt != null) {                
            owl.setDefaultFormat(ofmt);
        }
        owl.save(options.outputFile);
    }
    else {
        var matches = q.find(dlmatchPattern);
        owl.info("#matches = " + matches.length);
        if (matches.length == 0) {
            owl.warn("No results");
        }
        else {

            // default to tbl
            if (ofmt == null) {
                ofmt = 'tbl';
            }

            if (ofmt == 'tbl') {
                var cols = Object.keys(matches[0]);
                cols.splice(cols.indexOf("axiom"),1); // remove axiom
                print( cols.join("\t") );
                for (var km in matches) {
                    var m = matches[km];
                    print(
                        cols.map( function(k) { return mat(m[k]) } ).join("\t")
                    );
                    
                }
            }
            else if (ofmt == 'json') {
                matches.forEach( function(x) { delete x.axiom });
                matches.forEach( function(m) { 
                    for (var k in m) {
                        m[k] = m[k].toString();
                    }
                });
                print(JSON.stringify(matches, null, ' '));
            }
            else {
                var axioms = matches.map(function(m){return m.axiom});
                if (ofmt != 'rdf') {                
                    owl.setDefaultFormat(ofmt);
                }
                owl.log("Saving to " + options.outputFile);
                owl.saveAxioms(axioms, options.outputFile);
                
            }
        }
    }

    //
    //
}

function mat(x) {
    var label = owl.getLabel(x);
    var id = shortId(x);
    if (label == null) {
        return id;
    }
    else {
        return id + ' "' + label + '"';
    }
}
function shortId(x) {
    if (x instanceof OWLNamedObject) {
        return owl.getIRIFragment(x);
    }
    return x;
}

// call the main method; ringo specific
if (require.main == module.id) {
    main(system.args);
}
