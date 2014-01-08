 
/* 
 * Package: owl.js
 *
 * A Ringo/JS library for accessing the <owlapi>
 *
 * The main class is <OWL>, a wrapper for an <owlapi.OWLOntology>
 *
 * This package also defines <OWLFrame>, which is an alternate
 * representation of an owl object such as an <owlapi.OWLClass>,
 * with each axiom about that class is represented as a tag in
 * a dictionary structure (slotMap)
 *
 */


importPackage(java.io);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);
importPackage(org.semanticweb.owlapi.apibinding);
importPackage(org.semanticweb.elk.owlapi);
importPackage(Packages.owltools.io);
importPackage(Packages.com.google.gson);


// TODO
if (java.lang.System.getenv().containsKey("OWLTOOLS_JAR_PATH")) {
    var jarpath = java.lang.System.getenv().get("OWLTOOLS_JAR_PATH");
    addToClasspath(jarpath);
}



// ========================================
// ENGINE
// ========================================

/* Namespace: OWL
 *
 * An object managing an OWL ontology. Each OWL object holds a reference to an <owlapi.OWLOntology> and an <owlapi.OWLReasoner>.
 * It provides convenient js methods that wrap calls in these objects.
 */

/*
 * 
 * Function: OWL
 * 
 *  Constructor
 * 
 * Arguments:
 *  - ontology: an <owlapi.OWLOntology>
 */

var OWL = exports.OWL = function OWL(ont) {
    if (ont != null) {
        //print("ONT="+ont);
        this.ontology = ont;
    }
    this.reasoner = null;
    this.changes = [];
    this.generatedFrames = [];
    this.config = {};
    return this;
}


/* Function: loadOntology
 * 
 * Loads an ontology from an IRI
 * 
 * Arguments:
 *  - IRI: a <owlapi.IRI> or a string denoting an IRI
 *
 * See Also:
 *  - <loadFile>
 */
OWL.prototype.loadOntology = function(iri) {
    //var manager = OWLManager.createOWLOntologyManager();
    if (iri == null) {
        iri = this.config.defaultFile;
    }
    var manager = this.getManager();
    if (typeof iri == 'string') {
        iri = IRI.create(iri);
    }
    this.ontology = manager.loadOntologyFromOntologyDocument(iri);
    return this.ontology;
}

/* Function: loadFile
 * 
 * Loads an ontology from a file
 * 
 * Arguments:
 *  - filename
 *
 * See Also:
 *  - <loadOntology>
 */
OWL.prototype.loadFile = function(filename) {
    //var manager = OWLManager.createOWLOntologyManager();
    if (filename == null) {
        filename = this.config.defaultFile;
    }
    var manager = this.getManager();
    var iri = filename;
    if (typeof iri == 'string') {
        iri = IRI.create( new File(iri));
    }
    this.ontology = manager.loadOntologyFromOntologyDocument(iri);
    return this.ontology;
}

/* Function: getOntology
 * returns: an <owlapi.OWLOntology>
 */
OWL.prototype.getOntology = function() {
    return this.ontology;
}
OWL.prototype.getOntologyIRI = function() {
    if (this.ontology == null) {
        return null;
    }
    return this.ontology.getOntologyID().getOntologyIRI();
}
// deprecated
OWL.prototype.df = function() {
    return this.ontology.getOWLDataFactory();
}
/* Function: getOWLDataFactory
 * returns: an <owlapi.OWLDataFactory>
 */
OWL.prototype.getOWLDataFactory = function() {
    return this.ontology.getOWLDataFactory();
}
/* Function: getManager
 * returns: an <owlapi.OWLManager>
 */
OWL.prototype.getManager = function() {
    if (this.manager == null) {
        this.manager = OWLManager.createOWLOntologyManager();
    }
    return this.manager;
    //return this.getOntology().getOWLOntologyManager();
}
/* Function: addCatalog
 * 
 * Uses a catalog to map to IRI to local paths
 * 
 * Arguments:
 *  - file : path to a catalog XML file
 */
OWL.prototype.addCatalog = function(file) {
    if (file == null) {
        file = "catalog-v001.xml";
    }
    this.getManager().addIRIMapper(new CatalogXmlIRIMapper(file));
}

// @Deprecated
OWL.prototype.getMaker = function() {
    return this;
}

/* Function: getReasoner
 *
 * gets the current reasoner. If none instantiated, will generate one using the
 * current ontology
 *
 * returns: 
 *  An <owlapi.OWLReasoner>
 */
OWL.prototype.getReasoner = function() {
    if (this.reasoner == null) {
        this.reasoner = this.getReasonerFactory().createReasoner(this.getOntology());
    }
    return this.reasoner;
}

/* Function: getReasonerFactory
 *
 * default:
 *  - ElkReasonerFactory
 *
 * returns: 
 *  <owlapi.OWLReasonerFactory>
 */
OWL.prototype.getReasonerFactory = function() {
    if (this.reasonerFactory == null) {
        this.reasonerFactory = new ElkReasonerFactory();
    }
    return this.reasonerFactory;
}

/* Function: getInferredSuperClasses
 *
 * Uses an <owlapi.OWLReasoner> to find inferred superclasses for a class
 *
 * Arguments:
 *  - cls : an <owlapi.OWLClass>
 *  - isDirect : boolean
 *  - isReflexive : boolean
 *
 * Returns: 
 *  list of superclasses
 */
OWL.prototype.getInferredSuperClasses = function(cls, isDirect, isReflexive) {
    if (isDirect == null) {
        isDirect = true;
    }
    var jl = this.getReasoner().getSuperClasses(cls, isDirect).getFlattened();
    var rl = this.a2l(jl.toArray());
    if (isReflexive) {
        rl.concat(this.getInferredEquivalentClasses(cls));
    }
    return rl;
}

