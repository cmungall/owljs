/* Namespace: DLMatch
 *
 * Pattern matching system for OWL ontologies
 *
 * Example:
 * > var {DLMatcher} = require("owl/dlmatcher");
 * > var q = new DLMatcher(owl);
 * > var part_of = owl.find("part of");
 * >
 * > // finds ?p and ?w where there are asserted axioms ?p SubClassOf: part_of some ?w
 * > var matches = q.find(
 * >    q.subClassOfMatch( "?p", q.objectSomeValuesFromMatch(part_of, "?w")));
 * > for (k in matches) {
 * >   var m = matches[k];
 * >   print(m.p " is a part of a " + m.p);
 * > }
 *
 * Query templates:
 *
 * query templates can be specified using a *match constructor*, for
 * example:
 * - <subClassOfMatch>
 * - <objectSomeValuesFromMatch>
 * if match constructors are missing, more can be added on request.
 *
 * A match constructor is just a means of constructing a dict; for example, the following
 * > q.subClassOfMatch( "?p", q.objectSomeValuesFromMatch(part_of, "?w"))
 * is equivalent to:
 * > {
 * >  a : OWLSubClassOfAxiom,
 * >  subClass: "?p",
 * >  superClass : {
 * >    a : OWLObjectSomeValuesFrom
 * >    property : part_of,
 * >    filler : "?w"
 * >  }
 * >}
 *
 * Variables:
 *
 * Variables are strings with a leading "?".
 * This syntax is shorthand for a variable object.
 * A variable object can be specified directly, this allows
 * for extra capabilities, e.g. placing of constraints. For example
 *
 * > var matches = q.find(
 * >    q.subClassOfMatch( "?p", q.objectSomeValuesFromMatch(part_of,
 * >      { var: "w",
 * >        constraint: : function(w, owl) {
 * >                        return owl.isInferredSubClassOf(w, tentacle);
 * >                    ))
 * >   );
 * 
 * TODO:
 *  implement a "..." that matches any number of arguments
 *
 * Scripts:
 *  - owljs-dlmatch
 *
 * Tests:
 *  - test/dlmatch
 *
 */

var javautil = require("owl/javautil");
importPackage(Packages.org.semanticweb.owlapi.model);

/* Function: DLMatch
 *
 * Constructor
 *
 * Arguments:
 *  - owl: an <OWL> object
 */
var DLMatch = exports.DLMatch = function DLMatch(owl) {
    this.owl = owl;
    return this;
}

DLMatch.prototype.eval = function(s) { return eval(s) }



/* Function: find
 *
 * Finds axioms in the ontology that match the query template.
 * Each result will be a dict object, with a key for every variable,
 * a value for matches for that variable.
 *
 * In addition the "axiom" field is also filled in.
 *
 * Arguments:
 *  - q: a query template
 *
 * Returns:
 *  a list of bindings
 */
DLMatch.prototype.find = function(q) {
    var owl = this.owl;
    var axioms = owl.getAllAxioms();
    var matches = [];
    for (var k in axioms) {
        var axiom = axioms[k];
        var m = this.testIfMatches(axiom, q);
        if (m != null) {
            m.axiom = axiom;
            matches.push(m);
        }
    }
    return matches;
}

/* Function: findAndReplace
 *
 * Finds and replaces axioms in the ontology that match the query template.
 *
 * The function rfunc is called on every matching axiom, with the
 * first argument being the bindings object. The function should
 * return an axiom or a list of axioms, which is used to replace the
 * matching axiom.
 *
 * The original axiom can be included in the return list if the goal
 * is to add axioms without replacement; this is equivalent to calling
 * <findAndExtend>
 *
 *
 * Example:
 *
 * > # materialize ?X SubClassOf ?R some ?Y as triples in ABox
 * > q.findAndReplace(
 * >    q.subClassOfMatch( "?x", q.objectSomeValuesFromMatch("?r", "?y")),
 * >    function(m,owl) { return owl.propertyAssertion( m.r, owl.namedIndividual(m.x), owl.namedIndividual(m.y) ) }
 * > );
 *
 * Arguments:
 *  - q: a query template
 *  - rfunc: a function that generates an axiom or list of axioms from the bindings
 *
 * Returns:
 *  <owlapi.OWLAxiom> []
 */
