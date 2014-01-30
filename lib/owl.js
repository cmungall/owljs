var {OWLFrame} = require("owl/owlframe"); 
var javautil = require("owl/javautil");

/* Namespace: OWL
 *
 * An object that wraps the OWLAPI and manages an OWL ontology.
 *
 *
 * Example usage:
 * > var {OWL} = require("owl");
 * >
 * > var owl = new OWL();
 * > owl.loadFile("myOnt.owl");
 * >
 * > var ec = owl.find("epithelial cell");
 * > var intestine = owl.find("intestine");
 * > var part_of = owl.find("part_of");
 * >
 * > var q = owl.intersectionOf(ec, owl.someValuesFrom(part_of, intestine));
 * > owl.getInferredSubClasses(q).forEach(print);
 *
 * Description:
 *
 * Each OWL object holds a reference to an <owlapi.OWLOntology> and an <owlapi.OWLReasoner>.
 * It provides convenient js methods that wrap calls in these objects.
 *
 * Factory Helpers:
 *
 * A number of convenience methods are provided that wrap an OWL data factory, such as the following
 * - <subClassOf>
 * - <classAssertion>
 * - <propertyAssertion>
 * - <equivalentClasses>
 * - <disjointClasses>
 * - ... (more added on request)
 *
 * The function name and argument list typically follows that of the
 * OWLAPI data factory and the OWL specification. A list of
 * <owlapi.OWLAnnotation> objects are provided optionally as the final
 * argument. In some cases a looser typing model is used. For example,
 * <someValuesFrom> generates *either* a <owlapi.OWLObjectSomeValuesFrom> *or* a
 * <owlapi.OWLDataSomeValuesFrom> depending on whether the first argument is an
 * obect or data property.
 * 
 *
 * Reasoners:
 *
 * The type of reasoner can be selected using <setReasonerType> (Elk is used by default).
 * The reasoner always points to the ontology available via <getOntology> and <setOntology>.
 * Reasoner methods include:
 * - <getInferredSubClasses>
 * - <getInferredSuperClasses>
 *
 * In addition, the <getAncestorsOver> performs an additional materialization step to allow
 * queries of the form SELECT ?w WHERE neuron part_of some ?w
 * 
 *
 * Frames:
 *
 * OWL objects can be translated into <OWLFrame> objects, but this is not required for use
 * of this package.
 *
 * Class variables:
 *
 *  - config : a dictionary of configuration parameters
 *  - reasoner : access this using <getReasoner>
 *  - ontology : access this using <getOntology>
 *  - changes : set of changes this session
 *
 *
 * For more information, see https://github.com/cmungall/owl.js
 */

importPackage(java.io);
importPackage(java.util);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);
importPackage(Packages.org.semanticweb.owlapi.util);
importPackage(Packages.org.coode.owlapi.manchesterowlsyntax);
importPackage(Packages.org.coode.owlapi.obo.parser);
importPackage(Packages.owltools.io);
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


/*
 * 
 * Function: OWL
 * 
 *  Constructor
 * 
 * Arguments:
 *  - ontology: an <owlapi.OWLOntology> (optional)
 */

var OWL = exports.OWL = function OWL(ont, cfg) {
    if (ont != null) {
        //print("ONT="+ont);
        this.ontology = ont;
    }
    else {
        this.ontology = this.getManager().createOntology();
    }
    this.reasoner = null;
    this.changes = [];
    this.generatedFrames = [];
    this.config = cfg == null ? {} : cfg;
    return this;
}

/* Function: createOntology
 * 
 * Creates an OWL ontology
 * 
 * Arguments:
 *  - iriOrOntID: (optional) a <owlapi.IRI> or a string denoting an <owlapi.IRI> *or* an OWLOntologyID
 *  - imports: (optional) a list of <owlapi.IRI>s (or IRIs-as-strings) denoting ontologies in the import chain
 *  - anns: (optional) a list of <owlapi.OWLAnnotation>s to be added as ontology annotations
 *  - versionIRI: an a <owlapi.IRI> or a string denoting an <owlapi.IRI>, which is the ontology versionIRI
 *
 *
 * Returns:
 *  a new <owlapi.OWLOntology>
 */
OWL.prototype.createOntology = function(iriOrOntID, imports, anns, versionIRI) {
    var manager = this.getManager();
    if (iriOrOntID != null) {
        if (typeof iriOrOntID == 'string') {
            if (iriOrOntID.indexOf("http") != 0) {
                iriOrOntID = new File(iriOrOntID);
            }
            iriOrOntID = IRI.create(iriOrOntID);
        }
    }
    if (versionIRI != null) {
        if (iriOrOntID instanceof OWLOntologyID) {
            iriOrOntID = iriOrOntID.getOntologyIRI();
        }
        iriOrOntID = new OWLOntologyID(iriOrOntID, this.getIRI(versionIRI));
    }
    if (iriOrOntID != null) {
        this.ontology = manager.createOntology(iriOrOntID);
    }
    else {
        this.ontology = manager.createOntology();
    }
    if (imports != null) {
        for (var k in imports) {
            var imp = imports[k];
            var ai = new AddImport(this.ontology, this.getOWLDataFactory().getOWLImportsDeclaration(this.getIRI(imp)));
            this.add(ai);
        }
    }
    if (anns != null) {
        for (var k in anns) {
            var ann = anns[k];
            var aoa = new AddOntologyAnnotation(this.ontology, ann);
            this.add(ai);
        }
    }
    return this.ontology;
}


/* Function: loadOntology
 * 
 * Loads an ontology from an IRI
 * 
 * Arguments:
 *  - IRI: a <owlapi.IRI> or a string denoting an <owlapi.IRI>
 *
 * See Also:
 *  - <loadFile>
 */
