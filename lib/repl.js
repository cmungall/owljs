var {OWL} = require("owljs");
var {OWLFrame} = require("owljs/owlframe"); 
var javautil = require("owljs/javautil");
importPackage(java.io);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);
importPackage(org.semanticweb.owlapi.apibinding);
importPackage(org.obolibrary.macro);
importPackage(Packages.com.google.gson);

/*

  Namespace: repl

  Functions designed to be used within a repl or quick-scripting environment

  Example usage:
  > owljs-repl cl.owl
  > 
  > # show a class as a js frame
  > pp(o.epithelial_cell)
  >
  > # create a class expression ("js function" syntax - an actual repl function defined in js)
  > cx = intersectionOf(o.epithelial_cell, someValuesFrom(o.part_of, o.intestine))
  >
  > # iterate over subclasses showing each, using <pp>
  > owl.getInferredSubClasses(cx).forEach(pp)

  Note that in an interactive session such as the one above, tab completion can be used on all of the following:
  - repl functions
  - owl.js functions (prefixed with "owl.")
  - class names (prefixed with "o.")
  - property names (prefixed with "o.")

  Factory functions:

  factory functions mirror those in <OWL>, e.g.

  - <subClassOf> wraps <OWL.subClassOf>
  - <someValuesFrom> wraps <OWL.someValuesFrom>
  - ...
  
  if addModel(true) is called, each repl factory function for an axiom has the side-effect of adding that axiom to the ontology


  See https://github.com/cmungall/owl.js/blob/master/README-REPL.md for more details



*/

/*
  Exported variables:
*/
  
/* Variable: o
 * maps safe-labels to classes, properties and other objects. See <setClassVars>
 */
var o = exports.o = {};

/* Variable: labelToIRIMap
 * maps full labels to IRIs
 */
var labelToIRIMap = exports.labelToIRIMap = {};

/* Variable: owl
 * An <OWL> object
 */
var owl = exports.owl = owl;

/* Variable: obj
 * The current object
 */
var obj = exports.obj = { x : 1};

// ========================================
// INIT
// ========================================

/* Function: newOntology
 *
 * Wraps <OWL.newOntology>
 *
 * Arguments:
 *  - obj: <owlapi.IRI> or iri-as-string (optional)
 */
exports.newOntology = function(iri, imports, anns, v) { 
    owl = new OWL();
    owl.createOntology(iri, imports, anns, v);
    console.log("Created Ont: "+owl);
    return owl;
}

exports.loadowl = function(file, isUseCatalog) { 
    owl = new OWL();
    if (isUseCatalog) {
        owl.addCatalog();
    }
    owl.loadOntology(file);
    owl.config.defaultFile = file;
    setClassVars();
    return owl;
};

exports.owlinit = function(newOwl) { owl=newOwl; setClassVars() };

var setObj = exports.setObj = function(x) { obj = x };
var getObj = exports.getObj = function() { return obj };

// ========================================
// CONVENIENCE
// ========================================

// Function: ont
// Calls: <OWL.getOntology>
var ont = exports.ont = function() { return owl.getOntology() };

// Function: reasoner
// Calls: <OWL.getReasoner>
exports.reasoner = function() { return owl.getReasoner() };

// Function: df
// Calls: <OWL.getOWLDataFactory>
exports.df = function() { return owl.getOWLDataFactory() };

// Function: mgr
// Calls: <OWL.getOWLManager>
exports.mgr = function() { return owl.getOWLManager() };

// Function: log
// Calls: <OWL.log>
var log = exports.log = function(x) { return owl.log(x) };

// Function: frame
// Calls: <OWL.getFrame>
var frame = exports.frame = function(x) { return owl.getFrame(x) };

// ========================================
// SYNTAX
// ========================================

// helper for manchester syntax queries
exports.And = " and ";
exports.Or = " or ";
exports.Some = " some ";
exports.Only = " only ";
exports.omn = function(exprStr) {
    var mst = new ManchesterSyntaxTool(ont(), null, true);
    return mst.parseManchesterExpression(exprStr);
};


// ========================================
// FACTORY FUNCTIONS
// ========================================