DLMatch.prototype.findAndReplace = function(q, rfunc) {
    return this.findAndReplaceOrExtend(q, rfunc, true);
}

/* Function: findAndExtend
 *
 * As <findAndReplace>, without axiom removal
 *
 * Example:
 *
 * > # Add definitions
 * > var obovocab = require("owl/vocab/obo");
 * > q.findAndExtend(
 * >    q.equivalentClassesMatch( "?x", q.intersectionOfMatch("?genus", q.objectSomeValuesFromMatch("?r", "?y"))),
 * >    function(m,owl) { 
 * >      return obovocab.definitionAssertion( owl, m.x, "A " + owl.getLabel(m.genus) + " that " + owl.getLabel(m.r) + " a " + owl.getLabel(m.y), ["OBOL:auto"] ) 
 * >    }
 * > );
 * > 
 */
DLMatch.prototype.findAndExtend = function(q, rfunc) {
    return this.findAndReplaceOrExtend(q, rfunc, false);
}

DLMatch.prototype.findAndReplaceOrExtend = function(q, rfunc, isRemove) {
    var owl = this.owl;
    var axioms = owl.getAllAxioms();
    var newAxioms = [];
    var rmAxioms = [];
    for (var k in axioms) {
        var axiom = axioms[k];
        var m = this.testIfMatches(axiom, q);
        if (m != null) {
            m.axiom = axiom;
            var replacementAxioms = rfunc.call(this, m, owl);
            if (replacementAxioms == null) {
            }
            else if (replacementAxioms.concat != null) {
                //this.log(ax + " ===> " + replacementAxioms);
                newAxioms = newAxioms.concat(replacementAxioms);
                rmAxioms.push(axiom);
            }
            else {
                //this.log(ax + " ===> " + replacementAxioms);
                newAxioms.push(replacementAxioms);
                rmAxioms.push(axiom);
            }
        }
    }
    owl.addAxioms(newAxioms);
    if (isRemove) {
        owl.removeAxioms(rmAxioms);
    }
    return newAxioms;
}


/* Function: testIfMatches
 *
 * Attempts to match the specified axiom or expression with the query template
 *
 * Arguments:
 *  - x: object to match
 *  - q: a query template
 *
 * Returns:
 *  A binding object, or null if no match
 */
DLMatch.prototype.testIfMatches = function(x, q) {
    if (q.push != null) {
        return this.matchSet(x, q);
    }
    if (this.isVariable(q)) {
        return this.matchVariable(x, q);
    }
    if (q instanceof OWLObject) {
        return this.matchObject(x, q);
    }
    if (typeof q == 'string') {
        return this.matchLiteral(x, q);
    }
    return this.matchKeys(x, q);
}

DLMatch.prototype.isVariable = function(q) {
    var qv = this.getVariable(q);
    if (qv != null) {
        return true;
    }
    return false;
}