OWL.prototype.getInferredEquivalentClasses = function(cls) {
    var jl = this.getReasoner().getEquivalentClasses(cls).getFlattened();
    var rl = this.a2l(jl.toArray());
    return rl;
}

/* Function: getAncestorsOver
 *
 * Uses OWLReasoner to find subsuming class expressions of the form
 *  "P some A" - i.e. the set of ancestors A over P.
 *
 * Implementation: 
 * - materialize classes of the form PA = (P some A) in
 *   an auxhiliary ontology
 * - find superclasses of C
 * - unfold each result to obtain A
 * 
 * Arguments:
 *  - cls : an OWLClass
 *  - prop : an OWLObjectProperty
 *  - isReflexive : boolean
 *  - isDirect : boolean
 * returns: list of ancestors (or direct parents) via prop
 */
OWL.prototype.getAncestorsOver = function(cls, prop, isReflexive, isDirect) {
    var mat = this.materializeExistentialExpressions(prop, isReflexive);
    var supers = this.getInferredSuperClasses(cls, isDirect);
    var ancs = supers.map(function(x) {
        var orig = mat.lookup[x];
        if (orig != null) {
            return orig;
        }
        return x;
    });
    if (isReflexive) {
        ancs.push(cls);
    }
    return ancs;
}

OWL.prototype.materializeExistentialExpressions = function(prop, isReflexive) {
    var suffix = prop.getIRI().toString() + isReflexive;
    var cl = this.a2l(this.getOntology().getClassesInSignature(true).toArray());
    var ontIRI = this.getOntology().getIRI();
    var matOntIRI = IRI.create(ontIRI + suffix);
    var matOnt = this.getManager().createOWLOntology();
    var mat = {
        ontology : matOnt,
        property : prop,
        isReflexive : isReflexive,
        lookup : {}
    };
    for (var k in cl) {
        var c = cl[k];
        var x = this.someValuesFrom(p, c);
        var tmpClsIRI = c.getIRI().toString() + "-" + suffix;
        var tmpCls = this.df().getOWLClass(tmpClsIRI);
        var eca = this.equivalentClasses(tmpCls, x); 
        lookup[tmpCls] = c;
    }
    var change = new AddImports(this.getOntology(), 
                               this.df().getOWLImportsDeclaration(matOntIRI));
    return this.applyChange(change);
    // todo - allow removal
    return mat;
}


/* Function: grepAxioms
 *
 * filters axioms in ontology using a grep function.
 * The function takes on argument - the axiom - and returns
 * true if the axiom is to be included.
 *
 * Example:
 * > var logicAxioms = owl.grepAxioms( function(ax) { return ax.isLogicalAxiom() } );
 *
 * Arguments:
 *  - grepFunc : function
 *
 * Returns: <owlapi.OWLAxiom> []
 */
OWL.prototype.grepAxioms = function(grepFunc, isNegated, isReplace) {
    var inAxioms = this.ontology.getAxioms().toArray();
    if (isNegated == null) {
        isNegated = false;
    }
    var filteredAxioms = [];
    for (var k in inAxioms) {
        var ax = inAxioms[k];
        if (isNegated) {
            if (!grepFunc.call(this, ax, this)) {
                filteredAxioms.push(ax);
            }
        }
        else {
            if (grepFunc.call(this, ax, this)) {
                filteredAxioms.push(ax);
            }
        }
    }
    if (isReplace) {
        this.removeAxioms(inAxioms);
        this.addAxioms(filteredAxioms);
    }
    return filteredAxioms;
}

/* Function: sedAxioms
 *
 * filters and replace axioms in ontology using a custom function.
 * The function takes on argument - the potentially replaced axiom - and
 * returns a replaced axiom. If null is returned, no action is taken
 *
 * Example:
 * > // invert all subclass axioms
 * > owl.sedAxioms( 
 * >  function(ax, owl) { 
 * >    if (ax instanceof OWLSubClassOf) { return owl.subClassOf(ax.getSuperClass(), ax.getSubClass()) }
 * >  });
 *
 * Arguments:
 *  - grepFunc : function
 *
 * Returns: <owlapi.OWLAxiom> []
 */
OWL.prototype.sedAxioms = function(sedFunc) {
    var inAxioms = this.ontology.getAxioms().toArray();
    var newAxioms = [];
    var rmAxioms = [];
    for (var k in inAxioms) {
        var ax = inAxioms[k];
        var ax2 = sedFunc.call(this, ax);
        if (ax2 == null) {
        }
        else if (ax2.concat != null) {
            //console.log(ax + " ===> " + ax2);
            newAxioms = newAxioms.concat(ax2.concat);
            rmAxioms.push(ax);
        }
        else {
            //console.log(ax + " ===> " + ax2);
            newAxioms.push(ax2);
            rmAxioms.push(ax);
        }
    }
    this.addAxioms(newAxioms);
    this.removeAxioms(rmAxioms);
    return newAxioms;
}


/* Function: saveAxioms
 *
 * Arguments:
 *  - axiom : <owlapi.OWLAxiom> [] or <OWLFrame>
 *  - file : fileName
 *  - owlFormat : e.g. an instance of RDFXMLOntologyFormat
 *
 */
OWL.prototype.saveAxioms = function(obj, file, owlFormat) {
    var tempIRI = IRI.create("http://x.org#temp-"+java.util.UUID.randomUUID());

    var tmpOnt = this.getManager().createOntology(tempIRI); // TODO
    var axioms = obj;
    if (obj instanceof OWLFrame) {
        axioms = obj.toAxioms();
    }
    // add to temp ontology
    for (var k in axioms) {
        this.getManager().addAxiom(tmpOnt, axioms[k]);
    }
    this.saveOntology(tmpOnt, file, owlFormat);
}

/* Function: saveOntology
 *
 * Arguments:
 *  - ontology: <owlapi.OWLOntology>
 *  - file : fileName  (if null, writes to stdout)
 *  - owlFormat : e.g. an instance of RDFXMLOntologyFormat
 *
 */