OWL.prototype.loadOntology = function(iri) {
    if (iri == null) {
        iri = this.config.defaultFile;
    }
    var manager = this.getManager();
    if (typeof iri == 'string') {
        if (iri.indexOf("http") != 0) {
            iri = new File(iri);
        }
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
    if (filename == null) {
        filename = this.config.defaultFile;
    }
    if (filename == '-') {
        // TODO
    }
    var manager = this.getManager();
    var iri = filename;
    if (/\.obo$/.test(filename)) {
        return this.loadOBOFile(filename);
    }
    if (typeof iri == 'string') {
        iri = IRI.create( new File(iri));
    }
    this.ontology = manager.loadOntologyFromOntologyDocument(iri);
    return this.ontology;
}

// this is temporary - soon we will use the owlapi OBO parser
OWL.prototype.loadOBOFile = function(filename) {
    var pw = new ParserWrapper();
    this.ontology = pw.parse(filename);
    return this.ontology;
}


/* Function: getOntology
 *
 * Returns:
 * an <owlapi.OWLOntology>
 */
OWL.prototype.getOntology = function() {
    return this.ontology;
}

/* Function: setOntology
 *
 * Returns:
 * an <owlapi.OWLOntology>
 */
OWL.prototype.setOntology = function(ont) {
    return this.ontology = ont;
}

/* Function: getOntologyIRI
 *
 * Returns:
 * an <owlapi.IRI>
 */
OWL.prototype.getOntologyIRI = function() {
    if (this.ontology == null) {
        return null;
    }
    return this.ontology.getOntologyID().getOntologyIRI();
}
// deprecated
OWL.prototype.df = function() {
    return this.getOWLDataFactory();
}
/* Function: getOWLDataFactory
 * Returns:
 * an <owlapi.OWLDataFactory>
 */
OWL.prototype.getOWLDataFactory = function() {
    return this.getManager().getOWLDataFactory();
}
/* Function: getManager
 *
 * Returns:
 * an <owlapi.OWLManager>
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
 *  - file : path to a catalog XML file (defaults to "catalog-v001.xml")
 */
OWL.prototype.addCatalog = function(file) {
    if (file == null) {
        file = "catalog-v001.xml";
    }
    this.isCatalogSet = true;
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
 *
 * Returns:
 * 
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
 *
 * Returns:
 *  An <owlapi.OWLReasonerFactory> (defaults to ElkReasonerFactory)
 */
OWL.prototype.getReasonerFactory = function() {
    if (this.reasonerFactory == null) {
        this.reasonerFactory = new ElkReasonerFactory();
    }
    return this.reasonerFactory;
}

/* Function: setReasonerType
 *
 * Sets the reasoner factory used to create an <owlapi.OWLReasoner>
 *
 * Names:
 *  - elk (default)
 *  - pellet
 *  - hermit
 *  - factpp
 *  - jfact
 *
 *
 *
 * Arguments:
 *  - reasoner type: either an <owlapi.OWLReasonerFactory> or a short name
 */
OWL.prototype.setReasonerType = function(t) {
    var rf = null;
    if (typeof t != 'string' && t instanceof OWLReasonerFactory) {
        rf = t;
    }
    else {
        if (t == 'elk') {
            rf = new ElkReasonerFactory();        
        }
        else if (t == 'pellet') {
            rf = new PelletReasonerFactory();        
        }
        else if (t == 'factpp') {
            rf = new FaCTPlusPlusReasonerFactory();        
        }
        else if (t == 'more-hermit') {
            rf = PrecomputingMoreReasonerFactory.getMoreHermitFactory();
        }
        else if (t == 'more-jfact') {
            rf = PrecomputingMoreReasonerFactory.getMoreJFactFactory();
        }
        else if (t == 'jfact') {
            rf = new JFactFactory();        
        }
        else if (t == 'hermit') {
            rf = new org.semanticweb.HermiT.Reasoner.ReasonerFactory();
        }
        else {
            this.warn("Unknown type: "+t);
        }
    }
    if (rf != null) {
        this.reasonerFactory = rf;
    }
    return rf;
}

/* Function: isSatisfiable
 *
 * tests if a class is satisfiable
 *
 * Arguments:
 *  - cls : an <owlapi.OWLClass>
 *
 * Returns:
 *   True if cls is satisfiable
 */
OWL.prototype.isSatisfiable = function(cls) {
    if (this.getReasoner().isSatisfiable(cls)) {
        return true;
    }
    return false;
}

/* Function: isCoherent
 *
 *
 * Returns:
 *   True if all classes in the ontology are satisfiable
 *
*/
OWL.prototype.isCoherent = function() {
    var unsats = [];
    var owl = this;
    this.getClasses().forEach( function(c) { 
        if (!owl.isSatisfiable(c)) { 
            unsats.push(c) 
        }
    });
    this.log("# unsats = "+unsats.length);
    return unsats.length == 0;
}


/* Function: getInferredSuperClasses
 *
 * Uses an <owlapi.OWLReasoner> to find inferred superclasses for a class
 *
 * Arguments:
 *  - cls : an <owlapi.OWLClass>
 *  - isDirect : boolean (default is true)
 *  - isReflexive : boolean (default is true)
 *
 *
 * Returns:
 * 
 *  list of superclasses
 */
OWL.prototype.getInferredSuperClasses = function(cls, isDirect, isReflexive) {
    if (isDirect == null) {
        isDirect = true;
    }
    var jl = this.getReasoner().getSuperClasses(cls, isDirect).getFlattened();
    var rl = this.a2l(jl.toArray());
    if (isReflexive) {
        rl = rl.concat(this.getInferredEquivalentClasses(cls));
    }
    return rl;
}

/* Function: getInferredSubClasses
 *
 * Uses an <owlapi.OWLReasoner> to find inferred subclasses for a class
 *
 * Arguments:
 *  - cls : an <owlapi.OWLClass>
 *  - isDirect : boolean
 *  - isReflexive : boolean
 *
 *
 * Returns:
 *  <owlapi.OWLClass> []
 */
OWL.prototype.getInferredSubClasses = function(cls, isDirect, isReflexive) {
    if (isDirect == null) {
        isDirect = true;
    }
    var jl = this.getReasoner().getSubClasses(cls, isDirect).getFlattened();
    var rl = this.a2l(jl.toArray());
    if (isReflexive) {
        rl = rl.concat(this.getInferredEquivalentClasses(cls));
    }
    return rl;
}

/* Function: isInferredSubClassOf
 *
 * Uses an <owlapi.OWLReasoner> to find if a subclass relation holds
 *
 * Note:
 *  - reflexivity is assumes; indirect inferred superclasses also used
 *
 * Arguments:
 *  - subcls : an <owlapi.OWLClass>
 *  - supercls : an <owlapi.OWLClass>
 *
 * Returns:
 *  true is subcls is a subclass of supercls
 */
OWL.prototype.isInferredSubClassOf = function(subcls, cls) {
    var sups = this.getInferredSuperClasses(subcls, false, true);
    //console.log(subcls+" supes = "+sups);
    for (var k in sups) {
        if (sups[k].equals(cls)) {
            return true;
        }
    }
    return false;
}

/* Function: getInferredEquivalentClasses
 *
 * Uses an <owlapi.OWLReasoner> to find inferred equivalent classes for a class
 *
 * Arguments:
 *  - cls : an <owlapi.OWLClass>
 *
 *
 * Returns:
 *  <owlapi.OWLClass> []
 */
OWL.prototype.getInferredEquivalentClasses = function(cls) {
    var jl = this.getReasoner().getEquivalentClasses(cls).getEntities();
    var rl = this.a2l(jl.toArray());
    return rl;
}

/* Function: getInferredInstances
 *
 * Uses an <owlapi.OWLReasoner> to find all instances of a class expression
 *
 * Arguments:
 *  - cls : an <owlapi.OWLClassExpression>
 *  - isDirect : boolean. default is true
 *
 *
 * Returns:
 *  <owlapi.OWLIndividual> []
 */
OWL.prototype.getInferredInstances = function(cls, isDirect) {
    if (isDirect == null) {
        isDirect = true;
    }
    var jl = this.getReasoner().getInstances(cls, isDirect).getFlattened();
    return javautil.collectionToJsArray(jl);
}

/* Function: getInferredTypes
 *
 * Uses an <owlapi.OWLReasoner> to find all types an individual belongs to
 *
 * Arguments:
 *  - ind : an <owlapi.OWLClassExpression>
 *  - isDirect : boolean. default is true
 *
 *
 * Returns:
 *  <owlapi.OWLIndividual> []
 */
OWL.prototype.getInferredTypes = function(ind, isDirect) {
    if (isDirect == null) {
        isDirect = true;
    }
    var jl = this.getReasoner().getTypes(ind, isDirect).getFlattened();
    return javautil.collectionToJsArray(jl);
}

/* Function: getInferredPropertyValues
 *
 * Uses an <owlapi.OWLReasoner> to find all v such that ind is in
 * relation prop to v
 *
 * Arguments:
 *  - ind : an <owlapi.OWLIndividual>
 *  - prop : an <owlapi.OWLPropertyExpression>
 *
 *
 * Returns:
 *  <owlapi.OWLIndividual> [] or datatype []
 */
OWL.prototype.getInferredPropertyValues = function(ind, prop) {
    var jl = this.getReasoner().getObjectPropertyValues(ind, prop).getFlattened();
    var rl = this.a2l(jl.toArray());
    return rl;
}

/* Function: getInferredPropertyValueMap
 *
 * Uses an <owlapi.OWLReasoner> to find all inferred facts
 * about ind
 *
 * Arguments:
 *  - ind : an <owlapi.OWLIndividual>
 *
 *
 * Returns:
 *  a map where the keys are properties and the values are lists
 */
OWL.prototype.getInferredPropertyValueMap = function(ind) {
    var m = {};
    var props = this.getObjectProperties();
    for (var k in props) {
        var prop = props[k];
        m[prop] = this.getInferredPropertyValues(ind, prop);
    }
    return m;
}

/* Function: getInferredPropertyAssertions
 *
 * Uses an <owlapi.OWLReasoner> to find all inferred facts
 * about ind
 *
 * Arguments:
 *  - ind : an <owlapi.OWLIndividual>
 *
 *
 * Returns:
 *  <owlapi.OWLAxiom> []
 */
OWL.prototype.getInferredPropertyAssertions = function(ind) {
    var axs = [];
    var props = this.getObjectProperties();
    var owl = this;
    for (var k in props) {
        var prop = props[k];
        this.getInferredPropertyValues(ind, prop).forEach(function(j) { axs.push(owl.propertyAssertion(prop, ind, j)) });
    }
    return axs;
}


/* Function: getAncestorsOver
 *
 * Uses OWLReasoner to find subsuming class expressions of the form
 *  "P some A" (i.e. the set of ancestors A over P)
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
 *
 * Returns:
 * list of ancestors (or direct parents) via prop
 */
OWL.prototype.getAncestorsOver = function(cls, prop, isReflexive, isDirect) {
    var mat = this.materializeExistentialExpressions(prop, isReflexive);
    var supers = this.getInferredSuperClasses(cls, isDirect);
    var lookup = mat.lookup;
    var ancs = [];
    supers.forEach(function(x) {
        var k = x.toString();
        var orig = lookup[k];
        if (orig != null) {
            ancs.push(orig);
        }
    });
    if (isReflexive) {
        ancs.push(cls);
    }
    return ancs;
}

OWL.prototype.materializeExistentialExpressions = function(prop, isReflexive) {
    var suffix = prop.getIRI().toString() + isReflexive;
    var cl = this.a2l(this.getOntology().getClassesInSignature(true).toArray());
    var ontIRI = this.getOntology().getOntologyID().getOntologyIRI();
    var matOntIRI = IRI.create(ontIRI + suffix);
    var matOnt = this.getManager().createOntology(matOntIRI);
    var mat = {
        ontology : matOnt,
        property : prop,
        isReflexive : isReflexive,
        lookup : {}
    };
    for (var k in cl) {
        var c = cl[k];
        var x = this.someValuesFrom(prop, c);
        var tmpClsIRI = IRI.create(c.getIRI().toString() + "-" + suffix);
        var tmpCls = this.getOWLDataFactory().getOWLClass(tmpClsIRI);
        var eca = this.equivalentClasses(tmpCls, x); 
        mat.lookup[tmpCls.toString()] = c;
        this.getManager().addAxiom(matOnt, eca);
    }
    var change = new AddImport(this.getOntology(), 
                               this.getOWLDataFactory().getOWLImportsDeclaration(matOntIRI));
    this.applyChange(change);
    this.getReasoner().flush();
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
 *  - isNegated : boolean (default is false)
 *  - isReplace : boolean (default is false). If true, non-matching axioms are removed.
 *
 *
 * Returns:
 * <owlapi.OWLAxiom> []
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
 *  - sedFunc : function
 *
 *
 * Returns:
 * <owlapi.OWLAxiom> []
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
            //this.log(ax + " ===> " + ax2);
            newAxioms = newAxioms.concat(ax2);
            rmAxioms.push(ax);
        }
        else {
            //this.log(ax + " ===> " + ax2);
            newAxioms.push(ax2);
            rmAxioms.push(ax);
        }
    }
    this.addAxioms(newAxioms);
    this.removeAxioms(rmAxioms);
    return newAxioms;
}

