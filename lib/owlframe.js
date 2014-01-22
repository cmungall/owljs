
importPackage(java.io);
importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.org.semanticweb.owlapi.io);
importPackage(org.semanticweb.owlapi.apibinding);
importPackage(org.semanticweb.elk.owlapi);
importPackage(Packages.owltools.io);
importPackage(Packages.com.google.gson);

var javautil = require("owl/javautil");

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
 * Hint:
 *  for interacting creation of frame objects, use the repl, and use <repl.pp> to display the frame
 * 
 */

/* Function: OWLFrame
 *
 * constructor
 *
 * Arguments:
 *  - owl : An <OWL> object
 *  - obj : either an OWLObject or a slotMap dictionary
 *  - type : (optional) a java class indicating the frame type
 */
var OWLFrame = exports.OWLFrame = function OWLFrame(gen, obj,type) {
    this.owl = gen; // TODO <- this is now just an OWL object, but we call it gen for consistency with old model for now
    this.type = type;
    // translate from an OWLObject (e.g. OWLClass) to a frame
    if (obj instanceof OWLObject) {
        var axioms = gen.getAllAxioms(obj);
        var fmap = this.axiomsToFrameMap(axioms);
        this.slotMap = fmap[this.getKey(obj)];
    }
    else {
        console.log("arg not obj = "+obj);
        this.slotMap = obj;
    }
    if (gen.config.idType != null && gen.config.idType == 'label') {
        if (this.slotMap.id == null) {
            this.slotMap.id = gen.config.idPrefix + obj.label;
        }
    }
    return this;
}

OWLFrame.prototype.getType = function() {
    return this.type;
}

OWLFrame.prototype.isIndividual = function() {
    return this.type != null && this.type == OWLIndividual;
}
OWLFrame.prototype.isObjectProperty = function() {
    return this.type != null && this.type == OWLObjectProperty;
}


// @Deprecated - use javautil
function set2l(s) {
    return javautil.collectionToJsArray(s);
}

OWLFrame.prototype.isFrame = true;

/* Function: flatten
 * 
 * translates:
 *  - annotations: [ann(p1,v1), ann(p2,v2), ..] ==> p1: v1, p2: v2, ..
 *  - subClassOf: [someValuesFrom(p1,v1),someValuesFrom(p2,v2), ..] ==> p1: v1, p2: v2, ..
 *
 * after processing, the key "annotations" is removed from the slotMap;
 * the value of the subClassOf key has processed elements removed
 *
 */
OWLFrame.prototype.flatten = function(opts) { 
    if (this.slotMap.annotations != null) {
        // ensure it is an array
        if (this.slotMap.annotations.push == null) {
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
                if (this.slotMap[pid].push == null) {
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
 *  - id : see <OWL.genIRI>
 *  - dc:creator
 *  - dc:date
 *
 * uses defaultSlotMap in <OWL.config>
 *
 * Returns: string
 */
OWLFrame.prototype.stamp = function() {
    if (this.slotMap.id == null) {
        this.slotMap.id = this.owl.genIRI().toString(); // TODO
    }
    if (this.slotMap.date == null) {
        //this.slotMap.date = '';
    }
    if (this.owl.config.defaultSlotMap != null) {
        for (var k in this.owl.config.defaultSlotMap) {
            if (this.slotMap[k] == null) {
                this.slotMap[k] = this.owl.config.defaultSlotMap[k];
            }
        }
    }
    return this;
};

OWLFrame.prototype.addFrame = function(isReplace) {
    if (isReplace) {
        console.warn("Note: may be dangerous, as owlframe does not yet fully support axiom annotations");
        var frOrig = this.owl.getFrame(this.getOWLObject());
        this.removeAxioms(frOrig.toAxioms());
    }
    this.addAxioms(this.toAxioms());
};

OWLFrame.prototype.getOWLClass = function() {
    var iri = this.getIRI();
    return this.owl.class(iri); // TODO - other types
}

OWLFrame.prototype.getOWLObjectProperty = function() {
    var iri = this.getIRI();
    return this.owl.objectProperty(iri);
}

OWLFrame.prototype.getOWLAnnotationProperty = function() {
    var iri = this.getIRI();
    return this.owl.annotationProperty(iri);
}

OWLFrame.prototype.getOWLIndividual = function() {
    var iri = this.getIRI();
    return this.owl.namedIndividual(iri);
}

OWLFrame.prototype.getOWLObject = function() {
    if (this.isIndividual()) {
        return this.getOWLIndividual();
    }
    if (this.isObjectProperty()) {
        return this.getOWLObjectProperty();
    }
    return this.getOWLClass();
}


OWLFrame.prototype.getIRI = function() {
    this.ensureHasId();
    return this.slotMap.id;
}

OWLFrame.prototype.ensureHasId = function() {
    if (this.slotMap.id == null) {
        this.slotMap.id = this.genIRI().toString();
    }
    return this.slotMap.id;
}

/* Function: toAxioms
 *
 * Generates a list of axioms from the frame object.
 *
 * A frame object is equivalent to a list of axioms about a particular OWLObject
 *
 *
 * Returns: <owlapi.OWLAxiom>[]
 */
OWLFrame.prototype.toAxioms = function() {
    this.ensureHasId();
    var f = this.slotMap;
    var owl = this.owl;
    var id = f.id;
    var obj = this.getOWLObject();
    //print("Generating axioms for frame: "+id);

    // todo - types
    //if (!(obj instanceof OWLClassExpression)) {
    //obj = owl.ensureClassExpression(id);
    //}
    
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
            case 'transitive' :
                if (v) {
                    axioms.push(owl.getOWLDataFactory().getOWLTransitiveObjectPropertyAxiom(obj));
                }
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
                    if (this.isIndividual()) {
                        axioms.push(owl.propertyAssertion(p, obj, v));
                    }
                    else {
                        axioms.push(owl.subClassOf(obj, owl.someValuesFrom(p, owl.ensureClassExpression(v))));
                    }
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

// translates an object to a key that can be used in a lookup table
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
    return this.owl.add(this.toAxioms());
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
 * Purpose: sets slot value
 *
 * Arguments:
 *  - k : slot (an <owlapi.OWLProperty> )
 *  - v : value
 */
OWLFrame.prototype.set = function(p,v) {
    var k = this.getKey(p);
    this.slotMap[k] = v;
    return this;
};

/* Function: add
 *
 * Purpose: add slot values
 *
 * Arguments:
 *  - k : slot (an <owlapi.OWLProperty> )
 *  - v : value
 */
OWLFrame.prototype.add = function(p,v) {
    var k = this.getKey(p);
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

OWLFrame.prototype.get = function(p) {
    var k = this.getKey(p);
    return this.slotMap(k);
};

// experimental - anns only
OWLFrame.prototype.sed = function(sedFunc) {
    anns = this.slotMap.annotations;
    var owl = this.owl;
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