OWL.prototype.saveOntology = function(ont, file, owlFormat) {

    var isStdout = false;
    if (file == null) {
        //file = this.config.defaultFile;
        var Files = require("ringo/utils/files");
        file = Files.createTempFile("owl",".owl",".");
        isStdout = true;
    }

    if (owlFormat == null) {
        owlFormat = this.config.defaultFormat;
    }
    if (owlFormat == null) {
        owlFormat = new RDFXMLOntologyFormat();
    }
    this.getManager().saveOntology(ont, owlFormat, IRI.create(new File(file)));
    if (isStdout) {
        var fs = require('fs');
        var payload = fs.read(file);
        print(payload);
    }
}

/* Function: save
 *
 * Purpose: saves current ontology
 *
 * Arguments:
 *  - file : fileName  (if null, writes to stdout)
 *  - owlFormat : [optional] e.g. an instance of RDFXMLOntologyFormat
 *
 */
OWL.prototype.save = function(file, owlFormat) {
    this.saveOntology(this.getOntology(), file, owlFormat);
}

// ----------------------------------------
// SERIALIZATION
// ----------------------------------------

// IN-PROGRESS
OWL.prototype.generateJSON = function(frame) {
    var json = 
        {
            id : frame.iri,
            test : "foo"
        };
    var slotMap = frame.slotMap;
    for (var k in slotMap) {
        console.log(k + " = " + slotMap[k]);
        json[k] = slotMap[k].toString();
    }
    return json;
}


// ----------------------------------------
// CHANGES
// ----------------------------------------

OWL.prototype.applyChange = function(change) {
    this.getManager().applyChange(change);
    this.changes.push(change);
    return change;
}

/* Function: add
 * Adds an axiom or axioms to ontology
 * Arguments:
 *  - ax : <owlapi.OWLAxiom> or <OWLFrame>
 */
OWL.prototype.add = function(ax) {
    if (ax instanceof OWLAxiom) {
        return this.addAxiom(ax);
    }
    else if (ax instanceof OWLFrame) {
        return this.addAxioms(ax.toAxioms());
    }
    else if (ax.concat != null) {
        return this.addAxioms(ax);
    }
    else {
        print("FAIL: "+ax);
    }
}

/* Function: addAxiom
 * Adds an axiom to ontology
 * Arguments:
 *  - ax : <owlapi.OWLAxiom>
 */
OWL.prototype.addAxiom = function(ax) {
    var change = new AddAxiom(this.getOntology(), ax);
    return this.applyChange(change);
}

/* Function: addAxioms
 * Adds axioms to ontology
 * Arguments:
 *  - axs : <owlapi.OWLAxiom>[]
 */
OWL.prototype.addAxioms = function(axs) {
    for (var k in axs) {
        this.addAxiom(axs[k]);
    }
    return axs;
}

/* Function: removeAxiom
 * Removes an axiom from ontology
 * Arguments:
 *  - ax : <owlapi.OWLAxiom>
 */
OWL.prototype.removeAxiom = function(ax) {
    var change = new RemoveAxiom(this.getOntology(), ax);
    this.applyChange(change);
    //g().getManager().removeAxiom(this.getOntology(),ax);    
}

/* Function: removeAxioms
 * Removes axioms from ontology
 * Arguments:
 *  - axs : <owlapi.OWLAxiom> []
 */
OWL.prototype.removeAxioms = function(axs) {
    for (var k in axs) {
        this.removeAxiom(axs[k]);
    }
}

/* Function: replaceAxiom
 * Replaces one axiom with another
 *
 * Arguments:
 *  - oldAxiom : <owlapi.OWLAxiom>
 *  - newAxioms : <owlapi.OWLAxiom> (or a list)
 */
OWL.prototype.replaceAxiom = function(oldAxiom, newAxioms) {
    this.removeAxiom(oldAxiom);
    this.addAxioms(newAxioms);
}

// ----------------------------------------
// UTIL
// ----------------------------------------

/* Function: getAnnotations
 *
 * Argument:
 *  - obj: <owlapi.OWLNamedObject> or <owlapi.IRI> or IRI-as-string
 *  - prop: <owlapi.OWLAnnotationProperty> or <owlapi.IRI> or IRI-as-string
 *
 * returns: <owlapi.OWLAnnotation> []
 */
OWL.prototype.getAnnotations = function(obj,prop) {
    if (!(obj instanceof OWLNamedObject)) {
        // note: it doesn't matter what kind of OWLNamedObject we create here
        if (!(obj instanceof IRI)) {
            obj = IRI.create(obj);
        }
        if (obj instanceof IRI) {
            obj = this.df().getOWLClass(obj);
        }
    }

    var onts = this.getOntology().getImportsClosure().toArray();
    var anns = [];
    for (var k in onts) {
        var ont = onts[k];
        if (prop == null) {
            anns = anns.concat( this.a2l(obj.getAnnotations(ont).toArray()) );
        }
        else {
            prop = this.ensureAnnotationProperty(prop);
            anns = anns.concat( this.a2l(obj.getAnnotations(ont, prop).toArray()) );
        }
    }
    return anns;
}

/* Function: getLabel
 *
 * Argument:
 *  - obj: <owlapi.OWLNamedObject> or <owlapi.IRI> or IRI-as-string
 *
 * returns: string
 */
OWL.prototype.getLabel = function(obj) {
    var anns = this.getAnnotations(obj, org.semanticweb.owlapi.vocab.OWLRDFVocabulary.RDFS_LABEL.getIRI());
    var label = null;
    for (var k in anns) {
        if (label != null) {
            print("WARNING: multi-labels "+obj); // TODO
        }
        label = anns[k].getValue().getLiteral();
    }
    return label;
}

