/* Namespace: Differ
 *
 * Performs OWL diffs. Native format for resulting diff objects is JSON.
 * Currently includes converted to markdown.
 *
 * Example:
 *  - https://github.com/obophenotype/uberon/blob/master/diffs/uberon-diff.md
 *
 * Scripts:
 *  - owljs-diff
 *
 * Current API may not be stable - use the script rather than the API for now
 *
 *
 * Tests:
 *  - test/differ
 *
 */

var javautil = require("owljs/javautil");
var md = require("owljs/io/markdown");

importPackage(Packages.org.semanticweb.owlapi.model);


/* Function: Differ
 *
 * Constructor
 *
 * Arguments:
 *  - owl: an <OWL> object
 */
var Differ = exports.Differ = function Differ(owl) {
    this.owl = owl;
    return this;
}

Differ.prototype.getDiffsAsMarkdown = function(owlA, owlB, incClosure, useReasoning) {
    var diffs = this.getDiffs(owlA, owlB, incClosure, useReasoning);
    return this.toMarkdown(owlA, owlB, diffs);
}

function containsJavaObj(arr, obj) {
    return arr.filter(function(x) { return x.equals(obj) }).length > 0;
}

function compareSets(arrA, arrB) {
    var setA = new java.util.HashSet();
    var setB = new java.util.HashSet();
    arrA.forEach( function(x) { setA.add(x) } );
    arrB.forEach( function(x) { setB.add(x) } );

    var lostFromA = [];
    var newInB = [];
    var inBoth = [];

    for (var k in arrA) {
        var obj = arrA[k];
        if (!setB.contains(obj)) {
            lostFromA.push(obj);
        }
    }
    for (var k in arrB) {
        var obj = arrB[k];
        if (!setA.contains(obj)) {
            newInB.push(obj);
        }
        else {
            inBoth.push(obj);
        }
    }
    return {
        lostFromA : lostFromA,
        newInB : newInB,
        inBoth : inBoth
    }
    
}

function ontMetadata(owl) {
    var ont = owl.getOntology();
    var oid = ont.getOntologyID();
    var json =
        {
            iri : oid.getOntologyIRI().toString() + ""
        };
    if (oid.getVersionIRI() != null) {
        json.versionIRI =  oid.getVersionIRI().toString() + ""
    }
    return json
}

Differ.prototype.getDiffs = function(owlA, owlB, incClosure, useReasoning) {
    var diffs =
        {
            originalOntology : ontMetadata(owlA),
            newOntology : ontMetadata(owlB),

            byType : {
                classes : this.getObjListDiffs( 'Class', owlA, owlB, owlA.getClasses(incClosure), owlB.getClasses(incClosure), useReasoning),
                properties : this.getObjListDiffs( 'ObjectProperty', owlA, owlB, owlA.getObjectProperties(incClosure), owlB.getObjectProperties(incClosure), useReasoning)
            }
        };
    return diffs;
}

Differ.prototype.getObjListDiffs = function(objType, owlA, owlB, objsA, objsB, incClosure, useReasoning) {
    console.log("Performing diff for type: "+ objType);
    var diffs = compareSets(objsA, objsB);
    diffs.type = objType;

    diffs.changes = []; // changes to objects in both
    diffs.newObjectAxioms = []; // all axioms for new objects
    diffs.lostObjectAxioms = []; // all axioms for lost objects objects

    for (var k in diffs.lostInA) {
        var obj = diffs.lostInA[k];
        owlA.getAllAxioms(obj, incClosure).forEach( function(a) { diffs.lostObjectAxioms.push(a) } ); 
    }
    for (var k in diffs.newInB) {
        var obj = diffs.newInB[k];
        diffs.newObjectAxioms.concat(owlB.getAllAxioms(obj, incClosure));
        owlB.getAllAxioms(obj, incClosure).forEach( function(a) { diffs.newObjectAxioms.push(a) } );
    }

    for (var k in diffs.inBoth) {
        var obj = diffs.inBoth[k];
        var diff = this.getObjDiffs( owlA, owlB, obj, useReasoning);
        if (diff.numberOfChanges > 0) {
            diffs.changes.push(diff);
        }
    }
    return diffs;
}

Differ.prototype.getObjDiffs = function(owlA, owlB, obj, useReasoning) {
    var axiomsA = owlA.getAllAxioms(obj);
    var axiomsB = owlB.getAllAxioms(obj);

    var diffs =  compareSets(axiomsA, axiomsB);
    diffs.obj = obj;

    // TODO
    // OWLAxiom newAxiom = changeAxiomAnnotations(axiom, annotations, factory);

    // TODO - reasoning

    diffs.numberOfChanges = diffs.lostFromA.length + diffs.newInB.length;
    return diffs;
}

// incorporates all changes that lead from owlOrig to owlB into owlA
Differ.prototype.merge = function(owlOrig, owlA, owlB, inPlace) {
    diffs = this.getDiffs(owlOrig, owlB);
    return this.applyChanges(diffs, owlA, inPlace);
}