exports.someValuesFrom = function() {return owl.someValuesFrom.apply(owl,arguments)};
exports.allValuesFrom = function() {return owl.allValuesFrom.apply(owl,arguments)};
exports.hasValue = function() {return owl.hasValue.apply(owl,arguments)};
exports.intersectionOf = function() {return owl.intersectionOf.apply(owl,arguments)};

exports.declare = function() {return this.xadd(owl.declare.apply(owl,arguments))};
exports.subClassOf = function() {return this.xadd(owl.subClassOf.apply(owl,arguments))};
exports.disjointUnion = function() {return this.xadd(owl.disjointUnion.apply(owl,arguments))};
exports.classAssertion = function() {return this.xadd(owl.classAssertion.apply(owl,arguments))};
exports.propertyDomain = function() {return this.xadd(owl.propertyDomain.apply(owl,arguments))};
exports.propertyRange = function() {return this.xadd(owl.propertyRange.apply(owl,arguments))};
exports.subPropertyOf = function() {return this.xadd(owl.subPropertyOf.apply(owl,arguments))};
exports.subPropertyChainOf = function() {return this.xadd(owl.subPropertyChainOf.apply(owl,arguments))};
exports.equivalentClasses = function() {return this.xadd(owl.equivalentClasses.apply(owl,arguments))};
exports.disjointClasses = function() {return this.xadd(owl.disjointClasses.apply(owl,arguments))};
exports.annotationAssertion = function() {return this.xadd(owl.annotationAssertion.apply(owl,arguments))};
exports.propertyAssertion = function() {return this.xadd(owl.propertyAssertion.apply(owl,arguments))};
exports.labelAssertion = function() {return this.xadd(owl.labelAssertion.apply(owl,arguments))};

exports.ann = function() {return owl.ann.apply(owl,arguments)};
exports.literal = function() {return owl.literal.apply(owl,arguments)};

exports.createOntology = function() {return owl.createOntology.apply(owl,arguments)};


// ========================================
// EDITING
// ========================================

/* Function: mkClass
 *
 * convenience method that generates an <owlapi.OWLClass>.
 * the arguments can be simply a class label, or an object
 * specify key-value pairs for an <OWLFrame>
 *
 * Arguments:
 *  - nameOrObj : a string or a dictionary that is used for an OWLFrame
 *
 * Basic Example:
 * > mkClass("neuron")
 * The generates class with have a IRI created by <genIRI>
 * and will have a single axiom, an annotation for rdfs:label
 *
 * Advanced Example:
 * > mkClass({label: "neuron", comment: "test class"}_
 *
 *
 * Returns:
 *  an <owlapi.OWLClass>
 */
var mkClass = exports.mkClass = function(args) { 
    if (typeof args == 'string') {
        args = { label: args };
    }
    if (args instanceof OWLClass) {
        return args;
    }
    var fr = new OWLFrame(owl, args); 
    setObj(fr);
    fr.stamp();
    owl.add(fr);
    var c = fr.getOWLClass();
    console.log("Setting class var = "+c);
    owl.declare(c);
    setClassVar(c);
    return c;
};

/* Function: mkIndividual
 *
 * analogous to <mkClass>, but makes a named individual
 */
var mkIndividual = exports.mkIndividual = function(args) { 
    if (typeof args == 'string') {
        args = { label: args };
    }
    if (args instanceof OWLIndividual) {
        return args;
    }
    var fr = new OWLFrame(owl, args, OWLIndividual); 
    setObj(fr);
    fr.stamp();
    owl.add(fr);
    var c = fr.getOWLIndividual() ;
    console.log("Setting class var = "+c);
    owl.declare(c);
    setClassVar(c);
    return c;
};


/* Function: mkObjectProperty
 *
 * analogous to <mkClass>, but makes an <owlapi.OWLObjectProperty>
 */
var mkObjectProperty = exports.mkObjectProperty = function(args, rest) { 
    if (typeof args == 'string') {
        var label = args;
        args = (rest == null ? {} : rest);
        args.label = label;
    }
    if (args instanceof OWLObjectProperty) {
        return args;
    }
    var fr = new OWLFrame(owl, args, OWLObjectProperty); 
    setObj(fr);
    fr.stamp();
    owl.add(fr);
    var c = fr.getOWLObjectProperty() ;
    owl.declare(c);
    setClassVar(c);
    return c;
};

