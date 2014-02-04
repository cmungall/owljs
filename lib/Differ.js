/* Namespace: Differ
 *
 *
 * Scripts:
 *  - owljs-differ
 *
 * Tests:
 *  - test/differ
 *
 */

var javautil = require("owl/javautil");
var md = require("owl/io/markdown");

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

Differ.prototype.getDiffs = function(owlA, owlB, incClosure, useReasoning) {
    var diffs =
        {
            classes : this.getObjListDiffs( 'Class', owlA, owlB, owlA.getClasses(incClosure), owlB.getClasses(incClosure), useReasoning),
            properties : this.getObjListDiffs( 'ObjectProperty', owlA, owlB, owlA.getObjectProperties(incClosure), owlB.getObjectProperties(incClosure), useReasoning)
        };
    return diffs;
}

Differ.prototype.getObjListDiffs = function(objType, owlA, owlB, objsA, objsB, incClosure, useReasoning) {
    console.log("Performing diff for type: "+ objType);
    var diffs = compareSets(objsA, objsB);

    diffs.changes = [];

    for (var k in diffs.inBoth) {
        var obj = diffs.inBoth[k];
        var diff = this.getObjDiffs( owlA, owlB, obj, useReasoning);
        if (diff.numberOfChanges > 0) {
            diffs.changes.push(diff);
        }
    }
    return diffs;
}


Differ.prototype.DEPRECATED__getObjListDiffs = function(objType, owlA, owlB, objsA, objsB, incClosure, useReasoning) {
    console.log("Performing diff for type: "+ objType);
    var lostFromA = [];
    var newInB = [];
    var diffs =
        {
            lostFromA : lostFromA,
            newInB : newInB,
            changes : []
        }

    var c = compareSets(objsA, objsB);
    
    if (false) {
    console.log("  Checking for losses: "+ objType);
    for (var k in objsA) {
        var obj = objsA[k];
        if (!containsJavaObj(objsB,obj)) {
            lostFromA.push(obj);
        }
    }
    console.log("  Checking for gains: "+ objType);
    for (var k in objsB) {
        var obj = objsB[k];
        if (!containsJavaObj(objsA,obj)) {
            newInB.push(obj);
        }
        else {
            var diff = this.getObjDiffs( owlA, owlB, obj, useReasoning);
            if (diff.numberOfChanges > 0) {
                diffs.changes.push(diff);
            }
        }
    }
    }
    return diffs;
}

Differ.prototype.getObjDiffs = function(owlA, owlB, obj, useReasoning) {
    var axiomsA = owlA.getAllAxioms(obj);
    var axiomsB = owlB.getAllAxioms(obj);

    var lostFromA = [];
    var newInB = [];
    var diffs =
        {
            obj : obj,
            lostFromA : lostFromA,
            newInB : newInB,
        }

    // TODO
    // OWLAxiom newAxiom = changeAxiomAnnotations(axiom, annotations, factory);

    for (var k in axiomsA) {
        var ax = axiomsA[k];
        if (!containsJavaObj(axiomsB,ax)) {
            lostFromA.push(ax);
        }
    }
    for (var k in axiomsB) {
        var ax = axiomsB[k];
        if (!containsJavaObj(axiomsA,ax)) {
            newInB.push(ax);
        }
    }

    // TODO - reasoning

    diffs.numberOfChanges = lostFromA.length + newInB.length;
    return diffs;
}

Differ.prototype.toMarkdown = function(owlA, owlB, diffs) {
    var ctxt = this;
    var md = "";
    for (var k in diffs) {
        md += h1("Report for "+k);
        var diff = diffs[k];
        md += h2("Objects lost from source: " + diff.lostFromA.length);
        md += diff.lostFromA.map( function(obj) {
            return li(ctxt.objToMarkdown(owlA, obj));
        }).join("");
        md += h2("Objects new in target: " + diff.newInB.length);
        md += diff.newInB.map( function(obj) {
            return li(ctxt.objToMarkdown(owlB, obj)) + 
                owlB.getAllAxioms(obj).map(
                    function(ax) {
                        return li2(ctxt.axiomToMarkdown(owlB, ax));
                    }
                ).join("");
        }).join("");
        md += h2("Changed objects: " + diff.changes.length);
        md += diff.changes.map( function(diff) {
            return ctxt.objDiffToMarkdown(owlA, owlB, diff);
        }).join("");
    }
    return md;
}

Differ.prototype.objToMarkdown = function(owl, obj) {
    return "[" + owl.getLabel(obj)+"]("+obj.getIRI().toString()+")";
}

Differ.prototype.objDiffToMarkdown = function(owlA, owlB, diff) {
    var ctxt = this;
    var md = "";
    md += li(this.objToMarkdown(owlB, diff.obj));
    //md += "## Objects lost from source: " + diffs.lostFromA.length + "\n\n";
    md += diff.lostFromA.map( function(obj) {
        return li2(" - " + ctxt.axiomToMarkdown(owlA, obj));
    }).join("");
    //md += "## Objects new in target: " + diffs.newInB.length + "\n\n";
    md += diff.newInB.map( function(obj) {
        return li2(" + " + ctxt.axiomToMarkdown(owlB, obj));
    }).join("");
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
function hN(s, pfx) {
    return "\n" + pfx+" "+s+"\n\n";
}