Differ.prototype.applyChanges = function(diffs, owl, inPlace) {
    for (var k in diffs.byType) {
        var diff = diffs.byType[k];

        for (var j in diff.lostFromA) {
            var obj = diff.lostFromA[j];
            // TODO - currently diffs only generated for objects on both
        }
        for (var j in diff.newInB) {
            var obj = diff.newInB[j];
            // TODO - currently diffs only generated for objects on both
        }
        for (var j in diff.changes) {
            var objChange = diff.changes[j];
            this.applyChangesForObj(objChange, owl);
        }
        for (var j in diff.newObjectAxioms) {
            var ax = diff.newObjectAxioms[j];
            owl.add(ax);
        }
        for (var j in diff.lostObjectAxioms) {
            var ax = diff.lostObjectAxioms[j];
            owl.add(ax);
        }
    }    
}

Differ.prototype.applyChangesForObj = function(diff, owl, inPlace) {

    for (var j in diff.lostFromA) {
        var ax = diff.lostFromA[j];
        owl.remove(ax);
    }
    for (var j in diff.newInB) {
        var obj = diff.newInB[j];
        owl.add(ax);
    }
}

// ----------------------------------------
// I/O
// ----------------------------------------
// may be moved to other module

Differ.prototype.toMarkdown = function(owlA, owlB, diffs) {
    var ctxt = this;

    var releaseName = diffs.originalOntology.versionIRI;

    var md = "";
    md += "---\n";
    if (releaseName != null) {
        // TODO make this customizable
        var matches = releaseName.match(/releases.(\d\d\d\d-\d\d-\d\d).(\S+)/);
        var date;
        if (matches.length > 1) {
            date = matches[1];
            releaseName = "/releases/"+date+"/"+matches[2];
        }
        
        md += "title: \"" + releaseName + "\"\n";
        md += "date: \"" + date + "\"\n";
        md += "summary: \"\"\n";
        md += "categories: release\n";
        md += "image: '/anatomy/images/u-logo.jpg\n";
        md += "tags:\n";
        md += " - release\n";
    }
    md += "---\n";
    md += h1("Ontology Diff Report");
    md += h2("Original Ontology");
    md += this.ontMetadataToMarkdown(diffs.originalOntology);
    md += h2("New Ontology");
    md += this.ontMetadataToMarkdown(diffs.newOntology);
    for (var k in diffs.byType) {
        md += h1("Report for "+k);
        
        var diff = diffs.byType[k];
        //print(JSON.stringify(diff, null, ' '));

        md += h2(diff.type + " objects lost from source: " + diff.lostFromA.length);
        md += diff.lostFromA.map( function(obj) {
            return li(ctxt.objToMarkdown(owlA, obj));
        }).join("");
        md += h2(diff.type + " objects new in target: " + diff.newInB.length);
        md += diff.newInB.map( function(obj) {
            return h3("New "+diff.type+" : "+ctxt.objToMarkdown(owlB, obj)) + 
                owlB.getAllAxioms(obj).map(
                    function(ax) {
                        return li(ctxt.axiomToMarkdown(owlB, ax));
                    }
                ).join("");
        }).join("");
        md += h2("Changed "+diff.type+" objects: " + diff.changes.length);
        md += diff.changes.map( function(diff) {
            return ctxt.objDiffToMarkdown(owlA, owlB, diff);
        }).join("");
    }
    return md;
}

Differ.prototype.ontMetadataToMarkdown = function(obj) {
    var md = li("IRI: "+obj.iri);
    if (obj.versionIRI != null) {
        md += li("VersionIRI: "+obj.versionIRI);
    }
    return md;
}

Differ.prototype.objToMarkdown = function(owl, obj) {
    return "[" + owl.getLabel(obj)+"]("+obj.getIRI().toString()+")";
}

Differ.prototype.objDiffToMarkdown = function(owlA, owlB, diff) {
    var ctxt = this;
    var md = "";
    md += h3("Changes for: "+this.objToMarkdown(owlB, diff.obj));

    if (diff.lostFromA.length > 0) {
        md += li("_Deleted_");
        md += diff.lostFromA.map( function(obj) {
            return li2(" **-** " + ctxt.axiomToMarkdown(owlA, obj));
        }).sort().join("");
    }

    if (diff.newInB.length > 0) {
        md += li("_Added_");
        md += diff.newInB.map( function(obj) {
            return li2(" **+** " + ctxt.axiomToMarkdown(owlB, obj));
        }).sort().join("");
    }

    return md;
}

Differ.prototype.axiomToMarkdown = function(owl, ax) {
    var jsax = owl.toAxiomaticJSON(ax);
    return md.render(jsax, owl);
}

function li(s) {
    return " * "+s+"\n";
}
function li2(s) {
    return "    * "+s+"\n";
}

function h1(s) {
    return hN(s, "#");
}
function h2(s) {
    return hN(s, "##");
}
function h3(s) {
    return hN(s, "###");
}
function hN(s, pfx) {
    return "\n" + pfx+" "+s+"\n\n";
}