OWL.prototype.getIRIOfObject = function(obj) {
    return obj.getIRI().toString();
}

OWL.prototype.getIRI = function(iriStr) {
    return IRI.create(iriStr);
}

/* Function: find
 *
 * Example:
 * > cls = owl.find("epithelium")
 *
 * Argument:
 *  - key: string containing IRI or label
 *
 * returns: <owlapi.OWLObject>
 */
OWL.prototype.find = function(key) {
    var objs = this.getAllObjects();
    for (var k in objs) {
        var obj = objs[k];
        if (this.keyMatches(key, obj)) {
            return obj;
        }
    }
}

OWL.prototype.keyMatches = function(key, obj) {
    if (obj.toString() == key) {
        return true;
    }
    var label = this.getLabel(obj);
    if (label != null && label.equals(key)) {
        return true;
    }
    return false;
}

OWL.prototype.a2l = function(a) {
    //return [_ for (_ in Iterator(a))]
    var l = [];
    for (var k=0; k<a.length; k++) {
        l.push(a[k]);
    }
    return l;
}

/* Function: getClasses
 * Returns: <owlapi.OWLClass> []
 */
OWL.prototype.getClasses = function() {
    return this.a2l(this.getOntology().getClassesInSignature(true).toArray());
}
/* Function: getIndividuals
 * Returns: <owlapi.OWLNamedIndividual> []
 */
OWL.prototype.getIndividuals = function() {
    return this.a2l(this.getOntology().getIndividualsInSignature(true).toArray());
}

/* Function: getObjectProperties
 * Returns: <owlapi.OWLObjectProperties> []
 */
OWL.prototype.getObjectProperties = function() {
    return this.a2l(this.getOntology().getObjectPropertiesInSignature(true).toArray());
}

/* Function: getAnnotationProperties
 * Returns: <owlapi.OWLAnnotationProperties> []
 */
OWL.prototype.getAnnotationProperties = function() {
    return this.a2l(this.getOntology().getAnnotationPropertiesInSignature().toArray());
}

OWL.prototype.getAllObjects = function(key) {
    var objs = [];
    var classes = this.getClasses();
    objs = objs.concat(classes);

    var rels = this.getObjectProperties();
    objs = objs.concat(rels);

    var aps = this.getAnnotationProperties();
    objs = objs.concat(aps);

    console.log("#o="+objs.length);
    
    return objs;
}

/* Function: isDeprecated
 * Arguments:
 *  - obj : OWLObject
 *
 * returns: boolean
 */
OWL.prototype.isDeprecated = function(obj) {
    var anns = this.getAnnotations(obj, this.df().getOWLAnnotationProperty(org.semanticweb.owlapi.vocab.OWLRDFVocabulary.OWL_DEPRECATED.getIRI()));
    for (var k in anns) {
        if (anns[k].getValue && anns[k].getValue().getLiteral() == 'true') {
            return true;
        }
    }
    return false;
}

/* Function: getFrame
 *
 * Argument:
 *  - obj: OWLObject
 *
 * returns: <OWLFrame>
 */
OWL.prototype.getFrame = function(obj) {
    var f = new OWLFrame(this, obj);
    return f;
}


OWL.prototype.getFrameMap = function() {
    var axioms = this.getOntology().getAxioms().toArray();
    var f = new OWLFrame(this);
    //print("Axioms:"+axioms.length);
    var fmap = f.axiomsToFrameMap(axioms);
    return fmap;
}

OWL.prototype.ensureClassExpression = function(obj) {
    // in future this may perform translation of json objects to OWL
    if (typeof obj == 'string' || obj instanceof String) {
        obj = IRI.create(obj);
    }
    if (obj instanceof IRI) {
        obj = this.df().getOWLClass(obj);
    }
    if (!(obj instanceof OWLClassExpression)) {
        print("WARNING: not CEX: "+obj);
    }
    return obj;
}

OWL.prototype.ensureAnnotationProperty = function(prop) {
    if (!(prop instanceof OWLAnnotationProperty)) {
        if (!(prop instanceof IRI)) {
            prop = IRI.create(prop);
        }
        if (prop instanceof IRI) {
            prop = this.df().getOWLAnnotationProperty(prop);
        }
    }
    return prop;
}

/* Function: someValuesFrom
 * Arguments:
 *  - p : <owlapi.OWLProperty>
 *  - filler : <owlapi.OWLExpression>
 *
 * returns: <owlapi.OWLObjectSomeValuesFrom> or <owlapi.OWLDataSomeValuesFrom>
 */
OWL.prototype.someValuesFrom = function(p, filler) {
    if (p instanceof OWLDataPropertyExpression) {
        return this.df().getOWLDataSomeValuesFrom(p, filler);
    }
    else {
        return this.df().getOWLObjectSomeValuesFrom(p, filler);
    }
}

/* Function: intersectionOf
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - x1 : <owlapi.OWLClassExpression>
 *  - x2 : <owlapi.OWLClassExpression>
 *  - ...
 *  - xn : <owlapi.OWLClassExpression>
 *
 * returns: OWLObjectIntersectionOf or OWLDataIntersectionOf
 */
OWL.prototype.intersectionOf = function() {
    var xset = new java.util.HashSet();
    var isData = false;
    for (var k=0; k<arguments.length; k++) {
        // todo - detect isData
        xset.add(arguments[k]);
    }
    if (isData) {
        return this.df().getOWLDataIntersectionOf(xset);
    }
    else {
        return this.df().getOWLObjectIntersectionOf(xset);
    }
}

OWL.prototype.makeAnnotationProperty = function(p) {
    if (typeof p == 'string') {
        p = IRI.create(p);
    }
    if (p instanceof IRI) {
        p = this.df().getOWLAnnotationProperty(p);
    }
    return p;
}