/* Function: mkAnnotationProperty
 *
 * analogous to <mkClass>, but makes an <owlapi.OWLAnnotationProperty>
 */
var mkAnnotationProperty = exports.mkAnnotationProperty = function(args) { 
    if (typeof args == 'string') {
        args = { label: args };
    }
    if (args instanceof OWLAnnotationProperty) {
        return args;
    }
    var fr = new OWLFrame(owl, args, OWLAnnotationProperty); 
    setObj(fr);
    fr.stamp();
    owl.add(fr);
    var c = fr.getOWLAnnotationProperty() ;
    owl.declare(c);
    setClassVar(c);
    return c;
};

exports.mkDisjointUnionSimple = function(c, subclasses) {
    var sobjs = subclasses.map(mkClass);
    var ax = owl.disjointUnion( mkClass(c),  sobjs);
    owl.add(ax);
    return ax;
}

/* Function: mkDisjointUntion
 *
 * creates a hierarchical set of disjoint union axioms
 *
 *
 * Example:
 *  see test/repl/mkont.js
 */
exports.mkDisjointUnion = function(obj, axioms) {
    var rcs = [];
    for (var k in obj) {
        var c = mkClass(k);
        var v = obj[k];
        var sobjs;
        if (v == null) {
            console.log("Null for " + obj + " k="+k);
        }
        if (v.push != null) {
            sobjs = v.map(this.mkClass);
        }
        else {
            sobjs = this.mkDisjointUnion(v, axioms);
        }
        if (sobjs.length > 0) {
            var ax = owl.disjointUnion( c, sobjs );
            this.xadd(ax);
            if (axioms != null) {
                axioms.push(ax);
            }
            else {
                if (!addModeOn) {
                    console.warn("Axioms are not being consumed!");
                }
            }
        }
        rcs.push(c);
    }
    return rcs;
}


exports.expandDisjointUnions = function() {
    owl.sedAxioms(
        function(ax) {
            if (ax instanceof OWLDisjointUnionAxiom) {
                var axs = [ax];
                var cxs = javautil.collectionToJsArray(ax.getClassExpressions());
                for (var i in cxs) {
                    var ci = cxs[i];
                    for (var j in cxs) {
                        if (i<j) {
                            var cj = cxs[j];
                            var newax = owl.disjointClasses(ci,cj);
                            axs.push(newax);
                        }
                    }
                    axs.push(owl.subClassOf(ci, ax.getOWLClass()));
                }
                return axs;
            }
            return null;
        }
    );
}

exports.addMembers = function(cls, inds) {
    inds = inds.map(mkIndividual);
    inds.forEach( function(i) {owl.addAxiom(owl.classAssertion(cls,i))} );
    return inds;
}

var addMembersInHierarchy = exports.addMembersInHierarchy = function(hier, opts, parent) {
    if (hier == null) {
        return;
    }
    if (hier.push != null) {
        var nh = {};
        hier.forEach(function(x) { nh[x] = {} });
        hier = nh;
    }
    for (var k in hier) {
        var ind = mkIndividual(k);
        if (opts.class != null) {
            owl.addAxiom(owl.classAssertion(opts.class, ind));
        }
        if (parent != null) {
            console.log(opts.property + "["+ ind +" - "+ parent);
            if (opts.isInvert) {
                owl.addAxiom(owl.propertyAssertion(opts.property, ind, parent));
            }
            else {
                owl.addAxiom(owl.propertyAssertion(opts.property, parent, ind));
            }
        }
        addMembersInHierarchy(hier[k], opts, ind);
    }

}

// ========================================
// CHANGES
// ========================================

var addModeOn = false;
exports.addMode = function addMode(on) { addModeOn = on; return on };

/* Function: add
 *
 * Wraps <OWL.add>
 *
 * Arguments:
 *  - obj: <owlapi.OWLObject> or <owlapi.OWLAxiom>
 */
exports.add = function add(obj) { return owl.add(obj)};

/* Function: addAxiom
 *
 * Wraps <OWL.addAxiom>
 *
 * Arguments:
 *  - obj: <owlapi.OWLAxiom>
 */