// a variable can either be (1) a string "?var" or (2) a dict with a var key
DLMatch.prototype.getVariable = function(q) {
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

DLMatch.prototype.matchVariable = function(x, q) {
    var qv = this.getVariable(q);
    if (qv.constraint != null) {
        if (!qv.constraint.call(this, x, this.owl)) {
            return null;
        }
    }

    var b = {};
    b[qv.var] = x;
    return b;
}

DLMatch.prototype.matchObject = function(x, q) {
    if (x.equals(q)) {
        return {};
    }
    else {
        return null;
    }
}

DLMatch.prototype.matchLiteral = function(x, q) {
    if (x.equals(q)) {
        return {};
    }
    if (x.getIRI != null) {
        return this.matchLiteral(x.getIRI(), q);
    }
    if (x.toString().equals(q)) {
        return {};
    }
    return null;
}

DLMatch.prototype.matchKeys = function(x, q) {
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
            subBindings = this.testIfMatches(subx, subq);
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
DLMatch.prototype.matchSet = function(x, q) {
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
            var b = this.testIfMatches(subx, subq);            
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
DLMatch.prototype.matrixMatch = function(rows, rowNum, selected) {
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

DLMatch.prototype.mergeBindings = function(h1, h2) {
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
DLMatch.prototype.getMethodName = function(k) {
    return "get" + k.slice(0,1).toUpperCase() + k.slice(1);
}


DLMatch.prototype.log = function(msg) {
    //console.log(msg);
}

// ----------------------------------------
// QUERY TEMPLATE CONSTRUCTORS
// ----------------------------------------
// Incomplete, but more are trivially added. Email cjm for assistance.

/* Function: subClassOfMatch
 *
 * Generates a query template corresponding to an <owlapi.OWLSubClassOfAxiom>
 *
 * Arguments:
 *  sub: subclass template
 *  sup: superclass template
 *
 * Returns:
 *  a query template
 */
DLMatch.prototype.subClassOfMatch = function(sub,sup) {
    return {
        a: OWLSubClassOfAxiom,
        subClass: sub,
        superClass: sup
    }
}

/* Function: equivalentClassesMatch
 *
 * Generates a query template corresponding to an <owlapi.OWLEquivalentClassesMatch>
 *
 * Arguments:
 *  - cx1 : an <owlapi.OWLClassExpression>
 *  - cx2 : an <owlapi.OWLClassExpression>
 *  - ...
 *  - cxn : an <owlapi.OWLClassExpression>
 *
 * Returns:
 *  a query template
 */
DLMatch.prototype.equivalentClassesMatch = function() {
    return {
        a: OWLEquivalentClassesAxiom,
        classExpressions : Array.prototype.slice.call(arguments, 0)
    }
}

/* Function: objectPropertyAssertionMatch
 *
 * Generates a query template corresponding to an <owlapi.OWLObjectPropertyAssertion>
 *
 * Arguments:
 *  p : an ObjectPropertyExpression
 *  subject : an OWLIndividual
 *  object : an OWLIndividual
 *
 * Returns:
 *  a query template
 */
DLMatch.prototype.objectPropertyAssertionMatch = function(p,subject,object) {
    return {
        a: OWLObjectPropertyAssertion,
        property: p,
        subject: subject,
        object: object
    }
}

/* Function: annotationPropertyAssertionMatch
 *
 * Generates a query template corresponding to an <owlapi.OWLAnnotationPropertyAssertion>
 *
 * Arguments:
 *  p : an AnnotationProperty
 *  subject : an OWLIndividual
 *  annotation : an OWLIndividual
 *
 * Returns:
 *  a query template
 */
DLMatch.prototype.annotationPropertyAssertionMatch = function(p,subject,object) {
    return {
        a: OWLAnnotationPropertyAssertion,
        property: p,
        subject: subject,
        object: object
    }
}


/* Function: classAssertionMatch
 *
 * Generates a query template corresponding to an <owlapi.OWLClassAssertion>
 *
 * Arguments:
 *  classExpression : an <owlapi.OWLClassExpression>
 *  individual : an <owlapi.OWLIndividual>
 *
 * Returns:
 *  a query template
 */
DLMatch.prototype.classAssertionMatch = function(p,classExpression,individual) {
    return {
        a: OWLClassAssertion,
        classExpression: classExpression,
        individual: individual
    }
}

/* Function: objectSomeValuesFromMatch
 *
 * Generates a query template corresponding to an <owlapi.OWLObjectSomeValuesFrom>
 *
 * Arguments:
 *  p: property template
 *  filler: filler template
 *
 * Returns:
 *  a query template
 */
DLMatch.prototype.objectSomeValuesFromMatch = function(p,filler) {
    return {
        a: OWLObjectSomeValuesFrom,
        property: p,
        filler: filler
    }
}

DLMatch.prototype.someValuesFromMatch = function(p,filler) {
    if (p instanceof OWLDataProperty) {
        return this.dataSomeValuesFromMatch(p, filler);
    }
    else {
        return this.objectSomeValuesFromMatch(p, filler);
    }
}

/* Function: objectIntersectionOfMatch
 *
 * Generates a query template corresponding to an <owlapi.OWLObjectIntersectionOf>
 *
 * Arguments:
 *  - cx1 : an <owlapi.OWLClassExpression>
 *  - cx2 : an <owlapi.OWLClassExpression>
 *  - ...
 *  - cxn : an <owlapi.OWLClassExpression>
 *
 * Returns:
 *  a query template
 */
DLMatch.prototype.objectIntersectionOfMatch = function() {
    return {
        a: OWLObjectIntersectionOf,
        operands : Array.prototype.slice.call(arguments, 0)
    }
}

DLMatch.prototype.intersectionOfMatch = function() {
    return this.objectIntersectionOfMatch.apply(this,arguments);
}