/* Function: ann
 * Arguments:
 *  - p : OWLAnnotationProperty or IRI or string
 *  - v : value
 *
 * Returns: OWLAnnotation
 */
OWL.prototype.ann = function(p,v) {
    p = this.makeAnnotationProperty(p);
    if (typeof v == 'string') {
        v = this.literal(v);
    }
    return this.df().getOWLAnnotation(p,v);
};


// AXIOMS

OWL.prototype.class = function (iri) { 
    if (iri instanceof IRI) {
        return this.df().getOWLClass(iri);
    }
    else {        
        return this.class(iri.getIRI());
    }
}

/* Function: subClassOf
 * Arguments:
 *  - sub : <owlapi.OWLClassExpression>
 *  - sup : <owlapi.OWLClassExpression>
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.subClassOf = function (sub,sup) { return this.df().getOWLSubClassOfAxiom(sub,sup) }

/* Function: classAssertion
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - c : OWLClassExpression
 *  - i : OWLIndividual
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.classAssertion = function (c,i) { return this.df().getOWLClassAssertionAxiom(c,i) }

/* Function: equivalentClasses
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - x1, x2, ... : OWLClassExpression
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.equivalentClasses = function() {
    var set = new java.util.HashSet();
    for (var k=0; k<arguments.length; k++) {
        set.add(this.ensureClassExpression(arguments[k]));
    }
    return this.df().getOWLEquivalentClassesAxiom(set);
}

/* Function: disjointClasses
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - x1, x2, ... : OWLClassExpression
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.disjointClasses = function() {
    var set = new java.util.HashSet();
    for (var k=0; k<arguments.length; k++) {
        set.add(arguments[k]);
    }
    return this.df().getOWLDisjointClassesAxiom(set);
};

/* Function: disjointUntion
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - c : OWLClass
 *  - x1, x2, ... : OWLClassExpression
 *
 * Returns: OWLAxiom
 */
OWL.prototype.disjointUnion = function(c) {
    var set = new java.util.HashSet();
    for (i=1; i<arguments.length; i++) {
        set.add(this.ensureClassExpression(arguments[i]));
    }
    return this.df().getOWLDisjointUnionAxiom(c, set);
}

/* Function: annotationAssertion
 * Arguments:
 *  - p : OWLAnnotationProperty
 *  - s : OWLObject or IRI or string
 *  - v : value
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.annotationAssertion = function(p,s,v) {
    if (typeof p == 'string') {
        p = IRI.create(p);
    }
    if (p instanceof IRI) {
        p = this.df().getOWLAnnotationProperty(p);
    }
    if (typeof v == 'string') {
        v = this.literal(v);
    }
    if (s.getIRI != null) {
        s = s.getIRI();
    }
    if (!(s instanceof IRI)) {
        s = IRI.create(s);
    }
    return this.df().getOWLAnnotationAssertionAxiom(p,s,v);
};

/* Function: labelAssertion
 * Arguments:
 *  - s : OWLObject or IRI or string
 *  - v : value
 *
 * Returns: <owlapi.OWLAxiom>
 */
OWL.prototype.labelAssertion = function(s,v) {
    return this.annotationAssertion(this.df().getOWLAnnotationProperty(org.semanticweb.owlapi.vocab.OWLRDFVocabulary.RDFS_LABEL.getIRI()),
                                    s,v);
};

OWL.prototype.literal = function(v) {
    return this.df().getOWLLiteral(v);
};



/* Function: genIRI
 *
 * generators an available IRI within the default ID space
 *
 * Warning: Assumes OBO PURLs
 *
 * Returns: IRI string
 */
OWL.prototype.genIRI = function() {
    if (this.config.lastId == null) {
        console.warn("config.lastId not set");
        this.config.lastId = 0;
    }
    this.config.lastId++;
    console.log("generating a new IRI. lastId="+this.config.lastId);
    var localId = java.lang.String.format("%07d", new java.lang.Integer(this.config.lastId));
    var iriStr = "http://purl.obolibrary.org/obo/"+this.config.idspace+"_"+localId;
    var iri = IRI.create(iriStr);
    var isUsed = false;
    var id = this.config.idspace+":"+localId;
    
    if (this.getOntology().getAnnotationAssertionAxioms(iri).size() > 0) {
        isUsed = true;
    }
    else {
        var c = this.df().getOWLClass(iri);
        if (this.getOntology().getAxioms(c).size() > 0) {
            isUsed = true;
        }
    }
    if (!isUsed) {
        var aaas = this.getOntology().getAxioms(AxiomType.ANNOTATION_ASSERTION).toArray();
        print("Checking AAAs "+aaas.length+" for "+id);
        for (var k in aaas) {
            var ax = aaas[k];
            v = ax.getValue();
            if (v.getLiteral != null && v.getLiteral().toString() == iriStr) {
                print("used in assertion: "+ax);
                isUsed = true;
                break;
            }
            if (v.getLiteral != null && v.getLiteral().toString() == id) {
                print("used in assertion: "+ax);
                isUsed = true;
                break;
            }
        }
    }

    if (isUsed) {
        print(" USED: "+iri);
        return this.genIRI();
    }
    else {
        return iri;
    }
}


OWL.prototype.concatLiteral = function() {
    var aa = Array.prototype.slice.call(arguments, 0);
    var thisRef = this;
    var toks = 
        aa.map(
        function(t){
            if (typeof t == 'string') {
                return t;
            }
            else {
                return thisRef.getLabel(t); 
            }
        }).join(" ");
    return toks;
};


/*
 * Function: generateXP
 *
 * Generates a class frame using a basic genus-differentia pattern
 * 
 * May be moved to a subclass in future...
 * 
 * Parameters:
 *  - genus - the base parent class
 *  - relation - the OWLObjectProperty of the differentiating characteristic
 *  - filler - the OWLClassExpression of the differentiating characteristic
 * 
 * Returns: <OWLFrame>
 */