/* Function: grepObjects
 *
 * filters objects in ontology using a grep function.
 * The function takes on argument - the OWLObject - and returns
 * true if the object is to be included.
 *
 * Example:
 * > all classes with "differentiation" in label
 * > var dClasses = owl.grepObjects( function(obj,owl) { return /differentiation/.test(owl.getLabel(obj)) } );
 *
 * Arguments:
 *  - grepFunc : function
 *  - isNegated : boolean (default is false)
 *
 *
 * Returns:
 * <owlapi.OWLObject> []
 */
OWL.prototype.grepObjects = function(grepFunc, isNegated, isRemove) {
    var inObjects = this.getAllObjects();
    if (isNegated == null) {
        isNegated = false;
    }
    var filteredObjects = [];
    var rmObjects = [];
    var rmAxioms = [];
    for (var k in inObjects) {
        var obj = inObjects[k];
        if (isNegated) {
            if (!grepFunc.call(this, obj, this)) {
                filteredObjects.push(obj);
            }
            else {
                rmObjects.push(obj);
            }
        }
        else {
            if (grepFunc.call(this, obj, this)) {
                filteredObjects.push(obj);
            }
            else {
                rmObjects.push(obj);
            }
        }
    }
    if (isRemove) {
        for (var k in rmObjects) {
            var obj = rmObjects[k];
            rmAxioms = rmAxioms.concat(this.getAllAxioms(obj));
        }
        this.removeAxioms(rmAxioms);
    }
    return filteredObjects;
}

OWL.prototype.objectInAxiomSignature = function(qobj, axiom) {
    var iri = this.getIRI(qobj);
    var objs = this.objectsInAxiomSignature(axiom);
    for (var k in objs) {
        var refobj = objs[k];
        if (refobj.getIRI().equals(iri)) {
            return true;
        }
    }
    return false;
}

OWL.prototype.objectsInAxiomSignature = function(axiom) {
    var axSet = new HashSet();
    axSet.addAll(axiom.getClassesInSignature());
    axSet.addAll(axiom.getDataPropertiesInSignature());
    axSet.addAll(axiom.getObjectPropertiesInSignature());
    axSet.addAll(axiom.getIndividualsInSignature());
    axSet.addAll(axiom.getDatatypesInSignature());
    var axs = javautil.collectionToJsArray(axSet);
    return axs;
}

// ----------------------------------------
// I/O
// ----------------------------------------

/* Function: saveAxioms
 *
 * Saves the specified set of axioms as an ontology
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
 * Saves the specified ontology
 *
 *
 * Arguments:
 *  - ontology: <owlapi.OWLOntology>
 *  - file : fileName  (if null, writes to stdout)
 *  - owlFormat : e.g. an instance of RDFXMLOntologyFormat
 */