exports.addAxiom = function add(obj) { return owl.addAxiom(obj)};

/* Function: removeAxiom
 *
 * Wraps <OWL.removeAxiom>
 *
 * Arguments:
 *  - obj: <owlapi.OWLAxiom>
 */
exports.removeAxiom = function add(obj) { return owl.removeAxiom(obj)};

/* Function: applyChange
 *
 * Wraps <OWL.applyChange>
 *
 * Arguments:
 *  - obj: <owlapi.OWLChangeObject>
 */
exports.applyChange = function add(obj) { return owl.applyChange(obj)};

// internal wrapper for add - if we are in authoring mode,
// axiom is added automatically
exports.xadd = function xadd(obj) { 
    if (addModeOn) {
        return owl.add(obj);
    }
    else {
        return obj;
    }
};


function expandMacros() {
    var mev = new MacroExpansionVisitor(owl.getOntology());
    mev.expandAll();
    mev.dispose();
}
exports.expandMacros = expandMacros;

/* Function: save
 *
 * Wraps <OWL.save>
 *
 * Arguments:
 *  - file
 *  - format
 */
exports.save = function save(file, owlFormat) {
    owl.save(file, owlFormat);
}

// deprecated
function saveAxioms(obj, file, owlFormat) {
    var tmpOnt = owl.getManager().createOntology(IRI.create("http://x.org#")); // TODO
    var axioms = obj;
    if (obj instanceof bbop.owl.OWLFrame) {
        axioms = obj.toAxioms();
    }
    for (var k in axioms) {
        owl.getManager().addAxiom(tmpOnt, axioms[k]);
    }
    var pw = new ParserWrapper();
    if (owlFormat == null) {
        owlFormat = new org.coode.owlapi.obo.parser.OBOOntologyFormat();
    }
    pw.saveOWL(tmpOnt, owlFormat, file, g());
    owl.getManager().removeOntology(tmpOnt);
}

// this is temporary until we resolve ringo vs rhino differences
function javaString(s) {
    if (s == null) {
        return null;
    }
    if (s.replaceAll != null) {
        return s;
    }
    return new java.lang.String(s);
}

// ========================================
// OWL MANIPULATION
// ========================================

/* Function: setClassVars
 *
 * Initializes <o> map
 *
 * for every class C in O, where C has a label L, set
 * > o.L' = C
 *
 * where L' is a "safeified" version of L (ie valid js symbol),
 * with spaces turned to underscores and invalid characters removed
 *
 * Note that this is particularly useful in a REPL. A user can
 * type "o.epi<TAB>" and is offered options such as "epithlium" or "epiblast"
 *
 */
var setClassVars = exports.setClassVars = function () {
    if (owl.getOntology() == null) {
        return;
    }
    var objs = owl.getAllObjects();
    for (var k=0; k<objs.length; k++) {
        var obj = objs[k];
        setClassVar(obj);
    }
}

function setClassVar(obj) {
    if (owl.isDeprecated(obj)) {
        return;
    }
    var label = getClassVariableName(obj);
    if (label == null) {
        return;
    }
    if (label == 'undefined') {
        return;
    }
    // no clobber
    while (o[label] != null || isReserved(label)) {
        if (o[label] != null && o[label].equals(obj)) {
            // already mapped
            return;
        }
        console.log("Remapping "+label +" --> _" + label+" ( current value = "+o[label]+" )");
        label = '_'.label;
    }
    if (label != null) {
        //eval("o."+label+" = obj");
        o[label] = obj;
    }
}

function getPrefixedClassVariableName(obj) {
    var n = getClassVariableName(obj);
    if (n != null) {
        return "o."+n;
    }
    return n;
}

// translate an OWLObject into a variable name can point to the object
function getClassVariableName(obj) {
    var label = owl.getLabel(obj);
    label = javaString(label); // TODO
    if (label == null && obj.getIRI != null) {
        var iri = obj.getIRI();
        if (iri != null) {
            label = iri.toString();
            label = javaString(label); // TODO
            if (label.contains("#")) {
                label = label.replaceAll(".*#","");
            }
            else if (label.contains("/")) {
                label = label.replaceAll(".*/","");
            }
        }
    }
    if (label != null) {
        label = safeify(label);
    }
    labelToIRIMap[label] = obj;
    return label;
}