OWL.prototype.generateXP = function(genus, relation, diff, defaultMap) {
    if (defaultMap == null) {
        defaultMap = {};
    }

    var iri = this.genIRI();
    console.log("IRI="+iri);
    var id = iri.toString();
    var label = this.concatLiteral(genus,'of',diff);
    if (defaultMap.label != null) {
        label = defaultMap.label;
    }
    var ex = this.intersectionOf(genus, this.someValuesFrom(relation,diff));
    if (defaultMap.definition == null) {
        defaultMap.definition = this.concatLiteral('a',genus,'that is',relation,'a',diff);
    }
    //var dkey = this.find("definition");
    //if (dkey == null) {
    //dkey = "definition";
//}
    console.log("EX = "+ex);
    var slotMap = {
        id: id,
        label: label,
        //annotations: {property:has_related_synonym, value: this.concatLiteral(diff,genus)},
        // TODO annotations: m.ann(has_exact_synonym, this.concatLiteral(diff,genus)),
        definition: defaultMap.definition,
        equivalentTo: ex
    };
    console.log("SM = "+slotMap);
    var f = new OWLFrame(this, slotMap);
    f.stamp();
    this.generatedFrames.push(f);
    return f;
}

OWL.prototype.makeFrames = function() {
    var gen = this;
    var aa = Array.prototype.slice.call(arguments, 0);
    return aa.map(function(args) {return gen.makeFrame.apply(gen,args)});
}

// TODO - allow level-setting
OWL.prototype.log = function(msg) {
    console.log(msg);
}
OWL.prototype.warn = function(msg) {
    console.warn(msg);
}





/* 
 * 
 * Namespace: OWLFrame
 *
 * An alternate representation of an owl object such as an
 * <owlapi.OWLClass>, with each axiom about that class is represented
 * as a tag in a dictionary structure (slotMap)
 * 
 * An OWLFrame is a representation of axioms associated with a particular OWLObject.
 * It consists of a slotMap, which is a dictionary with the following keys:
 *
 *  - id : a IRI string
 *  - type : (TODO) e.g. "Class"
 *  - SubClassOf, equivalentTo, annotations, ... : axiom info (list or single value)
 * 
 * In addition, "flattened" representations are allowed.
 * here, the key is the IRI for an OWLProperty.
 *  - if this is an annotation property IRI, then this is a shorthand for an "annotations" key with this property.
 *  - if this is an object property IRI, then this is a shorthand for an "subClassOf" key with a someValuesFrom expression with this property
 * 
 * 
 * constructor
 *
 * Arguments:
 *  - owl - An <OWL> object
 *  - obj - either an OWLObject or a slotMap dictionary
 */
var OWLFrame = exports.OWLFrame = function(gen, obj) {
    this.generator = gen; // TODO <- this is now just an OWL object, but we call it gen for consistency with old model for now
    this.type = null;
    // translate from an OWLObject (e.g. OWLClass) to a frame
    if (obj instanceof OWLObject) {
        var axioms = gen.getOntology().getAxioms(obj);
        var annAxioms = gen.getOntology().getAnnotationAssertionAxioms(obj.getIRI());
        axioms.addAll(annAxioms);
        var fmap = this.axiomsToFrameMap(axioms.toArray());
        this.slotMap = fmap[this.getKey(obj)];
    }
    else {
        this.slotMap = obj;
    }
}

/* Function: flatten
 * 
 * translates:
 *  - annotations: [ann(p1,v1), ann(p2,v2), ..] ==> p1: v1, p2: v2, ..
 *  - subClassOf: [someValuesFrom(p1,v1),someValuesFrom(p2,v2), ..] ==> p1: v1, p2: v2, ..
 */
OWLFrame.prototype.flatten = function(opts) { 
    if (this.slotMap.annotations != null) {
        if (!(this.slotMap.annotations instanceof Array)) {
            this.slotMap.annotations = [this.slotMap.annotations];
        }
        for (var k in this.slotMap.annotations) {
            var ann = this.slotMap.annotations[k];
            var p = ann.getProperty();
            var pid = this.getKey(p);
            if (!this.slotMap[pid]) {
                this.slotMap[pid] = ann.getValue();
            }
            else {
                if (!(this.slotMap[pid] instanceof Array)) {
                    this.slotMap[pid] = [this.slotMap[pid]];
                }
                this.slotMap[pid].push(ann.getValue());
            }
        }
        delete this.slotMap.annotations;
    }
    if (this.slotMap.subClassOf != null) {
        var newSupers = [];
        if (!(this.slotMap.subClassOf instanceof Array)) {
            this.slotMap.subClassOf = [this.slotMap.subClassOf];
        }
        for (var k in this.slotMap.subClassOf) {
            var sup = this.slotMap.subClassOf[k];
            if (sup instanceof OWLObjectSomeValuesFrom) {
                var p = sup.getProperty();
                var pid = this.getKey(p);
                if (!this.slotMap[pid]) {
                    this.slotMap[pid] = sup.getFiller();
                }
                else {
                    if (!(this.slotMap[pid] instanceof Array)) {
                        this.slotMap[pid] = [this.slotMap[pid]];
                    }
                    this.slotMap[pid].push(sup.getFiller());
                }
            }
            else {
                newSupers.push(sup);
            }
        }
        this.slotMap.subClassOf = newSupers;
    }
    
}

/* Function: stamp
 *
 * Adds default slot values to frame, including:
 *  - dc:creator
 *  - dc:date
 *
 * Returns: string
 */
OWLFrame.prototype.stamp = function() {
    //print("STAMPING...");
    if (this.slotMap.id == null) {
        this.slotMap.id = this.generator.genIRI().toString(); // TODO
    }
    if (this.slotMap.date == null) {
        //this.slotMap.date = '';
    }
    if (this.generator.config.defaultSlotMap != null) {
        for (var k in this.generator.config.defaultSlotMap) {
            if (this.slotMap[k] == null) {
                this.slotMap[k] = this.generator.config.defaultSlotMap[k];
            }
        }
    }
    return this;
};


