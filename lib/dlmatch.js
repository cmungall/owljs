/* Namespace: dlmatch
 *
 * Matches Description Logic axioms and expressions
 *
 * Tests:
 *  - test/dlmatch
 *
 */

var javautil = require("owl/javautil");
importPackage(Packages.org.semanticweb.owlapi.model);

/* Function: dlmatch
 *
 * Constructor
 *
 * Arguments:
 *  - owl: an <OWL> object
 */
var dlmatch = exports.dlmatch = function dlmatch(owl) {
    this.log("Constructing...");
    this.owl = owl;
    return this;
}

dlmatch.prototype.find = function(q) {
    var owl = this.owl;
    var axioms = owl.getAllAxioms();
    var matches = [];
    for (var k in axioms) {
        var axiom = axioms[k];
        var m = this.match(axiom, q, owl);
        if (m != null) {
            m.axiom = axiom;
            matches.push(m);
        }
    }
    return matches;
}


dlmatch.prototype.match = function(x, q, owl) {
    if (q.push != null) {
        return this.matchSet(x, q, owl);
    }
    if (this.isVariable(q)) {
        return this.matchVariable(x, q, owl);
    }
    if (q instanceof OWLObject) {
        return this.matchObject(x, q, owl);
    }
    return this.matchKeys(x, q, owl);
}

dlmatch.prototype.isVariable = function(q, owl) {
    var qv = this.getVariable(q);
    if (qv != null) {
        return true;
    }
    return false;
}

// a variable can either be (1) a string "?var" or (2) a dict with a var key
dlmatch.prototype.getVariable = function(q, owl) {
    if (typeof q == 'string') {
        if (q.slice(0,1) == '?') {
            return {
                var : q.slice(1)
            };
        }
    }
    if (q.var != null) {
        return q;
    }
    return null;
}

dlmatch.prototype.matchVariable = function(x, q, owl) {
    var qv = this.getVariable(q);
    var b = {};
    b[qv.var] = x;
    return b;
}

dlmatch.prototype.matchObject = function(x, q, owl) {
    if (x.equals(q)) {
        return {};
    }
    else {
        return null;
    }
}

dlmatch.prototype.matchKeys = function(x, q, owl) {
    // query is a dict indexing the arguments of the axiom or expression.
    var isMatch = true;
    var bindings = {};
    for (var k in q) {
        // TODO - order for optimization
        var subq = q[k];

        if (k == 'a') {
            if (x instanceof subq) {
                continue;
            }
            else {
                return null;
            }
        }

        var subBindings = null;

        // duck-typing
        var methodName = this.getMethodName(k);
        var methodObj = x[methodName];
        if (methodObj != null) {            
            var subx = methodObj.apply(x);
            if (subx instanceof java.util.Collection) {
                subx = javautil.collectionToJsArray(subx);
            }
            subBindings = this.match(subx, subq);
        }
        if (subBindings == null) {
            isMatch = false;
            bindings = null;
            break;
        }
        else { 
            bindings = this.mergeBindings(bindings, subBindings);
        }
    }
    return bindings;
}

// every element of q must match some element of x
// Note: this is deterministic, so [ "?x", "?y" ]
// will match greedily; no backtracking
dlmatch.prototype.matchSet = function(x, q, owl) {
    var candidateIndex = [];    

    this.log("QSET: "+q);

    // create match matrix
    for (var qi=0; qi<q.length; qi++) {
        var subq = q[qi];
        if (subq == '...') {
            // TODO
            break;
        }
        this.log(" QI: "+qi+" "+subq);
        var xcandidateIndex = [];
        var submatches = [];
        var hasMatch = false;
        for (var xi=0; xi<x.length; xi++) {
            var subx = x[xi];
            var b = this.match(subx, subq);            
            xcandidateIndex[xi] = b;
            if (b != null) {
                submatches.push( { binding: b, pos: xi } );
                hasMatch = true; // at least one
                this.log("   M: "+xi+" "+b);
            }
        }
        if (!hasMatch) {
            //this.log("Could not match "+subq+" in "+q);
            // everything in query must be matched
            return null;
        }
        candidateIndex[qi] = submatches;
    }

    var matches = this.matrixMatch(candidateIndex, 0, []);
    if (matches == null) {
        return null;
    }
    else {
        var bindings = {};
        this.log("SUCCESS: "+matches.length);
        for (var k in matches) {
            this.log(bindings + " ==> "+matches[k]);
            bindings = this.mergeBindings(bindings, matches[k]);
        }
        return bindings;
    }
}

// returns list of bindings
dlmatch.prototype.matrixMatch = function(rows, rowNum, selected) {
    if (rowNum >= rows.length) {
        return [];
    }
    var row = rows[rowNum];
    for (var k in row) {
        var cm = row[k];
        if (selected.indexOf(cm.pos) > -1) {
            continue;
        }
        var result = this.matrixMatch(rows, rowNum+1, selected.concat([cm.pos]));
        if (result != null) {
            return result.concat(cm.binding);
        }
    }
    return null;
}

dlmatch.prototype.mergeBindings = function(h1, h2) {
    var h = {};
    for (var k in h1) {
        h[k] = h1[k];
    }
    for (var k in h2) {
        if (h[k] != null) {
            console.warn("DUPE");
            return {};
        }
        h[k] = h2[k];
    }
    return h;
}

// e.g. property ==> getProperty
dlmatch.prototype.getMethodName = function(k) {
    return "get" + k.slice(0,1).toUpperCase() + k.slice(1);
}


dlmatch.prototype.log = function(msg) {
    //console.log(msg);
}


/*

{ 
 a: OWLObjectSomeValuesFrom,
 property: o.part_of,
 filler: "?Whole",
}

{ 
 a: OWLObjectSomeValuesFrom,
 property: o.part_of,
 filler: {
   var: "Whole",
   condition: function(x,owl) { return owl.isSubClassOf(x,...) }
 },
}

*/