// make the label safe to use as a js keyword;
// this effectively allows us to write:
// > o.LABEL
// in js, as opposed to
// > o["LABEL"]
function safeify(label) {
    label = javaString(label);
    label = label.replaceAll("\\W", "_");
    var c1 = label.substr(0,1);
    if (c1 >= '0' && c1 <= '9') {
        label = "_"+label;
    }
    return label;
}

function isReserved(s) {
    if (s == 'id') { return true };
    if (s == 'SubClassOf') { return true };
    if (s == 'EquivalentTo') { return true };
    return false;
}

// Function: pp
//
// pretty print a js structure, with special formatting for OWL expressions and <OWLFrame>s
//
// Example:
// > fr = frame(o.epithelial_cell)
// > pp(fr)
//
// Output:
// >  { id: "http://purl.obolibrary.org/obo/CL_0000066",
// >    subClassOf: 
// >      [ o.animal_cell
// >      ],
// >    annotations: 
// >      [ ann(o.database_cross_reference , "CALOHA:TS-2026") ,
// >        ann(o.database_cross_reference , "WBbt:0003672") ,
// >        ann(o.database_cross_reference , "BTO:0000414") ,
// >        ann(o.database_cross_reference , "CARO:0000077") ,
// >        ann(o.database_cross_reference , "FMA:66768") ,
// >        ann(o.database_cross_reference , "FBbt:00000124") ,
// >        ann(o.label , "epithelial cell") ,
// >        ann(o.has_exact_synonym , "epitheliocyte") ,
// >        ann(o.has_obo_namespace , "cell") ,
// >        ann(o.definition , "A cell that is usually found in a two-dimensional sheet with a free surface....")
// >      ]
// >  }
// >  
//
// Note that the output is valid js syntax (but not json, due to the presence of functions).
// Functions are defined in this repl. Evaluating the structure will yield a valid <OWLFrame> object,
// with valid OWL expressions.
//
//
// Status: only a subset of EL is supported but more can be trivially added on request
var pp = exports.pp = function(object, embedded) { 
    print(render(object, 0, embedded));
}