/* Function: render
 *
 * Renders the frame as javascript
 *
 * Returns: string
 */
OWLFrame.prototype.render = function() {
    return this.pp(this.slotMap);
};

OWLFrame.prototype.quote = function(s) { 
    return "\"" + s + "\"";
}


OWLFrame.prototype.pp = function(object, depth, embedded) { 
    typeof(depth) == "number" || (depth = 0)
    typeof(embedded) == "boolean" || (embedded = false)
    var newline = false
    var spacer = function(depth) { var spaces = ""; for (var i=0;i<depth;i++) { spaces += "  "}; return spaces }
    var pretty = ""
    if (      typeof(object) == "undefined" ) { pretty += "undefined" }
    else if ( typeof(object) == "boolean" || 
              typeof(object) == "number" ) {    pretty += object.toString() } 
    else if ( typeof(object) == "string" ) {    pretty += this.quote(object) }
    else if ( object instanceof String ) {    pretty += this.quote(object) }
    else if (        object  == null) {         pretty += "null" } 
    else if ( object instanceof(Array) ) {
        if ( object.length > 0 ) {
            if (embedded) { newline = true }
            var content = ""
            for each (var item in object) { content += this.pp(item, depth+1) + ",\n" + spacer(depth+1) }
            content = content.replace(/,\n\s*$/, "").replace(/^\s*/,"")
            pretty += "[ " + content + "\n" + spacer(depth) + "]"
        } else { pretty += "[]" }
    } 
    else if (typeof(object) == "object") {
        if (object instanceof OWLObject) {
            
            if (object instanceof OWLNamedObject) {
                pretty += this.getClassVariableName(object); // TODO
            }
            else if (object instanceof OWLObjectSomeValuesFrom) {
                pretty += "someValuesFrom(" + this.pp(object.getProperty()) +" , " + this.pp(object.getFiller())+") ";
            }
            else if (object instanceof OWLAnnotation) {
                pretty += "ann(" + this.pp(object.getProperty()) +" , " + this.pp(object.getValue())+") ";
            }
            else if (object instanceof OWLLiteral) {                
                pretty += this.quote(object.getLiteral()); // TODO
            }
            else if (object instanceof OWLObjectIntersectionOf) {
                var args = object.getOperandsAsList().toArray();
                var args2 = args.map(function(x){ return this.pp(x, depth, embedded)})
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
                    keyStr = this.getClassVariableName(IRI.create(key)); // TODO
                    if (keyStr == null) {
                        keyStr = key.toString();
                    }
                }
                content += spacer(depth + 1) + keyStr + ": " + this.pp(object[key], depth+2, true) + ",\n" 
            }
            content = content.replace(/,\n\s*$/, "").replace(/^\s*/,"")
            pretty += "{ " + content + "\n" + spacer(depth) + "}"
        } 
        else { pretty += "{}"}
    }
    else { pretty += object.toString() }
    return ((newline ? "\n" + spacer(depth) : "") + pretty)
}


OWLFrame.prototype.addFrame = function() {
    this.addAxioms(this.toAxioms());
};

OWLFrame.prototype.ensureHasId = function() {
    if (this.slotMap.id == null) {
        this.slotMap.id = this.genIRI().toString();
    }
    return this.slotMap.id;
}

/* Function: toAxioms
 *
 * Returns: <owlapi.OWLAxiom>[]
 */
OWLFrame.prototype.toAxioms = function() {
    this.ensureHasId();
    var f = this.slotMap;
    var owl = this.generator;
    var id = f.id;
    var obj = id;
    //print("Generating axioms for frame: "+id);

    // todo - types
    if (!(obj instanceof OWLClassExpression)) {
         obj = owl.ensureClassExpression(id);
    }
    //print("  Obj: "+obj + " " + obj instanceof OWLClass);
    var axioms = [];
    for (var k in f) {
        var v = f[k];
        var vs = v;
        if (!(v instanceof Array)) {
            vs = [v];
        }
        // TODO - split this to allow generation of individual axioms
        for (var i=0; i<vs.length; i++) {
            var v = vs[i];
            //print(k+" = "+v + " // "+i+" of "+vs.length);
            switch(k.toLowerCase()) 
            {
            case 'id' : 
                break;
            case 'subclassof' :
                axioms.push(owl.subClassOf(obj, owl.ensureClassExpression(v)));
                break;
            case 'equivalentto' :
                axioms.push(owl.equivalentClasses(obj, owl.ensureClassExpression(v)));
                break;
            case 'disjointwith' :
                axioms.push(owl.disjointClasses(obj, owl.ensureClassExpression(v)));
                break;
            case 'label' :
                axioms.push(owl.labelAssertion(obj, owl.literal(v)));
                break;
            case 'annotations' :
                axioms.push(owl.annotationAssertion(v.property, obj, owl.literal(v.value)));
                break;
            default :
                // todo - allow properties
                var p = k;
                if (typeof p == 'string') {
                    p = owl.find(k);
                }
                if (p instanceof OWLAnnotationProperty) {
                    axioms.push(owl.annotationAssertion(p, obj, owl.literal(v)));
                }
                else if (p instanceof OWLObjectProperty) {
                    axioms.push(owl.subClassOf(obj, owl.someValuesFrom(p, owl.ensureClassExpression(v))));
                }
                else {
                    print("unknown: "+k);
                }
            }
        }
    }
    //print("axioms:"+axioms.length);

    for (var k in axioms) {
        var a = axioms[k];
    }
    return axioms;
};

OWLFrame.prototype.getKey = function(obj, opts) {
    if (obj instanceof OWLNamedObject) {
        return obj.getIRI().toString();
    }
    if (obj instanceof IRI) {
        return obj.toString();
    }
    return obj.toString();
}