OWL.prototype.saveOntology = function(ont, file, owlFormat) {

    var isStdout = false;
    if (file == null) {
        file = this.config.defaultFile;
    }
    if (file == null) {
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
    //console.log("Format: "+owlFormat);
    //console.log("Ont: "+ont);
    //console.log("OntFile: "+file);
    this.getManager().saveOntology(ont, owlFormat, IRI.create(new File(file)));
    if (isStdout) {
        var fs = require('fs');
        var payload = fs.read(file);
        print(payload);
        fs.remove(file);
    }
}

/* Function: save
 *
 * saves current ontology
 *
 * Arguments:
 *  - file : fileName  (if null, writes to stdout)
 *  - owlFormat : [optional] e.g. an instance of RDFXMLOntologyFormat
 *
 */
OWL.prototype.save = function(file, owlFormat) {
    this.saveOntology(this.getOntology(), file, owlFormat);
}

/* Function: loadConfig
 *
 * loads a js configuration file
 *
 * Arguments:
 *  - file : fileName 
 *
 */
OWL.prototype.loadConfig = function(file) {
    var fs = require('fs');
    this.setConfig(JSON.parse(fs.read(file)));
}

OWL.prototype.setConfig = function(cfg) {
    this.config = cfg;
    if (cfg.catalog != null) {
        this.addCatalog(cfg.catalog);
    }
    if (cfg.iriMap != null) {
        for (var iri in cfg.iriMap) {
            var path = cfg.iriMap[iri];
            console.log("Mapping "+iri+" to "+path);
            this.getManager().addIRIMapper(new SimpleIRIMapper(IRI.create(iri), IRI.create(new File(path))));
        }
    }
}


/* Function: setDefaultFormat
 *
 * sets the default format used in <save> or <saveAxioms>
 *
 * Abbreviations:
 *  - ofn: functional notation
 *  - omn: manchester notation
 *  - obo: obo syntax
 *  - ttl: turtle syntax
 *
 * Arguments:
 *  - fmt : name of format, or an OWLOntologyFormat object
 *
 */
OWL.prototype.setDefaultFormat = function(owlFormat) {
    if (!(owlFormat instanceof OWLOntologyFormat)) {
        //console.log(owlFormat);
        if (owlFormat == 'ofn') {
            return this.useFunctionalSyntax();
        }
        else if (owlFormat == 'obo') {
            return this.useOBOSyntax();
        }
        else if (owlFormat == 'omn') {
            return this.useManchesterSyntax();
        }
        else if (owlFormat == 'ttl') {
            return this.useTurtleSyntax();
        }
        else {
            owlFormat = eval("new "+owlFormat+"()");
        }
    }
    this.config.defaultFormat = owlFormat;    
}
OWL.prototype.useFunctionalSyntax = function() {
    this.setDefaultFormat(new OWLFunctionalSyntaxOntologyFormat());
}
OWL.prototype.useManchesterSyntax = function() {
    this.setDefaultFormat(new ManchesterOWLSyntaxOntologyFormat());
}
OWL.prototype.useTurtleSyntax = function() {
    this.setDefaultFormat(new TurtleOntologyFormat());
}
OWL.prototype.useOBOSyntax = function() {
    this.setDefaultFormat(new OBOOntologyFormat());
}

// ----------------------------------------
// SERIALIZATION
// ----------------------------------------

// IN-PROGRESS, EXPERIMENTAL
OWL.prototype.generateJSON = function(frame) {
    var json = 
        {
            id : frame.iri,
            test : "foo"
        };
    var slotMap = frame.slotMap;
    for (var k in slotMap) {
        this.log(k + " = " + slotMap[k]);
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

OWL.prototype.undo = function() {
    // TODO - need to figure out if there is an easy way to reverse a change with the OWLAPI
}


/* Function: declare
 *
 * Adds a declaration axiom to ontology
 *
 * Arguments:
 *  - obj : <owlapi.OWLObject>
 */
OWL.prototype.declare = function(obj) {
    var ax = this.declaration(obj);
    this.add(ax);
    return obj;
}

OWL.prototype.declaration = function(obj) {
    return this.getOWLDataFactory().getOWLDeclarationAxiom(obj);
}

/* Function: declareClass
 *
 * Adds a declaration axiom to ontology and returns an OWLClass
 *
 * Arguments:
 *  - obj : as for <class>
 *
 * Returns:
 *  an <owlapi.OWLClass>
 */
OWL.prototype.declareClass = function(obj) {
    var c = this.class(obj);
    var ax = this.declaration(c);
    this.add(ax);
    return c;
}



/* Function: add
 * Adds an axiom or axioms to ontology
 *
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
        print("DID NOT ADD: "+ax);
    }
}

/* Function: addAxiom
 *
 * Adds an axiom to ontology
 *
 * Arguments:
 *  - ax : <owlapi.OWLAxiom>
 */
OWL.prototype.addAxiom = function(ax) {
    var change = new AddAxiom(this.getOntology(), ax);
    return this.applyChange(change);
}

/* Function: addAxioms
 * Adds axioms to ontology
 *
 * Arguments:
 *  - axs : <owlapi.OWLAxiom> []
 */
OWL.prototype.addAxioms = function(axs) {
    for (var k in axs) {
        this.addAxiom(axs[k]);
    }
    return axs;
}

/* Function: removeAxiom
 * Removes an axiom from ontology
 *
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
 *
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
 * fetches all annotations given an object (and optionally constrained by property)
 *
 * Arguments:
 *  - obj: <owlapi.OWLNamedObject> or <owlapi.IRI> or IRI-as-string
 *  - prop: <owlapi.OWLAnnotationProperty> or <owlapi.IRI> or IRI-as-string (optional)
 *
 *
 * Returns:
 * <owlapi.OWLAnnotation> []
 */
OWL.prototype.getAnnotations = function(obj,prop) {
    if (!(obj instanceof OWLNamedObject)) {
        // note: it doesn't matter what kind of OWLNamedObject we create here
        if (!(obj instanceof IRI)) {
            obj = IRI.create(obj);
        }
        if (obj instanceof IRI) {
            obj = this.getOWLDataFactory().getOWLClass(obj);
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

/* Function: getAnnotationValues
 *
 * fetches all annotation values given an object and property
 *
 * Arguments:
 *  - obj: <owlapi.OWLNamedObject> or <owlapi.IRI> or IRI-as-string
 *  - prop: <owlapi.OWLAnnotationProperty> or <owlapi.IRI> or IRI-as-string (optional)
 *
 *
 * Returns:
 * string[]
 */
OWL.prototype.getAnnotationValues = function(obj,prop) {
    var anns = this.getAnnotations(obj, prop);
    var vals = [];
    for (var k in anns) {
        var v = anns[k].getValue();
        var vv;
        if (v.getLiteral != null) {
            vv = v.getLiteral();
        }
        else {
            vv = v.toString();
        }
        vals.push(vv);
    }
    return vals;    
}

OWL.prototype.getAnnotationValue = function(obj,prop) {
    var vals = getAnnotationValues(obj, prop);
    if (vals.length > 0) {
        return vals[0];
    }
    return null;
}

/* Function: getLabel
 *
 * fetches a rdfs:label for a given object
 *
 * Assumptions:
 *  - each class has 0 or 1 labels. If >1 label present, returns first/arbitrary (TODO: warning mechanism)
 *
 * Arguments:
 *  - obj: <owlapi.OWLNamedObject> or <owlapi.IRI> or IRI-as-string
 *
 *
 * Returns:
 * string
 */
OWL.prototype.getLabel = function(obj) {
    var anns = this.getAnnotations(obj, org.semanticweb.owlapi.vocab.OWLRDFVocabulary.RDFS_LABEL.getIRI());
    var label = null;
    for (var k in anns) {
        if (label != null) {
            //this.warn("WARNING: multi-labels "+obj); // TODO
        }
        label = anns[k].getValue().getLiteral();
    }
    return label;
}

OWL.prototype.labelProperty = function() {
    return this.annotationProperty( org.semanticweb.owlapi.vocab.OWLRDFVocabulary.RDFS_LABEL.getIRI() );
}

OWL.prototype.isLabelProperty = function(obj) {
    return obj.getIRI().equals( org.semanticweb.owlapi.vocab.OWLRDFVocabulary.RDFS_LABEL.getIRI());
}

OWL.prototype.isLabelAssertion = function(obj) {
    if (obj.getProperty != null) {
        return this.isLabelProperty(obj.getProperty());
    }
    return false;
}


OWL.prototype.getIRIOfObject = function(obj) {
    return obj.getIRI().toString();
}

/* Function: getIRI
 *
 * Given an object, return the appropriate IRI
 * - if input is string, return IRI object generated from this string
 * - if input is IRI object, return input
 * - if input is OWLNamedEntity, return IRI of this entity
 * - otherwise, null
 *
 * Arguments:
 *  - obj: <owlapi.OWLNamedObject> or <owlapi.IRI> or IRI-as-string
 *
 *
 * Returns:
 *  <owlapi.IRI>
 */
OWL.prototype.getIRI = function(iriStr) {    
    if (iriStr instanceof IRI) {
        return iriStr;
    }
    if (iriStr.getIRI != null) {
        return this.getIRI(iriStr.getIRI());
    }
    if (typeof iriStr == 'string' || iriStr instanceof String) {
        return IRI.create(iriStr);
    }
    return null;
}

OWL.prototype.getStringIRI = function(iri) {    
    return this.getIRI(iri).toString() + "";
}

OWL.prototype.getIRIFragment = function(obj) {
    var iri = this.getIRI(obj);
    if (iri == null) {
        return null;
    }
    else {
        return iri.getFragment();
    }
}

// experimental - may move to a different module
importPackage(Packages.org.obolibrary.macro);
OWL.prototype.parseManchesterExpression = function(s) {
    var parser = new ManchesterSyntaxTool(this.getOntology());
    return parser.parseManchesterExpression(s);
}

/* Function: find
 *
 * Finds an object within an ontology based on specified label or IRI
 *
 * Example:
 * > cls = owl.find("epithelium")
 *
 * Arguments:
 *  - key: string containing IRI or label
 *
 *
 * Returns:
 * <owlapi.OWLObject>
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

/* Function: mfind
 *
 * Finds zero or more objects within an ontology based on specified label or IRI
 *
 * Examples:
 * > clsList = owl.mfind("epithelium")
 * we expect a single result here
 *
 * > clsList = owl.mfind("/epithelium/")
 * using // automatically invokes regexps over all axioms. TODO - more fine-grained control.
 *
 * Arguments:
 *  - key: string containing IRI or label
 *
 *
 * Returns:
 * <owlapi.OWLObject>
 */
OWL.prototype.mfind = function(key) {
    var objs = this.getAllObjects();
    var results = [];
    for (var k in objs) {
        var obj = objs[k];
        if (this.keyMatches(key, obj)) {
            results.push(obj);
        }
    }
    return results;
}

OWL.prototype.keyMatches = function(key, obj) {
    if (key.test != null) {
        var anns = this.getAnnotations(obj);
        for (var k in anns) {
            var a = anns[k];
            if (key.test(a.getValue())) {
                return true;
            }
        }
        return false;
    }

    var iri = this.getIRI(obj);

    if (iri.toString() == key) {
        return true;
    }
    var label = this.getLabel(obj);
    if (label != null && label.equals(key)) {
        return true;
    }
    return false;
}

// deprecated - use javautil
OWL.prototype.a2l = function(a) {
    //return [_ for (_ in Iterator(a))]
    var l = [];
    for (var k=0; k<a.length; k++) {
        l.push(a[k]);
    }
    return l;
}

/* Function: getClasses
 *
 * gets all classes in signature, including import closure
 *
 * Returns:
 * <owlapi.OWLClass> []
 */
OWL.prototype.getClasses = function() {
    return this.a2l(this.getOntology().getClassesInSignature(true).toArray());
}
/* Function: getIndividuals
 *
 * gets all individuals in signature, including import closure
 *
 * Returns:
 * <owlapi.OWLNamedIndividual> []
 */
OWL.prototype.getIndividuals = function() {
    return this.a2l(this.getOntology().getIndividualsInSignature(true).toArray());
}

/* Function: getObjectProperties
 *
 * gets all object properties in signature, including import closure
 *
 * Returns:
 * <owlapi.OWLObjectProperties> []
 */
OWL.prototype.getObjectProperties = function() {
    return this.a2l(this.getOntology().getObjectPropertiesInSignature(true).toArray());
}

/* Function: getAnnotationProperties
 *
 * gets all annotation properties in signature, including import closure
 *
 * Returns:
 * <owlapi.OWLAnnotationProperties> []
 */
OWL.prototype.getAnnotationProperties = function() {
    return this.a2l(this.getOntology().getAnnotationPropertiesInSignature().toArray());
}

/* Function: getAllObjects
 *
 * gets all OWLObjects in signature, including import closure
 *
 * Note:
 *  currently only returns classes, object and annotation properties. Expect behavior to change and also include other objects
 *
 * Returns:
 * <owlapi.OWLObjects> []
 */
OWL.prototype.getAllObjects = function() {
    var objs = [];
    var classes = this.getClasses();
    objs = objs.concat(classes);

    var rels = this.getObjectProperties();
    objs = objs.concat(rels);

    var aps = this.getAnnotationProperties();
    objs = objs.concat(aps);

    //this.log("#o="+objs.length);
    
    return objs;
}

// deprecated? does not yield annotation assertions
OWL.prototype.getAxioms = function(obj) {
    return this.a2l(this.getOntology().getAxioms(obj).toArray());
}

/* Function: getAllAxioms
 *
 * gets all axioms in ontology for an object (both logical and non-logical)
 *
 * Arguments:
 *  - obj : an <owlapi.OWLObject>
 *
 * Returns:
 * <owlapi.OWLAxiom> []
 */
OWL.prototype.getAllAxioms = function(obj) {
    if (obj == null) {
        return javautil.collectionToJsArray(this.getOntology().getAxioms());
    }
    var axioms = new HashSet();
    axioms.addAll(this.getOntology().getAxioms(obj));

    if (obj.getIRI != null) {
        var aas = this.getOntology().getAnnotationAssertionAxioms(obj.getIRI());
        if (aas != null) {
            axioms.addAll(aas);
        }
    }
    return this.a2l(axioms.toArray());
}


/* Function: isDeprecated
 *
 * Determines if the specified object is deprecated
 *
 * Arguments:
 *  - obj : <owlapi.OWLObject>
 *
 *
 * Returns:
 * boolean
 */
OWL.prototype.isDeprecated = function(obj) {
    var anns = this.getAnnotations(obj, this.getOWLDataFactory().getOWLAnnotationProperty(org.semanticweb.owlapi.vocab.OWLRDFVocabulary.OWL_DEPRECATED.getIRI()));
    for (var k in anns) {
        if (anns[k].getValue && anns[k].getValue().getLiteral() == 'true') {
            return true;
        }
    }
    return false;
}

/* Function: getFrame
 *
 * creates a frame object for a specified OWL object
 *
 * Arguments:
 *  - obj: OWLObject
 *
 *
 * Returns:
 * <OWLFrame>
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
        obj = this.getOWLDataFactory().getOWLClass(obj);
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
            prop = this.getOWLDataFactory().getOWLAnnotationProperty(prop);
        }
    }
    return prop;
}

// ----------------------------------------
// FACTORY METHODS
// ----------------------------------------

/* Function: someValuesFrom
 *
 * Creates an existential restriction (P SOME C) using a factory
 *
 * Arguments:
 *  - p : <owlapi.OWLProperty>
 *  - filler : <owlapi.OWLClassExpression>
 *
 *
 * Returns:
 * <owlapi.OWLObjectSomeValuesFrom> or <owlapi.OWLDataSomeValuesFrom>
 */
OWL.prototype.someValuesFrom = function(p, filler) {
    if (p instanceof OWLDataPropertyExpression) {
        return this.getOWLDataFactory().getOWLDataSomeValuesFrom(p, filler);
    }
    else {
        return this.getOWLDataFactory().getOWLObjectSomeValuesFrom(p, filler);
    }
}

/* Function: intersectionOf
 *
 * Creates an intersection class expression (C AND D AND ...) using a factory
 *
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
 *
 * Returns:
 * OWLObjectIntersectionOf or OWLDataIntersectionOf type of <owlapi.OWLAxiom>
 */
OWL.prototype.intersectionOf = function() {
    var xset = new java.util.HashSet();
    var isData = false;
    for (var k=0; k<arguments.length; k++) {
        // todo - detect isData
        xset.add(arguments[k]);
    }
    if (isData) {
        return this.getOWLDataFactory().getOWLDataIntersectionOf(xset);
    }
    else {
        return this.getOWLDataFactory().getOWLObjectIntersectionOf(xset);
    }
}

/* Function: unionOf
 *
 * Creates an union class expression using a factory
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
 *
 * Returns:
 * OWLObjectUnionOf or OWLDataUnionOf type of <owlapi.OWLAxiom>
 */
OWL.prototype.unionOf = function() {
    var xset = new java.util.HashSet();
    var isData = false;
    for (var k=0; k<arguments.length; k++) {
        // todo - detect isData
        xset.add(arguments[k]);
    }
    if (isData) {
        return this.getOWLDataFactory().getOWLDataUnionOf(xset);
    }
    else {
        return this.getOWLDataFactory().getOWLObjectUnionOf(xset);
    }
}

/* Function: inverseOf
 *
 * Creates a property expression that represents the inverse of the
 * specified property
 *
 * Arguments:
 *  - p : <owlapi.OWLObjectProperty>
 *
 *
 * Returns:
 * <owlapi.OWLPropertyExpression>
 */
OWL.prototype.inverseOf = function(p) {
    return this.getOWLDataFactory().getOWLInverseOf(p);
}

/* Function: propertyDomain
 *
 * Creates a domain axiom
 *
 * Arguments:
 *  - p : <owlapi.OWLProperty>
 *  - filler : <owlapi.OWLClassExpression>
 *
 *
 * Returns:
 *  a <owlapi.OWLAxiom>
 */
OWL.prototype.propertyDomain = function(p, filler) {
    if (p instanceof OWLDataPropertyExpression) {
        return this.getOWLDataFactory().getOWLDataPropertyDomainAxiom(p, filler);
    }
    else {
        return this.getOWLDataFactory().getOWLObjectPropertyDomainAxiom(p, filler);
    }
}

/* Function: propertyRange
 *
 * Creates a range axiom
 *
 * Arguments:
 *  - p : <owlapi.OWLProperty>
 *  - filler : <owlapi.OWLClassExpression> or <owlapi.DataRangeType>
 *
 *
 * Returns:
 *  a <owlapi.OWLAxiom>
 */
OWL.prototype.propertyRange = function(p, filler) {
    if (p instanceof OWLDataPropertyExpression) {
        return this.getOWLDataFactory().getOWLDataPropertyRangeAxiom(p, filler);
    }
    else {
        return this.getOWLDataFactory().getOWLObjectPropertyRangeAxiom(p, filler);
    }
}

/* Function: transitiveProperty
 *
 * Creates an axiom that specifies the transitivity characteristic on
 * a property
 *
 * Arguments:
 *  - p : <owlapi.OWLProperty>
 *
 *
 * Returns:
 *  a <owlapi.OWLAxiom>
 */
OWL.prototype.transitiveProperty = function(p) {
    return this.getOWLDataFactory().getOWLTransitiveObjectPropertyAxiom(p);
}

/* Function: inverseProperties
 *
 * Creates an axiom that specifies two properties stand in an inverseOf relationship
 *
 * Arguments:
 *  - p : <owlapi.OWLObjectProperty>
 *  - q : <owlapi.OWLObjectProperty>
 *
 * Returns:
 *  a <owlapi.OWLAxiom>
 */
OWL.prototype.inverseProperties = function(p,q) {
    return this.getOWLDataFactory().getOWLInversePropertiesAxiom(p,q);
}

// @Deprecated - use annotationProperty
OWL.prototype.makeAnnotationProperty = function(p) {
    if (typeof p == 'string') {
        p = IRI.create(p);
    }
    if (p instanceof IRI) {
        p = this.getOWLDataFactory().getOWLAnnotationProperty(p);
    }
    return p;
}

// @Deprecated
OWL.prototype.ann = function(p,v,anns) {
    console.warn("ann() is deprecated, use annotation()");
    return this.annotation(p,v,anns);
}

/* Function: annotation
 *
 * Creates an OWLAnnotation object from a key-value pair
 *
 * TODO: 
 *  - allow non-String types, lang options, ...
 *
 * Note: can also be called via ann(...) but this is deprecated
 *
 *
 * Arguments:
 *  - p : <owlapi.OWLAnnotationProperty> or IRI or string
 *  - v : value - can be string or <owlapi.OWLLiteral>
 *  - anns : Set or [] of <owlapi.OWLAnnotation>
 *
 *
 * Returns:
 * <owlapi.OWLAnnotation>
 */
OWL.prototype.annotation = function(p,v,anns) {
    p = this.makeAnnotationProperty(p);
    if (typeof v == 'string') {
        v = this.literal(v);
    }
    if (anns != null) {
        var janns = anns;
        if (anns.size != null) {
            janns = new HashSet();
            for (var k=0; k<anns.length; k++) {
                set.add(anns[k]);
            }
        }
        return this.getOWLDataFactory().getOWLAnnotation(p,v, janns);
    }
    return this.getOWLDataFactory().getOWLAnnotation(p,v);
};


/* Function: class
 *
 * Returns an OWL class corresponding to the input argument
 *
 * Arguments:
 *  - iri : IRI or IRI-as-string. If not specified, use <genIRI>
 *
 * Returns:
 * <owlapi.OWLClass>
 */
OWL.prototype.class = function (iri) { 
    if (iri == null) {
        iri = this.genIRI();
    }
    if (iri instanceof IRI) {
        return this.getOWLDataFactory().getOWLClass(iri);
    }
    else if (typeof iri == 'string') {
        return this.class(IRI.create(iri));
    }
    else {        
        return this.class(iri.getIRI());
    }
}

/* Function: objectProperty
 *
 * Returns an OWL object property corresponding to the input argument
 *
 * Arguments:
 *  - iri : IRI or IRI-as-string. If not specified, use <genIRI>
 *
 * Returns:
 * <owlapi.OWLObjectProperty>
 */
OWL.prototype.objectProperty = function (iri) { 
    if (iri == null) {
        iri = this.genIRI();
    }
    if (iri instanceof IRI) {
        return this.getOWLDataFactory().getOWLObjectProperty(iri);
    }
    else if (typeof iri == 'string') {
        return this.objectProperty(IRI.create(iri));
    }
    else {        
        return this.objectProperty(iri.getIRI());
    }
}

/* Function: dataProperty
 *
 * Returns an OWL data property corresponding to the input argument
 *
 * Arguments:
 *  - iri : IRI or IRI-as-string. If not specified, use <genIRI>
 *
 * Returns:
 * <owlapi.OWLDataProperty>
 */
OWL.prototype.dataProperty = function (iri) { 
    if (iri == null) {
        iri = this.genIRI();
    }
    if (iri instanceof IRI) {
        return this.getOWLDataFactory().getOWLDataProperty(iri);
    }
    else if (typeof iri == 'string') {
        return this.dataProperty(IRI.create(iri));
    }
    else {        
        return this.dataProperty(iri.getIRI());
    }
}

/* Function: annotationProperty
 *
 * Returns an OWL annotation property corresponding to the input argument
 *
 * Arguments:
 *  - iri : IRI or IRI-as-string. If not specified, use <genIRI>
 *
 * Returns:
 * <owlapi.OWLAnnotationProperty>
 */
OWL.prototype.annotationProperty = function (iri) { 
    if (iri == null) {
        iri = this.genIRI();
    }
    if (iri instanceof IRI) {
        return this.getOWLDataFactory().getOWLAnnotationProperty(iri);
    }
    else if (typeof iri == 'string') {
        return this.annotationProperty(IRI.create(iri));
    }
    else {        
        return this.annotationProperty(iri.getIRI());
    }
}

/* Function: namedIndividual
 *
 * Returns an OWL named individual corresponding to the input argument
 *
 * Arguments:
 *  - iri : IRI or IRI-as-string. If not specified, use <genIRI>
 *
 * Returns:
 * <owlapi.OWLClass>
 */
OWL.prototype.namedIndividual = function (iri) { 
    if (iri == null) {
        iri = this.genIRI();
    }
    if (iri instanceof IRI) {
        return this.getOWLDataFactory().getOWLNamedIndividual(iri);
    }
    else if (typeof iri == 'string') {
        return this.namedIndividual(IRI.create(iri));
    }
    else {        
        return this.namedIndividual(iri.getIRI());
    }
}

// wrapper for calling methods such as
// factory.getOWLSubClassOfAxiom(sub, sup, ...)
// where the number of arguments is variable
OWL.prototype.factoryRequest = function(m, origArgs) {
    var params = [];
    for (var k=0; k<origArgs.length; k++) {
        params.push(javautil.toJava(origArgs[k]));
    }
    return m.apply(this.getOWLDataFactory(), params);
}

/* Function: subClassOf
 *
 * Creates a OWLSubClassOf axiom from a sub-super pair
 *
 * Arguments:
 *  - sub : <owlapi.OWLClassExpression>
 *  - sup : <owlapi.OWLClassExpression>
 *  - anns : (optional) <owlapi.OWLAnnotation> []
 *
 *
 * Returns:
 * <owlapi.OWLAxiom>
 */
OWL.prototype.subClassOf = function () { return this.factoryRequest(this.getOWLDataFactory().getOWLSubClassOfAxiom, arguments) }

/* Function: classAssertion
 *
 * Creates a OWLClassExpression axiom from a class-individual pair
 *
 * Arguments:
 *  - c : <owlapi.OWLClassExpression>
 *  - i : <owlapi.OWLIndividual>
 *  - anns : (optional) <owlapi.OWLAnnotation> []
 *
 *
 * Returns:
 * <owlapi.OWLAxiom>
 */
OWL.prototype.classAssertion = function () { return this.factoryRequest(this.getOWLDataFactory().getOWLClassAssertionAxiom, arguments) }

/* Function: propertyAssertion
 *
 * Creates an OWLObjectPropertyAssertionAxiom or an OWLDataPropertyAssertionAxiom
 *
 * Arguments:
 *  - p : <owlapi.OWLPropertyExpression>
 *  - i : <owlapi.OWLIndividual>, the subject
 *  - j : <owlapi.OWLIndividual>, the object/target
 *  - anns : (optional) <owlapi.OWLAnnotation> []
 *
 *
 * Returns:
 * <owlapi.OWLAxiom>
 */
OWL.prototype.propertyAssertion = function (p,i,j,anns) { 
    if (p instanceof OWLObjectPropertyExpression) {
        return this.factoryRequest(this.getOWLDataFactory().getOWLObjectPropertyAssertionAxiom, arguments) 
    }
    else {
        return this.factoryRequest(this.getOWLDataFactory().getOWLDataPropertyAssertionAxiom, arguments) 
    }
}

/* Function: equivalentClasses
 *
 * Creates a OWLEquivalentClasses axiom from a set of class expression operands
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - x1, x2, ... : <owlapi.OWLClassExpression>
 *
 * TODO: allow annotations
 *
 * Returns:
 * <owlapi.OWLAxiom>
 */
OWL.prototype.equivalentClasses = function() {
    var set = new HashSet();
    for (var k=0; k<arguments.length; k++) {
        set.add(this.ensureClassExpression(arguments[k]));
    }
    return this.getOWLDataFactory().getOWLEquivalentClassesAxiom(set);
}

/* Function: disjointClasses
 *
 * Creates a OWLDisjointClasses axiom from a set of class expressions
 *
 * Arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - x1, x2, ... : <owlapi.OWLClassExpression>
 *
 * TODO: allow annotations
 *
 *
 * Returns:
 * <owlapi.OWLAxiom>
 */
OWL.prototype.disjointClasses = function() {
    var set = new java.util.HashSet();
    for (var k=0; k<arguments.length; k++) {
        set.add(arguments[k]);
    }
    return this.getOWLDataFactory().getOWLDisjointClassesAxiom(set);
};

/* Function: disjointUntion
 *
 * Creates a OWLDisjointUnion  axiom from a class and a set of class expressions
 *
 * Class expression arguments can be varargs style (e.g n arguments) or a single argument
 * whose value is a list
 *
 * Arguments:
 *  - c : <owlapi.OWLClass>
 *  - x1, x2, ... : <owlapi.OWLClassExpression>
 *
 *
 * TODO: allow annotations
 *
 * Returns:
 * OWLAxiom
 */
OWL.prototype.disjointUnion = function(c) {
    var set = new java.util.HashSet();
    var owl = this;
    flattenArgs(arguments,1).forEach(
        function(x) { set.add(owl.ensureClassExpression(x)) }
    );
    return this.getOWLDataFactory().getOWLDisjointUnionAxiom(c, set);
}

function flattenArgs(args, i) {
    if (args[i].length != null) {
        return args[i];
    }
    return args.splice(i);
}

/* Function: annotationAssertion
 *
 * Creates a OWLAnnotationAssertion axiom from a <p,s,v> triple
 *
 * Arguments:
 *  - p : <owlapi.OWLAnnotationProperty>
 *  - s : <owlapi.OWLObject> or IRI or IRI-as-string
 *  - v : value - OWLObject or string
 *  - anns : (optional) <owlapi.OWLAnnotation> []
 *
 *
 * Returns:
 * <owlapi.OWLAxiom>
 */
OWL.prototype.annotationAssertion = function(p,s,v,anns) {
    if (typeof p == 'string') {
        p = IRI.create(p);
    }
    if (p instanceof IRI) {
        p = this.getOWLDataFactory().getOWLAnnotationProperty(p);
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
    if (anns == null) {
        return this.getOWLDataFactory().getOWLAnnotationAssertionAxiom(p,s,v);
    }
    else {
        return this.getOWLDataFactory().getOWLAnnotationAssertionAxiom(p,s,v, javautil.jsArrayToSet(anns));
    }
};

/* Function: labelAssertion
 *
 * Creates a OWLAnnotationAssertion axiom where the property is rdfs:label
 *
 * Arguments:
 *  - s : <owlapi.OWLObject> or IRI or string
 *  - v : value
 *  - anns : (optional) <owlapi.OWLAnnotation> []
 *
 *
 * Returns:
 * <owlapi.OWLAxiom>
 */
OWL.prototype.labelAssertion = function(s,v,anns) {
    return this.annotationAssertion(this.getOWLDataFactory().getOWLAnnotationProperty(org.semanticweb.owlapi.vocab.OWLRDFVocabulary.RDFS_LABEL.getIRI()),
                                    s,v,anns);
};

/* Function: literal
 *
 * Creates a literal
 *
 * TODO: this currently only creates RDFPlainLiterals
 * In future this may DWIM and create the relevant xsd type if the value is a number
 *
 * Arguments:
 *  - v : value; currently assumed to be string
 *  - xsdType : type TODO; not implemented
 *
 *
 * Returns:
 * <owlapi.OWLLiteral>
 */
OWL.prototype.literal = function(v, xsdType) {
    if (typeof v == 'number') {
        owl.warn("NOT IMPLEMENTED: xsd types");
    }
    if (xsdType != null) {
        owl.warn("NOT IMPLEMENTED: xsd types");
    }
    return this.getOWLDataFactory().getOWLLiteral(v, this.getOWLDataFactory().getRDFPlainLiteral());
};



/* Function: genIRI
 *
 * generators next available IRI within the default ID space
 *
 * Warning: Assumes OBO PURLs (todo - change this)
 *
 * Config keys used:
 *  - idspace : e.g. "CL"
 *  - lastId : the lower bound of the ID range (this will be incremented automatically)
 *
 * TODO: improve robustness
 * current implementation starts at lastId, and increments until a "free" slot is available.
 * a free slot is an IRI with no annotation assertions and no logical axioms.
 * For OBO style ontologies there is currently a danger of overwriting merged classes, until
 * IRIs are generated for these.
 *
 * Returns:
 *  IRI string
 */
OWL.prototype.genIRI = function() {
    if (this.config.lastId == null) {
        console.warn("config.lastId not set");
        this.config.lastId = 0;
    }
    this.config.lastId++;
    this.log("generating a new IRI. lastId="+this.config.lastId);
    var localId = java.lang.String.format("%07d", new java.lang.Integer(this.config.lastId));
    var iriStr = "http://purl.obolibrary.org/obo/"+this.config.idspace+"_"+localId;
    var iri = IRI.create(iriStr);
    var isUsed = false;
    var id = this.config.idspace+":"+localId;
    
    if (this.getOntology().getAnnotationAssertionAxioms(iri).size() > 0) {
        isUsed = true;
    }
    else {
        var c = this.getOWLDataFactory().getOWLClass(iri);
        if (this.getOntology().getAxioms(c).size() > 0) {
            isUsed = true;
        }
    }
    if (!isUsed) {
        var aaas = this.getOntology().getAxioms(AxiomType.ANNOTATION_ASSERTION).toArray();
        print("Checking AAAs "+aaas.length+" for "+id);
        for (var k in aaas) {
            var ax = aaas[k];
            var v = ax.getValue();
            if (v.getLiteral != null && v.getLiteral().toString() == iriStr) {
                //print("used in assertion: "+ax);
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


// concatenates array of tokens together, where each token is either a string or translates to a string via getLabel
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
 * (TODO; May be moved to a different package in future)
 * 
 * Parameters:
 *  - genus - the base parent class
 *  - relation - the OWLObjectProperty of the differentiating characteristic
 *  - filler - the OWLClassExpression of the differentiating characteristic
 *  - defaultMap - set of default values (e.g. created_by)
 * 
 * Text definitions:
 *  IAO is assumed. The definition will be of a generic form. You can override
 *  with defaultMap.definition
 * 
 *
 * Returns:
 *  <OWLFrame>
 */
OWL.prototype.generateXP = function(genus, relation, diff, defaultMap) {
    if (defaultMap == null) {
        defaultMap = {};
    }

    var iri = this.genIRI();
    this.log("IRI="+iri);
    var id = iri.toString();
    var label = this.concatLiteral(genus,'of',diff);
    if (defaultMap.label != null) {
        label = defaultMap.label;
    }
    var ex = this.intersectionOf(genus, this.someValuesFrom(relation,diff));
    if (defaultMap.definition == null) {
        defaultMap.definition = this.concatLiteral('a',genus,'that is',relation,'a',diff);
    }

    this.log("EX = "+ex);
    var slotMap = {
        id: id,
        label: label,
        //annotations: {property:has_related_synonym, value: this.concatLiteral(diff,genus)},
        // TODO annotations: m.ann(has_exact_synonym, this.concatLiteral(diff,genus)),
        definition: defaultMap.definition,
        equivalentTo: ex
    };
    this.log("SM = "+slotMap);
    var f = new OWLFrame(this, slotMap);
    f.stamp();
    this.generatedFrames.push(f);
    return f;
}

//OWL.prototype.makeFrames = function() {
//    var gen = this;
//    var aa = Array.prototype.slice.call(arguments, 0);
//    return aa.map(function(args) {return gen.makeFrame.apply(gen,args)});
//}

/* Function: log
 *
 * logs message to console
 *
 * Arguments:
 *  - msg : string
 *
 * TODO - allow level-setting
 */
OWL.prototype.log = function(msg) {
    //console.log(msg);
}

/* Function: warn
 *
 * prints a warning
 *
 * Arguments:
 *  - msg : string
 *
 * TODO - allow level-setting
 */
OWL.prototype.warn = function(msg) {
    console.warn(msg);
}

/* Function: info
 *
 * prints a informational message
 *
 * Arguments:
 *  - msg : string
 *
 * TODO - allow level-setting
 */
OWL.prototype.info = function(msg) {
    console.info(msg);
}


// ---------- END OF OWL.JS ----------- //


/* Namespace: owlapi
 *
 * owl.js makes use of the OWLAPI. For full documentation, consult the
 * owlapi documentation. Minimal documentation on select classes are
 * provided here.
 *
 * About: OWLOntology
 *
 *  a collection of <OWLAxiom>s.
 *  An <OWL> object is a wrapper for an OWLOntology (see <OWL.getOntology>)
 *
 * About: OWLReasoner
 *  used to compute inferences
 *  An <OWL> object holds a single reasoner (see <OWL.getReasoner>)
 *
 * About: OWLReasonerFactory
 *  generates an <owlapi.OWLReasoner>
 *  in <OWL> this can be set using <OWL.setReasonerType>
 * 
 * About: OWLObject
 *  parent class of all OWL objects
 *
 * About: OWLClass
 *  Basic unit of an ontology. Generated using <OWL.class>
 *
 * About: OWLLiteral
 *  E.g. an xsd:string or int. Generated using <OWL.literal>
 *
 * About: OWLAnnotation
 *  A property-value pair associated with any entity or axiom.
 *  Generated using <OWL.annotation>
 *
 * About: OWLClassExpression
 *
 *  OWL allows many kinds of class expressions, including an atomic
 *  <owlapi.OWLClass>, or n-ary expressions such as intersections, or
 *  restrictions such as someValuesFrom.
 * 
 * class expressions can be generated from the following function
 * (list may not be exhaustive)
 *
 * - <OWL.class>
 * - <OWL.someValuesFrom>
 * - <OWL.intersectionOf>
 * - <OWL.unionOf>
 * - ...
 * 
 * About: OWLIndividual
 *  An instance. Can be anonymous or an <owlapi.OWLNamedIndividual>.
 * 
 * About: OWLNamedIndividual
 *  An <owlapi.OWLIndividual> that has an IRI.
 *  Generated using <OWL.namedIndividual>
 * 
 * About: OWLAnnotationAssertion
 *  A non-logical fact about an entity
 *  Generated using <OWL.annotationAssertion>
 *
 * About: OWLPropertyExpression
 *  Represents a <owlapi.OWLProperty> or possibly the inverse of a property.
 * 
 * About: OWLProperty
 *  A predicate in a triple. Can be
 *  - <owlapi.OWLAnnotationProperty>
 *  - <owlapi.OWLObjectProperty>
 *  - <owlapi.OWLDataProperty>
 * 
 * About: OWLAnnotationProperty
 *  Generated using <OWL.annotationProperty>
 *
 * About: OWLObjectProperty
 *  Generated using <OWL.objectProperty>
 *
 * About: OWLDataProperty
 *  Generated using <OWL.dataProperty>
 *
 * About: OWLNamedObject
 *  Any <owlapi.OWLObject> that has an IRI
 *
 * About: OWLAxiom
 *  an OWL axiom (either logical or non-logical)
 *
 *  Logical axioms:
 *   - <OWLSubClassOfAxiom>
 *   - <OWLEquivalentClassesAxiom>
 *   - <OWLDisjointUnionAxiomAxiom>
 *   - ...
 *
 *
 *  Non-Logical axioms:
 *   - <OWLAnnotationAssertionAxiom>
 *
 * About: OWLObjectSomeValuesFrom
 *  A type of <owlapi.OWLClassExpression>
 *  Generated using <OWL.someValuesFrom> with an <owlapi.OWLObjectPropertyExpression> as first arg
 *
 * About: OWLDataSomeValuesFrom
 *  A type of <owlapi.OWLClassExpression>
 *  Generated using <OWL.someValuesFrom> with an <owlapi.OWLDataPropertyExpression> as first arg
 * 
 * About: IRI
 *  A web identifier for an OWL entity. Generated using <getIRI>
 *
 * About: OWLDataFactory
 *  Used to construct OWL objects. owl.js users usually do not need this directly
 *
 *
 * About: OWLManager
 *  Used to construct OWL objects. owl.js users usually do not need this directly
*/