var render = exports.render = function(object, depth, embedded) {
    // for OWLFrames, only show the slotMap
    if (object == null) {
        return "null";
    }
    if (typeof object == 'function') {
        return "<FUNCTION>";
    }
    if (object.isFrame != null) {
        return render(object.slotMap, depth, embedded);
    }
    typeof(depth) == "number" || (depth = 0)
    typeof(embedded) == "boolean" || (embedded = false)
    var newline = false
    var spacer = function(depth) { var spaces = ""; for (var i=0;i<depth;i++) { spaces += "  "}; return spaces }
    var pretty = ""
    if (      typeof(object) == "undefined" ) { pretty += "undefined" }
    else if ( typeof(object) == "boolean" || 
              typeof(object) == "number" ) {    pretty += object.toString() } 
    else if ( typeof(object) == "string" ) {    pretty += quote(object) }
    else if ( object instanceof String ) {    pretty += quote(object) }
    else if (        object  == null) {         pretty += "null" } 
    else if ( object instanceof(Array) ) {
        if ( object.length > 0 ) {
            if (embedded) { newline = true }
            var content = ""
            for each (var item in object) { content += render(item, depth+1) + ",\n" + spacer(depth+1) }
            content = content.replace(/,\n\s*$/, "").replace(/^\s*/,"")
            pretty += "[ " + content + "\n" + spacer(depth) + "]"
        } else { pretty += "[]" }
    } 
    else if (typeof(object) == "object") {
        if (object instanceof OWLAxiom) {
            if (object instanceof OWLEquivalentClassesAxiom) {
                var args = object.getClassExpressions().toArray();
                var args2 = args.map(function(x){ return render(x, depth, embedded)})
                pretty += "equivalentClasses(" + args2.join(", ") + ")";
            }
            else if (object instanceof OWLSubClassOfAxiom) {
                var args = object.getClassExpressions().toArray();
                var args2 = args.map(function(x){ return render(x, depth, embedded)})
                pretty += "subClassOf(" + render(object.getSubClass())+" , "+render(object.getSuperClass())+") ";
            }
            else if (object instanceof OWLPropertyAssertionAxiom) {
                pretty += "propertyAssertion(" + render(object.getProperty()) + " , "+ render(object.getSubject())+ " , "+ render(object.getObject()) + ") ";
            }
            else {
                // TODO
                pretty += object.toString();
            }
        }
        else if (object instanceof OWLObject) {
            
            if (object instanceof OWLNamedObject) {
                pretty += getPrefixedClassVariableName(object); // TODO
            }
            else if (object instanceof OWLObjectSomeValuesFrom) {
                pretty += "someValuesFrom(" + render(object.getProperty()) +" , " + render(object.getFiller())+") ";
            }
            else if (object instanceof OWLAnnotation) {
                pretty += "ann(" + render(object.getProperty()) +" , " + render(object.getValue())+") ";
            }
            else if (object instanceof OWLLiteral) {                
                pretty += quote(object.getLiteral()); // TODO
            }
            else if (object instanceof OWLObjectIntersectionOf) {
                var args = object.getOperandsAsList().toArray();
                var args2 = args.map(function(x){ return render(x, depth, embedded)})
                pretty += "intersectionOf(" + args2.join(", ") + ")";
            }
            else {
                // TODO
                pretty += object.toString();
            }
        }
        else if (object instanceof java.lang.Object) {
            pretty += object;
        }      
        // TODO Object.keys() not in distributed rhino?
        else if ( !(Object.keys) || Object.keys(object).length > 0 ){
            if (embedded) { newline = true }
            var content = ""
            for (var key in object) { 
                var keyStr = key.toString();
                if (keyStr.indexOf("http:")) {
                    //print("LOOKUP: "+key);
                    keyStr = getPrefixedClassVariableName(IRI.create(key)); // TODO
                    if (keyStr == null) {
                        keyStr = key.toString();
                    }
                }
                //log(key + " = " + object[key] + " ; " + typeof object[key]);
                content += spacer(depth + 1) + keyStr + ": " + render(object[key], depth+2, true) + ",\n" 
                //content += spacer(depth + 1) + keyStr + ": " + render(key, depth+2, true) + ",\n" 
            }
            content = content.replace(/,\n\s*$/, "").replace(/^\s*/,"")
            pretty += "{ " + content + "\n" + spacer(depth) + "}"
        } 
        else { pretty += "{}"}
    }
    else { pretty += object.toString() }
    return ((newline ? "\n" + spacer(depth) : "") + pretty)
}

function quote(s) { 
    return "\"" + s + "\"";
}

var c2l = exports.c2l = javautil.collectionToJsArray;

// ----------------------------------------
// Runner commands
// ----------------------------------------
// OWLTools-Runner required

importPackage(Packages.owltools.cli);
importPackage(Packages.owltools.graph);

var runner;

// executes commands using owltools command line syntax.
// E.g.
//   x("-a limb"); // ancestors of limbs
//   x("foo.owl"); // loads foo.owl in graph wrapper
exports.x = exports.owltools = function(args) {
    if (runner == null) {
        log("initializing runner");
        initRunner();
    }
    runner.run(args.split(" "));
}

// initializes runner with new CommandRunner
var initRunner = exports.initRunner = function() {
    runner = new Sim2CommandRunner();
    runner.exitOnException = false;
    runner.isDisposeReasonerOnExit = false;
    if (owl.getOntology() != null) {
        log("Using existing owl.ontology");
        runner.g = new OWLGraphWrapper(owl.getOntology());
    }
    console.log("Initialized runner: " + runner);
}

var getRunner = exports.getRunner = function() { 
    if (runner == null) {
        initRunner();
    }
    return runner; 
};

exports.ogw = function() { 
    return getRunner().g; 
};

var obovocab = require("owljs/vocab/obo");
var oboIdSpace = exports.oboIdSpace = function(obj) {
    return obovocab.getOboIdentifierPrefix(owl, obj);
}

exports.getStats = function() {
    var stats = require("owljs/stats");
    return stats.getOntologyStats(owl);
}

print("REPL enabled, all systems go!");