// generate frames from axioms
OWLFrame.prototype.axiomsToFrameMap = function(axioms, renderer) {

    var fmap = {};
    for (var k in axioms) {
        var ax = axioms[k];
        if (ax instanceof OWLSubClassOfAxiom) {
            var x = this.getKey(ax.getSubClass());
            if (fmap[x] == null) {
                fmap[x] = { id:x };
            }
            if (fmap[x].subClassOf == null) {
                fmap[x].subClassOf = [];
            }
            //fmap[x].subClassOf.push(render(ax.getSuperClass()));
            fmap[x].subClassOf.push(ax.getSuperClass());
        }
        else if (ax instanceof OWLEquivalentClassesAxiom) {
            var xs = ax.getNamedClasses().toArray();
            for (var k in xs) {
                var xobj = xs[k];
                var x = this.getKey(xobj);
                if (fmap[x] == null) {
                    fmap[x] = { id:x };
                }
                if (fmap[x].equivalentTo == null) {
                    fmap[x].equivalentTo = [];
                }
                var rest = ax.getClassExpressionsMinus(xobj).toArray();
                for (var k2 in rest) {
                    fmap[x].equivalentTo.push(rest[k2]);
                }
            }
        }
        else if (ax instanceof OWLAnnotationAssertionAxiom) {
            var x = this.getKey(ax.getSubject());
            if (fmap[x] == null) {
                fmap[x] = { id:x };
            }
            if (fmap[x].annotations == null) {
                fmap[x].annotations = [];
            }
            //fmap[x].annotations.push({property: ax.getProperty(), value: ax.getValue()});
            fmap[x].annotations.push(ax.getAnnotation());
        }
        else if (ax instanceof OWLObjectPropertyCharacteristicAxiom) {
            var x = this.getKey(ax.getProperty());
            if (fmap[x] == null) {
                fmap[x] = { id:x };
            }
            if (fmap[x].characteristics == null) {
                fmap[x].characteristics = [];
            }
            fmap[x].characteristics.push(ax.getAxiomType());
            
        }
        else if (ax instanceof OWLDeclarationAxiom) {
            var t = ax.getEntity().getEntityType().getName();
            if (fmap[x] == null) {
                fmap[x] = { id:x };
            }
            if (fmap[x].declaration == null) {
                fmap[x].declaration = t;
            }
            else if (fmap[x].declaration instanceof Array) {
                fmap[x].declaration.push(t);
            }
            else {
                fmap[x].declaration = [fmap[x].declaration, t];
            }
        }
        else {
            print("Cannot process: "+ax);
        }
    }
    return fmap;
};

OWLFrame.prototype.axiomsToFrame = function(axioms, id) {
    var fmap = this.axiomsToFrameMap(axioms);
    return fmap[id];
};

OWLFrame.prototype.add = function() {
    return this.generator.add(this.toAxioms());
};

/* Function: merge
 *
 * Purpose: merges an OWLFrame into this one
 *
 * Arguments:
 *  f2 - <OWLFrame>
 */
OWLFrame.prototype.merge = function(f2) {
    for (var k in f2.slotMap) {
        if (k == 'id') {
            continue;
        }
        if (this.slotMap[k] == null) {
            this.slotMap[k] = f2.slotMap[k];
        }
        else if (this.slotMap[k] instanceof Array) {
            if (f2.slotMap[k] instanceof Array) {
                this.slotMap[k] = this.slotMap[k].concat(f2.slotMap[k]);
            }
            else {
                this.slotMap[k].push(f2.slotMap[k]);
            }
        }
        else {
            // this.slotMap[k] is single valued
            if (f2.slotMap[k] instanceof Array) {
                var cur = this.slotMap[k];
                this.slotMap[k] = f2.slotMap[k].concat(cur);
            }
            else {
                if (this.slotMap[k] == f2.slotMap[k]) {
                    // identical - no op
                }
                else {
                    this.slotMap[k] = [this.slotMap[k], f2.slotMap[k]];
                }
            }
        }
    }
    return this;
};

/* Function: set
 *
 * Purpose: sets slot values
 *
 * Arguments:
 *  - k : slot
 *  - v : value
 */
OWLFrame.prototype.set = function(k,v) {
    if (this.slotMap[k] == null) {
        this.slotMap[k] = v;
    }
    else if (this.slotMap[k] instanceof Array) {
        this.slotMap[k].push(v);
    }
    else {
        // this.slotMap[k] is single valued
        this.slotMap[k] = [this.slotMap[k], v];
    }
    return this;
};

// experimental - anns only
OWLFrame.prototype.sed = function(sedFunc) {
    anns = this.slotMap.annotations;
    var owl = this.generator;
    if (!(anns instanceof Array)) {
        anns = [anns];
    }
    for (var k in anns) {
        var ann = anns[k];
        var v = ann.getValue();
        if (v.getLiteral != null) {
            var vLit = vl.getLiteral().toString();
            var vNew = sedFunc.call(this, vl);
            anns[k] = owl.ann(ann.getProperty(), vNew);
        }
    }
};


/* Namespace: owlapi
 *
 * This makes use of the OWLAPI. For full documentation, consult the
 * owlapi documentation.
 *
 * Minimal documentation on select classes are provided here
 *
 * About: OWLReasoner
 *  used to compute inferences
 *
 * About: OWLReasonerFactory
 *  generates an <OWLReasoner>
 *
 * About: OWLClass
 *  Basic unit of an ontology
 *
 * About: OWLAxiom
 *  an OWL axiom
 *
 * About: OWLOntology
 *  a collection of <OWLAxiom>s
 *
 * About: IRI
 *
 * About: OWLDataFactory
 *
 * About: OWLManager
 *
 * About: OWLPropery
*/
