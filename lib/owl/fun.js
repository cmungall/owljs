/*

  non-OO convenience methods

 */


importPackage(java.io);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);
importPackage(org.semanticweb.owlapi.apibinding);
importPackage(Packages.com.google.gson);

var o = {};
exports.o = o;

var labelToIRIMap = {};

var owl;
exports.owl = owl;
exports.owlinit = function(newOwl) { owl=newOwl };

exports.someValuesFrom = function() {return owl.someValuesFrom.apply(owl,arguments)};
exports.intersectionOf = function() {return owl.intersectionOf.apply(owl,arguments)};
exports.subClassOf = function() {return owl.subClassOf.apply(owl,arguments)};
exports.classAssertion = function() {return owl.classAssertion.apply(owl,arguments)};
exports.equivalentClasses = function() {return owl.equivalentClasses.apply(owl,arguments)};
exports.disjointClasses = function() {return owl.disjointClasses.apply(owl,arguments)};
exports.annotationAssertion = function() {return owl.annotationAssertion.apply(owl,arguments)};
exports.labelAssertion = function() {return owl.labelAssertion.apply(owl,arguments)};
exports.ann = function() {return owl.ann.apply(owl,arguments)};
exports.literal = function() {return owl.literal.apply(owl,arguments)};





// ========================================
// CH..CH..CHANGES
// ========================================

exports.add = function add(obj) {
    return owl.add(obj);
}

function applyChange(change) {
    g().getManager().applyChange(change);
    changes.push(change);
}

function addAxiom(ax) {
    var change = new AddAxiom(ont(), ax);
    applyChange(change);
}
function addAxioms(axs) {
    for (var k in axs) {
        addAxiom(axs[k]);
    }
}
function removeAxiom(ax) {
    var change = new RemoveAxiom(ont(), ax);
    applyChange(change);
    //g().getManager().removeAxiom(ont(),ax);    
}
function removeAxioms(axs) {
    for (var k in axs) {
        removeAxiom(axs[k]);
    }
}

function expandMacros() {
    var mev = new MacroExpansionVisitor(owl.getOntology());
    mev.expandAll();
    mev.dispose();
}

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


//

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

// experimental and DANGEROUS
//  sets a variable for every owl object.
//   e.g. organ = <http://...>
// TODO - warn if dupe label
exports.setClassVars = function () {
    var objs = owl.getAllObjects();
    for (var k=0; k<objs.length; k++) {
        var obj = objs[k];
        //console.log(" obj="+obj + " "+typeof obj);
        //console.log(" obj="+obj + " "+(obj instanceof OWLObject));
        //if (!(obj instanceof OWLObject)) {
        //continue;
        //}
        //console.log(" obj="+obj);
        //debug("making var for "+obj +" " + typeof obj);
        if (owl.isDeprecated(obj)) {
            continue;
        }
        var label = getClassVariableName(obj);
        //console.log(obj + " = "+label);
        // no clobber
        while (this[label] != null || isReserved(label)) {
            print("Remapping "+label +" --> _" + label+" ( current value = "+this[label]+" )");
            label = '_'.label;
        }
        if (label != null) {
            //console.log(" llabel="+label);
            eval("o."+label+" = obj");
        }
    }
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

function safeify(label) {
    label = javaString(label);
    label = label.replaceAll("\\W", "_");
    var c1 = label.substr(0,1);
    if (c1 >= '0' && c1 <= '9') {
        label = "_"+label;
    }
    return label;
}

function getAllOWLObjects() {
    var objs = g().getAllOWLObjects();
    objs.addAll(ont().getAnnotationPropertiesInSignature());
    return objs.toArray();
}


function isReserved(s) {
    if (s == 'id') { return true };
    if (s == 'SubClassOf') { return true };
    if (s == 'EquivalentTo') { return true };
    return false;
}

// creates lookup index
// e.g. objmap.organ
function indexOnt() {
    objmap = {};
    var objs = getAllOWLObjects();
    //var objs = g().getAllOWLObjects().toArray();;
    for (var k in objs) {
        var obj = objs[k];
        var label = getClassVariableName(obj);
        if (label != null) {
            objmap[label] = obj;
        }
    }
}
